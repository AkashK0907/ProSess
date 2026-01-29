import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface Track {
  id: string;
  name: string;
  url: string;
  category: 'noise' | 'nature' | 'lofi';
  enabled: boolean;
}

interface MusicContextType {
  isPlaying: boolean;
  currentTrack: Track | null;
  tracks: Track[];
  volume: number;
  togglePlay: () => void;
  playTrack: (trackId: string) => void;
  stop: () => void;
  toggleTrackEnabled: (trackId: string) => void;
  setVolume: (vol: number) => void;
  playNextTrack: () => void;
  previewTrack: (trackId: string) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Local audio files - stored in /public/sounds/
const DEFAULT_TRACKS: Track[] = [
  {
    id: 'rain',
    name: 'Heavy Rain',
    url: '/sounds/Heavy%20Rain.mp3', 
    category: 'nature',
    enabled: true
  },
  {
    id: 'forest',
    name: 'Forest Nature',
    url: '/sounds/Forest%20Nature.mp3',
    category: 'nature',
    enabled: true
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    url: '/sounds/Ocean%20Waves.mp3',
    category: 'nature',
    enabled: true
  },
  {
    id: 'river',
    name: 'River Stream',
    url: '/sounds/River%20Stream.mp3',
    category: 'nature',
    enabled: true
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    url: '/sounds/White%20Noise.mp3',
    category: 'noise',
    enabled: true
  },
  {
    id: 'brown-noise',
    name: 'Brown Noise',
    url: '/sounds/Brown%20Noise.mp3',
    category: 'noise',
    enabled: true
  },
  {
    id: 'thunder',
    name: 'Thunderstorm',
    url: '/sounds/Thunderstrom.mp3', // Preserving user's filename typo to ensure it works
    category: 'noise',
    enabled: true
  },
  {
    id: 'fire',
    name: 'Crackling Fire',
    url: '/sounds/Crackling%20Fire.mp3',
    category: 'nature',
    enabled: true
  }
];

export const MusicProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>(() => {
    // FORCE RESET: Clear old broken Pixabay URLs
    // Check if any track has pixabay URL and reset if so
    const saved = localStorage.getItem('focus-flow-tracks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if tracks contain old problematic URLs or HTTP text
          const hasOldUrls = parsed.some(t => 
            t.url && (
              t.url.includes('soundbible') || 
              t.url.includes('freesound') ||
              t.url.includes('pixabay') ||
              t.url.includes('archive.org') || 
              t.url.includes('actions.google.com') ||
              t.url.includes('githubusercontent') ||
              t.url === '/sounds/rain.mp3' || // Check for previous lowercase local file logic -> Trigger Reset
              t.url.startsWith('http:')
            )
          );
          if (hasOldUrls) {
            console.log('[MusicContext] Detected old URLs, resetting to new tracks...');
            localStorage.removeItem('focus-flow-tracks');
            return DEFAULT_TRACKS;
          }
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse tracks", e);
      }
    }
    return DEFAULT_TRACKS;
  });
  const [volume, setVolume] = useState(0.5);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('focus-flow-tracks', JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous"; // Fix CORS issues with CDNs
      audioRef.current.loop = true;
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      console.log(`[MusicContext] Attempting to play: ${currentTrack.name} (${currentTrack.url})`);
      
      const isSrcChanged = audioRef.current.src !== currentTrack.url;
      if (isSrcChanged) {
        audioRef.current.src = currentTrack.url;
        audioRef.current.load();
      }
      
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log(`[MusicContext] ✓ Successfully playing: ${currentTrack.name}`);
            })
            .catch(error => {
            console.error("Audio playback failed:", error);
            // Show toast only if it's not an abort error (which happens on rapid switching)
            if (error.name !== 'AbortError') {
               // Fallback: This might be a browser policy block
               // We will try to rely on the next user interaction
            }
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [isPlaying, currentTrack]);

  const togglePlay = () => {
    if (!currentTrack) {
      playNextTrack();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const playTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      // If previewing, clear timeout
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      // Ensure loop is set to true for focused playback
      if (audioRef.current) audioRef.current.loop = true;
      
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const previewTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      // Clear any existing preview timeout
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      
      // Stop current playback
      setIsPlaying(false);
      setCurrentTrack(null);
      
      // Wait a bit for previous audio to stop
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = track.url;
          audioRef.current.loop = false; // Don't loop preview
          audioRef.current.load(); // Ensure clean load
          
          const playPromise = audioRef.current.play();
          if (playPromise) {
            playPromise
              .then(() => {
                console.log(`[MusicContext] Preview playing: ${track.name}`);
                setCurrentTrack(track); // Set to show what's playing
                setIsPlaying(true); // Temporarily set to true for UI
              })
              .catch(e => console.error('Preview play failed:', e));
          }
          
          // Stop preview after 5 seconds
          previewTimeoutRef.current = setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              audioRef.current.loop = true; // Restore loop for regular playback
            }
            setIsPlaying(false);
            setCurrentTrack(null);
          }, 5000);
        }
      }, 150); // Short delay to prevent AbortError
    }
  };

  const stop = () => {
    setIsPlaying(false);
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
  };

  const playNextTrack = () => {
    const enabledTracks = tracks.filter(t => t.enabled);
    if (enabledTracks.length === 0) return;

    // Pick random track different from current
    let nextTrack = enabledTracks[Math.floor(Math.random() * enabledTracks.length)];
    if (currentTrack && enabledTracks.length > 1) {
      while (nextTrack.id === currentTrack.id) {
        nextTrack = enabledTracks[Math.floor(Math.random() * enabledTracks.length)];
      }
    }
    
    // Ensure loop is true
    if (audioRef.current) audioRef.current.loop = true;
    
    setCurrentTrack(nextTrack);
    setIsPlaying(true);
  };

  const toggleTrackEnabled = (trackId: string) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, enabled: !t.enabled } : t
    ));
  };

  return (
    <MusicContext.Provider value={{
      isPlaying,
      currentTrack,
      tracks,
      volume,
      togglePlay,
      playTrack,
      stop,
      toggleTrackEnabled,
      setVolume,
      playNextTrack,
      previewTrack
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
