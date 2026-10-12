import sys, unittest
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.utils import timeutils as tu, validators as val, helpers as h
from app.utils.classmatch import student_matches_otp, otp_matches_class
from app.utils.files import sniff_image_type
from app.utils.geo import haversine_distance
from app.utils.otp_utils import generate_otp, OTP_ALPHABET
from app.utils.throttle import LoginThrottle
from app.core.subjects import SUBJECTS, is_valid_class, all_subjects


class TimeTests(unittest.TestCase):
    def test_naive_client_time_is_ist(self):
        dt = tu.parse_client_datetime("2026-10-11T10:00")
        self.assertEqual(dt, datetime(2026, 10, 11, 4, 30, tzinfo=timezone.utc))

    def test_z_suffix_and_offset(self):
        self.assertEqual(tu.parse_client_datetime("2026-10-11T04:30:00Z"), tu.parse_client_datetime("2026-10-11T10:00:00+05:30"))

    def test_iso_output_has_offset(self):
        self.assertTrue(tu.to_ist_iso(datetime(2026, 1, 1, 0, 0)).endswith("+05:30"))

    def test_month_bounds_are_ist(self):
        s, e = tu.month_bounds_utc(2026, 12)
        self.assertEqual(s, datetime(2026, 11, 30, 18, 30, tzinfo=timezone.utc))
        self.assertEqual(e, datetime(2026, 12, 31, 18, 30, tzinfo=timezone.utc))

    def test_range_end_inclusive(self):
        s, e = tu.range_bounds_utc(date(2026, 1, 1), date(2026, 1, 1))
        self.assertEqual((e - s).days, 1)

    def test_legacy_values(self):
        self.assertIsNotNone(tu.parse_any_datetime("2026-01-01T10:00"))
        self.assertIsNone(tu.parse_any_datetime("garbage"))
        self.assertIsNotNone(tu.parse_any_datetime(1_700_000_000_000))


class ValidatorTests(unittest.TestCase):
    def test_phone_keeps_numbers_starting_with_91(self):
        self.assertEqual(val.normalize_phone("9123456789"), "9123456789")   # original code broke this
        self.assertEqual(val.normalize_phone("+91 98765-43210"), "9876543210")
        self.assertEqual(val.normalize_phone("09876543210"), "9876543210")
        with self.assertRaises(ValueError):
            val.normalize_phone("12345")

    def test_ids(self):
        self.assertEqual(val.validate_six_digit_id(" 123456 ", "x"), "123456")
        with self.assertRaises(ValueError):
            val.validate_six_digit_id("T001", "x")

    def test_dob_cell(self):
        self.assertEqual(val.parse_dob_cell("2000-05-21 00:00:00"), date(2000, 5, 21))
        self.assertEqual(val.parse_dob_cell("21/05/2000"), date(2000, 5, 21))
        self.assertIsNone(val.parse_dob_cell("nope"))

    def test_dob_rules(self):
        with self.assertRaises(ValueError):
            val.validate_dob(date.today())


class HelperTests(unittest.TestCase):
    def test_ci_escapes_regex(self):
        q = h.ci("Elective-I (Nanobiotech / Microbial Biodiversity)")
        self.assertIn("\\(", q["$regex"])
        import re
        self.assertTrue(re.match(q["$regex"], "elective-i (nanobiotech / microbial biodiversity)", re.I))

    def test_ci_in(self):
        import re
        q = h.ci_in(["Physics", "C++ (Lab)"])
        self.assertTrue(re.match(q["$regex"], "c++ (lab)", re.I))
        self.assertFalse(re.match(q["$regex"], "Physics 2", re.I))

    def test_ext_and_pct(self):
        self.assertEqual(h.safe_extension("../../x.PDF", {".pdf"}), ".pdf")
        self.assertIsNone(h.safe_extension("a.exe", {".pdf"}))
        self.assertEqual(h.percentage(1, 3), 33.3)
        self.assertEqual(h.percentage(0, 0), 0.0)


class ClassMatchTests(unittest.TestCase):
    student = {"course": "BE", "branch": "BioTech", "semester": 5, "section": "a"}

    def test_legacy_otp_without_section(self):
        self.assertTrue(student_matches_otp(self.student, {"branch": "BIOTECH", "semester": "5", "course": "BE"}))

    def test_wrong_branch_sem_section(self):
        self.assertFalse(student_matches_otp(self.student, {"branch": "CSE", "semester": "5"}))
        self.assertFalse(student_matches_otp(self.student, {"branch": "BIOTECH", "semester": "6"}))
        self.assertFalse(student_matches_otp(self.student, {"branch": "BIOTECH", "semester": "5", "section": "B"}))

    def test_otp_matches_class(self):
        c = {"subject": "Physics", "branch": "CSE", "semester": 1, "course": "BE", "section": "A"}
        self.assertTrue(otp_matches_class({"subject": "physics", "branch": "cse", "semester": "1"}, c))
        self.assertFalse(otp_matches_class({"subject": "physics", "branch": "cse", "semester": "1", "section": "B"}, c))


class MiscTests(unittest.TestCase):
    def test_otp(self):
        for _ in range(200):
            o = generate_otp()
            self.assertEqual(len(o), 6)
            self.assertTrue(set(o) <= set(OTP_ALPHABET))

    def test_throttle(self):
        t = LoginThrottle(max_attempts=3, lock_seconds=60)
        for _ in range(3):
            t.register_failure("a", now=100)
        self.assertGreater(t.seconds_locked("a", now=110), 0)
        self.assertEqual(t.seconds_locked("a", now=200), 0)
        self.assertEqual(t.seconds_locked("b", now=110), 0)

    def test_sniff(self):
        self.assertEqual(sniff_image_type(b"\xff\xd8\xff\xe0abc"), "image/jpeg")
        self.assertIsNone(sniff_image_type(b"<script>"))

    def test_geo(self):
        self.assertAlmostEqual(haversine_distance(30.0, 76.0, 30.0, 76.0), 0)
        self.assertTrue(90 < haversine_distance(30.0, 76.0, 30.0, 76.00104) < 110)

    def test_subjects(self):
        self.assertTrue(is_valid_class("be", "biotech", 8))
        self.assertFalse(is_valid_class("ME", "IT", 1))
        self.assertTrue(all(s.strip() for s in all_subjects()))
        self.assertTrue(all(s.strip() for c in SUBJECTS.values() for b in c.values() for l in b.values() for s in l))


class AnalysisMathTests(unittest.TestCase):
    def test_target_math(self):
        # import the pure functions without FastAPI by exec-ing just their source
        import re, math
        src = (Path(__file__).resolve().parents[1] / "app/api/attendance_analysis.py").read_text()
        body = src[src.index("def classes_needed"):src.index('@router.get("/attendance-target')]
        ns = {"math": math, "Optional": __import__("typing").Optional}
        exec(body, ns)
        needed, skip = ns["classes_needed"], ns["classes_skippable"]
        self.assertEqual(needed(10, 20, 75), 20)       # (10+x)/(20+x) >= .75 -> x = 20
        self.assertEqual(needed(15, 20, 75), 0)
        self.assertIsNone(needed(9, 10, 100))           # original divided by zero here
        self.assertEqual(needed(10, 10, 100), 0)
        self.assertEqual(needed(0, 0, 75), 0)
        self.assertEqual(skip(18, 20, 75), 4)           # 18/24 = 75%
        self.assertEqual(skip(10, 20, 75), 0)


if __name__ == "__main__":
    unittest.main()
