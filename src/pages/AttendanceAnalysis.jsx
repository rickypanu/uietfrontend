import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentAttendanceAnalysis, getAttendanceTarget } from "../services/api";

export default function AttendanceAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [subject, setSubject] = useState("");

  // 🎯 Target calculator states
  const [targetSubject, setTargetSubject] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [targetPercentage, setTargetPercentage] = useState("");
  const [targetResult, setTargetResult] = useState(null);
  const [loadingTarget, setLoadingTarget] = useState(false);

  const navigate = useNavigate();
  const rollNo = localStorage.getItem("userId");

  // 📊 Fetch attendance analysis
  useEffect(() => {
    if (!rollNo) return;
    getStudentAttendanceAnalysis(rollNo, month, year, subject)
      .then((data) => setAnalysis(data))
      .catch((err) => console.error("Failed to fetch attendance analysis:", err));
  }, [rollNo, month, year, subject]);

  if (!rollNo) {
    return (
      <p className="p-6 text-red-600 font-semibold">
        ⚠️ No roll number found. Please log in again.
      </p>
    );
  }

  if (!analysis) return <p className="p-6">Loading...</p>;

  // 🎯 Handle Target Calculator
  const handleTargetCheck = async () => {
    if (!targetSubject || !fromDate || !targetPercentage) {
      alert("Please select subject, from date, and target percentage.");
      return;
    }
    setLoadingTarget(true);
    try {
      const data = await getAttendanceTarget(
        rollNo,
        targetSubject,
        targetPercentage,
        fromDate,
        toDate || undefined
      );
      setTargetResult(data);
    } catch (err) {
      console.error("Failed to fetch target analysis:", err);
      alert("Error fetching target data. Try again.");
    } finally {
      setLoadingTarget(false);
    }
  };

  return (
    <div className="p-6">
      {/* 🔙 Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
      >
        ← Back
      </button>

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(analysis.subjects).map(([sub, stats]) => (
          <div
            key={sub}
            className="p-4 border rounded-2xl shadow-md bg-white hover:shadow-lg transition"
          >
            <p className="font-semibold text-lg mb-2">{sub}</p>
            <p className="text-gray-700">
              {stats.attended}/{stats.total} classes →{" "}
              <span className="font-medium">{stats.percentage}%</span>
            </p>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* 🎯 Attendance Target Calculator */}
      <div className="mt-10 p-6 bg-yellow-50 rounded-2xl shadow">
        <h2 className="text-lg font-bold mb-4">🎯 Attendance Target Calculator</h2>

        <div className="flex flex-wrap gap-4 mb-4">
          <select
            value={targetSubject}
            onChange={(e) => setTargetSubject(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">Select Subject</option>
            {Object.keys(analysis.subjects).map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border rounded p-2"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded p-2"
          />

          <input
            type="number"
            placeholder="Target %"
            value={targetPercentage}
            onChange={(e) => setTargetPercentage(e.target.value)}
            className="border rounded p-2 w-28"
          />

          <button
            onClick={handleTargetCheck}
            disabled={loadingTarget}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            {loadingTarget ? "Checking..." : "Check"}
          </button>
        </div>

        {targetResult && (
          <div className="p-4 bg-white border rounded-xl shadow-md">
            <p className="font-semibold">{targetResult.message}</p>
            <p className="text-gray-600 text-sm mt-1">
              Range: {targetResult.date_range} | Current:{" "}
              {targetResult.current_percentage}% | Needed:{" "}
              {targetResult.needed_classes} classes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
