import React, { useEffect, useState } from "react";
import api from "../services/api";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

const TeacherProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const employeeId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/teacher/profile/${employeeId}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch teacher profile", err);
      }
    };
    fetchProfile();
  }, [employeeId]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-lg p-6 sm:p-10 border border-gray-200 relative">
        {/* ❌ Close Button */}
        <button
          onClick={() => navigate("/teacher")}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
          title="Back to Dashboard"
        >
          <X className="w-6 h-6" />
        </button>

        <h1 className="text-3xl sm:text-4xl font-bold text-blue-700 text-center mb-10">
          Teacher Profile
        </h1>

        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-40 h-40 rounded-full bg-gray-100 border border-gray-300 shadow-inner overflow-hidden">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-gray-400">
                  🧑‍🏫
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="photoInput"
              onChange={handlePhotoChange}
            />
            <label
              htmlFor="photoInput"
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm cursor-pointer hover:bg-blue-700 transition"
            >
              Upload Photo
            </label>
            <p className="text-xs text-gray-500">(Save feature coming soon)</p>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 text-gray-800 text-base w-full">
            <div>
              <span className="font-semibold">Full Name:</span> {profile.full_name}
            </div>
            <div>
              <span className="font-semibold">Email:</span> {profile.email}
            </div>
            <div>
              <span className="font-semibold">Phone:</span> {profile.phone}
            </div>
            <div>
              <span className="font-semibold">DOB:</span>{" "}
              {dayjs(profile.dob).format("D MMMM YYYY")}
            </div>
            <div>
              <span className="font-semibold">Gender:</span> {profile.gender}
            </div>
            <div>
              <span className="font-semibold">Address:</span> {profile.address}
            </div>
            <div>
              <span className="font-semibold">Employee ID:</span> {profile.employee_id}
            </div>
            <div>
              <span className="font-semibold">Subject:</span> {profile.subject}
            </div>
          </div>
        </div>

        {/* Save / Edit Buttons (Coming Soon) */}
        <div className="text-center mt-10">
          <button
            disabled
            className="px-6 py-2 bg-gray-300 text-gray-600 font-medium rounded-xl shadow cursor-not-allowed"
          >
            💾 Save Changes (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfilePage;
