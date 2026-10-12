import logging

from pymongo import ASCENDING, MongoClient
from pymongo.errors import PyMongoError

from app.core.config import MONGO_DB_NAME, MONGO_URI

log = logging.getLogger("uvicorn.error")

# tz_aware=True makes every datetime read from MongoDB timezone-aware (UTC).
# Without it pymongo returns naive datetimes and any later .astimezone() call
# silently assumes the *server's* local timezone - a classic source of wrong times.
client = MongoClient(MONGO_URI, tz_aware=True, serverSelectionTimeoutMS=8000)
db = client[MONGO_DB_NAME]

# --- collections -------------------------------------------------------------
pending_students = db["pending_students"]
approved_students = db["approved_students"]
rejected_students = db["rejected_students"]

pending_teachers = db["pending_teachers"]
approved_teachers = db["approved_teachers"]
rejected_teachers = db["rejected_teachers"]

notifications = db["notifications"]                 # teacher -> students
admin_notifications = db["adminnotifications"]      # admin -> students (name kept for existing data)

otps = db["otps"]
attendance = db["attendance"]
classes = db["classes"]
admin_otps = db["admin_otps"]


def ensure_indexes() -> None:
    """Create indexes. Failures (e.g. pre-existing duplicate data) are logged, not fatal."""
    specs = [
        (approved_students, [("roll_no", ASCENDING)], {"unique": True}),
        (approved_teachers, [("employee_id", ASCENDING)], {"unique": True}),
        (pending_students, [("roll_no", ASCENDING)], {}),
        (pending_teachers, [("employee_id", ASCENDING)], {}),
        (otps, [("otp", ASCENDING)], {}),
        (otps, [("teacher_id", ASCENDING), ("start_time", ASCENDING)], {}),
        # one attendance mark per student per OTP - also closes the double-submit race
        (attendance, [("roll_no", ASCENDING), ("otp", ASCENDING)], {"unique": True}),
        (attendance, [("otp", ASCENDING)], {}),
        (classes, [("teacher_id", ASCENDING)], {}),
        (notifications, [("sender_id", ASCENDING)], {}),
        (admin_otps, [("expires", ASCENDING)], {"expireAfterSeconds": 0}),
    ]
    for collection, keys, opts in specs:
        try:
            collection.create_index(keys, **opts)
        except PyMongoError as exc:  # pragma: no cover - depends on live data
            log.warning("Could not create index %s on %s: %s", keys, collection.name, exc)
