import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import api, { errorMessage, photoSrc } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { formatDate } from "../../lib/format";
import { resizeImage } from "../../lib/image";
import { Alert, Avatar, Card, PageHeader, Spinner } from "../../components/ui";
import { useToast } from "../../components/feedback";

export default function TeacherProfile() {
  const { userId } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = () => api.get(`/teacher/profile/${userId}`).then((r) => setProfile(r.data)).catch((e) => setError(errorMessage(e)));
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId]);

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { blob, dataUrl } = await resizeImage(file);
      const body = new FormData();
      body.append("file", blob, "photo.jpg");
      await api.post(`/teacher/profile/upload-photo/${userId}`, body);
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
  const rows = [["Employee ID", profile.employee_id], ["Main subject", profile.subject], ["Email", profile.email], ["Mobile", profile.phone], ["Date of birth", formatDate(profile.dob)], ["Gender", profile.gender], ["Address", profile.address]];

  return (
    <div className="animate-fade-up">
      <PageHeader title="My profile" />
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-500 to-violet-500" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-wrap items-end gap-4">
            <div className="relative">
              <Avatar name={profile.full_name} src={photoSrc(profile)} size="lg" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Change photo" className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg ring-2 ring-white hover:bg-indigo-700 disabled:opacity-60"><Camera className="h-4 w-4" /></button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </div>
            <div className="pb-1"><h2 className="text-xl font-bold text-slate-900">{profile.full_name}</h2><p className="text-sm text-slate-500">Faculty · {profile.employee_id}</p></div>
          </div>
          <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {rows.map(([k, v]) => <div key={k} className="border-b border-slate-100 pb-3"><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{k}</dt><dd className="mt-0.5 text-sm font-medium text-slate-800">{v || "–"}</dd></div>)}
          </dl>
        </div>
      </Card>
    </div>
  );
}
