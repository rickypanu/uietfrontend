import { useEffect, useState } from "react";
import api from "../services/api";
import { User, GraduationCap, Loader2,  Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function Login() {
  const [role, setRole] = useState("student");
  const [userId, setUserId] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  // Reload once to avoid first-load issue
  useEffect(() => {
    if (!sessionStorage.getItem("loginPageReloadedOnce")) {
      sessionStorage.setItem("loginPageReloadedOnce", "true");
      setTimeout(() => window.location.reload(), 500);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const url = role === "student" ? "/login/student" : "/login/teacher";
      const payload = role === "student"
        ? { roll_no: userId.trim().toUpperCase(), dob }
        : { employee_id: userId.trim().toUpperCase(), dob };

      await api.post(url, payload);

      // 🧹 Clear old data & store fresh
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      localStorage.setItem("role", role);
      localStorage.setItem("userId", userId.trim().toUpperCase());

      // navigate(location.role === "student" ? "/student" : "/teacher");
      window.location.href = role === "student" ? "/student" : "/teacher";

    } catch (err) {
      console.error("Login error:", err);
      let detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        detail = detail.map(d => d.msg).join(", ");
      }
      setMessage(detail || "Login failed.");
    }
    setLoading(false);
  };

  return (

    <div
      className="flex items-center justify-center bg-gradient-to-b from-blue-200 to-blue-400 px-3 py-6"
      style={{ minHeight: "100dvh" }}>
      <div className="w-full max-w-sm sm:max-w-md bg-white/90 backdrop-blur p-6 sm:p-8 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <GraduationCap size={40} className="text-blue-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-800">Login Portal</h2>
          <p className="text-gray-500 text-sm">Welcome back! Please sign in</p>
        </div>

        {/* Role toggle */}
        <div className="flex justify-center mb-6 gap-2">
          {["student", "teacher"].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex items-center gap-1 px-4 py-2 rounded-full transition 
                ${role === r ? "bg-blue-500 text-white shadow" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            >
              <User size={16} />
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Login ID</label>
            <input
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={role === "student" ? "Roll Number" : "Employee ID"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm mb-1">Password (DOB)</label>
            <input
              required
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full flex items-center justify-center bg-blue-500 text-white py-2 rounded-full hover:bg-blue-600 transition"
          >
            {loading && <Loader2 size={18} className="animate-spin mr-2" />}
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Error message */}
        {message && (
          <p className="mt-4 text-center text-sm text-red-500">{message}</p>
        )}
       <div className="mt-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 hover:underline transition"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
