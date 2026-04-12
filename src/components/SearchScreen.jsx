// src/components/SearchScreen.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function SearchScreen({ onOpenSubPage }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [combinedResults, setCombinedResults] = useState([]);
  
  // 1. Initialize from LocalStorage for Instant UI
  const [recentSearches, setRecentSearches] = useState(() => 
    JSON.parse(localStorage.getItem('auxo_search_history')) || []
  );
  const [suggestions, setSuggestions] = useState(() => 
    JSON.parse(localStorage.getItem('auxo_search_suggestions')) || []
  );

  const hasFetched = useRef(false);

  // --- SILENT BACKGROUND SYNC ---

  const fetchHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('search_history')
      .select('query')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      const history = data.map(d => d.query);
      setRecentSearches(history);
      localStorage.setItem('auxo_search_history', JSON.stringify(history));
      return history;
    }
    return [];
  }, []);

  const fetchSuggestions = useCallback(async (history) => {
    let query = supabase.from('songs').select('*, artists(name)');
    // If we have history, suggest similar songs, else suggest top tracks
    if (history && history.length > 0) {
      query = query.ilike('title', `%${history[0]}%`);
    }
    const { data } = await query.limit(10);
    if (data) {
      setSuggestions(data);
      localStorage.setItem('auxo_search_suggestions', JSON.stringify(data));
    }
  }, []);

  // --- LOGIC ---

  useEffect(() => {
    const initSilentSync = async () => {
      if (hasFetched.current) return;
      const freshHistory = await fetchHistory();
      await fetchSuggestions(freshHistory);
      hasFetched.current = true;
    };
    initSilentSync();
  }, [fetchHistory, fetchSuggestions]);

  // Live Search Effect (No cache needed for live results)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim() === '') {
        setCombinedResults([]);
        return;
      }

      const [songsRes, albumsRes, artistsRes] = await Promise.all([
        supabase.from('songs').select('*, artists(name)').ilike('title', `%${searchQuery}%`).limit(5),
        supabase.from('albums').select('*').ilike('title', `%${searchQuery}%`).limit(5),
        supabase.from('artists').select('*').ilike('name', `%${searchQuery}%`).limit(5)
      ]);

      const formattedSongs = (songsRes.data || []).map(item => ({ ...item, type: 'song' }));
      const formattedAlbums = (albumsRes.data || []).map(item => ({ ...item, type: 'album' }));
      const formattedArtists = (artistsRes.data || []).map(item => ({ ...item, type: 'artist' }));

      setCombinedResults([...formattedArtists, ...formattedSongs, ...formattedAlbums]);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const saveSearch = async (query) => {
    if (!query.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('search_history').upsert({ user_id: user.id, query: query.trim() });
    fetchHistory();
  };

  const clearHistoryItem = async (query) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('search_history').delete().eq('user_id', user.id).eq('query', query);
    fetchHistory();
  };

  const clearAllHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!window.confirm("Clear all recent searches?")) return;
    await supabase.from('search_history').delete().eq('user_id', user.id);
    setRecentSearches([]);
    localStorage.removeItem('auxo_search_history');
  };

  return (
    <div className="w-full flex flex-col pt-4 pb-24 animate-fade-in px-6 overflow-x-hidden">
      
      {/* SEARCH INPUT */}
      <div className="sticky top-0 z-50 pt-2 pb-6 bg-black">
        <div className="relative group">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text"
            placeholder="Search songs, albums, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveSearch(searchQuery)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 outline-none focus:border-fuchsia-500/50 transition-all"
          />
        </div>
      </div>

      {searchQuery.trim() === '' ? (
        <>
          {/* RECENT SEARCHES - Instant Show from LocalStorage */}
          {recentSearches.length > 0 && (
            <div className="mb-8 animate-fade-in">
              <div className="flex justify-between items-center mb-4 ml-1">
                <h3 className="text-[14px] font-bold text-neutral-200">Recent Search</h3>
                <button onClick={clearAllHistory} className="text-[12px] font-black text-fuchsia-500 tracking-wide active:opacity-50">
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((q, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 active:scale-95 transition-all">
                    <button onClick={() => setSearchQuery(q)} className="text-sm text-white font-medium whitespace-nowrap">{q}</button>
                    <button onClick={() => clearHistoryItem(q)} className="text-neutral-500 hover:text-red-400 p-0.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUGGESTIONS - Instant Show from LocalStorage */}
          <div className="animate-fade-in">
            <h3 className="text-[14px] font-bold text-fuchsia-500 mb-4 ml-1">Recommended for you</h3>
            <div className="flex flex-col gap-3">
              {suggestions.length > 0 ? suggestions.map((song) => (
                <div key={song.id} className="w-full flex items-center gap-4 p-3 rounded-2xl bg-neutral-900/50 border border-white/5 active:scale-[0.98] transition-all">
                  <img src={song.image_url} className="w-12 h-12 rounded-xl object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm truncate">{song.title}</h4>
                    <p className="text-neutral-500 text-[10px] uppercase font-black tracking-widest">{song.artists?.name}</p>
                  </div>
                  <div className="text-fuchsia-500/50 text-[8px] border border-fuchsia-500/20 px-2 py-1 rounded-md font-black tracking-widest">SONG</div>
                </div>
              )) : (
                <div className="h-40 w-full rounded-2xl bg-neutral-900/50 animate-pulse border border-white/5"></div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* LIVE RESULTS */
        <div className="flex flex-col gap-3">
          {combinedResults.map((item, idx) => (
            <div key={`${item.type}-${item.id}-${idx}`} onClick={() => { saveSearch(searchQuery); if(item.type === 'album') onOpenSubPage({ type: 'section', title: item.title, id: item.id }); }} className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/5 active:scale-[0.98] transition-all border border-white/5">
              <img src={item.image_url || item.cover_url} className={`w-12 h-12 object-cover ${item.type === 'artist' ? 'rounded-full' : 'rounded-xl'}`} alt="" />
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm truncate">{item.title || item.name}</h4>
                <p className="text-neutral-500 text-[10px] uppercase font-black tracking-widest">{item.type === 'song' ? item.artists?.name : item.type}</p>
              </div>
              <div className={`text-[8px] font-black px-2 py-1 rounded-md tracking-tighter border ${item.type === 'artist' ? 'border-cyan-500/30 text-cyan-500' : item.type === 'album' ? 'border-orange-500/30 text-orange-500' : 'border-fuchsia-500/30 text-fuchsia-500'}`}>
                {item.type.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}