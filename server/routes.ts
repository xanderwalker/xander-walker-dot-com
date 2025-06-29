import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertKaleidoscopeSubmissionSchema } from "@shared/schema";

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

  // Kaleidoscope submission routes
  app.post('/api/kaleidoscope-submissions', async (req, res) => {
    try {
      const validatedData = insertKaleidoscopeSubmissionSchema.parse(req.body);
      const submission = await storage.createKaleidoscopeSubmission(validatedData);
      res.json(submission);
    } catch (error) {
      console.error('Error creating kaleidoscope submission:', error);
      res.status(400).json({ error: 'Invalid submission data' });
    }
  });

  app.get('/api/kaleidoscope-submissions', async (req, res) => {
    try {
      const submissions = await storage.getAllKaleidoscopeSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching kaleidoscope submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
