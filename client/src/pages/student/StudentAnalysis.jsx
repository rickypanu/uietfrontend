import { useEffect, useState } from "react";
import { Calculator, LineChart, Target } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { percentBar, percentColor } from "../../lib/format";
import { Alert, Button, Card, Field, Input, PageHeader, ProgressBar, SectionTitle, Select, Spinner } from "../../components/ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function StudentAnalysis() {
  const { userId } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [subject, setSubject] = useState("");
  const [data, setData] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [target, setTarget] = useState({ subject: "", from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, to: "", pct: "75" });
  const [targetResult, setTargetResult] = useState(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetError, setTargetError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api.get(`/attendance-analysis/${userId}`, { params: { month, year, subject: subject || undefined } })
      .then((r) => { if (!cancelled) { setData(r.data); setCurriculum(r.data.curriculum || []); } })
      .catch((e) => { if (!cancelled) { setError(errorMessage(e, "Could not load your analysis.")); setData(null); } })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [userId, month, year, subject]);

  const checkTarget = async (e) => {
    e.preventDefault();
    setTargetLoading(true);
    setTargetError("");
    setTargetResult(null);
    try {
      const res = await api.get(`/attendance-target/${userId}`, {
        params: { subject: target.subject, target_percentage: target.pct, from_date: target.from, to_date: target.to || undefined },
      });
      setTargetResult(res.data);
    } catch (err) {
      setTargetError(errorMessage(err));
    } finally {
      setTargetLoading(false);
    }
  };

  const overall = data?.overall;
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Attendance analysis" subtitle="See how you’re doing in each subject and plan how many classes you need." />

      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Month">{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</Select>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year">{years.map((y) => <option key={y}>{y}</option>)}</Select>
          <Select value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject"><option value="">All subjects</option>{curriculum.map((s) => <option key={s}>{s}</option>)}</Select>
        </div>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}
      {loading && !data ? <Spinner /> : data && (
        <>
          <Card className="p-5 sm:p-6">
            <SectionTitle icon={LineChart} title={`Overall · ${data.month}`} subtitle={data.subject_filter} />
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className={`text-4xl font-extrabold ${percentColor(overall.percentage)}`}>{overall.percentage}%</span>
                <span className="ml-2 text-sm text-slate-500">{overall.attended} of {overall.total} classes</span>
              </div>
              {overall.total > 0 && overall.percentage < 75 && <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">Below 75%</span>}
            </div>
            <ProgressBar value={overall.percentage} color={percentBar(overall.percentage)} className="mt-3 h-3" />
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(data.subjects).map(([name, s]) => (
              <Card key={name} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">{name}</h3>
                  <span className={`text-lg font-bold ${s.total ? percentColor(s.percentage) : "text-slate-300"}`}>{s.total ? `${s.percentage}%` : "–"}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{s.total ? `${s.attended} of ${s.total} classes attended` : "No classes held this month"}</p>
                <ProgressBar value={s.percentage} color={percentBar(s.percentage)} className="mt-3" />
              </Card>
            ))}
          </div>
        </>
      )}

      <Card className="bg-gradient-to-br from-amber-50 to-white p-5 sm:p-6">
        <SectionTitle icon={Calculator} title="Target calculator" subtitle="How many classes do I need to attend to reach my goal?" />
        <form onSubmit={checkTarget} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <Field label="Subject" className="lg:col-span-2" required>
            <Select value={target.subject} onChange={(e) => setTarget({ ...target, subject: e.target.value })} required><option value="">Select subject</option>{curriculum.map((s) => <option key={s}>{s}</option>)}</Select>
          </Field>
          <Field label="From" required><Input type="date" value={target.from} onChange={(e) => setTarget({ ...target, from: e.target.value })} required /></Field>
          <Field label="To" hint="Blank = today"><Input type="date" value={target.to} onChange={(e) => setTarget({ ...target, to: e.target.value })} min={target.from} /></Field>
          <Field label="Target %" required><Input type="number" min="1" max="100" step="1" value={target.pct} onChange={(e) => setTarget({ ...target, pct: e.target.value })} required /></Field>
          <Button type="submit" icon={Target} loading={targetLoading} className="sm:col-span-2 lg:col-span-5">Check</Button>
        </form>
        {targetError && <Alert tone="error" className="mt-4">{targetError}</Alert>}
        {targetResult && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
            <p className="font-semibold text-slate-900">{targetResult.message}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              {[["Attended", `${targetResult.attended}/${targetResult.total}`], ["Current", `${targetResult.current_percentage}%`], ["Need to attend", targetResult.needed_classes ?? "—"], ["Can skip", targetResult.skippable_classes]].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-50 p-2"><dt className="text-[11px] uppercase tracking-wide text-slate-400">{k}</dt><dd className="text-lg font-bold text-slate-800">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-slate-400">Period: {targetResult.date_range}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
