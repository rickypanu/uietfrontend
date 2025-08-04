import { Link } from "react-router-dom";
import Footer from "/src/footer";
import { CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-200 via-green-100 to-green-300 overflow-y-auto">
      
      {/* Hero Heading */}
      <header className="text-center pt-6 sm:pt-10 px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-800 drop-shadow-xl leading-tight">
          <span className="text-green-700">Attendance</span> Management
        </h1>
        <p className="mt-1 text-gray-600 text-sm sm:text-base">Simple • Secure • Smart</p>
      </header>

      {/* Center Box */}
      <main className="flex justify-center items-start px-4 mt-6 mb-8">
        <div className="w-full max-w-sm sm:max-w-md bg-white/40 backdrop-blur-md shadow-xl rounded-3xl p-6 sm:p-8 flex flex-col items-center space-y-5
          transform hover:-translate-y-1 transition duration-500 ease-in-out animate-fade-in">
          
          <CheckCircle size={36} className="text-green-700" />

          <Link
            to="/register"
            className="w-full text-center bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 
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
            to="/admin/login"
            className="w-full text-center bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 
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
