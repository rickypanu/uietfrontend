import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { SubjectsProvider } from "./lib/subjects";
import { FeedbackProvider } from "./components/feedback";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNotifications from "./pages/admin/AdminNotifications";
import BulkRegister from "./pages/admin/BulkRegister";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAnalysis from "./pages/student/StudentAnalysis";
import StudentNotifications from "./pages/student/StudentNotifications";
import StudentProfile from "./pages/student/StudentProfile";
import StudentHelp from "./pages/student/StudentHelp";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import ClassRegister from "./pages/teacher/ClassRegister";
import TeacherNotifications from "./pages/teacher/TeacherNotifications";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import TeacherHelp from "./pages/teacher/TeacherHelp";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubjectsProvider>
          <FeedbackProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              <Route element={<ProtectedRoute role="student" />}>
                <Route element={<AppShell role="student" />}>
                  <Route path="/student" element={<StudentDashboard />} />
                  <Route path="/student/analysis" element={<StudentAnalysis />} />
                  <Route path="/student/notifications" element={<StudentNotifications />} />
                  <Route path="/student/profile" element={<StudentProfile />} />
                  <Route path="/student/help" element={<StudentHelp />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute role="teacher" />}>
                <Route element={<AppShell role="teacher" />}>
                  <Route path="/teacher" element={<TeacherDashboard />} />
                  <Route path="/teacher/classes" element={<TeacherClasses />} />
                  <Route path="/teacher/classes/:classId" element={<ClassRegister />} />
                  <Route path="/teacher/notifications" element={<TeacherNotifications />} />
                  <Route path="/teacher/profile" element={<TeacherProfile />} />
                  <Route path="/teacher/help" element={<TeacherHelp />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute role="admin" />}>
                <Route element={<AppShell role="admin" />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/bulk" element={<BulkRegister />} />
                  <Route path="/admin/notifications" element={<AdminNotifications />} />
                </Route>
              </Route>

              {/* routes from the previous version keep working */}
              <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/register" element={<Navigate to="/admin/bulk" replace />} />
              <Route path="/attendance-analysis" element={<Navigate to="/student/analysis" replace />} />
              <Route path="/student/about" element={<Navigate to="/student/help" replace />} />
              <Route path="/teacher/about" element={<Navigate to="/teacher/help" replace />} />
              <Route path="/teacher/send-notification" element={<Navigate to="/teacher/notifications" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </FeedbackProvider>
        </SubjectsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
