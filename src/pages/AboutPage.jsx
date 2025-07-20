const AboutPage = () => (
  <div className="p-6 max-w-5xl mx-auto bg-white rounded-3xl shadow-lg text-gray-800 space-y-10 border border-gray-200 mt-6">
    {/* Title */}
    <div className="text-center">
      <h1 className="text-4xl font-extrabold text-green-700 mb-2">
        🎓 Student Dashboard Overview
      </h1>
      <p className="text-lg text-gray-500">
        Everything you need to know about using the platform efficiently.
      </p>
    </div>

    {/* What You Can Do */}
    <section className="bg-gray-50 p-6 rounded-2xl shadow-inner border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ Features</h2>
      <ul className="space-y-3 text-gray-700 text-[17px] leading-relaxed">
        <li>📌 Mark your attendance using OTP shared by your teacher.</li>
        <li>📊 View a detailed history of your subject-wise attendance.</li>
        <li>🔍 Apply filters by subject, date, or status for quick insights.</li>
        <li>📁 Export your attendance as a downloadable CSV file.</li>
        <li>👤 Access and view your registered profile details.</li>
      </ul>
    </section>

    {/* How to Use */}
    <section className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🛠 Getting Started</h2>
      <ol className="list-decimal ml-5 space-y-2 text-[17px] text-gray-700 leading-relaxed">
        <li>Login using your Student ID and Password.</li>
        <li>Go to the <strong>"Enter OTP to Mark Attendance"</strong> section on the Dashboard.</li>
        <li>Enter the OTP provided by your teacher.</li>
        <li>Click <strong>"Mark Attendance"</strong> to mark your presence.</li>
        <li>Visit <strong>"View Attendance"</strong> anytime to track progress.</li>
      </ol>
    </section>

    {/* Export Attendance */}
    <section className="p-6 rounded-2xl bg-gray-50 border border-gray-200 shadow-inner">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📤 Export Attendance</h2>
      <p className="text-[17px] text-gray-700 leading-relaxed">
        To keep a personal copy of your attendance, click the 
        <strong> "Export as CSV"</strong> button available on the Attendance History page.
      </p>
    </section>

    {/* Need Help */}
    <section className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">❓ Need Assistance?</h2>
      <p className="text-[17px] text-gray-700 leading-relaxed">
        Facing issues or have questions? Please reach out to your teacher or contact the admin directly.
      </p>
    </section>
  </div>
);

export default AboutPage;
