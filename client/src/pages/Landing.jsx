import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, MapPin, QrCode, ShieldCheck, Smartphone, UserPlus } from "lucide-react";
import { Logo, Footer } from "../components/Brand";
import { useAuth } from "../lib/auth";

const FEATURES = [
  { icon: QrCode, title: "QR or OTP in seconds", text: "Teachers share a short-lived code; students scan or type it. No paper registers." },
  { icon: MapPin, title: "Must be in the room", text: "Attendance is only accepted close to where the class is being held." },
  { icon: Smartphone, title: "One device, one student", text: "Device checks make proxy attendance from a single phone easy to spot." },
];

export default function Landing() {
  const { role } = useAuth();
  const home = role === "admin" ? "/admin" : role ? `/${role}` : null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-950 via-indigo-900 to-violet-900 text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Logo light />
        <div className="flex items-center gap-2">
          {home ? (
            <Link to={home} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Open dashboard</Link>
          ) : (
            <>
              <Link to="/register" className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-indigo-100 hover:bg-white/10 sm:block">Register</Link>
              <Link to="/login" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Log in</Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-10 pt-8 sm:pt-16">
        <div className="animate-fade-up max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 ring-1 ring-white/20">
            <ShieldCheck className="h-3.5 w-3.5" /> Simple · Secure · Smart
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Attendance that takes <span className="bg-gradient-to-r from-sky-300 to-violet-300 bg-clip-text text-transparent">seconds</span>, not minutes.
          </h1>
          <p className="mt-5 text-lg text-indigo-100/90">
            The attendance portal for UIET, Panjab University. Mark attendance with a QR code or OTP, track your percentage, and get notices from your teachers — all in one place.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { to: "/login", icon: GraduationCap, title: "Student / Teacher", text: "Log in with your roll number or employee ID.", primary: true },
            { to: "/register", icon: UserPlus, title: "New here?", text: "Register and wait for admin approval." },
            { to: "/admin/login", icon: ShieldCheck, title: "Admin", text: "Approve users, send notices, bulk import." },
          ].map(({ to, icon: Icon, title, text, primary }) => (
            <Link
              key={to} to={to}
              className={`group rounded-2xl p-5 transition hover:-translate-y-0.5 ${primary ? "bg-white text-slate-900 shadow-xl shadow-black/20" : "bg-white/10 ring-1 ring-white/20 hover:bg-white/15"}`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${primary ? "bg-indigo-600 text-white" : "bg-white/15 text-white"}`}><Icon className="h-6 w-6" /></span>
              <h2 className="mt-4 flex items-center gap-2 text-lg font-semibold">{title}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></h2>
              <p className={`mt-1 text-sm ${primary ? "text-slate-500" : "text-indigo-100/80"}`}>{text}</p>
            </Link>
          ))}
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sky-300"><Icon className="h-5 w-5" /></span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-indigo-100/80">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer className="text-indigo-200/70" />
    </div>
  );
}
