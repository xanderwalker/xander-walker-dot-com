import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Lyrics API route
  app.post('/api/lyrics', async (req, res) => {
    try {
      const { track, artist } = req.body;
      
      if (!track || !artist) {
        return res.status(400).json({ error: 'Track and artist are required' });
      }

      // Try to fetch lyrics from Lyrics.ovh API (free service)
      const lyricsResponse = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`);
      
      if (lyricsResponse.ok) {
        const lyricsData = await lyricsResponse.json();
        return res.json({
          lyrics: lyricsData.lyrics || 'Lyrics not available for this track',
          source: 'Lyrics.ovh'
        });
      }

      // Fallback: Try another lyrics API or return not found
      return res.json({
        lyrics: 'Lyrics not available for this track',
        source: 'system'
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
