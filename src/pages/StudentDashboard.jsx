import React, { useEffect, useState } from "react";
import { markAttendance, getStudentAttendance, exportStudentAttendanceCSV } from "../services/api";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { getFingerprint } from "../services/getFingerprint"
import {LogOut,} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Menu } from "lucide-react"; // add this with others


const SUBJECTS = {
  "BE":{
    "CSE": {
        "1": ["Calculus", "Physics", "Professional Communication","Workshop" , "Programming Fundamentals", "UHV"],
        "2": ["Basic Electrical and Electronics Engineering", "Applied Chemistry", "Engineering Graphics", "OOPs", "Differential Equations and Transforms"],
        "3": ["DBMS", "Data Structure", "Discrete Systems", "Web Technologies", "Software Technologies"],
        "4": [""],
        "5": ["Computer Graphics", "Theory of Computation", "Artificial Intelligence", "Natural language Processing","Economics"],
        "6": [""],
        "7": [""],
        "8": [""],
    },
    "ECE": {
        "1": ["Basic Electrical and Electronics Engineering", "Engineering Graphics", "Applied Chemistry", "Calculus", "Programming Fundamentals", ],
        "2": ["Workshop", "Digital Design", "Professional Communication", "UHV", "Applies Physics"],
        "3": ["Linear Algebra and Complex Analysis", "Signals and Systems", "Microprocessor and Microcontroller", "Electronic Devices and Circuits", "Electronics Measurementsand Instrumentation", "Economics"],
        "4": ["Communication Engineering", "Advance Microcontroller and Application", "Analog Electronics Circuits", "Probability and Random Process", "Electromagnetic Theory", "Network Analysis"],
        "5": ["VLSI", "AWP","DSD","DSA", "DSP", "CN"],
        "6": ["Microwave & Radar Engineering", "Fibre Optic Communication Systems", "Digital Communication", "Control Systems", "Power Electronics", "Satellite Communication" ],
        "7": ["Wireless and Mobile Communication", "Embedded System Design"],
        "8": [""],
    },
    "MECH": {
        "1": ["Mechanics", "Maths"],
        "2": ["Thermodynamics", "Fluid Mechanics"],
        "3": [""],
        "4": [""],
        "5": [""],
        "6": [""],
        "7": [""],
        "8": [""],
    },
},

"ME": {
    "CSE": {
      "1": ["Advanced Algorithms", "Machine Learning", "Research Methodology"],
      "2": ["Advanced DBMS", "Data Mining", "Cloud Computing"],
      "3": ["Thesis Phase I", "Seminar"],
      "4": ["Thesis Phase II"]
    },
    "ECE": {
      "1": ["Advanced Signal Processing", "VLSI Design", "Research Methodology"],
      "2": ["Wireless Communication", "Embedded Systems", "Advanced Communication Systems"],
      "3": ["Thesis Phase I", "Seminar"],
      "4": ["Thesis Phase II"]
    },
    "MECH": {
      "1": ["Advanced Thermodynamics", "Finite Element Methods", "Research Methodology"],
      "2": ["Computer-Aided Design", "Mechatronics", "Advanced Manufacturing"],
      "3": ["Thesis Phase I", "Seminar"],
      "4": ["Thesis Phase II"]
    }
  }
}

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

  const roll_no = localStorage.getItem("userId");
  const navigate = useNavigate();
  const [otpPasteMessage, setOtpPasteMessage] = useState("");

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);


  useEffect(() => {
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  if (!userId || role !== "student") {
    navigate("/login");
  } else {
    fetchProfile();
    loadAttendance();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  const fetchProfile = async () => {
    try {
      const res = await api.get(`/student/profile/${roll_no}`);
      console.log("PROFILE DATA FROM API:", res.data);
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
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
    console.log("PROFILE INFO ➜", profile);

    const course = profile.course.toUpperCase();
    const branch = profile.branch.toUpperCase(); // e.g., "CSE"
    const sem = String(profile.semester);         // e.g., "3"

    console.log("Fetching subjects for ➜", branch, sem);
    return SUBJECTS?.[course]?.[branch]?.[sem] || [];
  };


    const checkOtp = async () => {
    try {
      const res = await api.get(`/student/check-otp/${otp}`);
      setOtpInfo(res.data);
      setOtpError("");
    } catch (err) {
      console.error(err);
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
          (a) => new Date(a.marked_at).toDateString() === new Date(dateFilter).toDateString()
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
      const visitorId = await getFingerprint(); // get device fingerprint
      const position = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
    );
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

      await markAttendance(roll_no, subject, otp, visitorId, lat, lng);
      setMessage("✅ Attendance marked successfully!");
      setOtp("");
      setSubject("");
      loadAttendance(filterSubject, filterDate);
    } catch (err) {
      console.error(err);
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
    [`Roll No:,${profile.roll_no || ''}`],
    [`Department:,${profile.department || ''}`],
    [`Course:,${profile.course || ''}`],
    [`Branch:,${profile.branch || ''}`],
    [`Semester:,${profile.semester || ''}`],
    [`Section:,${profile.section || ''}`],
    [], // empty row before table
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
   <div className="w-full min-h-screen flex overflow-x-hidden">
    {/* Mobile Sidebar Overlay */}
    {showMobileSidebar && (
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-40 md:hidden"
        onClick={() => setShowMobileSidebar(false)}
      >
        <div
          className="absolute left-0 top-0 w-64 h-full bg-white shadow-lg p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ❌ Close Button */}
          <button
            className="self-end text-green-700 mb-4"
            onClick={() => setShowMobileSidebar(false)}
          >
            ❌
          </button>

          {/* <Sidebar onLogout={handleLogout} /> */}
          <Sidebar
            onLogout={() => {
              setShowMobileSidebar(false);
              handleLogout(); // make sure this function is defined
            }}
          />
        </div>
      </div>
    )}

    {/* Desktop Sidebar */}
    <div className="hidden md:flex">
      <Sidebar onLogout={handleLogout} />
    </div>

    {/* Main Content */}
    <div className="flex-1 min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4 md:p-8">
      
      {/* Mobile Menu Button */}
      
<div className="md:hidden p-4">
  <button
    className="bg-green-600 text-white px-4 py-2 rounded shadow flex items-center gap-2"
    onClick={() => setShowMobileSidebar(true)}
  >
    <Menu className="w-5 h-5" />
    Menu
  </button>
</div>

  <div className="flex-1 min-h-screen w-full bg-gradient-to-b from-green-50 to-green-100 p-4 md:p-8">
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-green-800">🧑‍🎓 Student Dashboard</h1>
        <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Welcome, <span className="text-green-700">{profile ? profile.full_name : 'Loading...'}</span>
        </h2>
        <div className="text-gray-600 flex flex-wrap gap-4 mt-2 text-sm md:text-base">
          <span>🆔 <b>Roll No:</b> {roll_no}</span>
          {profile?.department && <span>🏫 <b>Department:</b> {profile.department}</span>}
          {profile?.course && <span>🎓 <b>Course:</b> {profile.course}</span>}
          {profile?.branch && <span>🧬 <b>Branch:</b> {profile.branch}</span>}
          {profile?.semester && <span>📚 <b>Semester:</b> {profile.semester}</span>}
          {profile?.section && <span>🔖 <b>Section:</b> {profile.section}</span>}
        </div>
      </div>

      {/* Mark Attendance */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">🔐Enter OTP to Mark Attendance</h2>
        <form onSubmit={handleMarkAttendance} className="flex flex-col md:flex-row gap-3">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-400"
            required
          >
            <option value="" disabled>Select Subject</option>
            {getAvailableSubjects().map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
          
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              setOtpPasteMessage("⚠️ Pasting is disabled. Type the OTP like a real human. 🕶️💻");
              setTimeout(() => setOtpPasteMessage(""), 5000);
            }}
            placeholder="Enter OTP"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-400"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow"
          >
            {loading ? "Marking..." : "Mark Attendance"}
          </button>
        </form>

        {otpPasteMessage && <p className="text-yellow-700 text-sm">{otpPasteMessage}</p>}

        {otpInfo && (
          <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-gray-700">
            <p>OTP is for subject: <b>{otpInfo.subject}</b></p>
            <p>Active from: {new Date(otpInfo.start_time).toLocaleString()}</p>
            <p>Until: {new Date(otpInfo.end_time).toLocaleString()}</p>
          </div>
        )}
        {otpError && <p className="text-red-600">{otpError}</p>}
        {message && (
          <p className={`text-sm ${message.startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-3 bg-white p-4 rounded-xl shadow-md w-full max-w-4xl mx-auto">
        <div className="flex flex-col gap-2 mb-4 text-center">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center justify-center gap-2">
            🔍 Filter Attendance
          </h2>
        </div>

        {/* Subject Dropdown */}

        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="w-full md:w-56 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
        >
          <option value="">All Subjects</option>
          {getAvailableSubjects().map((sub) => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>

        {/* Date Picker */}
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-full md:w-44 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
        />

        {/* Apply Filters Button */}
        <button
          onClick={() => loadAttendance(filterSubject, filterDate)}
          className="w-full md:w-40 bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 text-sm font-semibold"
        >
          ✅ Apply
        </button>

        {/* Reset Button */}
        <button
          onClick={() => {
            setFilterSubject("");
            setFilterDate("");
            loadAttendance();
          }}
          className="w-full md:w-32 bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-xl shadow hover:shadow-md transform hover:scale-105 transition-all duration-300 text-sm font-semibold"
        >
          ♻️ Reset
        </button>
      </div>

      

      {/* Attendance History */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">📅 Attendance History</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm border border-gray-200 rounded">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border px-3 py-2">Subject</th>
                <th className="border px-3 py-2">Marked At</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.length > 0 ? (
                attendanceList.map((a, idx) => (
                  <tr key={idx} className="hover:bg-green-50">
                    <td className="border px-3 py-2">{a.subject}</td>
                    <td className="border px-3 py-2">{new Date(a.marked_at).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="text-center p-3 text-gray-500">No attendance marked yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-2 rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 text-sm font-semibold"
        >
          📤 Export Attendance CSV
        </button>
      </div>

    </div>
  </div>
  </div>
  </div>
);
}