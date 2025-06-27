import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  progress_ms: number;
  is_playing: boolean;
}

interface LyricsData {
  lyrics: string;
  source: string;
  syncedLyrics?: SyncedLyric[];
}

interface SyncedLyric {
  startTimeMs: string;
  words: string;
  endTimeMs?: string;
}

export default function SpotifyLyrics() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);

  // Paint swirling background state
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [accelData, setAccelData] = useState({ x: 0, y: 0 });
  const backgroundRef = useRef<HTMLDivElement>(null);

  // Initialize Spotify auth on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const returnTo = urlParams.get('return');
    
    if (code) {
      handleAuthCallback(code).then(() => {
        // If there's a return parameter, redirect after successful auth
        if (returnTo === 'audio-visualizer') {
          setTimeout(() => {
            window.location.href = '/projects/audio-visualizer';
          }, 1000);
        }
      });
    } else {
      const storedToken = localStorage.getItem('spotify_access_token');
      if (storedToken) {
        setAccessToken(storedToken);
        // If user already has token and there's a return parameter, redirect immediately
        if (returnTo === 'audio-visualizer') {
          window.location.href = '/projects/audio-visualizer';
        }
      }
    }
  }, []);

  // Paint swirling effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth > 768) {
        setMousePos({
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight
        });
      }
    };

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (window.innerWidth <= 768) {
        const acceleration = event.accelerationIncludingGravity;
        if (acceleration) {
          setAccelData({
            x: Math.max(-1, Math.min(1, (acceleration.x || 0) / 10)),
            y: Math.max(-1, Math.min(1, (acceleration.y || 0) / 10))
          });
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('devicemotion', handleDeviceMotion);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, []);

  // Real-time position tracking
  useEffect(() => {
    if (currentTrack?.is_playing) {
      const timer = setInterval(() => {
        setCurrentPosition(prev => prev + 1000);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentTrack?.is_playing]);

  // Spotify auth functions
  const handleAuthCallback = async (code: string) => {
    try {
      const response = await fetch('/api/spotify/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.access_token);
        localStorage.setItem('spotify_access_token', data.access_token);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) {
      setError('Failed to authenticate with Spotify');
    }
  };

  const loginToSpotify = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = `${window.location.origin}/projects/spotify-lyrics`;
    const scope = 'user-read-currently-playing user-read-playback-state';
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      code_challenge_method: 'S256',
      code_challenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
      state: 'spotify-auth'
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  };

  const getCurrentTrack = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.status === 204) {
        setCurrentTrack(null);
        setLyrics(null);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.item) {
          setCurrentTrack({
            id: data.item.id,
            name: data.item.name,
            artists: data.item.artists,
            album: data.item.album,
            duration_ms: data.item.duration_ms,
            progress_ms: data.progress_ms || 0,
            is_playing: data.is_playing
          });
          setCurrentPosition(data.progress_ms || 0);
          
          // Auto-fetch lyrics for new track
          if (!lyrics || lyrics.source !== data.item.id) {
            fetchLyrics(data.item.name, data.item.artists[0].name, data.item.id);
          }
        }
      }
    } catch (err) {
      setError('Failed to get current track');
    } finally {
      setLoading(false);
    }
  };

  const fetchLyrics = async (trackName?: string, artistName?: string, trackId?: string) => {
    const songName = trackName || currentTrack?.name;
    const artist = artistName || currentTrack?.artists[0]?.name;
    const spotifyId = trackId || currentTrack?.id;
    
    if (!songName || !artist) return;
    
    setLyricsLoading(true);
    try {
      const response = await fetch('/api/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          track: songName, 
          artist: artist,
          trackId: spotifyId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLyrics(data);
      }
    } catch (err) {
      setError('Failed to fetch lyrics');
    } finally {
      setLyricsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('spotify_access_token');
    setAccessToken(null);
    setCurrentTrack(null);
    setLyrics(null);
    setError(null);
  };

  // Create basic synchronized lyrics from static lyrics
  const createBasicSync = (lyricsText: string, duration: number) => {
    const lines = lyricsText.split('\n').filter(line => line.trim());
    const timePerLine = duration / lines.length;
    
    return lines.map((line, index) => ({
      startTimeMs: (index * timePerLine).toString(),
      words: line.trim(),
      endTimeMs: ((index + 1) * timePerLine).toString()
    }));
  };

  // Find current lyric line based on position
  const getCurrentLyricIndex = () => {
    if (!lyrics) return -1;
    
    // Use synchronized lyrics if available
    if (lyrics.syncedLyrics) {
      for (let i = 0; i < lyrics.syncedLyrics.length; i++) {
        const currentLine = lyrics.syncedLyrics[i];
        const nextLine = lyrics.syncedLyrics[i + 1];
        
        const currentTime = parseInt(currentLine.startTimeMs);
        const nextTime = nextLine ? parseInt(nextLine.startTimeMs) : Infinity;
        
        if (currentPosition >= currentTime && currentPosition < nextTime) {
          return i;
        }
      }
    } else if (currentTrack) {
      // Create basic sync from static lyrics
      const basicSync = createBasicSync(lyrics.lyrics, currentTrack.duration_ms);
      
      for (let i = 0; i < basicSync.length; i++) {
        const currentLine = basicSync[i];
        const nextLine = basicSync[i + 1];
        
        const currentTime = parseInt(currentLine.startTimeMs);
        const nextTime = nextLine ? parseInt(nextLine.startTimeMs) : Infinity;
        
        if (currentPosition >= currentTime && currentPosition < nextTime) {
          return i;
        }
      }
    }
    
    return -1;
  };

  // Auto-refresh current track
  useEffect(() => {
    if (accessToken) {
      getCurrentTrack();
      const interval = setInterval(getCurrentTrack, 30000);
      return () => clearInterval(interval);
    }
  }, [accessToken]);

  const dynamicStyle = window.innerWidth > 768 ? {
    // Desktop: mouse-based
    background: `
      radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, 
        rgba(91, 134, 229, 0.3) 0%, 
        rgba(147, 112, 219, 0.2) 25%,
        rgba(72, 61, 139, 0.15) 50%,
        rgba(25, 25, 112, 0.1) 75%,
        rgba(0, 0, 0, 0.05) 100%),
      radial-gradient(circle at ${(1 - mousePos.x) * 100}% ${(1 - mousePos.y) * 100}%, 
        rgba(255, 248, 220, 0.2) 0%,
        rgba(245, 245, 220, 0.15) 30%,
        rgba(230, 230, 250, 0.1) 60%,
        rgba(240, 248, 255, 0.05) 100%),
      linear-gradient(135deg, 
        rgba(123, 104, 238, 0.1) 0%,
        rgba(147, 112, 219, 0.08) 25%,
        rgba(72, 61, 139, 0.06) 50%,
        rgba(25, 25, 112, 0.04) 100%)
    `
  } : {
    // Mobile: accelerometer-based
    background: `
      radial-gradient(circle at ${50 + accelData.x * 30}% ${50 + accelData.y * 30}%, 
        rgba(91, 134, 229, 0.3) 0%, 
        rgba(147, 112, 219, 0.2) 25%,
        rgba(72, 61, 139, 0.15) 50%,
        rgba(25, 25, 112, 0.1) 75%,
        rgba(0, 0, 0, 0.05) 100%),
      radial-gradient(circle at ${50 - accelData.x * 25}% ${50 - accelData.y * 25}%, 
        rgba(255, 248, 220, 0.2) 0%,
        rgba(245, 245, 220, 0.15) 30%,
        rgba(230, 230, 250, 0.1) 60%,
        rgba(240, 248, 255, 0.05) 100%),
      linear-gradient(135deg, 
        rgba(123, 104, 238, 0.1) 0%,
        rgba(147, 112, 219, 0.08) 25%,
        rgba(72, 61, 139, 0.06) 50%,
        rgba(25, 25, 112, 0.04) 100%)
    `
  };

  return (
    <div className="min-h-screen relative">
      {/* Dynamic Monet Background */}
      <div 
        ref={backgroundRef}
        className="fixed inset-0 transition-all duration-300 ease-out"
        style={dynamicStyle}
      />
      
      {/* Connection Status - Top of screen when not connected */}
      {!accessToken && (
        <div className="flex items-center justify-center min-h-screen px-8 relative z-10">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20 max-w-2xl">
            <h2 className="font-serif text-6xl font-bold text-white mb-8" style={{fontFamily: 'Georgia, serif'}}>
              SPOTIFY LYRICS
            </h2>
            <p className="font-serif text-2xl text-gray-300 mb-12" style={{fontFamily: 'Georgia, serif'}}>
              Connect to see real-time lyrics for distance reading
            </p>
            <button
              onClick={loginToSpotify}
              className="font-serif bg-green-600 hover:bg-green-700 text-white px-12 py-6 rounded-lg text-3xl transition-colors duration-200 font-bold"
              style={{fontFamily: 'Georgia, serif'}}
            >
              Connect to Spotify
            </button>
            
            <div className="mt-8">
              <Link href="/projects">
                <button className="text-white hover:text-gray-200 transition-colors text-lg font-serif bg-black/30 px-6 py-3 rounded-lg border border-white/20" style={{fontFamily: 'Georgia, serif'}}>
                  ← Back to Projects
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Connected State - Full screen lyrics layout */}
      {accessToken && (
        <div className="min-h-screen flex flex-col relative z-10">
          
          {/* Top Controls Bar */}
          <div className="flex justify-between items-center p-6 bg-black/20 backdrop-blur-sm">
            <Link href="/projects">
              <button className="text-white hover:text-gray-200 transition-colors text-lg font-serif bg-black/30 px-4 py-2 rounded-lg border border-white/20" style={{fontFamily: 'Georgia, serif'}}>
                ← BACK
              </button>
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <button
                onClick={getCurrentTrack}
                disabled={loading}
                className="font-serif bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                style={{fontFamily: 'Georgia, serif'}}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={logout}
                className="font-serif bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                style={{fontFamily: 'Georgia, serif'}}
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Main Lyrics Area */}
          <div className="flex-1 flex flex-col px-8 py-4">
            
            {/* Error Messages */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="font-serif text-red-200 text-xl" style={{fontFamily: 'Georgia, serif'}}>
                  {error}
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-8"></div>
                  <p className="font-serif text-white text-3xl" style={{fontFamily: 'Georgia, serif'}}>Loading...</p>
                </div>
              </div>
            )}

            {/* No Track Playing */}
            {!currentTrack && !loading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="font-serif text-6xl mb-8 text-white" style={{fontFamily: 'Georgia, serif'}}>
                    No Track Playing
                  </h3>
                  <p className="font-serif text-3xl text-gray-300" style={{fontFamily: 'Georgia, serif'}}>
                    Start playing a song on Spotify
                  </p>
                </div>
              </div>
            )}

            {/* Lyrics Display - Full Screen */}
            {currentTrack && (
              <div className="flex-1 flex flex-col">
                
                {/* Fetch Lyrics Button (if no lyrics) */}
                {!lyrics && (
                  <div className="text-center mb-8">
                    <button
                      onClick={() => fetchLyrics()}
                      disabled={lyricsLoading}
                      className="font-serif bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-12 py-6 rounded-lg text-3xl transition-colors duration-200 font-bold"
                      style={{fontFamily: 'Georgia, serif'}}
                    >
                      {lyricsLoading ? 'Fetching Lyrics...' : 'Get Lyrics'}
                    </button>
                  </div>
                )}

                {/* Full Width Lyrics */}
                {lyrics && (
                  <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-2xl p-8 mb-4">
                    <div className="h-full overflow-y-auto">
                      {(lyrics.syncedLyrics || (currentTrack?.is_playing && lyrics.lyrics)) ? (
                        // Large synchronized lyrics with sliding window effect
                        <div className="font-serif leading-relaxed space-y-4 text-center" style={{fontFamily: 'Georgia, serif'}}>
                          {(() => {
                            const allLines = lyrics.syncedLyrics || createBasicSync(lyrics.lyrics, currentTrack?.duration_ms || 0);
                            const currentIndex = getCurrentLyricIndex();
                            
                            // Show 10 lines centered around current line
                            const startIndex = Math.max(0, currentIndex - 4);
                            const endIndex = Math.min(allLines.length, startIndex + 10);
                            const visibleLines = allLines.slice(startIndex, endIndex);
                            
                            return visibleLines.map((line, relativeIndex) => {
                              const actualIndex = startIndex + relativeIndex;
                              const isCurrentLine = actualIndex === currentIndex;
                              const distanceFromCenter = Math.abs(relativeIndex - 4); // Distance from center (index 4)
                              
                              // Size mapping: center=6, +/-1=5, +/-2=4, +/-3=3, +/-4=2
                              const sizeMap = {
                                0: 'text-6xl md:text-8xl', // Center line (largest)
                                1: 'text-5xl md:text-7xl', // Adjacent lines
                                2: 'text-4xl md:text-6xl', // 2 lines away
                                3: 'text-3xl md:text-5xl', // 3 lines away
                                4: 'text-2xl md:text-4xl'  // Edge lines (smallest)
                              };
                              
                              const fontSize = sizeMap[Math.min(distanceFromCenter, 4)] || 'text-xl md:text-3xl';
                              
                              return (
                                <div
                                  key={actualIndex}
                                  className={`transition-all duration-500 ${fontSize} ${
                                    isCurrentLine 
                                      ? 'text-white font-bold scale-105' 
                                      : 'text-gray-400'
                                  }`}
                                  style={{
                                    transform: isCurrentLine ? 'translateY(-10px)' : 'translateY(0)',
                                    opacity: distanceFromCenter === 4 ? 0.6 : 1, // Fade edge lines slightly
                                  }}
                                >
                                  {line.words}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : (
                        // Large static lyrics
                        <div className="font-serif text-2xl md:text-4xl whitespace-pre-wrap leading-relaxed text-center text-white" style={{fontFamily: 'Georgia, serif'}}>
                          {lyrics.lyrics}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Album Info Bar */}
          {currentTrack && (
            <div className="bg-black/30 backdrop-blur-sm p-6 border-t border-white/20">
              <div className="flex items-center justify-between max-w-6xl mx-auto">
                <div className="flex items-center space-x-6">
                  <img 
                    src={currentTrack.album.images[0]?.url} 
                    alt={currentTrack.album.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-white" style={{fontFamily: 'Georgia, serif'}}>
                      {currentTrack.name}
                    </h3>
                    <p className="font-serif text-xl text-gray-300" style={{fontFamily: 'Georgia, serif'}}>
                      {currentTrack.artists.map(artist => artist.name).join(', ')}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${currentTrack.is_playing ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                    <p className="font-serif text-lg text-gray-300" style={{fontFamily: 'Georgia, serif'}}>
                      {currentTrack.is_playing ? 'Playing' : 'Paused'}
                    </p>
                  </div>
                  {currentTrack.is_playing && (
                    <p className="font-serif text-sm text-gray-400" style={{fontFamily: 'Georgia, serif'}}>
                      {Math.floor(currentPosition / 1000)}s / {Math.floor((currentTrack?.duration_ms || 0) / 1000)}s
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}