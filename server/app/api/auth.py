from datetime import date

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.security import create_access_token
from app.db.database import approved_students, approved_teachers, pending_students, pending_teachers, rejected_students, rejected_teachers
from app.utils.helpers import norm_id
from app.utils.throttle import LoginThrottle

router = APIRouter(tags=["Auth"])
throttle = LoginThrottle(max_attempts=6, lock_seconds=300)


class StudentLoginRequest(BaseModel):
    roll_no: str
    dob: date


class TeacherLoginRequest(BaseModel):
    employee_id: str
    dob: date


def _account_status_message(pending, rejected, key: str, value: str) -> str:
    """Give a useful hint instead of a bare 'Invalid credentials' for not-yet-approved accounts."""
    if pending.find_one({key: value}):
        return "Your registration is still awaiting admin approval."
    if rejected.find_one({key: value}):
        return "Your registration was rejected. Please contact the administrator."
    return "Invalid credentials"


def _authenticate(kind: str, user_id: str, dob: date, collection, pending, rejected, key: str):
    throttle_key = f"{kind}:{user_id}"
    wait = throttle.seconds_locked(throttle_key)
    if wait:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed attempts. Try again in {wait // 60 + 1} minute(s).",
        )

    user = collection.find_one({key: user_id})
    if not user or str(user.get("dob")) != dob.isoformat():
        throttle.register_failure(throttle_key)
        detail = "Invalid credentials"
        if not user:
            detail = _account_status_message(pending, rejected, key, user_id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

    throttle.reset(throttle_key)
    return user


@router.post("/login/student")
def login_student(data: StudentLoginRequest):
    roll_no = norm_id(data.roll_no)
    student = _authenticate("student", roll_no, data.dob, approved_students, pending_students, rejected_students, "roll_no")
    return {
        "access_token": create_access_token(roll_no, "student"),
        "token_type": "bearer",
        "role": "student",
        "user_id": roll_no,
        "full_name": student.get("full_name", ""),
    }


@router.post("/login/teacher")
def login_teacher(data: TeacherLoginRequest):
    employee_id = norm_id(data.employee_id)
    teacher = _authenticate("teacher", employee_id, data.dob, approved_teachers, pending_teachers, rejected_teachers, "employee_id")
    return {
        "access_token": create_access_token(employee_id, "teacher"),
        "token_type": "bearer",
        "role": "teacher",
        "user_id": employee_id,
        "full_name": teacher.get("full_name", ""),
    }
