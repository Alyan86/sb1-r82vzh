'use client';

import { useEffect, useState } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';

interface UserInfo {
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

interface DriveData {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
}

interface StorageQuota {
  usage: string;
  limit: string;
}

interface Token {
  accessToken: string;
  refreshToken: string;
}

interface GoogleAuthProps {
  onUserInfoReceived: (userInfo: UserInfo) => void;
  onDriveDataReceived: (driveData: DriveData[]) => void;
  onStorageQuotaReceived: (storageQuota: StorageQuota) => void;
  onTokensReceived: (tokens: Token) => void;
}

export const GoogleAuth = ({
  onUserInfoReceived,
  onDriveDataReceived,
  onStorageQuotaReceived,
  onTokensReceived,
}: GoogleAuthProps) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        try {
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          if (!response.ok) {
            throw new Error('Failed to authenticate');
          }

          const data = await response.json();
          console.log('Fetched Data:', data);

          if (data.userInfo) onUserInfoReceived(data.userInfo);
          if (data.driveData) onDriveDataReceived(data.driveData);
          if (data.storageQuota) onStorageQuotaReceived(data.storageQuota);
          if (data.tokens) onTokensReceived(data.tokens);

          // Clear the query parameters from the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error('Error during fetching data:', err);
          setError('Failed to authenticate');
        }
      }
    };

    handleAuth();
  }, [onUserInfoReceived, onDriveDataReceived, onStorageQuotaReceived, onTokensReceived]);

  const signIn = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div>
      <button className="flex items-center bg-blue-500 text-white px-4 py-2 rounded" onClick={signIn}>
        <AiOutlinePlus className="mr-2" /> Add GoogleDrive
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};
