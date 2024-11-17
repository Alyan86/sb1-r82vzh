'use client';
import { useState, useCallback } from 'react';
import UUIDGenerator from './UUIDGenerator';
import axios from 'axios';

interface SignupFormProps {
  onClose: () => void;
  setShowSignin: (show: boolean) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onClose, setShowSignin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('weak');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [uuid, setUUID] = useState<string | null>(null);
  const [error, setError] = useState<{ field: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const handleUUIDGenerated = useCallback((generatedUUID: string) => {
    setUUID(generatedUUID);
  }, []);

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

  const handleSignup = async () => {
    // Client-side validation
    if (!firstName) {
      setError({ field: 'firstName', message: 'First name is required' });
      return;
    }
    if (!lastName) {
      setError({ field: 'lastName', message: 'Last name is required' });
      return;
    }
    if (!username) {
      setError({ field: 'username', message: 'Username is required' });
      return;
    }
    if (!/^[a-zA-Z0-9._]{3,20}$/.test(username)) {
      setError({ field: 'username', message: 'Invalid username format' });
      return;
    }
    if (!email) {
      setError({ field: 'email', message: 'Email is required' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError({ field: 'email', message: 'Invalid email format' });
      return;
    }
    if (!password) {
      setError({ field: 'password', message: 'Password is required' });
      return;
    }
    if (passwordStrength !== 'strong') {
      setError({ field: 'password', message: 'Password is not strong enough' });
      return;
    }
    if (!passwordMatch) {
      setError({ field: 'confirmPassword', message: 'Passwords do not match' });
      return;
    }
    if (!uuid) {
      setError({ field: 'uuid', message: 'UUID generation failed' });
      return;
    }
  
    setLoading(true);
  
    try {
      const userData = {
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase(),
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        uuid,
        signInMethod: 'registration',
      };
  
      const response = await axios.post('/api/signup', userData);
  
      if (response.data.success) {
        setShowSignin(true);
        onClose();
      } else {
        // Display specific error messages from the API response
        setError({ field: 'form', message: response.data.message || 'Signup failed' });
      }
    } catch (error: any) {
      // If error has a response, set the error message from it
      setError({
        field: 'form',
        message: error.response?.data?.message || 'An error occurred during signup.',
      });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 text-black">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative animate-fadeIn">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-600">✕</button>
        <h2 className="text-2xl mb-4 font-bold">Sign Up</h2>
        <form>
          {error?.field && <p className="text-red-600 mb-2">{error.message}</p>}
          <div className="flex items-center mb-4">
            <label className="block font-semibold mr-2 w-1/4">First Name</label>
            <input type="text" className="p-2 border border-gray-300 rounded w-3/4" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="flex items-center mb-4">
            <label className="block font-semibold mr-2 w-1/4">Last Name</label>
            <input type="text" className="p-2 border border-gray-300 rounded w-3/4" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="flex items-center mb-4">
            <label className="block font-semibold mr-2 w-1/4">Username</label>
            <input type="text" className="p-2 border border-gray-300 rounded w-3/4" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="flex items-center mb-4">
            <label className="block font-semibold mr-2 w-1/4">Email</label>
            <input type="email" className="p-2 border border-gray-300 rounded w-3/4" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex items-center mb-4">
            <label className="block font-semibold mr-2 w-1/4">Password</label>
            <div className="relative w-3/4">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                className="w-full p-2 border border-gray-300 rounded"
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
            <div className="absolute top-0 left-0 bg-white border border-gray-300 p-4 rounded shadow-lg z-10 w-64 mt-12">
              <ul className="text-sm">
                <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>At least one uppercase letter</li>
                <li className={/[!@#$%^&*()<>]/.test(password) ? 'text-green-600' : ''}>At least one special character (!@#$%^&*()&lt;&gt;)</li>
                <li className={/\d/.test(password) ? 'text-green-600' : ''}>At least one number</li>
                <li className={password.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
              </ul>
            </div>
          )}
          <div className="flex items-center mb-4">
            <label className="block font-semibold mr-2 w-1/4">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              className={`p-2 border ${passwordMatch ? 'border-gray-300' : 'border-red-600'} rounded w-3/4`}
            />
          </div>
          <div className="flex items-center mb-4">
            <UUIDGenerator onUUIDGenerated={handleUUIDGenerated} />
          </div>
          <button
            type="button"
            onClick={handleSignup}
            disabled={loading}
            className={`bg-blue-500 text-white py-2 px-4 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
          <p className="mt-4">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setShowSignin(true);
                onClose();
              }}
              className="text-blue-500 underline"
            >
              Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
