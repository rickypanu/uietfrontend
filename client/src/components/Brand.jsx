import { Check } from "lucide-react";
import { cx } from "./ui";

export function Logo({ size = "md", light = false, className }) {
  const box = size === "lg" ? "h-12 w-12 rounded-2xl" : "h-9 w-9 rounded-xl";
  return (
    <div className={cx("flex items-center gap-2.5", className)}>
      <span className={cx("flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30", box)}>
        <Check className={size === "lg" ? "h-7 w-7" : "h-5 w-5"} strokeWidth={3} />
      </span>
      <span className={cx("font-bold leading-tight", size === "lg" ? "text-xl" : "text-base", light ? "text-white" : "text-slate-900")}>
        UIET Attendance
        <span className={cx("block text-[10px] font-medium uppercase tracking-wider", light ? "text-indigo-200" : "text-slate-400")}>Panjab University</span>
      </span>
    </div>
  );
}

export function Footer({ className }) {
  return (
    <footer className={cx("py-6 text-center text-xs text-slate-400", className)}>
      © {new Date().getFullYear()} UIET, Panjab University, Chandigarh ·{" "}
      <a className="hover:text-indigo-600 hover:underline" href="https://uiet.puchd.ac.in/" target="_blank" rel="noopener noreferrer">uiet.puchd.ac.in</a>
    </footer>
  );
}
