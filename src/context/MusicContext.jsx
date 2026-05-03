// src/components/MusicContext.jsx
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

  // 🔴 HELPER: Bulletproof Play Function
  // Handles the async nature of mobile audio and prevents "interrupted by call" crashes
  const playAudio = async () => {
    try {
      if (audioRef.current.src) {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("AUXO Playback Blocked:", err);
      setIsPlaying(false);
    }
  };

  const playSong = (songList, index) => {
    setQueue(songList);
    setCurrentIndex(index);
    setCurrentSong(songList[index]);
    // The useEffect below handles the actual .play() call
  };

  // 🔴 SYNC UI WITH HARDWARE (Handles phone calls/interruptions)
  useEffect(() => {
    const audio = audioRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    // If the OS pauses the music (e.g., for a call), update our state
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // 🔴 PLAYBACK TRIGGER
  useEffect(() => {
    if (currentSong) {
      const url = currentSong.audio_url || currentSong.song_url;
      
      if (url) {
        // Essential for mobile: Reset and load the new source
        audioRef.current.pause();
        audioRef.current.src = url;
        audioRef.current.load(); 
        
        playAudio();
      } else {
        console.error("AUXO Error: No audio URL found!");
        setIsPlaying(false);
      }
    }
  }, [currentSong]);

  // 🔴 THE "RECENTLY PLAYED" TRACKER
  useEffect(() => {
    const recordRecentPlay = async () => {
      if (!currentSong) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        await supabase.from('recently_played').delete().eq('user_id', session.user.id).eq('song_id', currentSong.id);
        await supabase.from('recently_played').insert({
          user_id: session.user.id,
          song_id: currentSong.id,
          played_at: new Date().toISOString() 
        });

        localStorage.removeItem('auxo_list_recently-played'); 
      } catch (err) { console.error("Error updating recently played:", err); }
    };
    recordRecentPlay();
  }, [currentSong]); 

  // 🔴 NAVIGATION LOGIC
  const handleNext = () => {
    if (!queue || queue.length === 0) return;

    if (isShuffle) {
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
      setCurrentIndex(0);
      setCurrentSong(queue[0]);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (!queue || queue.length === 0) return;

    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCurrentSong(queue[currentIndex - 1]);
    } else if (repeatMode === 'all') {
      setCurrentIndex(queue.length - 1);
      setCurrentSong(queue[queue.length - 1]);
    }
  };

  // 🔴 AUTO-PLAY / ENDED LOGIC
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        playAudio();
      } else {
        handleNext();
      }
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentIndex, queue, repeatMode, isShuffle]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      playAudio();
    }
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