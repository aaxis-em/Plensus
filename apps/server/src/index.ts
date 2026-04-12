// apps/server/src/index.ts

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import os from "os";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  YouTubeSearchResult,
} from "@shared/types";
import { RoomManager } from "./managers/RoomManager";
import { registerConnectionHandler } from "./handlers/connection.handler";
import { env } from "./config/env";

const app = express();

// ✅ CORS: Allow all origins in development
app.use(
  cors({
    origin: env.NODE_ENV === "production" ? env.CLIENT_URL : true,
    credentials: true,
  }),
);

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: env.NODE_ENV === "production" ? env.CLIENT_URL : "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize room manager (singleton)
const roomManager = new RoomManager();

// Register socket handlers
registerConnectionHandler(io, roomManager);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    rooms: roomManager.getRoomCount(),
    connections: io.engine.clientsCount,
  });
});

// YouTube search endpoint
app.get("/youtube/search", async (req, res) => {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({ message: "Query parameter q is required" });
    }

    if (!env.YOUTUBE_API_KEY) {
      console.warn("YouTube API search requested but YOUTUBE_API_KEY is missing");
      return res.status(500).json({ message: "Server is missing YouTube API key" });
    }

    // 1. Search for videos
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.append("part", "snippet");
    searchUrl.searchParams.append("maxResults", "10");
    searchUrl.searchParams.append("q", query);
    searchUrl.searchParams.append("type", "video");
    // Only return embeddable videos to prevent 'Video Unavailable' issues
    searchUrl.searchParams.append("videoEmbeddable", "true");
    // Optionally focus on music
    searchUrl.searchParams.append("videoCategoryId", "10");
    searchUrl.searchParams.append("key", env.YOUTUBE_API_KEY);

    const searchResponse = await fetch(searchUrl.toString());
    const searchData: any = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error("YouTube Search API Error:", searchData.error);
      return res.status(502).json({ message: "Failed to fetch from YouTube API" });
    }

    if (!searchData.items || searchData.items.length === 0) {
      return res.json({ results: [] });
    }

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(",");

    // 2. Get video details for duration
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.append("part", "snippet,contentDetails");
    videosUrl.searchParams.append("id", videoIds);
    videosUrl.searchParams.append("key", env.YOUTUBE_API_KEY);

    const videosResponse = await fetch(videosUrl.toString());
    const videosData: any = await videosResponse.json();

    if (!videosResponse.ok) {
      console.error("YouTube Video API Error:", videosData.error);
      return res.status(502).json({ message: "Failed to fetch from YouTube API" });
    }

    const results: YouTubeSearchResult[] = videosData.items.map((item: any) => {
      // Parse ISO 8601 duration (e.g., PT1H2M10S, PT4M13S)
      const duration = item.contentDetails?.duration || "PT0S";
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      
      const hours = parseInt(match?.[1] || "0", 10);
      const minutes = parseInt(match?.[2] || "0", 10);
      const seconds = parseInt(match?.[3] || "0", 10);
      const durationSeconds = (hours * 3600) + (minutes * 60) + seconds;

      // Decode HTML entities in title
      const title = item.snippet?.title || "Unknown Title";

      return {
        id: item.id,
        title,
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
        duration: durationSeconds,
      };
    });

    res.json({ results });
  } catch (error) {
    console.error("YouTube proxy error:", error);
    res.status(500).json({ message: "Internal server error during search" });
  }
});

const PORT = Number(env.PORT || 3001);
const HOST = "0.0.0.0"; // ✅ Listen on all network interfaces

httpServer
  .listen(PORT, HOST, () => {
    const networkInterfaces = os.networkInterfaces();
    const localIP = Object.values(networkInterfaces)
      .flat()
      .find((iface) => iface?.family === "IPv4" && !iface.internal)?.address;

    console.log("\n🎵 Music Server Started!\n");
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Network:  http://${localIP}:${PORT}\n`);
    console.log(
      `🌐 Other devices can connect using: http://${localIP}:${PORT}\n`,
    );
  })
  .on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use!`);
      console.error(`\nTo fix this:`);
      console.error(`1. Kill the process: lsof -ti :${PORT} | xargs kill -9`);
      console.error(`2. Or use a different port: PORT=3002 npm run dev\n`);
      process.exit(1);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received, closing server...");
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
