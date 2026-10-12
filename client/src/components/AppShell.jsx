import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell, BookOpen, CircleHelp, GraduationCap, Layers, LayoutDashboard, LineChart, LogOut,
  Megaphone, Menu, ShieldCheck, Upload, UserCircle, X,
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { Avatar, cx } from "./ui";
import { Footer, Logo } from "./Brand";

const NAV = {
  student: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/student/analysis", label: "Analysis", icon: LineChart },
    { to: "/student/notifications", label: "Notifications", icon: Bell, badge: true },
    { to: "/student/profile", label: "Profile", icon: UserCircle },
    { to: "/student/help", label: "How to use", icon: CircleHelp },
  ],
  teacher: [
    { to: "/teacher", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/teacher/classes", label: "Classes & registers", icon: Layers },
    { to: "/teacher/notifications", label: "Notifications", icon: Megaphone },
    { to: "/teacher/profile", label: "Profile", icon: UserCircle },
    { to: "/teacher/help", label: "How to use", icon: CircleHelp },
  ],
  admin: [
    { to: "/admin", label: "Approvals", icon: ShieldCheck, end: true },
    { to: "/admin/bulk", label: "Bulk registration", icon: Upload },
    { to: "/admin/notifications", label: "Notifications", icon: Megaphone },
  ],
};
const ROLE_ICON = { student: GraduationCap, teacher: BookOpen, admin: ShieldCheck };

export default function AppShell({ role }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [photo, setPhoto] = useState(null);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const loadUnread = useCallback(() => {
    if (role !== "student") return;
    api.get("/student/notifications/unread-count").then((r) => setUnread(r.data.count || 0)).catch(() => {});
  }, [role]);

  useEffect(() => {
    loadUnread();
    const timer = setInterval(loadUnread, 60000);
    window.addEventListener("uiet:notifications-seen", loadUnread);
    return () => { clearInterval(timer); window.removeEventListener("uiet:notifications-seen", loadUnread); };
  }, [loadUnread]);

  useEffect(() => {
    if (role === "admin") return;
    api.get(`/${role}/profile/${session.id}`).then((r) => setPhoto(r.data.photo ? `data:${r.data.photo_type || "image/jpeg"};base64,${r.data.photo}` : null)).catch(() => {});
    const refresh = (e) => setPhoto(e.detail || null);
    window.addEventListener("uiet:photo-changed", refresh);
    return () => window.removeEventListener("uiet:photo-changed", refresh);
  }, [role, session.id]);

  const handleLogout = () => { logout(); navigate("/", { replace: true }); };
  const RoleIcon = ROLE_ICON[role];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-5"><Logo /></div>
      <div className="mx-4 mb-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
        <Avatar name={session.name || session.id} src={photo} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{session.name || (role === "admin" ? "Administrator" : session.id)}</p>
          <p className="flex items-center gap-1 truncate text-xs capitalize text-slate-500"><RoleIcon className="h-3 w-3" /> {role} · {session.id}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Main">
        {NAV[role].map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to} to={to} end={end}
            className={({ isActive }) => cx(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{label}</span>
            {badge && unread > 0 && <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{unread > 9 ? "9+" : unread}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50">
          <LogOut className="h-[18px] w-[18px]" /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white lg:block">{sidebar}</aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          {role === "student" && unread > 0 && (
            <button type="button" onClick={() => navigate("/student/notifications")} aria-label={`${unread} unread notifications`} className="relative rounded-lg p-2 text-slate-600">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
          )}
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><Menu className="h-6 w-6" /></button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="animate-fade-up absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Outlet /></main>
        <Footer />
      </div>
    </div>
  );
}

