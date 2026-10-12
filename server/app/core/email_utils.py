"""E-mail via Brevo's transactional API (HTTPS, port 443).

Hosts such as Render block outbound SMTP, so mail is sent with a plain HTTPS request instead.
"""
import json
import logging
import urllib.error
import urllib.request

from app.core import config

log = logging.getLogger("uvicorn.error")


def send_email(to_email: str, subject: str, message: str) -> None:
    """Send a plain-text email. Raises on any failure - use send_email_safe for best-effort mail."""
    if not (config.BREVO_API_KEY and config.BREVO_SENDER_EMAIL):
        raise RuntimeError("Brevo is not configured (BREVO_API_KEY / BREVO_SENDER_EMAIL)")

    payload = {
        "sender": {"name": config.BREVO_SENDER_NAME, "email": config.BREVO_SENDER_EMAIL},
        "to": [{"email": to_email}],
        "subject": subject,
        "textContent": message,
    }
    request = urllib.request.Request(
        config.BREVO_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"api-key": config.BREVO_API_KEY, "content-type": "application/json", "accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:300]
        raise RuntimeError(f"Brevo rejected the email (HTTP {exc.code}): {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Could not reach Brevo: {exc.reason}") from exc


def send_email_safe(to_email: str, subject: str, message: str) -> bool:
    """Best-effort email used for notifications that must never break the request."""
    try:
        send_email(to_email, subject, message)
        return True
    except Exception as exc:  # noqa: BLE001
        log.warning("Email to %s failed: %s", to_email, exc)
        return False
