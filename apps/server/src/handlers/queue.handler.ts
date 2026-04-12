// apps/server/src/handlers/queue.handler.ts

import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  Song,
} from "@shared/types";
import { RoomManager } from "../managers/RoomManager";

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * Queue-related event handlers
 */
export function registerQueueHandlers(
  socket: TypedSocket,
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomManager: RoomManager,
) {
  /**
   * Add song to queue
   */
  socket.on("add_song", ({ roomId, song: songData }) => {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║         ADD SONG REQUEST               ║");
    console.log("╚════════════════════════════════════════╝");
    console.log(`🎵 Song: ${songData.title}`);
    console.log(`📺 Video ID: ${songData.id}`);
    console.log(`🏠 Room: ${roomId}`);
    console.log(`👤 User: ${socket.data.userId}`);
    console.log("");

    try {
      const { userId } = socket.data;

      if (!userId) {
        console.log("❌ ERROR: User not authenticated");
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      // Create song object
      const song: Song = {
        id: songData.id,
        title: songData.title,
        thumbnail: songData.thumbnail,
        duration: songData.duration,
        addedBy: userId,
        addedAt: Date.now(),
        votes: [],
      };

      // Add to room queue
      const room = roomManager.addSongToQueue(roomId, song);

      if (!room) {
        console.log("❌ ERROR: Room not found");
        socket.emit("error", { message: "Room not found" });
        return;
      }

      console.log(`✅ Song added to queue`);
      console.log(`📊 Queue length: ${room.queue.length}`);

      // ✅ AUTO-START if nothing is playing
      if (!room.currentSong && room.queue.length === 1) {
        console.log("\n🎬 AUTO-STARTING PLAYBACK (first song)");
        const startedRoom = roomManager.playNext(roomId);

        if (startedRoom) {
          console.log(`▶️ NOW PLAYING: ${startedRoom.currentSong?.song.title}`);

          io.to(roomId).emit("now_playing", {
            currentSong: startedRoom.currentSong,
          });
        }
      }

      // Broadcast updated queue
      io.to(roomId).emit("queue_updated", {
        queue: room.queue,
      });

      console.log("");
    } catch (error) {
      console.error("❌ ERROR in add_song:", error);
      socket.emit("error", {
        message: "Failed to add song",
        code: "ADD_SONG_ERROR",
      });
    }
  });

  /**
   * Play next song
   */
  socket.on("play_next", ({ roomId }) => {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║         PLAY NEXT REQUEST              ║");
    console.log("╚════════════════════════════════════════╝");
    console.log(`🏠 Room: ${roomId}`);
    console.log("");

    try {
      const room = roomManager.playNext(roomId);

      if (!room) {
        console.log("❌ ERROR: Room not found");
        socket.emit("error", { message: "Room not found" });
        return;
      }

      console.log(`✅ Playing next song`);

      // Broadcast new current song
      io.to(roomId).emit("now_playing", {
        currentSong: room.currentSong,
      });

      // Broadcast updated queue
      io.to(roomId).emit("queue_updated", {
        queue: room.queue,
      });

      console.log("");
    } catch (error) {
      console.error("❌ ERROR in play_next:", error);
      socket.emit("error", {
        message: "Failed to play next song",
        code: "PLAY_NEXT_ERROR",
      });
    }
  });
}
