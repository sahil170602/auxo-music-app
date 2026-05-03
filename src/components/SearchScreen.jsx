// src/components/SearchScreen.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useMusic } from '../context/MusicContext';

export default function SearchScreen({ onOpenSubPage }) {
  const { playSong } = useMusic();
  const [searchQuery, setSearchQuery] = useState('');
  const [combinedResults, setCombinedResults] = useState([]);
  
  // Initialize from LocalStorage for Instant UI
  const [recentSearches, setRecentSearches] = useState(() => 
    JSON.parse(localStorage.getItem('auxo_search_history')) || []
  );
  const [suggestions, setSuggestions] = useState(() => 
    JSON.parse(localStorage.getItem('auxo_search_suggestions')) || []
  );

  const hasFetched = useRef(false);

  // --- PERSONALIZED RECOMMENDATION LOGIC ---

  const fetchPersonalizedSuggestions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get the most recently played songs to find your taste
    const { data: recentPlayed } = await supabase
      .from('recently_played')
      .select('song_id, songs(artist_id)')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(3);

    let recommendationQuery = supabase.from('songs').select('*, artists(name)');

    if (recentPlayed && recentPlayed.length > 0) {
      // 2. Suggest songs from the same artists you've been listening to
      const artistIds = recentPlayed.map(rp => rp.songs.artist_id).filter(Boolean);
      recommendationQuery = recommendationQuery.in('artist_id', artistIds);
    } else {
      // Fallback: Just get top tracks if history is empty
      recommendationQuery = recommendationQuery.limit(10);
    }

    const { data: recs } = await recommendationQuery.limit(10);
    
    if (recs) {
      setSuggestions(recs);
      localStorage.setItem('auxo_search_suggestions', JSON.stringify(recs));
    }
  }, []);

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
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchHistory();
      fetchPersonalizedSuggestions();
      hasFetched.current = true;
    }
  }, [fetchHistory, fetchPersonalizedSuggestions]);

  // --- LIVE SEARCH ENGINE ---

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim() === '') {
        setCombinedResults([]);
        return;
      }

      const [songsRes, albumsRes, artistsRes] = await Promise.all([
        supabase.from('songs').select('*, artists(name)').ilike('title', `%${searchQuery}%`).limit(5),
        supabase.from('albums').select('*, artists(name)').ilike('title', `%${searchQuery}%`).limit(5),
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
    if (!user) return;
    await supabase.from('search_history').upsert({ user_id: user.id, query: query.trim() });
    fetchHistory();
  };

  return (
    <div className="w-full flex flex-col pt-4 pb-24 animate-fade-in px-6 no-scrollbar overflow-y-auto">
      
      {/* SEARCH INPUT */}
      <div className="sticky top-0 z-50 pt-2 pb-6 bg-black/80 backdrop-blur-xl -mx-6 px-6">
        <div className="relative group">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text"
            placeholder="Songs, albums, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveSearch(searchQuery)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 outline-none focus:border-fuchsia-500/50 transition-all"
          />
        </div>
      </div>

      {searchQuery.trim() === '' ? (
        <>
          {/* RECENT SEARCHES */}
          {recentSearches.length > 0 && (
            <div className="mb-8 animate-fade-in">
              <h3 className="text-[12px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4 ml-1">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSearchQuery(q)}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white font-medium active:scale-95 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DYNAMIC RECOMMENDATIONS */}
          <div className="animate-fade-in">
            <h3 className="text-[12px] font-black text-fuchsia-500 uppercase tracking-[0.2em] mb-6 ml-1">Recommended for you</h3>
            
            <div className="flex overflow-x-auto no-scrollbar gap-6 snap-x -mx-6 px-6 pb-4">
              {suggestions.length > 0 ? suggestions.map((song) => (
                <div 
                  key={song.id} 
                  onClick={() => playSong([song], 0)}
                  className="snap-start shrink-0 w-36 flex flex-col gap-3 group cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="w-36 h-36 rounded-[2rem] shadow-xl border border-white/10 relative overflow-hidden bg-neutral-900">
                    <img src={song.image_url} className="absolute inset-0 w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  </div>
                  <div className="px-1">
                    <p className="text-white font-bold text-xs truncate leading-tight">{song.title}</p>
                    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1 truncate">{song.artists?.name}</p>
                  </div>
                </div>
              )) : (
                <div className="flex gap-4">
                  {[1,2,3].map(i => <div key={i} className="w-36 h-36 rounded-[2rem] bg-neutral-900/50 animate-pulse border border-white/5" />)}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* LIVE SEARCH RESULTS */
        <div className="flex flex-col gap-8 pb-10">
          {combinedResults.map((item, idx) => {
            const isAlbum = item.type === 'album';
            const isArtist = item.type === 'artist';

            return (
              <div 
                key={`${item.type}-${item.id}-${idx}`} 
                onClick={() => {
                  saveSearch(searchQuery);
                  if (isAlbum) onOpenSubPage({ type: 'album-detail', album: item });
                  else if (item.type === 'song') playSong([item], 0);
                }}
                className={`animate-fade-in transition-all active:scale-[0.98] cursor-pointer ${
                  isAlbum 
                    ? "w-full relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10" 
                    : "w-full flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5"
                }`}
              >
                {isAlbum ? (
                  /* MASSIVE "HOTEL VALO" STYLE ALBUM CARD */
                  <>
                    <img src={item.image_url} className="absolute inset-0 w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-90"></div>
                    <div className="absolute bottom-0 left-0 w-full p-8">
                      <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-white text-[9px] font-black uppercase tracking-widest mb-3 border border-white/20">Album</span>
                      <h3 className="text-white text-3xl font-black italic tracking-tighter mb-1 line-clamp-2 leading-tight">{item.title}</h3>
                      <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest truncate">{item.artists?.name || "Various Artists"}</p>
                    </div>
                  </>
                ) : (
                  /* STANDARD LIST STYLE FOR SONGS/ARTISTS */
                  <>
                    <img src={item.image_url || item.cover_url} className={`w-12 h-12 object-cover ${isArtist ? 'rounded-full' : 'rounded-xl'}`} alt="" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-sm truncate">{item.title || item.name}</h4>
                      <p className="text-neutral-500 text-[10px] uppercase font-black tracking-widest">{item.type === 'song' ? item.artists?.name : item.type}</p>
                    </div>
                    <div className={`text-[8px] font-black px-2 py-1 rounded-md border ${isArtist ? 'border-cyan-500/30 text-cyan-500' : 'border-fuchsia-500/30 text-fuchsia-500'}`}>
                      {item.type.toUpperCase()}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}