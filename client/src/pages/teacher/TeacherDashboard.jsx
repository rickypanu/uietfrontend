import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { BookOpenText, CalendarCheck2, Clock, Download, KeyRound, Layers, Loader2, Maximize2, QrCode, Radio, Users } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { downloadCsv } from "../../lib/csv";
import { formatTime, initials } from "../../lib/format";
import { getPosition } from "../../lib/geo";
import { Alert, Badge, Button, Card, EmptyState, Modal, PageHeader, SectionTitle, Spinner, StatCard, cx } from "../../components/ui";
import { useToast } from "../../components/feedback";

const qrPayload = (o) => JSON.stringify({ otp: o.otp, subject: o.subject });
const classLabel = (o) => `${o.course} · ${o.branch} · Sem ${o.semester}${o.section ? ` · Sec ${o.section}` : ""}`;

function countdown(endIso, now) {
  const ms = new Date(endIso).getTime() - now;
  if (ms <= 0) return "Expired";
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function TeacherDashboard() {
  const { userId, session } = useAuth();
  const toast = useToast();
  const [classes, setClasses] = useState(null);
  const [active, setActive] = useState([]);
  const [today, setToday] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [durations, setDurations] = useState({});
  const [busy, setBusy] = useState(null); // `${classId}:${mode}`
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // otp code whose students are listed
  const [projected, setProjected] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [a, t, att] = await Promise.all([
        api.get(`/teacher/active-otps/${userId}`),
        api.get(`/teacher/todays-otps/${userId}`),
        api.get(`/teacher/view-attendance/${userId}`),
      ]);
      setActive(a.data); setToday(t.data); setAttendance(att.data);
    } catch { /* transient polling errors are ignored; a 401 is handled globally */ }
  }, [userId]);

  useEffect(() => {
    api.get(`/classes/list/${userId}`).then((r) => setClasses(r.data)).catch((e) => { setClasses([]); setError(errorMessage(e, "Could not load your classes.")); });
    refresh();
    const poll = setInterval(refresh, 5000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [userId, refresh]);

  const generate = async (c, mode) => {
    const key = `${c.id}:${mode}`;
    const minutes = Math.min(240, Math.max(1, Number(durations[c.id] ?? 10) || 10));
    setBusy(key); setError(""); setStatus("Getting your location…");
    try {
      const pos = await getPosition({ timeout: 15000, targetAccuracy: 50, onProgress: (p) => setStatus(`Locating you… accuracy ±${Math.round(p.accuracy)} m`) });
      setStatus("Creating code…");
      const res = await api.post("/teacher/generate-otp", {
        course: c.course, branch: c.branch, semester: Number(c.semester), section: c.section, subject: c.subject,
        duration_minutes: minutes, lat: pos.lat, lng: pos.lng, mode,
      });
      toast.success(`Code ${res.data.otp} created for ${c.subject}`);
      setSelected(res.data.otp);
      if (mode === "qr") setProjected(res.data);
      await refresh();
    } catch (err) {
      setError(errorMessage(err, "Could not create the code."));
    } finally {
      setBusy(null); setStatus("");
    }
  };

  const countFor = useMemo(() => {
    const map = {};
    attendance.forEach((r) => { map[r.otp] = (map[r.otp] || 0) + 1; });
    return map;
  }, [attendance]);

  const selectedOtp = today.find((o) => o.otp === selected) || active.find((o) => o.otp === selected);
  const students = useMemo(
    () => attendance.filter((r) => r.otp === selected).sort((a, b) => String(a.roll_no).localeCompare(String(b.roll_no), undefined, { numeric: true })),
    [attendance, selected]
  );

  const exportStudents = () => {
    if (!selectedOtp) return;
    downloadCsv(`attendance_${selectedOtp.subject.replace(/\W+/g, "_")}_${selectedOtp.otp}.csv`, [
      ["Subject", selectedOtp.subject], ["Class", classLabel(selectedOtp)], ["Started", selectedOtp.start_time], [],
      ["Roll no", "Name", "Marked at"], ...students.map((s) => [s.roll_no, s.student_name, s.marked_at]),
    ]);
  };

  const live = active.filter((o) => new Date(o.end_time).getTime() > now);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title={`Welcome, ${(session.name || "teacher").split(" ")[0]}`} subtitle="Start a session, share the code, and watch attendance arrive live." actions={<Link to="/teacher/classes"><Button variant="secondary" icon={Layers}>Manage classes</Button></Link>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpenText} label="Sessions today" value={today.length} tone="indigo" />
        <StatCard icon={CalendarCheck2} label="Students marked today" value={attendance.filter((a) => today.some((o) => o.otp === a.otp)).length} tone="emerald" />
        <StatCard icon={KeyRound} label="Live codes" value={live.length} tone="amber" />
        <StatCard icon={Users} label="Present in latest live code" value={live[0] ? countFor[live[0].otp] || 0 : "–"} tone="sky" />
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {live.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400"><Radio className="h-4 w-4 animate-pulse text-rose-500" /> Live now</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {live.map((o) => (
              <Card key={o.id} className={cx("p-5 transition", selected === o.otp && "ring-2 ring-indigo-400")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">{o.subject}</h3>
                    <p className="text-xs text-slate-500">{classLabel(o)}</p>
                  </div>
                  <Badge tone="rose"><Clock className="h-3 w-3" /> {countdown(o.end_time, now)}</Badge>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  {o.mode === "qr"
                    ? <div className="rounded-xl border border-slate-200 bg-white p-2"><QRCodeSVG value={qrPayload(o)} size={104} /></div>
                    : <div className="rounded-xl bg-slate-900 px-4 py-3 font-mono text-3xl font-bold tracking-[0.25em] text-white">{o.otp}</div>}
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-extrabold text-emerald-600">{countFor[o.otp] || 0}</div>
                    <div className="text-xs text-slate-500">present</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="soft" icon={Maximize2} onClick={() => setProjected(o)}>Project</Button>
                  <Button size="sm" variant="secondary" icon={Users} onClick={() => setSelected(o.otp)}>Students</Button>
                  {o.mode === "qr" && <span className="ml-auto self-center font-mono text-xs text-slate-400">{o.otp}</span>}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Card className="p-5 sm:p-6">
        <SectionTitle icon={Layers} title="Start a session" subtitle="Choose how long the code stays valid, then generate an OTP or a QR code." />
        {busy && <Alert tone="info" className="mb-4"><span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {status}</span></Alert>}
        {classes === null ? <Spinner /> : classes.length === 0 ? (
          <EmptyState icon={Layers} title="No classes yet" text="Create your first class (course, branch, semester, section and subject) to start taking attendance." action={<Link to="/teacher/classes"><Button>Create a class</Button></Link>} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {classes.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3.5">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="truncate font-semibold text-slate-900">{c.subject}</p>
                  <p className="text-xs text-slate-500">{c.course} · {c.branch} · Sem {c.semester} · Sec {c.section}</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-500">Valid for
                  <input type="number" min={1} max={240} value={durations[c.id] ?? 10} onChange={(e) => setDurations({ ...durations, [c.id]: e.target.value })} className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100" aria-label={`Minutes valid for ${c.subject}`} /> min
                </label>
                <Button size="sm" variant="secondary" icon={KeyRound} loading={busy === `${c.id}:otp`} disabled={Boolean(busy)} onClick={() => generate(c, "otp")}>OTP</Button>
                <Button size="sm" icon={QrCode} loading={busy === `${c.id}:qr`} disabled={Boolean(busy)} onClick={() => generate(c, "qr")}>QR code</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle icon={BookOpenText} title="Today’s sessions" />
          {today.length === 0 ? <EmptyState title="No sessions yet today" /> : (
            <ul className="space-y-2">
              {today.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => setSelected(o.otp)} className={cx("flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition", selected === o.otp ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:bg-slate-50")}>
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-900">{o.subject}</span><span className="text-xs text-slate-500">{formatTime(o.start_time)} · {o.mode === "qr" ? "QR" : "OTP"}</span></span>
                    <Badge tone={o.is_active && new Date(o.end_time).getTime() > now ? "emerald" : "slate"}>{countFor[o.otp] || 0} present</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 lg:col-span-3">
          <SectionTitle icon={Users} title="Students marked" subtitle={selectedOtp ? `${selectedOtp.subject} · ${formatTime(selectedOtp.start_time)}` : "Select a session to see who marked attendance"}
            action={selectedOtp && <Button size="sm" variant="secondary" icon={Download} onClick={exportStudents} disabled={!students.length}>CSV</Button>} />
          {!selectedOtp ? <EmptyState title="Nothing selected" text="Pick a session from the list." /> : students.length === 0 ? <EmptyState title="No one yet" text="Students appear here the moment they mark attendance." /> : (
            <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {students.map((s) => (
                <li key={s.roll_no} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">{initials(s.student_name || s.roll_no)}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-900">{s.student_name || "Unknown"}</span><span className="text-xs text-slate-500">{s.roll_no}</span></span>
                  <span className="text-xs text-slate-400">{formatTime(s.marked_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={Boolean(projected)} onClose={() => setProjected(null)} title={projected ? `${projected.subject} · ${classLabel(projected)}` : ""} size="lg">
        {projected && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            {projected.mode === "qr"
              ? <div className="rounded-2xl border border-slate-200 bg-white p-4"><QRCodeSVG value={qrPayload(projected)} size={Math.min(320, typeof window !== "undefined" ? window.innerWidth - 120 : 320)} /></div>
              : null}
            <div className="font-mono text-5xl font-extrabold tracking-[0.3em] text-slate-900 sm:text-6xl">{projected.otp}</div>
            <Badge tone="rose"><Clock className="h-3 w-3" /> {countdown(projected.end_time, now)} left</Badge>
            <p className="text-sm text-slate-500">Students can scan the QR code or type the code in their portal.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
