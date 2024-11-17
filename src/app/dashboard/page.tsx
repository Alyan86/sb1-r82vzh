'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '../components/Dashboard';
import { checkUserAuthentication } from '../utils/auth';
import Loading from '../components/Loading'; // Import the LoadingScreen component

const DashboardPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // Authentication status
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await checkUserAuthentication();
      setIsAuthenticated(authenticated);

      if (!authenticated) {
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  // If authentication status is null, show the loading screen
  if (isAuthenticated === null) {
    return <Loading loadingText="Arranging things for you" fullScreen = {true} />
  }

  // Once authenticated, show the Dashboard component
  return <Dashboard />;
};

export default DashboardPage;
