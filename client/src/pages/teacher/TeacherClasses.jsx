import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, PlusCircle, Trash2 } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { BRANCH_LABELS, COURSE_LABELS, useSubjects } from "../../lib/subjects";
import { Alert, Badge, Button, Card, EmptyState, Field, Input, PageHeader, SectionTitle, Select, Spinner } from "../../components/ui";
import { useConfirm, useToast } from "../../components/feedback";
import { useAuth } from "../../lib/auth";

const EMPTY = { department: "UIET", course: "", branch: "", semester: "", section: "", subject: "" };

export default function TeacherClasses() {
  const { userId } = useAuth();
  const subjects = useSubjects();
  const toast = useToast();
  const confirm = useConfirm();
  const [classes, setClasses] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/classes/list/${userId}`).then((r) => setClasses(r.data)).catch((e) => { setClasses([]); setError(errorMessage(e)); });
  }, [userId]);

  const set = (k, v) => setForm((f) => {
    const next = { ...f, [k]: v };
    if (k === "course") { next.branch = ""; next.semester = ""; next.subject = ""; }
    if (k === "branch") { next.semester = ""; next.subject = ""; }
    if (k === "semester") next.subject = "";
    return next;
  });

  const options = form.course && form.branch && form.semester ? subjects.subjectsFor(form.course, form.branch, form.semester) : [];

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.post("/classes/create", { ...form, semester: Number(form.semester) });
      setClasses((list) => [res.data, ...(list || [])]);
      setForm({ ...EMPTY, department: form.department });
      toast.success("Class created");
    } catch (err) {
      setError(errorMessage(err, "Could not create the class."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    const ok = await confirm({ title: "Delete this class?", message: `${c.subject} (${c.branch}, Sem ${c.semester}, Sec ${c.section}) will be removed from your list. Past attendance records are kept.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await api.delete(`/classes/${c.id}`);
      setClasses((list) => list.filter((x) => x.id !== c.id));
      toast.success("Class deleted");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Classes & registers" subtitle="Create the classes you teach, then open one to see its attendance register." />

      <Card className="p-5 sm:p-6">
        <SectionTitle icon={PlusCircle} title="New class" />
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Department" required><Input value={form.department} onChange={(e) => set("department", e.target.value)} required /></Field>
          <Field label="Course" required><Select value={form.course} onChange={(e) => set("course", e.target.value)} required><option value="">Select</option>{subjects.courses.map((c) => <option key={c} value={c}>{COURSE_LABELS[c] || c}</option>)}</Select></Field>
          <Field label="Branch" required><Select value={form.branch} onChange={(e) => set("branch", e.target.value)} required disabled={!form.course}><option value="">Select</option>{subjects.branches(form.course).map((b) => <option key={b} value={b}>{BRANCH_LABELS[b] ? `${b} – ${BRANCH_LABELS[b]}` : b}</option>)}</Select></Field>
          <Field label="Semester" required><Select value={form.semester} onChange={(e) => set("semester", e.target.value)} required disabled={!form.branch}><option value="">Select</option>{subjects.semesters(form.course, form.branch).map((s) => <option key={s} value={s}>Semester {s}</option>)}</Select></Field>
          <Field label="Section" required><Select value={form.section} onChange={(e) => set("section", e.target.value)} required><option value="">Select</option><option>A</option><option>B</option><option>C</option></Select></Field>
          <Field label="Subject" required hint={form.semester && options.length === 0 ? "No subjects are defined for this semester yet." : undefined}>
            <Select value={form.subject} onChange={(e) => set("subject", e.target.value)} required disabled={!options.length}><option value="">Select</option>{options.map((s) => <option key={s}>{s}</option>)}</Select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            {error && <Alert tone="error" className="mb-3">{error}</Alert>}
            <Button type="submit" icon={PlusCircle} loading={saving}>Create class</Button>
          </div>
        </form>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Your classes</h2>
        {classes === null ? <Spinner /> : classes.length === 0 ? (
          <Card><EmptyState icon={BookOpen} title="No classes yet" text="Use the form above to add your first class." /></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {classes.map((c) => (
              <Card key={c.id} className="flex items-center gap-3 p-4 transition hover:border-indigo-300 hover:shadow-md">
                <Link to={`/teacher/classes/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><BookOpen className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{c.subject}</span>
                    <span className="mt-0.5 flex flex-wrap gap-1.5"><Badge tone="indigo">{c.course} · {c.branch}</Badge><Badge>Sem {c.semester}</Badge><Badge>Sec {c.section}</Badge></span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </Link>
                <button type="button" onClick={() => remove(c)} aria-label={`Delete ${c.subject}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-5 w-5" /></button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
