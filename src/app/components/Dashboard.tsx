import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Content from './Content';

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar closed by default
  const [activeId, setActiveId] = useState(1); // Default to the first item

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSetActiveId = (id: number) => {
    setActiveId(id);
  };

  return (
    <div className="relative flex h-screen bg-[#AFDDE5] overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={handleToggleSidebar} 
        activeId={activeId} 
        onSetActiveId={handleSetActiveId} 
      />
      <div className={`flex-grow overflow-auto transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Content activeId={activeId} />
      </div>
    </div>
  );
};

export default Dashboard;
