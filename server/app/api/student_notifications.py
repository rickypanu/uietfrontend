from typing import List, Tuple

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import current_student
from app.db.database import admin_notifications, approved_students, approved_teachers, notifications
from app.utils.helpers import ci, semester_values
from app.utils.timeutils import as_utc, parse_any_datetime, to_ist_iso, utcnow

router = APIRouter(prefix="/student", tags=["Student Notifications"])


def _same(a, b) -> bool:
    return str(a or "").strip().upper() == str(b or "").strip().upper()


def _load_student(roll_no: str) -> dict:
    student = approved_students.find_one({"roll_no": roll_no})
    if not student:
        raise HTTPException(404, "Student not found")
    return student


def _active_notifications(student: dict) -> List[Tuple]:
    """Teacher + admin notifications that currently apply to this student, newest first.

    Returns tuples of (timestamp, serialized_dict). Expiry is checked in Python because older
    admin notifications stored the expiry as a plain string.
    """
    now = utcnow()
    roll_no = student["roll_no"]
    branch, section = student.get("branch", ""), student.get("section", "")
    sem_values = semester_values(student.get("semester"))
    course = student.get("course", "")

    teacher_names = {}

    def teacher_name(employee_id: str) -> str:
        if employee_id not in teacher_names:
            doc = approved_teachers.find_one({"employee_id": employee_id}, {"full_name": 1})
            teacher_names[employee_id] = doc.get("full_name") if doc else "Teacher"
        return teacher_names[employee_id]

    items: List[Tuple] = []

    teacher_query = {"target_branch": ci(branch), "target_section": ci(section), "target_semester": {"$in": sem_values}}
    for n in notifications.find(teacher_query):
        expiry = parse_any_datetime(n.get("expiry_time"))
        if not expiry or expiry <= now:
            continue
        if n.get("target_course") and not _same(n["target_course"], course):
            continue
        ts = parse_any_datetime(n.get("timestamp")) or now
        items.append((ts, {
            "id": str(n["_id"]), "source": "teacher", "sender_name": teacher_name(n.get("sender_id", "")),
            "category": None, "message": n.get("message", ""), "file_url": n.get("file_url"), "file_name": n.get("file_name"),
            "timestamp": to_ist_iso(ts), "expiry_time": to_ist_iso(expiry),
        }))

    admin_query = {"$or": [
        {"target_type": "all"},
        {"target_type": "class", "branch": ci(branch), "section": ci(section), "semester": {"$in": sem_values}},
        {"target_type": "individual", "roll_numbers": roll_no},
    ]}
    for n in admin_notifications.find(admin_query):
        expiry = parse_any_datetime(n.get("expiry_time"))
        if not expiry or expiry <= now:
            continue
        if n.get("target_type") == "class" and n.get("course") and not _same(n["course"], course):
            continue
        ts = parse_any_datetime(n.get("created_at")) or now
        items.append((ts, {
            "id": str(n["_id"]), "source": "admin", "sender_name": "Admin",
            "category": n.get("category"), "message": n.get("message", ""), "file_url": n.get("file_url"), "file_name": n.get("file_name"),
            "timestamp": to_ist_iso(ts), "expiry_time": to_ist_iso(expiry),
        }))

    items.sort(key=lambda pair: pair[0], reverse=True)
    return items


@router.get("/notifications")
def get_notifications(roll_no: str = Depends(current_student)):
    student = _load_student(roll_no)
    seen_at = parse_any_datetime(student.get("notifications_seen_at"))
    return [
        {**data, "unread": seen_at is None or ts > seen_at}
        for ts, data in _active_notifications(student)
    ]


@router.get("/notifications/unread-count")
def unread_count(roll_no: str = Depends(current_student)):
    student = _load_student(roll_no)
    seen_at = parse_any_datetime(student.get("notifications_seen_at"))
    count = sum(1 for ts, _ in _active_notifications(student) if seen_at is None or as_utc(ts) > seen_at)
    return {"count": count}


@router.post("/notifications/seen")
def mark_seen(roll_no: str = Depends(current_student)):
    approved_students.update_one({"roll_no": roll_no}, {"$set": {"notifications_seen_at": utcnow()}})
    return {"message": "ok"}
