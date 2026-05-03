// src/components/MobileLayout.jsx
import Header from './Header';
import BottomNav from './BottomNav';
import Player from './Player';

export default function MobileLayout({ children, activeTab, setActiveTab, showUI, onOpenSubPage }) {
  return (
    <div className="flex flex-col h-screen w-full bg-neutral-950 text-white overflow-hidden fixed inset-0 overscroll-none select-none">
      
      {/* 🔴 BACKGROUND ORBS: Subtle liquid-glass effect base */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-20 -right-20 w-64 h-64 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* HEADER - Only visible on main navigation tabs */}
      {showUI && (
        <Header 
          setActiveTab={setActiveTab} 
          onOpenSubPage={onOpenSubPage} 
        />
      )}
      
      {/* 🔴 MAIN CONTENT AREA - SCROLL LOCK FIXES */}
      {/* overscroll-contain prevents the "bounce" from bubbling up to the browser */}
      <main 
        className={`flex-1 overflow-y-auto overscroll-contain touch-pan-y relative z-10 no-scrollbar ${
          showUI ? 'pb-36' : 'pb-0'
        }`}
      >
        {children}
      </main>

      {/* 🔴 GLOBAL MUSIC PLAYER: Positioned relative to navigation presence */}
      <Player showBottomNav={showUI} />

      {/* BOTTOM NAVIGATION: Main app tabs */}
      {showUI && (
        <BottomNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
      )}
      
    </div>
  );
}