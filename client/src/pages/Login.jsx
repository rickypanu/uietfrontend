import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Alert, Button, Card, Field, Input, Segmented } from "../components/ui";
import { Logo } from "../components/Brand";

export default function Login() {
  const { role: current, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState("student");
  const [userId, setUserId] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (current) return <Navigate to={current === "admin" ? "/admin" : `/${current}`} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const id = userId.trim().toUpperCase();
      const res = await api.post(`/login/${role}`, role === "student" ? { roll_no: id, dob } : { employee_id: id, dob });
      login(res.data);
      const from = location.state?.from;
      navigate(from && from.startsWith(`/${role}`) ? from : `/${role}`, { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Login failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 flex justify-center"><Logo size="lg" /></div>
        <Card className="p-6 shadow-xl shadow-indigo-100 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in with your ID and date of birth.</p>

          <Segmented className="mt-5 w-full [&>button]:flex-1" value={role} onChange={(v) => { setRole(v); setError(""); }} options={[{ value: "student", label: "Student" }, { value: "teacher", label: "Teacher" }]} />

          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label={role === "student" ? "Roll number" : "Employee ID"} required>
              <Input value={userId} onChange={(e) => setUserId(e.target.value.replace(/\s+/g, ""))} autoComplete="username" inputMode="numeric" placeholder={role === "student" ? "e.g. 123456" : "e.g. 100001"} required autoFocus />
            </Field>
            <Field label="Date of birth (your password)" required>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} required />
            </Field>
            {error && <Alert tone="error">{error}</Alert>}
            <Button type="submit" size="lg" loading={loading} icon={LogIn} className="w-full">{loading ? "Signing in…" : "Sign in"}</Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Not registered yet? <Link to="/register" className="font-semibold text-indigo-600 hover:underline">Create an account</Link>
          </p>
        </Card>
        <Link to="/" className="mt-5 flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
      </div>
    </div>
  );
}
