from fastapi import APIRouter

from app.core.subjects import SUBJECTS, all_subjects

router = APIRouter(tags=["Subjects"])


@router.get("/subjects")
def get_subjects():
    """Full curriculum: {course: {branch: {semester: [subjects]}}}. The client uses this for every dropdown."""
    return SUBJECTS


@router.get("/subjects/all")
def get_all_subjects():
    """Flat list of every subject (for the teacher registration form)."""
    return all_subjects()
