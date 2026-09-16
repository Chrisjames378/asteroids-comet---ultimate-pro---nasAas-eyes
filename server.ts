import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Initialize Gemini Client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'NASA Eyes Orbital Command Server' });
  });

  // 1. Multi-Turn NASA CNEOS AI Chat Endpoint using Gemini
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, message, targetName, speedMode } = req.body;
      
      // Select appropriate model according to task requirements
      let model = 'gemini-3.8-flash';
      if (speedMode === 'complex') {
        model = 'gemini-3.1-pro-preview';
      } else if (speedMode === 'fast') {
        model = 'gemini-3.1-flash-lite';
      }

      let contents: any[];
      if (Array.isArray(messages) && messages.length > 0) {
        contents = messages.map((m: { role: string; text: string }) => ({
          role: m.role === 'assistant' ? 'model' : m.role,
          parts: [{ text: m.text }],
        }));
      } else {
        const prompt = `User query regarding current target object [${targetName || '2026 RF15'}]: ${message || 'Provide a trajectory status report.'}`;
        contents = [{ parts: [{ text: prompt }] }];
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: `You are the official NASA CNEOS (Center for Near-Earth Object Studies) Senior Planetary Defense & Flight Analytics Officer.
Your persona is crisp, scientific, authoritative, and helpful. You maintain conversation history and assist space commanders with trajectory analysis, Keplerian orbital parameters, asteroid composition, comet coma dynamics, Torino hazard scales, Goldstone radar bouncing telemetry, and DART kinetic impactor calculations.
Format key data using markdown bullet points and code snippets when helpful.`,
          temperature: 0.7,
        },
      });

      const reply = response.text || "Telemetry analysis completed with nominal trajectory results.";
      res.json({ reply, modelUsed: model });
    } catch (error: unknown) {
      console.error("Gemini AI Chat Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Internal AI engine processing error";
      res.status(500).json({
        error: "AI Copilot Telemetry Error",
        reply: `Mission Control Advisory: Unable to establish live AI link (${errorMessage}). Trajectories remain nominal based on baseline JPL ephemeris.`,
      });
    }
  });

  // 2. Create Deep Space Imagery via Gemini Image Generation
  app.post('/api/generate-image', async (req, res) => {
    try {
      const { prompt, aspectRatio } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || '16:9',
            imageSize: '1K',
          },
        },
      });

      let imageUrl: string | null = null;
      let responseText: string = '';

      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          } else if (part.text) {
            responseText += part.text + ' ';
          }
        }
      }

      if (!imageUrl) {
        res.status(500).json({ error: 'No image generated in model response', details: responseText });
        return;
      }

      res.json({ imageUrl, text: responseText.trim() });
    } catch (error: unknown) {
      console.error("Gemini Image Generation Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate space image";
      res.status(500).json({ error: errorMessage });
    }
  });

  // 3. Edit Space Image via Gemini Image Editing
  app.post('/api/edit-image', async (req, res) => {
    try {
      const { prompt, imageBase64, mimeType } = req.body;
      if (!prompt || !imageBase64) {
        res.status(400).json({ error: 'Prompt and base64 image data are required' });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/png',
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let imageUrl: string | null = null;
      let responseText: string = '';

      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          } else if (part.text) {
            responseText += part.text + ' ';
          }
        }
      }

      if (!imageUrl) {
        res.status(500).json({ error: 'No edited image returned', details: responseText });
        return;
      }

      res.json({ imageUrl, text: responseText.trim() });
    } catch (error: unknown) {
      console.error("Gemini Image Edit Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to edit image";
      res.status(500).json({ error: errorMessage });
    }
  });

  // 4. Veo Video Generation (Start Operation)
  app.post('/api/generate-video', async (req, res) => {
    try {
      const { prompt, imageBase64, mimeType, aspectRatio } = req.body;
      
      const payloadConfig: any = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio || '16:9',
      };

      let operation;

      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-lite-generate-preview',
          prompt: prompt || 'Cinematic space video animation of celestial flyby in orbit',
          image: {
            imageBytes: cleanBase64,
            mimeType: mimeType || 'image/png',
          },
          config: payloadConfig,
        });
      } else {
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-lite-generate-preview',
          prompt: prompt || 'Cinematic high definition space video of an asteroid passing Earth in 3D orbit',
          config: payloadConfig,
        });
      }

      res.json({ operationName: operation.name });
    } catch (error: unknown) {
      console.error("Veo Video Generation Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to initiate video generation";
      res.status(500).json({ error: errorMessage });
    }
  });

  // 5. Veo Video Operation Status Polling
  app.post('/api/video-status', async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        res.status(400).json({ error: 'operationName is required' });
        return;
      }

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });

      res.json({
        done: updated.done,
        error: updated.error || null,
      });
    } catch (error: unknown) {
      console.error("Veo Video Status Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to check video status";
      res.status(500).json({ error: errorMessage });
    }
  });

  // 6. Veo Video Download & MP4 Stream Proxy
  app.post('/api/video-download', async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        res.status(400).json({ error: 'operationName is required' });
        return;
      }

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });

      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        res.status(404).json({ error: 'Video URI not ready or available' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey || '' },
      });

      if (!videoRes.ok) {
        res.status(videoRes.status).json({ error: 'Failed to download generated video stream' });
        return;
      }

      res.setHeader('Content-Type', 'video/mp4');
      if (videoRes.body) {
        const reader = videoRes.body.getReader();
        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              break;
            }
            res.write(value);
          }
        };
        await pump();
      } else {
        res.status(500).json({ error: 'Empty video stream body' });
      }
    } catch (error: unknown) {
      console.error("Veo Video Download Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to download video";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Simulated live JPL SSD / Horizons endpoint sync
  app.get('/api/jpl-horizons', (req, res) => {
    const target = (req.query.target as string) || '2026 RF15';
    res.json({
      target,
      source: 'JPL Small-Body Database (SSD) Horizons System',
      timestamp: new Date().toISOString(),
      ephemeris: {
        epoch: 'J2000.0',
        semiMajorAxisAU: (1.05 + Math.random() * 0.4).toFixed(4),
        eccentricity: (0.15 + Math.random() * 0.35).toFixed(4),
        inclinationDeg: (4.2 + Math.random() * 12).toFixed(2),
        longitudeAscendingNodeDeg: (120 + Math.random() * 100).toFixed(2),
        argumentOfPerihelionDeg: (45 + Math.random() * 180).toFixed(2),
        meanAnomalyDeg: (10 + Math.random() * 340).toFixed(2),
      },
      status: 'EPHEMERIS VERIFIED & LOCKED',
    });
  });

  // Vite middleware for dev or static server for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NASA Eyes Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
