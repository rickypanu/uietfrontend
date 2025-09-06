import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileDown, ArrowLeft } from "lucide-react";
import api from "../services/api";
import Papa from "papaparse";
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend as PieLegend, ResponsiveContainer as PieResponsive,
  LineChart, Line, XAxis, YAxis, Tooltip as LineTooltip, Legend as LineLegend, ResponsiveContainer as LineResponsive,
  BarChart, Bar, Tooltip as BarTooltip, Legend as BarLegend, XAxis as BarXAxis, YAxis as BarYAxis, ResponsiveContainer as BarResponsive
} from "recharts";

export default function TeacherClassRegister() {
  const { classId } = useParams();
  const [classInfo, setClassInfo] = useState({});
  const [students, setStudents] = useState([]);
  const [dates, setDates] = useState([]);
  // const [filterMonth, setFilterMonth] = useState("");
  const [filterMonth, setFilterMonth] = useState(() => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
});

  const [filterRollNo, setFilterRollNo] = useState("")
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

  /** Export CSV */
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

    const fileName = `${classInfo.subject || "class"}_${classInfo.section || ""}_register_${today}.csv`;

    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // const filteredStudents = students.filter((s) => {
  //   if (!percentFilter) return true;
  //   const numericPercent = parseFloat(s.percentage.replace("%", ""));
  //   return numericPercent < parseFloat(percentFilter);
  // });
  const filteredStudents = students.filter((s) => {
    let match = true;

    // Roll number filter
    if (filterRollNo) {
      match = match && s.roll_no.toString().includes(filterRollNo.trim());
    }

    // Percentage filter
    if (percentFilter) {
      const numericPercent = parseFloat(s.percentage.replace("%", ""));
      match = match && numericPercent < parseFloat(percentFilter);
    }

    return match;
  });


  /** Pie chart data: above/below threshold */
  const threshold = 75;
  const aboveCount = filteredStudents.filter(s => parseFloat(s.percentage.replace("%", "")) >= threshold).length;
  const belowCount = filteredStudents.length - aboveCount;
  const pieData = [
    { name: `Above ${threshold}%`, value: aboveCount },
    { name: `Below ${threshold}%`, value: belowCount },
  ];
  const pieColors = ["#4f46e5", "#ef4444"];

  /** Line chart data: attendance trend */
  const lineData = dates.map(date => {
    let presentCount = 0;
    filteredStudents.forEach(s => {
      if (s.attendance[date] === "✔" || s.attendance[date] === "P") presentCount++;
    });
    return { date, present: presentCount, absent: filteredStudents.length - presentCount };
  });

  /** Stacked bar chart: per student present/absent */
  const barData = filteredStudents.map(s => {
    const totalPresent = Object.values(s.attendance).filter(v => v === "✔" || v === "P").length;
    const totalAbsent = Object.values(s.attendance).length - totalPresent;
    return { name: s.name, Present: totalPresent, Absent: totalAbsent };
  });

  // Custom X-axis tick component
const CustomizedAxisTick = ({ x, y, payload }) => {
  const name = payload.value;
  const words = name.split(" "); // split by space
  return (
    <g transform={`translate(${x},${y + 10})`}>
      {words.map((word, index) => (
        <text
          key={index}
          x={0}
          y={index * 12} // line height
          textAnchor="middle"
          fill="#666"
          fontSize={12}
        >
          {word}
        </text>
      ))}
    </g>
  );
};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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
      <div className="bg-white shadow rounded-2xl p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">📒 Class Register</h1>
        <div className="text-gray-600 space-y-1">
          <p><span className="font-semibold text-gray-800">Department:</span> {classInfo.department}</p>
          <p>
            <span className="font-semibold text-gray-800">Course:</span> {classInfo.course} |{" "}
            <span className="font-semibold text-gray-800">Branch:</span> {classInfo.branch} |{" "}
            <span className="font-semibold text-gray-800">Semester:</span> {classInfo.semester} |{" "}
            <span className="font-semibold text-gray-800">Section:</span> {classInfo.section}
          </p>
          <p><span className="font-semibold text-gray-800">Subject:</span> {classInfo.subject}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 gap-4">
      <label className="text-xl font-medium text-black-700 mb-1">Filter</label>
      <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 flex flex-wrap gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Month</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Roll No</label>
          <input
            type="number"
            value={filterRollNo}
            onChange={(e) => setFilterRollNo(e.target.value)}
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

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
      </div>

      {/* Register Table */}
      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left">Roll No</th>
              <th className="px-3 py-2 text-left">Name</th>
              {dates.map((d) => (
                <th key={d} className="px-3 py-2 text-center whitespace-nowrap">{d}</th>
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
                <tr key={s.roll_no} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} ${isLow ? "bg-red-100" : ""}`}>
                  <td className="px-3 py-2">{s.roll_no}</td>
                  <td className="px-3 py-2">{s.name}</td>
                  {dates.map((d) => (
                    <td key={d} className="px-3 py-2 text-center">{s.attendance[d] || "❌"}</td>
                  ))}
                  <td className="px-3 py-2 text-center font-semibold">{s.total_present}/{s.total_classes}</td>
                  <td className={`px-3 py-2 text-center font-semibold ${numericPercent < 75 ? "text-red-600" : "text-indigo-600"}`}>{s.percentage}</td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer Summary */}
          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              <td className="px-3 py-2 text-left" colSpan={2}>Summary</td>
              {dates.map((d, idx) => idx === 0 ? (
                <td key={d} className="px-3 py-2 text-center" colSpan={dates.length}>Classes Held: {dates.length}</td>
              ) : null)}
              <td className="px-3 py-2 text-center">
                {filteredStudents.reduce((acc, s) => acc + s.total_present, 0)}/
                {filteredStudents.reduce((acc, s) => acc + s.total_classes, 0)}
              </td>
              <td className="px-3 py-2 text-center text-indigo-700">
                {(filteredStudents.reduce((acc, s) => acc + parseFloat(s.percentage.replace("%","")),0)/filteredStudents.length || 0).toFixed(1)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 🔹 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white shadow rounded-2xl p-6 border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Attendance Distribution</h2>
          <PieResponsive width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <PieTooltip />
              <PieLegend />
            </PieChart>
          </PieResponsive>
        </div>

        {/* Line Chart */}
        <div className="bg-white shadow rounded-2xl p-6 border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Attendance Trend</h2>
          <LineResponsive width="100%" height={250}>
            <LineChart data={lineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" />
              <YAxis />
              <LineTooltip />
              <LineLegend />
              <Line type="monotone" dataKey="present" stroke="#4f46e5" name="Present" />
              <Line type="monotone" dataKey="absent" stroke="#ef4444" name="Absent" />
            </LineChart>
          </LineResponsive>
        </div>

        {/* Stacked Bar Chart */}
        <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Student Attendance</h2>
          <BarResponsive width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
              {/* <BarXAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                interval={0} 
                height={60} 
              /> */}
              <BarXAxis 
                dataKey="name" 
                interval={0} 
                height={50} 
                tick={<CustomizedAxisTick />}
              />

              <BarYAxis />
              <BarTooltip />
              <BarLegend />
              <Bar dataKey="Present" stackId="a" fill="#4f46e5" />
              <Bar dataKey="Absent" stackId="a" fill="#ef4444" />
            </BarChart>
          </BarResponsive>
        </div>
      </div>
    </div>
  );
}
