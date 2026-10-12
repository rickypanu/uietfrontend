import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useZxing } from "react-zxing";
import { CalendarCheck, CheckCircle2, Download, Filter, Loader2, QrCode, ScanLine, ShieldCheck, XCircle } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useSubjects } from "../../lib/subjects";
import { downloadCsv } from "../../lib/csv";
import { dayKey, formatDate, formatTime, todayKey } from "../../lib/format";
import { getFingerprint } from "../../lib/fingerprint";
import { getPosition } from "../../lib/geo";
import { Alert, Badge, Button, Card, EmptyState, Input, Modal, PageHeader, SectionTitle, Select, Spinner, StatCard } from "../../components/ui";
import { useToast } from "../../components/feedback";

function QrScanner({ onResult }) {
  const handled = useRef(false);
  const { ref } = useZxing({
    onDecodeResult(result) {
      if (handled.current) return; // the scanner fires continuously - act on the first read only
      handled.current = true;
      onResult(result.getText());
    },
  });
  return <video ref={ref} className="aspect-square w-full rounded-xl bg-slate-900 object-cover" muted playsInline />;
}

export default function StudentDashboard() {
  const { userId, session } = useAuth();
  const subjects = useSubjects();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpInfo, setOtpInfo] = useState(null);
  const [otpError, setOtpError] = useState("");
  const [checking, setChecking] = useState(false);
  const [marking, setMarking] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const loadHistory = useCallback(() => {
    api.get(`/student/view-attendance/${userId}`).then((r) => setHistory(r.data)).catch((e) => { setHistory([]); toast.error(errorMessage(e, "Could not load your attendance.")); });
  }, [userId, toast]);

  useEffect(() => {
    api.get(`/student/profile/${userId}`).then((r) => setProfile(r.data)).catch(() => {});
    loadHistory();
  }, [userId, loadHistory]);

  // live OTP validation (debounced, ignores stale responses)
  useEffect(() => {
    setOtpInfo(null);
    setOtpError("");
    if (otp.length < 6) return undefined;
    let cancelled = false;
    setChecking(true);
    const timer = setTimeout(() => {
      api.get(`/student/check-otp/${otp}`)
        .then((r) => !cancelled && setOtpInfo(r.data))
        .catch((e) => !cancelled && setOtpError(e.response?.status === 404 ? "That code doesn’t exist. Check it and try again." : errorMessage(e)))
        .finally(() => !cancelled && setChecking(false));
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); setChecking(false); };
  }, [otp]);

  const mark = async (code, subject) => {
    setMarking(true);
    setResult(null);
    try {
      setProgress("Getting your location…");
      const pos = await getPosition({ timeout: 12000, targetAccuracy: 60, onProgress: (p) => setProgress(`Locating you… accuracy ±${Math.round(p.accuracy)} m`) });
      setProgress("Marking attendance…");
      const visitorId = await getFingerprint();
      const res = await api.post("/student/markAttendance", { otp: code, visitorId, lat: pos.lat, lng: pos.lng, subject: subject || undefined });
      setResult({ tone: "success", text: `Attendance marked for ${res.data.subject}.` });
      toast.success("Attendance marked!");
      setOtp("");
      loadHistory();
    } catch (err) {
      setResult({ tone: "error", text: errorMessage(err, "Could not mark attendance.") });
    } finally {
      setMarking(false);
      setProgress("");
    }
  };

  const onScan = (text) => {
    setScanning(false);
    let code = text.trim();
    let subject = "";
    try {
      const parsed = JSON.parse(text);
      code = String(parsed.otp || "").trim();
      subject = String(parsed.subject || "").trim();
    } catch { /* plain OTP text */ }
    code = code.toUpperCase();
    if (!code) return setResult({ tone: "error", text: "That QR code isn’t an attendance code." });
    setOtp(code);
    mark(code, subject);
  };

  const submit = (e) => { e.preventDefault(); if (otp.length >= 4) mark(otp); };

  const curriculum = profile ? subjects.subjectsFor(profile.course, profile.branch, profile.semester) : [];
  const filtered = useMemo(() => (history || []).filter((h) =>
    (!filterSubject || h.subject.toLowerCase() === filterSubject.toLowerCase()) && (!filterDate || dayKey(h.marked_at) === filterDate)
  ), [history, filterSubject, filterDate]);

  const today = todayKey();
  const stats = {
    total: history?.length ?? "–",
    today: history ? history.filter((h) => dayKey(h.marked_at) === today).length : "–",
    subjects: history ? new Set(history.map((h) => h.subject.toLowerCase())).size : "–",
  };

  const exportCsv = () => {
    if (!filtered.length) return toast.info("There is nothing to export.");
    downloadCsv(`attendance_${userId}_${today}.csv`, [
      ["Name", profile?.full_name], ["Roll no", userId], ["Course", profile?.course], ["Branch", profile?.branch],
      ["Semester", profile?.semester], ["Section", profile?.section], [],
      ["Subject", "Date", "Time"],
      ...filtered.map((h) => [h.subject, formatDate(h.marked_at), formatTime(h.marked_at)]),
    ]);
  };

  const canMark = otp.length >= 4 && !(otpInfo && (!otpInfo.active || !otpInfo.eligible));

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title={`Hi, ${(profile?.full_name || session.name || "there").split(" ")[0]} 👋`} subtitle={profile ? `${profile.course} · ${profile.branch} · Semester ${profile.semester} · Section ${profile.section}` : "Loading your details…"} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarCheck} label="Total classes attended" value={stats.total} tone="indigo" />
        <StatCard icon={CheckCircle2} label="Marked today" value={stats.today} tone="emerald" />
        <StatCard icon={ShieldCheck} label="Subjects attended" value={stats.subjects} tone="sky" />
      </div>

      <Card className="p-5 sm:p-6">
        <SectionTitle icon={ScanLine} title="Mark attendance" subtitle="Enter the code your teacher is showing, or scan their QR code." />
        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={otp} onChange={(e) => { setOtp(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8)); setResult(null); }}
              placeholder="ENTER CODE" aria-label="Attendance code" autoComplete="off" autoCapitalize="characters" spellCheck={false}
              className="flex-1 text-center font-mono text-xl font-semibold tracking-[0.35em] uppercase sm:text-left"
              invalid={!!otpError}
            />
            <Button type="button" variant="soft" icon={QrCode} onClick={() => { setScanning(true); setResult(null); }} disabled={marking}>Scan QR</Button>
            <Button type="submit" variant="success" loading={marking} disabled={!canMark} icon={CheckCircle2}>{marking ? "Working…" : "Mark present"}</Button>
          </div>

          {checking && <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Checking code…</p>}
          {otpError && <Alert tone="error">{otpError}</Alert>}
          {otpInfo && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-slate-50 p-3 text-sm">
              <span className="font-semibold text-slate-900">{otpInfo.subject}</span>
              {otpInfo.teacher_name && <span className="text-slate-500">by {otpInfo.teacher_name}</span>}
              <span className="text-slate-500">until {formatTime(otpInfo.end_time)}</span>
              {!otpInfo.active ? <Badge tone="rose">Expired</Badge> : !otpInfo.eligible ? <Badge tone="amber">Not your class</Badge> : <Badge tone="emerald">Valid</Badge>}
            </div>
          )}
          {progress && <p className="flex items-center gap-2 text-sm text-indigo-600"><Loader2 className="h-4 w-4 animate-spin" /> {progress}</p>}
          {result && <Alert tone={result.tone}>{result.text}</Alert>}
        </form>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionTitle icon={Filter} title="Attendance history" subtitle={`${filtered.length} record${filtered.length === 1 ? "" : "s"}`} action={<Button size="sm" variant="secondary" icon={Download} onClick={exportCsv}>Export CSV</Button>} />
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} aria-label="Filter by subject">
            <option value="">All subjects</option>{curriculum.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} aria-label="Filter by date" />
          <Button variant="ghost" onClick={() => { setFilterSubject(""); setFilterDate(""); }} disabled={!filterSubject && !filterDate}>Clear filters</Button>
        </div>

        {history === null ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon={XCircle} title="No records found" text={history.length ? "Try changing the filters." : "Your marked attendance will appear here."} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Time</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((h, i) => (
                  <tr key={`${h.marked_at}-${i}`} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">{h.subject}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(h.marked_at)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatTime(h.marked_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={scanning} onClose={() => setScanning(false)} title="Scan the class QR code" size="sm">
        {scanning && <QrScanner onResult={onScan} />}
        <p className="mt-3 text-center text-xs text-slate-500">Point your camera at the QR code on the teacher’s screen.</p>
      </Modal>
    </div>
  );
}
