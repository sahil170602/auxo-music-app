// src/context/MusicContext.jsx
import { createContext, useState, useContext, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase'; 

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

  // 🔴 The "Recently Played" Background Tracker
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

        // 3. Clear the cache so the Home Screen refreshes automatically
        localStorage.removeItem('auxo_list_recently-played'); 
        
      } catch (err) {
        console.error("Error updating recently played:", err);
      }
    };

    recordRecentPlay();
  }, [currentSong]); 


  // 🔴 ROBUST NEXT LOGIC (Handles Shuffle & Repeat All)
  const handleNext = () => {
    if (!queue || queue.length === 0) return;

    if (isShuffle) {
      // Pick a random index, ensuring it doesn't just play the exact same song if queue > 1
      let randomIndex = Math.floor(Math.random() * queue.length);
      if (queue.length > 1 && randomIndex === currentIndex) {
        randomIndex = (randomIndex + 1) % queue.length;
      }
      setCurrentIndex(randomIndex);
      setCurrentSong(queue[randomIndex]);
    } else if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentSong(queue[currentIndex + 1]);
    } else if (repeatMode === 'all') {
      // Loop back to the very first song
      setCurrentIndex(0);
      setCurrentSong(queue[0]);
    } else {
      setIsPlaying(false);
    }
  };

  // 🔴 ROBUST PREVIOUS LOGIC (Handles 3-second Rewind & Repeat All)
  const handlePrev = () => {
    if (!queue || queue.length === 0) return;

    // Native app feel: If playing for >3 seconds, restart song instead of skipping back
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCurrentSong(queue[currentIndex - 1]);
    } else if (repeatMode === 'all') {
      // Loop back to the very last song in the queue
      setCurrentIndex(queue.length - 1);
      setCurrentSong(queue[queue.length - 1]);
    }
  };

  // Auto-Play Next / Repeat One Logic
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
  }, [currentIndex, queue, repeatMode, isShuffle]); // Added isShuffle so it updates the listener properly

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
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
