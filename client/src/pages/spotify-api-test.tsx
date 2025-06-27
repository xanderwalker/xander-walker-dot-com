import { useState, useEffect } from 'react';

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
  external_urls: { spotify: string };
  popularity: number;
  explicit: boolean;
  preview_url: string | null;
  track_number: number;
  disc_number: number;
  type: string;
  uri: string;
  href: string;
  external_ids: any;
  available_markets: string[];
}

interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
  supports_volume: boolean;
}

interface SpotifyContext {
  type: string;
  href: string;
  external_urls: { spotify: string };
  uri: string;
}

interface SpotifyPlaybackState {
  device: SpotifyDevice;
  repeat_state: string;
  shuffle_state: boolean;
  context: SpotifyContext | null;
  timestamp: number;
  progress_ms: number;
  is_playing: boolean;
  item: SpotifyTrack | null;
  currently_playing_type: string;
  actions: {
    interrupting_playback?: boolean;
    pausing?: boolean;
    resuming?: boolean;
    seeking?: boolean;
    skipping_next?: boolean;
    skipping_prev?: boolean;
    toggling_repeat_context?: boolean;
    toggling_shuffle?: boolean;
    toggling_repeat_track?: boolean;
    transferring_playback?: boolean;
  };
}

export default function SpotifyApiTest() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyPlaybackState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawApiData, setRawApiData] = useState<any>(null);

  // Spotify authentication
  const connectToSpotify = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '05e9ec0109e04f81bf9f3b19d491db05';
    const redirectUri = `${window.location.origin}/projects/spotify-api-test`;
    console.log('Redirect URI being used:', redirectUri);
    const scopes = [
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-recently-played',
      'user-top-read',
      'playlist-read-private',
      'playlist-read-collaborative'
    ].join(' ');

    // Generate code challenge for PKCE
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
      authUrl.searchParams.append('scope', scopes);
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
      // Exchange code for access token
      const exchangeCodeForToken = async () => {
        const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '05e9ec0109e04f81bf9f3b19d491db05';
        const redirectUri = `${window.location.origin}/projects/spotify-api-test`;
        const codeVerifier = sessionStorage.getItem('code_verifier');

        if (!codeVerifier) {
          setError('Missing code verifier');
          return;
        }

        try {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: clientId,
              grant_type: 'authorization_code',
              code,
              redirect_uri: redirectUri,
              code_verifier: codeVerifier,
            }),
          });

          if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status}`);
          }

          const data = await response.json();
          setAccessToken(data.access_token);
          setIsConnected(true);
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Clean up session storage
          sessionStorage.removeItem('code_verifier');
        } catch (error) {
          console.error('Error exchanging code for token:', error);
          setError(error instanceof Error ? error.message : 'Failed to get access token');
        }
      };

      exchangeCodeForToken();
    }
  }, []);

  // Fetch current playback state
  const fetchCurrentTrack = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 204) {
        setCurrentTrack(null);
        setRawApiData({ message: 'No active playback found' });
        return;
      }

      if (!response.ok) {
        if (response.status === 401) {
          setError('Access token expired. Please reconnect.');
          setIsConnected(false);
          setAccessToken(null);
          return;
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      setCurrentTrack(data);
      setRawApiData(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching current track:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch track data');
    }
  };

  // Auto-refresh every 1 second when connected
  useEffect(() => {
    if (!isConnected || !accessToken) return;

    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 1000);

    return () => clearInterval(interval);
  }, [isConnected, accessToken]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  const formatProgress = (current: number, total: number) => {
    const percentage = (current / total) * 100;
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen text-white p-4" style={{ fontFamily: 'Georgia, serif' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Spotify API Test Area</h1>
        
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
          <div className="space-y-8">
            {/* Current Track Overview */}
            {currentTrack?.item && (
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">Currently Playing</h2>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Album Art */}
                  {currentTrack.item.album.images[0] && (
                    <img
                      src={currentTrack.item.album.images[0].url}
                      alt={currentTrack.item.album.name}
                      className="w-64 h-64 rounded-lg shadow-lg mx-auto md:mx-0"
                    />
                  )}
                  
                  {/* Track Info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-3xl font-bold">{currentTrack.item.name}</h3>
                      <p className="text-xl text-gray-300">
                        by {currentTrack.item.artists.map(artist => artist.name).join(', ')}
                      </p>
                      <p className="text-lg text-gray-400">
                        from "{currentTrack.item.album.name}"
                      </p>
                    </div>
                    
                    {/* Playback Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{formatTime(currentTrack.progress_ms)}</span>
                        <span>{formatTime(currentTrack.item.duration_ms)}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{
                            width: formatProgress(currentTrack.progress_ms, currentTrack.item.duration_ms)
                          }}
                        />
                      </div>
                      <p className="text-center text-gray-300">
                        Progress: {formatProgress(currentTrack.progress_ms, currentTrack.item.duration_ms)}
                      </p>
                    </div>
                    
                    {/* Playback Status */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className={`px-3 py-1 rounded-full ${currentTrack.is_playing ? 'bg-green-600' : 'bg-red-600'}`}>
                        {currentTrack.is_playing ? '▶ Playing' : '⏸ Paused'}
                      </span>
                      <span className={`px-3 py-1 rounded-full ${currentTrack.shuffle_state ? 'bg-blue-600' : 'bg-gray-600'}`}>
                        🔀 Shuffle: {currentTrack.shuffle_state ? 'On' : 'Off'}
                      </span>
                      <span className={`px-3 py-1 rounded-full ${currentTrack.repeat_state !== 'off' ? 'bg-purple-600' : 'bg-gray-600'}`}>
                        🔁 Repeat: {currentTrack.repeat_state}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Device Information */}
            {currentTrack?.device && (
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">Device Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Device Name:</strong> {currentTrack.device.name}
                  </div>
                  <div>
                    <strong>Device Type:</strong> {currentTrack.device.type}
                  </div>
                  <div>
                    <strong>Volume:</strong> {currentTrack.device.volume_percent}%
                  </div>
                  <div>
                    <strong>Active:</strong> {currentTrack.device.is_active ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Private Session:</strong> {currentTrack.device.is_private_session ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Supports Volume Control:</strong> {currentTrack.device.supports_volume ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            )}

            {/* Track Details */}
            {currentTrack?.item && (
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">Track Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Track ID:</strong> {currentTrack.item.id}
                  </div>
                  <div>
                    <strong>Popularity:</strong> {currentTrack.item.popularity}/100
                  </div>
                  <div>
                    <strong>Explicit:</strong> {currentTrack.item.explicit ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Track Number:</strong> {currentTrack.item.track_number}
                  </div>
                  <div>
                    <strong>Disc Number:</strong> {currentTrack.item.disc_number}
                  </div>
                  <div>
                    <strong>Preview Available:</strong> {currentTrack.item.preview_url ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Markets Available:</strong> {currentTrack.item.available_markets?.length || 0} countries
                  </div>
                  <div>
                    <strong>Spotify URI:</strong> <code className="text-sm bg-gray-800 px-2 py-1 rounded">{currentTrack.item.uri}</code>
                  </div>
                </div>
              </div>
            )}

            {/* Context Information */}
            {currentTrack?.context && (
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">Playback Context</h2>
                <div className="space-y-2">
                  <div>
                    <strong>Context Type:</strong> {currentTrack.context.type} (e.g., playlist, album, artist)
                  </div>
                  <div>
                    <strong>Context URI:</strong> <code className="text-sm bg-gray-800 px-2 py-1 rounded">{currentTrack.context.uri}</code>
                  </div>
                  {currentTrack.context.external_urls?.spotify && (
                    <div>
                      <strong>Spotify Link:</strong> 
                      <a 
                        href={currentTrack.context.external_urls.spotify} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 ml-2"
                      >
                        Open in Spotify
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Raw API Data */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">Raw API Response</h2>
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(rawApiData, null, 2)}
                </pre>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="text-center">
              <button
                onClick={fetchCurrentTrack}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}