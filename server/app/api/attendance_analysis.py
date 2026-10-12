import math
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.subjects import subjects_for
from app.db.database import approved_students, attendance, otps
from app.core.security import own_student
from app.utils.classmatch import student_matches_otp
from app.utils.helpers import ci_in, percentage, semester_values
from app.utils.timeutils import month_bounds_utc, parse_iso_date, range_bounds_utc, to_ist, utcnow

router = APIRouter(tags=["Attendance Analysis"])


def _student_with_subjects(roll_no: str):
    student = approved_students.find_one({"roll_no": roll_no})
    if not student:
        raise HTTPException(404, f"Student {roll_no} not found")
    subjects = subjects_for(student.get("course", ""), student.get("branch", ""), student.get("semester"))
    if not subjects:
        raise HTTPException(400, "Subjects are not defined for this course / branch / semester")
    return student, subjects


def _count_by_subject(student: dict, subjects: List[str], start, end) -> Dict[str, Dict[str, int]]:
    """For each subject: lectures held for the student's class in [start, end) and how many they attended."""
    stats = {name: {"attended": 0, "total": 0} for name in subjects}
    by_lower = {name.lower(): name for name in subjects}

    query = {
        "subject": ci_in(subjects),
        "semester": {"$in": semester_values(student.get("semester"))},
        "start_time": {"$gte": start, "$lt": end},
    }
    code_to_subject = {}
    for o in otps.find(query, {"otp": 1, "subject": 1, "branch": 1, "semester": 1, "course": 1, "section": 1}):
        if not student_matches_otp(student, o):  # same branch / semester / course / (section)
            continue
        name = by_lower.get(str(o["subject"]).strip().lower())
        if name:
            stats[name]["total"] += 1
            code_to_subject[o["otp"]] = name

    if code_to_subject:
        for r in attendance.find({"roll_no": student["roll_no"], "otp": {"$in": list(code_to_subject)}}, {"otp": 1}):
            stats[code_to_subject[r["otp"]]]["attended"] += 1
    return stats


def _with_percentages(stats: Dict[str, Dict[str, int]]) -> Dict[str, dict]:
    return {name: {**s, "percentage": percentage(s["attended"], s["total"])} for name, s in stats.items()}


@router.get("/attendance-analysis/{roll_no}")
def student_attendance_analysis(
    roll_no: str = Depends(own_student),
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    subject: Optional[str] = Query(None, description="Optional subject filter"),
):
    student, subjects = _student_with_subjects(roll_no)

    if subject:
        match = next((s for s in subjects if s.lower() == subject.strip().lower()), None)
        if not match:
            raise HTTPException(400, f"'{subject}' is not in your curriculum")
        subjects = [match]

    start, end = month_bounds_utc(year, month)
    result = _with_percentages(_count_by_subject(student, subjects, start, end))

    total = sum(s["total"] for s in result.values())
    attended = sum(s["attended"] for s in result.values())
    return {
        "roll_no": roll_no,
        "branch": student.get("branch"),
        "semester": student.get("semester"),
        "month": to_ist(start).strftime("%B %Y"),
        "subject_filter": subjects[0] if subject else "All Subjects",
        "curriculum": subjects_for(student.get("course", ""), student.get("branch", ""), student.get("semester")),
        "overall": {"attended": attended, "total": total, "percentage": percentage(attended, total)},
        "subjects": result,
    }


def classes_needed(attended: int, total: int, target: float) -> Optional[int]:
    """Consecutive classes that must be attended to reach ``target`` %. None if impossible (target 100 % but already missed some)."""
    if total == 0:
        return 0 if target <= 100 else None
    if attended * 100 >= target * total:
        return 0
    if target >= 100:
        return None
    return max(0, math.ceil((target * total - 100 * attended) / (100 - target)))


def classes_skippable(attended: int, total: int, target: float) -> int:
    """How many future classes can be missed while staying at or above ``target`` %."""
    if target <= 0:
        return 0
    return max(0, math.floor((100 * attended - target * total) / target))


@router.get("/attendance-target/{roll_no}")
def attendance_target(
    roll_no: str = Depends(own_student),
    subject: str = Query(...),
    target_percentage: float = Query(..., gt=0, le=100),
    from_date: str = Query(..., description="YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="YYYY-MM-DD (default: today)"),
):
    student, subjects = _student_with_subjects(roll_no)
    match = next((s for s in subjects if s.lower() == subject.strip().lower()), None)
    if not match:
        raise HTTPException(400, f"'{subject}' is not in your curriculum")

    try:
        start_day = parse_iso_date(from_date)
        end_day = parse_iso_date(to_date) if to_date else to_ist(utcnow()).date()
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD")
    if start_day > end_day:
        raise HTTPException(400, "from_date cannot be after to_date")

    start, end = range_bounds_utc(start_day, end_day)
    stats = _count_by_subject(student, [match], start, end)[match]
    attended, total = stats["attended"], stats["total"]
    current = percentage(attended, total)

    needed = classes_needed(attended, total, target_percentage)
    skippable = classes_skippable(attended, total, target_percentage) if needed == 0 else 0

    if total == 0:
        message = f"No classes were held for {match} in this period yet."
    elif needed == 0:
        message = f"You already meet {target_percentage:g}% in {match}. You can miss {skippable} more class(es) and stay on target."
    elif needed is None:
        message = f"{target_percentage:g}% is no longer reachable for {match} because you have already missed classes."
    else:
        message = f"Attend the next {needed} class(es) of {match} in a row to reach {target_percentage:g}%."

    return {
        "roll_no": roll_no, "subject": match, "date_range": f"{start_day.isoformat()} to {end_day.isoformat()}",
        "attended": attended, "total": total, "current_percentage": current,
        "target_percentage": target_percentage, "needed_classes": needed, "skippable_classes": skippable,
        "message": message,
    }
