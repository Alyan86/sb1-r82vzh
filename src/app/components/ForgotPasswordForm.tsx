// src/app/components/ForgotPasswordForm.tsx
import React, { useState } from 'react';

const ForgotPasswordForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [method, setMethod] = useState<'email' | 'username'>('email');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('weak');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [stage, setStage] = useState<'request' | 'verify' | 'reset'>('request');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRequestCode = async () => {
    setError('');
    setLoading(true);
    const response = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, identifier }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error);
    } else {
      setStage('verify');
    }
  };

  const handleVerifyCode = async () => {
    setError('');
    setLoading(true);
    const response = await fetch('/api/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error);
    } else {
      setStage('reset');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*()<>]/.test(value);
    const hasMinLength = value.length >= 8;

    if (hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && hasMinLength) {
      setPasswordStrength('strong');
    } else if (hasMinLength) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('weak');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordMatch(value === password);
  };

  const handleResetPassword = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    if (passwordStrength !== 'strong') {
      setError('Password is not strong enough');
      return;
    }

    if (!passwordMatch) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code, password }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 text-black flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative animate-fadeIn">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-600">✕</button>
        <h2 className="text-2xl mb-4 font-bold">Forgot Password</h2>
        {stage === 'request' && (
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="flex items-center mb-4">
              <label className="block font-semibold mr-2 w-1/4">Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value as 'email' | 'username')} className="p-2 border border-gray-300 rounded w-3/4">
                <option value="email">Email</option>
                <option value="username">Username</option>
              </select>
            </div>
            <div className="flex items-center mb-4">
              <label className="block font-semibold mr-2 w-1/4">{method === 'email' ? 'Email' : 'Username'}</label>
              <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="p-2 border border-gray-300 rounded w-3/4" />
            </div>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <div className="flex justify-between items-center">
              <button 
                type="button" 
                onClick={handleRequestCode} 
                className={`bg-blue-600 text-white text-xs px-4 py-2 rounded font-bold ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                disabled={loading}
              >
                {loading ? 'Sending Code...' : 'Send Code'}
              </button>
            </div>
          </form>
        )}
        {stage === 'verify' && (
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="flex items-center mb-4">
              <label className="block font-semibold mr-2 w-1/4">Code</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="p-2 border border-gray-300 rounded w-3/4" />
            </div>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <div className="flex justify-between items-center">
              <button 
                type="button" 
                onClick={handleVerifyCode} 
                className={`bg-blue-600 text-white text-xs px-4 py-2 rounded font-bold ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                disabled={loading}
              >
                {loading ? 'Verifying Code...' : 'Verify Code'}
              </button>
            </div>
          </form>
        )}
        {stage === 'reset' && (
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="flex items-center mb-2">
              <label className="block font-semibold mr-2 w-1/4">New Password</label>
              <div className="relative w-3/4">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password} 
                  onChange={handlePasswordChange} 
                  className="p-2 border border-gray-300 rounded w-full"
                  onFocus={() => setShowPasswordDialog(true)}
                  onBlur={() => setShowPasswordDialog(false)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                <div className={`h-2 mt-1 rounded-full ${passwordStrength === 'weak' ? 'bg-red-600' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-600'}`}></div>
              </div>
            </div>
            {showPasswordDialog && (
              <div className="relative mb-2">
                <div className="absolute left-1/2 bg-white border border-gray-300 p-4 rounded shadow-lg z-10 w-64">
                  <ul className="text-sm">
                    <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>At least one uppercase letter</li>
                    <li className={/[!@#$%^&*()<>]/.test(password) ? 'text-green-600' : ''}>At least one special character (!@#$%^&*()&lt;&gt;)</li>
                    <li className={/\d/.test(password) ? 'text-green-600' : ''}>At least one number</li>
                    <li className={password.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
                  </ul>
                </div>
              </div>
            )}
            <div className="flex items-center mb-4">
              <label className="block font-semibold mr-2 w-1/4">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={handleConfirmPasswordChange} 
                className={`p-2 border ${passwordMatch ? 'border-gray-300' : 'border-red-600'} rounded w-3/4`} 
              />
            </div>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <div className="flex justify-between items-center">
              <button 
                type="button" 
                onClick={handleResetPassword} 
                className={`bg-blue-600 text-white text-xs px-4 py-2 rounded font-bold ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                disabled={loading}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
