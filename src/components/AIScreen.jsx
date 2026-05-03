// src/components/AIScreen.jsx

export default function AIScreen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 animate-fade-in relative overflow-hidden pb-32">
      
      {/* Background Fuchsia Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-fuchsia-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center text-center">
        
        {/* Glassmorphic Icon Container */}
        <div className="w-24 h-24 mb-8 bg-gradient-to-br from-fuchsia-400 to-purple-600 rounded-[2rem] p-[2px] shadow-[0_0_50px_rgba(217,70,239,0.3)]">
          <div className="w-full h-full bg-neutral-950 rounded-[calc(2rem-2px)] flex items-center justify-center">
            <svg className="w-12 h-12 text-fuchsia-400" fill="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-fuchsia-600 mb-4 tracking-tighter">
          Auxo AI
        </h1>
        
        <p className="text-white font-bold text-xl mb-2 tracking-tight">
          Coming Soon
        </p>
        
        <p className="text-neutral-400 text-sm max-w-[260px] leading-relaxed">
          Your personal AI DJ. Smart playlist generation, seamless transitions, and intelligent mood curation.
        </p>
        
      </div>
    </div>
  );
}