// apps/web/src/hooks/useYouTubePlayer.ts

import { useEffect, useRef, useState } from "react";
import { CurrentSong } from "@shared/types";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerOptions {
  currentSong: CurrentSong | null;
  onSongEnd?: () => void;
}

/**
 * Hook to manage YouTube player with time sync
 */
export function useYouTubePlayer({
  currentSong,
  onSongEnd,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onSongEndRef = useRef(onSongEnd);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Update latest callback
  useEffect(() => {
    onSongEndRef.current = onSongEnd;
  }, [onSongEnd]);

  // Load YouTube API script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };
  }, []);

  // Initialize YT player exactly once
  useEffect(() => {
    if (!isApiReady || !containerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: "360",
      width: "640",
      host: "https://www.youtube.com", // Help fallback to standard host
      playerVars: {
        autoplay: 1,       // Request autoplay
        playsinline: 1,    // Critical for iOS/Android inline viewing
        controls: 1,
        modestbranding: 1,
        enablejsapi: 1,
        rel: 0,            // Disable related videos from other channels at the end
      },
      events: {
        onReady: () => {
          setIsPlayerReady(true);
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            onSongEndRef.current?.();
          } else if (event.data === window.YT.PlayerState.CUED) {
            // Only trigger aggressive playback if it got stuck formally in CUED state
            setTimeout(() => {
               if (playerRef.current?.playVideo) {
                 playerRef.current.playVideo();
               }
            }, 100);
          }
        },
      },
    });

    return () => {
      // Destroy player if component completely unmounts
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
    };
  }, [isApiReady]);

  // Sync playback when current song changes OR player becomes ready
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current || !currentSong) return;

    const { song, startedAt } = currentSong;

    // Calculate time offset based on server timestamp
    const serverTime = startedAt;
    const clientTime = Date.now();
    const elapsedSeconds = (clientTime - serverTime) / 1000;
    
    // Safely check if method exists (YouTube API adds these asynchronously)
    if (typeof playerRef.current.loadVideoById === "function") {
      playerRef.current.loadVideoById({
        videoId: song.id,
        startSeconds: Math.max(0, elapsedSeconds),
      });
      // We rely entirely on loadVideoById's native autoplay behavior rather than double-triggering
    }
  }, [currentSong, isPlayerReady]);

  return {
    containerRef,
    player: playerRef.current,
  };
}
