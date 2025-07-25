import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  UserCircle,
  Info,
  CalendarCheck,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  X,
  Inbox,
} from "lucide-react";

const Sidebar = ({ onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);
  const closeMobileSidebar = () => setMobileOpen(false);

  const linkClasses = (isActive) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-100 transition ${
      isActive ? "bg-green-200 font-semibold" : "text-gray-700"
    }`;

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="sm:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileSidebar}
          className="bg-green-600 text-white p-2 rounded-full shadow"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Backdrop on mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
          onClick={closeMobileSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed sm:static top-0 left-0 z-50 h-full shadow-lg bg-white transition-all duration-300
          ${collapsed ? "w-20" : "w-64"} 
          ${mobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}
          sm:transition-none sm:translate-x-0`}
      >
        {/* Top Section */}
        <div className="h-full p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={toggleSidebar}
                className="text-green-600 hidden sm:block"
              >
                {collapsed ? <ChevronRight /> : <ChevronLeft />}
              </button>

              {/* Close on mobile */}
              <button
                onClick={closeMobileSidebar}
                className="text-green-600 sm:hidden"
              >
                <X />
              </button>
            </div>

            {!collapsed && (
              <h2 className="text-2xl font-bold text-green-700 flex items-center gap-2 mb-6">
                <GraduationCap className="w-6 h-6" />
                Student
              </h2>
            )}

            <div className="space-y-3">
              <NavLink
                to="/student/profile"
                className={({ isActive }) => linkClasses(isActive)}
                onClick={closeMobileSidebar}
              >
                <UserCircle className="w-5 h-5" />
                {!collapsed && <span>Profile</span>}
              </NavLink>

              <NavLink
                to="/student/about"
                className={({ isActive }) => linkClasses(isActive)}
                onClick={closeMobileSidebar}
              >
                <Info className="w-5 h-5" />
                {!collapsed && <span>About</span>}
              </NavLink>

              <NavLink
                to="/student/notifications"
                className={({ isActive }) => linkClasses(isActive)}
                onClick={closeMobileSidebar}
              >
                <Info className="w-5 h-5" />
                {!collapsed && <span>Notifications</span>}
              </NavLink>

              <NavLink
                to="/student"
                className={({ isActive }) => linkClasses(isActive)}
                onClick={closeMobileSidebar}
              >
                <CalendarCheck className="w-5 h-5" />
                {!collapsed && <span>Dashboard</span>}
              </NavLink>


            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 mt-6"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
