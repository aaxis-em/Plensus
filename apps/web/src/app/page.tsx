"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  const handleCreateRoom = () => {
    // Generate a random 6-character alphanumeric room code
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/room/${newRoomCode}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      router.push(`/room/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-dark)' }}>
      <div className="glass-panel p-6" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
           <h1 style={{ fontSize: '3rem', fontWeight: '800', letterSpacing: '-1px' }} className="text-gradient">Plensus</h1>
           <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Synchronized Party Room</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleCreateRoom}
            className="w-full btn-metallic"
          >
            Start New Room
          </button>
          
          <div className="flex items-center" style={{ margin: '1.5rem 0' }}>
            <div className="flex-1" style={{ height: '1px', background: 'var(--border-strong)' }}></div>
            <span style={{ margin: '0 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px' }}>OR JOIN EXISTING</span>
            <div className="flex-1" style={{ height: '1px', background: 'var(--border-strong)' }}></div>
          </div>
          
          <form onSubmit={handleJoinRoom} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter Room Code" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="minimal-input"
              style={{ textTransform: 'uppercase', textAlign: 'center', fontWeight: '600', letterSpacing: '2px' }}
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="btn-metallic"
              style={{ padding: '0 24px' }}
            >
              Join
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}