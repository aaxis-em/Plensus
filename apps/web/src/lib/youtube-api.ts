// apps/web/src/lib/youtube-api.ts

import { YouTubeSearchResult } from "@shared/types";

interface YouTubeSearchResponse {
  results?: YouTubeSearchResult[];
  message?: string;
}

/**
 * Search YouTube through the local API proxy route
 */
export async function searchYouTube(
  query: string,
): Promise<YouTubeSearchResult[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const response = await fetch(
    `/api/youtube/search?q=${encodeURIComponent(trimmedQuery)}`,
  );
  const data = (await response.json()) as YouTubeSearchResponse;

  if (!response.ok) {
    throw new Error(data.message || "Failed to search YouTube");
  }

  return data.results || [];
}