
// src/components/PremiumScreen.jsx

export default function PremiumScreen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 animate-fade-in relative overflow-hidden pb-32">
      
      {/* Background Gold Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center text-center">
        
        {/* Glassmorphic Icon Container */}
        <div className="w-24 h-24 mb-8 bg-gradient-to-br from-amber-300 to-amber-600 rounded-[2rem] p-[2px] shadow-[0_0_50px_rgba(245,158,11,0.3)]">
          <div className="w-full h-full bg-neutral-950 rounded-[calc(2rem-2px)] flex items-center justify-center">
            <svg className="w-12 h-12 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 mb-4 tracking-tighter">
          Premium
        </h1>
        
        <p className="text-white font-bold text-xl mb-2 tracking-tight">
          Coming Soon
        </p>
        
        <p className="text-neutral-400 text-sm max-w-[260px] leading-relaxed">
          Unlock lossless audio, unlimited skips, offline downloads, and a completely ad-free experience.
        </p>
        
      </div>
    </div>
  );
//7003a947474ea7f69279be58f362bce9ba6a41cb
}