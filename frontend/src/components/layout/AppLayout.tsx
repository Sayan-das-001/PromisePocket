import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MobileDock } from './MobileDock';
import { DesktopSidebar } from './DesktopSidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FFF9F5] flex flex-col md:flex-row text-[#292526]">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-h-screen max-w-5xl mx-auto w-full pb-24 md:pb-10">
        {/* Top Header */}
        <Header />

        {/* Dynamic Route Content */}
        <main className="flex-1 px-4 sm:px-8 py-2">
          <Outlet />
        </main>
      </div>

      {/* Mobile Floating Bottom Dock */}
      <MobileDock />
    </div>
  );
};
