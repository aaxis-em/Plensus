// apps/web/src/hooks/useRoom.ts

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "./useSocket";
import {
  RoomState,
  Song,
  CurrentSong,
  User,
  AddSongPayload,
  VoteSongPayload,
  VoteSkipPayload,
} from "@shared/types";

interface UseRoomResult {
  room: RoomState | null;
  isLoading: boolean;
  error: string | null;
  joinRoom: (userName: string) => void;
  addSong: (song: AddSongPayload["song"]) => void;
  voteSong: (songId: string) => void;
  voteSkip: () => void;
  playNext: () => void;
  currentUserId: string | null;
}

/**
 * Hook to manage room state and interactions
 */
export function useRoom(roomId: string): UseRoomResult {
  const { socket, isConnected } = useSocket();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Join room
  const joinRoom = useCallback(
    (userName: string) => {
      if (!socket) return;

      setIsLoading(true);
      socket.emit("join_room", { roomId, userName });
    },
    [socket, roomId],
  );

  // Add song to queue
  const addSong = useCallback(
    (song: AddSongPayload["song"]) => {
      if (!socket) return;
      socket.emit("add_song", { roomId, song });
    },
    [socket, roomId],
  );

  // Vote for song
  const voteSong = useCallback(
    (songId: string) => {
      if (!socket) return;
      socket.emit("vote_song", { roomId, songId });
    },
    [socket, roomId],
  );

  // Vote to skip
  const voteSkip = useCallback(() => {
    if (!socket) return;
    socket.emit("vote_skip", { roomId });
  }, [socket, roomId]);

  // Play next song
  const playNext = useCallback(() => {
    if (!socket) return;
    socket.emit("play_next", { roomId });
  }, [socket, roomId]);

  // Listen for room updates
  useEffect(() => {
    if (!socket) return;

    const handleRoomState = ({ room: roomState }: { room: RoomState }) => {
      setRoom(roomState);
      setIsLoading(false);
      setError(null);
    };

    const handleQueueUpdated = ({ queue }: { queue: Song[] }) => {
      setRoom((prev) => (prev ? { ...prev, queue } : null));
    };

    const handleNowPlaying = ({
      currentSong,
    }: {
      currentSong: CurrentSong | null;
    }) => {
      setRoom((prev) => (prev ? { ...prev, currentSong } : null));
    };

    const handleUserJoined = ({ user }: { user: User }) => {
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          users: [...prev.users, user],
        };
      });
    };

    const handleUserLeft = ({ userId }: { userId: string }) => {
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          users: prev.users.filter((u) => u.id !== userId),
        };
      });
    };

    const handleError = ({ message }: { message: string }) => {
      setError(message);
      setIsLoading(false);
    };

    const handleJoinSuccess = ({ userId }: { userId: string }) => {
      setCurrentUserId(userId);
    };

    socket.on("join_success", handleJoinSuccess);
    socket.on("room_state", handleRoomState);
    socket.on("queue_updated", handleQueueUpdated);
    socket.on("now_playing", handleNowPlaying);
    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);
    socket.on("error", handleError);

    return () => {
      socket.off("join_success", handleJoinSuccess);
      socket.off("room_state", handleRoomState);
      socket.off("queue_updated", handleQueueUpdated);
      socket.off("now_playing", handleNowPlaying);
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
      socket.off("error", handleError);
    };
  }, [socket]);

  return {
    room,
    isLoading,
    error,
    joinRoom,
    addSong,
    voteSong,
    voteSkip,
    playNext,
    currentUserId,
  };
}
