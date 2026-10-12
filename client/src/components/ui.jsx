import { forwardRef, useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, Loader2, TriangleAlert, X } from "lucide-react";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ buttons */
const VARIANTS = {
  primary: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:ring-indigo-300",
  secondary: "bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50",
  success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
  soft: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  ghost: "text-slate-600 hover:bg-slate-100",
};
const SIZES = { sm: "px-3 py-1.5 text-xs gap-1.5", md: "px-4 py-2.5 text-sm gap-2", lg: "px-6 py-3 text-base gap-2" };

export function Button({ variant = "primary", size = "md", loading = false, icon: Icon, className, children, disabled, type = "button", ...rest }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center rounded-xl font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant], SIZES[size], className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

/* --------------------------------------------------------------------- cards */
export function Card({ className, children, ...rest }) {
  return <div className={cx("rounded-2xl border border-slate-200 bg-white shadow-sm", className)} {...rest}>{children}</div>;
}

export function SectionTitle({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        {Icon && <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></span>}
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const TONES = {
  indigo: "bg-indigo-50 text-indigo-600", emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600", rose: "bg-rose-50 text-rose-600", sky: "bg-sky-50 text-sky-600",
};

export function StatCard({ icon: Icon, label, value, tone = "indigo", hint }) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <span className={cx("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", TONES[tone])}><Icon className="h-6 w-6" /></span>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-tight text-slate-900">{value}</div>
        <div className="truncate text-xs font-medium text-slate-500">{label}</div>
        {hint && <div className="truncate text-[11px] text-slate-400">{hint}</div>}
      </div>
    </Card>
  );
}

const BADGES = {
  slate: "bg-slate-100 text-slate-700", indigo: "bg-indigo-50 text-indigo-700", emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700", sky: "bg-sky-50 text-sky-700",
};
export function Badge({ tone = "slate", children, className }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", BADGES[tone], className)}>{children}</span>;
}

export function Avatar({ name, src, size = "md" }) {
  const dims = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-28 w-28 text-3xl" }[size];
  const letters = String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return src
    ? <img src={src} alt={name || "Profile"} className={cx("shrink-0 rounded-full object-cover ring-2 ring-white", dims)} />
    : <span className={cx("flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 font-semibold text-white", dims)}>{letters || "?"}</span>;
}

/* -------------------------------------------------------------------- forms */
export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 " +
  "focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export function Field({ label, hint, error, required, className, children }) {
  return (
    <label className={cx("block", className)}>
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}{required && <span className="text-rose-500"> *</span>}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export const Input = forwardRef(function Input({ className, invalid, ...rest }, ref) {
  return <input ref={ref} className={cx(inputClass, invalid && "border-rose-400 focus:border-rose-500 focus:ring-rose-100", className)} {...rest} />;
});

export const Select = forwardRef(function Select({ className, children, ...rest }, ref) {
  return <select ref={ref} className={cx(inputClass, "pr-8", className)} {...rest}>{children}</select>;
});

export const Textarea = forwardRef(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cx(inputClass, "min-h-[96px] resize-y", className)} {...rest} />;
});

export function Segmented({ value, onChange, options, className }) {
  return (
    <div className={cx("inline-flex rounded-xl bg-slate-100 p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cx("rounded-lg px-4 py-1.5 text-sm font-semibold transition", value === o.value ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- feedback */
const ALERTS = {
  info: ["border-sky-200 bg-sky-50 text-sky-800", Info],
  success: ["border-emerald-200 bg-emerald-50 text-emerald-800", CheckCircle2],
  warning: ["border-amber-200 bg-amber-50 text-amber-800", TriangleAlert],
  error: ["border-rose-200 bg-rose-50 text-rose-800", AlertCircle],
};
export function Alert({ tone = "info", children, className }) {
  const [style, Icon] = ALERTS[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm", style, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Spinner({ label = "Loading…", className }) {
  return (
    <div className={cx("flex items-center justify-center gap-2 py-10 text-sm text-slate-500", className)}>
      <Loader2 className="h-5 w-5 animate-spin text-indigo-500" /> {label}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      {Icon && <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Icon className="h-6 w-6" /></span>}
      <p className="font-semibold text-slate-700">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, color = "bg-indigo-500", className }) {
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("h-full rounded-full transition-all duration-500", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  const width = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx("animate-fade-up w-full rounded-2xl bg-white shadow-2xl", width)}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
