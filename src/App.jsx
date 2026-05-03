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
import PremiumScreen from './components/PremiumScreen'; 
import AIScreen from './components/AIScreen'; 
import ProfileScreen from './components/ProfileScreen'; 

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

  // UI logic: Keep UI visible for main tabs, but hide for subpages/overlays
  const tabsWithUI = ['home', 'search', 'library', 'premium', 'ai'];
  const showUI = tabsWithUI.includes(activeTab) && !subPage;

  if (isLoading) return <SplashScreen onFinish={() => setIsLoading(false)} />;

  // 🔴 1. MAIN TABS (Always stays mounted in the background so it doesn't vanish)
  const renderMainTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onOpenSubPage={openSubPage} playQueue={handlePlayQueue} />;
      case 'search':
        return <SearchScreen onOpenSubPage={openSubPage} playQueue={handlePlayQueue} />;
      case 'library':
        return <LibraryScreen onOpenSubPage={openSubPage} playQueue={handlePlayQueue} />;
      case 'premium':
        return <PremiumScreen />;
      case 'ai':
        return <AIScreen />;
      default:
        return <HomeScreen onOpenSubPage={openSubPage} playQueue={handlePlayQueue} />;
    }
  };

  // 🔴 2. SUBPAGES & OVERLAYS (Renders ON TOP of the main tab)
  const renderOverlay = () => {
    if (!subPage) return null;

    if (subPage.type === 'profile') {
      return <ProfileScreen onBack={closeSubPage} />;
    }

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
          onOpenSubPage={openSubPage}
        >
          {/* Main tab underneath */}
          {renderMainTab()}
          
          {/* Overlays on top */}
          {renderOverlay()}
        </MobileLayout>
      )}
    </>
  );
}

export default App;
