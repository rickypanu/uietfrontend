import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, User } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Alert, Button, Card, Field, Input } from "../../components/ui";

export default function AdminLogin() {
  const { role, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (role === "admin") return <Navigate to="/admin" replace />;

  const requestOtp = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post("/admin/request-otp", { user_id: adminId.trim(), password });
      setStep(2);
      setOtp("");
      setMessage({ tone: "success", text: "We emailed a 6-digit code to the admin address. It is valid for 5 minutes." });
    } catch (err) {
      setMessage({ tone: "error", text: errorMessage(err, "Could not request an OTP.") });
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post("/admin/verify-otp", { user_id: adminId.trim(), otp: otp.trim() });
      login(res.data);
      navigate("/admin", { replace: true });
    } catch (err) {
      setMessage({ tone: "error", text: errorMessage(err, "OTP verification failed.") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <Card className="p-6 shadow-2xl sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"><ShieldCheck className="h-8 w-8" /></span>
            <h1 className="text-2xl font-bold text-slate-900">Admin sign-in</h1>
            <p className="mt-1 text-sm text-slate-500">{step === 1 ? "Step 1 of 2 · Enter your credentials" : "Step 2 of 2 · Enter the emailed code"}</p>
          </div>

          {message && <Alert tone={message.tone} className="mb-4">{message.text}</Alert>}

          {step === 1 ? (
            <form onSubmit={requestOtp} className="space-y-4">
              <Field label="Admin ID" required>
                <div className="relative"><User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="pl-10" value={adminId} onChange={(e) => setAdminId(e.target.value)} autoComplete="username" required autoFocus /></div>
              </Field>
              <Field label="Password" required>
                <div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="px-10" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
                  <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              </Field>
              <Button type="submit" size="lg" loading={loading} icon={Mail} className="w-full">{loading ? "Sending code…" : "Email me a code"}</Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <Field label="6-digit code" required>
                <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" className="text-center text-xl font-semibold tracking-[0.5em]" required autoFocus />
              </Field>
              <Button type="submit" size="lg" variant="success" loading={loading} icon={KeyRound} className="w-full" disabled={otp.length !== 6}>{loading ? "Verifying…" : "Verify & sign in"}</Button>
              <div className="flex justify-between text-sm">
                <button type="button" onClick={() => { setStep(1); setMessage(null); }} className="text-slate-500 hover:text-indigo-600">← Back</button>
                <button type="button" onClick={requestOtp} disabled={loading} className="font-medium text-indigo-600 hover:underline disabled:opacity-50">Resend code</button>
              </div>
            </form>
          )}
        </Card>
        <Link to="/" className="mt-5 flex items-center justify-center gap-1 text-sm text-indigo-200 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
      </div>
    </div>
  );
}
