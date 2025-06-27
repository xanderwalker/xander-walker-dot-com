import { Link } from 'wouter';
import { useState, useEffect } from 'react';
import Layout from '../components/layout';

interface SpotifyTrack {
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
}

export default function SpotifyLyrics() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for access token in URL after Spotify redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const token = hash.substring(1).split('&').find(elem => elem.startsWith('access_token'))?.split('=')[1];
      if (token) {
        setAccessToken(token);
        window.location.hash = '';
        localStorage.setItem('spotify_access_token', token);
      }
    } else {
      // Check if token exists in localStorage
      const savedToken = localStorage.getItem('spotify_access_token');
      if (savedToken) {
        setAccessToken(savedToken);
      }
    }
  }, []);

  // Spotify login
  const loginToSpotify = () => {
    const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    // Use current origin for development, force HTTPS for production
    const REDIRECT_URI = import.meta.env.DEV 
      ? `${window.location.origin}/projects/spotify-lyrics`
      : `https://xanderwalker.com/projects/spotify-lyrics`;
    const SCOPES = 'user-read-currently-playing user-read-playback-state';
    
    console.log('Redirect URI:', REDIRECT_URI);
    console.log('Current origin:', window.location.origin);
    
    if (!CLIENT_ID) {
      setError('Spotify Client ID not configured. Please add VITE_SPOTIFY_CLIENT_ID to environment variables.');
      return;
    }

    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=token&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(SCOPES)}`;

    window.location.href = authUrl;
  };

  // Get currently playing track
  const getCurrentTrack = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.status === 204) {
        setCurrentTrack(null);
        setError('No track currently playing');
        return;
      }

      if (response.status === 401) {
        // Token expired
        localStorage.removeItem('spotify_access_token');
        setAccessToken(null);
        setError('Spotify session expired. Please log in again.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.item) {
        setCurrentTrack(data.item);
        setError(null);
        // Fetch lyrics for this track
        await fetchLyrics(data.item.name, data.item.artists[0].name);
      } else {
        setCurrentTrack(null);
        setError('No track currently playing');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching current track');
    } finally {
      setLoading(false);
    }
  };

  // Fetch lyrics from backend
  const fetchLyrics = async (trackName: string, artistName: string) => {
    try {
      const response = await fetch('/api/lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          track: trackName,
          artist: artistName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lyrics');
      }

      const lyricsData = await response.json();
      setLyrics(lyricsData);
    } catch (err) {
      console.error('Error fetching lyrics:', err);
      setLyrics({ lyrics: 'Lyrics not available for this track', source: 'system' });
    }
  };

  // Auto-refresh current track every 30 seconds
  useEffect(() => {
    if (accessToken) {
      getCurrentTrack();
      const interval = setInterval(getCurrentTrack, 30000);
      return () => clearInterval(interval);
    }
  }, [accessToken]);

  // Logout
  const logout = () => {
    localStorage.removeItem('spotify_access_token');
    setAccessToken(null);
    setCurrentTrack(null);
    setLyrics(null);
    setError(null);
  };

  // Format duration
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Layout title="SPOTIFY LYRICS" subtitle="Real-time lyrics for your currently playing Spotify track">
      <div className="min-h-screen p-6">
        {/* Navigation */}
        <div className="mb-8 text-center">
          <Link 
            to="/projects" 
            className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl transition-all duration-300 font-serif text-lg"
            style={{fontFamily: 'Georgia, serif'}}
          >
            ← Back to Projects
          </Link>
        </div>

        {/* Main Container */}
        <div className="max-w-4xl mx-auto">
          <div className="glassmorphism rounded-2xl p-8">
            <h1 className="font-serif text-3xl mb-6 text-center" style={{fontFamily: 'Georgia, serif'}}>
              SPOTIFY LYRICS
            </h1>

            {!accessToken ? (
              /* Login Section */
              <div className="text-center">
                <div className="mb-6">
                  <div className="font-serif text-lg mb-4" style={{fontFamily: 'Georgia, serif'}}>
                    Connect to Spotify to view lyrics for your currently playing track
                  </div>
                  <button
                    onClick={loginToSpotify}
                    className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-serif text-lg"
                    style={{fontFamily: 'Georgia, serif'}}
                  >
                    Connect to Spotify
                  </button>
                </div>
                
                {error && (
                  <div className="text-red-500 font-serif text-sm" style={{fontFamily: 'Georgia, serif'}}>
                    {error}
                  </div>
                )}
              </div>
            ) : (
              /* Connected Section */
              <div>
                {/* Connection Status */}
                <div className="text-center mb-6">
                  <div className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg font-serif text-sm" style={{fontFamily: 'Georgia, serif'}}>
                    Connected to Spotify
                  </div>
                  <button
                    onClick={logout}
                    className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-serif text-sm"
                    style={{fontFamily: 'Georgia, serif'}}
                  >
                    Disconnect
                  </button>
                </div>

                {/* Refresh Button */}
                <div className="text-center mb-6">
                  <button
                    onClick={getCurrentTrack}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-serif"
                    style={{fontFamily: 'Georgia, serif'}}
                  >
                    {loading ? 'Loading...' : 'Refresh Now Playing'}
                  </button>
                </div>

                {/* Current Track Display */}
                {currentTrack && (
                  <div className="mb-8">
                    <div className="bg-white/10 rounded-2xl p-6">
                      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                        {/* Album Art */}
                        {currentTrack.album.images[0] && (
                          <img
                            src={currentTrack.album.images[0].url}
                            alt={currentTrack.album.name}
                            className="w-32 h-32 rounded-lg shadow-lg"
                          />
                        )}
                        
                        {/* Track Info */}
                        <div className="flex-1 text-center md:text-left">
                          <h2 className="font-serif text-2xl mb-2" style={{fontFamily: 'Georgia, serif'}}>
                            {currentTrack.name}
                          </h2>
                          <p className="font-serif text-lg text-gray-600 mb-2" style={{fontFamily: 'Georgia, serif'}}>
                            {currentTrack.artists.map(artist => artist.name).join(', ')}
                          </p>
                          <p className="font-serif text-sm text-gray-500 mb-2" style={{fontFamily: 'Georgia, serif'}}>
                            {currentTrack.album.name}
                          </p>
                          <div className="font-serif text-sm" style={{fontFamily: 'Georgia, serif'}}>
                            {formatDuration(currentTrack.progress_ms)} / {formatDuration(currentTrack.duration_ms)}
                            {currentTrack.is_playing ? ' • Playing' : ' • Paused'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lyrics Display */}
                {lyrics && (
                  <div className="bg-white/10 rounded-2xl p-6">
                    <h3 className="font-serif text-xl mb-4 text-center" style={{fontFamily: 'Georgia, serif'}}>
                      LYRICS
                    </h3>
                    <div className="bg-white/5 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="font-serif text-sm whitespace-pre-wrap leading-relaxed" style={{fontFamily: 'Georgia, serif'}}>
                        {lyrics.lyrics}
                      </pre>
                    </div>
                    <div className="text-center mt-4 text-xs text-gray-500 font-serif" style={{fontFamily: 'Georgia, serif'}}>
                      Lyrics provided by {lyrics.source}
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="text-center text-red-500 font-serif" style={{fontFamily: 'Georgia, serif'}}>
                    {error}
                  </div>
                )}

                {/* No Track Playing */}
                {!currentTrack && !loading && !error && (
                  <div className="text-center text-gray-500 font-serif" style={{fontFamily: 'Georgia, serif'}}>
                    No track currently playing. Start playing music on Spotify and refresh.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}