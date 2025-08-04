import React from "react";
import { Mail, MapPin, Landmark, Copyright } from "lucide-react";

export default function Footer() {
  return (
    // <footer className="bg-blue-900 text-white py-4">
    <footer className="bg-blue-900 text-white py-4 px-4 mt-auto w-full">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:justify-between items-center text-sm gap-2 sm:gap-4 text-center sm:text-left">

        {/* Left: Links */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <Landmark size={16} className="text-yellow-400" />
          <a
            href="https://uiet.puchd.ac.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            UIET
          </a>
          <span>|</span>
          <a
            href="https://puchd.ac.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Panjab University
          </a>
        </div>

        {/* Center: Contact */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-1">
            <MapPin size={14} className="text-yellow-400" />
            <a
              href="https://www.google.com/maps/place/UIET+Punjab+University/@30.7480817,76.7545404,17z/data=!3m1!4b1!4m6!3m5!1s0x390febffe47a7419:0x267dc179dae933b6!8m2!3d30.7480771!4d76.7571153!16s%2Fg%2F11m468rsbt?entry=ttu&g_ep=EgoyMDI1MDcxNi4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Chandigarh
            </a>
          </div>
          <div className="flex items-center gap-1">
            <Mail size={14} className="text-yellow-400" />
            <a href="mailto:contact@uietpuchd.ac.in" className="hover:underline">
              contact@uietpuchd.ac.in
            </a>
          </div>
        </div>

        {/* Right: Copyright */}
        <div className="flex items-center justify-center gap-1">
          <Copyright size={14} className="text-yellow-400" />
          <span>{new Date().getFullYear()} UIET, PU. All rights reserved.</span>
        </div>
        
      </div>
    </footer>
  );
}
