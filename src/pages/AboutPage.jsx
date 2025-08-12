import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Info, Star, BookOpen, HelpCircle, Filter, Bell, FileDown, UserRound, CalendarCheck } from "lucide-react";

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative max-w-6xl mx-auto p-8 mt-8 bg-gradient-to-br from-white via-gray-50 to-green-50 rounded-3xl shadow-2xl border border-gray-200">
      {/* Close Button */}
      <button
        onClick={() => navigate("/student")}
        className="absolute top-5 right-5 p-2 rounded-full bg-white shadow hover:bg-red-50 transition"
        title="Back to Dashboard"
      >
        <X className="w-5 h-5 text-gray-600 hover:text-red-500" />
      </button>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-green-700 flex justify-center items-center gap-3">
          <Info className="w-8 h-8 text-green-600" /> About the Student Dashboard
        </h1>
        <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
          Learn how to make the most of your student attendance portal and all its features.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Key Features */}
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" /> Key Features
          </h2>
          <ul className="space-y-3 text-gray-700 text-[17px] leading-relaxed">
            <li>🔐 Secure OTP Attendance marking.</li>
            <li>📚 Subjects auto-loaded based on your profile.</li>
            <li>✅ Live OTP verification before marking attendance.</li>
            <li>🌐 Device fingerprint & GPS location capture for security.</li>
            <li>🔍 Filter attendance by subject or date.</li>
            <li>📤 Export attendance as a CSV file with profile metadata.</li>
            <li>👤 View your full student profile anytime.</li>
            <li>🔔 Get notified of important updates from teachers/admins.</li>
            <li>📱 Fully responsive design for mobile, tablet, and desktop.</li>
            <li>🚪 One-click secure logout.</li>
          </ul>
        </section>

        {/* How to Mark Attendance */}
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" /> How to Mark Attendance
          </h2>
          <ol className="list-decimal ml-5 space-y-2 text-[17px] text-gray-700 leading-relaxed">
            <li>Login with your student credentials.</li>
            <li>Select the subject from the dropdown menu.</li>
            <li>Enter the OTP given by your teacher (pasting disabled).</li>
            <li>Check OTP status — green border = valid, red = invalid.</li>
            <li>Click <strong>“Mark Attendance”</strong>.</li>
            <li>Successful entries appear in your Attendance History table.</li>
          </ol>
        </section>

        {/* Filtering Attendance */}
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Filter className="w-6 h-6 text-purple-500" /> Filtering Your Attendance
          </h2>
          <ul className="text-[17px] text-gray-700 leading-relaxed space-y-3">
            <li>🎯 Select a subject and/or date in the Filter Attendance section.</li>
            <li>🖱 Click <strong>Apply</strong> to filter your records.</li>
            <li>🔄 Click <strong>Reset</strong> to view all records again.</li>
          </ul>
        </section>

        {/* Attendance History */}
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-green-500" /> Viewing Attendance History
          </h2>
          <p className="text-[17px] text-gray-700 leading-relaxed">
            Your Attendance History table lists:
          </p>
          <ul className="list-disc ml-5 text-gray-700 mt-2 space-y-2">
            <li>📌 Subject (in uppercase)</li>
            <li>📅 Date of marking</li>
            <li>⏰ Time of marking</li>
          </ul>
          <p className="mt-2 text-gray-600">
            Rows are striped for better readability and update instantly after marking attendance or applying filters.
          </p>
        </section>

        {/* Exporting Attendance */}
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileDown className="w-6 h-6 text-green-500" /> Exporting Attendance
          </h2>
          <ul className="text-[17px] text-gray-700 leading-relaxed space-y-3">
            <li>📁 Click <strong>Export CSV</strong> at the bottom of the Attendance History section.</li>
            <li>📝 Download includes your attendance data + profile details.</li>
            <li>📂 File name contains your roll number and export date.</li>
          </ul>
        </section>

        {/* Notifications & Profile */}
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-6 h-6 text-yellow-500" /> Notifications & Profile
          </h2>
          <ul className="text-[17px] text-gray-700 leading-relaxed space-y-3">
            <li>🔔 Bell icon shows new updates from teachers/admins.</li>
            <li>🔴 Red badge = unread notifications count.</li>
            <li>👤 Click the user icon to view your full profile details (read-only).</li>
          </ul>
        </section>

        {/* Logout & Help */}
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition md:col-span-2">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-red-500" /> Logout & Help
          </h2>
          <p className="text-[17px] text-gray-700 leading-relaxed">
            🚪 Click the red <strong>Logout</strong> button in the top bar to end your session — this clears all local data and redirects to login.
          </p>
          <p className="text-[17px] text-gray-700 leading-relaxed mt-3">
            ❓ For help with OTP issues, location access, or data errors, contact your class teacher or the system administrator.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
