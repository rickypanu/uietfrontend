import { useCallback, useEffect, useState } from "react";
import { Clock, FileText, Megaphone, Send, Trash2 } from "lucide-react";
import api, { errorMessage, fileUrl } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { BRANCH_LABELS, COURSE_LABELS, useSubjects } from "../../lib/subjects";
import { formatDateTime, istInputValue, toApiDateTime } from "../../lib/format";
import { Alert, Badge, Button, Card, EmptyState, Field, Input, PageHeader, SectionTitle, Select, Spinner, Textarea } from "../../components/ui";
import { useConfirm, useToast } from "../../components/feedback";

const blank = () => ({ message: "", course: "", branch: "", semester: "", section: "", expiry_time: istInputValue(24) });

export default function TeacherNotifications() {
  const { userId } = useAuth();
  const subjects = useSubjects();
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [items, setItems] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => api.get(`/teacher/notifications/${userId}`).then((r) => setItems(r.data)).catch(() => setItems([])), [userId]);
  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm((f) => {
    const next = { ...f, [k]: v };
    if (k === "course") { next.branch = ""; next.semester = ""; }
    if (k === "branch") next.semester = "";
    return next;
  });

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const body = new FormData();
      Object.entries({ ...form, expiry_time: toApiDateTime(form.expiry_time) }).forEach(([k, v]) => body.append(k, v));
      if (file) body.append("file", file);
      await api.post("/teacher/send-notification", body);
      toast.success("Notification sent");
      setForm(blank()); setFile(null); setFileKey((k) => k + 1);
      load();
    } catch (err) {
      setError(errorMessage(err, "Could not send the notification."));
    } finally {
      setSending(false);
    }
  };

  const remove = async (n) => {
    if (!(await confirm({ title: "Delete notification?", message: "Students will no longer see it.", confirmLabel: "Delete", danger: true }))) return;
    try { await api.delete(`/teacher/notifications/${n.id}`); setItems((l) => l.filter((x) => x.id !== n.id)); toast.success("Deleted"); }
    catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Notifications" subtitle="Send a notice to one class. It disappears for students when it expires." />
      <Card className="p-5 sm:p-6">
        <SectionTitle icon={Megaphone} title="New notification" />
        <form onSubmit={send} className="grid gap-4 sm:grid-cols-2">
          <Field label="Message" required className="sm:col-span-2"><Textarea value={form.message} onChange={(e) => set("message", e.target.value)} maxLength={2000} placeholder="Write your message…" required /></Field>
          <Field label="Course" required><Select value={form.course} onChange={(e) => set("course", e.target.value)} required><option value="">Select</option>{subjects.courses.map((c) => <option key={c} value={c}>{COURSE_LABELS[c] || c}</option>)}</Select></Field>
          <Field label="Branch" required><Select value={form.branch} onChange={(e) => set("branch", e.target.value)} required disabled={!form.course}><option value="">Select</option>{subjects.branches(form.course).map((b) => <option key={b} value={b}>{BRANCH_LABELS[b] ? `${b} – ${BRANCH_LABELS[b]}` : b}</option>)}</Select></Field>
          <Field label="Semester" required><Select value={form.semester} onChange={(e) => set("semester", e.target.value)} required disabled={!form.branch}><option value="">Select</option>{subjects.semesters(form.course, form.branch).map((s) => <option key={s} value={s}>Semester {s}</option>)}</Select></Field>
          <Field label="Section" required><Select value={form.section} onChange={(e) => set("section", e.target.value)} required><option value="">Select</option><option>A</option><option>B</option><option>C</option></Select></Field>
          <Field label="Expires at (IST)" required><Input type="datetime-local" value={form.expiry_time} onChange={(e) => set("expiry_time", e.target.value)} min={istInputValue(0)} required /></Field>
          <Field label="Attachment" hint="PDF, Word, JPG or PNG · max 5 MB"><Input key={fileKey} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} className="file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-indigo-700" /></Field>
          <div className="sm:col-span-2">
            {error && <Alert tone="error" className="mb-3">{error}</Alert>}
            <Button type="submit" icon={Send} loading={sending}>Send notification</Button>
          </div>
        </form>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Sent notifications</h2>
        {items === null ? <Spinner /> : items.length === 0 ? <Card><EmptyState icon={Megaphone} title="Nothing sent yet" /></Card> : (
          <div className="space-y-3">
            {items.map((n) => (
              <Card key={n.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-line text-sm text-slate-800">{n.message}</p>
                  <button type="button" onClick={() => remove(n)} aria-label="Delete notification" className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <Badge tone="indigo">{[n.course, n.branch].filter(Boolean).join(" · ")} · Sem {n.semester} · Sec {n.section}</Badge>
                  <Badge tone={n.expired ? "slate" : "emerald"}><Clock className="h-3 w-3" /> {n.expired ? "Expired" : "Expires"} {formatDateTime(n.expiry_time)}</Badge>
                  {n.file_url && <a href={fileUrl(n.file_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline"><FileText className="h-3.5 w-3.5" /> {n.file_name || "Attachment"}</a>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
