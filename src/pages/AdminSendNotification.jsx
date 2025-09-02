// src/pages/AdminSendNotification.jsx
import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { XCircle, Trash2, FileText, Clock } from "lucide-react";

export default function AdminSendNotification() {
  const [formData, setFormData] = useState({
    admin_id: "",
    message: "",
    category: "",
    target_type: "all",
    branch: "",
    section: "",
    semester: "",
    roll_numbers: "",
    expiry_time: "",
  });
  const [file, setFile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const adminId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    if (adminId) {
      setFormData((prev) => ({ ...prev, admin_id: adminId }));
      fetchNotifications(adminId);
    }
  }, [adminId]);

  const fetchNotifications = async (admId) => {
    try {
      const res = await api.get(`/admin/notifications/${admId.toUpperCase()}`);
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
      await api.post("/admin/send-notification", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Notification sent!");
      setFormData({
        admin_id: adminId,
        message: "",
        category: "",
        target_type: "all",
        branch: "",
        section: "",
        semester: "",
        roll_numbers: "",
        expiry_time: "",
      });
      setFile(null);
      fetchNotifications(formData.admin_id);
    } catch (err) {
      alert("Error sending notification");
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;

    try {
      const form = new FormData();
      form.append("notification_id", notificationId);
      form.append("admin_id", adminId.toUpperCase());

      await api.post("/admin/notifications/delete", form);
      fetchNotifications(adminId);
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete the notification.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-700">Admin Notifications</h2>
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="flex items-center gap-2 text-sm bg-gray-200 hover:bg-red-100 text-red-600 px-3 py-1 rounded-md transition"
        >
          <XCircle size={18} />
          Dashboard
        </button>
      </div>

      {/* Notification Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow space-y-5 border border-blue-100"
      >
        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            className="w-full border rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Enter your message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            className="w-full border p-2 rounded-lg"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            <option value="">Select Category</option>
            {[
              "General Notice",
              "Fee Reminder",
              "Exam/Timetable Update",
              "Event / Holiday Notice",
              "Emergency Alert",
            ].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Targeting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="target"
                value="all"
                checked={formData.target_type === "all"}
                onChange={() => setFormData({ ...formData, target_type: "all" })}
              />
              All Students
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="target"
                value="class"
                checked={formData.target_type === "class"}
                onChange={() => setFormData({ ...formData, target_type: "class" })}
              />
              By Branch + Section + Semester
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="target"
                value="individual"
                checked={formData.target_type === "individual"}
                onChange={() => setFormData({ ...formData, target_type: "individual" })}
              />
              Individual Student(s) by Roll Number
            </label>
          </div>
        </div>

        {/* Conditional Inputs */}
        {formData.target_type === "class" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
            <select
              className="border p-2 rounded-lg"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            >
              <option value="">Branch</option>
              {["CSE","IT","ECE","EEE","MECH","BIOTECH"].map((br) => (
                <option key={br} value={br}>{br}</option>
              ))}
            </select>
            <select
              className="border p-2 rounded-lg"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            >
              <option value="">Section</option>
              <option value="A">A</option>
              <option value="B">B</option>
            </select>
            <select
              className="border p-2 rounded-lg"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            >
              <option value="">Semester</option>
              {[...Array(8)].map((_, i) => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
          </div>
        )}

        {formData.target_type === "individual" && (
          <div className="mt-3">
            <input
              type="text"
              className="w-full border p-2 rounded-lg"
              placeholder="Enter roll numbers separated by commas"
              value={formData.roll_numbers}
              onChange={(e) => setFormData({ ...formData, roll_numbers: e.target.value })}
            />
          </div>
        )}

        {/* Expiry Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Time</label>
          <input
            type="datetime-local"
            className="w-full border p-2 rounded-lg"
            value={formData.expiry_time}
            onChange={(e) => setFormData({ ...formData, expiry_time: e.target.value })}
            required
          />
        </div>

        {/* File + Admin ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attach File</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm file:py-2 file:px-4 file:rounded-lg file:bg-gray-100 file:text-blue-600 file:font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Admin ID</label>
            <input
              type="text"
              value={formData.admin_id}
              readOnly
              className="w-full border bg-gray-100 text-gray-600 p-2 rounded-lg cursor-not-allowed"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
        >
          Send Notification
        </button>
      </form>

      {/* Sent Notifications List */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Previous Notifications</h3>
        {notifications.length === 0 ? (
          <p className="text-gray-500">No notifications sent yet.</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition"
              >
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <p className="font-medium text-gray-800 whitespace-pre-line">{notif.message}</p>
                    <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                      <span>Category: {notif.category}</span>
                      <span>Target: {notif.target_type}</span>
                      {notif.target_type === "class" && (
                        <>
                          <span>Branch: {notif.branch}</span>
                          <span>Section: {notif.section}</span>
                          <span>Semester: {notif.semester}</span>
                        </>
                      )}
                      {notif.target_type === "individual" && (
                        <span>Roll Nos: {notif.roll_numbers?.join(", ")}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={14} />
                      <span>Expiry: {new Date(notif.expiry_time).toLocaleString()}</span>
                    </div>
                    {notif.file_url && (
                      <a
                        href={notif.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline"
                      >
                        <FileText size={16} />
                        View Attachment
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(notif._id)}
                    className="text-red-600 hover:text-red-800 text-sm font-semibold flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
