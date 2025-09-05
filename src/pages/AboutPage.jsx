import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Info, Star, BookOpen, HelpCircle, Filter, Bell, FileDown, UserRound, CalendarCheck, Calculator } from "lucide-react";

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
          <Info className="w-8 h-8 text-green-600" /> Navigating Your Student Dashboard
        </h1>
        <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
          A quick guide to help you use your attendance portal and all its features efficiently.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Key Features */}
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" /> Key Features
          </h2>
          <ul className="space-y-3 text-gray-700 text-[17px] leading-relaxed">
            <li>Secure OTP Marking: Ensures accurate attendance tracking.</li>
            <li>Personalized Subjects: Displays subjects based on your profile.</li>
            <li>Live OTP Validation: Get instant feedback on the OTP status.</li>
            <li>Enhanced Security: Uses device fingerprinting and GPS for security.</li>
            <li>Flexible Filtering: Filter history by subject or date.</li>
            <li>Exportable Records: Download your attendance as a CSV file.</li>
            <li>Stay Notified: The bell icon shows new updates from faculty.</li>
            <li>Responsive Design: Works seamlessly on any device.</li>
          </ul>
        </section>

        {/* How to Mark Attendance */}
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" /> How to Mark Your Attendance
          </h2>
          <ol className="list-decimal ml-5 space-y-2 text-[17px] text-gray-700 leading-relaxed">
            <li>Log in with your student credentials.</li>
            <li>Select the correct subject from the dropdown menu.</li>
            <li>Enter the 6-character OTP from your teacher. Pasting is disabled.</li>
            <li>The OTP field will show a green border for a valid OTP or a red border if it's incorrect.</li>
            <li>Click the "Mark Attendance" button.</li>
            <li>Successful entries will appear in your attendance history.</li>
          </ol>
        </section>

        {/* Attendance History & Tools */}
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition md:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 text-green-500" /> Viewing Your Records
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Attendance History Table</h3>
                    <p className="text-[17px] text-gray-700 leading-relaxed">
                        Your history table provides a clear log of every class you've marked:
                    </p>
                    <ul className="list-disc ml-5 mt-3 text-[17px] text-gray-700 space-y-2">
                        <li>The table lists the subject, date, and time for each entry.</li>
                        <li>Use the subject and date filters to find specific records quickly.</li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Exporting Your Data</h3>
                    <p className="text-[17px] text-gray-700 leading-relaxed">
                        You can download a copy of your attendance history at any time:
                    </p>
                    <ul className="list-disc ml-5 mt-3 text-[17px] text-gray-700 space-y-2">
                        <li>Click "Export CSV" at the bottom of the table.</li>
                        <li>The downloaded file includes your attendance data and profile details.</li>
                    </ul>
                </div>
            </div>
        </section>
        
        {/* Analysis & Profile */}
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition md:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-indigo-500" /> Analysis & Profile
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Attendance Analysis</h3>
                    <p className="text-[17px] text-gray-700 leading-relaxed">
                        The Analysis page helps you understand your attendance with detailed insights:
                    </p>
                    <ul className="list-disc ml-5 mt-3 text-[17px] text-gray-700 space-y-2">
                        <li>View your overall and subject-wise attendance percentage.</li>
                        <li>Use the Attendance Target Calculator to plan ahead.</li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Profile & Help</h3>
                    <p className="text-[17px] text-gray-700 leading-relaxed">
                        Manage your account and get support:
                    </p>
                    <ul className="list-disc ml-5 mt-3 text-[17px] text-gray-700 space-y-2">
                        <li>Click the user icon to view and edit your profile details.</li>
                        <li>The red "Logout" button securely ends your session.</li>
                        <li>For technical issues, contact your class teacher or the system administrator.</li>
                    </ul>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;