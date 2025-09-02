import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileDown, ArrowLeft } from "lucide-react";
import api from "../services/api";
import Papa from "papaparse";

export default function TeacherClassRegister() {
  const { classId } = useParams();
  const [classInfo, setClassInfo] = useState({});
  const [students, setStudents] = useState([]);
  const [dates, setDates] = useState([]);
  const [filterMonth, setFilterMonth] = useState("");
  const [percentFilter, setPercentFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchClassRegister();
  }, [classId, filterMonth]);

  const fetchClassRegister = async () => {
    try {
      let url = `/classes/register/${classId}`;
      if (filterMonth) {
        const monthNum = parseInt(filterMonth.split("-")[1]); // yyyy-mm → mm
        url += `?month=${monthNum}`;
      }
      const res = await api.get(url);
      setClassInfo(res.data.class_info || {});
      setStudents(res.data.students || []);
      setDates(res.data.dates || []);
    } catch (err) {
      console.error("Error fetching class register:", err);
    }
  };

  /** 🔹 Export register to CSV */
  const handleExport = () => {
    const csvData = filteredStudents.map((s) => {
      const row = { RollNo: s.roll_no, Name: s.name };
      dates.forEach((d) => {
        row[d] = s.attendance[d] || "❌";
      });
      row["Total Present"] = s.total_present;
      row["Total Classes"] = s.total_classes;
      row["Percentage"] = s.percentage;
      return row;
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];

    // filename with subject & section
    const fileName = `${classInfo.subject || "class"}_${classInfo.section || ""}_register_${today}.csv`;

    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /** 🔹 Apply % filter */
  const filteredStudents = students.filter((s) => {
    if (!percentFilter) return true;
    const numericPercent = parseFloat(s.percentage.replace("%", ""));
    return numericPercent < parseFloat(percentFilter);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-700 shadow"
        >
          <FileDown className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Class Info */}
      <div className="bg-white shadow rounded-2xl p-6 mb-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">📒 Class Register</h1>
        <div className="text-gray-600 space-y-1">
          <p>
            <span className="font-semibold text-gray-800">Department:</span>{" "}
            {classInfo.department}
          </p>
          <p>
            <span className="font-semibold text-gray-800">Branch:</span>{" "}
            {classInfo.branch} |{" "}
            <span className="font-semibold text-gray-800">Semester:</span>{" "}
            {classInfo.semester} |{" "}
            <span className="font-semibold text-gray-800">Section:</span>{" "}
            {classInfo.section}
          </p>
          <p>
            <span className="font-semibold text-gray-800">Subject:</span>{" "}
            {classInfo.subject}
          </p>
        </div>
      </div>

      {/* Filters */}
      {/* <div className="flex flex-wrap gap-4 mb-6"> */}
      <div className="bg-white shadow rounded-2xl p-6 mb-6 border border-gray-100">
        {/* Month Filter */}
        <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Filter by Month</label>
            <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>

        {/* Percentage Filter */}
        <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Show Below %</label>
            <input
            type="number"
            placeholder="e.g. 75"
            value={percentFilter}
            onChange={(e) => setPercentFilter(e.target.value)}
            className="border border-gray-300 p-2 rounded-lg w-32 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>
        </div>


      {/* Register Table */}
      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
            <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
                <th className="px-3 py-2 text-left">Roll No</th>
                <th className="px-3 py-2 text-left">Name</th>
                {dates.map((d) => (
                <th key={d} className="px-3 py-2 text-center whitespace-nowrap">
                    {d}
                </th>
                ))}
                <th className="px-3 py-2 text-center">Total</th>
                <th className="px-3 py-2 text-center">%</th>
            </tr>
            </thead>

            <tbody>
            {filteredStudents.map((s, idx) => {
                const numericPercent = parseFloat(s.percentage.replace("%", ""));
                const isLow = percentFilter && numericPercent < parseFloat(percentFilter);

                return (
                <tr
                    key={s.roll_no}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} ${
                    isLow ? "bg-red-100" : ""
                    }`}
                >
                    <td className="px-3 py-2">{s.roll_no}</td>
                    <td className="px-3 py-2">{s.name}</td>
                    {dates.map((d) => (
                    <td key={d} className="px-3 py-2 text-center">
                        {s.attendance[d] || "❌"}
                    </td>
                    ))}
                    <td className="px-3 py-2 text-center font-semibold">
                    {s.total_present}/{s.total_classes}
                    </td>
                    <td
                    className={`px-3 py-2 text-center font-semibold ${
                        numericPercent < 75 ? "text-red-600" : "text-indigo-600"
                    }`}
                    >
                    {s.percentage}
                    </td>
                </tr>
                );
            })}
            </tbody>

            {/* 🔹 Footer Row (Summary) */}
            <tfoot className="bg-gray-100 font-semibold">
            <tr>
                <td className="px-3 py-2 text-left" colSpan={2}>
                Summary
                </td>
                {dates.map((d, idx) =>
                idx === 0 ? (
                    <td key={d} className="px-3 py-2 text-center" colSpan={dates.length}>
                    Classes Held: {dates.length}
                    </td>
                ) : null
                )}
                <td className="px-3 py-2 text-center">
                {filteredStudents.reduce((acc, s) => acc + s.total_present, 0)}/
                {filteredStudents.reduce((acc, s) => acc + s.total_classes, 0)}
                </td>
                <td className="px-3 py-2 text-center text-indigo-700">
                {(
                    filteredStudents.reduce(
                    (acc, s) => acc + parseFloat(s.percentage.replace("%", "")),
                    0
                    ) / filteredStudents.length || 0
                ).toFixed(1)}
                %
                </td>
            </tr>
            </tfoot>
        </table>
        </div>

    </div>
  );
}
