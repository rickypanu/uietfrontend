import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core import config

log = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(_: FastAPI):
    config.validate_settings()
    from app.db.database import ensure_indexes
    ensure_indexes()
    log.info("UIET Attendance API ready")
    yield


app = FastAPI(title="UIET Attendance API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=False,  # tokens travel in the Authorization header, not cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/files/notifications", StaticFiles(directory=str(config.UPLOAD_DIR)), name="notification-files")

from app.api import (  # noqa: E402  (imported after config so a missing .env gives a clear error)
    admin, admin_notifications, attendance_analysis, auth, bulk_register, classes,
    register, student, student_notifications, subjects, teacher,
)

for module in (register, auth, subjects, admin, admin_notifications, bulk_register, teacher, student,
               student_notifications, classes, attendance_analysis):
    app.include_router(module.router)


@app.get("/")
def root():
    return {"message": "UIET Attendance API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
