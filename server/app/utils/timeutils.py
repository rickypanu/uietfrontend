"""Timezone helpers. Everything is stored in UTC; the institution runs on IST."""
import re
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Optional, Tuple
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")
UTC = timezone.utc


def utcnow() -> datetime:
    return datetime.now(UTC)


def as_utc(dt: datetime) -> datetime:
    """Interpret naive datetimes as UTC (what MongoDB stores) and normalise aware ones to UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def to_ist(dt: datetime) -> datetime:
    return as_utc(dt).astimezone(IST)


def to_ist_iso(dt: Optional[datetime]) -> Optional[str]:
    """ISO-8601 string with an explicit +05:30 offset - every browser parses this correctly."""
    return to_ist(dt).isoformat() if dt else None


def parse_client_datetime(value: str) -> datetime:
    """Parse a datetime sent by the client. Naive values are treated as IST. Returns aware UTC."""
    text = (value or "").strip()
    if not text:
        raise ValueError("empty datetime")
    if text.endswith(("Z", "z")):
        text = text[:-1] + "+00:00"
    dt = datetime.fromisoformat(text)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=IST)
    return dt.astimezone(UTC)


def parse_any_datetime(value: Any) -> Optional[datetime]:
    """Best-effort conversion of legacy stored values (datetime / ISO string / epoch) to aware UTC."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return as_utc(value)
    if isinstance(value, (int, float)):
        seconds = value / 1000 if value > 1e12 else value
        return datetime.fromtimestamp(seconds, tz=UTC)
    if isinstance(value, str):
        try:
            return parse_client_datetime(value)
        except ValueError:
            return None
    return None


def ist_day_start_utc(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=IST).astimezone(UTC)


def ist_today_start_utc(now: Optional[datetime] = None) -> datetime:
    return ist_day_start_utc(to_ist(now or utcnow()).date())


def month_bounds_utc(year: int, month: int) -> Tuple[datetime, datetime]:
    """[start, end) of an IST calendar month, expressed in UTC."""
    if not 1 <= month <= 12:
        raise ValueError("month must be between 1 and 12")
    first = date(year, month, 1)
    nxt = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    return ist_day_start_utc(first), ist_day_start_utc(nxt)


def range_bounds_utc(start: date, end: date) -> Tuple[datetime, datetime]:
    """[start 00:00 IST, end+1day 00:00 IST) so that the end date is inclusive."""
    return ist_day_start_utc(start), ist_day_start_utc(end + timedelta(days=1))


_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def parse_iso_date(value: str) -> date:
    if not _DATE_RE.match(value or ""):
        raise ValueError("Use YYYY-MM-DD")
    return date.fromisoformat(value)
