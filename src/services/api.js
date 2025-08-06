import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  timeout: 10000,
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});



export const markAttendance = async (roll_no, subject, otp, visitorId, lat, lng) => {
  const res = await api.post("/student/markAttendance", {
    roll_no,
    subject,
    otp,
    visitorId,
    lat,
    lng
  });
  return res.data;
};



export const getStudentAttendance = async (rollNo) => {
  const res = await api.get(`/student/view-attendance/${rollNo}`);
  return res.data;
};

export const exportStudentAttendanceCSV = async (rollNo) => {
  const res = await api.get(`/student/export-attendance/${rollNo}`, {
    responseType: "blob",
  });
  return res.data;
};


export const generateOtp = async (employeeId,course, branch, semester, subject, durationMinutes, lat, lng) => {
  const res = await api.post("/teacher/generate-otp", {
    employee_id: employeeId,
    course: course,
    branch: branch.toUpperCase(),
    semester: semester.charAt(0).toUpperCase() + semester.slice(1).toLowerCase(),
    subject,
    duration_minutes: durationMinutes,
    lat,
    lng
  });
  return res.data;
};


export const getAttendance = async (employeeId) => {
  const res = await api.get(`/teacher/view-attendance/${employeeId}`);
  return res.data;
};

export const exportAttendanceCSV = async (employeeId) => {
  const res = await api.get(`/teacher/export-attendance/${employeeId}`, {
    responseType: "blob",
  });
  return res.data;
};

export const getGeneratedOtps = async (employeeId) => {
  const res = await api.get(`/teacher/view-otps/${employeeId}`);
  return res.data;
};

export const getTodayAttendanceCount = async () => {
  const response = await api.get('/api/attendance/today');
  return response.data.count;
};

// Add a response interceptor to handle errors globally
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       // Token expired or unauthorized → optional: redirect to login
//       localStorage.removeItem("token");
//       localStorage.removeItem("role");
//       window.location.href = "/admin/login";
//     }
//     return Promise.reject(error);
//   }
// );



export default api;
