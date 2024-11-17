import React, { useState, useEffect } from 'react';
import CloudServices from './CloudServices';
import DrivesBox from './DrivesBox';

interface ContentProps {
  activeId: number;
}

interface DriveBox {
  id: number;
  title: string;
  selectedServiceId: string;
}

const Content: React.FC<ContentProps> = ({ activeId }) => {
  const [driveBoxes, setDriveBoxes] = useState<DriveBox[]>([]);
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    const savedDriveBoxes = localStorage.getItem('driveBoxes');
    if (savedDriveBoxes) {
      const parsedDriveBoxes = JSON.parse(savedDriveBoxes);
      setDriveBoxes(parsedDriveBoxes);
      const maxId = Math.max(...parsedDriveBoxes.map((box: DriveBox) => box.id), 0);
      setNextId(maxId + 1);
    } else {
      // Create a default drive box if no drive boxes are found
      const defaultDriveBox: DriveBox = { id: 1, title: 'Default Drive', selectedServiceId: 'google-drive' };
      setDriveBoxes([defaultDriveBox]);
      setNextId(2); // Next ID will be 2 since default is 1
      localStorage.setItem('driveBoxes', JSON.stringify([defaultDriveBox]));
    }
  }, []);
  

  const addDriveBox = () => {
    const newDriveBox: DriveBox = { id: nextId, title: `New Drive ${nextId}`, selectedServiceId: 'google-drive' };
    const updatedDriveBoxes = [...driveBoxes, newDriveBox];
    setDriveBoxes(updatedDriveBoxes);
    setNextId(nextId + 1);
    localStorage.setItem('driveBoxes', JSON.stringify(updatedDriveBoxes));
  };

  const updateDriveBox = (id: number, newTitle: string) => {
    const updatedDriveBoxes = driveBoxes.map((box) =>
      box.id === id ? { ...box, title: newTitle } : box
    );
    setDriveBoxes(updatedDriveBoxes);
    localStorage.setItem('driveBoxes', JSON.stringify(updatedDriveBoxes));
  };

  const updateSelectedServiceId = (id: number, serviceId: string) => {
    const updatedDriveBoxes = driveBoxes.map((box) =>
      box.id === id ? { ...box, selectedServiceId: serviceId } : box
    );
    setDriveBoxes(updatedDriveBoxes);
    localStorage.setItem('driveBoxes', JSON.stringify(updatedDriveBoxes));
  };

  const handleDriveBoxDelete = (id: number) => {
    const updatedDriveBoxes = driveBoxes.filter((box) => box.id !== id);
    setDriveBoxes(updatedDriveBoxes);
    localStorage.setItem('driveBoxes', JSON.stringify(updatedDriveBoxes));
  };

  return (
    <div className="flex-grow p-6 bg-white shadow-lg transition-all duration-300 min-h-screen">
      {activeId === 1 && (
        <div>
          <h1 className="text-2xl mb-4">Manage Clouds</h1>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-1 lg:grid-cols-2">
            {driveBoxes.map((driveBox) => (
              <DrivesBox
                key={driveBox.id}
                id={driveBox.id}
                title={driveBox.title}
                selectedServiceId={driveBox.selectedServiceId}
                updateDriveBox={updateDriveBox}
                updateSelectedServiceId={updateSelectedServiceId}
                onDelete={() => handleDriveBoxDelete(driveBox.id)}
              />
            ))}
            <div className="flex items-center justify-center p-4 m-1 outline-dashed outline-gray-300 outline-4">
              <div className="shadow-lg rounded-lg h-1/3 w-1/3 flex items-center justify-center bg-gray-300 z-50">
                <button className="add-drive-button" onClick={addDriveBox}>
                  + Add Drive Manager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeId === 2 && (
        <div className="text-2xl mb-4 text-black">
          <h1>Remote Upload</h1>
          <p>Remote upload feature will be here.</p>
        </div>
      )}
      {activeId === 3 && (
        <div>
          <h1 className="text-2xl mb-4">Add a Cloud</h1>
          <CloudServices
            services={[
              { name: 'Google Drive', logo: '/logos/google-drive.svg' },
              { name: 'Dropbox', logo: '/logos/dropbox.svg' },
              { name: 'Mega', logo: '/logos/mega.svg' },
              { name: 'OneDrive', logo: '/logos/onedrive.svg' },
              { name: 'Box', logo: '/logos/box.svg' },
              { name: 'Google Cloud', logo: '/logos/google-cloud.svg' },
              { name: 'Google Photos', logo: '/logos/google-photos.svg' },
              { name: 'iCloud', logo: '/logos/icloud.svg' },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default Content;
