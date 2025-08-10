import React, { useEffect, useState } from "react";

const TeacherAttendanceSummary = ({ latestAttendance }) => {
  const [dateTime, setDateTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle no data
  if (!latestAttendance || latestAttendance.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-bold mb-2">Attendance Summary</h2>
        <p className="text-sm text-gray-500">No OTP generated today.</p>
      </div>
    );
  }

  const latest = latestAttendance[0]; // Latest OTP
  const students = latest.students || []; // Array of student objects
  const studentCount = students.length;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-2">Attendance Summary</h2>
      <p className="text-sm text-gray-500">
        {dateTime.toLocaleDateString()} {dateTime.toLocaleTimeString()}
      </p>
      <p className="mt-2">
        <strong>Latest OTP:</strong> {latest.otp || "N/A"}
      </p>
      <p>
        <strong>Students Marked:</strong> {studentCount}
      </p>

      {/* Student List */}
      {studentCount > 0 && (
        <div className="mt-3">
          <h3 className="text-sm font-semibold mb-1">Students:</h3>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {students.map((stu, index) => (
              <li key={index}>
                {stu.name} — {stu.roll_number}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceSummary;
