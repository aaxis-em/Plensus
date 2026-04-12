// apps/web/src/hooks/useSocket.ts

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "@shared/types";
import { socketClient } from "@/lib/socket-client";

/**
 * Hook to manage socket connection
 */
export function useSocket() {
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log("\n🔌 [useSocket] Initializing socket connection...");

    const socketInstance = socketClient.connect();
    setSocket(socketInstance);

    const handleConnect = () => {
      console.log("\n✅ [useSocket] CONNECTED!");
      console.log(`   Socket ID: ${socketInstance.id}`);
      console.log(`   Time: ${new Date().toLocaleTimeString()}\n`);
      setIsConnected(true);
    };

    const handleDisconnect = (reason: string) => {
      console.log("\n❌ [useSocket] DISCONNECTED");
      console.log(`   Reason: ${reason}`);
      console.log(`   Time: ${new Date().toLocaleTimeString()}\n`);
      setIsConnected(false);
    };

    const handleConnectError = (error: Error) => {
      console.error("\n❌ [useSocket] CONNECTION ERROR");
      console.error(`   Error: ${error.message}`);
      console.error(error);
      console.log("");
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);

    const initialConnectionState = socketInstance.connected;
    console.log(
      `   Initial connection state: ${initialConnectionState ? "✅ Connected" : "⏳ Connecting..."}`,
    );
    setIsConnected(initialConnectionState);

    return () => {
      console.log("\n🔌 [useSocket] Cleaning up socket listeners...\n");
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.off("connect_error", handleConnectError);
    };
  }, []);

  return { socket, isConnected };
}
