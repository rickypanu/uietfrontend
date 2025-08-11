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
    `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 
     ${isActive ? "bg-indigo-100 text-indigo-700 font-semibold" : "text-gray-700 hover:bg-indigo-50"}`;

  const navLinks = [
    { to: "/teacher/profile", icon: <UserCircle className="w-5 h-5" />, label: "Profile" },
    { to: "/teacher/about", icon: <Info className="w-5 h-5" />, label: "How to Use" },
    { to: "/teacher/send-notification", icon: <Megaphone className="w-5 h-5" />, label: "Send Notification" },
    { to: "/teacher", icon: <CalendarCheck className="w-5 h-5" />, label: "Dashboard" },
  ];

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="fixed top-4 left-4 z-50 sm:hidden">
        <button
          onClick={toggleMobileSidebar}
          className="bg-indigo-600 text-white p-2 rounded-full shadow hover:bg-indigo-700 transition"
        >
          <Menu />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-40 h-full bg-white border-r border-gray-200 shadow-md transition-all duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} 
          sm:translate-x-0 sm:static sm:flex 
          ${collapsed ? "w-20" : "w-64"}`}
      >
        <div className="h-full flex flex-col p-4 gap-6 mt-10">
          
          {/* Collapse Toggle (Desktop) */}
          <div className="hidden sm:flex justify-end">
            <button
              onClick={toggleSidebar}
              className="text-indigo-600 hover:bg-indigo-50 p-1 rounded-full"
            >
              {collapsed ? <ChevronRight /> : <ChevronLeft />}
            </button>
          </div>

          {/* Logo / Title */}
          {!collapsed && (
            <h2 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              Teacher
            </h2>
          )}

          {/* Profile */}
          {!collapsed && profile && (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-indigo-50">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-bold shadow-inner">
                {profile.full_name?.[0]?.toUpperCase() || "T"}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{profile.full_name}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
            </div>
          )}

          {/* Links */}
          <div className="space-y-2">
            {navLinks.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => linkClasses(isActive)}
                onClick={closeMobileSidebar}
                title={collapsed ? label : ""}
              >
                {icon}
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              title={collapsed ? "Logout" : ""}
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
