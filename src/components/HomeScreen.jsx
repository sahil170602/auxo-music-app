// src/components/HomeScreen.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useMusic } from '../context/MusicContext'; // 🔴 IMPORTED CONTEXT

export default function HomeScreen({ onOpenSubPage, playQueue }) {
  const { currentSong } = useMusic(); // 🔴 WE NOW WATCH THE CURRENT SONG
  const [user, setUser] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Instant UI from Cache
  const [heroCards, setHeroCards] = useState(() => 
    JSON.parse(localStorage.getItem('auxo_hero')) || []
  );
  const [sections, setSections] = useState(() => 
    JSON.parse(localStorage.getItem('auxo_sections')) || []
  );
  const [artists, setArtists] = useState(() => 
    JSON.parse(localStorage.getItem('auxo_artists')) || []
  );
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => 
    JSON.parse(localStorage.getItem('auxo_recent')) || []
  );

  const hasFetched = useRef(false);

  // --- SILENT SYNC ---
  const fetchHeroCards = useCallback(async () => {
    const { data } = await supabase.from('hero_cards').select('*').order('created_at', { ascending: false });
    if (data) {
      setHeroCards(data);
      localStorage.setItem('auxo_hero', JSON.stringify(data));
    }
  }, []);

  const fetchRecentlyPlayed = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('recently_played')
        .select('song_id, played_at, songs(*, artists(name))')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error("Error fetching recent:", error);
        return;
      }

      if (data) {
        // Filter out any nulls
        const formatted = data.map(item => item.songs).filter(Boolean);
        setRecentlyPlayed(formatted);
        localStorage.setItem('auxo_recent', JSON.stringify(formatted));
      }
    } catch (err) {
      console.error("Error fetching recently played:", err);
    }
  }, []);

  const fetchSections = useCallback(async () => {
    const { data } = await supabase
      .from('home_sections')
      .select('*, items:home_section_items(*, songs(*, artists(name)))')
      .order('sort_order', { ascending: true });
      
    if (data) {
      const sorted = data.map(s => ({
        ...s,
        items: s.items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      }));
      setSections(sorted);
      localStorage.setItem('auxo_sections', JSON.stringify(sorted));
    }
  }, []);

  const fetchArtists = useCallback(async () => {
    const { data } = await supabase.from('artists').select('*').order('name', { ascending: true });
    if (data) {
      setArtists(data);
      localStorage.setItem('auxo_artists', JSON.stringify(data));
    }
  }, []);

  // 🔴 INITIAL LOAD
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        fetchRecentlyPlayed(data.user.id);
      }
    });

    if (!hasFetched.current) {
      fetchHeroCards(); 
      fetchSections(); 
      fetchArtists();
      hasFetched.current = true;
    }
  }, [fetchHeroCards, fetchSections, fetchArtists, fetchRecentlyPlayed]);

  // 🔴 REAL-TIME UI UPDATE (Triggers when song changes)
  useEffect(() => {
    if (user && currentSong) {
      // We add a tiny 1-second delay to ensure the database has finished saving
      // the new track in MusicContext before we try to fetch the updated list here!
      const timer = setTimeout(() => {
        fetchRecentlyPlayed(user.id);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentSong, user, fetchRecentlyPlayed]);

  // Auto-slide Hero Carousel
  useEffect(() => {
    if (heroCards.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide(p => (p + 1) % heroCards.length), 5000);
    return () => clearInterval(timer);
  }, [heroCards.length]);

  // --- SMART CLICK HANDLER ---
  const handleItemClick = (item) => {
    if (item.album_id) {
      onOpenSubPage({ 
        type: 'album-detail', 
        album: { id: item.album_id, title: item.title, image_url: item.image_url } 
      });
    } else if (item.song_id && item.songs) {
      playQueue([item.songs], 0);
    }
  };

  return (
    <div className="w-full flex flex-col pt-2 pb-0 animate-fade-in relative overflow-x-hidden">
      
      {/* Hero Carousel */}
      <div className="px-6 mt-2 min-h-[208px]">
        {heroCards.length > 0 ? (
          <div className="relative w-full h-52 rounded-[2.5rem] overflow-hidden shadow-2xl bg-neutral-900 border border-white/5">
            <div className="w-full h-full flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {heroCards.map((card) => (
                <div key={card.id} className="min-w-full h-full relative flex items-end p-6">
                  <img src={card.image_url} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                  <div className="relative z-10 w-full flex justify-between items-end">
                    <div>
                      <p className="text-white/90 text-[10px] font-bold uppercase tracking-widest mb-1">{card.tag}</p>
                      <h2 className="text-2xl font-black text-white leading-tight mb-1">{card.title}</h2>
                      <p className="text-white/60 text-xs line-clamp-1">{card.subtitle}</p>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                      <svg className="w-4 h-4 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-52 rounded-[2.5rem] bg-neutral-900/50 animate-pulse border border-white/5"></div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-10">
        
        {/* 1. RECENTLY PLAYED */}
        {recentlyPlayed.length > 0 && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center px-6 mb-4">
              <h3 className="text-xl font-bold text-white tracking-tight">Recently Played</h3>
              <button onClick={() => onOpenSubPage({ type: 'recently-played', title: 'Recently Played', userId: user?.id })}
                className="text-fuchsia-500 text-[10px] font-black uppercase tracking-widest">See All</button>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 snap-x">
              {recentlyPlayed.map((song) => (
                <div key={song.id} onClick={() => playQueue([song], 0)} className="snap-start shrink-0 flex flex-col gap-2 group cursor-pointer active:scale-95 transition-transform">
                  <div className="w-32 h-32 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden bg-neutral-900">
                    <img src={song.image_url} className="absolute inset-0 w-full h-full object-cover" alt="" />
                  </div>
                  <p className="text-white font-bold text-xs truncate w-32 px-1">{song.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
{/* 2. DYNAMIC SECTIONS */}
{sections.map((section) => (
  <div key={section.id} className="animate-fade-in">
    <div className="flex justify-between items-center px-6 mb-4">
      <h3 className="text-xl font-bold text-white tracking-tight">{section.title}</h3>
      <button 
        onClick={() => onOpenSubPage({ type: 'section', title: section.title, id: section.id })}
        className="text-fuchsia-500 text-[10px] font-black uppercase tracking-widest"
      >
        See All
      </button>
    </div>

    {section.type === 'horizontal-cards' ? (
      <div className="flex overflow-x-auto no-scrollbar gap-6 px-6 snap-x pb-4">
        {section.items.map((item) => {
          const isAlbum = !!item.album_id;

          return (
            <div 
              key={item.id} 
              onClick={() => handleItemClick(item)}
              className={`snap-start shrink-0 cursor-pointer group relative overflow-hidden transition-all duration-300 active:scale-95 ${
                isAlbum 
                  ? "w-[280px] aspect-[2.8/4] rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/10" 
                  : "w-36 flex flex-col gap-2"
              }`}
            >
              {isAlbum ? (
                /* 🔴 MASSIVE ALBUM LAYOUT */
                <>
                  <img 
                    src={item.image_url} 
                    className="absolute inset-0 w-full h-full object-cover group-active:scale-105 transition-transform duration-700" 
                    alt={item.title} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent opacity-90"></div>
                  <div className="absolute bottom-0 left-0 w-full p-8">
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[9px] font-black uppercase tracking-widest mb-3 border border-white/20">
                      Album
                    </span>
                    <h3 className="text-white text-3xl font-black italic tracking-tighter mb-1 line-clamp-2 leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-fuchsia-400 text-xs font-bold uppercase tracking-widest truncate">
                      {item.subtitle || item.songs?.artists?.name}
                    </p>
                  </div>
                </>
              ) : (
                /* 🟢 STANDARD SONG LAYOUT */
                <>
                  <div className="w-36 h-36 rounded-3xl shadow-lg border border-white/10 relative overflow-hidden bg-neutral-800">
                    <img src={item.image_url} className="absolute inset-0 w-full h-full object-cover" alt={item.title} />
                    <div className="absolute inset-0 bg-black/20"></div>
                  </div>
                  <p className="text-white font-bold text-xs px-1 truncate w-36">{item.title}</p>
                </>
              )}
            </div>
          );
        })}
      </div>
    ) : (
      /* LIST VIEW REMAINS UNCHANGED */
      <div className="flex flex-col gap-3 px-6 min-h-[200px]">
        {section.items.slice(0, 5).map((item) => (
          <div 
            key={item.id} 
            onClick={() => handleItemClick(item)}
            className="w-full flex items-center gap-4 p-2 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 transition-colors cursor-pointer"
          >
            <img src={item.image_url} className="w-12 h-12 rounded-xl object-cover" alt="" />
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm truncate">{item.title}</h4>
              <p className="text-neutral-500 text-[10px] truncate">{item.subtitle || item.songs?.artists?.name}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
))}

        {/* 3. DISCOVER ARTISTS */}
        <div className="mb-6 animate-fade-in">
          <div className="flex justify-between items-center px-6 mb-4">
            <h3 className="text-xl font-bold text-white tracking-tight">Discover Artists</h3>
            <button onClick={() => onOpenSubPage({ type: 'artists', title: 'Top Artists' })}
                className="text-fuchsia-500 text-[10px] font-black uppercase tracking-widest">See All</button>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-6 px-6 min-h-[120px]">
            {artists.map((artist) => (
              <div key={artist.id} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer active:scale-90 transition-transform">
                <div className="w-30 h-30 rounded-full overflow-hidden border border-white/10 shadow-2xl bg-neutral-900">
                  <img src={artist.image_url} className="w-full h-full object-cover" alt="" />
                </div>
                <p className="text-white font-bold text-[10px] text-center w-24 truncate">{artist.name}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}