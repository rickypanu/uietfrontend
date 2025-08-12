import React, { useEffect, useState } from "react";
import { markAttendance, getStudentAttendance } from "../services/api";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { getFingerprint } from "../services/getFingerprint";
import Sidebar from "../components/Sidebar";
import { SUBJECTS } from "../constants/subjects";
import {
  LogOut,
  UserRound,
  Menu,
  CheckCircle,
  CalendarCheck,
  AlertCircle,
  FileDown,
  Filter,
  GraduationCap,
} from "lucide-react";

export default function StudentDashboard() {
  const [otp, setOtp] = useState("");
  const [subject, setSubject] = useState("");
  const [attendanceList, setAttendanceList] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpInfo, setOtpInfo] = useState(null);
  const [otpError, setOtpError] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [profile, setProfile] = useState(null);
  const [otpPasteMessage, setOtpPasteMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const roll_no = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");

    if (!userId || role !== "student") {
      navigate("/login");
    } else {
      fetchProfile();
      loadAttendance();
      fetchUnreadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/student/profile/${roll_no}`);
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const res = await api.get(`/student/notifications/unread/${roll_no}`);
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.error("Failed to fetch unread notifications", err);
    }
  };

  useEffect(() => {
    if (otp.length > 0) {
      checkOtp();
    } else {
      setOtpInfo(null);
      setOtpError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const getAvailableSubjects = () => {
    if (!profile || !profile.branch || !profile.semester) return [];
    const course = profile.course.toUpperCase();
    const branch = profile.branch.toUpperCase();
    const sem = String(profile.semester);
    return SUBJECTS?.[course]?.[branch]?.[sem] || [];
  };

  const checkOtp = async () => {
    try {
      const res = await api.get(`/student/check-otp/${otp}`);
      setOtpInfo(res.data);
      setOtpError("");
    } catch (err) {
      setOtpInfo(null);
      setOtpError("❌ Invalid OTP or expired");
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadAttendance = async (subjectFilter, dateFilter) => {
    try {
      let data = await getStudentAttendance(roll_no);
      if (subjectFilter) {
        data = data.filter(
          (a) => a.subject.toLowerCase() === subjectFilter.toLowerCase()
        );
      }
      if (dateFilter) {
        data = data.filter(
          (a) =>
            new Date(a.marked_at).toDateString() ===
            new Date(dateFilter).toDateString()
        );
      }
      setAttendanceList(data || []);
    } catch (err) {
      console.error("Failed to load attendance", err);
      setMessage("❌ Failed to load attendance.");
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!roll_no || !otp || !subject) {
      setMessage("❌ Please fill all fields before marking attendance.");
      return;
    }
    setLoading(true);
    try {
      const visitorId = await getFingerprint();
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      );
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      await markAttendance(roll_no, subject, otp, visitorId, lat, lng);
      setMessage("Attendance marked successfully!");
      setOtp("");
      setSubject("");
      loadAttendance(filterSubject, filterDate);
    } catch (err) {
      let detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        detail = detail.map((d) => d.msg).join(", ");
      }
      setMessage(detail || "❌ Failed to mark attendance.");
    }
    setLoading(false);
  };

  const handleExport = () => {
    if (attendanceList.length === 0) {
      setMessage("⚠️ No attendance data to export.");
      return;
    }

    if (!profile) {
      setMessage("❌ Profile not loaded yet.");
      return;
    }

    const metaRows = [
      [`Name:,${profile.full_name}`],
      [`Roll No:,${profile.roll_no || ""}`],
      [`Department:,${profile.department || ""}`],
      [`Course:,${profile.course || ""}`],
      [`Branch:,${profile.branch || ""}`],
      [`Semester:,${profile.semester || ""}`],
      [`Section:,${profile.section || ""}`],
      [`DOB:,${profile.dob || ""}`],
      [],
    ];

    const headers = ["Subject", "Marked At", "Time"];
    const dataRows = attendanceList.map((a) => [
      a.subject,
      new Date(a.marked_at).toLocaleString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [...metaRows, headers, ...dataRows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute(
      "download",
      `attendance_${profile.roll_no}_${new Date().toISOString()}.csv`
    );
    link.href = encodedUri;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
  <div className="flex min-h-screen bg-gray-50">
    {/* Sidebar */}
    {/* <Sidebar onLogout={handleLogout} /> */}

    {/* Main Content */}
    <div className="flex-1 min-h-screen w-full bg-gradient-to-b from-green-50 to-green-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex justify-between items-center sticky top-0 bg-green-50/80 backdrop-blur-md p-4 rounded-xl shadow z-10">
          <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-green-800">
            <GraduationCap className="w-8 h-8 text-green-600" />
            Student Dashboard
          </h1>

          <div className="flex items-center gap-3">
            {/* Profile */}
            <button
              onClick={() => navigate("/student/profile")}
              aria-label="Profile"
              className="p-2 rounded-full hover:bg-green-100 transition"
            >
              <UserRound className="w-6 h-6 text-green-700" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate("/student/notifications")}
              aria-label="Notifications"
              className="relative p-2 rounded-full hover:bg-green-100 transition"
            >
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* About */}
            <button
              onClick={() => navigate("/student/about")}
              aria-label="How to Use"
              className="p-2 rounded-full hover:bg-green-100 transition"
            >
              <Menu className="w-6 h-6 text-blue-600" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2 font-medium shadow"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </header>

        {/* Profile Card */}
        <section className="bg-white rounded-2xl shadow p-6 flex flex-col sm:flex-row items-center gap-4">
          <UserRound className="text-green-500 w-12 h-12 flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-semibold text-blue-700">
              {profile ? profile.full_name : "Loading..."}
            </h2>
            <p className="text-gray-500">{profile?.roll_no}</p>
          </div>
        </section>

        {/* Mark Attendance */}
        <section className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <CheckCircle className="text-green-500 w-5 h-5" />
            Enter OTP to Mark Attendance
          </h2>

          <form
            onSubmit={handleMarkAttendance}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400"
              required
            >
              <option value="" disabled>
                Select Subject
              </option>
              {getAvailableSubjects().map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                setOtpPasteMessage(
                  "⚠️ Pasting is disabled. Type the OTP like a real human."
                );
                setTimeout(() => setOtpPasteMessage(""), 5000);
              }}
              placeholder="Enter OTP"
              className={`p-2 border rounded-lg focus:ring-2 ${
                otpError
                  ? "border-red-400 focus:ring-red-300"
                  : otpInfo
                  ? "border-green-400 focus:ring-green-300"
                  : "border-gray-300 focus:ring-green-400"
              }`}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-2 rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 font-semibold"
            >
              {loading ? "Marking..." : "Mark Attendance"}
            </button>
          </form>

          {otpPasteMessage && (
            <p className="text-yellow-700 text-sm">{otpPasteMessage}</p>
          )}
          {otpError && <p className="text-red-600">{otpError}</p>}
          {message && (
            <p
              className={`text-sm font-medium ${
                message.includes("success")
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </section>

        {/* Filters */}
        <section className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Filter className="w-5 h-5 text-green-500" /> Filter Attendance
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400"
            >
              <option value="">All Subjects</option>
              {getAvailableSubjects().map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400"
            />

            <button
              onClick={() => loadAttendance(filterSubject, filterDate)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md font-medium"
            >
              Apply
            </button>

            <button
              onClick={() => {
                setFilterSubject("");
                setFilterDate("");
                loadAttendance();
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg shadow-md font-medium"
            >
              Reset
            </button>
          </div>
        </section>

        {/* Attendance History */}
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CalendarCheck className="text-green-500 w-5 h-5" />
            Attendance History
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border border-gray-200 rounded-lg">
              <thead className="bg-gray-100 text-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 border">Subject</th>
                  <th className="px-4 py-3 border">Date</th>
                  <th className="px-4 py-3 border">Time</th>
                </tr>
              </thead>
              <tbody>
                {attendanceList.length > 0 ? (
                  attendanceList.map((a, idx) => {
                    const markedAt = new Date(a.marked_at);
                    return (
                      <tr
                        key={idx}
                        className={`${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-green-50 transition-all`}
                      >
                        <td className="px-4 py-2 border font-medium text-gray-800">
                          {a.subject.toUpperCase()}
                        </td>
                        <td className="px-4 py-2 border text-gray-700">
                          {markedAt.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 border text-gray-700">
                          {markedAt.toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      className="text-center p-4 text-gray-500"
                    >
                      No attendance marked yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Export Button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all font-medium"
            >
              <FileDown className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
);

}
