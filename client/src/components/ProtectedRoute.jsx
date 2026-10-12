import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

const LOGIN_PATH = { student: "/login", teacher: "/login", admin: "/admin/login" };

/** Renders its child routes only for a logged-in user with the right role. */
export default function ProtectedRoute({ role }) {
  const { role: current } = useAuth();
  const location = useLocation();
  if (current === role) return <Outlet />;
  // Logged in as someone else -> send them to their own area instead of a login form.
  if (current) return <Navigate to={current === "admin" ? "/admin" : `/${current}`} replace />;
  return <Navigate to={LOGIN_PATH[role]} replace state={{ from: location.pathname }} />;
}
