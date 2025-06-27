import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Lyrics API route
  app.post('/api/lyrics', async (req, res) => {
    try {
      const { track, artist, trackId } = req.body;
      
      if (!track || !artist) {
        return res.status(400).json({ error: 'Track and artist are required' });
      }

      let syncedLyrics = null;
      
      // Try to fetch synchronized lyrics if we have a Spotify track ID
      if (trackId) {
        try {
          console.log(`Attempting to fetch synced lyrics for track ID: ${trackId}`);
          
          // Try the akashrchandran API first
          const syncResponse = await fetch(`https://spotify-lyrics-api-akashrchandran.vercel.app/?trackid=${trackId}`);
          console.log(`Sync API response status: ${syncResponse.status}`);
          
          if (syncResponse.ok) {
            const syncData = await syncResponse.json();
            console.log('Sync API response:', JSON.stringify(syncData, null, 2));
            
            if (syncData.error === false && syncData.lines) {
              syncedLyrics = syncData.lines;
              console.log(`Found ${syncedLyrics.length} synchronized lyric lines`);
            } else if (syncData.syncType === 'LINE_SYNCED' && syncData.lines) {
              syncedLyrics = syncData.lines;
              console.log(`Found ${syncedLyrics.length} synchronized lyric lines`);
            } else {
              console.log('No synchronized lyrics found or API returned error');
            }
          } else {
            console.log(`Primary sync API failed with status: ${syncResponse.status}, trying backup`);
            
            // Fallback to alternative API
            try {
              const backupResponse = await fetch(`https://lyricstify.vercel.app/api/lyrics?track=${trackId}`);
              if (backupResponse.ok) {
                const backupData = await backupResponse.json();
                console.log('Backup API response:', JSON.stringify(backupData, null, 2));
                
                if (backupData.lines) {
                  syncedLyrics = backupData.lines;
                  console.log(`Found ${syncedLyrics.length} synchronized lyric lines from backup API`);
                }
              }
            } catch (backupError) {
              console.log('Backup API also failed:', backupError);
            }
          }
        } catch (syncError) {
          console.warn('Failed to fetch synchronized lyrics:', syncError);
        }
      }

      // Try to fetch lyrics from Lyrics.ovh API (free service)
      const lyricsResponse = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`);
      
      if (lyricsResponse.ok) {
        const lyricsData = await lyricsResponse.json();
        return res.json({
          lyrics: lyricsData.lyrics || 'Lyrics not available for this track',
          source: 'Lyrics.ovh',
          syncedLyrics: syncedLyrics
        });
      }

      // Fallback: Try another lyrics API or return not found
      return res.json({
        lyrics: 'Lyrics not available for this track',
        source: 'system',
        syncedLyrics: syncedLyrics
      });
      
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      res.status(500).json({ 
        lyrics: 'Error fetching lyrics. Please try again later.',
        source: 'system'
      });
    }
  });

  // Spotify callback endpoint
  app.post('/api/spotify/callback', async (req, res) => {
    try {
      const { code } = req.body;
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      
      console.log('Spotify callback - Client ID:', clientId ? 'present' : 'missing');
      console.log('Spotify callback - Client Secret:', clientSecret ? 'present' : 'missing');
      
      if (!clientId || !clientSecret) {
        console.log('Missing credentials - clientId:', !!clientId, 'clientSecret:', !!clientSecret);
        return res.status(400).json({ error: 'Spotify credentials not configured' });
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/projects/spotify-lyrics`;
      
      console.log('Server using redirect URI:', redirectUri);
      console.log('Request headers host:', req.get('host'));
      console.log('Request protocol:', req.protocol);
      
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
        })
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        res.json({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in
        });
      } else {
        const errorData = await tokenResponse.json();
        console.error('Spotify token exchange failed:', errorData);
        res.status(400).json({ error: 'Failed to exchange code for token' });
      }
    } catch (error) {
      console.error('Spotify callback error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
