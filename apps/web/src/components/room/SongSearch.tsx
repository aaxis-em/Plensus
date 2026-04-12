// apps/web/src/components/room/SongSearch.tsx

"use client";

import { useState } from "react";
import { YouTubeSearchResult } from "@shared/types";
import { searchYouTube } from "@/lib/youtube-api";

interface SongSearchProps {
  onAddSong: (song: YouTubeSearchResult) => void;
}

export function SongSearch({ onAddSong }: SongSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearchError(null);

    setIsSearching(true);
    try {
      const searchResults = await searchYouTube(query);
      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(
        error instanceof Error ? error.message : "Failed to search YouTube",
      );
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="SEARCH TRACKS..."
          className="minimal-input lg-col-span-2"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="btn-metallic"
          style={{ flexGrow: 1 }}
        >
          {isSearching ? "..." : "SEARCH"}
        </button>
      </div>

      {searchError && (
        <div className="glass-panel" style={{ padding: '0.75rem', borderColor: '#ff4444' }}>
          <p style={{ color: '#ff4444', fontSize: '0.875rem' }}>{searchError}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {results.map((result) => (
            <div
              key={result.id}
              className="queue-item"
              style={{ padding: '0.75rem' }}
            >
              <img
                src={result.thumbnail}
                alt={result.title}
                style={{ width: '3rem', height: '3rem', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div className="flex-1 truncate">
                <h4 style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }} className="truncate">{result.title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {Math.floor(result.duration / 60)}:
                  {(result.duration % 60).toString().padStart(2, "0")}
                </p>
              </div>
              <button
                onClick={() => {
                  onAddSong(result);
                  setResults([]);
                  setQuery("");
                }}
                className="btn-metallic"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px'
                }}
              >
                ADD
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
