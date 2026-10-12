import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SESSION_KEY, readStoredSession } from "./api";

const AuthContext = createContext(null);

function tokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function loadSession() {
  // Earlier versions kept the role, id and even the date of birth (the password!) in localStorage.
  ["role", "userId", "dob", "token", "admin_id"].forEach((k) => localStorage.removeItem(k));
  const session = readStoredSession();
  if (!session?.token) return null;
  const exp = tokenExpiry(session.token);
  if (exp && exp <= Date.now()) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return session;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  const login = useCallback((data) => {
    const next = { token: data.access_token, role: data.role, id: data.user_id, name: data.full_name || "" };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  // End the session when the server says the token is invalid, or when it expires.
  useEffect(() => {
    window.addEventListener("uiet:session-expired", logout);
    return () => window.removeEventListener("uiet:session-expired", logout);
  }, [logout]);

  useEffect(() => {
    const exp = session ? tokenExpiry(session.token) : null;
    if (!exp) return undefined;
    const timer = setTimeout(logout, Math.max(0, Math.min(exp - Date.now(), 2 ** 31 - 1)));
    return () => clearTimeout(timer);
  }, [session, logout]);

  const value = useMemo(() => ({ session, role: session?.role ?? null, userId: session?.id ?? null, login, logout }), [session, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
