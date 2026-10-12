import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { downloadCsv } from "../../lib/csv";
import { Alert, Badge, Button, Card, PageHeader, SectionTitle, Segmented, StatCard } from "../../components/ui";
import { CheckCircle2, XCircle, ListChecks } from "lucide-react";

export default function BulkRegister() {
  const inputRef = useRef(null);
  const [kind, setKind] = useState("students");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  const idLabel = kind === "students" ? "Roll no" : "Employee ID";

  const downloadTemplate = async () => {
    try {
      const res = await api.get(`/admin/download/${kind === "students" ? "student" : "teacher"}_template`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(errorMessage(err, "Could not download the template."));
    }
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await api.post(`/admin/register/bulk_${kind}`, body, { timeout: 120000 });
      setReport(res.data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(errorMessage(err, "Upload failed."));
    } finally {
      setLoading(false);
    }
  };

  const failed = report?.results.filter((r) => r.status === "Failed") || [];

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Bulk registration" subtitle="Add many approved students or teachers at once from a spreadsheet." />
      <Card className="p-5 sm:p-6">
        <Segmented value={kind} onChange={(v) => { setKind(v); setReport(null); setError(""); setFile(null); }} options={[{ value: "students", label: "Students" }, { value: "teachers", label: "Teachers" }]} className="mb-5" />
        <SectionTitle icon={FileSpreadsheet} title="1 · Get the template" subtitle="Fill it in without changing the column headers. Dates as YYYY-MM-DD, IDs as 6 digits." action={<Button size="sm" variant="secondary" icon={Download} onClick={downloadTemplate}>Download .xlsx</Button>} />
        <form onSubmit={upload} className="mt-6">
          <SectionTitle icon={Upload} title="2 · Upload the filled file" subtitle=".xlsx, .xls or .csv · up to 2000 rows · accounts are approved immediately" />
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40">
            <Upload className="mb-2 h-8 w-8 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-700">{file ? file.name : "Click to choose a file"}</span>
            <span className="text-xs text-slate-400">{file ? `${(file.size / 1024).toFixed(1)} KB` : "or drag it here"}</span>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setReport(null); setError(""); }} />
          </label>
          {error && <Alert tone="error" className="mt-4">{error}</Alert>}
          <Button type="submit" icon={Upload} loading={loading} disabled={!file} className="mt-4">{loading ? "Importing…" : "Import"}</Button>
        </form>
      </Card>

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={ListChecks} label="Rows processed" value={report.total} tone="indigo" />
            <StatCard icon={CheckCircle2} label="Registered" value={report.registered} tone="emerald" />
            <StatCard icon={XCircle} label="Failed" value={report.failed} tone="rose" />
          </div>
          {failed.length > 0 && (
            <Card className="p-5">
              <SectionTitle title="Rows that need attention" subtitle="Fix these in your file and import again — rows that succeeded won’t be duplicated."
                action={<Button size="sm" variant="secondary" icon={Download} onClick={() => downloadCsv(`${kind}_import_errors.csv`, [["Row", idLabel, "Name", "Reason"], ...failed.map((r) => [r.row, r.id, r.name, r.reason])])}>CSV</Button>} />
              <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2.5">Row</th><th className="px-4 py-2.5">{idLabel}</th><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Reason</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{failed.map((r) => <tr key={r.row}><td className="px-4 py-2.5"><Badge tone="rose">{r.row}</Badge></td><td className="px-4 py-2.5 font-mono text-xs">{r.id || "–"}</td><td className="px-4 py-2.5">{r.name || "–"}</td><td className="px-4 py-2.5 text-rose-700">{r.reason}</td></tr>)}</tbody>
                </table>
              </div>
            </Card>
          )}
          {report.failed === 0 && <Alert tone="success">All {report.registered} rows were imported successfully.</Alert>}
        </>
      )}
    </div>
  );
}
