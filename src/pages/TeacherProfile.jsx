import React, { useEffect, useState } from "react";
import api from "../services/api";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { X, UploadCloud } from "lucide-react";

const TeacherProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const employeeId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/teacher/profile/${employeeId}`);
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch teacher profile", err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [employeeId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024) {
    alert("Image size must be less than 100KB.");
    return;
  }
  
    setSelectedImage(URL.createObjectURL(file));
    saveImage(file);
  };

  

  const saveImage = async (file) => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/teacher/profile/upload-photo/${employeeId}`, formData);
      fetchProfile(); // refetch updated photo
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl text-gray-500">
        Loading profile...
      </div>
    );
  }

  const renderImage = () => {
    if (selectedImage) return selectedImage;
    if (profile.photo) return `data:image/jpeg;base64,${profile.photo}`;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 flex justify-center items-center">
      <div className="w-full max-w-5xl bg-white shadow-xl rounded-3xl p-6 sm:p-10 border border-gray-200 relative">
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

        <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border border-gray-300 shadow-inner bg-gray-100">
              {renderImage() ? (
                <img
                  src={renderImage()}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex justify-center items-center text-5xl text-gray-400">
                  🧑‍🏫
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-200 transition">
              <UploadCloud className="w-4 h-4" />
              {saving ? "Saving..." : "Upload Photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={saving}
              />
            </label>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 text-gray-800 text-[17px] w-full">
            <div>
              <span className="font-semibold">Name:</span> {profile.full_name}
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
              <span className="font-semibold">Employee ID:</span>{" "}
              {profile.employee_id}
            </div>
            <div>
              <span className="font-semibold">Subject:</span> {profile.subject}
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
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

export default TeacherProfilePage;
