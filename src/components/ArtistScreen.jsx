// src/components/ArtistScreen.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; 
import { supabase } from '../lib/supabase';
import { useMusic } from '../context/MusicContext';

export default function ArtistScreen({ artist, onBack }) {
  const [songs, setSongs] = useState([]);
  const [fullArtist, setFullArtist] = useState(artist); // 🔴 State to hold complete artist data including bio
  const [loading, setLoading] = useState(true);
  
  const { playSong, currentSong, isPlaying, togglePlay } = useMusic();

  // =========================================================
  // HARDWARE BACK BUTTON SYNC LOGIC
  // =========================================================
  useEffect(() => {
    window.history.pushState({ popup: 'artist' }, '', '#artist');

    const handlePopState = () => {
      onBack(); 
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onBack]);

  // =========================================================
  // FETCH ARTIST DATA & SONGS
  // =========================================================
  useEffect(() => {
    if (!artist) return;

    const fetchData = async () => {
      try {
        // 🔴 1. Fetch full artist details to ensure we have the 'bio'
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .select('*')
          .eq('id', artist.id)
          .single();
          
        if (!artistError && artistData) {
          setFullArtist(artistData);
        }

        // 🔴 2. Fetch all songs for this artist
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select('*, artists(name)')
          .eq('artist_id', artist.id)
          .order('created_at', { ascending: false });

        if (songsError) throw songsError;
        setSongs(songsData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [artist]);

  if (!artist) return null;

  const isPlayingThisArtist = currentSong?.artist_id === fullArtist.id && isPlaying;

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs, 0);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[500] bg-neutral-950 flex flex-col animate-slide-up-full overflow-hidden">
      
      {/* ================== SCROLLABLE CONTENT ================== */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6 pt-[calc(env(safe-area-inset-top,24px)+2rem)]">
        
        {/* Artist Profile Area */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative mb-4 group">
            <div className="absolute inset-0 bg-fuchsia-600 rounded-full blur-2xl opacity-20"></div>
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-neutral-900 shadow-2xl bg-neutral-800">
              <img 
                src={fullArtist.image_url || `https://ui-avatars.com/api/?name=${fullArtist.name}&background=random`} 
                alt={fullArtist.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
        
          
          <h2 className="text-3xl font-black text-white tracking-tighter mb-1">{fullArtist.name}</h2>
          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-6">{songs.length} Tracks</p>

          <button 
            onClick={isPlayingThisArtist ? togglePlay : handlePlayAll}
            disabled={songs.length === 0}
            className="w-full max-w-[200px] py-4 rounded-full bg-fuchsia-600 text-white font-black tracking-widest text-xs uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,70,239,0.3)] active:scale-95 transition-transform disabled:opacity-50"
          >
            {isPlayingThisArtist ? (
              <><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> PAUSE</>
            ) : (
              <><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> PLAY ALL</>
            )}
          </button>
        </div>

        {/* 🔴 Bio Section */}
        {fullArtist.bio && (
          <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
            <h3 className="text-white font-bold text-sm mb-2">About</h3>
            <p className="text-neutral-400 text-xs leading-relaxed line-clamp-4">
              {fullArtist.bio}
            </p>
          </div>
        )}

        {/* Popular Tracks Header */}
        <h3 className="text-white font-black text-lg mb-4 tracking-tight">Popular Tracks</h3>

        {/* Songs List */}
        {loading ? (
          <div className="flex justify-center mt-10">
            <div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-10 border border-white/5 rounded-2xl bg-white/5">
            <p className="text-neutral-500 text-sm font-bold">No tracks available for this artist yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {songs.map((song, index) => {
              const isActive = currentSong?.id === song.id;
              return (
                <div 
                  key={song.id}
                  onClick={() => playSong(songs, index)}
                  className={`flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer active:scale-95 ${
                    isActive ? 'bg-white/10 border border-white/10' : 'bg-neutral-900 border border-white/5 hover:bg-white/5'
                  }`}
                >
                  <span className={`w-4 text-center text-xs font-black ${isActive ? 'text-fuchsia-500' : 'text-neutral-600'}`}>
                    {isActive && isPlaying ? (
                      <div className="flex items-end justify-center gap-0.5 h-3">
                        <div className="w-1 bg-fuchsia-500 animate-[bounce_1s_infinite] h-full"></div>
                        <div className="w-1 bg-fuchsia-500 animate-[bounce_1s_infinite_0.2s] h-2/3"></div>
                        <div className="w-1 bg-fuchsia-500 animate-[bounce_1s_infinite_0.4s] h-full"></div>
                      </div>
                    ) : (
                      index + 1
                    )}
                  </span>
                  
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-neutral-800 shadow-md">
                    <img src={song.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-fuchsia-400' : 'text-white'}`}>
                      {song.title}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5 truncate">
                      {song.artists?.name || fullArtist.name}
                    </p>
                  </div>

                  <button className="w-8 h-8 flex items-center justify-center text-neutral-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body 
  );
}