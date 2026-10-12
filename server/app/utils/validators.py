"""Plain-Python validators shared by the Pydantic schemas and the bulk importer."""
import re
from datetime import date, datetime
from typing import Optional

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_ISO_PREFIX = re.compile(r"^(\d{4})-(\d{2})-(\d{2})")


def normalize_phone(value: str) -> str:
    """Strip separators and a +91 / 91 / 0 prefix; must leave exactly 10 digits."""
    cleaned = re.sub(r"[\s\-+()]", "", str(value or ""))
    if len(cleaned) == 12 and cleaned.startswith("91"):
        cleaned = cleaned[2:]
    elif len(cleaned) == 11 and cleaned.startswith("0"):
        cleaned = cleaned[1:]
    if not re.fullmatch(r"\d{10}", cleaned):
        raise ValueError("Phone number must contain exactly 10 digits (after removing +91 / 0 prefix).")
    return cleaned


def validate_six_digit_id(value: str, label: str) -> str:
    value = str(value or "").strip()
    if not re.fullmatch(r"\d{6}", value):
        raise ValueError(f"{label} must be exactly 6 digits.")
    return value


def validate_dob(value: date) -> date:
    today = date.today()
    if value >= today:
        raise ValueError("Date of birth must be in the past.")
    if (today - value).days < 14 * 365:
        raise ValueError("Date of birth looks too recent.")
    if value.year < 1930:
        raise ValueError("Date of birth looks too old.")
    return value


def parse_dob_cell(value) -> Optional[date]:
    """Parse a spreadsheet cell: 2000-05-21, 2000-05-21 00:00:00, 21/05/2000 or 21-05-2000."""
    text = str(value or "").strip()
    if not text:
        return None
    match = _ISO_PREFIX.match(text)
    if match:
        try:
            return date(int(match[1]), int(match[2]), int(match[3]))
        except ValueError:
            return None
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def clean_text(value: str, label: str, max_len: int = 200) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    if not text:
        raise ValueError(f"{label} is required.")
    if len(text) > max_len:
        raise ValueError(f"{label} is too long.")
    return text
