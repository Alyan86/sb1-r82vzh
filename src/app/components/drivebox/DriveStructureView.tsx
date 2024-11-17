import React from 'react';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import { DriveStructure } from '../DriveStructure';

interface DriveStructureViewProps {
  driveData: any; // Adjust type if necessary
  handleCloseDriveStructure: () => void;
  handleOkDriveStructure: (selectedItems: { id: string; path: string; name: string; }[]) => void;
}

const DriveStructureView: React.FC<DriveStructureViewProps> = ({
  driveData,
  handleCloseDriveStructure,
  handleOkDriveStructure,
}) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4 bg-gray-100 p-2 rounded-t-lg">
        <button
          onClick={handleCloseDriveStructure}
          className="flex items-center bg-gray-300 text-black px-2 py-1 rounded"
        >
          <AiOutlineArrowLeft size={20} />
          <span className="ml-2">Back</span>
        </button>
        <div className="flex space-x-2">
          <button className="bg-gray-300 text-black px-2 py-1 rounded flex items-center" onClick={() => alert('Create folder functionality to be implemented.')}>
            <i className="fas fa-folder-plus"></i>
            <span className="hidden sm:inline ml-1">Create Folder</span>
          </button>
          <button className="bg-gray-300 text-black px-2 py-1 rounded flex items-center" onClick={() => alert('Upload functionality to be implemented.')}>
            <i className="fas fa-upload"></i>
            <span className="hidden sm:inline ml-1">Upload</span>
          </button>
          <button className="bg-gray-300 text-black px-2 py-1 rounded flex items-center" onClick={() => alert('Download functionality to be implemented.')}>
            <i className="fas fa-download"></i>
            <span className="hidden sm:inline ml-1">Download</span>
          </button>
          <button className="bg-red-500 text-white px-2 py-1 rounded flex items-center" onClick={() => alert('Delete functionality to be implemented.')}>
            <i className="fas fa-trash-alt"></i>
            <span className="hidden sm:inline ml-1">Delete</span>
          </button>
        </div>
      </div>
      <div className="w-full h-full mt-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <DriveStructure
          driveData={{ files: driveData }}
          onSelect={handleOkDriveStructure}
        />
      </div>
    </>
  );
};

export default DriveStructureView;
