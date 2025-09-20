// src/pages/TeacherDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  generateOtp,
  getAttendance,
} from "../services/api";
import { NavLink,useNavigate, Outlet } from "react-router-dom";
import api from "../services/api";
import {  LogOut,  User,  KeyRound,  ShieldCheck,  BookOpenText,  CalendarCheck2,  FileDown,  Filter,  Bell,  Clock,  Plus,  ChevronsDown,  ChevronsUp,  Layers,} from "lucide-react";
import {
  UserCircle,
  Info,
  CalendarCheck,
  GraduationCap,
  Menu,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  ChevronDown,
  ChevronUp, 
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
  const [profile, setProfile] = useState(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaysOtp, setTodaysOtps] = useState([]);
  const [selectedOtp, setSelectedOtp] = useState(null);
  const [course, setCourse] = useState("");
  const [otpCardOpen, setOtpCardOpen] = useState(true);

  const [collapsed, setCollapsed] = useState(false);
  const [loadingClassId, setLoadingClassId] = useState(null);

  const employeeId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const [classDurations, setClassDurations] = React.useState({});
  // --- state ---
  const [classes, setClasses] = useState([]);

// --- API calls ---
const loadClasses = async () => {
  try {
    const res = await api.get(`/classes/list/${employeeId}`);
    setClasses(res.data || []);
  } catch (err) {
    console.error("Failed to load classes", err);
  }
};

// --- handler to select class ---
const handleSelectClass = (c) => {
  setCourse(c.course);
  setBranch(c.branch);
  setSemester(c.semester);
  setSubject(c.subject);
};
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
      loadClasses();  
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
  // const handleGenerateOtp = async (e) => {
  //   e.preventDefault();
  
  //   if (!branch || !semester || !subject || !course) {
  //     setMessage("❌ Please select course, branch, semester, and subject.");
  //     return;
  //   }

  //   setLoading(true);
  //   setMessage("📡 Getting accurate location... Please wait.");

  //   let watchId = null;
  //   let gotAccurateLocation = false;

  //   try {
  //     watchId = navigator.geolocation.watchPosition(
  //       async (position) => {
  //         const { latitude, longitude, accuracy } = position.coords;
  //         setMessage(`📍 Accuracy: ${Math.round(accuracy)} meters`);

  //         if (accuracy <= 1000 && !gotAccurateLocation) {
  //           gotAccurateLocation = true;
  //           navigator.geolocation.clearWatch(watchId);

  //           try {
  //             const data = await generateOtp(
  //               employeeId,
  //               course,
  //               branch,
  //               semester,
  //               subject,
  //               duration,
  //               latitude,
  //               longitude
  //             );

  //             const newOtp = {
  //               otp: data.otp,
  //               subject: data.subject,
  //               end_time: data.valid_till,
  //             };

  //             setOtpList((prev) =>
  //               [newOtp, ...prev]
  //                 .filter((item) => new Date(item.end_time) > new Date())
  //                 .sort((a, b) => new Date(b.end_time) - new Date(a.end_time))
  //             );

  //             setMessage(
  //               `✅ OTP Generated: ${data.otp} (valid till: ${new Date(
  //                 data.valid_till
  //               ).toLocaleString()})`
  //             );

  //             // update today's otps quickly
  //             loadTodaysOtps();
  //           } catch (error) {
  //             console.error("Generate OTP error:", error);
  //             setMessage(error?.response?.data?.detail || "❌ Failed to generate OTP");
  //           } finally {
  //             setLoading(false);
  //           }
  //         }
  //       },
  //       (error) => {
  //         console.error("Geolocation error:", error);
  //         setMessage("❌ Failed to get location. Please allow location access and try again.");
  //         setLoading(false);
  //         if (watchId) navigator.geolocation.clearWatch(watchId);
  //       },
  //       {
  //         enableHighAccuracy: true,
  //         timeout: 15000,
  //         maximumAge: 0,
  //       }
  //     );
  //   } catch (err) {
  //     console.error("Unexpected error:", err);
  //     setMessage("❌ Something went wrong.");
  //     setLoading(false);
  //     if (watchId) navigator.geolocation.clearWatch(watchId);
  //   }
  // };

  // // Wrapper function
  // const generateOtpForClass = (c) => {

  //   setLoadingClassId(c.id);
    
  //   setCourse(c.course);
  //   setBranch(c.branch);
  //   setSemester(c.semester);
  //   setSubject(c.subject);

  //   // call the same function but without needing a <form> submit
  //   handleGenerateOtp(new Event("submit"));
  // };

  
  // Core OTP generator (independent of form or class)
const doGenerateOtp = async (c) => {
  let watchId = null;
  let gotAccurateLocation = false;

  try {
    setMessage("📡 Getting accurate location... Please wait.");
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
              c.course,
              c.branch,
              c.semester,
              c.subject,
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

            loadTodaysOtps(); // refresh today's list
          } catch (err) {
            console.error("Generate OTP error:", err);
            setMessage(err?.response?.data?.detail || "❌ Failed to generate OTP");
          } finally {
            setLoadingClassId(null);
            setLoading(false);
          }
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setMessage("❌ Failed to get location. Please allow location access and try again.");
        setLoadingClassId(null);
        setLoading(false);
        if (watchId) navigator.geolocation.clearWatch(watchId);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    setMessage("❌ Something went wrong.");
    setLoadingClassId(null);
    setLoading(false);
    if (watchId) navigator.geolocation.clearWatch(watchId);
  }
};

// --- Used in two ways ---

// Case 1: Generate from class card button
const generateOtpForClass = (c, durationValue) => {

  setDuration(durationValue);

  setLoading(true);
  setLoadingClassId(c.id);
  doGenerateOtp(c);

  setCourse(c.course);
  setBranch(c.branch);
  setSemester(c.semester);
  setSubject(c.subject);

  // update the duration state before generating
  setDuration(durationValue);
};

// Case 2: Generate from form submit
const handleGenerateOtp = (e) => {
  e.preventDefault();

  if (!branch || !semester || !subject || !course) {
    setMessage("❌ Please select course, branch, semester, and subject.");
    return;
  }

  setLoading(true);
  const c = { course, branch, semester, subject }; // form values
  doGenerateOtp(c);
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

  // --- render ---
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Content */}
      <div className="flex-1 p-4 sm:ml-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-gray-800">Teacher Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Time (hidden on very small screens) */}
          
          <div className="hidden sm:flex items-center gap-2 bg-white px-2 py-1 rounded-lg shadow-sm text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            {currentTime.toLocaleTimeString()}
          </div>

          {/* Quick OTP (hidden on mobile) */}
          {/* <button
            onClick={() => setOtpCardOpen((s) => !s)}
            className="hidden sm:inline-flex items-center gap-1 bg-indigo-600 text-white px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            Check-In
          </button> */}

          <button
            onClick={() => navigate("/teacher/classes")}
            className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-1.5 rounded-lg shadow-md flex items-center gap-1 hover:bg-green-700 transition text-xs sm:text-sm"
          >
            <Layers className="w-4 h-4" />
            Classes
          </button>
      
          {/* Notification Icon */}
          <button
            onClick={() => navigate("/teacher/send-notification")}
            className="p-2 rounded-md hover:bg-gray-100 transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
          </button>

          {/* Profile */}
          <div
            onClick={() => navigate("/teacher/profile")}
            className="flex items-center gap-1 sm:gap-2 bg-white px-2 py-1 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 transition"
          >
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold">
              {(profile?.full_name?.[0] || "T").toUpperCase()}
            </div>
            <div className="hidden sm:block text-sm">
              <div className="font-medium text-gray-800">{profile?.full_name || "Loading..."}</div>
              <div className="text-xs text-gray-500">{employeeId}</div>
            </div>
          </div>

          {/* How to Use */}
          <div
            onClick={() => navigate("/teacher/about")}
            className="flex items-center gap-1 sm:gap-2 bg-white px-2 py-1 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 transition"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div className="hidden sm:block text-sm">
              <div className="font-medium text-gray-800">How to Use</div>
              <div className="text-xs text-gray-500">Guide & Tips</div>
            </div>
          </div>

          {/* Logout - visible on all devices */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 sm:gap-2 bg-rose-500 text-white px-2 sm:px-3 py-1.5 rounded-lg hover:bg-rose-600 transition text-xs sm:text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
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

        {/* classes for select and generate otp */}
        <div className="bg-white rounded-xl shadow-sm p-4">
  {/* Header with collapse toggle */}
  <div className="flex justify-between items-center">
    <SectionTitle
      icon={Layers}
      title="Your Classes"
      subtitle="Click the button to generate OTP directly"
    />
    <button
      onClick={() => setCollapsed(!collapsed)}
      className="p-2 rounded-full hover:bg-gray-100 transition"
    >
      {collapsed ? (
        <ChevronDown className="w-5 h-5 text-gray-600" />
      ) : (
        <ChevronUp className="w-5 h-5 text-gray-600" />
      )}
    </button>
  </div>

  {/* Collapsible Content */}
  {!collapsed && (
    <div className="mt-4">
      {classes.length === 0 ? (
        <div className="text-sm text-gray-500">No classes created yet.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {classes.map((c, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition"
            >
              {/* Class Info */}
              <div>
                <div className="font-medium text-gray-800">
                  {c.course} ({c.branch}) - Sem {c.semester} - Sec {c.section}
                </div>
                <div className="text-xs text-gray-500">{c.subject}</div>
              </div>

              {/* Duration + Generate OTP */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <label className="text-xs text-gray-600 mb-0.5">Validity</label>
                  <input
                    type="number"
                    min={1}
                    value={classDurations[c.id] || duration} // fallback to default
                    onChange={(e) =>
                      setClassDurations({
                        ...classDurations,
                        [c.id]: e.target.value,
                      })
                    }
                    className="w-16 p-1 border rounded-md text-xs text-center"
                    title="Validity (mins)"
                  />
                </div>
                <button
                  onClick={() =>
                    generateOtpForClass(c, classDurations[c.id] || duration)
                  }
                  disabled={loadingClassId === c.id}
                  className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  <KeyRound className="w-4 h-4" />
                  {loadingClassId === c.id ? "Generating..." : "Generate OTP"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )}
</div>

          {/* OTP generator (collapsible) */}
          {/* <div className="bg-white rounded-xl shadow-sm p-4">
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
          </div> */}

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
      </div>
      </div>

      {/* Outlet for nested routes */}
      <Outlet />
    </div>
  );
}
