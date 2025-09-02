import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { User, Lock, Eye, EyeOff, Shield, Key,Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminLogin() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // step 1: login, step 2: verify OTP
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await api.post("/admin/request-otp", {
        user_id: adminId,
        password: password,
      });
      setStep(2); // move to OTP verification
      setMessage("OTP sent to admin email. Please check your inbox.");
    } catch (err) {
      setMessage(
        err.response?.data?.detail || "Failed to request OTP. Please check credentials."
      );
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post("/admin/verify-otp", {
        user_id: adminId,
        otp: otp,
      });
      const token = res.data.access_token;
      localStorage.setItem("token", token);
      localStorage.setItem("role", "admin");
      navigate("/admin/dashboard");
    } catch (err) {
      setMessage(
        err.response?.data?.detail || "OTP verification failed."
      );
    }
    setLoading(false);
  };

  return (
       <div className="flex items-center justify-center bg-gradient-to-b from-blue-200 to-blue-400 px-4"
        style={{ minHeight: "100dvh" }}>
      <div className="w-full max-w-md bg-white/90 backdrop-blur p-8 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <Shield className="w-12 h-12 text-blue-600 mb-2" />
          <h2 className="text-3xl font-semibold text-gray-800">Admin Login</h2>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 ? "Login to request OTP" : "Enter OTP to verify"}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="flex items-center border rounded px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <input
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value.replace(/\s+/g, ""))}
                placeholder="Admin ID"
                className="w-full outline-none text-gray-700 bg-transparent"
              />
            </div>
            <div className="flex items-center border rounded px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
              <Lock className="w-5 h-5 text-gray-400 mr-2" />
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full outline-none text-gray-700 bg-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition duration-200 shadow-md"
            >
              {loading ? "Requesting OTP..." : "Request OTP"}
            </button>
            
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="flex items-center border rounded px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
              <Key className="w-5 h-5 text-gray-400 mr-2" />
              <input
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\s+/g, ""))}
                placeholder="Enter OTP"
                className="w-full outline-none text-gray-700 bg-transparent"
              />

            </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl transition duration-200 shadow-md"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-blue-600 hover:underline mt-1"
            >
              Back to login
            </button>
          </form>
        )}

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
