// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfilePage from "./pages/StudentProfilePage"
import AboutPage from "./pages/AboutPage";
import TeacherAbout from "./pages/TeacherAbout";
import TeacherProfile from "./pages/TeacherProfile";
import StudentNotifications from "./pages/StudentNotifications";
import TeacherSendNotification from "./pages/TeacherSendNotification";

export default function App() {
  const storedRole = localStorage.getItem("role");

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          
          {/* Example for student (uncomment if you add StudentDashboard) */}
          <Route path="/student"element={storedRole === "student" ? <StudentDashboard /> : <Navigate to="/login" replace />}/>
          <Route path="/student/profile" element={<StudentProfilePage/>} />
          <Route path="/student/about" element={<AboutPage />} />
          <Route path="/student/notifications" element={<StudentNotifications />} />

          {/* Teacher dashboard: allow only if logged in as teacher */}
          <Route path="/teacher"element={storedRole === "teacher" ? <TeacherDashboard /> : <Navigate to="/login" replace />}/>
          <Route path="/teacher/profile" element={<TeacherProfile />} />
          <Route path="/teacher/about" element={<TeacherAbout />} />
          <Route path="/teacher/send-notification" element={<TeacherSendNotification />} />
             
        </Routes>
      </div>
    </Router>
  );
}
