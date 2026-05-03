// src/components/AuthPage.jsx
import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Timer to auto-hide the popup after 4 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // This function now accepts an optional message when switching modes
  const handleToggleMode = (message = null) => {
    setIsLogin(!isLogin);
    
    // If a string message was passed (like our success message), set it
    if (typeof message === 'string') {
      setToastMessage(message);
    } else {
      setToastMessage(null);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-4 animate-fade-in z-50 bg-black">
      
      {/* Floating Success Popup (Toast) */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-[60] animate-fade-in w-max max-w-[90vw]">
          <div className="bg-green-500/20 backdrop-blur-xl border border-green-500/50 text-green-300 px-6 py-3 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center gap-3">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Liquid Glass Form Container */}
      <div className="relative z-10 w-full max-w-md max-h-[95%] overflow-y-auto no-scrollbar p-8 sm:p-10 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        
        {isLogin ? (
          <LoginForm 
            onToggleMode={handleToggleMode} 
            onLoginSuccess={onLoginSuccess} 
          />
        ) : (
          <SignUpForm 
            onToggleMode={handleToggleMode} 
          />
        )}

      </div>
      
    </div>
  );
}