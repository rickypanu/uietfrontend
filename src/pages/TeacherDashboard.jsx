// src/pages/TeacherDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  generateOtp,
  getAttendance,
  getGeneratedOtps,
} from "../services/api";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import Papa from "papaparse";
import TeacherSidebar from "../components/TeacherSidebar";
import { Outlet } from "react-router-dom";
import { SUBJECTS } from "../constants/subjects";


export default function TeacherDashboard() {
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

  const employeeId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  const today = new Date().toISOString().split("T")[0];
  const todaysOtps = otpList.filter(o => new Date(o.end_time).toISOString().split("T")[0] === today);
  const latestOtp = todaysOtps.length > 0 ? todaysOtps[0] : null;
  const liveAttendanceCount = latestOtp
  ? attendanceList.filter((a) => a.otp === latestOtp.otp).length
  : 0;

  const [selectedOtp, setSelectedOtp] = useState(null);
  const [todaysOtp, setTodaysOtps] = useState([]);

  const [course, setCourse] = useState("");

  const branches = course ? Object.keys(SUBJECTS[course]) : [];
  const semesters = course && branch ? Object.keys(SUBJECTS[course]?.[branch] || {}) : [];
  const subjects = course && branch && semester ? SUBJECTS[course]?.[branch]?.[semester] || [] : [];


  useEffect(() => {
  const interval = setInterval(() => {
      setCurrentTime(new Date());
      loadAttendance();
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  if (!userId || role !== "teacher") {
    navigate("/login");
  } else {
    loadOtps();
    fetchProfile();
    loadAttendance();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);



const loadTodaysOtps = async () => {
  try {
    const res = await api.get(`/teacher/todays-otps/${employeeId}`);
    setTodaysOtps(res.data);
  } catch (err) {
    console.error("Error loading today's OTPs:", err);
  }
};

useEffect(() => {
  loadTodaysOtps();
  const interval = setInterval(loadTodaysOtps, 1000); // update every second
  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 20000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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


  const handleGenerateOtp = async (e) => {
  e.preventDefault();
  if (!branch || !semester || !subject) {
    setMessage("❌ Please select branch, semester, and subject.");
    return;
  }

  setLoading(true); // this will trigger a render and show "Generating..."

  try {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const data = await generateOtp(employeeId, course, branch, semester, subject, duration, lat, lng);

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

          const validTill = new Date(data.valid_till).getTime();
          const now = Date.now();
          const timeout = validTill - now;

          if (timeout > 0) {
            setTimeout(() => {
              setOtpList((prev) => prev.filter((item) => item.otp !== newOtp.otp));
            }, timeout);
          }

          setMessage(`✅ OTP Generated: ${data.otp} (valid till: ${new Date(data.valid_till).toLocaleString()})`);
        } catch (error) {
          console.error("Generate OTP error:", error);
          setMessage(error.response?.data?.detail || "❌ Failed to generate OTP");
        } finally {
          setLoading(false); // ✅ ensure loading is turned off inside the success path
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setMessage("❌ Failed to get location. Allow location permission and try again.");
        setLoading(false); // ✅ also turn off loading on geolocation failure
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    setMessage("❌ Something went wrong.");
    setLoading(false); // ✅ fallback
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

  const SectionTitle = ({ icon: Icon, title }) => (
    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
      <Icon className="w-5 h-5 text-blue-600" />
      {title}
    </h2>
  );

  
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <TeacherSidebar profile={profile} />

      {/* Main Content */}
      <div className="flex-1 p-4 sm:ml-2"> {/* Adjust padding/margin based on sidebar width */}
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-semibold text-gray-800 inline-flex items-center gap-2 justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-600 " />
              Teacher Dashboard
            </h1>
          </div>

          {/* <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button> */}
        </div>

        {/* Profile */}
          <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 flex items-center gap-6 mt-6">
            {/* Optional Profile Initials or Icon */}
            <div className="w-20 h-20 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-3xl font-bold shadow-inner">
              {(profile?.full_name?.[0] || "T").toUpperCase()}
            </div>


            {/* Info Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {(profile?.full_name || "Loading...").toUpperCase()}
              </h2>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Employee ID:</span> {employeeId}
              </p>
            </div>
          </div>


    
        {/* OTP Generator */}
        {/* <div className="bg-white shadow-sm rounded-lg p-5"> */}
        <div className="bg-white shadow-sm rounded-lg p-5 mt-6">

          <SectionTitle icon={KeyRound} title="Generate OTP for Class" />
          <form onSubmit={handleGenerateOtp} className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Course Dropdown */}
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

          {/* Branch Dropdown */}
            <select
              value={branch}
              onChange={(e) => {
                setBranch(e.target.value);
                setSemester("");
                setSubject("");
              }}
              className="p-2 border rounded-md w-full md:w-1/4"
              required
            >
              <option value="">Select Branch</option>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Semester Dropdown */}
            <select
              value={semester}
              onChange={(e) => {
                setSemester(e.target.value);
                setSubject("");
              }}
              disabled={!branch}
              className="p-2 border rounded-md w-full md:w-1/4"
              required
            >
              <option value="">Select Semester</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>

            {/* Subject Dropdown */}
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!semester}
              className="p-2 border rounded-md w-full md:w-1/4"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>

            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Validity (minutes)"
              className="p-2 border rounded-md w-full md:w-1/4"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full md:w-fit"
            >
              {loading ? "Generating..." : "Generate OTP"}
            </button>
          </form>
          {message && (
            <p className={`mt-2 text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </div>
      
        {/* Active OTPs */}
        <div className="bg-white shadow-sm rounded-lg p-5 mt-6">
          <SectionTitle icon={BookOpenText} title="Active OTPs" />
          <div className="overflow-auto">
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="border px-3 py-2 text-left">OTP</th>
                  <th className="border px-3 py-2 text-left">Subject</th>
                  <th className="border px-3 py-2 text-left">Valid Till</th>
                </tr>
              </thead>
              <tbody>
                {otpList.length > 0 ? (
                  otpList.map((otp, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">{otp.otp}</td>
                      <td className="border px-3 py-2">{otp.subject}</td>
                      <td className="border px-3 py-2">{new Date(otp.end_time).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-3 text-gray-500">No active OTPs yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

 
        {/* Box Container */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

      {/* Box 1: Current Time */}
      <div className="bg-white rounded-lg shadow-md p-4 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Current Time</h2>
        <p className="text-2xl font-bold text-blue-600 mt-2">
          {currentTime.toLocaleTimeString()}
        </p>
        <p className="text-gray-500 text-sm">{currentTime.toDateString()}</p>
      </div>

  {/* Box 2: Today's OTPs List */}
      <div className="bg-white rounded-lg shadow-md p-4 text-center">
  <h2 className="text-xl font-semibold text-gray-700">Today’s OTPs</h2>
  <ul className="mt-2 space-y-1 max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
    {todaysOtp.length === 0 ? (
      <p className="text-gray-500 text-sm">No OTPs generated yet</p>
    ) : (
      todaysOtp.map((otpItem, index) => (
        <li
          key={index}
          onClick={() => setSelectedOtp(otpItem.otp)}
          className={`cursor-pointer px-2 py-1 rounded-md text-sm ${
            selectedOtp === otpItem.otp
              ? "bg-purple-100 text-purple-800 font-semibold"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {otpItem.otp} - {otpItem.subject}
        </li>
      ))
    )}
  </ul>
</div>


    {/* box 3 */}
      
  <div className="bg-white rounded-lg shadow-md p-4 text-center">
      <h2 className="text-xl font-semibold text-gray-700">Students Marked</h2>
      {selectedOtp ? (
        <>
          <p className="text-4xl font-bold text-purple-600 mt-2">
            {
              attendanceList.filter((record) => record.otp === selectedOtp).length
            }
          </p>
          <p className="text-gray-500 text-sm mt-1">For OTP: {selectedOtp}</p>
        </>
      ) : (
        <p className="text-gray-500 text-sm mt-2">Click an OTP to see count</p>
      )}
    </div>
    </div>


        {/* Filters + Export */}
        <div className="bg-white shadow-sm rounded-lg p-5 space-y-4 mt-6">
          <SectionTitle icon={Filter} title="Filter & Export Attendance Records" />
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1 text-gray-600">Filter by Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="p-2 border rounded-md w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1 text-gray-600">Filter by Month</label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="p-2 border rounded-md w-full"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setFilterDate(""); setFilterMonth(""); }}
              className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Clear Filters
            </button>
            
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white shadow-sm rounded-lg p-5 mt-6">
          <SectionTitle icon={CalendarCheck2} title="Attendance Marked by Students" />

        {/* Responsive Button Wrapper */}
        <div className="flex flex-col-reverse md:flex-row md:justify-end md:items-center gap-4 mb-4">
          <button
            onClick={handleExport}
            className="w-full md:w-auto bg-green-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-green-700 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out flex items-center justify-center gap-2 text-sm font-medium"
          >
            <FileDown className="w-5 h-5" />
            Export CSV
          </button>

       </div>

       {/* <div className="grid gap-4 mt-4">
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
      .map((a, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition p-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {/* Left side */}
            {/* <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-1">
                Roll No: {a.roll_no}
              </h3>
              <p className="text-sm text-gray-500">
                Marked At:{" "}
                <span className="text-gray-700">
                  {new Date(a.marked_at).toLocaleString()}
                </span>
              </p>
            </div> */}

            {/* Right side */}
            {/* <div className="text-sm sm:text-base font-medium text-gray-700 flex items-center gap-2">
              <span className="border border-gray-300 rounded-full px-3 py-1">
                {a.subject.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      ))
  ) : (
    <div className="text-center py-6 text-gray-500">
      No attendance records yet
    </div>
  )}
</div> */} 

<div className="overflow-auto mt-4 rounded-lg border border-gray-200">
  <table className="w-full text-sm text-gray-800">
    <thead>
      <tr className="bg-gray-100 text-gray-700">
        <th className="px-4 py-3 text-left">Roll No</th>
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
          .sort((a, b) => new Date(b.marked_at) - new Date(a.marked_at)) // Newest first
          .map((a, idx) => {
            const markedDate = new Date(a.marked_at);
            const isEven = idx % 2 === 0;
            return (
              <tr
                key={idx}
                className={`${
                  isEven ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100 transition`}
              >
                <td className="px-4 py-2 border-t">{a.roll_no}</td>
                <td className="px-4 py-2 border-t">{a.subject.toUpperCase()}</td>
                <td className="px-4 py-2 border-t">
                  {markedDate.toLocaleDateString()}
                </td>
                <td className="px-4 py-2 border-t">
                  {markedDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            );
          })
      ) : (
        <tr>
          <td
            colSpan="4"
            className="text-center py-4 text-gray-500 bg-white border-t"
          >
            No attendance records yet
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>



        {/* <div className="overflow-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border px-3 py-2 text-left">Roll No</th>
                <th className="border px-3 py-2 text-left">Subject</th>
                <th className="border px-3 py-2 text-left">Marked At</th>
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
                  .sort((a, b) => new Date(b.marked_at) - new Date(a.marked_at)) // Newest first
                  .map((a, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">{a.roll_no}</td>
                      <td className="border px-3 py-2">{a.subject}</td>
                      <td className="border px-3 py-2">
                        {new Date(a.marked_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-3 text-gray-500">
                    No attendance records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div> */}
      </div>
      </div>
    </div>
  );
}
