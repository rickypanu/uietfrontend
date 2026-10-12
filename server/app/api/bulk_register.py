import io
import re
from typing import Dict, List

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import ValidationError

from app.core.config import BASE_DIR
from app.core.security import current_admin
from app.db.database import approved_students, approved_teachers
from app.schemas.student import StudentRegister
from app.schemas.teacher import TeacherRegister
from app.api.register import STUDENT_COLLECTIONS, TEACHER_COLLECTIONS, find_duplicate
from app.utils.validators import parse_dob_cell

router = APIRouter(prefix="/admin", tags=["Admin Bulk Register"])

TEMPLATE_DIR = BASE_DIR / "app" / "static" / "templates"
MAX_ROWS = 2000
MAX_BYTES = 5 * 1024 * 1024
XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.get("/download/student_template")
def download_student_template(_: str = Depends(current_admin)):
    return FileResponse(TEMPLATE_DIR / "students_template.xlsx", filename="students_template.xlsx", media_type=XLSX)


@router.get("/download/teacher_template")
def download_teacher_template(_: str = Depends(current_admin)):
    return FileResponse(TEMPLATE_DIR / "teachers_template.xlsx", filename="teachers_template.xlsx", media_type=XLSX)


async def read_rows(file: UploadFile) -> List[Dict[str, str]]:
    """Read .xlsx/.xls/.csv into a list of {column: text} dicts. Everything is read as text so
    roll numbers / phone numbers are never turned into floats or numpy ints."""
    name = (file.filename or "").lower()
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "File too large (max 5 MB)")
    try:
        if name.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(data), dtype=str)
        elif name.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(data), dtype=str, keep_default_na=False)
        else:
            raise HTTPException(400, "Upload an .xlsx, .xls or .csv file")
    except HTTPException:
        raise
    except Exception:  # noqa: BLE001
        raise HTTPException(400, "Could not read the file. Please use the downloaded template.")

    df = df.fillna("")
    df.columns = [str(c).strip().lower() for c in df.columns]
    if len(df) > MAX_ROWS:
        raise HTTPException(400, f"Too many rows (max {MAX_ROWS})")
    return df.to_dict(orient="records")


def clean_row(row: Dict[str, str]) -> Dict[str, str]:
    """Trim cells, drop Excel float artefacts ('5.0' -> '5'), map name -> full_name and normalise dob."""
    out = {}
    for key, value in row.items():
        text = str(value).strip()
        if re.fullmatch(r"\d+\.0", text):
            text = text[:-2]
        out[key] = text
    if "name" in out and "full_name" not in out:
        out["full_name"] = out.pop("name")
    dob = parse_dob_cell(out.get("dob"))
    out["dob"] = dob.isoformat() if dob else out.get("dob", "")
    return out


def first_error(exc: ValidationError) -> str:
    err = exc.errors()[0]
    field = ".".join(str(p) for p in err.get("loc", ())) or "row"
    return f"{field}: {err.get('msg', 'invalid').removeprefix('Value error, ')}"


def import_rows(rows, schema, id_field, collections, target) -> dict:
    results, registered = [], 0
    seen = set()
    for index, raw in enumerate(rows, start=2):  # row 1 of the sheet is the header
        row = clean_row(raw)
        label = {"row": index, "id": row.get(id_field, ""), "name": row.get("full_name", "")}
        try:
            data = schema.model_validate(row).model_dump()
        except ValidationError as exc:
            results.append({**label, "status": "Failed", "reason": first_error(exc)})
            continue

        problem = None
        for field in (id_field, "phone", "email"):
            value = data[field]
            if (field, value.lower()) in seen:
                problem = f"{field} is duplicated inside the file"
            else:
                status = find_duplicate(field, value, collections)
                if status:
                    problem = f"{field} already exists ({status})"
            if problem:
                break
        if problem:
            results.append({**label, "status": "Failed", "reason": problem})
            continue

        for field in (id_field, "phone", "email"):
            seen.add((field, data[field].lower()))
        data["dob"] = data["dob"].isoformat()
        target.insert_one(data)
        registered += 1
        results.append({**label, "status": "Registered", "reason": ""})

    return {"total": len(results), "registered": registered, "failed": len(results) - registered, "results": results}


@router.post("/register/bulk_students")
async def bulk_register_students(file: UploadFile = File(...), _: str = Depends(current_admin)):
    rows = await read_rows(file)
    return import_rows(rows, StudentRegister, "roll_no", STUDENT_COLLECTIONS, approved_students)


@router.post("/register/bulk_teachers")
async def bulk_register_teachers(file: UploadFile = File(...), _: str = Depends(current_admin)):
    rows = await read_rows(file)
    return import_rows(rows, TeacherRegister, "employee_id", TEACHER_COLLECTIONS, approved_teachers)
