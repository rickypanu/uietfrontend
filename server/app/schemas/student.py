from datetime import date
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator, model_validator

from app.core.subjects import is_valid_class, max_semester, normalize_branch, normalize_course
from app.utils import validators as v

GENDERS = {"male": "Male", "female": "Female", "other": "Other"}


class StudentRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    dob: date
    gender: str
    address: str
    roll_no: str
    department: str
    course: str
    branch: str
    semester: int
    section: str

    @field_validator("full_name")
    @classmethod
    def _name(cls, value: str) -> str:
        return v.clean_text(value, "Name", 100)

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        return str(value).strip().lower()

    @field_validator("phone")
    @classmethod
    def _phone(cls, value: str) -> str:
        return v.normalize_phone(value)

    @field_validator("dob")
    @classmethod
    def _dob(cls, value: date) -> date:
        return v.validate_dob(value)

    @field_validator("gender")
    @classmethod
    def _gender(cls, value: str) -> str:
        key = (value or "").strip().lower()
        if key not in GENDERS:
            raise ValueError("Gender must be Male, Female or Other.")
        return GENDERS[key]

    @field_validator("address")
    @classmethod
    def _address(cls, value: str) -> str:
        return v.clean_text(value, "Address", 300)

    @field_validator("roll_no")
    @classmethod
    def _roll(cls, value: str) -> str:
        return v.validate_six_digit_id(value, "Roll number")

    @field_validator("department")
    @classmethod
    def _department(cls, value: str) -> str:
        return v.clean_text(value, "Department", 60).upper()

    @field_validator("section")
    @classmethod
    def _section(cls, value: str) -> str:
        text = (value or "").strip().upper()
        if not text or len(text) > 2 or not text.isalnum():
            raise ValueError("Section must be 1-2 letters or digits (e.g. A).")
        return text

    @model_validator(mode="after")
    def _class_combo(self):
        self.course = normalize_course(self.course)
        self.branch = normalize_branch(self.branch)
        if self.course not in ("BE", "ME"):
            raise ValueError("Course must be BE or ME.")
        if not 1 <= self.semester <= max_semester(self.course):
            raise ValueError(f"Semester must be between 1 and {max_semester(self.course)} for {self.course}.")
        if not is_valid_class(self.course, self.branch, self.semester):
            raise ValueError(f"{self.branch} is not offered for {self.course}.")
        return self


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    branch: Optional[str] = None
    section: Optional[str] = None
    semester: Optional[int] = None
    dob: Optional[date] = None
