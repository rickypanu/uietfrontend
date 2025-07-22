// src/pages/TeacherProfile.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function TeacherProfile() {
  const [profile, setProfile] = useState(null);
  const employeeId = localStorage.getItem("userId");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get(`/teacher/profile/${employeeId}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    }

    fetchProfile();
  }, [employeeId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teacher Profile</h1>
      {profile ? (
        <div className="space-y-3">
          <p><strong>Name:</strong> {profile.full_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Employee ID:</strong> {employeeId}</p>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
}
