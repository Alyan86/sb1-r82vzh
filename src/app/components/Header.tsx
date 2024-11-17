import React, { useState } from 'react';
import SignupForm from './SignupForm';
import SigninForm from './SigninForm';

const Header: React.FC<{ setIsAuthenticated: (auth: boolean) => void }> = ({ setIsAuthenticated }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignin, setShowSignin] = useState(false);

  return (
    <header className="bg-[#003135] text-white text-center shadow-lg shadow-[#0FA4AF] flex items-center justify-between space-x-4 relative z-50">
      <div className="flex items-center space-x-4">
        <img src="/logos/Logo2.png" alt="EpicBytes Logo2" className="h-14 w-14 ml-5 object-contain" />
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={() => { setShowSignin(true); setShowSignup(false); }} className="bg-[#024950] shadow-sm shadow-[#0FA4AF] text-white px-3 py-2 rounded text-xs font-bold">Sign In</button>
        <button onClick={() => { setShowSignup(true); setShowSignin(false); }} className="bg-[#024950] shadow-sm shadow-[#0FA4AF] text-white px-3 py-2 rounded text-xs font-bold">Sign Up</button>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="bg-[#024950] shadow-sm shadow-[#0FA4AF] mr-5 text-white px-3 py-1 rounded">
            <span className="text-xl">☰</span>
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#003135] text-white rounded shadow-lg z-50 animate-slideIn">
              <button className="block text-left w-full px-4 py-2 hover:bg-[#024950] hover:text-white" onClick={() => setShowMenu(false)}>Features</button>
              <button className="block text-left w-full px-4 py-2 hover:bg-[#024950] hover:text-white" onClick={() => setShowMenu(false)}>Pricing</button>
              <button className="block text-left w-full px-4 py-2 hover:bg-[#024950] hover:text-white" onClick={() => setShowMenu(false)}>Support</button>
              <div className="relative">
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-[#024950] hover:text-white"
                  onClick={() => setShowLanguage(!showLanguage)}
                >
                  Language
                </button>
                {showLanguage && (
                  <div className="absolute right-full top-0 mt-2 w-32 bg-[#003135] text-white rounded shadow-lg z-50 animate-slideIn">
                    <button className="block text-left w-full px-4 py-2 hover:bg-[#024950] hover:text-white" onClick={() => setShowLanguage(false)}>EN</button>
                    <button className="block text-left w-full px-4 py-2 hover:bg-[#024950] hover:text-white" onClick={() => setShowLanguage(false)}>ES</button>
                    <button className="block text-left w-full px-4 py-2 hover:bg-[#024950] hover:text-white" onClick={() => setShowLanguage(false)}>German</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {showSignup && <SignupForm onClose={() => setShowSignup(false)} setShowSignin={setShowSignin} />}
      {showSignin && <SigninForm onClose={() => setShowSignin(false)} setShowSignup={setShowSignup} setIsAuthenticated={setIsAuthenticated} />}
    </header>
  );
};

export default Header;
