"use client";

import React from 'react';
import { AiOutlineMail, AiOutlineEnvironment } from 'react-icons/ai'; 
import ServicePoints from './ServicePoints';
import CloudServices from './CloudServices';
import MemberCount from './MemberCount';
import { SpeedInsights } from "@vercel/speed-insights/next"

const logos = [
  "/logos/google-drive.svg",
  "/logos/dropbox.svg",
  "/logos/mega.svg",
  "/logos/onedrive.svg",
  "/logos/box.svg",
  "/logos/google-cloud.svg",
  "/logos/google-photos.svg",
  "/logos/icloud.svg",
];

const cloudServices = [
  { name: 'Google Drive', logo: "/logos/google-drive.svg" },
  { name: 'Dropbox', logo: "/logos/dropbox.svg" },
  { name: 'Mega', logo: "/logos/mega.svg" },
  { name: 'OneDrive', logo: "/logos/onedrive.svg" },
  { name: 'Box', logo: "/logos/box.svg" },
  { name: 'Google Cloud', logo: "/logos/google-cloud.svg" },
  { name: 'Google Photos', logo: "/logos/google-photos.svg" },
  { name: 'iCloud', logo: "/logos/icloud.svg" },
];

const LandingPage: React.FC = () => {
  return (
    <div className="bg-[#AFDDE5]">
      <main className="flex flex-col items-center">
        <section className="bg-[#024950] text-white w-full flex flex-col items-center relative shadow-inner shadow-black text-center">
          <div className="w-full flex flex-col items-center">
            <img src="/logos/Logo2.png" alt="EpicBytes Logo2" className="max-h-96 max-w-96 mt-10 ml-5 mr-5 mb-6" />
          </div>
          <SpeedInsights />
          <h2 className="text-2xl font-semibold">Welcome to EpicBytes</h2>
          <p className="mt-2">We help you migrate your data between clouds easily, securely and efficiently.</p>
          <p className="mt-10"></p>
        </section>

        <section className="relative w-full -mt-3 rounded-xl shadow-xl shadow-[#0FA4AF] overflow-hidden">
          <div className="fade-left"></div>
          <div className="fade-right"></div>
          <div className="flex items-center justify-around animate-scroll space-x-8 bg-white">
            {logos.concat(logos).map((logo, index) => (
              <img key={index} src={logo} alt="Cloud Logo" className="h-14 p-3 object-contain" />
            ))}
          </div>
        </section>

        <section className="w-full mt-4 p-4 flex flex-col items-center">
          <ServicePoints 
            title="Our Services"
            points={[
              "Cloud to Cloud Transfer",
              "Cloud Sync & backup",
              "24/7 Customer Support",
              "Cloud File Manager",
              "Downloading to Cloud",
              "Batch Sync",
              "Cloud File Transfer",
              "Remote Upload",
            ]}
          />
          <ServicePoints 
            title="Why Choose Us?"
            points={[
              "Secure Data Transfer",
              "Fast Migration",
              "24/7 Customer Support",
              "Multi-cloud Compatibility",
              "Affordable Pricing",
              "Scalable Solutions",
              "User-friendly Interface",
              "Data Backup and Recovery",
            ]}
          />
    
          <CloudServices services={cloudServices} />
          <div className="w-full p-4">
            {/* More content can be added here */}
          </div>
        </section>
      </main>
      <footer className="bg-[#003135] p-4 text-white text-center shadow-inner shadow-[#0FA4AF] mt-4 w-full">
        <div className="flex flex-col items-center">
          <a href="/help-center" className="text-white hover:underline mb-2">Help Center</a>
          <img src="/logos/Logo2.png" alt="EpicBytes Logo2" className="h-32 w-36 mb-2" />
          <div className="flex flex-col items-center">
            <div className="flex items-center mb-1">
              <AiOutlineMail className="h-5 w-5 mr-2" />
              <span>support@epicbytes.me (not active) </span>
              <span> Alyany2k24@gmail.com (active)</span>
            </div>
            <div className="flex items-center">
              <AiOutlineEnvironment className="h-5 w-5 mr-2" />
              <span>Pakistan</span>
            </div>
          </div>
        </div>
        <p className="mt-4">&copy; 2024 Data Migration Service. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
