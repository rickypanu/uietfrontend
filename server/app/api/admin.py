import hashlib
import hmac
import logging
import secrets
from datetime import timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from pymongo.errors import DuplicateKeyError

from app.core import config
from app.core.email_utils import send_email, send_email_safe
from app.core.security import create_access_token, current_admin
from app.db.database import (
    admin_notifications, admin_otps, approved_students, approved_teachers, pending_students,
    pending_teachers, rejected_students, rejected_teachers,
)
from app.utils.helpers import ci, norm_id
from app.utils.throttle import LoginThrottle
from app.utils.timeutils import as_utc, utcnow

log = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/admin", tags=["Admin"])

OTP_TTL_MINUTES = 5
MAX_OTP_ATTEMPTS = 5
login_throttle = LoginThrottle(max_attempts=6, lock_seconds=300)


class AdminLogin(BaseModel):
    user_id: str
    password: str


class OtpVerify(BaseModel):
    user_id: str
    otp: str


def _same(a: str, b: str) -> bool:
    return hmac.compare_digest((a or "").encode(), (b or "").encode())


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(f"{config.SECRET_KEY}:{otp}".encode()).hexdigest()


def _check_admin_credentials(data: AdminLogin) -> str:
    admin_id = norm_id(data.user_id)
    wait = login_throttle.seconds_locked(admin_id)
    if wait:
        raise HTTPException(429, f"Too many failed attempts. Try again in {wait // 60 + 1} minute(s).")
    if not (_same(admin_id, norm_id(config.ADMIN_ID)) and _same(data.password, config.ADMIN_PASSWORD)):
        login_throttle.register_failure(admin_id)
        raise HTTPException(401, "Invalid admin credentials")
    return admin_id


@router.post("/request-otp")
def admin_request_otp(data: AdminLogin):
    """Step 1: verify id + password, then e-mail a one-time code to the admin address."""
    admin_id = _check_admin_credentials(data)

    otp = f"{secrets.randbelow(1_000_000):06d}"
    admin_otps.replace_one(
        {"_id": admin_id},
        {"_id": admin_id, "otp_hash": _hash_otp(otp), "expires": utcnow() + timedelta(minutes=OTP_TTL_MINUTES), "attempts": 0},
        upsert=True,
    )

    message = (
        "Hello Admin,\n\n"
        f"Your one-time code for the UIET Attendance admin dashboard is: {otp}\n"
        f"It is valid for {OTP_TTL_MINUTES} minutes.\n\n"
        "If you did not request this, please change the admin password immediately.\n"
    )
    try:
        send_email(config.ADMIN_EMAIL, "Your Admin Login OTP", message)
    except Exception as exc:  # noqa: BLE001
        log.error("Could not send admin OTP email: %s", exc)
        admin_otps.delete_one({"_id": admin_id})
        raise HTTPException(502, "Could not send the OTP email. Check the Brevo settings on the server.")
    return {"message": "OTP sent to the admin email address"}


@router.post("/verify-otp")
def admin_verify_otp(data: OtpVerify):
    """Step 2: exchange the e-mailed code for an access token."""
    admin_id = norm_id(data.user_id)
    record = admin_otps.find_one({"_id": admin_id})
    if not record:
        raise HTTPException(400, "No OTP requested. Please start again.")
    if utcnow() > as_utc(record["expires"]):
        admin_otps.delete_one({"_id": admin_id})
        raise HTTPException(400, "OTP expired. Please request a new one.")

    if not _same(record["otp_hash"], _hash_otp((data.otp or "").strip())):
        attempts = record.get("attempts", 0) + 1
        if attempts >= MAX_OTP_ATTEMPTS:
            admin_otps.delete_one({"_id": admin_id})
            raise HTTPException(400, "Too many wrong attempts. Please request a new OTP.")
        admin_otps.update_one({"_id": admin_id}, {"$set": {"attempts": attempts}})
        raise HTTPException(400, f"Invalid OTP ({MAX_OTP_ATTEMPTS - attempts} attempt(s) left)")

    admin_otps.delete_one({"_id": admin_id})  # single use
    login_throttle.reset(admin_id)
    return {"access_token": create_access_token(admin_id, "admin"), "token_type": "bearer", "role": "admin", "user_id": admin_id}


# --------------------------------------------------------------------------- approvals
KINDS = {
    "student": {"pending": pending_students, "approved": approved_students, "rejected": rejected_students, "key": "roll_no", "label": "Student"},
    "teacher": {"pending": pending_teachers, "approved": approved_teachers, "rejected": rejected_teachers, "key": "employee_id", "label": "Teacher"},
}

APPROVE_MAIL = (
    "Dear {name},\n\n"
    "Your {role} account on the UIET Attendance System has been approved.\n"
    "You can now log in using your {id_label} and date of birth.\n\n"
    "Best regards,\nUIET Attendance Team\n"
)
REJECT_MAIL = (
    "Dear {name},\n\n"
    "Thank you for registering on the UIET Attendance System. Unfortunately your {role} registration "
    "could not be approved because of discrepancies found during verification.\n"
    "If you believe this is a mistake, please contact the administration office.\n\n"
    "Best regards,\nUIET Attendance Team\n"
)


def _move(kind: str, user_id: str, target: str, background: BackgroundTasks) -> dict:
    cfg = KINDS[kind]
    key = cfg["key"]
    user_id = norm_id(user_id)
    doc = cfg["pending"].find_one({key: ci(user_id)})
    if not doc:
        raise HTTPException(404, f"{cfg['label']} not found in the pending list")

    try:
        cfg[target].insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(409, f"A {kind} with this ID already exists in the {target} list")
    cfg["pending"].delete_one({"_id": doc["_id"]})  # by _id: the case-insensitive lookup above may differ in case

    template = APPROVE_MAIL if target == "approved" else REJECT_MAIL
    subject = f"Your {cfg['label']} Account Has Been {'Approved' if target == 'approved' else 'Reviewed'}"
    if doc.get("email"):
        background.add_task(
            send_email_safe, doc["email"], subject,
            template.format(name=doc.get("full_name", ""), role=kind, id_label="Roll Number" if kind == "student" else "Employee ID"),
        )
    return {"message": f"{cfg['label']} {target}", "user_id": doc.get(key)}


@router.post("/approve/student/{roll_no}")
def approve_student(roll_no: str, background: BackgroundTasks, _: str = Depends(current_admin)):
    return _move("student", roll_no, "approved", background)


@router.post("/reject/student/{roll_no}")
def reject_student(roll_no: str, background: BackgroundTasks, _: str = Depends(current_admin)):
    return _move("student", roll_no, "rejected", background)


@router.post("/approve/teacher/{employee_id}")
def approve_teacher(employee_id: str, background: BackgroundTasks, _: str = Depends(current_admin)):
    return _move("teacher", employee_id, "approved", background)


@router.post("/reject/teacher/{employee_id}")
def reject_teacher(employee_id: str, background: BackgroundTasks, _: str = Depends(current_admin)):
    return _move("teacher", employee_id, "rejected", background)


# --------------------------------------------------------------------------- lists
@router.get("/list/{status}/{kind}")
def list_users(status: str, kind: str, _: str = Depends(current_admin)):
    """e.g. /admin/list/pending/students. Photos are excluded - they are large and not needed in a table."""
    singular = kind[:-1] if kind.endswith("s") else kind
    if status not in ("pending", "approved", "rejected") or singular not in KINDS:
        raise HTTPException(404, "Unknown list")
    return list(KINDS[singular][status].find({}, {"_id": 0, "photo": 0, "photo_type": 0}))


@router.get("/stats")
def stats(_: str = Depends(current_admin)):
    out = {}
    for kind, cfg in KINDS.items():
        out[kind + "s"] = {state: cfg[state].count_documents({}) for state in ("pending", "approved", "rejected")}
    out["notifications"] = admin_notifications.count_documents({})
    return out
