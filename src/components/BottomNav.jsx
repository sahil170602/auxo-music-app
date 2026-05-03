// src/components/BottomNav.jsx
export default function BottomNav({ activeTab, setActiveTab }) {
  // 🔴 5 tabs to calculate the math for
  const tabs = ['home', 'search', 'library', 'premium', 'ai'];
  
  // Find out which index is currently active (0, 1, 2, 3, or 4)
  const activeIndex = tabs.indexOf(activeTab) !== -1 ? tabs.indexOf(activeTab) : 0;

  const getTabClass = (tabName) => {
    return `flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 relative z-10 transition-all duration-300 ${
      activeTab === tabName 
        ? "text-fuchsia-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.6)] scale-105" 
        : "text-neutral-500 hover:text-white active:scale-95"
    }`;
  };

  return (
    <div className="absolute bottom-0 left-0 w-full z-50 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-4 pointer-events-none">
      
      {/* Outer Nav Card */}
      <div className="px-1 py-1.5 bg-black/70 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_-8px_32px_rgba(0,0,0,0.5)] pointer-events-auto">
        
        {/* Inner Flex Container */}
        <div className="relative flex w-full">
          
          {/* Sliding Animation Pill - w-1/5 for 5 tabs */}
          <div 
            className="absolute top-0 bottom-0 w-1/5 bg-fuchsia-500/15 border border-fuchsia-500/30 rounded-3xl transition-transform duration-500 ease-out z-0 shadow-[0_0_20px_rgba(217,70,239,0.15)]"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />

          {/* Home Tab */}
          <button onClick={() => setActiveTab('home')} className={getTabClass('home')}>
            <svg className="w-5 h-5" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={activeTab === 'home' ? '0' : '2.5'} viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-[9px] font-black tracking-widest uppercase">Home</span>
          </button>

          {/* Search Tab */}
          <button onClick={() => setActiveTab('search')} className={getTabClass('search')}>
            <svg className="w-5 h-5" fill={activeTab === 'search' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={activeTab === 'search' ? '0' : '2.5'} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={activeTab === 'search' ? "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" : "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"}/>
              {activeTab === 'search' && <circle cx="11" cy="11" r="7" fill="currentColor"/>}
            </svg>
            <span className="text-[9px] font-black tracking-widest uppercase">Search</span>
          </button>

          {/* Library Tab */}
          <button onClick={() => setActiveTab('library')} className={getTabClass('library')}>
            <svg className="w-5 h-5" fill={activeTab === 'library' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={activeTab === 'library' ? '0' : '2.5'} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
            <span className="text-[9px] font-black tracking-widest uppercase">Library</span>
          </button>

          {/* Premium Tab */}
          <button onClick={() => setActiveTab('premium')} className={getTabClass('premium')}>
            <svg className="w-5 h-5" fill={activeTab === 'premium' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={activeTab === 'premium' ? '0' : '2.5'} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-[9px] font-black tracking-widest uppercase">Premium</span>
          </button>

          {/* AI Tab */}
          <button onClick={() => setActiveTab('ai')} className={getTabClass('ai')}>
            <svg className="w-5 h-5" fill={activeTab === 'ai' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={activeTab === 'ai' ? '0' : '2.5'} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            <span className="text-[9px] font-black tracking-widest uppercase">AI</span>
          </button>

        </div>
      </div>
    </div>
  );
}