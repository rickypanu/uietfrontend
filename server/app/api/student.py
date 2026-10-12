from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

from app.core import config
from app.core.security import current_student, own_student
from app.core.subjects import is_valid_class, max_semester
from app.db.database import approved_students, approved_teachers, attendance, otps, pending_students
from app.schemas.student import ProfileUpdate
from app.utils import validators as v
from app.utils.classmatch import student_matches_otp
from app.utils.geo import haversine_distance
from app.utils.helpers import ci
from app.utils.otp_utils import normalize_otp
from app.utils.timeutils import as_utc, parse_any_datetime, to_ist_iso, utcnow
from app.utils.uploads import read_photo

router = APIRouter(prefix="/student", tags=["Student"])


class MarkAttendanceRequest(BaseModel):
    otp: str = Field(min_length=4, max_length=12)
    visitorId: str = Field(min_length=3, max_length=200)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    subject: Optional[str] = None  # optional: when given (QR codes include it) it must match the OTP


def _load_student(roll_no: str) -> dict:
    student = approved_students.find_one({"roll_no": roll_no})
    if not student:
        raise HTTPException(404, "Student not found")
    return student


@router.post("/markAttendance")
def mark_attendance(req: MarkAttendanceRequest, roll_no: str = Depends(current_student)):
    student = _load_student(roll_no)

    code = normalize_otp(req.otp)
    otp_doc = otps.find_one({"otp": code})
    if not otp_doc:
        raise HTTPException(404, "Invalid OTP")

    now = utcnow()
    if not (as_utc(otp_doc["start_time"]) <= now <= as_utc(otp_doc["end_time"])):
        raise HTTPException(400, "OTP expired or not active")

    if req.subject and req.subject.strip().lower() != otp_doc["subject"].strip().lower():
        raise HTTPException(400, "Subject does not match the OTP")

    if not student_matches_otp(student, otp_doc):
        raise HTTPException(403, "This OTP was generated for a different class")

    if attendance.find_one({"roll_no": roll_no, "otp": code}, {"_id": 1}):
        raise HTTPException(400, "Attendance already marked")

    location = otp_doc.get("location") or {}
    if "lat" not in location or "lng" not in location:
        raise HTTPException(500, "Teacher location is not available for this OTP")
    distance = haversine_distance(req.lat, req.lng, location["lat"], location["lng"])
    if distance > config.MAX_DISTANCE_METERS:
        raise HTTPException(400, f"Too far from the classroom ({round(distance)} m away, limit {config.MAX_DISTANCE_METERS} m)")

    # Anti-proxy: the same device must not mark attendance for a *different* student in the same subject
    # within the lock window. (The old check also blocked a student's own back-to-back lectures.)
    recent_other = attendance.find_one({
        "visitor_id": req.visitorId,
        "subject": ci(otp_doc["subject"]),
        "roll_no": {"$ne": roll_no},
        "marked_at": {"$gte": now - timedelta(minutes=config.DEVICE_LOCK_MINUTES)},
    }, {"_id": 1})
    if recent_other:
        raise HTTPException(400, "This device was recently used to mark attendance for another student")

    try:
        attendance.insert_one({
            "roll_no": roll_no,
            "student_name": student.get("full_name"),
            "branch": student.get("branch"),
            "section": student.get("section"),
            "subject": otp_doc["subject"],
            "otp": code,
            "visitor_id": req.visitorId,
            "marked_at": now,
            "lat": req.lat,
            "lng": req.lng,
        })
    except DuplicateKeyError:  # double-tap / race: the unique (roll_no, otp) index caught it
        raise HTTPException(400, "Attendance already marked")

    return {"message": "Attendance marked successfully", "subject": otp_doc["subject"]}


@router.get("/check-otp/{otp}")
def check_otp(otp: str, roll_no: str = Depends(current_student)):
    """Live validation while the student types an OTP."""
    student = _load_student(roll_no)
    otp_doc = otps.find_one({"otp": normalize_otp(otp)})
    if not otp_doc:
        raise HTTPException(404, "Invalid OTP")
    now = utcnow()
    teacher = approved_teachers.find_one({"employee_id": otp_doc.get("teacher_id")}, {"full_name": 1})
    return {
        "subject": otp_doc["subject"],
        "teacher_name": teacher.get("full_name") if teacher else None,
        "start_time": to_ist_iso(otp_doc["start_time"]),
        "end_time": to_ist_iso(otp_doc["end_time"]),
        "active": as_utc(otp_doc["start_time"]) <= now <= as_utc(otp_doc["end_time"]),
        "eligible": student_matches_otp(student, otp_doc),
    }


@router.get("/view-attendance/{roll_no}")
def view_attendance(roll_no: str = Depends(own_student), subject: Optional[str] = Query(None)):
    query = {"roll_no": roll_no}
    if subject:
        query["subject"] = ci(subject)
    records = attendance.find(query).sort("marked_at", -1).limit(2000)
    return [
        {"subject": r.get("subject", ""), "marked_at": to_ist_iso(parse_any_datetime(r.get("marked_at")))}
        for r in records
    ]


# --------------------------------------------------------------------------- profile
@router.get("/profile/{roll_no}")
def get_student_profile(roll_no: str = Depends(own_student)):
    student = _load_student(roll_no)
    keys = ("full_name", "email", "phone", "department", "dob", "gender", "address", "course", "branch", "semester", "section", "roll_no", "photo", "photo_type")
    return {k: student.get(k) for k in keys}


@router.patch("/profile/update/{roll_no}")
def update_student_profile(update: ProfileUpdate, roll_no: str = Depends(own_student)):
    student = _load_student(roll_no)
    fields = {}

    try:
        if update.full_name is not None:
            fields["full_name"] = v.clean_text(update.full_name, "Name", 100)
        if update.dob is not None:
            fields["dob"] = v.validate_dob(update.dob).isoformat()
        if update.section is not None:
            section = update.section.strip().upper()
            if not section or len(section) > 2 or not section.isalnum():
                raise ValueError("Section must be 1-2 letters or digits.")
            fields["section"] = section
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    if update.email is not None:
        email = str(update.email).strip().lower()
        taken = approved_students.find_one({"email": ci(email), "roll_no": {"$ne": roll_no}}, {"_id": 1}) \
            or pending_students.find_one({"email": ci(email)}, {"_id": 1})
        if taken:
            raise HTTPException(409, "This email address is already in use")
        fields["email"] = email

    course = student.get("course", "BE")
    new_branch = (update.branch or student.get("branch") or "").strip().upper()
    new_semester = update.semester if update.semester is not None else student.get("semester")
    try:
        new_semester = int(new_semester)  # older records may hold the semester as a string
    except (TypeError, ValueError):
        pass
    if update.branch is not None or update.semester is not None:
        if not isinstance(new_semester, int) or not 1 <= new_semester <= max_semester(course):
            raise HTTPException(400, f"Semester must be between 1 and {max_semester(course)}")
        if not is_valid_class(course, new_branch, new_semester):
            raise HTTPException(400, f"{new_branch} is not offered for {course}")
        if update.branch is not None:
            fields["branch"] = new_branch
        if update.semester is not None:
            fields["semester"] = new_semester

    if not fields:
        raise HTTPException(400, "No valid fields to update")
    approved_students.update_one({"roll_no": roll_no}, {"$set": fields})
    return {"message": "Profile updated successfully"}


@router.post("/profile/upload-photo/{roll_no}")
async def upload_student_photo(roll_no: str = Depends(own_student), file: UploadFile = File(...)):
    photo, content_type = await read_photo(file)
    result = approved_students.update_one({"roll_no": roll_no}, {"$set": {"photo": photo, "photo_type": content_type}})
    if not result.matched_count:
        raise HTTPException(404, "Student not found")
    return {"message": "Photo updated"}
