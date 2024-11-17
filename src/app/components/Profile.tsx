import React, { useState } from 'react';
import { AiOutlineUser, AiOutlineLogout } from 'react-icons/ai';
import { useRouter } from 'next/navigation';

const Profile: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', {
      method: 'GET',
      credentials: 'include',
    });
    router.push('/'); // Redirect to the root page after logout
  };

  return (
    <div style={{ position: 'relative', marginTop: 'auto', padding: '1rem' }}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}
      >
        <AiOutlineUser size={24} />
      </button>
      {isMenuOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '50px',
            left: '0',
            background: '#024950',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            <AiOutlineLogout size={18} style={{ marginRight: '0.5rem' }} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
