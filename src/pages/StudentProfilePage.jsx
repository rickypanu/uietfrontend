import React, { useEffect, useState } from "react";
import api from "../services/api";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react"; // optional icon


const StudentProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const roll_no = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/student/profile/${roll_no}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, [roll_no]);

  if (!profile) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 px-4">
      <div className="w-full max-w-4xl p-6 bg-white rounded-3xl shadow-lg border border-gray-200 relative">
        {/* ❌ Close Button */}
        <button
          onClick={() => navigate("/student")}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
          title="Back to Dashboard"
        >
          <X className="w-6 h-6" />
        </button>

        <h1 className="text-3xl font-bold text-green-700 text-center mb-8">
          My Information
        </h1>

        <div className="flex flex-col sm:flex-row items-center gap-8 mb-6">
          {/* Profile picture placeholder */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-36 h-36 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-6xl text-gray-500 shadow-inner">
              🧑
            </div>
            <button
              disabled
              className="px-4 py-1 bg-gray-200 text-gray-500 rounded-full text-sm cursor-not-allowed"
            >
              Upload Photo (Coming Soon)
            </button>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-gray-800 text-[17px] w-full">
            <div>
              <span className="font-semibold">Name:</span> {profile.full_name}
            </div>
            <div>
              <span className="font-semibold">Roll Number:</span> {profile.roll_no}
            </div>
            <div>
              <span className="font-semibold">Email:</span> {profile.email}
            </div>
            <div>
              <span className="font-semibold">Course:</span> {profile.course}
            </div>
            <div>
              <span className="font-semibold">Branch:</span> {profile.branch}
            </div>
            <div>
              <span className="font-semibold">Department:</span> {profile.department}
            </div>
            <div>
              <span className="font-semibold">Semester:</span> {profile.semester}
            </div>
            <div>
              <span className="font-semibold">Section:</span> {profile.section}
            </div>
            <div className="sm:col-span-2">
              <span className="font-semibold">Date of Birth:</span>{" "}
              {dayjs(profile.dob).format("D MMMM YYYY")}
            </div>
          </div>
        </div>

        {/* Future Edit Button */}
        <div className="text-center">
          <button
            disabled
            className="px-6 py-2 bg-gray-300 text-gray-600 font-medium rounded-xl shadow cursor-not-allowed"
          >
            ✏️ Edit Profile (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
