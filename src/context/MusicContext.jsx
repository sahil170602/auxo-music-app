import { createContext, useState, useContext, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // 🔴 Don't forget this import!

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [isShuffle, setIsShuffle] = useState(false);
  
  const audioRef = useRef(new Audio());

  const playSong = (songList, index) => {
    setQueue(songList);
    setCurrentIndex(index);
    setCurrentSong(songList[index]);
    setIsPlaying(true);
  };

  // 🔴 Playback Trigger
  useEffect(() => {
    if (currentSong) {
      // Check for audio_url (our DB column name). 
      // Fallback to song_url just in case you have older test data.
      const url = currentSong.audio_url || currentSong.song_url;
      
      if (url) {
        audioRef.current.src = url;
        audioRef.current.play().catch(err => {
          console.error("Playback error:", err);
          setIsPlaying(false);
        });
      } else {
        console.error("AUXO Error: No audio URL found for this track!", currentSong);
        setIsPlaying(false);
      }
    }
  }, [currentSong]);

  // 🔴 NEW: The "Recently Played" Background Tracker
  useEffect(() => {
    const recordRecentPlay = async () => {
      if (!currentSong) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // 1. Delete the song if it's already in the history to prevent duplicates
        await supabase
          .from('recently_played')
          .delete()
          .eq('user_id', session.user.id)
          .eq('song_id', currentSong.id);

        // 2. Insert it again as the absolute most recent play
        await supabase
          .from('recently_played')
          .insert({
            user_id: session.user.id,
            song_id: currentSong.id,
            played_at: new Date().toISOString() 
          });

        // 3. Clear the cache so the Home Screen refreshes automatically!
        localStorage.removeItem('auxo_list_recently-played'); 
        
      } catch (err) {
        console.error("Error updating recently played:", err);
      }
    };

    recordRecentPlay();
  }, [currentSong]); // Triggers automatically whenever the song changes

  // Auto-Play Next / Repeat Logic
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNext();
      }
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentIndex, queue, repeatMode]);

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentSong(queue[currentIndex + 1]);
    } else if (repeatMode === 'all') {
      setCurrentIndex(0);
      setCurrentSong(queue[0]);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCurrentSong(queue[currentIndex - 1]);
    }
  };

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <MusicContext.Provider value={{ 
      currentSong, isPlaying, togglePlay, handleNext, handlePrev, 
      playSong, repeatMode, setRepeatMode, isShuffle, setIsShuffle,
      currentIndex, queueLength: queue.length, audioRef
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);
