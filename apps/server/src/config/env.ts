// apps/server/src/config/env.ts

import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 3001,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || "",
  NODE_ENV: process.env.NODE_ENV || "development",
};

// Validate required env vars
if (!env.YOUTUBE_API_KEY && env.NODE_ENV === "production") {
  throw new Error("YOUTUBE_API_KEY is required in production");
}
