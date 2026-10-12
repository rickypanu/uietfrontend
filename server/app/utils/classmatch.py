"""Class-membership rules, kept free of DB / web dependencies so they are easy to unit test."""


def _norm(value) -> str:
    return str(value if value is not None else "").strip().upper()


def _norm_semester(value) -> str:
    try:
        return str(int(value))
    except (TypeError, ValueError):
        return _norm(value)


def student_matches_otp(student: dict, otp: dict) -> bool:
    """True if the student belongs to the class the OTP was generated for.

    Course and section are only enforced when the OTP carries them - older OTPs were created
    without a section (and with a raw course string), and must keep working.
    """
    if _norm(student.get("branch")) != _norm(otp.get("branch")):
        return False
    if _norm_semester(student.get("semester")) != _norm_semester(otp.get("semester")):
        return False
    if otp.get("course") and _norm(student.get("course")) != _norm(otp.get("course")):
        return False
    if otp.get("section") and _norm(student.get("section")) != _norm(otp.get("section")):
        return False
    return True


def otp_matches_class(otp: dict, class_doc: dict) -> bool:
    """True if an OTP document was generated for the given class document (used by the class register)."""
    if _norm(otp.get("subject")) != _norm(class_doc.get("subject")):
        return False
    if _norm(otp.get("branch")) != _norm(class_doc.get("branch")):
        return False
    if _norm_semester(otp.get("semester")) != _norm_semester(class_doc.get("semester")):
        return False
    if otp.get("course") and _norm(otp.get("course")) != _norm(class_doc.get("course")):
        return False
    if otp.get("section") and _norm(otp.get("section")) != _norm(class_doc.get("section")):
        return False
    return True
