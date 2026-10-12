// All times are shown in IST - the timezone of the institution - regardless of the viewer's device.
const TZ = "Asia/Kolkata";
const make = (opts) => new Intl.DateTimeFormat("en-IN", { timeZone: TZ, ...opts });
const dateFmt = make({ day: "numeric", month: "short", year: "numeric" });
const timeFmt = make({ hour: "2-digit", minute: "2-digit", hour12: true });
const dateTimeFmt = make({ day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

const valid = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (v) => (valid(v) ? dateFmt.format(valid(v)) : "–");
export const formatTime = (v) => (valid(v) ? timeFmt.format(valid(v)).toUpperCase() : "–");
export const formatDateTime = (v) => (valid(v) ? dateTimeFmt.format(valid(v)) : "–");
/** "YYYY-MM-DD" of an instant, in IST. */
export const dayKey = (v) => (valid(v) ? dayKeyFmt.format(valid(v)) : "");
export const todayKey = () => dayKeyFmt.format(new Date());

/** "in 4 min" / "12 min ago" style text. */
export function relativeTime(v, now = Date.now()) {
  const d = valid(v);
  if (!d) return "";
  const diff = Math.round((d.getTime() - now) / 60000);
  const abs = Math.abs(diff);
  const text = abs < 1 ? "less than a minute" : abs < 60 ? `${abs} min` : abs < 1440 ? `${Math.round(abs / 60)} h` : `${Math.round(abs / 1440)} d`;
  return diff >= 0 ? `in ${text}` : `${text} ago`;
}

/** Value for <input type="datetime-local"> in IST, `hours` from now. */
export function istInputValue(hoursFromNow = 24) {
  const parts = Object.fromEntries(
    make({ year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(Date.now() + hoursFromNow * 3600 * 1000))
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** datetime-local value (interpreted as IST) -> ISO string with offset for the API. */
export const toApiDateTime = (local) => (local && local.length === 16 ? `${local}:00+05:30` : local);

export const initials = (name) =>
  String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

export const percentColor = (pct) => (pct >= 75 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-rose-600");
export const percentBar = (pct) => (pct >= 75 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-rose-500");
