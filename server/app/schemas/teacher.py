from datetime import date

from pydantic import BaseModel, EmailStr, field_validator

from app.utils import validators as v


class TeacherRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    dob: date
    gender: str
    address: str
    employee_id: str
    subject: str

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
        mapping = {"male": "Male", "female": "Female", "other": "Other"}
        if key not in mapping:
            raise ValueError("Gender must be Male, Female or Other.")
        return mapping[key]

    @field_validator("address")
    @classmethod
    def _address(cls, value: str) -> str:
        return v.clean_text(value, "Address", 300)

    @field_validator("employee_id")
    @classmethod
    def _employee_id(cls, value: str) -> str:
        return v.validate_six_digit_id(value, "Employee ID")

    @field_validator("subject")
    @classmethod
    def _subject(cls, value: str) -> str:
        return v.clean_text(value, "Subject", 150)
