// src/app/utils/auth.ts
export async function checkUserAuthentication() {
  try {
    const response = await fetch('/api/checkAuth', {
      method: 'GET',
      credentials: 'include', // Ensure cookies are sent with the request
    });

    if (!response.ok) {
      throw new Error('Network response was not ok.');
    }

    const data = await response.json();

    // Check if data contains the isAuthenticated property
    if (data && typeof data.isAuthenticated === 'boolean') {
      return data.isAuthenticated;
    } else {
      throw new Error('Invalid response format.');
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false; // Return false in case of error
  }
}
