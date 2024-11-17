import React, { useState, useEffect } from 'react';
import DriveHeader from './drivebox/DriveHeader';
import DriveList from './drivebox/DriveList';
import { GoogleAuth } from './GoogleAuth';
import { OneDriveAuth } from './OneDriveAuth';
import DriveStructureView from './drivebox/DriveStructureView';
import Loading from './Loading'; // Import the new Loading component
import { FaSlack } from 'react-icons/fa';

const NoAuthComponent: React.FC = () => null;

const cloudServices = [
  { id: 'all', name: 'All Drives', component: NoAuthComponent },
  { id: 'google', name: 'Google Drive', component: GoogleAuth },
  { id: 'onedrive', name: 'OneDrive', component: OneDriveAuth },
];

interface DrivesBoxProps {
  id: number;
  title: string;
  selectedServiceId: string;
  updateDriveBox: (id: number, newTitle: string) => void;
  updateSelectedServiceId: (id: number, serviceId: string) => void;
  onDelete: (id: number) => void;
}

const DrivesBox: React.FC<DrivesBoxProps> = ({
  id,
  title,
  selectedServiceId,
  updateDriveBox,
  updateSelectedServiceId,
  onDelete
}) => {
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [driveData, setDriveData] = useState<any[] | null>(null);
  const [showDriveStructure, setShowDriveStructure] = useState(false);
  const [drives, setDrives] = useState<any[]>([]);
  const [storageQuotas, setStorageQuotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);

  const selectedService = cloudServices.find(service => service.id === selectedServiceId) || cloudServices[0];

  useEffect(() => {
    updateSelectedServiceId(id, selectedService.id);
  }, [selectedServiceId]);

  const fetchDrives = async () => {
    setLoading(true); // Start loading when fetching data
    try {
      // Step 1: Fetch Drives Data (Google Drive and OneDrive)
      const driveResponse = await fetch(`/api/fetchDrive`);
      const driveData = await driveResponse.json();
  
      if (driveData.isAuthenticated) {
        setUserInfo(driveData.user); // Set user information if available
  
        // Set drives data after fetching
        setDrives(driveData.drives.map((drive: any) => ({
          ...drive,
          driveType: drive.driveType || (selectedServiceId === 'google-drive' ? 'google' : 'onedrive'),
        })));
  
        // Set storage quotas after fetching
        setStorageQuotas(driveData.storageQuota.map((quota: any) => ({
          ...quota,
          driveType: quota.driveType || (selectedServiceId === 'google-drive' ? 'google' : 'onedrive'),
        })));
  
        setDataFetched(true); // Indicate data has been fetched
      } else {
        console.error('User is not authenticated');
      }
    } catch (error) {
      console.error('Failed to fetch drives:', error);
    } finally {
      setLoading(false); // Stop loading when the fetch is complete
    }
  };
  
  
  useEffect(() => {
    if (!dataFetched) {
      fetchDrives();
    }
  }, [dataFetched]);
  

  const handleLoadButtonClick = () => {
    fetchDrives(); // Fetch data when the load button is clicked
  };

  const handleSelectFiles = (files: any[]) => {
    setDriveData(files);
    setShowDriveStructure(true);
  };

  const handleCloseDriveStructure = () => {
    setShowDriveStructure(false);
  };

  const handleOkDriveStructure = (selectedItems: { id: string; path: string; name: string; }[]) => {
    console.log('Selected Items:', selectedItems);
    setShowDriveStructure(false);
  };

  const handleTokensReceived = (tokens: any) => {
    console.log('Tokens received:', tokens);
  };

  const handleDriveDataReceived = (newDriveData: any[]) => {
    setDriveData(newDriveData);
    if (userInfo) {
      setDrives(drives => [
        ...drives,
        { email: userInfo.email, files: newDriveData, driveType: selectedService.id === 'google-drive' ? 'google' : 'onedrive' }
      ]);
    }
  };

  const handleStorageQuotaReceived = (storageQuota: any) => {
    if (userInfo) {
      setStorageQuotas(sq => [
        ...sq,
        { email: userInfo.email, storageQuota, driveType: selectedService.id === 'google-drive' ? 'google' : 'onedrive' }
      ]);
    }
  };

  const handleSaveTitle = (newTitle: string) => {
    updateDriveBox(id, newTitle);
  };

  const handleDelete = () => {
    if (id !== 1) { // Prevent deletion of the default DriveBox
      onDelete(id);
    }
  };

  return (
    <div className="border p-4 rounded-lg shadow-lg bg-white" style={{ color: 'black', minHeight: '500px' }}>
      {loading ? (
        <Loading loadingText="Loading your clouds" fullScreen = {false} />
      ) : (
        <>
          <DriveHeader
            title={title}
            selectedService={selectedService}
            cloudServices={cloudServices}
            handleLoadButtonClick={handleLoadButtonClick}
            setSelectedService={(service) => updateSelectedServiceId(id, service.id)}
            showDriveStructure={showDriveStructure}
            onDelete={handleDelete}
            onSaveTitle={handleSaveTitle}
          />
          {!showDriveStructure && (
            <DriveList
              drives={drives}
              storageQuotas={storageQuotas}
              handleSelectFiles={handleSelectFiles}
              selectedService={selectedService}
              setUserInfo={setUserInfo}
              handleDriveDataReceived={handleDriveDataReceived}
              handleStorageQuotaReceived={handleStorageQuotaReceived}
              handleTokensReceived={handleTokensReceived}
            />
          )}
          {showDriveStructure && (
            <DriveStructureView
              driveData={driveData || []}
              handleCloseDriveStructure={handleCloseDriveStructure}
              handleOkDriveStructure={handleOkDriveStructure}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DrivesBox;
