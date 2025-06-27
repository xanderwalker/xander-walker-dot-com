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

interface AudioFeatures {
  danceability: number;
  energy: number;
  valence: number;
  tempo: number;
  loudness: number;
  acousticness: number;
  speechiness: number;
  instrumentalness: number;
  liveness: number;
}

export default function AudioVisualizer() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Paint swirling background state
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [accelData, setAccelData] = useState({ x: 0, y: 0 });
  const backgroundRef = useRef<HTMLDivElement>(null);
  
  // Animation state for amoebas
  const animationRef = useRef<number>();
  const [time, setTime] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [showMinimized, setShowMinimized] = useState(false);

  // Initialize auth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleAuthCallback(code);
    } else {
      const storedToken = localStorage.getItem('spotify_access_token');
      if (storedToken) {
        console.log('Found stored Spotify token, using it');
        setAccessToken(storedToken);
        setIsConnected(true);
        setShowMinimized(true); // If already connected, show minimized
      }
    }

    // Listen for storage changes to sync tokens between tabs/pages
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'spotify_access_token' && e.newValue) {
        console.log('Spotify token updated in another tab/page');
        setAccessToken(e.newValue);
        setIsConnected(true);
        setShowMinimized(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
        setIsConnected(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show minimized button after a brief delay
        setTimeout(() => setShowMinimized(true), 2000);
      }
    } catch (err) {
      console.error('Failed to authenticate with Spotify');
    }
  };

  const loginToSpotify = () => {
    // Clear any existing token to force fresh auth
    localStorage.removeItem('spotify_access_token');
    setAccessToken(null);
    setIsConnected(false);
    setShowMinimized(false);
    
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = `${window.location.origin}/projects/audio-visualizer`;
    const scope = 'user-read-currently-playing user-read-playback-state user-top-read';
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      code_challenge_method: 'S256',
      code_challenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
      state: 'spotify-auth',
      show_dialog: 'true' // Force consent screen to show new permissions
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  };

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

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setTime(prev => prev + 0.016); // ~60fps
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Get current track and audio features
  const getCurrentTrack = async () => {
    if (!accessToken) {
      console.log('No access token available');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Making API call to get current track...');
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('Current track API response status:', response.status);

      if (response.status === 204) {
        console.log('No track currently playing (204 response)');
        setCurrentTrack(null);
        setAudioFeatures(null);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Current track data:', data);
        
        if (data.item) {
          console.log('Setting current track:', data.item.name, 'by', data.item.artists[0]?.name, 'playing:', data.is_playing);
          setCurrentTrack({
            id: data.item.id,
            name: data.item.name,
            artists: data.item.artists,
            album: data.item.album,
            duration_ms: data.item.duration_ms,
            progress_ms: data.progress_ms || 0,
            is_playing: data.is_playing
          });
          
          // Fetch audio features
          console.log('Fetching audio features for track ID:', data.item.id);
          await getAudioFeatures(data.item.id);
        } else {
          console.log('No track item in response');
        }
      } else {
        console.error('Failed to get current track:', response.status, response.statusText);
        if (response.status === 401) {
          console.log('Access token may be expired');
        }
      }
    } catch (err) {
      console.error('Failed to get current track:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAudioFeatures = async (trackId: string) => {
    if (!accessToken) return;
    
    try {
      console.log('Fetching audio features for track:', trackId);
      const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const features = await response.json();
        console.log('Audio features received:', features);
        setAudioFeatures(features);
      } else {
        console.error('Audio features API failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (err) {
      console.error('Failed to get audio features:', err);
    }
  };

  // Auto-refresh
  useEffect(() => {
    if (accessToken) {
      console.log('Starting auto-refresh with access token');
      getCurrentTrack();
      const interval = setInterval(() => {
        console.log('Auto-refreshing current track...');
        getCurrentTrack();
      }, 5000); // Every 5 seconds
      return () => clearInterval(interval);
    }
  }, [accessToken]);

  // Generate amoeba path for button
  const generateAmoebaButtonPath = (
    centerX: number, 
    centerY: number, 
    baseRadius: number, 
    intensity: number = 0.5,
    phaseOffset: number = 0
  ) => {
    const points = 8;
    const variation = intensity * 0.4 + 0.2;
    const timeOffset = time * 0.8 + phaseOffset;
    
    let path = '';
    
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const noise = Math.sin(angle * 2 + timeOffset) * variation * 0.3;
      const radius = baseRadius * (1 + noise);
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        const prevAngle = ((i - 1) / points) * Math.PI * 2;
        const prevNoise = Math.sin(prevAngle * 2 + timeOffset) * variation * 0.3;
        const prevRadius = baseRadius * (1 + prevNoise);
        const prevX = centerX + Math.cos(prevAngle) * prevRadius;
        const prevY = centerY + Math.sin(prevAngle) * prevRadius;
        
        // Smooth curves
        const cp1x = prevX + Math.cos(prevAngle + Math.PI/2) * baseRadius * 0.15;
        const cp1y = prevY + Math.sin(prevAngle + Math.PI/2) * baseRadius * 0.15;
        const cp2x = x + Math.cos(angle - Math.PI/2) * baseRadius * 0.15;
        const cp2y = y + Math.sin(angle - Math.PI/2) * baseRadius * 0.15;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
      }
    }
    
    return path + ' Z';
  };

  // Generate amoeba path based on audio features and time
  const generateAmoebaPath = (
    centerX: number, 
    centerY: number, 
    baseRadius: number, 
    audioFeature: number, 
    phaseOffset: number
  ) => {
    const points = 12;
    const variation = audioFeature * 0.6 + 0.2; // 0.2 to 0.8 variation
    const timeOffset = time * 0.5 + phaseOffset;
    
    let path = '';
    
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const noise = Math.sin(angle * 3 + timeOffset) * variation * 0.3;
      const radius = baseRadius * (1 + noise);
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        const prevAngle = ((i - 1) / points) * Math.PI * 2;
        const prevNoise = Math.sin(prevAngle * 3 + timeOffset) * variation * 0.3;
        const prevRadius = baseRadius * (1 + prevNoise);
        const prevX = centerX + Math.cos(prevAngle) * prevRadius;
        const prevY = centerY + Math.sin(prevAngle) * prevRadius;
        
        // Smooth curves
        const cp1x = prevX + Math.cos(prevAngle + Math.PI/2) * baseRadius * 0.2;
        const cp1y = prevY + Math.sin(prevAngle + Math.PI/2) * baseRadius * 0.2;
        const cp2x = x + Math.cos(angle - Math.PI/2) * baseRadius * 0.2;
        const cp2y = y + Math.sin(angle - Math.PI/2) * baseRadius * 0.2;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
      }
    }
    
    return path + ' Z';
  };

  // Monet color palette
  const getMonetColor = (intensity: number, hue: number) => {
    const colors = [
      { r: 86, g: 125, b: 188 },   // Deep blue
      { r: 123, g: 162, b: 221 },  // Light blue
      { r: 147, g: 112, b: 219 },  // Purple
      { r: 72, g: 61, b: 139 },    // Dark slate blue
      { r: 176, g: 196, b: 222 },  // Light steel blue
      { r: 135, g: 206, b: 235 },  // Sky blue
    ];
    
    const colorIndex = Math.floor(hue * colors.length);
    const color = colors[colorIndex] || colors[0];
    
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.6 + 0.2})`;
  };

  const dynamicStyle = window.innerWidth > 768 ? {
    // Desktop: mouse-based
    background: `
      radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, 
        rgba(86, 125, 188, 0.15) 0%, 
        rgba(123, 162, 221, 0.1) 25%,
        rgba(147, 112, 219, 0.08) 50%,
        rgba(72, 61, 139, 0.05) 75%,
        rgba(0, 0, 0, 0.02) 100%),
      radial-gradient(circle at ${(1 - mousePos.x) * 100}% ${(1 - mousePos.y) * 100}%, 
        rgba(176, 196, 222, 0.12) 0%,
        rgba(135, 206, 235, 0.08) 30%,
        rgba(230, 230, 250, 0.05) 60%,
        rgba(240, 248, 255, 0.02) 100%),
      linear-gradient(135deg, 
        rgba(86, 125, 188, 0.08) 0%,
        rgba(147, 112, 219, 0.06) 25%,
        rgba(72, 61, 139, 0.04) 50%,
        rgba(176, 196, 222, 0.02) 100%)
    `
  } : {
    // Mobile: accelerometer-based
    background: `
      radial-gradient(circle at ${50 + accelData.x * 30}% ${50 + accelData.y * 30}%, 
        rgba(86, 125, 188, 0.15) 0%, 
        rgba(123, 162, 221, 0.1) 25%,
        rgba(147, 112, 219, 0.08) 50%,
        rgba(72, 61, 139, 0.05) 75%,
        rgba(0, 0, 0, 0.02) 100%),
      radial-gradient(circle at ${50 - accelData.x * 25}% ${50 - accelData.y * 25}%, 
        rgba(176, 196, 222, 0.12) 0%,
        rgba(135, 206, 235, 0.08) 30%,
        rgba(230, 230, 250, 0.05) 60%,
        rgba(240, 248, 255, 0.02) 100%),
      linear-gradient(135deg, 
        rgba(86, 125, 188, 0.08) 0%,
        rgba(147, 112, 219, 0.06) 25%,
        rgba(72, 61, 139, 0.04) 50%,
        rgba(176, 196, 222, 0.02) 100%)
    `
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Monet Background */}
      <div 
        ref={backgroundRef}
        className="fixed inset-0 transition-all duration-500 ease-out"
        style={dynamicStyle}
      />
      
      {/* Minimal top navigation */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/projects">
          <button className="text-white/80 hover:text-white transition-colors font-xanman-wide bg-white/10 backdrop-blur-sm px-6 py-4 rounded-lg border border-white/20" style={{fontSize: '25px', lineHeight: '1'}}>
            ← BACK
          </button>
        </Link>
      </div>

      {/* Center Connect Button (when not connected) */}
      {!accessToken && !isConnected && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="relative">
            <svg width="800" height="400" viewBox="0 0 800 400" className="cursor-pointer" onClick={loginToSpotify}>
              <defs>
                <filter id="buttonBlur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                </filter>
                <linearGradient id="spotifyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(30, 215, 96, 0.8)" />
                  <stop offset="50%" stopColor="rgba(86, 125, 188, 0.7)" />
                  <stop offset="100%" stopColor="rgba(30, 215, 96, 0.6)" />
                </linearGradient>
              </defs>
              
              <path
                d={generateAmoebaButtonPath(400, 200, 180, 0.7, 0)}
                fill="url(#spotifyGradient)"
                filter="url(#buttonBlur)"
                className="transition-all duration-300 hover:scale-105"
                style={{
                  backdropFilter: 'blur(10px)',
                }}
              />
            </svg>
            
            {/* Button Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-white font-xanman-wide font-bold mb-2" style={{fontSize: '100px', lineHeight: '1'}}>
                  CONNECT SPOTIFY
                </div>
                <div className="text-white/80 font-xanman-wide" style={{fontSize: '70px', lineHeight: '1'}}>
                  EXPERIENCE MUSIC VISUALIZATION
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimized Button (bottom right when connected) */}
      {isConnected && showMinimized && (
        <div className="absolute bottom-6 right-6 z-20">
          <div className="relative">
            <svg width="60" height="40" viewBox="0 0 60 40" className="cursor-pointer">
              <defs>
                <filter id="miniBlur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                </filter>
              </defs>
              
              <path
                d={generateAmoebaButtonPath(30, 20, 16, 0.3, Math.PI)}
                fill="rgba(30, 215, 96, 0.6)"
                filter="url(#miniBlur)"
                className="transition-all duration-300"
                style={{
                  backdropFilter: 'blur(10px)',
                }}
              />
            </svg>
            
            {/* Mini button indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Visualizer Canvas */}
      <div className="w-full h-screen relative">
        <svg className="w-full h-full absolute inset-0" viewBox="0 0 1000 1000">
          <defs>
            {/* Blur filters for soft edges */}
            <filter id="blur1" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
            </filter>
            <filter id="blur2" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
            </filter>
            <filter id="blur3" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
            </filter>
          </defs>

          {audioFeatures && currentTrack?.is_playing ? (
            <>
              {/* Amoeba 1 - Energy */}
              <path
                d={generateAmoebaPath(300, 400, 120 + audioFeatures.energy * 80, audioFeatures.energy, 0)}
                fill={getMonetColor(audioFeatures.energy, 0.1)}
                filter="url(#blur1)"
                className="transition-all duration-1000"
                style={{
                  backdropFilter: 'blur(10px)',
                }}
              />
              
              {/* Amoeba 2 - Danceability */}
              <path
                d={generateAmoebaPath(700, 350, 100 + audioFeatures.danceability * 90, audioFeatures.danceability, Math.PI * 0.66)}
                fill={getMonetColor(audioFeatures.danceability, 0.4)}
                filter="url(#blur2)"
                className="transition-all duration-1000"
                style={{
                  backdropFilter: 'blur(10px)',
                }}
              />
              
              {/* Amoeba 3 - Valence (Mood) */}
              <path
                d={generateAmoebaPath(500, 650, 110 + audioFeatures.valence * 70, audioFeatures.valence, Math.PI * 1.33)}
                fill={getMonetColor(audioFeatures.valence, 0.7)}
                filter="url(#blur3)"
                className="transition-all duration-1000"
                style={{
                  backdropFilter: 'blur(10px)',
                }}
              />
            </>
          ) : (
            // Gentle idle animation when no music
            <>
              <path
                d={generateAmoebaPath(300, 400, 80, 0.3, 0)}
                fill="rgba(86, 125, 188, 0.3)"
                filter="url(#blur1)"
                className="transition-all duration-2000"
              />
              <path
                d={generateAmoebaPath(700, 350, 75, 0.2, Math.PI * 0.66)}
                fill="rgba(147, 112, 219, 0.25)"
                filter="url(#blur2)"
                className="transition-all duration-2000"
              />
              <path
                d={generateAmoebaPath(500, 650, 85, 0.35, Math.PI * 1.33)}
                fill="rgba(176, 196, 222, 0.2)"
                filter="url(#blur3)"
                className="transition-all duration-2000"
              />
            </>
          )}
        </svg>
      </div>

      {/* Minimal track info (bottom corner) */}
      {currentTrack && (
        <div className="absolute bottom-6 left-6 z-20 max-w-2xl">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 border border-white/20">
            <div className="text-white/90 font-xanman-wide truncate" style={{fontSize: '60px', lineHeight: '1.2'}}>
              {currentTrack.name}
            </div>
            <div className="text-white/60 font-xanman-wide truncate" style={{fontSize: '40px', lineHeight: '1.2'}}>
              {currentTrack.artists[0]?.name}
            </div>
            {/* Debug info */}
            <div className="text-white/40 font-xanman-wide text-xs mt-2">
              Playing: {currentTrack.is_playing ? 'YES' : 'NO'} | 
              Features: {audioFeatures ? 'YES' : 'NO'} |
              Energy: {audioFeatures?.energy.toFixed(2) || 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Debug panel for troubleshooting */}
      <div className="absolute top-6 right-6 z-20 max-w-sm">
        <div className="bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10 text-white/60 text-xs">
          <div>Token: {accessToken ? 'YES' : 'NO'}</div>
          <div>Connected: {isConnected ? 'YES' : 'NO'}</div>
          <div>Track: {currentTrack ? currentTrack.name : 'NONE'}</div>
          <div>Audio Features: {audioFeatures ? 'LOADED' : 'NONE'}</div>
          {audioFeatures && (
            <div className="mt-1">
              <div>Energy: {audioFeatures.energy.toFixed(2)}</div>
              <div>Dance: {audioFeatures.danceability.toFixed(2)}</div>
              <div>Mood: {audioFeatures.valence.toFixed(2)}</div>
            </div>
          )}
          {accessToken && (
            <button 
              onClick={loginToSpotify}
              className="mt-2 px-2 py-1 bg-green-600/20 hover:bg-green-600/40 rounded text-white/80 text-xs transition-colors"
            >
              Re-authenticate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}