import re
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.security import current_admin
from app.core.subjects import normalize_branch, normalize_course
from app.db.database import admin_notifications
from app.utils.helpers import norm_id
from app.utils.timeutils import parse_any_datetime, parse_client_datetime, to_ist_iso, utcnow
from app.utils.uploads import delete_attachment, save_attachment

router = APIRouter(prefix="/admin", tags=["Admin Notifications"])

CATEGORIES = ["General Notice", "Fee Reminder", "Exam/Timetable Update", "Event / Holiday Notice", "Emergency Alert"]
TARGET_TYPES = ("all", "class", "individual")


def serialize(n: dict) -> dict:
    expiry = parse_any_datetime(n.get("expiry_time"))
    return {
        "id": str(n["_id"]),
        "message": n.get("message", ""),
        "category": n.get("category", ""),
        "target_type": n.get("target_type", "all"),
        "course": n.get("course", ""),
        "branch": n.get("branch", ""),
        "section": n.get("section", ""),
        "semester": n.get("semester", ""),
        "roll_numbers": n.get("roll_numbers", []),
        "expiry_time": to_ist_iso(expiry),
        "expired": bool(expiry and expiry <= utcnow()),
        "created_at": to_ist_iso(parse_any_datetime(n.get("created_at"))),
        "file_url": n.get("file_url"),
        "file_name": n.get("file_name"),
    }


@router.post("/send-notification", status_code=201)
async def send_notification(
    message: str = Form(...),
    category: str = Form(...),
    target_type: str = Form(...),
    expiry_time: str = Form(...),
    course: str = Form(""),
    branch: str = Form(""),
    section: str = Form(""),
    semester: str = Form(""),
    roll_numbers: str = Form(""),
    file: Optional[UploadFile] = File(None),
    admin_id: str = Depends(current_admin),
):
    message = message.strip()
    if not message or len(message) > 2000:
        raise HTTPException(400, "Message is required (max 2000 characters).")
    if category not in CATEGORIES:
        raise HTTPException(400, "Invalid category.")
    if target_type not in TARGET_TYPES:
        raise HTTPException(400, "Invalid target type.")
    try:
        expiry = parse_client_datetime(expiry_time)
    except ValueError:
        raise HTTPException(400, "Invalid expiry time.")
    if expiry <= utcnow():
        raise HTTPException(400, "Expiry time must be in the future.")

    doc = {
        "admin_id": norm_id(admin_id), "message": message, "category": category, "target_type": target_type,
        "course": "", "branch": "", "section": "", "semester": "", "roll_numbers": [],
        "expiry_time": expiry, "created_at": utcnow(), "file_url": None, "file_name": None,
    }

    if target_type == "class":
        if not (course and branch and section and semester):
            raise HTTPException(400, "Course, branch, section and semester are required for a class notification.")
        doc.update(course=normalize_course(course), branch=normalize_branch(branch), section=section.strip().upper(), semester=str(semester).strip())
    elif target_type == "individual":
        rolls = sorted({r.strip().upper() for r in re.split(r"[,\s]+", roll_numbers) if r.strip()})
        if not rolls:
            raise HTTPException(400, "Enter at least one roll number.")
        bad = [r for r in rolls if not re.fullmatch(r"\d{6}", r)]
        if bad:
            raise HTTPException(400, f"Invalid roll number(s): {', '.join(bad[:5])}")
        doc["roll_numbers"] = rolls

    if file is not None and file.filename:
        doc["file_url"], doc["file_name"] = await save_attachment(file)

    result = admin_notifications.insert_one(doc)
    return {"message": "Notification sent", "id": str(result.inserted_id)}


@router.get("/notifications")
def list_notifications(admin_id: str = Depends(current_admin)):
    cursor = admin_notifications.find({"admin_id": norm_id(admin_id)}).sort("created_at", -1).limit(200)
    return [serialize(n) for n in cursor]


@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: str, admin_id: str = Depends(current_admin)):
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(400, "Invalid notification id")
    notif = admin_notifications.find_one({"_id": ObjectId(notification_id), "admin_id": norm_id(admin_id)})
    if not notif:
        raise HTTPException(404, "Notification not found")
    delete_attachment(notif.get("file_url"))
    admin_notifications.delete_one({"_id": notif["_id"]})
    return {"message": "Notification deleted"}
