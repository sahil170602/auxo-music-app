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
import PremiumScreen from './components/PremiumScreen'; // 🔴 IMPORTED NEW SCREEN
import AIScreen from './components/AIScreen'; // 🔴 IMPORTED NEW SCREEN

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

  // 🔴 UPDATED: Added 'premium' and 'ai' so the bottom nav stays visible on these pages!
  const tabsWithUI = ['home', 'search', 'library', 'premium', 'ai'];
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

    // 🔴 UPDATED: Routing logic now points to our beautiful new components
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
