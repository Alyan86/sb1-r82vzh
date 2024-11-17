import React, { useEffect, useState } from 'react';
import {
  AiOutlineCloud,
  AiOutlineUpload,
  AiOutlinePlus,
  AiOutlineArrowLeft,
  AiOutlineArrowRight,
} from 'react-icons/ai';
import Profile from './Profile';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeId: number;
  onSetActiveId: (id: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  activeId,
  onSetActiveId,
}) => {
  const [authChecked, setAuthChecked] = useState(false);
  const options = [
    { id: 1, name: 'Manage Clouds', icon: <AiOutlineCloud /> },
    { id: 2, name: 'Remote Upload', icon: <AiOutlineUpload /> },
    { id: 3, name: 'Add a Cloud', icon: <AiOutlinePlus /> },
  ];

  useEffect(() => {
    // Only perform checkAuth on component mount
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/checkAuth');
        const data = await response.json();
        if (data.isAuthenticated) {
          console.log('User is authenticated');
        } else {
          console.log('User is not authenticated');
        }
      } catch (error) {
        console.error('Failed to check authentication:', error);
      }
      setAuthChecked(true);
    };

    if (!authChecked) {
      checkAuth();
    }
  }, [authChecked]);

  return (
    <div
      className={`fixed left-0 top-0 h-full transition-width duration-300 flex flex-col justify-between shadow-md bg-[#024950] text-white z-50 ${
        isOpen ? 'w-64' : 'w-16'
      } sidebar`}
    >
      <div className="flex justify-between items-center p-4">
        <button onClick={onToggle} className="text-xl">
          {isOpen ? <AiOutlineArrowLeft /> : <AiOutlineArrowRight />}
        </button>
      </div>
      <div className="flex flex-col mt-4 flex-grow">
        {options.map((option) => (
          <button
            key={option.id}
            className={`flex items-center p-4 hover:bg-[#0FA4AF] ${
              activeId === option.id ? 'bg-[#0FA4AF]' : ''
            }`}
            onClick={() => onSetActiveId(option.id)}
          >
            <div className="mr-4 bg-[#024950] rounded-full p-2">
              {option.icon}
            </div>
            <span className={`${isOpen ? 'block' : 'hidden'}`}>
              {option.name}
            </span>
          </button>
        ))}
      </div>
      <div className="mb-4">
        <Profile />
      </div>
    </div>
  );
};

export default Sidebar;
