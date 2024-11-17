import React, { useState } from 'react';
import { FaSave, FaTimes, FaTrashAlt } from 'react-icons/fa';

interface CloudService {
  id: string;
  name: string;
  component: React.ComponentType<any>;
}

interface DriveHeaderProps {
  title: string;
  selectedService: CloudService;
  cloudServices: CloudService[];
  handleLoadButtonClick: () => void;
  setSelectedService: (service: CloudService) => void;
  showDriveStructure: boolean;
  onDelete: () => void;
  onSaveTitle: (newTitle: string) => void;
}

const MAX_TITLE_LENGTH = 12;

const DriveHeader: React.FC<DriveHeaderProps> = ({ 
  title,
  selectedService,
  cloudServices,
  handleLoadButtonClick,
  setSelectedService,
  showDriveStructure,
  onDelete,
  onSaveTitle
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (newTitle.length > MAX_TITLE_LENGTH) {
      setError(`< ${MAX_TITLE_LENGTH} characters.`);
    } else {
      onSaveTitle(newTitle);
      setIsEditing(false);
      setError('');
    }
  };

  const handleDiscard = () => {
    setNewTitle(title);
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="flex justify-between items-center mb-4 bg-gray-100 p-2 rounded-t-lg">
      <div className="flex items-center">
        {isEditing ? (
          <div className="flex items-center">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border px-2 py-1"
            />
            <button className="ml-2 px-2 py-1 bg-blue-500 text-white rounded" onClick={handleSave}>
              <FaSave />
            </button>
            <button className="ml-2 px-2 py-1 bg-red-500 text-white rounded" onClick={handleDiscard}>
              <FaTimes />
            </button>
            {error && <p className="text-red-500 ml-2">{error}</p>}
          </div>
        ) : (
          <>
            <h2
              className="text-xl font-bold cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              {title}
            </h2>
            <button className="ml-4 text-red-500" onClick={onDelete}>
              <FaTrashAlt />
            </button>
          </>
        )}
      </div>
      <div className="flex items-center">
        <button className="load-button" onClick={handleLoadButtonClick}>
          <div className="load-circle"></div>
        </button>
        {!showDriveStructure && (
          <select
            value={selectedService.id}
            onChange={(e) => {
              const selected = cloudServices.find(service => service.id === e.target.value);
              if (selected) {
                setSelectedService(selected);
              }
            }}
            className="border rounded px-2 py-1 ml-2"
          >
            {cloudServices.map(service => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default DriveHeader;
