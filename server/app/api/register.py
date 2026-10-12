from fastapi import APIRouter, HTTPException

from app.db.database import (
    approved_students, approved_teachers, pending_students, pending_teachers,
    rejected_students, rejected_teachers,
)
from app.schemas.student import StudentRegister
from app.schemas.teacher import TeacherRegister
from app.utils.helpers import ci

router = APIRouter(tags=["Registration"])

STUDENT_COLLECTIONS = [(pending_students, "pending"), (approved_students, "approved"), (rejected_students, "rejected")]
TEACHER_COLLECTIONS = [(pending_teachers, "pending"), (approved_teachers, "approved"), (rejected_teachers, "rejected")]

LABELS = {"roll_no": "roll number", "employee_id": "employee ID", "phone": "phone number", "email": "email address"}


def find_duplicate(field: str, value: str, collections):
    """Return the status ('pending'/'approved'/'rejected') of an existing record with this value, else None."""
    query = {field: ci(value)} if field == "email" else {field: value}
    for collection, status in collections:
        if collection.find_one(query, {"_id": 1}):
            return status
    return None


def reject_if_duplicate(data: dict, fields, collections) -> None:
    for field in fields:
        status = find_duplicate(field, data[field], collections)
        label = LABELS[field]
        if status == "pending":
            raise HTTPException(400, f"A registration with this {label} is already pending. Please wait for verification.")
        if status == "approved":
            raise HTTPException(400, f"This {label} is already registered. Please log in instead.")
        if status == "rejected":
            raise HTTPException(400, f"A registration with this {label} was previously rejected. Please contact the administrator.")


@router.post("/register/student", status_code=201)
def register_student(student: StudentRegister):
    data = student.model_dump()
    data["dob"] = data["dob"].isoformat()
    reject_if_duplicate(data, ("roll_no", "phone", "email"), STUDENT_COLLECTIONS)
    pending_students.insert_one(data)
    return {"message": f"Registration submitted for {data['full_name']} (Roll No: {data['roll_no']}). Please wait for admin approval."}


@router.post("/register/teacher", status_code=201)
def register_teacher(teacher: TeacherRegister):
    data = teacher.model_dump()
    data["dob"] = data["dob"].isoformat()
    reject_if_duplicate(data, ("employee_id", "phone", "email"), TEACHER_COLLECTIONS)
    pending_teachers.insert_one(data)
    return {"message": f"Registration submitted for {data['full_name']} (Employee ID: {data['employee_id']}). Please wait for admin approval."}
