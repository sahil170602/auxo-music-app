// src/components/MobileLayout.jsx
import Header from './Header';
import BottomNav from './BottomNav';
import Player from './Player';

export default function MobileLayout({ children, activeTab, setActiveTab, showUI }) {
  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden relative">
      
      {/* HEADER - Only visible on main tabs (Home, Search, Library) */}
      {showUI && <Header setActiveTab={setActiveTab} />}

      {/* MAIN CONTENT AREA - Dynamic padding based on UI state */}
      <main className={`flex-1 overflow-y-auto no-scrollbar ${showUI ? 'pb-24' : 'pb-0'}`}>
        {children}
      </main>

      {/* 🔴 GLOBAL MUSIC PLAYER */}
      {/* We pass showUI so the player knows whether to float above the nav or drop to the bottom */}
      <Player showBottomNav={showUI} />

      {/* BOTTOM NAV - Only visible on main tabs */}
      {showUI && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
      
    </div>
  );
}