// src/pages/TeacherDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { generateOtp, getAttendance } from "../services/api";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import api from "../services/api";
import { 
  LogOut, KeyRound, ShieldCheck, BookOpenText, CalendarCheck2, Bell, Clock, Layers
} from "lucide-react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function TeacherDashboard() {
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(5);
  const [classDurations, setClassDurations] = useState({});
  const [otpList, setOtpList] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [todaysOtp, setTodaysOtps] = useState([]);
  const [selectedOtp, setSelectedOtp] = useState(null);
  const [loadingClassId, setLoadingClassId] = useState(null);
  const [message, setMessage] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [classes, setClasses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const employeeId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const attendanceTimerRef = useRef(null);
  const todaysOtpTimerRef = useRef(null);

  // --- Load classes, profile, OTPs, attendance
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");
    if (!userId || role !== "teacher") navigate("/login");
    else {
      loadClasses();
      fetchProfile();
      loadAttendance();
      loadTodaysOtps();
      loadOtps();
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    attendanceTimerRef.current = setInterval(loadAttendance, 5000);
    return () => clearInterval(attendanceTimerRef.current);
  }, []);

  useEffect(() => {
    todaysOtpTimerRef.current = setInterval(loadTodaysOtps, 5000);
    return () => clearInterval(todaysOtpTimerRef.current);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 15000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/teacher/profile/${employeeId}`);
      setProfile(res.data);
    } catch (err) { console.error(err); }
  };

  const loadClasses = async () => {
    try { const res = await api.get(`/classes/list/${employeeId}`); setClasses(res.data || []); }
    catch (err) { console.error(err); }
  };

  const loadOtps = async () => {
    try {
      const res = await api.get(`/teacher/active-otps/${employeeId}`);
      const sorted = res.data.sort((a, b) => new Date(b.end_time) - new Date(a.end_time));
      setOtpList(sorted);
    } catch (err) { console.error(err); }
  };

  const loadAttendance = async () => {
    try { const data = await getAttendance(employeeId); setAttendanceList(data); }
    catch (err) { console.error(err); }
  };

  const loadTodaysOtps = async () => {
    try { const res = await api.get(`/teacher/todays-otps/${employeeId}`); setTodaysOtps(res.data || []); }
    catch (err) { console.error(err); }
  };

  // --- Generate OTP / QR ---
  const doGenerateOtp = async (c, mode = "otp") => {
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
                classDurations[c.id] || duration,
                latitude,
                longitude,
                mode
              );

              const newOtp = {
                otp: data.otp,
                subject: data.subject,
                end_time: data.valid_till,
                mode: data.mode,
              };

              setOtpList(prev => [newOtp, ...prev].filter(o => new Date(o.end_time) > new Date()));
              setMessage(`✅ ${mode === "qr" ? "QR Generated" : "OTP Generated"}: ${data.otp} (valid till: ${new Date(data.valid_till).toLocaleTimeString()})`);
              loadTodaysOtps();
            } catch (err) {
              console.error(err);
              setMessage(err?.response?.data?.detail || "❌ Failed to generate OTP/QR");
            } finally {
              setLoadingClassId(null);
            }
          }
        },
        (err) => { console.error(err); setMessage("❌ Failed to get location"); setLoadingClassId(null); },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } catch (err) { console.error(err); setMessage("❌ Something went wrong"); setLoadingClassId(null); }
  };

  const generateOtpForClass = (c, durationValue, mode = "otp") => {
    setClassDurations({ ...classDurations, [c.id]: durationValue });
    setLoadingClassId(c.id);
    doGenerateOtp(c, mode);
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  // --- Small helpers ---
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
    <div className={`bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition`}>
      <div className={`p-2 rounded-md ${accent} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );

  // --- Derived stats ---
  const todayISO = new Date().toISOString().split("T")[0];
  const todaysOtpsFiltered = otpList.filter(o => new Date(o.end_time).toISOString().split("T")[0] === todayISO);
  const latestOtp = todaysOtpsFiltered.length > 0 ? todaysOtpsFiltered[0] : null;
  const liveAttendanceCount = latestOtp ? attendanceList.filter(a => a.otp === latestOtp.otp).length : 0;
  const classesToday = todaysOtp.length;
  const attendanceMarkedToday = attendanceList.filter(a => new Date(a.marked_at).toISOString().split("T")[0] === todayISO).length;
  const pendingClasses = otpList.filter(o => new Date(o.end_time) > new Date()).length;

  // --- Render ---
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 p-4 sm:ml-2">
        {/* Top Stats */}
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            <div>
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-800">Teacher Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-500">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="hidden sm:flex items-center gap-2 bg-white px-2 py-1 rounded-lg shadow-sm text-xs sm:text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              {currentTime.toLocaleTimeString()}
            </div>
            <button onClick={() => navigate("/teacher/classes")} className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-1.5 rounded-lg shadow-md flex items-center gap-1 hover:bg-green-700 transition text-xs sm:text-sm"><Layers className="w-4 h-4" /> Classes</button>
            <button onClick={() => navigate("/teacher/send-notification")} className="p-2 rounded-md hover:bg-gray-100 transition" title="Notifications"><Bell className="w-5 h-5 text-gray-600" /></button>
            <div onClick={() => navigate("/teacher/profile")} className="flex items-center gap-1 sm:gap-2 bg-white px-2 py-1 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 transition">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold">{(profile?.full_name?.[0] || "T").toUpperCase()}</div>
              <div className="hidden sm:block text-sm">
                <div className="font-medium text-gray-800">{profile?.full_name || "Loading..."}</div>
                <div className="text-xs text-gray-500">{employeeId}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="inline-flex items-center gap-1 sm:gap-2 bg-rose-500 text-white px-2 sm:px-3 py-1.5 rounded-lg hover:bg-rose-600 transition text-xs sm:text-sm"><LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span></button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpenText} label="Classes Today" value={classesToday} />
          <StatCard icon={CalendarCheck2} label="Attendance Marked (Today)" value={attendanceMarkedToday} accent="bg-emerald-50" />
          <StatCard icon={KeyRound} label="Active OTPs" value={pendingClasses} accent="bg-yellow-50" />
          <StatCard icon={ShieldCheck} label="Live Present (Latest OTP)" value={liveAttendanceCount} accent="bg-purple-50" />
        </div>

        {/* Message */}
        {message && <div className={`rounded-md p-3 ${message.startsWith("✅") ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{message}</div>}

        {/* Classes list with OTP + QR */}
        <div className="bg-white rounded-xl shadow-sm p-4 mt-6">
          <div className="flex justify-between items-center">
            <SectionTitle icon={Layers} title="Your Classes" subtitle="Click buttons to generate OTP or QR" />
            <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-full hover:bg-gray-100 transition">
              {collapsed ? <ChevronDown className="w-5 h-5 text-gray-600" /> : <ChevronUp className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
          {!collapsed && (
            <div className="mt-4">
              {classes.length === 0 ? <div className="text-sm text-gray-500">No classes created yet.</div> :
                <ul className="divide-y divide-gray-200">
                  {classes.map((c, idx) => (
                    <li key={idx} className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition">
                      <div>
                        <div className="font-medium text-gray-800">{c.course} ({c.branch}) - Sem {c.semester} - Sec {c.section}</div>
                        <div className="text-xs text-gray-500">{c.subject}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <label className="text-xs text-gray-600 mb-0.5">Validity</label>
                          <input type="number" min={1} value={classDurations[c.id] || duration} onChange={(e) => setClassDurations({ ...classDurations, [c.id]: e.target.value })} className="w-16 p-1 border rounded-md text-xs text-center" title="Validity (mins)" />
                        </div>
                        <button onClick={() => generateOtpForClass(c, classDurations[c.id] || duration, "otp")} disabled={loadingClassId === c.id} className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition disabled:opacity-60"><KeyRound className="w-4 h-4" />{loadingClassId === c.id ? "Generating..." : "Generate OTP"}</button>
                        <button onClick={() => generateOtpForClass(c, classDurations[c.id] || duration, "qr")} disabled={loadingClassId === c.id} className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition disabled:opacity-60"><BookOpenText className="w-4 h-4" />{loadingClassId === c.id ? "Generating..." : "Generate QR"}</button>
                      </div>
                    </li>
                  ))}
                </ul>
              }
            </div>
          )}
        </div>
        
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
        {/* Today's OTPs + Attendance list */}
        {/* ...keep your existing layout unchanged, only optionally show mode icon*/}
        
      </div>
      <Outlet />
    </div>
  );
}
