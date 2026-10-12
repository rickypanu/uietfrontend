import { useEffect, useState } from "react";
import { Bell, Clock, Download, Megaphone } from "lucide-react";
import api, { errorMessage, fileUrl } from "../../lib/api";
import { formatDateTime, relativeTime } from "../../lib/format";
import { Alert, Badge, Card, EmptyState, PageHeader, Spinner } from "../../components/ui";

export default function StudentNotifications() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/student/notifications")
      .then((r) => {
        setItems(r.data);
        // opening the page counts as reading: clear the badge in the sidebar
        return api.post("/student/notifications/seen").then(() => window.dispatchEvent(new Event("uiet:notifications-seen")));
      })
      .catch((e) => { setError(errorMessage(e, "Could not load notifications.")); setItems((prev) => prev || []); });
  }, []);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Notifications" subtitle="Notices from your teachers and the administration." />
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      {items === null ? <Spinner /> : items.length === 0 ? (
        <Card><EmptyState icon={Bell} title="You’re all caught up" text="New notices will show up here." /></Card>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card key={`${n.source}-${n.id}`} className={`p-5 ${n.unread ? "border-indigo-200 ring-1 ring-indigo-100" : ""}`}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><Megaphone className="h-4 w-4" /></span>
                <span className="font-semibold text-slate-900">{n.sender_name}</span>
                <Badge tone={n.source === "admin" ? "rose" : "indigo"}>{n.source === "admin" ? "Administration" : "Teacher"}</Badge>
                {n.category && <Badge tone="slate">{n.category}</Badge>}
                {n.unread && <Badge tone="emerald">New</Badge>}
                <span className="ml-auto text-xs text-slate-400">{formatDateTime(n.timestamp)}</span>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{n.message}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                {n.file_url ? (
                  <a href={fileUrl(n.file_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 font-medium text-indigo-600 hover:bg-indigo-50"><Download className="h-3.5 w-3.5" /> {n.file_name || "Attachment"}</a>
                ) : <span />}
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> expires {relativeTime(n.expiry_time)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
