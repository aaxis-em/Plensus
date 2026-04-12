// apps/server/src/handlers/room.handler.ts

import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  User,
} from "@shared/types";
import { RoomManager } from "../managers/RoomManager";
import { nanoid } from "nanoid";

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * Room-related event handlers
 */
export function registerRoomHandlers(
  socket: TypedSocket,
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomManager: RoomManager,
) {
  /**
   * Join room handler
   */
  socket.on("join_room", ({ roomId, userName }) => {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║         JOIN ROOM REQUEST              ║");
    console.log("╚════════════════════════════════════════╝");
    console.log(`📝 Room ID: ${roomId}`);
    console.log(`👤 User Name: ${userName}`);
    console.log(`🔌 Socket ID: ${socket.id}`);
    console.log("");

    try {
      // Generate user ID
      const userId = nanoid();

      // Create user object
      const user: User = {
        id: userId,
        name: userName,
        joinedAt: Date.now(),
        isConnected: true,
      };

      // Store in socket context
      socket.data.userId = userId;
      socket.data.roomId = roomId;

      // Join socket.io room
      socket.join(roomId);

      // Add user to room state
      const room = roomManager.addUser(roomId, user);

      console.log(`✅ SUCCESS: ${userName} joined room ${roomId}`);
      console.log(`👥 Total users in room: ${room.users.size}`);
      console.log("");

      // Send full room state to joining user
      socket.emit("room_state", {
        room: roomManager.serializeRoom(room),
      });

      // Send explicit connection data separately to fully establish context dynamically
      socket.emit("join_success", {
        userId,
      });

      // Notify other users
      socket.to(roomId).emit("user_joined", { user });
    } catch (error) {
      console.error("❌ Error in join_room:", error);
      socket.emit("error", {
        message: "Failed to join room",
        code: "JOIN_ROOM_ERROR",
      });
    }
  });
}
