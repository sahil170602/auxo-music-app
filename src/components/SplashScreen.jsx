
// src/components/SplashScreen.jsx
import { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 100);
    const finishTimer = setTimeout(() => onFinish(), 3200);

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 flex flex-col items-center justify-center overflow-hidden fixed inset-0 z-[100]">
      
      {/* Deep space glow */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-fuchsia-600/15 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-600/15 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>

      <div 
        className={`relative z-10 flex flex-col items-center justify-center transition-all duration-1000 ease-out ${
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        
        {/* Play Button Icon */}
        <div 
          className={`w-20 h-20 rounded-full bg-gradient-to-tr from-fuchsia-600 to-cyan-500 flex items-center justify-center shadow-[0_0_50px_rgba(217,70,239,0.3)] mb-8 transition-all duration-1000 delay-300 ${
            mounted ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'
          }`}
        >
           <svg className="w-12 h-12 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 28 24">
             <path d="M8 5v14l11-7z" />
           </svg>
        </div>
        
        {/* 🔴 FIXED: Text clipping applied directly to spans so the browser doesn't hide them */}
        <div className="flex overflow-hidden text-6xl font-black italic tracking-widest mb-4 pb-2">
          
          {/* Left half of the gradient */}
          <span 
            className={`inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 transition-transform duration-[1200ms] cubic-bezier(0.34, 1.56, 0.64, 1) ${
              mounted ? 'translate-x-0' : '-translate-x-[150%]'
            }`}
          >
            AU
          </span>
          
          {/* Right half of the gradient */}
          <span 
            className={`inline-block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 transition-transform duration-[1200ms] cubic-bezier(0.34, 1.56, 0.64, 1) ${
              mounted ? 'translate-x-0' : 'translate-x-[150%]'
            }`}
          >
            XO
          </span>

        </div>

        
      </div>



    </div>
  );
}

