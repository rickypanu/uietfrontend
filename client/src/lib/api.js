import axios from "axios";

export const API_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");
export const SESSION_KEY = "uiet.session";

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

export function readStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const session = readStoredSession();
  if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

// An expired / invalid token on a protected call ends the session everywhere (see AuthProvider).
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || "";
    const isLoginCall = /\/login\/|\/admin\/(request|verify)-otp/.test(url);
    if (error.response?.status === 401 && !isLoginCall && readStoredSession()) {
      window.dispatchEvent(new Event("uiet:session-expired"));
    }
    return Promise.reject(error);
  }
);

/** Turn any axios / FastAPI error into a readable sentence. */
export function errorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (!err) return fallback;
  if (err.code === "ECONNABORTED") return "The server took too long to respond. Please try again.";
  if (!err.response) return err.message === "Network Error" ? "Cannot reach the server. Check your connection." : err.message || fallback;
  const detail = err.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : "";
        const msg = String(d.msg || "").replace(/^Value error, /, "");
        return field && field !== "body" ? `${String(field).replace(/_/g, " ")}: ${msg}` : msg;
      })
      .join(" · ");
  }
  return fallback;
}

/** Field → message map for 422 responses (used by the registration form). */
export function fieldErrors(err) {
  const detail = err?.response?.data?.detail;
  const out = {};
  if (Array.isArray(detail)) {
    detail.forEach((d) => {
      const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
      if (field && field !== "body") out[field] = String(d.msg || "").replace(/^Value error, /, "");
    });
  }
  return out;
}

export const fileUrl = (path) => (!path ? "" : /^https?:/.test(path) ? path : `${API_URL}${path}`);
export const photoSrc = (profile) => (profile?.photo ? `data:${profile.photo_type || "image/jpeg"};base64,${profile.photo}` : null);

export default api;
