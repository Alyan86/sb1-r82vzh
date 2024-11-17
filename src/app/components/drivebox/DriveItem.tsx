import React, { useState, useEffect } from 'react';

interface DriveItemProps {
  drive: any;
  storageQuota: any;
  handleSelectFiles: (files: any[]) => void;
  handleLogout: (email: string) => Promise<void>;
}

// Normalization function for storage quota
function normalizeStorageQuota(storageQuota: any, driveType: "google" | "onedrive") {
  let used = 0;
  let total = 0;

  if (driveType === 'google') {
    used = storageQuota?.usage || 0; // Assuming usage is in bytes
    total = storageQuota?.limit || 0; // Assuming limit is in bytes
  } else if (driveType === 'onedrive') {
    used = storageQuota?.used || 0; // Assuming this is in bytes as well
    total = storageQuota?.total || 0; // Assuming this is in bytes
  }

  // Convert bytes to GB
  const usedInGB = used / (1024 * 1024 * 1024);
  const totalInGB = total / (1024 * 1024 * 1024);
  const usagePercentage = totalInGB > 0 ? (usedInGB / totalInGB) * 100 : 0;

  return {
    used: usedInGB.toFixed(2),  // Display up to 2 decimal places
    total: totalInGB.toFixed(2),
    usagePercentage: usagePercentage.toFixed(2),
  };
}

const DriveItem: React.FC<DriveItemProps> = ({
  drive,
  storageQuota,
  handleSelectFiles,
  handleLogout,
}) => {
  const [driveName, setDriveName] = useState<string>(drive.email);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Fetch drive name from localStorage whenever the drive prop changes
    const savedName = localStorage.getItem(drive.email);
    if (savedName) {
      setDriveName(savedName);
    } else {
      setDriveName(drive.email); // Set to the default drive name if no saved name exists
    }
  }, [drive.email]); // The effect will rerun whenever the drive's email changes
  

  const handleRename = () => {
    const newName = prompt('Enter new drive name:', driveName);
    if (newName) {
      setDriveName(newName);
      localStorage.setItem(drive.email, newName);
    }
  };

  const handleLogoutClick = async () => {
    setLoading(true);
    try {
      await handleLogout(drive.email);
    } finally {
      setLoading(false);
    }
  };

  // Normalize the storage quota based on the drive type
  const normalizedQuota = normalizeStorageQuota(storageQuota, drive.driveType);
  const { used, total, usagePercentage } = normalizedQuota;

  // Determine the correct icon based on driveType
  const iconSrc =
    drive.driveType === 'google'
      ? '/logos/google-drive.svg'
      : drive.driveType === 'onedrive'
      ? '/logos/onedrive.svg'
      : '/logos/default-drive.svg'; // Fallback icon

  return (
    <div className="w-full bg-gray-100 border rounded p-2 relative">
      <div className="flex justify-between items-center">
        <div className="text-lg font-bold content-center">{driveName}</div>
        <div className="relative">
          <button className="text-xl" onClick={() => setMenuOpen(!menuOpen)}>
            &#x2026;
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={handleRename}
              >
                Rename
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between"
                onClick={handleLogoutClick}
                disabled={loading}
              >
                {loading ? <span className="loader"></span> : 'Logout'}
                <div className="text-xs text-gray-500">{drive.email}</div>
              </button>
            </div>
          )}
        </div>
      </div>
      <button
        className="flex items-center w-full mt-2"
        onClick={() => handleSelectFiles(drive.files)}
        style={{ maxWidth: '300px' }}
      >
        <img src={iconSrc} alt={`${drive.driveType} Logo`} className="w-8 h-8 mr-2" />
        <div className="flex flex-col w-full">
          <div className="text-sm">
            Used: {used} GB / {total} GB
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2.5">
            <div
              className="bg-blue-500 h-2.5 rounded-full"
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default DriveItem;
