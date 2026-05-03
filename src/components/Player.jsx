// src/components/Player.jsx
import { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { supabase } from '../lib/supabase'; 

export default function Player({ showBottomNav = true }) { 
  const { 
    currentSong, isPlaying, togglePlay, handleNext, handlePrev, 
    repeatMode, setRepeatMode, isShuffle, setIsShuffle, 
    currentIndex, queueLength, playSong, audioRef 
  } = useMusic();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false); 
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0); 
  const [suggestions, setSuggestions] = useState([]);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 🔴 NEW: LIKED STATUS STATE
  const [isLiked, setIsLiked] = useState(false);

  // Parse Real Lyrics from the Database
  const lyricsList = currentSong?.lyrics || [];

  // =========================================================
  // CHECK IF SONG IS LIKED ON LOAD
  // =========================================================
  useEffect(() => {
    if (!currentSong) return;

    const checkLikedStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from('liked_songs')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('song_id', currentSong.id)
        .maybeSingle();

      setIsLiked(!!data); // Set true if a record exists, false if not
    };

    checkLikedStatus();
  }, [currentSong]);

  // =========================================================
  // TOGGLE LIKE BUTTON LOGIC
  // =========================================================
  const handleToggleLike = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert("Please log in to like songs!");
      return;
    }

    if (isLiked) {
      // Remove Like
      setIsLiked(false); // Optimistic UI update
      await supabase
        .from('liked_songs')
        .delete()
        .eq('user_id', session.user.id)
        .eq('song_id', currentSong.id);
    } else {
      // Add Like
      setIsLiked(true); // Optimistic UI update
      await supabase
        .from('liked_songs')
        .insert({ user_id: session.user.id, song_id: currentSong.id });
    }
  };

  // =========================================================
  // BODY SCROLL LOCK LOGIC
  // =========================================================
  useEffect(() => {
    const rootEl = document.getElementById('root');

    if (showLyrics || isExpanded) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      if (rootEl) rootEl.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (rootEl) rootEl.style.overflow = '';
    }

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (rootEl) rootEl.style.overflow = '';
    };
  }, [showLyrics, isExpanded]);

  // =========================================================
  // HARDWARE BACK BUTTON SYNC LOGIC
  // =========================================================
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      if (hash !== '#lyrics') setShowLyrics(false);
      if (hash !== '#player' && hash !== '#lyrics') setIsExpanded(false);
      if (hash === '#player') setIsExpanded(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openExpandedPlayer = () => {
    window.history.pushState(null, '', '#player');
    setIsExpanded(true);
  };

  const closeExpandedPlayer = (e) => {
    if (e) e.stopPropagation();
    if (window.location.hash === '#player') {
      window.history.back(); 
    } else {
      setIsExpanded(false);
    }
  };

  const openLyrics = (e) => {
    if (e) e.stopPropagation();
    window.history.pushState(null, '', '#lyrics');
    setShowLyrics(true);
  };

  const closeLyrics = (e) => {
    if (e) e.stopPropagation();
    if (window.location.hash === '#lyrics') {
      window.history.back();
    } else {
      setShowLyrics(false);
    }
  };

  // =========================================================
  // AUDIO SYNC & FLOATING LYRICS ENGINE
  // =========================================================
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      
      let activeIdx = 0;
      for (let i = 0; i < lyricsList.length; i++) {
        if (audio.currentTime >= lyricsList[i].time) {
          activeIdx = i;
        } else {
          break;
        }
      }
      setCurrentLyricIndex(activeIdx);
    };
    
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 0);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [audioRef, currentSong, lyricsList]);

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
      {/* ================== MINI PLAYER ================== */}
      {!isExpanded && (
        <div 
          onClick={openExpandedPlayer}
          className={`fixed left-4 right-4 h-16 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center px-4 gap-4 z-[600] animate-slide-up-mini shadow-2xl cursor-pointer overflow-hidden transition-all duration-300 ${
            showBottomNav ? 'bottom-24' : 'bottom-6'
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

      {/* ================== FULL PLAYER SCREEN ================== */}
      {isExpanded && (
        <div className="fixed inset-0 bg-neutral-950 z-[1000] flex flex-col animate-slide-up-full overflow-hidden overscroll-contain">
          
          <div className="flex justify-between items-center px-8 pt-8 pb-6 shrink-0 bg-neutral-950 relative z-50">
            <button onClick={closeExpandedPlayer} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <span className="text-[15px] font-black tracking-wide text-neutral-500 uppercase">Now Playing</span>
            <div className="w-10"></div> 
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-0 flex flex-col">
            
            <div className="w-full shrink-0 aspect-square rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-8 border border-white/5 relative group">
              <img src={currentSong.image_url} className="w-full h-full object-cover" alt="" />
            </div>
            
            <div className="flex flex-col items-center justify-center mb-6 shrink-0 gap-1 text-center w-full min-w-0">
              <button onClick={openLyrics} className="flex items-center gap-1.5 bg-fuchsia-500/10 px-3 py-1 rounded-full border border-fuchsia-500/20 text-fuchsia-400 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-transform mb-1 shadow-sm">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
                Lyrics
              </button>
              <h2 className="text-3xl font-black text-white italic tracking-tighter truncate w-full">{currentSong.title}</h2>
              <p className="text-neutral-500 font-bold tracking-widest text-xs uppercase mt-0.5">{currentSong.artists?.name}</p>
            </div>

            <div className="flex items-center gap-3 mb-8 px-1 shrink-0">
              <span className="text-[10px] font-bold text-neutral-400 w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
              
              <div className="flex-1 relative h-1.5 bg-white/10 rounded-full flex items-center group cursor-pointer">
                <div className="absolute left-0 h-full bg-fuchsia-500 rounded-full pointer-events-none" style={{ width: `${progressPercent}%` }}></div>
                <input 
                  type="range" 
                  min={0} 
                  max={duration || 100} 
                  value={currentTime} 
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute h-3.5 w-3.5 bg-white rounded-full shadow border border-neutral-300 transform -translate-x-1/2 pointer-events-none transition-transform" style={{ left: `${progressPercent}%` }}></div>
              </div>

              <span className="text-[10px] font-bold text-neutral-400 w-8 tabular-nums">{formatTime(duration)}</span>
            </div>

            <div className="flex flex-col gap-8 shrink-0">
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

              {/* 🔴 DYNAMIC LIKED BUTTON */}
              <div className="flex justify-center pt-2">
                <button 
                  onClick={handleToggleLike}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-colors active:scale-95 ${
                    isLiked 
                      ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-500' 
                      : 'bg-white/5 border-white/5 text-neutral-400 active:text-fuchsia-500 active:bg-fuchsia-500/10'
                  }`}
                >
                  {isLiked ? (
                    // Filled Heart
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  ) : (
                    // Outline Heart
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest">{isLiked ? 'Liked' : 'Like Track'}</span>
                </button>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="mt-14 mb-8 shrink-0">
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

          {/* ================== LYRICS FULL SCREEN BLUR OVERLAY ================== */}
          {showLyrics && (
            <div 
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="fixed inset-0 z-[2000] bg-neutral-950/95 backdrop-blur-3xl flex flex-col animate-fade-in overflow-hidden touch-none overscroll-contain"
            >
              
              <div className="pt-12 px-8 pb-4 flex justify-between items-center shrink-0 relative z-20">
                 <div className="flex flex-col flex-1 min-w-0 pr-4">
                   <h3 className="text-white font-black italic text-xl truncate">{currentSong.title}</h3>
                   <span className="text-fuchsia-500 text-[10px] font-black tracking-widest uppercase mt-0.5">Live Lyrics</span>
                 </div>
                 <button onClick={closeLyrics} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg backdrop-blur-md shrink-0">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                 </button>
              </div>

              <div className="flex-1 relative flex flex-col items-center justify-center w-full">
                  
                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-neutral-950 to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-neutral-950 to-transparent z-10 pointer-events-none"></div>

                  {/* 🔴 REAL LYRICS DISPLAY */}
                  {lyricsList.length > 0 ? (
                    <div className="absolute top-1/2 left-0 right-0 -mt-[40px] transition-transform duration-700 ease-out flex flex-col items-center" style={{ transform: `translateY(-${currentLyricIndex * 80}px)` }}>
                       {lyricsList.map((lyric, idx) => {
                          const distance = Math.abs(idx - currentLyricIndex);

                          let styling = 'opacity-0 scale-75'; 
                          
                          if (distance === 0) {
                             styling = 'text-white text-[28px] leading-tight font-black scale-100 opacity-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]';
                          } else if (distance === 1) {
                             styling = 'text-white/40 text-[20px] font-bold scale-90 opacity-100';
                          } else if (distance === 2) {
                             styling = 'text-white/20 text-[16px] font-bold scale-80 opacity-100';
                          } else {
                             styling = 'text-white/5 text-[14px] font-medium scale-75 opacity-100 pointer-events-none';
                          }

                          return (
                             <div 
                                key={idx} 
                                onClick={() => handleSeek({target: {value: lyric.time}})} 
                                className={`h-[80px] w-full px-8 flex items-center justify-center text-center transition-all duration-700 ease-out cursor-pointer ${styling}`}
                              >
                                <p className="line-clamp-2">{lyric.text}</p>
                             </div>
                          );
                       })}
                    </div>
                  ) : (
                    // Fallback UI if there are no lyrics in the DB for this song
                    <div className="flex flex-col items-center justify-center text-center px-8 opacity-50">
                      <svg className="w-12 h-12 mb-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                      <h4 className="text-white text-lg font-bold">No Lyrics Available</h4>
                      <p className="text-white/50 text-xs mt-1">Lyrics have not been added for this track yet.</p>
                    </div>
                  )}
              </div>

            </div>
          )}
        </div>
      )}
    </>
  );
}