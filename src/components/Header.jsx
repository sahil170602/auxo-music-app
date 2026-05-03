// src/components/Header.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 🔴 FIXED: Added onOpenSubPage to the props here!
export default function Header({ setActiveTab, onOpenSubPage }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Real-time update: fetch the latest profile data
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      }
    }
    fetchProfile();
  }, []);

  return (
    <header className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top,24px)+1rem)] pb-4 bg-black/80 backdrop-blur-xl border-b border-white/5 z-[50]">
      {/* Left Side: App Name (Clicking this usually returns home) */}
      <button 
        onClick={() => setActiveTab('home')}
        className="active:scale-95 transition-transform"
      >
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-wider">
          AUXO
        </h1>
      </button>
      
      {/* RIGHT SIDE: Premium Profile Icon */}
      <button 
        type="button" // Forces it not to submit/refresh
        onClick={(e) => {
          e.preventDefault(); // Stops any default browser behavior
          if (onOpenSubPage) {
            onOpenSubPage({ type: 'profile' });
          } else {
            console.error("AUXO Error: onOpenSubPage is not reaching the Header!");
          }
        }} 
        className="group relative flex items-center active:scale-90 transition-all duration-300"
      >
        <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-fuchsia-500/50 overflow-hidden shadow-[0_0_15px_rgba(217,70,239,0.3)] group-hover:border-fuchsia-400 transition-colors">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-bold text-sm">
              {profile?.full_name?.charAt(0) || "U"}
            </div>
          )}
        </div>
      </button>
      
    </header>
  );
}
