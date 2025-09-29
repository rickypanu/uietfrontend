# SmartPresence Frontend

SmartPresence Frontend provides a user-friendly interface for students, teachers, and admins, interacting with the backend APIs for attendance management.


Table of Contents
- Introduction 
- Features 
- Technology Stack  
- System Architecture 
- Setup Instructions
- Pages & Components 
- Demo
- Future Improvements
- Team


📝 Introduction
The frontend provides:  
- Real-time dashboards for students, teachers, and admin  
- Attendance marking via OTP or face recognition  
- Notifications sending and receiving  
- Attendance history visualization  

It ensures ease of use, responsiveness, and interactivity.


✨ Features
- Role-based dashboards  
- OTP and face recognition attendance  
- Attendance history and reports  
- Notifications module  
- Profile display and management  
- Responsive design with Tailwind CSS  


🛠 Technology Stack
- React.js  
- Tailwind CSS  
- Axios for API requests  
- React Router for navigation  



🏗 System Architecture
1.User Login/Registration
    Students, Teachers, and Admins register via the frontend.
    Data is sent securely to FastAPI backend and stored in MongoDB.
    Admin approves registrations before the user can access dashboards.
2.OTP-Based Attendance (Teacher → Student)
    Teacher generates a unique OTP for the class.
    OTP is stored in the backend database.
    Students enter OTP on frontend to mark attendance.
    Backend validates OTP and marks attendance in MongoDB.
3.Face Recognition Attendance
    Students can mark attendance via face recognition.
    Frontend captures student image.
    Image encoding is sent to backend.
    Backend compares it with stored face encodings.
    If matched, attendance is marked in MongoDB.
4.Dashboard & History
    Backend fetches real-time attendance data and sends it to frontend.
    Students see their attendance history with filters.
    Teachers see daily class attendance and summary analytics.
5.Notifications System
    Teachers send notifications via frontend.
    Backend stores notifications in MongoDB.
    Students fetch and view notifications in real-time.
6.Admin Module
    Admin can approve/reject registrations, delete users, or manage data.
    All actions are reflected in the database and accessible via dashboards.

⚡ Setup Instructions
# Clone repository
git clone https://github.com/your-frontend-link
cd frontend

# Install dependencies
npm install

# Start development server
npm start

🖥 Pages & Components
| Page / Component        | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `LoginPage.jsx`         | Login for students, teachers, and admin              |
| `RegisterPage.jsx`      | Registration form for new users                      |
| `StudentDashboard.jsx`  | View attendance, mark attendance, view notifications |
| `TeacherDashboard.jsx`  | Generate OTPs, view attendance, send notifications   |
| `Notifications.jsx`     | Send/receive notifications                           |
| `Profile.jsx`           | View-only user profile                               |
| `AttendanceHistory.jsx` | Student attendance history with filters              |

🔮 Future Improvements

    Mobile-friendly UI and mobile app version
    Dark mode support
    Graphical analytics for attendance trends
    Integration with SMS/email notifications
    Improved performance for large classes

Team Name : Innovators+
Team Memeber
1. Ritik Chauhan
2. Ricky Panu
3. Priyanshu Kaushik
4. Mohit Kumar
5. Harsha Gupta
6. Hritk Pundir
