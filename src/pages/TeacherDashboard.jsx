// src/pages/TeacherDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  generateOtp,
  getAttendance,
  getGeneratedOtps,
} from "../services/api";
import { NavLink,useNavigate, Outlet } from "react-router-dom";
import api from "../services/api";
import {
  LogOut,
  User,
  KeyRound,
  ShieldCheck,
  BookOpenText,
  CalendarCheck2,
  FileDown,
  Filter,
  Bell,
  Clock,
  Plus,
  ChevronsDown,
  ChevronsUp,
} from "lucide-react";
import {
  UserCircle,
  Info,
  CalendarCheck,
  GraduationCap,
  Menu,
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from "lucide-react";

import Papa from "papaparse";
import TeacherSidebar from "../components/TeacherSidebar";
import { SUBJECTS } from "../constants/subjects";

export default function TeacherDashboard() {
  // --- state ---
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(5);
  const [otpList, setOtpList] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [profile, setProfile] = useState(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaysOtp, setTodaysOtps] = useState([]);
  const [selectedOtp, setSelectedOtp] = useState(null);
  const [course, setCourse] = useState("");
  const [otpCardOpen, setOtpCardOpen] = useState(true);

  const employeeId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // SUBJECTS helpers
  const branches = course ? Object.keys(SUBJECTS[course] || {}) : [];
  const semesters = course && branch ? Object.keys(SUBJECTS[course]?.[branch] || {}) : [];
  const subjects = course && branch && semester ? SUBJECTS[course]?.[branch]?.[semester] || [] : [];

  // quick derived values for stats
  const todayISO = new Date().toISOString().split("T")[0];
  const todaysOtpsFiltered = otpList.filter(
    (o) => new Date(o.end_time).toISOString().split("T")[0] === todayISO
  );
  const latestOtp = todaysOtpsFiltered.length > 0 ? todaysOtpsFiltered[0] : null;
  const liveAttendanceCount = latestOtp ? attendanceList.filter((a) => a.otp === latestOtp.otp).length : 0;
  const classesToday = todaysOtp.length;
  const attendanceMarkedToday = attendanceList.filter(
    (a) => new Date(a.marked_at).toISOString().split("T")[0] === todayISO
  ).length;
  const pendingClasses = otpList.filter((o) => new Date(o.end_time) > new Date()).length;

  // refs for timers so we can clear
  const attendanceTimerRef = useRef(null);
  const todaysOtpTimerRef = useRef(null);

  // ------- effects -------
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");
    if (!userId || role !== "teacher") {
      navigate("/login");
    } else {
      loadOtps();
      fetchProfile();
      loadAttendance();
      loadTodaysOtps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // current time every second
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // attendance polling (every 5s)
  useEffect(() => {
    attendanceTimerRef.current = setInterval(() => {
      loadAttendance();
    }, 5000);
    return () => clearInterval(attendanceTimerRef.current);
  }, []);

  // today's OTPs polling (every 5s)
  useEffect(() => {
    todaysOtpTimerRef.current = setInterval(() => {
      loadTodaysOtps();
    }, 5000);
    return () => clearInterval(todaysOtpTimerRef.current);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 15000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ------- API calls -------
  const fetchProfile = async () => {
    try {
      const res = await api.get(`/teacher/profile/${employeeId}`);
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const loadOtps = async () => {
    try {
      const res = await api.get(`/teacher/active-otps/${employeeId}`);
      const sorted = res.data.sort((a, b) => new Date(b.end_time) - new Date(a.end_time));
      setOtpList(sorted);
    } catch (err) {
      console.error("Failed to load active OTPs", err);
    }
  };

  const loadAttendance = async () => {
    try {
      const data = await getAttendance(employeeId);
      setAttendanceList(data);
    } catch (err) {
      console.error("Failed to load attendance", err);
    }
  };

  const loadTodaysOtps = async () => {
    try {
      const res = await api.get(`/teacher/todays-otps/${employeeId}`);
      setTodaysOtps(res.data || []);
    } catch (err) {
      console.error("Error loading today's OTPs:", err);
    }
  };

  // ------- event handlers -------
  const handleGenerateOtp = async (e) => {
    e.preventDefault();

    if (!branch || !semester || !subject || !course) {
      setMessage("❌ Please select course, branch, semester, and subject.");
      return;
    }

    setLoading(true);
    setMessage("📡 Getting accurate location... Please wait.");

    let watchId = null;
    let gotAccurateLocation = false;

    try {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setMessage(`📍 Accuracy: ${Math.round(accuracy)} meters`);

          if (accuracy <= 1000 && !gotAccurateLocation) {
            gotAccurateLocation = true;
            navigator.geolocation.clearWatch(watchId);

            try {
              const data = await generateOtp(
                employeeId,
                course,
                branch,
                semester,
                subject,
                duration,
                latitude,
                longitude
              );

              const newOtp = {
                otp: data.otp,
                subject: data.subject,
                end_time: data.valid_till,
              };

              setOtpList((prev) =>
                [newOtp, ...prev]
                  .filter((item) => new Date(item.end_time) > new Date())
                  .sort((a, b) => new Date(b.end_time) - new Date(a.end_time))
              );

              setMessage(
                `✅ OTP Generated: ${data.otp} (valid till: ${new Date(
                  data.valid_till
                ).toLocaleString()})`
              );

              // update today's otps quickly
              loadTodaysOtps();
            } catch (error) {
              console.error("Generate OTP error:", error);
              setMessage(error?.response?.data?.detail || "❌ Failed to generate OTP");
            } finally {
              setLoading(false);
            }
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setMessage("❌ Failed to get location. Please allow location access and try again.");
          setLoading(false);
          if (watchId) navigator.geolocation.clearWatch(watchId);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } catch (err) {
      console.error("Unexpected error:", err);
      setMessage("❌ Something went wrong.");
      setLoading(false);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    }
  };

  const handleExport = () => {
    const filtered = attendanceList.filter((a) => {
      if (filterDate) {
        const date = new Date(a.marked_at).toISOString().split("T")[0];
        return date === filterDate;
      }
      if (filterMonth) {
        const month = new Date(a.marked_at).toISOString().slice(0, 7);
        return month === filterMonth;
      }
      return true;
    });

    if (filtered.length === 0) {
      setMessage("❌ No attendance records to export.");
      return;
    }

    const csv = Papa.unparse(
      filtered.map((a) => ({
        RollNo: a.roll_no,
        Subject: a.subject.toUpperCase(),
        MarkedAt: new Date(a.marked_at).toLocaleString(),
      }))
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance_${employeeId}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // small UI helper components
  const SectionTitle = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, accent = "bg-blue-50" }) => (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition">
      <div className={`p-2 rounded-md ${accent} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <div className="text-left">
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );

  const navLinks = [
    { to: "/teacher/profile", icon: <UserCircle className="w-5 h-5" />, label: "Profile" },
    { to: "/teacher/about", icon: <Info className="w-5 h-5" />, label: "How to Use" },
    { to: "/teacher/send-notification", icon: <Megaphone className="w-5 h-5" />, label: "Send Notification" },
    { to: "/teacher", icon: <CalendarCheck className="w-5 h-5" />, label: "Dashboard" },
  ];
  // --- render ---
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      {/* <TeacherSidebar profile={profile} /> */}

      {/* Content */}
      <div className="flex-1 p-4 sm:ml-2">
        {/* Top header */}
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Teacher Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 bg-white px-3 py-2 rounded-lg shadow-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <div className="text-sm text-gray-700 font-medium">{currentTime.toLocaleTimeString()}</div>
            </div>

            <button
              onClick={() => setOtpCardOpen((s) => !s)}
              className="hidden sm:inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              Quick OTP
            </button>

            <div className="flex items-center gap-3">
              {/* <button className="p-2 rounded-md hover:bg-gray-100 transition">
                <Bell className="w-5 h-5 text-gray-600" />
              </button> */}
              <button
                onClick={() => navigate("/teacher/send-notification")}
                className="p-2 rounded-md hover:bg-gray-100 transition"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600" />
              </button>

              {/* <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-full shadow-sm">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold">
                  {(profile?.full_name?.[0] || "T").toUpperCase()}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-800">{profile?.full_name || "Loading..."}</div>
                  <div className="text-xs text-gray-500">{employeeId}</div>
                </div>
              </div> */}

              <div
                onClick={() => navigate("/teacher/profile")}
                className="flex items-center gap-2 bg-white px-2 py-1 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 transition"
                title="Go to Profile"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold">
                  {(profile?.full_name?.[0] || "T").toUpperCase()}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-800">{profile?.full_name || "Loading..."}</div>
                  <div className="text-xs text-gray-500">{employeeId}</div>
                </div>
              </div>

              <div
                onClick={() => navigate("/teacher/about")}
                className="flex items-center gap-2 bg-white px-2 py-1 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 transition"
                title="Learn How to Use"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-800">How to Use</div>
                  <div className="text-xs text-gray-500">Guide & Tips</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="hidden md:inline-flex items-center gap-2 bg-rose-500 text-white px-3 py-2 rounded-lg hover:bg-rose-600 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Page content container */}
        <div className="max-w-7xl mx-auto mt-6 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={BookOpenText} label="Classes Today" value={classesToday} />
            <StatCard icon={CalendarCheck2} label="Attendance Marked (Today)" value={attendanceMarkedToday} accent="bg-emerald-50" />
            <StatCard icon={KeyRound} label="Active OTPs" value={pendingClasses} accent="bg-yellow-50" />
            <StatCard icon={ShieldCheck} label="Live Present (Latest OTP)" value={liveAttendanceCount} accent="bg-purple-50" />
          </div>

          {/* Message / Toast */}
          {message && (
            <div className={`rounded-md p-3 ${message.startsWith("✅") ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
              {message}
            </div>
          )}

          {/* OTP generator (collapsible) */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <SectionTitle icon={KeyRound} title="Generate OTP for Class" subtitle="Create a time-bound OTP for attendance marking" />
              <button
                onClick={() => setOtpCardOpen((s) => !s)}
                className="p-2 rounded-md hover:bg-gray-100 transition"
                aria-expanded={otpCardOpen}
              >
                {otpCardOpen ? <ChevronsUp className="w-5 h-5 text-gray-600" /> : <ChevronsDown className="w-5 h-5 text-gray-600" />}
              </button>
            </div>

            {otpCardOpen && (
              <form onSubmit={handleGenerateOtp} className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Course</label>
                  <select
                    value={course}
                    onChange={(e) => {
                      setCourse(e.target.value);
                      setBranch("");
                      setSemester("");
                      setSubject("");
                    }}
                    className="p-2 border rounded-md w-full"
                    required
                  >
                    <option value="">Select Course</option>
                    {Object.keys(SUBJECTS).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-600 mb-1">Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => {
                      setBranch(e.target.value);
                      setSemester("");
                      setSubject("");
                    }}
                    className="p-2 border rounded-md w-full"
                    required
                  >
                    <option value="">Select</option>
                    {branches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-600 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => {
                      setSemester(e.target.value);
                      setSubject("");
                    }}
                    disabled={!branch}
                    className="p-2 border rounded-md w-full"
                    required
                  >
                    <option value="">Select</option>
                    {semesters.map((sem) => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-600 mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={!semester}
                    className="p-2 border rounded-md w-full"
                    required
                  >
                    <option value="">Select</option>
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-600 mb-1">Validity (mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="p-2 border rounded-md w-full"
                    required
                  />
                </div>

                <div className="md:col-span-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition inline-flex items-center gap-2"
                  >
                    {loading ? "Generating..." : "Generate OTP"}
                    <KeyRound className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Split: Today's OTPs + Students Marked */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Today's OTPs */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-4">
              <SectionTitle icon={BookOpenText} title="Today's OTPs" />
              <div className="mt-3">
                {todaysOtp.length === 0 ? (
                  <div className="text-sm text-gray-500">No OTPs generated yet</div>
                ) : (
                  <ul className="space-y-2 max-h-52 overflow-y-auto pr-2">
                    {todaysOtp
                      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
                      .map((otpItem, index) => {
                        const formattedTime = otpItem.start_time
                          ? new Date(otpItem.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
                          : "No Time";
                        return (
                          <li
                            key={index}
                            onClick={() => setSelectedOtp(otpItem.otp)}
                            className={`cursor-pointer p-2 rounded-md border ${selectedOtp === otpItem.otp ? "border-indigo-300 bg-indigo-50" : "border-gray-100 bg-gray-50"} hover:shadow-sm transition flex justify-between items-center`}
                          >
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{otpItem.otp} <span className="text-xs text-gray-500">— {otpItem.subject}</span></div>
                              <div className="text-xs text-gray-500">{formattedTime}</div>
                            </div>
                            <div className="text-xs text-gray-400">{(new Date(otpItem.start_time)).toLocaleTimeString?.() || ""}</div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            </div>

            {/* Students Marked (center) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <SectionTitle icon={CalendarCheck2} title="Students Marked" subtitle={selectedOtp ? `Showing students for OTP: ${selectedOtp}` : "Select an OTP to view students"} />
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600">Selected OTP count</div>
                  <div className="text-xl font-bold text-indigo-600">{selectedOtp ? attendanceList.filter((r) => r.otp === selectedOtp).length : "-"}</div>
                </div>
              </div>

              <div className="mt-4">
                {selectedOtp ? (
                  <ul className="space-y-3 max-h-44 overflow-y-auto pr-2">
                    {attendanceList.filter((r) => r.otp === selectedOtp).length > 0 ? (
                      attendanceList
                        .filter((r) => r.otp === selectedOtp)
                        .sort((a, b) => a.roll_no.localeCompare(b.roll_no, undefined, { numeric: true }))
                        .map((record, idx) => (
                          <li key={idx} className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-md hover:bg-gray-100 transition">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
                              {record.student_name
                                ? record.student_name.split(" ").map((n) => n[0]).join("").toUpperCase()
                                : (record.roll_no || "R")[0]}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-800">{record.student_name || "Unknown"}</div>
                              <div className="text-xs text-gray-500">{record.roll_no}</div>
                            </div>
                            <div className="text-xs text-gray-500">{new Date(record.marked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                          </li>
                        ))
                    ) : (
                      <div className="text-sm text-gray-500">No students marked yet for this OTP</div>
                    )}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">Click an OTP on the left to see students who marked attendance.</div>
                )}
              </div>
            </div>
          </div>

          {/* Filters & Export */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <SectionTitle icon={Filter} title="Filter & Export Attendance Records" />
            <div className="mt-3 flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1">
                <label className="text-xs text-gray-600">Filter by Date</label>
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="p-2 border rounded-md w-full" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-600">Filter by Month</label>
                <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="p-2 border rounded-md w-full" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setFilterDate(""); setFilterMonth(""); }} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition">Clear</button>
                <button onClick={handleExport} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition inline-flex items-center gap-2"><FileDown className="w-4 h-4" /> Export CSV</button>
              </div>
            </div>
          </div>

          {/* Attendance table */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <SectionTitle icon={CalendarCheck2} title="Attendance Marked by Students" />
            <div className="mt-4 overflow-auto border rounded-md">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">Roll No</th>
                    <th className="px-4 py-3 text-left">Student Name</th>
                    <th className="px-4 py-3 text-left">Subject</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceList.length > 0 ? (
                    attendanceList
                      .filter((a) => {
                        if (filterDate) {
                          const date = new Date(a.marked_at).toISOString().split("T")[0];
                          return date === filterDate;
                        }
                        if (filterMonth) {
                          const month = new Date(a.marked_at).toISOString().slice(0, 7);
                          return month === filterMonth;
                        }
                        return true;
                      })
                      .sort((a, b) => new Date(b.marked_at) - new Date(a.marked_at))
                      .map((a, idx) => {
                        const markedDate = new Date(a.marked_at);
                        const isEven = idx % 2 === 0;
                        return (
                          <tr key={idx} className={`${isEven ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition`}>
                            <td className="px-4 py-2 border-t">{a.roll_no}</td>
                            <td className="px-4 py-2 border-t">{a.student_name || "-"}</td>
                            <td className="px-4 py-2 border-t">{a.subject?.toUpperCase?.() || "-"}</td>
                            <td className="px-4 py-2 border-t">{markedDate.toLocaleDateString()}</td>
                            <td className="px-4 py-2 border-t">{markedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-gray-500">No attendance records yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Outlet for nested routes */}
      <Outlet />
    </div>
  );
}
