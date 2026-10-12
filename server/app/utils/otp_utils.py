import secrets

# No 0/O/1/I/L so OTPs are easy to read off a projector and type on a phone.
OTP_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
OTP_LENGTH = 6


def generate_otp(length: int = OTP_LENGTH) -> str:
    """Cryptographically secure OTP (``random`` is predictable and must not be used for this)."""
    return "".join(secrets.choice(OTP_ALPHABET) for _ in range(length))


def normalize_otp(value: str) -> str:
    return (value or "").strip().upper()
