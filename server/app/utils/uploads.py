"""Saving / removing uploaded files (notification attachments and profile photos)."""
import base64
import logging
from pathlib import Path
from typing import Optional, Tuple

from fastapi import HTTPException, UploadFile

from app.core import config
from app.utils.files import sniff_image_type
from app.utils.helpers import random_filename, safe_extension

log = logging.getLogger("uvicorn.error")
URL_PREFIX = "/files/notifications/"


async def _read_limited(file: UploadFile, max_bytes: int) -> bytes:
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(413, f"File is too large (max {max_bytes // 1024} KB).")
    if not data:
        raise HTTPException(400, "The uploaded file is empty.")
    return data


async def save_attachment(file: UploadFile) -> Tuple[str, str]:
    """Store a notification attachment under a random name. Returns (public_url, original_filename)."""
    extension = safe_extension(file.filename, config.ALLOWED_ATTACHMENT_EXTENSIONS)
    if not extension:
        allowed = ", ".join(sorted(config.ALLOWED_ATTACHMENT_EXTENSIONS))
        raise HTTPException(400, f"Unsupported file type. Allowed: {allowed}")
    data = await _read_limited(file, config.MAX_ATTACHMENT_BYTES)

    config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = random_filename(extension)
    (config.UPLOAD_DIR / name).write_bytes(data)
    return URL_PREFIX + name, Path(file.filename or name).name[:120]


def delete_attachment(file_url: Optional[str]) -> None:
    """Remove a stored attachment. Only files directly inside UPLOAD_DIR can ever be deleted."""
    if not file_url or not file_url.startswith(URL_PREFIX):
        return
    name = Path(file_url[len(URL_PREFIX):]).name  # strips any directory components
    target = config.UPLOAD_DIR / name
    try:
        if target.is_file():
            target.unlink()
    except OSError as exc:  # pragma: no cover
        log.warning("Could not delete %s: %s", target, exc)


async def read_photo(file: UploadFile) -> Tuple[str, str]:
    """Validate a profile photo. Returns (base64_data, content_type)."""
    data = await _read_limited(file, config.MAX_PHOTO_BYTES)
    content_type = sniff_image_type(data)
    if not content_type:
        raise HTTPException(400, "Photo must be a JPEG, PNG or WEBP image.")
    return base64.b64encode(data).decode("ascii"), content_type
