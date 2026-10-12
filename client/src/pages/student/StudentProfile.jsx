import { useEffect, useRef, useState } from "react";
import { Camera, Pencil, Save, X } from "lucide-react";
import api, { errorMessage, photoSrc } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { BRANCH_LABELS, useSubjects } from "../../lib/subjects";
import { formatDate } from "../../lib/format";
import { resizeImage } from "../../lib/image";
import { Alert, Avatar, Button, Card, Field, Input, PageHeader, Select, Spinner } from "../../components/ui";
import { useToast } from "../../components/feedback";

export default function StudentProfile() {
  const { userId } = useAuth();
  const subjects = useSubjects();
  const toast = useToast();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(null); // null = viewing
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.get(`/student/profile/${userId}`).then((r) => setProfile(r.data)).catch((e) => setError(errorMessage(e)));
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId]);

  const startEdit = () => setEdit({ full_name: profile.full_name, email: profile.email, branch: profile.branch, semester: String(profile.semester), section: profile.section, dob: profile.dob });
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/student/profile/update/${userId}`, { ...edit, semester: Number(edit.semester) });
      await load();
      setEdit(null);
      toast.success("Profile updated");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { blob, dataUrl } = await resizeImage(file);
      const body = new FormData();
      body.append("file", blob, "photo.jpg");
      await api.post(`/student/profile/upload-photo/${userId}`, body);
      window.dispatchEvent(new CustomEvent("uiet:photo-changed", { detail: dataUrl }));
      await load();
      toast.success("Photo updated");
    } catch (err) {
      toast.error(errorMessage(err, "Could not upload the photo."));
    } finally {
      setUploading(false);
    }
  };

  if (!profile) return error ? <Alert tone="error">{error}</Alert> : <Spinner />;
  const branches = subjects.branches(profile.course);
  const semesters = subjects.semesters(profile.course, edit?.branch || profile.branch);
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });

  const rows = [
    ["Roll number", profile.roll_no], ["Department", profile.department], ["Course", profile.course],
    ["Branch", BRANCH_LABELS[profile.branch?.toUpperCase()] || profile.branch], ["Semester", profile.semester], ["Section", profile.section],
    ["Email", profile.email], ["Mobile", profile.phone], ["Date of birth", formatDate(profile.dob)], ["Gender", profile.gender],
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader title="My profile" actions={!edit && <Button icon={Pencil} variant="secondary" onClick={startEdit}>Edit details</Button>} />
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-500 to-violet-500" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-wrap items-end gap-4">
            <div className="relative">
              <Avatar name={profile.full_name} src={photoSrc(profile)} size="lg" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Change photo" className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg ring-2 ring-white hover:bg-indigo-700 disabled:opacity-60"><Camera className="h-4 w-4" /></button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </div>
            <div className="pb-1"><h2 className="text-xl font-bold text-slate-900">{profile.full_name}</h2><p className="text-sm text-slate-500">{profile.course} · {profile.branch} · Roll no {profile.roll_no}</p></div>
          </div>

          {error && <Alert tone="error" className="mt-5">{error}</Alert>}

          {edit ? (
            <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required><Input value={edit.full_name} onChange={set("full_name")} required /></Field>
              <Field label="Email" required><Input type="email" value={edit.email} onChange={set("email")} required /></Field>
              <Field label="Branch"><Select value={edit.branch} onChange={(e) => setEdit({ ...edit, branch: e.target.value.toUpperCase(), semester: "" })}>{[...new Set([edit.branch?.toUpperCase(), ...branches])].filter(Boolean).map((b) => <option key={b} value={b}>{b}</option>)}</Select></Field>
              <Field label="Semester"><Select value={edit.semester} onChange={set("semester")} required><option value="">Select</option>{semesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}</Select></Field>
              <Field label="Section"><Select value={edit.section} onChange={set("section")}>{["A", "B", "C"].map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <Field label="Date of birth" hint="Used as your login password" required><Input type="date" value={edit.dob} onChange={set("dob")} required /></Field>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" icon={Save} loading={saving}>Save changes</Button>
                <Button variant="secondary" icon={X} onClick={() => { setEdit(null); setError(""); }}>Cancel</Button>
              </div>
            </form>
          ) : (
            <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k} className="border-b border-slate-100 pb-3"><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{k}</dt><dd className="mt-0.5 text-sm font-medium text-slate-800">{v || "–"}</dd></div>
              ))}
            </dl>
          )}
        </div>
      </Card>
    </div>
  );
}
