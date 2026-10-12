import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Download, GraduationCap, Search, UserX, Users, X, Clock, BookOpen } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { downloadCsv } from "../../lib/csv";
import { formatDate } from "../../lib/format";
import { Alert, Avatar, Badge, Button, Card, EmptyState, Input, PageHeader, Segmented, Spinner, StatCard } from "../../components/ui";
import { useConfirm, useToast } from "../../components/feedback";

const PAGE = 15;
const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminDashboard() {
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("pending");
  const [kind, setKind] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const combos = ["pending", "approved", "rejected"].flatMap((s) => [["students", s], ["teachers", s]]);
      const [statsRes, ...lists] = await Promise.all([api.get("/admin/stats"), ...combos.map(([k, s]) => api.get(`/admin/list/${s}/${k}`))]);
      const next = { pending: [], approved: [], rejected: [] };
      combos.forEach(([k, s], i) => {
        const role = k === "students" ? "student" : "teacher";
        lists[i].data.forEach((u) => next[s].push({ ...u, role, user_id: role === "student" ? u.roll_no : u.employee_id }));
      });
      setUsers(next);
      setStats(statsRes.data);
    } catch (err) {
      setError(errorMessage(err, "Could not load users."));
      setUsers((prev) => prev || { pending: [], approved: [], rejected: [] });
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [tab, kind, query]);

  const act = async (u, action) => {
    const verb = action === "approve" ? "Approve" : "Reject";
    const ok = await confirm({ title: `${verb} ${u.full_name}?`, message: action === "approve" ? "They will be able to log in straight away and will receive an email." : "They will be notified by email and won’t be able to log in.", confirmLabel: verb, danger: action === "reject" });
    if (!ok) return;
    setBusyId(`${u.role}:${u.user_id}`);
    try {
      await api.post(`/admin/${action}/${u.role}/${u.user_id}`);
      toast.success(`${u.full_name} ${action === "approve" ? "approved" : "rejected"}`);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, `Could not ${action} this user.`));
    } finally {
      setBusyId(null);
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users?.[tab] || []).filter((u) => (kind === "all" || u.role === kind) &&
      (!q || [u.full_name, u.user_id, u.email, u.branch].some((v) => String(v || "").toLowerCase().includes(q))));
  }, [users, tab, kind, query]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const visible = rows.slice((page - 1) * PAGE, page * PAGE);
  const s = stats;

  const exportCsv = () => downloadCsv(`${tab}_users.csv`, [["Name", "Role", "ID", "Email", "Phone", "Branch / Subject", "DOB"], ...rows.map((u) => [u.full_name, u.role, u.user_id, u.email, u.phone, u.role === "student" ? `${u.course || ""} ${u.branch || ""} S${u.semester || ""}${u.section || ""}` : u.subject, u.dob])]);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Approvals" subtitle="Review registrations and manage who can use the portal." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} label="Pending requests" value={s ? s.students.pending + s.teachers.pending : "–"} tone="amber" hint={s && `${s.students.pending} students · ${s.teachers.pending} teachers`} />
        <StatCard icon={GraduationCap} label="Students" value={s ? s.students.approved : "–"} tone="emerald" />
        <StatCard icon={BookOpen} label="Teachers" value={s ? s.teachers.approved : "–"} tone="indigo" />
        <StatCard icon={UserX} label="Rejected" value={s ? s.students.rejected + s.teachers.rejected : "–"} tone="rose" />
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented value={tab} onChange={setTab} options={TABS.map((t) => ({ ...t, label: `${t.label}${users ? ` (${users[t.value].length})` : ""}` }))} />
          <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv} disabled={!rows.length}>Export CSV</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, ID, email…" aria-label="Search users" />
          </div>
          <Segmented value={kind} onChange={setKind} options={[{ value: "all", label: "All" }, { value: "student", label: "Students" }, { value: "teacher", label: "Teachers" }]} />
        </div>

        <div className="mt-5">
          {users === null ? <Spinner /> : visible.length === 0 ? (
            <EmptyState icon={Users} title={`No ${tab} users`} text={query ? "Nothing matches your search." : tab === "pending" ? "You’re all caught up." : undefined} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">ID</th><th className="px-4 py-3">Details</th>{tab === "pending" && <th className="px-4 py-3 text-right">Actions</th>}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((u) => {
                    const key = `${u.role}:${u.user_id}`;
                    return (
                      <tr key={key} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={u.full_name} size="sm" /><div className="min-w-0"><p className="truncate font-medium text-slate-900">{u.full_name}</p><p className="truncate text-xs text-slate-500">{u.email}</p></div></div></td>
                        <td className="px-4 py-3"><Badge tone={u.role === "student" ? "sky" : "indigo"}>{u.role}</Badge></td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.user_id}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{u.role === "student" ? `${u.course || ""} ${u.branch || ""} · Sem ${u.semester} · Sec ${u.section}` : u.subject}<br />{u.phone} · {formatDate(u.dob)}</td>
                        {tab === "pending" && (
                          <td className="px-4 py-3"><div className="flex justify-end gap-2">
                            <Button size="sm" variant="success" icon={Check} loading={busyId === key} disabled={Boolean(busyId)} onClick={() => act(u, "approve")}>Approve</Button>
                            <Button size="sm" variant="secondary" icon={X} disabled={Boolean(busyId)} onClick={() => act(u, "reject")}>Reject</Button>
                          </div></td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {rows.length > PAGE && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>{rows.length} users · page {page} of {pages}</span>
              <div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button></div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
