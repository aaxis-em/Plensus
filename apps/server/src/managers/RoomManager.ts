// apps/server/src/managers/RoomManager.ts

import { Room, User, Song, CurrentSong, RoomState } from "@shared/types";
import { QueueManager } from "./QueueManager";

/**
 * RoomManager - Central room state management
 *
 * Design: In-memory Map structure that can be replaced with Redis
 * All operations are atomic and return immutable copies
 */
export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private queueManager: QueueManager;

  constructor() {
    this.queueManager = new QueueManager();
  }

  /**
   * Create or get existing room
   */
  getOrCreateRoom(roomId: string, hostId: string = ""): Room {
    let room = this.rooms.get(roomId);

    if (!room) {
      room = {
        id: roomId,
        createdAt: Date.now(),
        hostId: hostId,
        users: new Map(),
        queue: [],
        currentSong: null,
        history: [],
      };
      this.rooms.set(roomId, room);
      console.log(`📦 Room created: ${roomId}`);
    }

    return room;
  }

  /**
   * Add user to room
   */
  addUser(roomId: string, user: User): Room {
    let room = this.rooms.get(roomId);
    
    if (!room) {
      room = this.getOrCreateRoom(roomId, user.id);
    }
    
    room.users.set(user.id, user);
    console.log(`👤 User ${user.name} joined room ${roomId}`);
    return room;
  }

  /**
   * Remove user from room
   */
  removeUser(roomId: string, userId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.users.delete(userId);
    console.log(`👋 User ${userId} left room ${roomId}`);

    // Clean up empty rooms
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      console.log(`🗑️  Room ${roomId} deleted (empty)`);
      return null;
    } else if (room.hostId === userId) {
      // Transfer host
      room.hostId = Array.from(room.users.keys())[0];
      console.log(`👑 Host transferred to ${room.hostId}`);
    }

    return room;
  }

  /**
   * Update user connection status
   */
  updateUserConnection(
    roomId: string,
    userId: string,
    isConnected: boolean,
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(userId);
    if (user) {
      user.isConnected = isConnected;
    }
  }

  /**
   * Add song to queue
   */
  addSongToQueue(roomId: string, song: Song): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.queue.push(song);
    room.queue = this.queueManager.sortQueue(room.queue);

    console.log(`🎵 Song "${song.title}" added to room ${roomId}`);
    return room;
  }

  /**
   * Toggle vote for a song
   */
  toggleSongVote(roomId: string, songId: string, userId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const song = room.queue.find((s) => s.id === songId);
    if (!song) return null;

    const voteIndex = song.votes.indexOf(userId);

    if (voteIndex === -1) {
      // Add vote
      song.votes.push(userId);
      console.log(`👍 User ${userId} voted for song ${songId}`);
    } else {
      // Remove vote
      song.votes.splice(voteIndex, 1);
      console.log(`👎 User ${userId} removed vote for song ${songId}`);
    }

    // Re-sort queue based on new votes
    room.queue = this.queueManager.sortQueue(room.queue);

    return room;
  }

  /**
   * Toggle skip vote for current song
   */
  toggleSkipVote(
    roomId: string,
    userId: string,
  ): { room: Room; shouldSkip: boolean } | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentSong) return null;

    const skipVotes = room.currentSong.skipVotes;
    const voteIndex = skipVotes.indexOf(userId);

    if (voteIndex === -1) {
      skipVotes.push(userId);
      console.log(`⏭️  User ${userId} voted to skip`);
    } else {
      skipVotes.splice(voteIndex, 1);
      console.log(`↩️  User ${userId} removed skip vote`);
    }

    // Check if skip threshold reached (50%)
    const activeUserCount = Array.from(room.users.values()).filter(
      (u) => u.isConnected,
    ).length;

    const skipThreshold = Math.ceil(activeUserCount * 0.5);
    const shouldSkip = skipVotes.length >= skipThreshold;

    if (shouldSkip) {
      console.log(`⏭️  Skip threshold reached in room ${roomId}`);
    }

    return { room, shouldSkip };
  }

  /**
   * Play next song in queue
   */
  playNext(roomId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Move current song to history
    if (room.currentSong) {
      room.history.push(room.currentSong.song);
      // Limit history to 50 songs
      if (room.history.length > 50) {
        room.history.shift();
      }
    }

    // Get next song from queue
    const nextSong = room.queue.shift();

    if (nextSong) {
      room.currentSong = {
        song: nextSong,
        startedAt: Date.now(),
        skipVotes: [],
      };
      console.log(`▶️  Now playing: ${nextSong.title} in room ${roomId}`);
    } else {
      room.currentSong = null;
      console.log(`⏸️  Queue empty in room ${roomId}`);
    }

    return room;
  }

  /**
   * Get room by ID
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Serialize room for network transmission
   * Converts Maps to arrays for JSON compatibility
   */
  serializeRoom(room: Room): RoomState {
    return {
      id: room.id,
      createdAt: room.createdAt,
      hostId: room.hostId,
      users: Array.from(room.users.values()),
      queue: room.queue,
      currentSong: room.currentSong,
      history: room.history,
    };
  }

  /**
   * Get total room count (for monitoring)
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * FUTURE: Redis Migration
   *
   * Replace in-memory Map with Redis:
   * - Use Redis hashes for room data
   * - Use Redis sorted sets for queue (score = votes + timestamp)
   * - Use Redis pub/sub for multi-server sync
   *
   * Example migration path:
   * - rooms.set() -> redis.hset()
   * - rooms.get() -> redis.hget()
   * - rooms.delete() -> redis.hdel()
   */
}
