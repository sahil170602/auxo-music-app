<<<<<<< HEAD
// src/components/SeeAllScreen.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function SeeAllScreen({ type, title, id, userId, onBack, playQueue, onOpenSubPage }) {
  // 1. Generate a unique key for this specific list
  const cacheKey = `auxo_list_${type}${id ? `_${id}` : ''}`;

  // 2. Initialize from LocalStorage for Instant UI
  const [items, setItems] = useState(() => 
    JSON.parse(localStorage.getItem(cacheKey)) || []
  );
  
  // Only show the loading spinner if we have absolutely NO cached data
  const [loading, setLoading] = useState(items.length === 0);
  const hasFetched = useRef(false);

  // --- SILENT BACKGROUND SYNC ---
  const loadFullList = useCallback(async () => {
    let data = [];
    try {
      if (type === 'recently-played') {
        const { data: res } = await supabase
          .from('recently_played')
          .select('songs(*, artists(name))')
          .eq('user_id', userId)
          .order('played_at', { ascending: false });
        data = res?.map(r => r.songs) || [];
      } 
      else if (type === 'liked-songs') {
        const { data: res } = await supabase
          .from('liked_songs')
          .select('songs(*, artists(name))')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        data = res?.map(r => r.songs) || [];
      }
      else if (type === 'artists') {
        const { data: res } = await supabase.from('artists').select('*').order('name');
        data = res || [];
      } 
      else if (type === 'section') {
        // Grab section items (could be songs OR albums)
        const { data: res } = await supabase
          .from('home_section_items')
          .select('*, songs(*, artists(name))')
          .eq('section_id', id)
          .order('sort_order');
        data = res || [];
      }

      // Update State & Cache silently
      setItems(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error("Error loading list:", err);
    } finally {
      setLoading(false);
    }
  }, [type, id, userId, cacheKey]);

  useEffect(() => {
    if (!hasFetched.current) {
      loadFullList();
      hasFetched.current = true;
    }
  }, [loadFullList]);

  // --- SMART CLICK HANDLER ---
  const handleItemClick = (item) => {
    // 1. IS IT AN ARTIST?
    if (type === 'artists') {
      // In the future, this will route to an Artist Detail page.
      // For now, do nothing
      return; 
    }
    
    // 2. IS IT AN ALBUM? (Open Album Detail Page)
    if (item.album_id && !item.song_id) {
      if (onOpenSubPage) {
        onOpenSubPage({ 
          type: 'album-detail', 
          album: { id: item.album_id, title: item.title, image_url: item.image_url } 
        });
      } else {
        console.error("AUXO Error: onOpenSubPage prop is missing in SeeAllScreen!");
      }
      return;
    }

    // 3. IS IT A SONG? (Play it immediately)
    const songData = item.songs || item;
    if (songData && songData.audio_url && playQueue) {
      playQueue([songData], 0);
    }
  };

  // Determine Layout: Grid for Artists OR Albums. List for everything else (Songs)
  const isGridForm = type === 'artists' || (items.length > 0 && items.some(item => item.album_id && !item.song_id));

  return (
    <div className="fixed inset-0 bg-neutral-950 z-[500] flex flex-col animate-fade-in overflow-y-auto no-scrollbar">
      
      {/* 1. STICKY HEADER */}
      <div className="sticky top-0 z-[510] bg-neutral-950/90 backdrop-blur-2xl border-b border-white/5 px-6 py-8 flex items-center gap-5">
        <button 
          onClick={onBack} 
          className="p-2.5 bg-white/5 active:scale-90 transition-transform rounded-full text-white border border-white/5 shadow-xl shrink-0"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black text-white  tracking-tight truncate leading-none">
            {title}
          </h2>
         
        </div>
      </div>

      {/* 2. CONTENT AREA */}
      <div className="p-4 pb-25 px-6"> 
        {loading && items.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center gap-5">
            <div className="w-10 h-10 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin"></div>
            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em]">Syncing Library</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-32 text-center animate-fade-in">
             <p className="text-neutral-500 text-sm font-medium italic opacity-40">Your collection is empty.</p>
          </div>
        ) : isGridForm ? (
          
          // ================= GRID LAYOUT (Artists & Albums) =================
          // Notice: No play icons here! Just a clean zoom effect on tap.
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 animate-fade-in pt-2">
            {items.map((item, idx) => {
              const isArtist = type === 'artists';
              const imageUrl = item.image_url || 'https://via.placeholder.com/400';
              const displayTitle = item.title || item.name;
              const displaySubtitle = isArtist ? 'Artist' : (item.subtitle || 'Album');

              return (
                <div 
                  key={item.id || idx} 
                  onClick={() => handleItemClick(item)}
                  className="flex flex-col gap-3 animate-slide-up group cursor-pointer"
                  style={{ animationDelay: `${idx * 20}ms` }}
                >
                  <div className={`aspect-square shadow-2xl relative overflow-hidden border border-white/10 active:scale-95 transition-all duration-300 ${isArtist ? 'rounded-full' : 'rounded-[2.5rem]'}`}>
                    <img src={imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                  </div>
                  <div className="px-1 text-center">
                    <h4 className="text-white font-bold text-sm truncate">{displayTitle}</h4>
                    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1 truncate">{displaySubtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          
          // ================= LIST LAYOUT (Songs) =================
          // The play icon overlay only shows up here!
          <div className="flex flex-col gap-2 animate-fade-in">
            {items.map((item, idx) => {
              const song = item.songs || item; 
              const imageUrl = item.image_url || song?.image_url;
              const displayTitle = item.title || song?.title;
              const displaySubtitle = item.subtitle || song?.artists?.name || 'Single';

              return (
                <div 
                  key={item.id || idx} 
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-4 p-3 rounded-[1.25rem] bg-white/5 border border-white/5 active:bg-white/10 transition-colors cursor-pointer group animate-slide-up"
                  style={{ animationDelay: `${idx * 15}ms` }}
                >
                  {/* Artwork with Play Icon Overlay */}
                  <div className="w-14 h-14 overflow-hidden relative shadow-lg shrink-0 rounded-xl">
                    <img src={imageUrl || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
                      <svg className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  
                  {/* Text Data */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm truncate">{displayTitle}</h4>
                    <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mt-0.5 truncate">
                      {displaySubtitle}
                    </p>
                  </div>
                  
                  {/* Context Menu Icon */}
                  <button onClick={(e) => e.stopPropagation()} className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 active:text-white active:bg-white/10 transition-colors shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
=======
// src/components/SeeAllScreen.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function SeeAllScreen({ type, title, id, userId, onBack, playQueue, onOpenSubPage }) {
  // 1. Generate a unique key for this specific list
  const cacheKey = `auxo_list_${type}${id ? `_${id}` : ''}`;

  // 2. Initialize from LocalStorage for Instant UI
  const [items, setItems] = useState(() => 
    JSON.parse(localStorage.getItem(cacheKey)) || []
  );
  
  // Only show the loading spinner if we have absolutely NO cached data
  const [loading, setLoading] = useState(items.length === 0);
  const hasFetched = useRef(false);

  // --- SILENT BACKGROUND SYNC ---
  const loadFullList = useCallback(async () => {
    let data = [];
    try {
      if (type === 'recently-played') {
        const { data: res } = await supabase
          .from('recently_played')
          .select('songs(*, artists(name))')
          .eq('user_id', userId)
          .order('played_at', { ascending: false });
        data = res?.map(r => r.songs) || [];
      } 
      else if (type === 'liked-songs') {
        const { data: res } = await supabase
          .from('liked_songs')
          .select('songs(*, artists(name))')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        data = res?.map(r => r.songs) || [];
      }
      else if (type === 'artists') {
        const { data: res } = await supabase.from('artists').select('*').order('name');
        data = res || [];
      } 
      else if (type === 'section') {
        // Grab section items (could be songs OR albums)
        const { data: res } = await supabase
          .from('home_section_items')
          .select('*, songs(*, artists(name))')
          .eq('section_id', id)
          .order('sort_order');
        data = res || [];
      }

      // Update State & Cache silently
      setItems(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error("Error loading list:", err);
    } finally {
      setLoading(false);
    }
  }, [type, id, userId, cacheKey]);

  useEffect(() => {
    if (!hasFetched.current) {
      loadFullList();
      hasFetched.current = true;
    }
  }, [loadFullList]);

  // --- SMART CLICK HANDLER ---
  const handleItemClick = (item) => {
    // 1. IS IT AN ARTIST?
    if (type === 'artists') {
      // In the future, this will route to an Artist Detail page.
      // For now, do nothing
      return; 
    }
    
    // 2. IS IT AN ALBUM? (Open Album Detail Page)
    if (item.album_id && !item.song_id) {
      if (onOpenSubPage) {
        onOpenSubPage({ 
          type: 'album-detail', 
          album: { id: item.album_id, title: item.title, image_url: item.image_url } 
        });
      } else {
        console.error("AUXO Error: onOpenSubPage prop is missing in SeeAllScreen!");
      }
      return;
    }

    // 3. IS IT A SONG? (Play it immediately)
    const songData = item.songs || item;
    if (songData && songData.audio_url && playQueue) {
      playQueue([songData], 0);
    }
  };

  // Determine Layout: Grid for Artists OR Albums. List for everything else (Songs)
  const isGridForm = type === 'artists' || (items.length > 0 && items.some(item => item.album_id && !item.song_id));

  return (
    <div className="fixed inset-0 bg-neutral-950 z-[500] flex flex-col animate-fade-in overflow-y-auto no-scrollbar">
      
      {/* 1. STICKY HEADER */}
      <div className="sticky top-0 z-[510] bg-neutral-950/90 backdrop-blur-2xl border-b border-white/5 px-6 py-8 flex items-center gap-5">
        <button 
          onClick={onBack} 
          className="p-2.5 bg-white/5 active:scale-90 transition-transform rounded-full text-white border border-white/5 shadow-xl shrink-0"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black text-white  tracking-tight truncate leading-none">
            {title}
          </h2>
         
        </div>
      </div>

      {/* 2. CONTENT AREA */}
      <div className="p-4 pb-25 px-6"> 
        {loading && items.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center gap-5">
            <div className="w-10 h-10 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin"></div>
            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em]">Syncing Library</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-32 text-center animate-fade-in">
             <p className="text-neutral-500 text-sm font-medium italic opacity-40">Your collection is empty.</p>
          </div>
        ) : isGridForm ? (
          
          // ================= GRID LAYOUT (Artists & Albums) =================
          // Notice: No play icons here! Just a clean zoom effect on tap.
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 animate-fade-in pt-2">
            {items.map((item, idx) => {
              const isArtist = type === 'artists';
              const imageUrl = item.image_url || 'https://via.placeholder.com/400';
              const displayTitle = item.title || item.name;
              const displaySubtitle = isArtist ? 'Artist' : (item.subtitle || 'Album');

              return (
                <div 
                  key={item.id || idx} 
                  onClick={() => handleItemClick(item)}
                  className="flex flex-col gap-3 animate-slide-up group cursor-pointer"
                  style={{ animationDelay: `${idx * 20}ms` }}
                >
                  <div className={`aspect-square shadow-2xl relative overflow-hidden border border-white/10 active:scale-95 transition-all duration-300 ${isArtist ? 'rounded-full' : 'rounded-[2.5rem]'}`}>
                    <img src={imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                  </div>
                  <div className="px-1 text-center">
                    <h4 className="text-white font-bold text-sm truncate">{displayTitle}</h4>
                    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1 truncate">{displaySubtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          
          // ================= LIST LAYOUT (Songs) =================
          // The play icon overlay only shows up here!
          <div className="flex flex-col gap-2 animate-fade-in">
            {items.map((item, idx) => {
              const song = item.songs || item; 
              const imageUrl = item.image_url || song?.image_url;
              const displayTitle = item.title || song?.title;
              const displaySubtitle = item.subtitle || song?.artists?.name || 'Single';

              return (
                <div 
                  key={item.id || idx} 
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-4 p-3 rounded-[1.25rem] bg-white/5 border border-white/5 active:bg-white/10 transition-colors cursor-pointer group animate-slide-up"
                  style={{ animationDelay: `${idx * 15}ms` }}
                >
                  {/* Artwork with Play Icon Overlay */}
                  <div className="w-14 h-14 overflow-hidden relative shadow-lg shrink-0 rounded-xl">
                    <img src={imageUrl || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
                      <svg className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  
                  {/* Text Data */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm truncate">{displayTitle}</h4>
                    <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mt-0.5 truncate">
                      {displaySubtitle}
                    </p>
                  </div>
                  
                  {/* Context Menu Icon */}
                  <button onClick={(e) => e.stopPropagation()} className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 active:text-white active:bg-white/10 transition-colors shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
>>>>>>> 7003a947474ea7f69279be58f362bce9ba6a41cb
