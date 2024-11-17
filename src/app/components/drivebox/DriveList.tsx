import React, { useState, useEffect } from 'react';
import DriveItem from './DriveItem';

interface DriveListProps {
  drives: any[];
  storageQuotas: any[];
  handleSelectFiles: (files: any[]) => void;
  selectedService: {
    id: string;
    name: string;
    component: React.FC<any>;
  };
  setUserInfo: (userInfo: any) => void;
  handleDriveDataReceived: (newDriveData: any[]) => void;
  handleStorageQuotaReceived: (storageQuota: any) => void;
  handleTokensReceived: (tokens: any) => void;
}

const DriveList: React.FC<DriveListProps> = ({
  drives,
  storageQuotas,
  handleSelectFiles,
  selectedService,
  setUserInfo,
  handleDriveDataReceived,
  handleStorageQuotaReceived,
  handleTokensReceived,
}) => {
  const [driveList, setDriveList] = useState(drives);

  useEffect(() => {
    // Update drive list when drives are updated
    setDriveList(drives);
  }, [drives]);

  useEffect(() => {
    // This can be used to set or update storage quotas
  }, [storageQuotas]);

  // Filter drives based on the selected service (Google, OneDrive, or All)
  const filteredDrives = selectedService.id === 'all'
    ? driveList
    : driveList.filter(drive => drive.driveType === selectedService.id);

  const handleLogout = async (email: string): Promise<void> => {
    try {
      const response = await fetch('/api/gdrive/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        localStorage.removeItem(email);
        setDriveList((prevList) => prevList.filter((drive) => drive.email !== email));
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      {filteredDrives.map((drive, index) => {
        const storageQuota = storageQuotas.find(
          (sq) => sq.email === drive.email
        )?.storageQuota;

        return (
          <DriveItem
            key={index}
            drive={drive}
            storageQuota={storageQuota}
            handleSelectFiles={handleSelectFiles}
            handleLogout={handleLogout}
          />
        );
      })}

      {/* Show the drive adding component for the selected service */}
      <div className="col-span-1 lg:col-span-2 w-full">
        {selectedService.component && (
          <selectedService.component
            onUserInfoReceived={setUserInfo}
            onDriveDataReceived={handleDriveDataReceived}
            onStorageQuotaReceived={handleStorageQuotaReceived}
            onTokensReceived={handleTokensReceived}
          />
        )}
      </div>
    </div>
  );
};

export default DriveList;
