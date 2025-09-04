import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentAttendanceAnalysis, getAttendanceTarget } from "../services/api";
import { Calculator, FileBarChart2 } from "lucide-react";
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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600 font-semibold bg-red-50 px-4 py-2 rounded-lg shadow">
          ⚠️ No roll number found. Please log in again.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 text-lg">Loading attendance data...</p>
      </div>
    );
  }

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
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">        
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileBarChart2 className="w-6 h-6 text-blue-600" />
          Attendance Analysis
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
        >
          ← Back
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
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
          className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
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
      <div className="mb-10 bg-white p-6 rounded-2xl shadow-md">
        <p className="font-semibold text-lg text-gray-800">
          Overall Attendance:{" "}
          <span className="text-blue-600">{analysis.overall.percentage}%</span>
        </p>
        <div className="w-full bg-gray-200 h-3 rounded-full mt-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all"
            style={{ width: `${analysis.overall.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Per Subject Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Object.entries(analysis.subjects).map(([sub, stats]) => (
          <div
            key={sub}
            className="p-6 border rounded-2xl shadow-md bg-white hover:shadow-lg transition"
          >
            <p className="font-semibold text-xl mb-2 text-gray-800">{sub}</p>
            <p className="text-gray-700">
              <span className="font-medium">{stats.attended}</span> /{" "}
              {stats.total} classes →{" "}
              <span className="font-semibold text-blue-600">
                {stats.percentage}%
              </span>
            </p>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-3">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* 🎯 Attendance Target Calculator */}
      <div className="mt-12 p-8 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-md">
        <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-green-600" />
          Attendance Target Calculator
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 items-end">
        {/* Subject */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            value={targetSubject}
            onChange={(e) => setTargetSubject(e.target.value)}
            className="border rounded-lg p-2 h-12 focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select Subject</option>
            {Object.keys(analysis.subjects).map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
        {/* From Date */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border rounded-lg p-2 h-12 focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* To Date */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded-lg p-2 h-12 focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Target Percentage */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Target Percentage</label>
          <input
            type="number"
            placeholder="Target %"
            value={targetPercentage}
            onChange={(e) => setTargetPercentage(e.target.value)}
            className="border rounded-lg p-2 h-12 focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Check Button */}
        <button
          onClick={handleTargetCheck}
          disabled={loadingTarget}
          className="px-4 py-2 h-12 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition"
        >
          {loadingTarget ? "Checking..." : "Check"}
        </button>
      </div>


        {targetResult && (
          <div className="p-6 bg-white border rounded-xl shadow-md">
            <p className="font-semibold text-gray-800">{targetResult.message}</p>
            <p className="text-gray-600 text-sm mt-2">
              <span className="font-medium">Range:</span>{" "}
              {targetResult.date_range} |{" "}
              <span className="font-medium">Current:</span>{" "}
              {targetResult.current_percentage}% |{" "}
              <span className="font-medium">Needed:</span>{" "}
              {targetResult.needed_classes} classes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
