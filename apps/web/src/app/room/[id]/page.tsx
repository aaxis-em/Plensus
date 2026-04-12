// apps/web/src/app/room/[id]/page.tsx

"use client";

import { use, useState, useEffect } from "react";
import { useRoom } from "@/hooks/useRoom";
import { NowPlaying } from "@/components/room/NowPlaying";
import { QueueList } from "@/components/room/QueueList";
import { SongSearch } from "@/components/room/SongSearch";

export default function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomId } = use(params);
  const [userName, setUserName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const {
    room,
    isLoading,
    error,
    joinRoom,
    addSong,
    voteSong,
    voteSkip,
    playNext,
    currentUserId,
  } = useRoom(roomId);

  const handleJoin = () => {
    if (userName.trim()) {
      joinRoom(userName);
      setHasJoined(true);
    }
  };

  // Join modal
  if (!hasJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-dark)' }}>
        <div className="glass-panel p-6" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }} className="text-gradient">Join Room</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>ID: <span style={{ color: 'white', fontWeight: 'bold' }}>{roomId}</span></p>

          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Enter your alias"
            className="minimal-input"
            style={{ marginBottom: '1rem', textAlign: 'center' }}
          />

          <button
            onClick={handleJoin}
            className="w-full btn-metallic"
          >
            Enter Now
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-dark)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Syncing with room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-dark)' }}>
        <div className="glass-panel p-6" style={{ border: '1px solid #ff4444' }}>
          <p style={{ color: '#ff4444', fontWeight: 'bold' }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-dark)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-strong)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '1px' }}>
              <span className="text-gradient">ROOM/</span><span style={{ color: 'var(--text-secondary)' }}>{roomId}</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span style={{ color: '#10b981', marginRight: '6px' }}>●</span>
            {room.users.filter((u) => u.isConnected).length} ONLINE
          </p>
        </div>

        <div className="grid lg-grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg-col-span-2 space-y-6">
            {/* Now Playing */}
            <NowPlaying
              currentSong={room.currentSong}
              users={room.users}
              currentUserId={currentUserId}
              hostId={room.hostId}
              onSongEnd={playNext}
              onVoteSkip={voteSkip}
            />

            {/* Queue */}
            <QueueList
              queue={room.queue}
              users={room.users}
              currentUserId={currentUserId}
              onVoteSong={voteSong}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Add Song */}
            <div className="glass-panel p-6">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }} className="text-gradient">ADD TRACK</h3>
              <SongSearch onAddSong={addSong} />
            </div>

            {/* Users */}
            <div className="glass-panel p-6">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }} className="text-gradient">
                USERS
              </h3>
              <div className="space-y-2">
                {room.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                    style={{ padding: '0.5rem', background: 'var(--bg-dark-surface-2)', borderRadius: '6px' }}
                  >
                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }} className="flex items-center gap-2">
                      {user.id === room.hostId && <span title="Host">👑</span>}
                      {user.name} {user.id === currentUserId && <span style={{ color: 'var(--text-secondary)' }}>(You)</span>}
                    </span>
                    <span
                      style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: user.isConnected ? '#10b981' : '#4b5563'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
