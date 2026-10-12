"""Application settings, read from environment variables (or a .env file).

Nothing here crashes on import - call ``validate_settings()`` at startup instead
(see main.py) so a missing variable produces one clear error message.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[2]  # .../server


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


def _list(name: str, default: str) -> list:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


# --- Auth -------------------------------------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
USER_TOKEN_EXPIRE_MINUTES = _int("USER_TOKEN_EXPIRE_MINUTES", 12 * 60)
ADMIN_TOKEN_EXPIRE_MINUTES = _int("ADMIN_TOKEN_EXPIRE_MINUTES", 60)

ADMIN_ID = os.getenv("ADMIN_ID")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

# --- Database ---------------------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "uietattendance")

# --- Email (Brevo transactional API, sent over HTTPS so it works where SMTP ports are blocked) ---
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")  # must be a verified sender in Brevo
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "UIET Attendance")
BREVO_API_URL = os.getenv("BREVO_API_URL", "https://api.brevo.com/v3/smtp/email")

# --- Web --------------------------------------------------------------------
# Comma separated list of allowed browser origins, e.g. "https://app.example.com,http://localhost:5173"
CORS_ORIGINS = _list("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173")

# --- Attendance rules -------------------------------------------------------
MAX_DISTANCE_METERS = _int("MAX_DISTANCE_METERS", 100)
DEVICE_LOCK_MINUTES = _int("DEVICE_LOCK_MINUTES", 50)

# --- Uploads ----------------------------------------------------------------
UPLOAD_DIR = BASE_DIR / "uploads" / "notifications"
MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
MAX_PHOTO_BYTES = 512 * 1024
ALLOWED_ATTACHMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"}


def validate_settings() -> None:
    """Fail fast with a readable message when required configuration is missing."""
    required = ["SECRET_KEY", "MONGO_URI", "ADMIN_ID", "ADMIN_PASSWORD", "ADMIN_EMAIL"]
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise RuntimeError(
            "Missing required environment variables: "
            + ", ".join(missing)
            + ". Copy server/.env.example to server/.env and fill them in."
        )
    if len(SECRET_KEY or "") < 16:
        raise RuntimeError("SECRET_KEY must be at least 16 characters long.")
