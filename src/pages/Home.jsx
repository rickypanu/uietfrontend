import { Link } from "react-router-dom";
import Footer from "/src/footer";
import { CheckCircle } from "lucide-react";

export default function Home() {
  return (
    // <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-200 via-green-100 to-green-300">
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-200 via-green-100 to-green-300">
  
      {/* Hero Heading */}
      <header className="text-center px-4 pt-8 sm:pt-12 pb-4 sm:pb-6">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-gray-800 drop-shadow-xl leading-tight">
          <span className="text-gray-800">Attendance</span> Management
        </h1>
        <p className="mt-2 text-gray-600 text-sm sm:text-base">Simple • Secure • Smart</p>
      </header>

      {/* Center Box */}
      <main className="flex-grow flex justify-center items-center px-4 pb-8 sm:pb-12">
        <div className="w-full max-w-sm sm:max-w-md bg-white/40 backdrop-blur-md shadow-xl rounded-3xl p-6 sm:p-10 flex flex-col items-center space-y-5
          transform hover:-translate-y-1 transition duration-500 ease-in-out animate-fade-in">
          
          <CheckCircle size={36} className="text-green-700 mb-1" />

          <Link
            to="/register"
            className="w-full text-center bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600
              text-white font-semibold px-5 py-3 rounded-full shadow-md hover:shadow-lg 
              hover:scale-105 transition-transform duration-300"
          >
            Register
          </Link>

          <Link
            to="/login"
            className="w-full text-center bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 
              text-white font-semibold px-5 py-3 rounded-full shadow-md hover:shadow-lg 
              hover:scale-105 transition-transform duration-300"
          >
            Student / Teacher Login
          </Link>

          <Link
            to="/admin/dashboard"
            // className="w-full text-center bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800
            className="w-full text-center bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700

              text-white font-semibold px-5 py-3 rounded-full shadow-md hover:shadow-lg 
              hover:scale-105 transition-transform duration-300"
          >
            Admin Login
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
