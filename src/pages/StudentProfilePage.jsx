import React, { useEffect, useState } from "react";
import api from "../services/api";
import dayjs from "dayjs";
import { UploadCloud, X, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedSemester, setEditedSemester] = useState("");
  const [editedDOB, setEditedDOB] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const roll_no = localStorage.getItem("userId");
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/student/profile/${roll_no}`);
      setProfile(res.data);
      setEditedSemester(res.data.semester);
      setEditedDOB(dayjs(res.data.dob).format("YYYY-MM-DD"));
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [roll_no]);

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
      await api.post(`/student/profile/upload-photo/${roll_no}`, formData);
      fetchProfile();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setUpdatingProfile(true);
      // await api.patch(`/student/profile/update/${roll_no}`, {
      //   semester: parseInt(editedSemester),
      //   dob: editedDOB,
      // });
      await api.patch(`/student/profile/update/${roll_no}`, {
      full_name: profile.full_name,
      email: profile.email,
      branch: profile.branch,
      section: profile.section,
      semester: parseInt(editedSemester),
      dob: editedDOB,
    });

      await fetchProfile();
      setEditMode(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile. Try again.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const renderImage = () => {
    if (selectedImage) return selectedImage;
    if (profile?.photo) return `data:image/jpeg;base64,${profile.photo}`;
    return null;
  };

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
        <button
          onClick={() => navigate("/student")}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
          title="Back to Dashboard"
        >
          <X className="w-6 h-6" />
        </button>

        <h1 className="text-3xl font-bold text-green-700 text-center mb-8">
          Personal Information
        </h1>

        <div className="flex flex-col sm:flex-row items-center gap-8 mb-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-36 h-36 rounded-full overflow-hidden border border-gray-300 bg-gray-100 shadow-inner">
              {renderImage() ? (
                <img
                  src={renderImage()}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl text-gray-400">
                  🧑
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium cursor-pointer hover:bg-green-200 transition">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-gray-800 text-[17px] w-full">
            {/* <div>
              <span className="font-semibold">Name:</span> {profile.full_name}
            </div> */}
            <div>
              <span className="font-semibold">Name:</span>{" "}
              {editMode ? (
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile({ ...profile, full_name: e.target.value })
                  }
                  className="border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                profile.full_name
              )}
            </div>
            <div>
              <span className="font-semibold">Roll Number:</span> {profile.roll_no}
            </div>
            {/* <div>
              <span className="font-semibold">Email:</span> {profile.email}
            </div> */}

            <div>
              <span className="font-semibold">Email:</span>{" "}
              {editMode ? (
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  className="border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                profile.email
              )}
            </div>

            <div>
              <span className="font-semibold">Course:</span> {profile.course}
            </div>
            {/* <div>
              <span className="font-semibold">Branch:</span> {profile.branch}
            </div> */}
            <div>
              <span className="font-semibold">Branch:</span>{" "}
              {editMode ? (
                <select
                  value={profile.branch}
                  onChange={(e) =>
                    setProfile({ ...profile, branch: e.target.value })
                  }
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  {["CSE", "IT", "ECE", "EEE", "MECH"].map((br) => (
                    <option key={br} value={br}>
                      {br}
                    </option>
                  ))}
                </select>
              ) : (
                profile.branch
              )}
            </div>

            <div>
              <span className="font-semibold">Department:</span> {profile.department}
            </div>
            <div>
              <span className="font-semibold">Semester:</span>{" "}
              {editMode ? (
                <select
                  value={editedSemester}
                  onChange={(e) => setEditedSemester(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              ) : (
                profile.semester
              )}
            </div>
            {/* <div>
              <span className="font-semibold">Section:</span> {profile.section}
            </div> */}
            <div>
              <span className="font-semibold">Section:</span>{" "}
              {editMode ? (
                <select
                  value={profile.section}
                  onChange={(e) =>
                    setProfile({ ...profile, section: e.target.value })
                  }
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  {["A", "B"].map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              ) : (
                profile.section
              )}
            </div>

            <div className="sm:col-span-2">
              <span className="font-semibold">Date of Birth:</span>{" "}
              {editMode ? (
                <input
                  type="date"
                  value={editedDOB}
                  onChange={(e) => setEditedDOB(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                dayjs(profile.dob).format("D MMMM YYYY")
              )}
            </div>
          </div>
        </div>

        {/* Edit and Save Buttons */}
        <div className="text-center space-x-4">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl shadow hover:bg-blue-700 transition"
            >
               Edit Profile
            </button>
          ) : (
            <button
              onClick={handleSaveProfile}
              disabled={updatingProfile}
              className={`px-6 py-2 bg-green-600 text-white font-medium rounded-xl shadow hover:bg-green-700 transition ${
                updatingProfile ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Save className="inline-block w-4 h-4 mr-1" />
              {updatingProfile ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
