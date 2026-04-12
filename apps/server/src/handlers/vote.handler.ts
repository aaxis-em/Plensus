// apps/server/src/handlers/vote.handler.ts

import { Server, Socket } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "@shared/types";
import { RoomManager } from "../managers/RoomManager";

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * Voting-related event handlers
 */
export function registerVoteHandlers(
  socket: TypedSocket,
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomManager: RoomManager,
) {
  /**
   * Vote for song in queue
   */
  socket.on("vote_song", ({ roomId, songId }) => {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║         SONG VOTE REQUEST              ║");
    console.log("╚════════════════════════════════════════╝");
    console.log(`🏠 Room: ${roomId}`);
    console.log(`🎵 Song ID: ${songId}`);
    console.log(`👤 User: ${socket.data.userId}`);
    console.log("");

    try {
      const { userId } = socket.data;

      if (!userId) {
        console.log("❌ ERROR: User not authenticated");
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      // Toggle vote
      const room = roomManager.toggleSongVote(roomId, songId, userId);

      if (!room) {
        console.log("❌ ERROR: Room or song not found");
        socket.emit("error", { message: "Room or song not found" });
        return;
      }

      console.log(`✅ Vote toggled`);

      // Broadcast updated queue (re-sorted)
      io.to(roomId).emit("queue_updated", {
        queue: room.queue,
      });

      console.log("");
    } catch (error) {
      console.error("❌ ERROR in vote_song:", error);
      socket.emit("error", {
        message: "Failed to vote",
        code: "VOTE_SONG_ERROR",
      });
    }
  });

  /**
   * Vote to skip current song
   */
  socket.on("vote_skip", ({ roomId }) => {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║         SKIP VOTE REQUEST              ║");
    console.log("╚════════════════════════════════════════╝");
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

      // Toggle skip vote
      const result = roomManager.toggleSkipVote(roomId, userId);

      if (!result) {
        console.log("❌ ERROR: Room not found or no song playing");
        socket.emit("error", {
          message: "Room not found or no song playing",
        });
        return;
      }

      const { room, shouldSkip } = result;

      // Calculate stats
      const activeUserCount = Array.from(room.users.values()).filter(
        (u) => u.isConnected,
      ).length;
      const skipVoteCount = room.currentSong?.skipVotes.length || 0;
      const requiredVotes = Math.ceil(activeUserCount * 0.5);

      console.log("📊 SKIP VOTE STATUS:");
      console.log(`   Active Users: ${activeUserCount}`);
      console.log(`   Current Votes: ${skipVoteCount}/${requiredVotes}`);
      console.log(
        `   Threshold: ${((requiredVotes / activeUserCount) * 100).toFixed(0)}%`,
      );
      console.log(`   Should Skip: ${shouldSkip ? "YES ✅" : "NO ❌"}`);
      console.log("");

      if (shouldSkip) {
        console.log("⏭️  SKIPPING SONG (threshold reached)");
        const updatedRoom = roomManager.playNext(roomId);

        if (updatedRoom) {
          if (updatedRoom.currentSong) {
            console.log(
              `▶️ NOW PLAYING: ${updatedRoom.currentSong.song.title}`,
            );
          } else {
            console.log("⏸️  Queue is empty");
          }

          io.to(roomId).emit("now_playing", {
            currentSong: updatedRoom.currentSong,
          });

          io.to(roomId).emit("queue_updated", {
            queue: updatedRoom.queue,
          });
        }
      } else {
        console.log(
          `⏸️  Not enough votes (need ${requiredVotes - skipVoteCount} more)`,
        );

        io.to(roomId).emit("now_playing", {
          currentSong: room.currentSong,
        });
      }

      console.log("");
    } catch (error) {
      console.error("❌ ERROR in vote_skip:", error);
      socket.emit("error", {
        message: "Failed to vote skip",
        code: "VOTE_SKIP_ERROR",
      });
    }
  });
}
