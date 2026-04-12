// apps/web/src/components/room/NowPlaying.tsx

"use client";

import { CurrentSong, User } from "@shared/types";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";

interface NowPlayingProps {
  currentSong: CurrentSong | null;
  users: User[];
  onSongEnd: () => void;
  onVoteSkip: () => void;
  currentUserId?: string;
  hostId: string;
}

// Local component to isolate YouTube player lifecycle bounds strictly to the Host
function HostYouTubePlayer({ currentSong, onSongEnd }: { currentSong: CurrentSong; onSongEnd: () => void }) {
  const { containerRef } = useYouTubePlayer({ currentSong, onSongEnd });
  return <div ref={containerRef} className="w-full h-full" />;
}

export function NowPlaying({
  currentSong,
  users,
  onSongEnd,
  onVoteSkip,
  currentUserId,
  hostId,
}: NowPlayingProps) {
  // If currentUserId is unavailable yet on first tick, they securely default to not-host
  const isHost = Boolean(currentUserId && currentUserId === hostId);

  if (!currentSong) {
    return (
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px' }}>
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '1.25rem' }}>
          NO TRACK PLAYING.
        </p>
      </div>
    );
  }

  const { song, skipVotes } = currentSong;
  const activeUserCount = users.filter((u) => u.isConnected).length;
  const skipThreshold = Math.ceil(activeUserCount * 0.5);
  const hasVotedSkip = currentUserId
    ? skipVotes.includes(currentUserId)
    : false;
  const addedByUser = users.find((u) => u.id === song.addedBy);

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      {/* Video Container */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
        {isHost ? (
          <HostYouTubePlayer currentSong={currentSong} onSongEnd={onSongEnd} />
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <img
              src={song.thumbnail}
              alt={song.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px) brightness(0.4)', transform: 'scale(1.1)' }}
            />
            <div style={{ position: 'absolute', inset: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="glass-panel" style={{ padding: '12px 24px', fontSize: '1.25rem', fontWeight: '700', letterSpacing: '1px' }}>
                <span style={{ marginRight: '8px' }}>👑</span> HOST BROADCASTING
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Info Bar */}
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-dark-surface)' }}>
        <div className="flex-1 truncate">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }} className="truncate">
            {song.title}
          </h2>
          <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
            Added by <span style={{ color: 'white' }}>{addedByUser?.name || "Unknown"}</span>
          </p>
        </div>

        <button
          onClick={onVoteSkip}
          className="btn-metallic"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '12px 24px' }}
        >
          <span>{hasVotedSkip ? "VOTED" : "SKIP"}</span>
          <span style={{ background: 'var(--bg-dark)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
            {currentSong.skipVotes.length} / {skipThreshold}
          </span>
        </button>
      </div>
    </div>
  );
}
