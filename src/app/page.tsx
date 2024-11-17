'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import { checkUserAuthentication } from './utils/auth';

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showContent, setShowContent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await checkUserAuthentication();
      setIsAuthenticated(authenticated);
      setShowContent(true);

      if (authenticated) {
        router.push('/dashboard');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="transition-container">
      {isAuthenticated === null ? null : (
        <div className={`content ${showContent ? 'fade-in' : ''}`}>
          {!isAuthenticated && (
            <>
              <Header setIsAuthenticated={setIsAuthenticated} />
              <LandingPage />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
