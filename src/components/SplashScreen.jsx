import { useEffect } from 'react';

export default function SplashScreen({ onFinish }) {
  // Trigger the transition out of the splash screen after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    // The main container fills the screen and hides overflow for mobile
    <div className="relative min-h-screen w-full bg-slate-950 flex items-center justify-center overflow-hidden">
      
      {/* Glowing Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-[80px] opacity-50 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-screen filter blur-[80px] opacity-50 animate-blob animation-delay-4000"></div>

      {/* Liquid Glass Logo Container */}
      <div className="relative z-10 flex flex-col items-center justify-center p-12 rounded-[2.5rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        
        {/* Play Button Icon */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-blue-400 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.6)] mb-6 animate-pulse">
           <svg className="w-12 h-12 text-white translate-x-1" fill="currentColor" viewBox="0 0 24 24">
             <path d="M8 5v14l11-7z" />
           </svg>
        </div>
        
        {/* App Typography */}
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-wider">
          AUXO
        </h1>
        <p className="mt-2 text-sm text-white/50 font-medium tracking-widest uppercase">
          Feel the music
        </p>
      </div>
    </div>
  );
}