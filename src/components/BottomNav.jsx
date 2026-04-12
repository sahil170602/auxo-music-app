// src/components/BottomNav.jsx
export default function BottomNav({ activeTab, setActiveTab }) {
  
  const getTabClass = (tabName) => {
    return `flex flex-col items-center gap-1 transition-all active:scale-95 ${
      activeTab === tabName 
        ? "text-fuchsia-400 scale-105" 
        : "text-neutral-500 hover:text-white"
    }`;
  };

  return (
    // CHANGED: pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] reacts to swipe gestures vs physical buttons
    // Added pointer-events-none to the wrapper, and pointer-events-auto to the card so clicks pass through the empty space
    <div className="absolute bottom-0 left-0 w-full z-50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-4 pointer-events-none">
      
      <div className="flex items-center justify-between px-6 py-4 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.4)] pointer-events-auto">
        
        {/* Home Tab */}
        <button onClick={() => setActiveTab('home')} className={getTabClass('home')}>
          <svg className="w-6 h-6" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={activeTab === 'home' ? '0' : '2'} viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span className="text-[10px] font-medium tracking-wider">Home</span>
        </button>

        {/* Search Tab */}
        <button onClick={() => setActiveTab('search')} className={getTabClass('search')}>
          <svg className="w-6 h-6" fill={activeTab === 'search' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={activeTab === 'search' ? '0' : '2'} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={activeTab === 'search' ? "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" : "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"}/>
            {activeTab === 'search' && <circle cx="11" cy="11" r="7" fill="currentColor"/>}
          </svg>
          <span className="text-[10px] font-medium tracking-wider">Search</span>
        </button>

        {/* Library Tab */}
        <button onClick={() => setActiveTab('library')} className={getTabClass('library')}>
           <svg className="w-6 h-6" fill={activeTab === 'library' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={activeTab === 'library' ? '0' : '2'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
          <span className="text-[10px] font-medium tracking-wider">Library</span>
        </button>

        {/* Profile Tab */}
        <button onClick={() => setActiveTab('profile')} className={getTabClass('profile')}>
          <svg className="w-6 h-6" fill={activeTab === 'profile' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={activeTab === 'profile' ? '0' : '2'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span className="text-[10px] font-medium tracking-wider">Profile</span>
        </button>

      </div>
    </div>
  );
}