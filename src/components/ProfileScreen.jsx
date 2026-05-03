// src/components/ProfileScreen.jsx
import { useMusic } from '../context/MusicContext';

export default function ProfileScreen({ onBack }) {
  // Mock stats - these could eventually come from Supabase
  const stats = [
    { label: 'Liked', value: '124' },
    { label: 'Playlists', value: '12' },
    { label: 'Minutes', value: '2.4k' }
  ];

  return (
    <div className="w-full h-full bg-neutral-950 flex flex-col animate-fade-in relative overflow-hidden pb-32">
      
      {/* 🔴 Background Glow Orbs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-fuchsia-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 -left-24 w-64 h-64 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header Navigation */}
      <div className="flex items-center px-6 pt-8 pb-4 relative z-10">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="ml-4 text-sm font-black text-white uppercase tracking-[0.3em]">Account</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6 relative z-10">
        
        {/* Profile Identity Card */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-32 h-32 rounded-[3rem] p-1 bg-gradient-to-tr from-fuchsia-500 to-cyan-500 shadow-2xl mb-6">
            <div className="w-full h-full bg-neutral-900 rounded-[calc(3rem-4px)] flex items-center justify-center overflow-hidden">
               {/* Replace with actual profile image if available */}
               <svg className="w-16 h-16 text-white/20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter mb-1">Sahil Meshram</h1>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full text-[9px] font-black text-fuchsia-400 uppercase tracking-widest">Full-stack Developer</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between gap-4 mb-10">
          {stats.map((s, i) => (
            <div key={i} className="flex-1 bg-white/5 border border-white/5 rounded-3xl p-4 text-center backdrop-blur-xl">
              <p className="text-xl font-black text-white mb-0.5">{s.value}</p>
              <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Settings/Account List - Coming Soon Section */}
        <div className="space-y-4 relative">
          <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4 ml-1">Settings</h3>
          
          {['Edit Profile', 'Audio Quality', 'Connected Devices', 'Notifications', 'Privacy'].map((item) => (
            <div key={item} className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[1.5rem] opacity-50 grayscale cursor-not-allowed">
              <span className="text-sm font-bold text-white">{item}</span>
              <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}

          {/* Coming Soon Overlay */}
          <div className="absolute inset-0 top-8 flex items-center justify-center pointer-events-none">
            <div className="bg-fuchsia-600/90 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl rotate-[-5deg] backdrop-blur-md">
              Features Coming Soon
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button className="w-full mt-12 py-5 bg-red-500/5 border border-red-500/10 rounded-[2rem] text-red-500 font-black text-xs uppercase tracking-widest active:bg-red-500/10 transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}