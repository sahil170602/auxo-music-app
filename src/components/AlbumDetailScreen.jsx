// src/components/AlbumDetailScreen.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function AlbumDetailScreen({ album: initialAlbum, onBack, onOpenSubPage, playQueue }) {
  // 1. Internal state for the album to allow for realtime metadata updates
  const [album, setAlbum] = useState(initialAlbum);
  const [songs, setSongs] = useState(() => 
    JSON.parse(localStorage.getItem(`auxo_album_songs_${initialAlbum.id}`)) || []
  );
  const [suggestedSongs, setSuggestedSongs] = useState([]);
  const [suggestedAlbums, setSuggestedAlbums] = useState([]);
  const [loading, setLoading] = useState(songs.length === 0);
  
  const hasFetched = useRef(false);

  // --- DATA FETCHING LOGIC ---
  const fetchData = useCallback(async () => {
    try {
      // A. Fetch Album Metadata (to catch live changes to title/desc)
      const { data: latestAlbum } = await supabase
        .from('albums')
        .select('*')
        .eq('id', initialAlbum.id)
        .single();
      
      if (latestAlbum) setAlbum(latestAlbum);

      // B. Fetch Album Songs
      const { data: albumSongs, error: songErr } = await supabase
        .from('songs')
        .select('*, artists(name)')
        .eq('album_id', initialAlbum.id)
        .order('created_at', { ascending: true });

      if (songErr) throw songErr;

      if (albumSongs) {
        setSongs(albumSongs);
        localStorage.setItem(`auxo_album_songs_${initialAlbum.id}`, JSON.stringify(albumSongs));

        // C. Dynamic Suggestions Logic
        if (albumSongs.length > 0) {
          const mainArtistId = albumSongs[0].artist_id;
          const [sugSongsRes, sugAlbumsRes] = await Promise.all([
            supabase.from('songs').select('*, artists(name)').eq('artist_id', mainArtistId).neq('album_id', initialAlbum.id).limit(10),
            supabase.from('albums').select('*, songs!inner(artist_id)').eq('songs.artist_id', mainArtistId).neq('id', initialAlbum.id).limit(10)
          ]);
          setSuggestedSongs(sugSongsRes.data || []);
          setSuggestedAlbums(sugAlbumsRes.data || []);
        }
      }
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [initialAlbum.id]);

  // --- 1. INITIAL MOUNT FETCH ---
  useEffect(() => {
    if (!hasFetched.current) {
      fetchData();
      hasFetched.current = true;
    }
  }, [fetchData]);

  // --- 2. REALTIME SUBSCRIPTION ---
  useEffect(() => {
    // Create a unique channel for this specific album
    const channel = supabase.channel(`album-live-${initialAlbum.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'songs', filter: `album_id=eq.${initialAlbum.id}` }, 
        () => fetchData() // Re-fetch tracklist if songs change
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'albums', filter: `id=eq.${initialAlbum.id}` }, 
        (payload) => setAlbum(payload.new) // Update title/description immediately
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialAlbum.id, fetchData]);

  const handlePlayAll = () => {
    if (songs.length > 0) playQueue(songs, 0); 
  };

  return (
    // 🔴 FIXED: Changed z-[600] to z-[500] so the global Mini-Player (z-600) floats above it!
    <div className="fixed inset-0 bg-black z-[500] flex flex-col animate-fade-in overflow-y-auto no-scrollbar pb-32">
      
      {/* HERO AREA */}
      <div className="relative w-full aspect-square max-h-[500px] shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <img 
          src={album.cover_url || album.image_url} 
          className="w-full h-full object-cover animate-image-in" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent"></div>

        <button onClick={onBack} className="absolute top-8 left-6 p-3 bg-black/40 backdrop-blur-xl rounded-full text-white border border-white/10 active:scale-90 transition-all z-10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
        </button>

        <button onClick={handlePlayAll} className="absolute bottom-8 left-6 w-16 h-16 bg-fuchsia-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-[0_10px_40px_rgba(192,38,211,0.4)] active:scale-90 transition-all group">
          <svg className="w-8 h-8 translate-x-0.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        </button>
      </div>

      {/* ALBUM HEADER INFO */}
      <div className="px-6 mt-8 animate-slide-up">
        <h1 className="text-3xl font-black text-white leading-none tracking-tight uppercase">
          {album.title}
        </h1>
        
        {album.description && (
          <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/5 animate-fade-in">
            <p className="text-neutral-200 text-md leading-relaxed italic opacity-100">
              {album.description}
            </p>
          </div>
        )}
      </div>

      {/* TRACKLIST */}
      <div className="px-6 mt-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-[16px] font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-[0em] mb-6 ml-1">All Songs</h3>
        
        {loading && songs.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 w-full bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {songs.map((song, idx) => (
              <div key={song.id} onClick={() => playQueue(songs, idx)} className="flex items-center gap-4 p-3 rounded-2xl active:bg-white/5 transition-colors group animate-fade-in">
                <span className="text-neutral-700 font-black text-[10px] w-4">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-sm truncate">{song.title}</h4>
                  <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">{song.artists?.name}</p>
                </div>
                <button className="text-neutral-700 group-active:text-fuchsia-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUGGESTIONS */}
      <div className="mt-16 space-y-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
        {suggestedSongs.length > 0 && (
          <div>
            <h3 className="px-7 text-[10px] font-black text-fuchsia-500 uppercase tracking-[0.3em] mb-5">Discover More</h3>
            <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 snap-x">
              {suggestedSongs.map(s => (
                <div key={s.id} onClick={() => playQueue([s], 0)} className="snap-start shrink-0 w-32 flex flex-col gap-3 active:scale-95 transition-transform">
                   <div className="aspect-square rounded-[2rem] bg-neutral-900 border border-white/5 overflow-hidden shadow-xl">
                      <img src={s.image_url} className="w-full h-full object-cover opacity-70" alt="" />
                   </div>
                   <div className="px-1">
                      <p className="text-white text-[10px] font-bold truncate">{s.title}</p>
                      <p className="text-neutral-600 text-[8px] font-black uppercase tracking-tighter truncate">{s.artists?.name}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
