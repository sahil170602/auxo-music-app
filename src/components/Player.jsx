// src/components/Player.jsx
import { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { supabase } from '../lib/supabase'; 

export default function Player({ showBottomNav = true }) { // 🔴 Accept the prop here
  const { 
    currentSong, isPlaying, togglePlay, handleNext, handlePrev, 
    repeatMode, setRepeatMode, isShuffle, setIsShuffle, 
    currentIndex, queueLength, playSong, audioRef 
  } = useMusic();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 0);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [audioRef, currentSong]);

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    if (audioRef?.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  useEffect(() => {
    if (!currentSong) return;
    const fetchSuggestions = async () => {
      try {
        let query = supabase.from('songs').select('*, artists(name)').neq('id', currentSong.id);
        if (currentSong.artist_id) query = query.eq('artist_id', currentSong.artist_id);
        const { data } = await query.limit(15);
        if (data && data.length > 0) {
          const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 5);
          setSuggestions(shuffled);
        }
      } catch (err) { console.error(err); }
    };
    fetchSuggestions();
  }, [currentSong]);

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* MINI PLAYER (Dynamic Positioning) */}
      {!isExpanded && (
        <div 
          onClick={() => setIsExpanded(true)}
          // 🔴 DYNAMIC CLASS: bottom-20 (above nav) OR bottom-4 (bottom of screen)
          className={`fixed left-4 right-4 h-16 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center px-4 gap-4 z-[600] animate-slide-up-mini shadow-2xl cursor-pointer overflow-hidden transition-all duration-300 ${
            showBottomNav ? 'bottom-20' : 'bottom-6'
          }`}
        >
          <img src={currentSong.image_url} className="w-10 h-10 rounded-lg object-cover shadow-lg" alt="" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">{currentSong.title}</p>
            <p className="text-neutral-400 text-[9px] truncate">{currentSong.artists?.name || 'Unknown Artist'}</p>
          </div>
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button disabled={currentIndex === 0} onClick={handlePrev} className="text-white disabled:opacity-30 active:scale-90 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6L18 18V6z"/></svg>
            </button>
            <button onClick={togglePlay} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black active:scale-90 transition-transform shadow-md">
              {isPlaying ? (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-5 h-5 fill-current translate-x-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button disabled={currentIndex === queueLength - 1 && repeatMode !== 'all'} onClick={handleNext} className="text-white disabled:opacity-30 active:scale-90 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>

          <div className="absolute bottom-0 left-0 h-[2px] bg-white/10 w-full">
            <div className="h-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      )}

      {/* FULL PLAYER SCREEN */}
      {isExpanded && (
        <div className="fixed inset-0 bg-neutral-950 z-[1000] flex flex-col p-8 animate-slide-up-full overflow-y-auto no-scrollbar">
          
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => setIsExpanded(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Now Playing</span>
            <div className="w-10"></div>
          </div>

          <div className="w-full aspect-square rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-8 border border-white/5">
            <img src={currentSong.image_url} className="w-full h-full object-cover" alt="" />
          </div>

          <div className="flex justify-between items-start mb-6">
            <div className="min-w-0 flex-1 pr-4">
              <h2 className="fixed left-10 text-3xl font-black text-white italic tracking-tighter truncate">{currentSong.title}</h2>
            </div>
            <button className="text-fuchsia-500 font-black text-[14px] bg-fuchsia-500/10 px-4 py-2 rounded-full border border-fuchsia-500/20 active:scale-95 transition-transform shrink-0">Lyrics</button>
          </div>

          <div className="flex items-center gap-3 mb-8 px-1">
            <span className="text-[10px] font-bold text-neutral-400 w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min={0} 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none accent-fuchsia-500 cursor-pointer"
            />
            <span className="text-[10px] font-bold text-neutral-400 w-8 tabular-nums">{formatTime(duration)}</span>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center px-4">
              <button onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')} className={`transition-colors active:scale-90 ${repeatMode !== 'off' ? 'text-fuchsia-500' : 'text-neutral-500'}`}>
                <div className="relative">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  {repeatMode === 'one' && <span className="absolute -top-1.5 -right-2 bg-neutral-950 text-fuchsia-500 rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black border border-fuchsia-500/30">1</span>}
                </div>
              </button>

              <button onClick={() => setIsShuffle(!isShuffle)} className={`transition-colors active:scale-90 ${isShuffle ? 'text-fuchsia-500' : 'text-neutral-500'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              </button>
            </div>

            <div className="flex justify-center items-center gap-10">
               <button disabled={currentIndex === 0} onClick={handlePrev} className="text-white disabled:opacity-20 scale-125 active:scale-100 transition-transform"><svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6L18 18V6z"/></svg></button>
               <button onClick={togglePlay} className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-black shadow-xl active:scale-90 transition-transform">
                  {isPlaying ? (
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-8 h-8 fill-current translate-x-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
               </button>
               <button disabled={currentIndex === queueLength - 1 && repeatMode !== 'all'} onClick={handleNext} className="text-white disabled:opacity-20 scale-125 active:scale-100 transition-transform"><svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
            </div>

            <div className="flex justify-center pt-2">
              <button className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 text-neutral-400 active:text-fuchsia-500 active:bg-fuchsia-500/10 transition-colors">
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                 <span className="text-[10px] font-black uppercase tracking-widest">Like Track</span>
              </button>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-14 mb-8">
              <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-6 pl-1">Suggested Tracks</h3>
              <div className="flex overflow-x-auto no-scrollbar gap-4 -mx-8 px-8 snap-x">
                {suggestions.map((song) => (
                  <div key={song.id} onClick={() => playSong([song], 0)} className="snap-start shrink-0 w-32 flex flex-col gap-3 active:scale-95 transition-transform cursor-pointer">
                    <div className="aspect-square rounded-[2rem] overflow-hidden shadow-xl border border-white/10 bg-neutral-900">
                      <img src={song.image_url} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold truncate">{song.title}</p>
                      <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest truncate mt-0.5">{song.artists?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
}