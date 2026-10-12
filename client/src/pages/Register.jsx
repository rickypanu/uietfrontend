import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, UserPlus } from "lucide-react";
import api, { errorMessage, fieldErrors } from "../lib/api";
import { BRANCH_LABELS, COURSE_LABELS, useSubjects } from "../lib/subjects";
import { Alert, Button, Card, Field, Input, Segmented, Select, Textarea } from "../components/ui";
import { Logo } from "../components/Brand";

const EMPTY = {
  full_name: "", email: "", phone: "", dob: "", gender: "", address: "",
  roll_no: "", department: "", course: "", branch: "", semester: "", section: "",
  employee_id: "", subject: "",
};

export default function Register() {
  const subjects = useSubjects();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);

  useEffect(() => {
    api.get("/subjects/all").then((r) => setAllSubjects(r.data)).catch(() => {});
  }, []);

  const set = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "course") { next.branch = ""; next.semester = ""; }
      if (name === "branch") { next.semester = ""; if (!prev.department || prev.department === prev.branch) next.department = value; }
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setMessage(null);
  };
  const bind = (name) => ({ value: form[name], onChange: (e) => set(name, e.target.value) });

  const semesters = form.course && form.branch ? subjects.semesters(form.course, form.branch) : [];

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrors({});
    const common = { full_name: form.full_name, email: form.email, phone: form.phone, dob: form.dob, gender: form.gender, address: form.address };
    try {
      if (role === "student") {
        await api.post("/register/student", { ...common, roll_no: form.roll_no, department: form.department, course: form.course, branch: form.branch, semester: Number(form.semester), section: form.section });
      } else {
        await api.post("/register/teacher", { ...common, employee_id: form.employee_id, subject: form.subject });
      }
      setForm(EMPTY);
      setMessage({ tone: "success", text: "Registration submitted! You’ll be able to log in once an administrator approves your account. You’ll get an email when that happens." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      setMessage({ tone: "error", text: Object.keys(fe).length ? "Please fix the highlighted fields." : errorMessage(err, "Registration failed.") });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const err = (name) => errors[name];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl animate-fade-up">
        <div className="mb-6 flex justify-center"><Logo size="lg" /></div>
        <Card className="p-6 shadow-xl shadow-indigo-100 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">An administrator will verify your details before you can log in.</p>
          <Segmented className="mt-5" value={role} onChange={(v) => { setRole(v); setErrors({}); setMessage(null); }} options={[{ value: "student", label: "Student" }, { value: "teacher", label: "Teacher" }]} />

          {message && <Alert tone={message.tone} className="mt-5">{message.text}</Alert>}

          <form onSubmit={submit} className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={err("full_name")} required className="sm:col-span-2"><Input {...bind("full_name")} placeholder="As per college records" required invalid={!!err("full_name")} /></Field>
              <Field label="Email" error={err("email")} required><Input type="email" {...bind("email")} placeholder="you@example.com" required invalid={!!err("email")} /></Field>
              <Field label="Mobile number" error={err("phone")} required><Input type="tel" inputMode="tel" {...bind("phone")} placeholder="10-digit number" required invalid={!!err("phone")} /></Field>
              <Field label="Date of birth" hint="This is your login password." error={err("dob")} required><Input type="date" {...bind("dob")} max={new Date().toISOString().slice(0, 10)} required invalid={!!err("dob")} /></Field>
              <Field label="Gender" error={err("gender")} required>
                <Select {...bind("gender")} required><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></Select>
              </Field>
              <Field label="Address" error={err("address")} required className="sm:col-span-2"><Textarea {...bind("address")} rows={2} placeholder="Full postal address" required className="min-h-[72px]" /></Field>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">{role === "student" ? "Academic details" : "Faculty details"}</h2>
              {role === "student" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Roll number" error={err("roll_no")} hint="Exactly 6 digits" required>
                    <Input value={form.roll_no} onChange={(e) => set("roll_no", e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="123456" required invalid={!!err("roll_no")} />
                  </Field>
                  <Field label="Department" error={err("department")} required><Input {...bind("department")} placeholder="e.g. CSE" required invalid={!!err("department")} /></Field>
                  <Field label="Course" error={err("course")} required>
                    <Select {...bind("course")} required><option value="">Select course</option>{subjects.courses.map((c) => <option key={c} value={c}>{COURSE_LABELS[c] || c}</option>)}</Select>
                  </Field>
                  <Field label="Branch" error={err("branch")} required>
                    <Select {...bind("branch")} required disabled={!form.course}><option value="">Select branch</option>{subjects.branches(form.course).map((b) => <option key={b} value={b}>{BRANCH_LABELS[b] ? `${BRANCH_LABELS[b]} (${b})` : b}</option>)}</Select>
                  </Field>
                  <Field label="Semester" error={err("semester")} required>
                    <Select {...bind("semester")} required disabled={!semesters.length}><option value="">Select semester</option>{semesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}</Select>
                  </Field>
                  <Field label="Section" error={err("section")} required>
                    <Select {...bind("section")} required><option value="">Select section</option><option>A</option><option>B</option><option>C</option></Select>
                  </Field>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Employee ID" error={err("employee_id")} hint="Exactly 6 digits" required>
                    <Input value={form.employee_id} onChange={(e) => set("employee_id", e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="100001" required invalid={!!err("employee_id")} />
                  </Field>
                  <Field label="Main subject" error={err("subject")} hint="Pick from the list or type your own" required>
                    <Input {...bind("subject")} list="subject-options" placeholder="Search subject…" required invalid={!!err("subject")} />
                    <datalist id="subject-options">{allSubjects.map((s) => <option key={s} value={s} />)}</datalist>
                  </Field>
                </div>
              )}
            </div>

            <Button type="submit" size="lg" loading={loading} icon={message?.tone === "success" ? CheckCircle2 : UserPlus} className="w-full">{loading ? "Submitting…" : "Submit registration"}</Button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">Already approved? <Link to="/login" className="font-semibold text-indigo-600 hover:underline">Log in</Link></p>
        </Card>
        <Link to="/" className="mt-5 flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
      </div>
    </div>
  );
}
