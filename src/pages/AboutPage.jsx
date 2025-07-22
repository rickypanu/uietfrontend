import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

const AboutPage= () => {
  const navigate = useNavigate();

  return (
    <div className="relative p-6 max-w-5xl mx-auto bg-white rounded-3xl shadow-lg text-gray-800 space-y-10 border border-gray-200 mt-6">
      {/* Close Button */}
      <button
        onClick={() => navigate("/student")}
        className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
        title="Back to Dashboard"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-green-700 mb-2">
          🧑‍🎓 About the Student Dashboard
        </h1>
        <p className="text-lg text-gray-500">
          Learn how to make the most out of your student attendance portal.
        </p>
      </div>

      {/* Key Features */}
      <section className="bg-gray-50 p-6 rounded-2xl shadow-inner border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ Key Features</h2>
        <ul className="space-y-3 text-gray-700 text-[17px] leading-relaxed">
          <li>🔐 Mark your attendance by entering a unique OTP shared by the teacher.</li>
          <li>🌐 Captures device fingerprint and location for secure verification.</li>
          <li>📚 Subject list is dynamically loaded based on your profile (course, branch, semester).</li>
          <li>📅 View detailed attendance history with subject and time details.</li>
          <li>🔍 Filter attendance by subject or specific date.</li>
          <li>📤 Export attendance history as a downloadable CSV file.</li>
          <li>👤 Access your personal profile with name, roll number, department, course, etc.</li>
          <li>📴 Secure logout with one-click session clear.</li>
        </ul>
      </section>

      {/* How to Mark Attendance */}
      <section className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🛠 How to Mark Attendance</h2>
        <ol className="list-decimal ml-5 space-y-2 text-[17px] text-gray-700 leading-relaxed">
          <li>Login using your student credentials.</li>
          <li>Select the appropriate subject from the dropdown.</li>
          <li>Type in the OTP provided by your teacher (pasting is disabled).</li>
          <li>Click on <strong>“Mark Attendance”</strong>.</li>
          <li>Successful entries will appear in your attendance history table.</li>
        </ol>
      </section>

      {/* Attendance Filtering & Export */}
      <section className="p-6 rounded-2xl bg-gray-50 border border-gray-200 shadow-inner">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Filter & Export Attendance</h2>
        <ul className="text-[17px] text-gray-700 leading-relaxed space-y-3">
          <li>🎯 Use filters to view attendance for a specific subject or date.</li>
          <li>🧾 Attendance is displayed in a table format with timestamps.</li>
          <li>📁 Click <strong>“Export CSV”</strong> to download your full attendance record along with profile metadata.</li>
        </ul>
      </section>

      {/* Help Section */}
      <section className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">❓ Need Help?</h2>
        <p className="text-[17px] text-gray-700 leading-relaxed">
          If you face any issues while marking attendance or viewing records, contact your class teacher or system admin.
        </p>
      </section>
    </div>
  );
};

export default AboutPage;
