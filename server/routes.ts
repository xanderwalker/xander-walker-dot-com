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
          const syncResponse = await fetch(`https://spotify-lyric-api.herokuapp.com/?trackid=${trackId}`);
          if (syncResponse.ok) {
            const syncData = await syncResponse.json();
            if (syncData.error === false && syncData.lines) {
              syncedLyrics = syncData.lines;
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

  const httpServer = createServer(app);

  return httpServer;
}
