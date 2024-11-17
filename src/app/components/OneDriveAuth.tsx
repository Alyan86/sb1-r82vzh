import { useEffect, useState } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';

// User Info Interface
interface UserInfo {
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

// Drive Data Interface
interface DriveData {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
}

// Token Interface
interface Token {
  accessToken: string;
  refreshToken: string;
}

// Props for OneDriveAuth
interface OneDriveAuthProps {
  onUserInfoReceived: (userInfo: UserInfo) => void;
  onDriveDataReceived: (driveData: DriveData[]) => void;
  onTokensReceived: (tokens: Token) => void;
}

export const OneDriveAuth = ({
  onUserInfoReceived,
  onDriveDataReceived,
  onTokensReceived,
}: OneDriveAuthProps) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        try {
          const response = await fetch('/api/auth/onedrive', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          if (!response.ok) {
            const errorMessage = `Failed to authenticate: ${response.statusText}`;
            throw new Error(errorMessage);
          }

          const data = await response.json();
          console.log('Fetched Data:', data);

          if (data.userInfo) onUserInfoReceived(data.userInfo);

          if (data.driveData) {
            onDriveDataReceived(data.driveData); // Directly pass drive data
          }

          if (data.tokens) onTokensReceived(data.tokens);

          if (data.storageQuota) {
            console.log('Storage Quota:', data.storageQuota);
          }

          // Remove the 'code' query parameter from the URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('code');
          window.history.replaceState({}, document.title, newUrl.toString());
        } catch (err: any) {
          console.error('Error during fetching data:', err);
          setError(err.message);
        }
      }
    };

    handleAuth();
  }, [onUserInfoReceived, onDriveDataReceived, onTokensReceived]);

  const signIn = () => {
    window.location.href = '/api/auth/onedrive';
  };

  return (
    <div>
      <button className="flex items-center bg-blue-500 text-white px-4 py-2 rounded" onClick={signIn}>
        <AiOutlinePlus className="mr-2" /> Add OneDrive
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};
