import { useState, useEffect } from "react";
import { getStudentAttendanceAnalysis } from "../services/api"; // adjust path if needed

export default function AttendanceAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [subject, setSubject] = useState("");

  const rollNo = localStorage.getItem("userId"); // ✅ consistent with dashboard

  useEffect(() => {
    if (!rollNo) {
      console.error("No roll number (userId) found in localStorage!");
      return;
    }

    getStudentAttendanceAnalysis(rollNo, month, year, subject)
      .then((data) => setAnalysis(data))
      .catch((err) => {
        console.error("Failed to fetch attendance analysis:", err);
      });
  }, [rollNo, month, year, subject]);

  if (!rollNo) {
    return (
      <p className="p-6 text-red-600 font-semibold">
        ⚠️ No roll number found. Please log in again.
      </p>
    );
  }

  if (!analysis) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">📊 Attendance Analysis</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border rounded p-2"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded p-2 w-24"
        />

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">All Subjects</option>
          {Object.keys(analysis.subjects).map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {/* Overall Attendance */}
      <div className="mb-6">
        <p className="font-semibold">
          Overall Attendance: {analysis.overall.percentage}%
        </p>
        <div className="w-full bg-gray-200 h-3 rounded-full mt-2">
          <div
            className="bg-green-500 h-3 rounded-full"
            style={{ width: `${analysis.overall.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Per Subject Stats */}
      <div className="grid gap-4">
        {Object.entries(analysis.subjects).map(([sub, stats]) => (
          <div key={sub} className="p-4 border rounded-lg shadow-sm">
            <p className="font-semibold">{sub}</p>
            <p>
              {stats.attended}/{stats.total} classes → {stats.percentage}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
