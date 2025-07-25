// src/pages/TeacherSendNotification.jsx
import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";


export default function TeacherSendNotification() {
  const [formData, setFormData] = useState({
    employee_id: "",
    message: "",
    branch: "",
    section: "",
    semester: "",
    expiry_time: "",
  });
  const [file, setFile] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async (empId) => {
    try {
      const res = await api.get(`/teacher/notifications/${empId}`);
      setNotifications(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    Object.entries(formData).forEach(([key, val]) => form.append(key, val));
    if (file) form.append("file", file);

    try {
      await api.post("/teacher/send-notification", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Notification sent!");
      setFormData({ ...formData, message: "" });
      setFile(null);
      fetchNotifications(formData.employee_id);
    } catch (err) {
      alert("Error sending notification");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this notification?");
    if (!confirmDelete) return;

    const form = new FormData();
    form.append("employee_id", formData.employee_id);

    try {
      await api.delete(`/teacher/notifications/${id}`, {
        data: form,
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Deleted successfully");
      fetchNotifications(formData.employee_id);
    } catch (err) {
      alert("Failed to delete");
    }
  };

  useEffect(() => {
    if (formData.employee_id.trim().length > 0) {
      fetchNotifications(formData.employee_id);
    }
  }, [formData.employee_id]);

  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Send Notification</h2>
        <button
          onClick={() => navigate("/teacher")}
          className="flex items-center gap-2 text-sm bg-gray-200 hover:bg-red-100 text-red-600 px-3 py-1 rounded-md transition"
        >
          <XCircle size={18} />
          Dashboard
        </button>
      </div>
<form onSubmit={handleSubmit} className="space-y-5">
  {/* Message */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Notification Message</label>
    <textarea
      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      rows={4}
      placeholder="Enter your message"
      value={formData.message}
      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
      required
    />
  </div>

  {/* File Upload */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Attach File (Optional)</label>
    <input
      type="file"
      accept=".pdf,.doc,.docx,.jpg,.png"
      onChange={(e) => setFile(e.target.files[0])}
      className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-gray-200"
    />
  </div>

  {/* Branch / Section / Semester */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
      <select
        className="w-full border p-2 rounded-lg"
        value={formData.branch}
        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
        required
      >
        <option value="">Select Branch</option>
        <option value="CSE">CSE</option>
        <option value="ECE">ECE</option>
        <option value="EEE">EEE</option>
        <option value="MECH">MECH</option>
        <option value="CIVIL">CIVIL</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
      <select
        className="w-full border p-2 rounded-lg"
        value={formData.section}
        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
        required
      >
        <option value="">Select Section</option>
        <option value="A">A</option>
        <option value="B">B</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
      <select
        className="w-full border p-2 rounded-lg"
        value={formData.semester}
        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
        required
      >
        <option value="">Select Semester</option>
        {[...Array(8)].map((_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>
    </div>
  </div>

  {/* Expiry Time */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Time</label>
    <input
      type="datetime-local"
      className="w-full border p-2 rounded-lg"
      onChange={(e) => setFormData({ ...formData, expiry_time: e.target.value })}
      required
    />
  </div>

  {/* Employee ID */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Your Employee ID</label>
    <input
      type="text"
      placeholder="Employee ID"
      className="w-full border p-2 rounded-lg"
      value={formData.employee_id}
      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
      required
    />
  </div>

  {/* Submit Button */}
  <button
    type="submit"
    className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
  >
    Send Notification
  </button>
</form>


      
    </div>
  );
}
