// src/components/LoginForm.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginForm({ onToggleMode, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Check if the email exists in our database first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle(); // Returns null if no match is found, instead of crashing

      if (profileError) throw profileError;

      // 2. If no profile is found, show the exact error and stop
      if (!profileData) {
        setError("Account not found");
        setLoading(false);
        return;
      }

      // 3. Since the email exists, attempt the actual login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // If Supabase throws an error now, we know it MUST be the password
        setError("Incorrect password");
        setPassword(''); // Clear the password text field so they can try again
      } else if (data.session) {
        // Both are correct! Go to home.
        if (onLoginSuccess) onLoginSuccess();
      }
      
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      
      {/* Animated Glowing Logo Icon */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-orange-500 flex items-center justify-center shadow-[0_0_40px_rgba(217,70,239,0.4)] mb-4">
        <svg className="w-8 h-8 text-white translate-x-1" fill="currentColor" viewBox="0 0 28 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      
      <h1 className="text-[32px] font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-1 text-center">
        Welcome to AUXO
      </h1>
      <h2 className="text-2xl font-bold text-white mb-2">Feel the music</h2>

      {/* Error Popup Alert Box */}
      {error && (
        <div className="w-full p-2 mb-4 rounded-xl bg-red-900/80 border border-red-500/50 text-red-300 text-sm font-semibold text-center backdrop-blur-sm animate-fade-in shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          {error}
        </div>
      )}

      <form className="w-full space-y-4" onSubmit={handleLogin}>
        <div>
          {/* AMOLED style inputs */}
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-black/60 transition-all shadow-inner"
          />
        </div>
        <div>
          <input 
            type="password" 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-black/60 transition-all shadow-inner"
          />
        </div>
        
        <div className="flex justify-end w-full pb-2">
          <button type="button" className="text-sm text-fuchsia-500 hover:text-fuchsia-400 transition-colors">
            Forgot Password?
          </button>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 text-white font-bold shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {loading ? (
            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            "Sign In"
          )}
        </button>

        <p className="mt-4 mb-2 text-center text-neutral-400 text-sm">
          Don't have an account?{' '}
          <button type="button" onClick={onToggleMode} className="text-fuchsia-500 font-bold hover:text-fuchsia-400 transition-colors">
            Sign Up
          </button>
        </p>
      </form>

      <div className="flex items-center w-full my-6">
        <div className="flex-1 h-px bg-white/5"></div>
        <span className="px-4 text-xs text-neutral-500 uppercase tracking-widest">Or continue with</span>
        <div className="flex-1 h-px bg-white/5"></div>
      </div>

      {/* Full-length Brand Social Buttons */}
      <div className="flex flex-col gap-3 w-full">
        
        {/* Google */}
        <button type="button" className="w-full py-3.5 px-4 rounded-xl bg-white text-black font-semibold flex items-center justify-center relative hover:bg-gray-200 transition-all active:scale-[0.98]">
          <svg className="w-5 h-5 absolute left-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Apple */}
        <button type="button" className="w-full py-3.5 px-4 rounded-xl bg-black border border-white/20 text-white font-semibold flex items-center justify-center relative hover:bg-neutral-900 transition-all active:scale-[0.98]">
          <svg className="w-5 h-5 absolute left-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-1.956.04-3.766 1.146-4.773 2.926-2.043 3.593-.522 8.91 1.465 11.83 1.004 1.463 2.192 3.103 3.791 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.655-2.924 1.146-1.688 1.616-3.327 1.642-3.418-.035-.013-3.178-1.22-3.21-4.88-.026-3.063 2.492-4.55 2.607-4.633-1.436-2.127-3.666-2.415-4.475-2.5-1.52-.164-3.262 1.065-4.628 1.065-1.312 0-2.73-1.026-4.008-1.026z M15.006 4.542c.813-.986 1.36-2.355 1.21-3.712-1.14.046-2.585.768-3.425 1.748-.686.784-1.334 2.18-.168 3.52 1.275.053 2.573-.78 3.383-1.556z"/>
          </svg>
          Continue with Apple
        </button>

       

      </div>
    </div>
  );
}