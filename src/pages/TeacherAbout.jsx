// src/pages/TeacherAbout.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info, KeyRound, Megaphone, BookOpen, FileDown, UserCircle, Layers, PieChart } from "lucide-react";

export default function TeacherAbout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-6 space-y-6 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            Teacher Portal Guide
          </h1>
          <button
            onClick={() => navigate("/teacher")}
            className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Introduction */}
        <p className="text-gray-700 leading-relaxed">
          Welcome to your attendance management dashboard. This guide will walk you through all the features, from generating OTPs to managing your class records.
        </p>

        {/* Guide Sections */}
        <div className="space-y-6">
          {/* Section: Generating OTP & Marking Attendance */}
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
            <h2 className="font-semibold text-lg text-blue-700 mb-2 flex items-center gap-2">
              <KeyRound className="w-5 h-5" /> <b>1. Generate & Share OTP</b>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Navigate to the "Generate OTP for Class" section on your dashboard.</li>
              <li>Select the <b>Course, Branch, Semester, and Subject</b> for your class.</li>
              <li>Choose the <b>Validity (in mins)</b> for the OTP.</li>
              <li>Click <b>"Generate OTP"</b>. The system uses your current location for security validation before creating the OTP.</li>
              <li>Share the generated OTP with your students. They will use it to mark their attendance.</li>
            </ul>
          </div>

          {/* Section: Monitoring Attendance */}
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
            <h2 className="font-semibold text-lg text-blue-700 mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5" /> <b>2. Monitor Live Attendance</b>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>On the dashboard, the "Today's OTPs" section lists all OTPs you've generated for the day.</li>
              <li>Click on any <b>OTP</b> to see a live list of students who have marked their attendance for that specific session.</li>
              <li>The dashboard automatically updates, showing you the attendance count in real-time.</li>
            </ul>
          </div>

          {/* Section: Managing Classes */}
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
            <h2 className="font-semibold text-lg text-blue-700 mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> <b>3. Manage Your Classes</b>
            </h2>
            <p className="text-gray-700">
              Go to the <b>"Classes"</b> page to manage all the classes you teach:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><b>Create</b> a new class by providing its details (Branch, Semester, etc.).</li>
              <li><b>View</b> a comprehensive list of all your created classes.</li>
              <li><b>Click</b> on any class to view its detailed register, analytics, and export options.</li>
            </ul>
          </div>

          {/* Section: Notifications */}
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
            <h2 className="font-semibold text-lg text-blue-700 mb-2 flex items-center gap-2">
              <Megaphone className="w-5 h-5" /> <b>4. Send Notifications</b>
            </h2>
            <p className="text-gray-700">
              Keep your students informed by sending targeted notifications:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mt-2">
              <li>On the <b>Notifications</b> page, compose your message.</li>
              <li>Select the target <b>Branch, Section, and Semester</b>.</li>
              <li>Optionally, attach a file (e.g., PDF, image).</li>
              <li>Set an <b>expiry time</b> for the notification.</li>
            </ul>
          </div>

          {/* Section: Profile & Logout */}
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
            <h2 className="font-semibold text-lg text-blue-700 mb-2 flex items-center gap-2">
              <UserCircle className="w-5 h-5" /> <b>5. Profile & Logout</b>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Click the <b>profile icon</b> in the top right to view your personal and professional details. You can also upload a profile photo.</li>
              <li>To end your session, click the <b>"Logout"</b> button. This will securely sign you out and clear your local data.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}