// src/pages/TeacherAbout.jsx
import React from "react";

export default function TeacherAbout() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">How to Use</h1>
      <ol className="list-decimal space-y-2 ml-5 text-gray-700">
        <li>Generate OTP before starting class.</li>
        <li>Share OTP with students to mark attendance.</li>
        <li>View or export attendance anytime from dashboard.</li>
      </ol>
    </div>
  );
}
