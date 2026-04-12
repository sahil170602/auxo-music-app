// src/components/HomeScreen.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ onOpenSubPage, playQueue }) {
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
    const { data } = await supabase
      .from('recently_played')
      .select('song_id, played_at, songs(*, artists(name))')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(10);
    if (data) {
      const formatted = data.map(item => item.songs);
      setRecentlyPlayed(formatted);
      localStorage.setItem('auxo_recent', JSON.stringify(formatted));
    }
  }, []);

  const fetchSections = useCallback(async () => {
    // Fetches section items along with their song details (if it's a song)
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

  useEffect(() => {
    if (heroCards.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide(p => (p + 1) % heroCards.length), 5000);
    return () => clearInterval(timer);
  }, [heroCards.length]);

  // --- SMART CLICK HANDLER ---
  const handleItemClick = (item) => {
    if (item.album_id) {
      // It's an Album -> Open Detail Page
      onOpenSubPage({ 
        type: 'album-detail', 
        album: { id: item.album_id, title: item.title, image_url: item.image_url } 
      });
    } else if (item.song_id && item.songs) {
      // It's a Song -> Play it immediately!
      playQueue([item.songs], 0);
    }
  };

  return (
    <div className="w-full flex flex-col pt-2 pb-12 animate-fade-in relative overflow-x-hidden">
      
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
              <button onClick={() => onOpenSubPage({ type: 'section', title: section.title, id: section.id })}
                className="text-fuchsia-500 text-[10px] font-black uppercase tracking-widest">See All</button>
            </div>

            {section.type === 'horizontal-cards' ? (
              <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 snap-x min-h-[160px]">
                {section.items.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleItemClick(item)}
                    className="snap-start shrink-0 flex flex-col gap-2 active:scale-95 transition-transform cursor-pointer"
                  >
                    <div className="w-36 h-36 rounded-3xl shadow-lg border border-white/10 relative overflow-hidden bg-neutral-800">
                      <img src={item.image_url} className="absolute inset-0 w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                    <p className="text-white font-bold text-xs px-1 truncate w-36">{item.title}</p>
                  </div>
                ))}
              </div>
            ) : (
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
                      <p className="text-neutral-500 text-[10px] truncate">{item.subtitle}</p>
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
                <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 shadow-2xl bg-neutral-900">
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