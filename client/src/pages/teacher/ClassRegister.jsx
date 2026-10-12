import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Users } from "lucide-react";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { errorMessage } from "../../lib/api";
import { downloadCsv } from "../../lib/csv";
import { percentColor, todayKey } from "../../lib/format";
import { Alert, Badge, Button, Card, EmptyState, Field, Input, PageHeader, SectionTitle, Spinner, cx } from "../../components/ui";

const THRESHOLD = 75;

export default function ClassRegister() {
  const { classId } = useParams();
  const [month, setMonth] = useState(() => todayKey().slice(0, 7)); // YYYY-MM
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [roll, setRoll] = useState("");
  const [below, setBelow] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const [year, m] = month.split("-").map(Number);
    api.get(`/classes/register/${classId}`, { params: month ? { month: m, year } : {} })
      .then((r) => !cancelled && setData(r.data))
      .catch((e) => { if (!cancelled) { setError(errorMessage(e, "Could not load the register.")); setData(null); } })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [classId, month]);

  const students = useMemo(() => (data?.students || []).filter((s) =>
    (!roll || s.roll_no.includes(roll.trim())) && (below === "" || s.percentage < Number(below))
  ), [data, roll, below]);

  const lectures = data?.lectures || [];
  const info = data?.class_info;

  const pie = useMemo(() => {
    const above = students.filter((s) => s.percentage >= THRESHOLD).length;
    return [{ name: `${THRESHOLD}% or more`, value: above }, { name: `Below ${THRESHOLD}%`, value: students.length - above }];
  }, [students]);

  const trend = useMemo(() => lectures.map((l) => ({
    name: `${l.label} ${l.time}`, Present: students.filter((s) => s.marks[l.key] === "P").length,
  })), [lectures, students]);

  const average = students.length ? (students.reduce((a, s) => a + s.percentage, 0) / students.length).toFixed(1) : "0.0";

  const exportCsv = () => downloadCsv(`${info?.subject || "class"}_${info?.section || ""}_register_${month}.csv`, [
    ["Roll no", "Name", ...lectures.map((l) => `${l.date} ${l.time}`), "Present", "Total", "Percentage"],
    ...students.map((s) => [s.roll_no, s.name, ...lectures.map((l) => s.marks[l.key]), s.present, s.total, `${s.percentage}%`]),
  ]);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title={info ? info.subject : "Class register"}
        subtitle={info && `${info.course} · ${info.branch} · Semester ${info.semester} · Section ${info.section}`}
        actions={<><Link to="/teacher/classes"><Button variant="secondary" icon={ArrowLeft}>Back</Button></Link><Button icon={Download} onClick={exportCsv} disabled={!students.length}>Export CSV</Button></>}
      />

      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Month"><Input type="month" value={month} onChange={(e) => setMonth(e.target.value || todayKey().slice(0, 7))} /></Field>
          <Field label="Roll number contains"><Input value={roll} onChange={(e) => setRoll(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="e.g. 1234" /></Field>
          <Field label="Show students below %"><Input type="number" min="0" max="100" value={below} onChange={(e) => setBelow(e.target.value)} placeholder="e.g. 75" /></Field>
        </div>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}
      {loading && !data ? <Spinner /> : data && (
        <>
          <div className="flex flex-wrap gap-2">
            <Badge tone="indigo">{lectures.length} lecture{lectures.length === 1 ? "" : "s"} held</Badge>
            <Badge tone="sky">{students.length} student{students.length === 1 ? "" : "s"}</Badge>
            <Badge tone={Number(average) >= THRESHOLD ? "emerald" : "rose"}>Average {average}%</Badge>
          </div>

          <Card className="overflow-hidden">
            {students.length === 0 ? (
              <EmptyState icon={Users} title="No students to show" text={data.students.length ? "Try clearing the filters." : "No approved students match this class’s course, branch, semester and section yet."} />
            ) : (
              <div className="max-h-[70vh] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 text-left">Roll no</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      {lectures.map((l) => <th key={l.key} className="whitespace-nowrap px-3 py-3 text-center" title={`${l.date} ${l.time}`}>{l.label}<span className="block text-[10px] font-normal normal-case text-slate-400">{l.time}</span></th>)}
                      <th className="px-3 py-3 text-center">Total</th><th className="px-3 py-3 text-center">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s.roll_no} className={cx("hover:bg-slate-50", s.total > 0 && s.percentage < THRESHOLD && "bg-rose-50/40")}>
                        <td className="sticky left-0 bg-white px-4 py-2.5 font-mono text-xs text-slate-600">{s.roll_no}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-900">{s.name}</td>
                        {lectures.map((l) => (
                          <td key={l.key} className="px-3 py-2.5 text-center">
                            <span className={cx("inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold", s.marks[l.key] === "P" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600")}>{s.marks[l.key]}</span>
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{s.present}/{s.total}</td>
                        <td className={cx("px-3 py-2.5 text-center font-bold", s.total ? percentColor(s.percentage) : "text-slate-300")}>{s.total ? `${s.percentage}%` : "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {students.length > 0 && lectures.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-5">
                <SectionTitle title="Attendance distribution" />
                <div className="h-64"><ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} label>{pie.map((_, i) => <Cell key={i} fill={["#10b981", "#f43f5e"][i]} />)}</Pie><Tooltip /><Legend /></PieChart>
                </ResponsiveContainer></div>
              </Card>
              <Card className="p-5">
                <SectionTitle title="Students present per lecture" />
                <div className="h-64"><ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend}><XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="Present" fill="#6366f1" radius={[6, 6, 0, 0]} /></BarChart>
                </ResponsiveContainer></div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
