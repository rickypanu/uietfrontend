// src/pages/TeacherAbout.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";

export default function TeacherAbout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-6 space-y-6 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            How to Use Teacher Portal
          </h1>
          <button
            onClick={() => navigate("/teacher")}
            className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Guide Steps */}
        <div className="space-y-4 text-gray-700">
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
            <h2 className="font-semibold text-lg text-blue-700 mb-2">1. Generate OTP</h2>
            <p>Select your course, branch, semester, and subject. Set the OTP duration and click "Generate OTP". Your current location is used for validation.</p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
            <h2 className="font-semibold text-lg text-blue-700 mb-2">2. Share OTP</h2>
            <p>Share the generated OTP with students. They will use this to mark their attendance within the given validity period.</p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
            <h2 className="font-semibold text-lg text-blue-700 mb-2">3. Monitor Attendance</h2>
            <p>Track attendance in real time. You can see how many students marked attendance for each OTP.</p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
            <h2 className="font-semibold text-lg text-blue-700 mb-2">4. View & Export Records</h2>
            <p>Use filters (by date or month) to view attendance records. You can also export records as CSV files for documentation or reporting.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
