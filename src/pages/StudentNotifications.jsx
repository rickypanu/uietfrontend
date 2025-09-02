// src/pages/StudentNotifications.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, Download, Loader2 } from "lucide-react";
import api from "../services/api";

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const roll_no = localStorage.getItem("userId");

  useEffect(() => {
    const fetchProfileAndNotifications = async () => {
      try {
        // 1️⃣ Get student profile
        const res = await api.get(`/student/profile/${roll_no}`);
        const profileData = res.data;
        setStudentProfile(profileData);

        // 2️⃣ Fetch merged notifications (teacher + admin)
        const notifRes = await api.get(
          `/student/notifications/${profileData.branch}/${profileData.section}/${profileData.semester}/${profileData.roll_no}`
        );
        setNotifications(notifRes.data);
      } catch (err) {
        console.error("Error fetching notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndNotifications();
  }, [roll_no]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-700">Notifications</h2>
        <button
          onClick={() => navigate("/student")}
          className="flex items-center gap-2 text-sm bg-gray-200 hover:bg-red-100 text-red-600 px-3 py-1 rounded-md transition"
        >
          <XCircle size={18} />
          Dashboard
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-10 text-gray-500">
          <Loader2 className="animate-spin mr-2" size={20} />
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-gray-500 bg-gray-100 p-4 rounded text-center">
          No active notifications.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl shadow hover:shadow-md border-l-4 border-green-500 transition"
            >
              {/* Timestamp */}
              {/* <div className="text-sm text-gray-500 mb-1">
                {new Date(n.timestamp).toLocaleString()}
              </div> */}

              {/* Source: Teacher or Admin */}
              <div className="font-semibold text-lg text-green-800 mb-1">
                {n.teacher_name}
              </div>

              {/* Message */}
              <p className="text-gray-700 mb-2">{n.message}</p>

              {/* File Attachment */}
              {n.file_url && (
                <a
                  href={`${api.defaults.baseURL}${n.file_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Download size={16} />
                  Download Attachment
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
