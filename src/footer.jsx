import React from "react";
import { Mail, MapPin, Landmark, Copyright } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-4">
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
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1">
            <MapPin size={14} className="text-yellow-400" />
            <span>Chandigarh</span>
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
