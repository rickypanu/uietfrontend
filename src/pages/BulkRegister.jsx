import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { FaDownload, FaArrowLeft, FaCloudUploadAlt } from "react-icons/fa";

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
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-6">
        
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl">
        {/* Header with back button and title */}
        <div className="flex items-center justify-between mb-8">
        {/* Back button on left */}
        <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
        >
            <FaArrowLeft /> Back
        </button>

        {/* Title in center */}
        <h2 className="flex-1 text-3xl font-bold text-center text-blue-900">
            Bulk User Registration
        </h2>

        {/* Right spacer for alignment */}
        <div className="w-[90px]"></div>
        </div>


        {/* Role selector as tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-100 rounded-lg overflow-hidden">
            <button
              onClick={() => setRole("student")}
              className={`px-6 py-2 font-medium ${
                role === "student"
                  ? "bg-blue-900 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setRole("teacher")}
              className={`px-6 py-2 font-medium ${
                role === "teacher"
                  ? "bg-blue-900 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              Teachers
            </button>
          </div>
        </div>

        {/* Upload section */}
        <form onSubmit={handleUpload} className="space-y-4">
          <label className="block text-gray-700 font-medium">
            Upload {role === "student" ? "Student" : "Teacher"} File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
          />

          <button
            disabled={loading}
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-900 text-white py-2 rounded-lg shadow hover:bg-blue-800 transition"
          >
            <FaCloudUploadAlt />
            {loading ? "Processing..." : "Upload & Register"}
          </button>
        </form>

        {/* Result file */}
        {resultFile && (
          <div className="mt-6">
            <a
              href={resultFile}
              download={`${role}_registration_result.xlsx`}
              className="w-full block text-center bg-green-600 text-white py-2 rounded-lg shadow hover:bg-green-500 transition"
            >
              Download Result File
            </a>
          </div>
        )}

        {/* Template download section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
            Download Templates
          </h3>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => downloadTemplate("student")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              <FaDownload /> Student Template
            </button>
            <button
              onClick={() => downloadTemplate("teacher")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              <FaDownload /> Teacher Template
            </button>
          </div>
        </div>

        
      </div>
    </div>
  );
}
