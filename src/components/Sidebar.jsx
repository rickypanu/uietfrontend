import { useState } from "react";
import { NavLink } from "react-router-dom";
import { UserCircle, Info, CalendarCheck, LogOut, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";

const Sidebar = ({ onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  const linkClasses = (isActive) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-100 transition ${
      isActive ? "bg-green-200 font-semibold" : "text-gray-700"
    }`;

  return (
    <div className={`h-screen p-4 shadow-lg bg-white transition-all duration-300 ${collapsed ? "w-20" : "w-64"} flex flex-col justify-between`}>
      {/* Top Section */}
      <div>
        <button
          onClick={toggleSidebar}
          className="text-green-600 mb-6 ml-auto"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>

        {!collapsed && (
          <h2 className="text-2xl font-bold text-green-700 flex items-center gap-2 mb-6">
            <GraduationCap className="w-6 h-6" />
            Student
          </h2>
        )}

        <div className="space-y-3">
          <NavLink to="/student/profile" className={({ isActive }) => linkClasses(isActive)}>
            <UserCircle className="w-5 h-5" />
            {!collapsed && <span>Profile</span>}
          </NavLink>

          <NavLink to="/student/about" className={({ isActive }) => linkClasses(isActive)}>
            <Info className="w-5 h-5" />
            {!collapsed && <span>About</span>}
          </NavLink>

          <NavLink to="/student" className={({ isActive }) => linkClasses(isActive)}>
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
  );
};

export default Sidebar;
