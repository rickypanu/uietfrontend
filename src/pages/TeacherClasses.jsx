// src/pages/TeacherClasses.jsx
import React, { useState, useEffect } from "react";
import { PlusCircle, BookOpen, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { SUBJECTS } from "../constants/subjects";
import Select from "react-select";

export default function TeacherClasses() {
  const [department, setDepartment] = useState("");
  const [classes, setClasses] = useState([]);
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const employeeId = localStorage.getItem("userId");

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await api.get(`/classes/list/${employeeId}`);
      setClasses(res.data || []);
    } catch (err) {
      console.error("Failed to load classes", err);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/classes/create", {
        teacher_id: employeeId,
        department,
        branch,
        semester,
        section,
        subject,
      });
      setMessage("✅ Class created successfully");
      setClasses((prev) => [...prev, res.data]);
      setBranch("");
      setSemester("");
      setSection("");
      setSubject("");
    } catch (err) {
      setMessage("❌ Failed to create class");
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Page Title */}
      <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
        <BookOpen className="w-6 h-6 text-indigo-600" />
        Manage Classes
      </h1>

      {/* Feedback Message */}
      {message && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-md bg-green-50 text-green-700 border border-green-200 text-sm">
          {message}
        </div>
      )}

      {/* Create Class Form */}
      <form
        onSubmit={handleCreateClass}
        className="mt-6 bg-white p-6 rounded-xl shadow-md space-y-4"
      >
        <h3 className="text-md font-semibold text-gray-700">Create New Class</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
            className="border border-gray-300 p-2 rounded-md w-full text-sm bg-white"
          >
            <option value="">Select Department</option>
            <option value="UIET">UIET</option>
          </select>

          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            required
            className="border border-gray-300 p-2 rounded-md w-full text-sm bg-white"
          >
            <option value="">Select Branch</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="MECH">MECH</option>
            <option value="EEE">EEE</option>
          </select>

          <input
            type="number"
            placeholder="Semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            required
            className="border border-gray-300 p-2 rounded-md w-full text-sm"
          />

          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            required
            className="border border-gray-300 p-2 rounded-md w-full text-sm bg-white"
          >
            <option value="">Select Section</option>
            <option value="A">A</option>
            <option value="B">B</option>
            {/* <option value="C">C</option> */}
          </select>

            <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="border border-gray-300 p-2 rounded-md w-full text-sm bg-white"
            >
            <option value="">Select Subject</option>
            {branch && semester && SUBJECTS["BE"]?.[branch]?.[semester]?.map((subj, idx) => (
                <option key={idx} value={subj}>
                {subj}
                </option>
            ))}
            </select>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Create Class
          </button>
        </div>
      </form>

      {/* List of Classes */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Your Classes</h2>
        {classes.length === 0 ? (
          <p className="text-gray-500 text-sm">No classes created yet.</p>
        ) : (
          <ul className="grid gap-4">
            {classes.map((c, idx) => (
              <li
                key={idx}
                className="p-4 rounded-lg bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition flex justify-between items-center"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/teacher/classes/${c.id}`)}
                >
                  <div className="font-semibold text-gray-800">
                    {c.branch} - Sem {c.semester} - Sec {c.section}
                  </div>
                  <div className="text-sm text-gray-500">{c.subject}</div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-indigo-500" />

                  {/* Delete Button */}
                  <button
                    onClick={async () => {
                      if (!window.confirm("Are you sure you want to delete this class?")) return;

                      try {
                        const res = await api.delete(`/classes/${c.id}`);
                        // Show backend message
                        setMessage(res.data.message || "✅ Class deleted successfully");
                        // Remove class from state
                        setClasses(prev => prev.filter(cls => cls.id !== c.id));
                      } catch (err) {
                        console.error("Failed to delete class", err);
                        setMessage("❌ Failed to delete class");
                        setTimeout(() => setMessage(""), 3000);
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                    title="Delete Class"
                  >
                    🗑️
                  </button>

                </div>
              </li>
            ))}
          </ul>

        )}
      </div>
    </div>
  );
}