// src/App.jsx
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useMusic } from './context/MusicContext'; 
import SplashScreen from './components/SplashScreen';
import AuthPage from './components/AuthPage';
import MobileLayout from './components/MobileLayout';
import HomeScreen from './components/HomeScreen';
import SeeAllScreen from './components/SeeAllScreen';
import SearchScreen from './components/SearchScreen';
import LibraryScreen from './components/LibraryScreen';
import AlbumDetailScreen from './components/AlbumDetailScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [subPage, setSubPage] = useState(null);

  const { playSong } = useMusic();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) { 
        setActiveTab('home'); 
        setSubPage(null); 
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handlePopState = (e) => {
      if (subPage) setSubPage(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [subPage]);

  const openSubPage = (config) => {
    window.history.pushState({ page: 'sub' }, '');
    setSubPage(config);
  };

  const closeSubPage = () => {
    if (window.history.state?.page === 'sub') {
      window.history.back();
    } else {
      setSubPage(null);
    }
  };

  const handlePlayQueue = (songList, startIndex = 0) => {
    if (songList && songList.length > 0) {
      playSong(songList, startIndex);
    }
  };

  const tabsWithUI = ['home', 'search', 'library'];
  const showUI = tabsWithUI.includes(activeTab) && !subPage;

  if (isLoading) return <SplashScreen onFinish={() => setIsLoading(false)} />;

  const renderContent = () => {
    if (subPage) {
      if (subPage.type === 'album-detail') {
        return (
          <AlbumDetailScreen 
            album={subPage.album} 
            onBack={closeSubPage} 
            onOpenSubPage={openSubPage}
            playQueue={handlePlayQueue}
          />
        );
      }
      
      return (
        <SeeAllScreen 
          {...subPage} 
          onBack={closeSubPage} 
          playQueue={handlePlayQueue} 
          onOpenSubPage={openSubPage} 
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return <HomeScreen onOpenSubPage={openSubPage} playQueue={handlePlayQueue} />;
      case 'search':
        return <SearchScreen onOpenSubPage={openSubPage} playQueue={handlePlayQueue} />;
      case 'library':
        return <LibraryScreen onOpenSubPage={openSubPage} playQueue={handlePlayQueue} />;
      case 'profile':
        return (
          <div className="flex flex-col h-full bg-neutral-950 p-6 animate-fade-in relative">
             <button onClick={() => setActiveTab('home')} className="mt-4 p-2 w-10 h-10 bg-white/10 rounded-full text-white active:scale-90 transition-all">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
             </button>
             <div className="mt-12">
               <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Premium</h2>
               <div className="h-1 w-20 bg-gradient-to-r from-fuchsia-500 to-cyan-500 mt-2 rounded-full"></div>
               <p className="text-neutral-400 mt-6 text-sm leading-relaxed">Experience ad-free music, offline downloads, and high-fidelity spatial audio.</p>
               <button className="mt-10 w-full py-4 bg-white text-black font-black rounded-2xl active:scale-95 transition-all">UPGRADE NOW</button>
             </div>
          </div>
        );
      default:
        return <HomeScreen onOpenSubPage={openSubPage} playQueue={handlePlayQueue} />;
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />
      ) : (
        <MobileLayout 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          showUI={showUI}
        >
          {renderContent()}
        </MobileLayout>
      )}
    </>
  );
}

export default App;