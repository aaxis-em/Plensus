// apps/web/src/components/room/QueueList.tsx

"use client";

import { Song, User } from "@shared/types";

interface QueueListProps {
  queue: Song[];
  users: User[];
  currentUserId?: string;
  onVoteSong: (songId: string) => void;
}

export function QueueList({
  queue,
  users,
  currentUserId,
  onVoteSong,
}: QueueListProps) {
  if (queue.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 glass-panel" style={{ minHeight: '200px' }}>
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Queue is empty. Add a track!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }} className="text-gradient">UP NEXT ({queue.length})</h3>

      <div className="space-y-2">
        {queue.map((song, index) => {
          const hasVoted = currentUserId
            ? song.votes.includes(currentUserId)
            : false;
          const addedByUser = users.find((u) => u.id === song.addedBy);

          return (
            <div key={song.id} className="queue-item">
              {/* Position */}
              <div style={{ fontSize: '1.5rem', fontWeight: '800', width: '2rem', textAlign: 'center' }} className="text-gradient">
                {index + 1}
              </div>

              {/* Thumbnail */}
              <div style={{ width: '4rem', height: '4rem', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                <img
                  src={song.thumbnail}
                  alt={song.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 truncate">
                <h4 style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }} className="truncate">
                  {song.title}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Added by <span style={{ color: 'white' }}>{addedByUser?.name || "Unknown"}</span>
                </p>
              </div>

              {/* Votes */}
              <button
                onClick={() => onVoteSong(song.id)}
                className="flex flex-col items-center justify-center btn-metallic"
                style={{
                  padding: '8px 16px',
                  background: hasVoted ? 'linear-gradient(135deg, #111, #333)' : undefined,
                  borderColor: hasVoted ? '#fff' : undefined,
                  boxShadow: hasVoted ? '0 0 10px rgba(255,255,255,0.2)' : undefined,
                }}
              >
                <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>👍</span>
                <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>{song.votes.length}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
