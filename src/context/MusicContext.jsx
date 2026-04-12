// src/context/MusicContext.jsx
import { createContext, useState, useContext, useRef, useEffect } from 'react';

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

  // 🔴 THE FIX IS HERE
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
      currentIndex, queueLength: queue.length,audioRef
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);