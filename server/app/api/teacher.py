from datetime import timedelta
from typing import Literal, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field

from app.core.security import current_teacher, own_teacher
from app.core.subjects import is_valid_class, normalize_branch, normalize_course, subjects_for
from app.db.database import approved_teachers, attendance, notifications, otps
from app.utils.helpers import norm_id
from app.utils.otp_utils import generate_otp
from app.utils.timeutils import (
    ist_today_start_utc, parse_any_datetime, parse_client_datetime, to_ist_iso, utcnow,
)
from app.utils.uploads import delete_attachment, read_photo, save_attachment

router = APIRouter(prefix="/teacher", tags=["Teacher"])


class GenerateOtpRequest(BaseModel):
    course: str
    branch: str
    semester: int
    section: Optional[str] = None
    subject: str
    duration_minutes: int = Field(ge=1, le=240)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    mode: Literal["otp", "qr"] = "qr"


def serialize_otp(o: dict, now=None) -> dict:
    now = now or utcnow()
    end = parse_any_datetime(o.get("end_time"))
    return {
        "id": str(o["_id"]),
        "otp": o["otp"],
        "course": o.get("course", ""),
        "branch": o.get("branch", ""),
        "semester": o.get("semester", ""),
        "section": o.get("section") or "",
        "subject": o.get("subject", ""),
        "mode": o.get("mode", "otp"),
        "start_time": to_ist_iso(parse_any_datetime(o.get("start_time"))),
        "end_time": to_ist_iso(end),
        "is_active": bool(end and end >= now),
    }


def _unique_otp() -> str:
    """The OTP doubles as the lookup key for attendance, so it must be unique across all history."""
    for _ in range(25):
        code = generate_otp()
        if not otps.find_one({"otp": code}, {"_id": 1}):
            return code
    raise HTTPException(503, "Could not allocate a unique OTP. Please try again.")


@router.post("/generate-otp", status_code=201)
def generate_otp_route(data: GenerateOtpRequest, employee_id: str = Depends(current_teacher)):
    course, branch = normalize_course(data.course), normalize_branch(data.branch)
    if data.subject not in subjects_for(course, branch, data.semester):
        raise HTTPException(400, "This subject is not part of the selected course / branch / semester.")
    if not approved_teachers.find_one({"employee_id": employee_id}, {"_id": 1}):
        raise HTTPException(404, "Teacher not found")

    now = utcnow()
    doc = {
        "otp": _unique_otp(),
        "teacher_id": employee_id,
        "course": course,
        "branch": branch,
        "semester": str(data.semester),
        "section": (data.section or "").strip().upper() or None,
        "subject": data.subject,
        "start_time": now,
        "end_time": now + timedelta(minutes=data.duration_minutes),
        "location": {"lat": data.lat, "lng": data.lng},
        "mode": data.mode,
    }
    otps.insert_one(doc)
    return serialize_otp(doc, now)


@router.get("/active-otps/{employee_id}")
def get_active_otps(employee_id: str = Depends(own_teacher)):
    now = utcnow()
    docs = otps.find({"teacher_id": employee_id, "end_time": {"$gte": now}}).sort("start_time", -1)
    return [serialize_otp(o, now) for o in docs]


@router.get("/todays-otps/{employee_id}")
def get_todays_otps(employee_id: str = Depends(own_teacher)):
    now = utcnow()
    docs = otps.find({"teacher_id": employee_id, "start_time": {"$gte": ist_today_start_utc(now)}}).sort("start_time", -1)
    return [serialize_otp(o, now) for o in docs]


@router.get("/view-attendance/{employee_id}")
def view_attendance(employee_id: str = Depends(own_teacher), days: int = Query(1, ge=1, le=366)):
    """Attendance marked for this teacher's OTPs over the last ``days`` IST days (default: today only).

    The dashboard polls this every few seconds, so it must not return the teacher's whole history.
    """
    since = ist_today_start_utc() - timedelta(days=days - 1)
    codes = [o["otp"] for o in otps.find({"teacher_id": employee_id, "start_time": {"$gte": since}}, {"otp": 1})]
    if not codes:
        return []
    records = attendance.find({"otp": {"$in": codes}}).sort("marked_at", 1)
    return [
        {
            "student_name": r.get("student_name"),
            "roll_no": r.get("roll_no"),
            "subject": r.get("subject"),
            "branch": r.get("branch"),
            "section": r.get("section"),
            "marked_at": to_ist_iso(parse_any_datetime(r.get("marked_at"))),
            "otp": r.get("otp"),
        }
        for r in records
    ]


# --------------------------------------------------------------------------- profile
@router.get("/profile/{employee_id}")
def get_teacher_profile(employee_id: str = Depends(own_teacher)):
    teacher = approved_teachers.find_one({"employee_id": employee_id})
    if not teacher:
        raise HTTPException(404, "Teacher not found")
    return {k: teacher.get(k) for k in ("full_name", "email", "phone", "dob", "gender", "address", "employee_id", "subject", "photo", "photo_type")}


@router.post("/profile/upload-photo/{employee_id}")
async def upload_teacher_photo(employee_id: str = Depends(own_teacher), file: UploadFile = File(...)):
    photo, content_type = await read_photo(file)
    result = approved_teachers.update_one({"employee_id": employee_id}, {"$set": {"photo": photo, "photo_type": content_type}})
    if not result.matched_count:
        raise HTTPException(404, "Teacher not found")
    return {"message": "Photo updated"}


# --------------------------------------------------------------------------- notifications
def serialize_notification(n: dict) -> dict:
    expiry = parse_any_datetime(n.get("expiry_time"))
    return {
        "id": str(n["_id"]),
        "message": n.get("message", ""),
        "course": n.get("target_course", ""),
        "branch": n.get("target_branch", ""),
        "section": n.get("target_section", ""),
        "semester": n.get("target_semester", ""),
        "timestamp": to_ist_iso(parse_any_datetime(n.get("timestamp"))),
        "expiry_time": to_ist_iso(expiry),
        "expired": bool(expiry and expiry <= utcnow()),
        "file_url": n.get("file_url"),
        "file_name": n.get("file_name"),
    }


@router.post("/send-notification", status_code=201)
async def send_notification(
    message: str = Form(...),
    course: str = Form(...),
    branch: str = Form(...),
    section: str = Form(...),
    semester: str = Form(...),
    expiry_time: str = Form(...),
    file: Optional[UploadFile] = File(None),
    employee_id: str = Depends(current_teacher),
):
    message = message.strip()
    if not message or len(message) > 2000:
        raise HTTPException(400, "Message is required (max 2000 characters).")
    if not is_valid_class(course, branch, semester):
        raise HTTPException(400, "Invalid course / branch / semester.")
    try:
        expiry = parse_client_datetime(expiry_time)
    except ValueError:
        raise HTTPException(400, "Invalid expiry time.")
    if expiry <= utcnow():
        raise HTTPException(400, "Expiry time must be in the future.")

    file_url = file_name = None
    if file is not None and file.filename:
        file_url, file_name = await save_attachment(file)

    notifications.insert_one({
        "sender_id": employee_id,
        "message": message,
        "file_url": file_url,
        "file_name": file_name,
        "target_course": normalize_course(course),
        "target_branch": normalize_branch(branch),
        "target_section": section.strip().upper(),
        "target_semester": str(semester).strip(),
        "timestamp": utcnow(),
        "expiry_time": expiry,
    })
    return {"message": "Notification sent"}


@router.get("/notifications/{employee_id}")
def get_sent_notifications(employee_id: str = Depends(own_teacher)):
    cursor = notifications.find({"sender_id": employee_id}).sort("timestamp", -1).limit(200)
    return [serialize_notification(n) for n in cursor]


@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: str, employee_id: str = Depends(current_teacher)):
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(400, "Invalid notification id")
    notif = notifications.find_one({"_id": ObjectId(notification_id), "sender_id": norm_id(employee_id)})
    if not notif:
        raise HTTPException(404, "Notification not found")
    delete_attachment(notif.get("file_url"))
    notifications.delete_one({"_id": notif["_id"]})
    return {"message": "Notification deleted"}
