import re
import uuid
from pathlib import Path
from typing import Any, Dict, Optional


def ci(value: str) -> Dict[str, Any]:
    """Case-insensitive *exact* match for a Mongo query. The value is regex-escaped."""
    return {"$regex": f"^{re.escape(str(value).strip())}$", "$options": "i"}


def ci_in(values) -> Dict[str, Any]:
    """Case-insensitive match against any of several exact values (all regex-escaped)."""
    cleaned = [re.escape(str(v).strip()) for v in values if str(v).strip()]
    if not cleaned:
        return {"$in": []}
    return {"$regex": "^(?:" + "|".join(cleaned) + ")$", "$options": "i"}


def norm_id(value: str) -> str:
    return (value or "").strip().upper()


def semester_values(semester) -> list:
    """Semester is stored as int for students and str for OTPs/notifications; match either."""
    try:
        return [int(semester), str(int(semester))]
    except (TypeError, ValueError):
        return [str(semester)]


def safe_extension(filename: Optional[str], allowed) -> Optional[str]:
    """Return the lower-case extension if allowed, else None. The original name is never used on disk."""
    ext = Path(filename or "").suffix.lower()
    return ext if ext in allowed else None


def random_filename(extension: str) -> str:
    return f"{uuid.uuid4().hex}{extension}"


def percentage(part: int, whole: int) -> float:
    return round(part * 100 / whole, 1) if whole else 0.0
