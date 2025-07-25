import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  UserCircle,
  Info,
  CalendarCheck,
  LogOut,
  GraduationCap,
  Menu,
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from "lucide-react";

const TeacherSidebar = ({ profile }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleSidebar = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);
  const closeMobileSidebar = () => setMobileOpen(false);

  const linkClasses = (isActive) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition ${
      isActive ? "bg-blue-200 font-semibold" : "text-gray-700"
    }`;

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="fixed top-4 left-4 z-50 sm:hidden">
        <button
          onClick={toggleMobileSidebar}
          className="bg-blue-600 text-white p-2 rounded-full shadow"
        >
          <Menu />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-40 h-full bg-white shadow-lg transition-all duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} 
          sm:translate-x-0 sm:static sm:flex 
          ${collapsed ? "w-20" : "w-64"}`}
      >
        <div className="h-full flex flex-col p-4 gap-6 mt-10">
          {/* Collapse Toggle (only on laptop) */}
          <div className="hidden sm:flex justify-end">
            <button onClick={toggleSidebar} className="text-blue-600">
              {collapsed ? <ChevronRight /> : <ChevronLeft />}
            </button>
          </div>

          {/* Title */}
          {!collapsed && (
            <h2 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              Teacher
            </h2>
          )}

          {/* Profile */}
          {!collapsed && profile && (
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold shadow-inner">
                  {profile.full_name?.[0]?.toUpperCase() || "T"}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {profile.full_name}
                  </p>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Links + Logout */}
          <div className="space-y-3">
            <NavLink
              to="/teacher/profile"
              className={({ isActive }) => linkClasses(isActive)}
              onClick={closeMobileSidebar}
            >
              <UserCircle className="w-5 h-5" />
              {!collapsed && <span>Profile</span>}
            </NavLink>

            <NavLink
              to="/teacher/about"
              className={({ isActive }) => linkClasses(isActive)}
              onClick={closeMobileSidebar}
            >
              <Info className="w-5 h-5" />
              {!collapsed && <span>How to Use</span>}
            </NavLink>

            <NavLink
              to="/teacher/send-notification"
              className={({ isActive }) => linkClasses(isActive)}
              onClick={closeMobileSidebar}
            >
              <Megaphone className="w-5 h-5" />
              {!collapsed && <span>Send Notification</span>}
            </NavLink>

            <NavLink
              to="/teacher"
              className={({ isActive }) => linkClasses(isActive)}
              onClick={closeMobileSidebar}
            >
              <CalendarCheck className="w-5 h-5" />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 sm:hidden"
          onClick={closeMobileSidebar}
        ></div>
      )}
    </>
  );
};

export default TeacherSidebar;
