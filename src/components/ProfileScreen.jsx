// src/components/ProfileScreen.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ProfileScreen({ onBack }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // Refresh to clear states and show login screen
  };

  return (
    <div className="fixed inset-0 z-[200] bg-neutral-950 flex flex-col animate-slide-up-full overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top,24px)+1rem)] pb-4 shrink-0 relative z-20">
        <button onClick={onBack} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-[15px] font-black tracking-widest text-neutral-500 uppercase">Profile</span>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {loading ? (
          <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="flex flex-col items-center mt-10 animate-fade-in">
            
            {/* AVATAR GLOW CONTAINER */}
            <div className="relative group mb-6">
              <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-600 to-cyan-500 rounded-full blur-2xl opacity-40"></div>
              <div className="relative w-32 h-32 rounded-full border-4 border-neutral-900 shadow-2xl overflow-hidden bg-neutral-800">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-white text-4xl font-black italic">
                    {profile?.full_name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
            </div>

            {/* USER INFO */}
            <h2 className="text-3xl font-black text-white tracking-tighter mb-1">
              {profile?.full_name || 'AUXO User'}
            </h2>
            <p className="text-neutral-500 font-bold text-xs tracking-widest uppercase mb-10">
              Premium Member
            </p>

            {/* ACTION BUTTONS */}
            <div className="w-full max-w-sm flex flex-col gap-4">
              <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 active:scale-95 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </div>
                  <span className="text-white font-bold text-sm">Account Settings</span>
                </div>
                <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black tracking-widest text-xs uppercase active:scale-95 transition-all mt-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
