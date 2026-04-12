// apps/server/src/handlers/connection.handler.ts

import { Server, Socket } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "@shared/types";
import { RoomManager } from "../managers/RoomManager";
import { registerRoomHandlers } from "./room.handler";
import { registerQueueHandlers } from "./queue.handler";
import { registerVoteHandlers } from "./vote.handler";

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * Connection handler - registers all event handlers for a socket
 */
export function registerConnectionHandler(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomManager: RoomManager,
) {
  io.on("connection", (socket: TypedSocket) => {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔌 NEW CONNECTION");
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   Time: ${new Date().toLocaleTimeString()}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Store user context in socket data
    socket.data.userId = null;
    socket.data.roomId = null;

    // ✅ Register all handlers
    registerRoomHandlers(socket, io, roomManager);
    registerQueueHandlers(socket, io, roomManager);
    registerVoteHandlers(socket, io, roomManager);

    // Handle disconnect
    socket.on("disconnect", () => {
      handleDisconnect(socket, io, roomManager);
    });
  });
}

/**
 * Handle user disconnect
 */
function handleDisconnect(
  socket: TypedSocket,
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomManager: RoomManager,
) {
  const { userId, roomId } = socket.data;

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔌 DISCONNECT");
  console.log(`   Socket ID: ${socket.id}`);
  console.log(`   User ID: ${userId || "N/A"}`);
  console.log(`   Room ID: ${roomId || "N/A"}`);
  console.log(`   Time: ${new Date().toLocaleTimeString()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (!userId || !roomId) return;

  // Update user status
  roomManager.updateUserConnection(roomId, userId, false);

  // Remove user from room (with grace period for reconnection)
  setTimeout(() => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const user = room.users.get(userId);
    if (user && !user.isConnected) {
      const updatedRoom = roomManager.removeUser(roomId, userId);

      if (updatedRoom) {
        // Notify other users
        io.to(roomId).emit("user_left", { userId });

        // Broadcast updated room state
        io.to(roomId).emit("room_state", {
          room: roomManager.serializeRoom(updatedRoom),
        });
      }
    }
  }, 5000); // 5 second grace period for reconnection
}
