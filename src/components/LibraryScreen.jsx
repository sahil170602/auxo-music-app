// src/components/LibraryScreen.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function LibraryScreen({ onOpenSubPage }) {
  const [user, setUser] = useState(null);
  
  // 1. Initialize from LocalStorage for Instant UI
  const [stats, setStats] = useState(() => 
    JSON.parse(localStorage.getItem('auxo_lib_stats')) || { likes: 0, playlists: 0 }
  );
  const [playlists, setPlaylists] = useState(() => 
    JSON.parse(localStorage.getItem('auxo_lib_playlists')) || []
  );

  const hasFetched = useRef(false);

  // --- SILENT BACKGROUND SYNC ---

  const fetchLibraryData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    // Fetch fresh data in the background
    const [likesCount, playlistsData] = await Promise.all([
      supabase.from('liked_songs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('playlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ]);

    const freshStats = { 
      likes: likesCount.count || 0, 
      playlists: playlistsData.data?.length || 0 
    };
    const freshPlaylists = playlistsData.data || [];

    // Update State & Cache
    setStats(freshStats);
    setPlaylists(freshPlaylists);
    
    localStorage.setItem('auxo_lib_stats', JSON.stringify(freshStats));
    localStorage.setItem('auxo_lib_playlists', JSON.stringify(freshPlaylists));
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchLibraryData();
      hasFetched.current = true;
    }
  }, [fetchLibraryData]);

  return (
    <div className="w-full flex flex-col pt-4 pb-24 animate-fade-in px-6 overflow-x-hidden">
      
      {/* IMMERSIVE HEADER */}
      <div className="mb-8 mt-2">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Your Library</h2>
        <p className="text-fuchsia-500 text-[10px] font-black tracking-[0.2em] mt-1">COLLECTIONS & PLAYLISTS</p>
      </div>

      {/* QUICK ACTIONS GRID */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        
        {/* Liked Songs Tile */}
        <div 
          onClick={() => onOpenSubPage({ type: 'liked-songs', title: 'Liked Songs', userId: user?.id })}
          className="aspect-square rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 p-6 flex flex-col justify-between shadow-2xl active:scale-95 transition-all relative overflow-hidden group"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
          <div>
            <h4 className="text-white font-black text-lg leading-tight">Liked<br/>Songs</h4>
            <p className="text-white/60 text-[10px] font-bold uppercase mt-1 tracking-widest">{stats.likes} Tracks</p>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
        </div>

        {/* Following/Artists Tile */}
        <div 
          onClick={() => onOpenSubPage({ type: 'artists', title: 'Following' })}
          className="aspect-square rounded-[2.5rem] bg-neutral-900 border border-white/5 p-6 flex flex-col justify-between shadow-2xl active:scale-95 transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <h4 className="text-white font-black text-lg leading-tight">Your<br/>Artists</h4>
            <p className="text-neutral-500 text-[10px] font-bold uppercase mt-1 tracking-widest">View All</p>
          </div>
        </div>
      </div>

      {/* PLAYLISTS SECTION */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest">Your Playlists</h3>
          <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-90 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </button>
        </div>

        {playlists.length === 0 ? (
          <div className="py-10 text-center rounded-[2rem] border-2 border-dashed border-white/5 bg-white/2">
            <p className="text-neutral-600 text-xs italic">No playlists created yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-fade-in">
            {playlists.map((pl) => (
              <div key={pl.id} className="w-full flex items-center gap-4 p-3 rounded-3xl bg-white/5 border border-white/5 active:scale-[0.98] transition-all">
                <div className="w-14 h-14 rounded-2xl bg-neutral-800 overflow-hidden shadow-lg border border-white/10">
                  {pl.image_url ? (
                    <img src={pl.image_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-sm truncate">{pl.title}</h4>
                  <p className="text-neutral-500 text-[10px] uppercase font-black tracking-widest mt-0.5">Playlist • {user?.email?.split('@')[0] || 'User'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}