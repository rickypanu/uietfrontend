"""Pure helpers for validating uploaded files."""
from typing import Optional


def sniff_image_type(data: bytes) -> Optional[str]:
    """Identify JPEG/PNG/WEBP by magic bytes (the client-supplied Content-Type is not trusted)."""
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None
