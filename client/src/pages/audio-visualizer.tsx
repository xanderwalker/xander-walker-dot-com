import { useState, useEffect, useRef } from 'react';

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
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  duration_ms: number;
  time_signature: number;
}

interface Beat {
  start: number;
  duration: number;
  confidence: number;
}

interface Segment {
  start: number;
  duration: number;
  confidence: number;
  loudness_start: number;
  loudness_max: number;
  loudness_max_time: number;
  loudness_end: number;
  pitches: number[];
  timbre: number[];
}

interface AudioAnalysis {
  beats: Beat[];
  segments: Segment[];
  bars: Beat[];
  sections: any[];
  tatums: Beat[];
}

interface VisualizerParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  energy: number;
  age: number;
}

export default function AudioVisualizer() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(null);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [currentSegment, setCurrentSegment] = useState<Segment | null>(null);
  const [particles, setParticles] = useState<VisualizerParticle[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const progressRef = useRef<number>(0);

  // Spotify authentication (same as API test page)
  const connectToSpotify = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '05e9ec0109e04f81bf9f3b19d491db05';
    const redirectUri = `${window.location.origin}/projects/audio-visualizer`;

    const generateRandomString = (length: number) => {
      let text = '';
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    };

    const codeVerifier = generateRandomString(128);
    sessionStorage.setItem('code_verifier', codeVerifier);

    const sha256 = async (plain: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(plain);
      return window.crypto.subtle.digest('SHA-256', data);
    };

    const base64encode = (input: ArrayBuffer) => {
      const bytes = new Uint8Array(input);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    sha256(codeVerifier).then(hashed => {
      const codeChallenge = base64encode(hashed);
      
      const authUrl = new URL('https://accounts.spotify.com/authorize');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('scope', 'user-read-currently-playing user-read-playback-state');
      authUrl.searchParams.append('code_challenge_method', 'S256');
      authUrl.searchParams.append('code_challenge', codeChallenge);
      
      window.location.href = authUrl.toString();
    });
  };

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      setError(`Spotify authorization error: ${error}`);
      return;
    }

    if (code) {
      const exchangeCodeForToken = async () => {
        const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '05e9ec0109e04f81bf9f3b19d491db05';
        const redirectUri = `${window.location.origin}/projects/audio-visualizer`;
        const codeVerifier = sessionStorage.getItem('code_verifier');

        if (!codeVerifier) {
          setError('Missing code verifier');
          return;
        }

        try {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId,
              grant_type: 'authorization_code',
              code,
              redirect_uri: redirectUri,
              code_verifier: codeVerifier,
            }),
          });

          const data = await response.json();
          setAccessToken(data.access_token);
          setIsConnected(true);
          
          window.history.replaceState({}, document.title, window.location.pathname);
          sessionStorage.removeItem('code_verifier');
        } catch (error) {
          setError('Failed to get access token');
        }
      };

      exchangeCodeForToken();
    }
  }, []);

  // Fetch current playback and audio analysis
  const fetchSpotifyData = async () => {
    if (!accessToken) return;

    try {
      // Get current playback
      const playbackResponse = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (playbackResponse.status === 204) {
        setCurrentTrack(null);
        return;
      }

      const playbackData = await playbackResponse.json();
      const track = playbackData.item;
      
      if (!track) return;
      
      setCurrentTrack({
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: track.album,
        duration_ms: track.duration_ms,
        progress_ms: playbackData.progress_ms,
        is_playing: playbackData.is_playing
      });

      progressRef.current = playbackData.progress_ms;

      // Fetch audio features if we don't have them or track changed
      if (!audioFeatures || audioFeatures.duration_ms !== track.duration_ms) {
        const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features/${track.id}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const features = await featuresResponse.json();
        setAudioFeatures(features);
      }

      // Fetch audio analysis if we don't have it or track changed
      if (!audioAnalysis || currentTrack?.id !== track.id) {
        const analysisResponse = await fetch(`https://api.spotify.com/v1/audio-analysis/${track.id}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const analysis = await analysisResponse.json();
        setAudioAnalysis(analysis);
      }

    } catch (error) {
      console.error('Error fetching Spotify data:', error);
    }
  };

  // Update current beat and segment based on progress
  useEffect(() => {
    if (!audioAnalysis || !currentTrack?.is_playing) return;

    const currentTime = progressRef.current / 1000; // Convert to seconds

    // Find current beat
    const beat = audioAnalysis.beats.find((beat, index) => {
      const nextBeat = audioAnalysis.beats[index + 1];
      return beat.start <= currentTime && (!nextBeat || currentTime < nextBeat.start);
    });
    setCurrentBeat(beat || null);

    // Find current segment
    const segment = audioAnalysis.segments.find((segment, index) => {
      const nextSegment = audioAnalysis.segments[index + 1];
      return segment.start <= currentTime && (!nextSegment || currentTime < nextSegment.start);
    });
    setCurrentSegment(segment || null);

  }, [audioAnalysis, currentTrack?.progress_ms]);

  // Create particles on beat
  useEffect(() => {
    if (!currentBeat || !audioFeatures || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const energy = audioFeatures.energy;
    const valence = audioFeatures.valence;
    const danceability = audioFeatures.danceability;

    // Create new particles on each beat
    const newParticles: VisualizerParticle[] = Array.from({ length: Math.floor(energy * 20) }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * danceability * 10,
      vy: (Math.random() - 0.5) * danceability * 10,
      size: Math.random() * energy * 20 + 5,
      color: `hsl(${valence * 360}, 70%, ${50 + energy * 30}%)`,
      energy: energy,
      age: 0
    }));

    setParticles(prev => [...prev.slice(-50), ...newParticles]); // Keep max 50 + new particles

  }, [currentBeat, audioFeatures]);

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || !currentTrack?.is_playing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      setParticles(prev => prev.map(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.age += 1;
        particle.size *= 0.99; // Shrink over time

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -0.8;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -0.8;

        // Draw particle
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - particle.age / 100);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return particle;
      }).filter(p => p.age < 100 && p.size > 1)); // Remove old/small particles

      // Draw frequency bars based on current segment
      if (currentSegment && audioFeatures) {
        const barCount = 32;
        const barWidth = canvas.width / barCount;
        
        currentSegment.pitches.forEach((pitch, index) => {
          if (index >= barCount) return;
          
          const height = pitch * canvas.height * 0.5 * audioFeatures.energy;
          const hue = (index / barCount) * 360;
          
          ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
          ctx.fillRect(
            index * barWidth, 
            canvas.height - height, 
            barWidth - 2, 
            height
          );
        });
      }

      // Update progress for next frame
      if (currentTrack?.is_playing) {
        progressRef.current += 16; // Approximate 60fps
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentTrack?.is_playing, currentSegment, audioFeatures]);

  // Auto-refresh Spotify data
  useEffect(() => {
    if (!isConnected || !accessToken) return;

    fetchSpotifyData();
    const interval = setInterval(fetchSpotifyData, 1000);

    return () => clearInterval(interval);
  }, [isConnected, accessToken]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Canvas for visualizations */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460)' }}
      />

      {/* UI Overlay */}
      <div className="relative z-10 p-6">
        <h1 className="text-4xl font-bold text-center mb-8">Audio Visualizer</h1>
        
        {!isConnected ? (
          <div className="text-center">
            <button
              onClick={connectToSpotify}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition-colors"
            >
              Connect to Spotify
            </button>
            {error && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
                <p className="text-red-200">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Current Track Info */}
            {currentTrack && (
              <div className="fixed top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 max-w-sm">
                <div className="flex gap-3">
                  {currentTrack.album.images[0] && (
                    <img
                      src={currentTrack.album.images[0].url}
                      alt={currentTrack.album.name}
                      className="w-16 h-16 rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{currentTrack.name}</h3>
                    <p className="text-gray-300">{currentTrack.artists.map(a => a.name).join(', ')}</p>
                    <p className="text-sm text-gray-400">{currentTrack.album.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Audio Analysis Info */}
            {audioFeatures && (
              <div className="fixed top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 max-w-sm">
                <h3 className="font-bold mb-2">Audio Features</h3>
                <div className="text-sm space-y-1">
                  <div>Tempo: {Math.round(audioFeatures.tempo)} BPM</div>
                  <div>Energy: {Math.round(audioFeatures.energy * 100)}%</div>
                  <div>Danceability: {Math.round(audioFeatures.danceability * 100)}%</div>
                  <div>Valence: {Math.round(audioFeatures.valence * 100)}%</div>
                  <div>Loudness: {audioFeatures.loudness.toFixed(1)} dB</div>
                </div>
              </div>
            )}

            {/* Beat Indicator */}
            {currentBeat && (
              <div className="fixed bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-4">
                <div className="text-sm">
                  <div>Current Beat: {currentBeat.start.toFixed(2)}s</div>
                  <div>Confidence: {Math.round(currentBeat.confidence * 100)}%</div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="fixed bottom-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 max-w-sm">
              <h3 className="font-bold mb-2">Visualizer Info</h3>
              <div className="text-sm text-gray-300">
                <p>• Particles pulse with beats</p>
                <p>• Colors reflect song mood</p>
                <p>• Bars show pitch frequencies</p>
                <p>• Size varies with energy</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}