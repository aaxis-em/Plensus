// apps/web/src/lib/socket-client.ts

import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "@shared/types";

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private url: string;

  constructor(url: string) {
    this.url = url;
    console.log("🔌 [SocketClient] Initialized");
    console.log(`   URL: ${url}\n`);
  }

  connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      console.log("✅ [SocketClient] Already connected, reusing socket");
      return this.socket;
    }

    console.log("🔌 [SocketClient] Creating new connection...");
    console.log(`   Target: ${this.url}`);

    this.socket = io(this.url, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("\n✅ [SocketClient] Connected to server");
      console.log(`   Socket ID: ${this.socket?.id}\n`);
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`\n❌ [SocketClient] Disconnected: ${reason}\n`);
    });

    this.socket.on("connect_error", (error) => {
      console.error("\n❌ [SocketClient] Connection error:");
      console.error(error);
      console.log("");
    });

    this.socket.on("error", (error) => {
      console.error("\n❌ [SocketClient] Socket error:", error, "\n");
    });

    return this.socket;
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  disconnect(): void {
    console.log("\n🔌 [SocketClient] Disconnecting...\n");
    this.socket?.disconnect();
    this.socket = null;
  }
}

const getSocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  // Use the same hostname the browser connected to (works with localhost, LAN IP, or any host)
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:3001`;
  }
  return "http://localhost:3001";
};

export const socketClient = new SocketClient(getSocketUrl());
