import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { FaDownload, FaArrowLeft } from "react-icons/fa";

export default function BulkRegister() {
  const [role, setRole] = useState("student");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultFile, setResultFile] = useState(null);
  const navigate = useNavigate();

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file!");

    setLoading(true);
    setResultFile(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpoint =
        role === "student"
          ? "/admin/register/bulk_students"
          : "/admin/register/bulk_teachers";

      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setResultFile(url);
    } catch (err) {
      alert(err.response?.data?.detail || "Error uploading file");
    }

    setLoading(false);
  };

  // Download template
  const downloadTemplate = async (type) => {
    try {
      const endpoint =
        type === "student"
          ? "/admin/download/student_template"
          : "/admin/download/teacher_template";

      const response = await api.get(endpoint, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        type === "student" ? "students_template.xlsx" : "teachers_template.xlsx"
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Error downloading template");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-900">
          Bulk Registration
        </h2>

        {/* Role selector */}
        <div className="flex justify-center mb-4 space-x-4">
          <button
            onClick={() => setRole("student")}
            className={`px-4 py-2 rounded ${
              role === "student"
                ? "bg-blue-900 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setRole("teacher")}
            className={`px-4 py-2 rounded ${
              role === "teacher"
                ? "bg-blue-900 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Teachers
          </button>
        </div>

        {/* Upload form */}
        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full border p-2 rounded"
          />

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-900 text-white py-2 rounded shadow hover:bg-blue-800"
          >
            {loading ? "Processing..." : "Upload & Register"}
          </button>
        </form>

        {resultFile && (
          <div className="mt-6 text-center">
            <a
              href={resultFile}
              download={`${role}_registration_result.xlsx`}
              className="text-green-600 font-medium underline"
            >
              Download Result File
            </a>
          </div>
        )}

        {/* Template download buttons */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => downloadTemplate("student")}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-500"
          >
            <FaDownload className="w-4 h-4" /> Student Template
          </button>
          <button
            onClick={() => downloadTemplate("teacher")}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-500"
          >
            <FaDownload className="w-4 h-4" /> Teacher Template
          </button>
        </div>

        {/* Back button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            <FaArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
