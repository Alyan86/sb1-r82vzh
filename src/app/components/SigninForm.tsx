// src/app/components/SigninForm.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ForgotPasswordForm from './ForgotPasswordForm';

const SigninForm: React.FC<{ onClose: () => void, setShowSignup: (show: boolean) => void, setIsAuthenticated: (isAuthenticated: boolean) => void }> = ({ onClose, setShowSignup, setIsAuthenticated }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();

  const handleSignin = async () => {
    setError('');
    setLoading(true);

    const response = await fetch('/api/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, rememberMe }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error);
    } else {
      onClose();
      setIsAuthenticated(true);
      router.push('/dashboard'); // Redirect to the dashboard after sign-in
    }
  };

  return (
    <>
      {showForgotPassword ? (
        <ForgotPasswordForm onClose={() => setShowForgotPassword(false)} />
      ) : (
        <div className="fixed inset-0 text-black flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative animate-fadeIn">
            <button onClick={onClose} className="absolute top-2 right-2 text-red-600">✕</button>
            <h2 className="text-2xl mb-4 font-bold">Sign In</h2>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="flex items-center mb-4">
                <label className="block font-semibold mr-2 w-1/4">Email or Username</label>
                <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="p-2 border border-gray-300 rounded w-3/4" />
              </div>
              <div className="flex items-center mb-4">
                <label className="block font-semibold mr-2 w-1/4">Password</label>
                <div className="relative w-3/4">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 text-gray-600"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="flex items-center mb-4">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <label className="ml-2">Remember Me</label>
              </div>
              {error && <p className="text-red-600 mb-4">{error}</p>}
              <div className="flex justify-between items-center">
                <button 
                  type="button" 
                  onClick={handleSignin} 
                  className={`bg-blue-600 text-white text-xs px-4 py-2 rounded font-bold ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
                <div>
                  <button type="button" onClick={() => { onClose(); setShowSignup(true); }} className="text-blue-600 hover:underline">Sign Up</button>
                  <span className="mx-2">|</span>
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-blue-600 hover:underline">Forgot Password</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SigninForm;
