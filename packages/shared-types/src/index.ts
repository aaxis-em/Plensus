// packages/shared-types/src/index.ts

/**
 * Core domain types - shared between client and server
 */

export interface User {
  id: string;
  name: string;
  joinedAt: number;
  isConnected: boolean;
}

export interface Song {
  id: string; // YouTube videoId
  title: string;
  thumbnail: string;
  duration: number; // seconds
  addedBy: string; // userId
  addedAt: number; // timestamp
  votes: string[]; // array of userIds who voted
}

export interface CurrentSong {
  song: Song;
  startedAt: number; // server timestamp when song started
  skipVotes: string[]; // userIds who voted to skip
}

export interface Room {
  id: string;
  createdAt: number;
  hostId: string;
  users: Map<string, User>; // userId -> User
  queue: Song[];
  currentSong: CurrentSong | null;
  history: Song[]; // played songs
}

/**
 * Serializable room state for network transmission
 * (Maps converted to objects/arrays)
 */
export interface RoomState {
  id: string;
  createdAt: number;
  hostId: string;
  users: User[];
  queue: Song[];
  currentSong: CurrentSong | null;
  history: Song[];
}

/**
 * Socket Event Payloads
 */

// Client -> Server events
export interface JoinRoomPayload {
  roomId: string;
  userName: string;
}

export interface AddSongPayload {
  roomId: string;
  song: {
    id: string;
    title: string;
    thumbnail: string;
    duration: number;
  };
}

export interface VoteSongPayload {
  roomId: string;
  songId: string;
}

export interface VoteSkipPayload {
  roomId: string;
}

export interface PlayNextPayload {
  roomId: string;
}

// Server -> Client events
export interface RoomStatePayload {
  room: RoomState;
}

export interface QueueUpdatedPayload {
  queue: Song[];
}

export interface NowPlayingPayload {
  currentSong: CurrentSong | null;
}

export interface UserJoinedPayload {
  user: User;
}

export interface UserLeftPayload {
  userId: string;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

/**
 * Socket event type map for type-safe event handling
 */
export interface ClientToServerEvents {
  join_room: (payload: JoinRoomPayload) => void;
  add_song: (payload: AddSongPayload) => void;
  vote_song: (payload: VoteSongPayload) => void;
  vote_skip: (payload: VoteSkipPayload) => void;
  play_next: (payload: PlayNextPayload) => void;
  disconnect: () => void;
}

export interface JoinSuccessPayload {
  userId: string;
}

export interface ServerToClientEvents {
  join_success: (payload: JoinSuccessPayload) => void;
  room_state: (payload: RoomStatePayload) => void;
  queue_updated: (payload: QueueUpdatedPayload) => void;
  now_playing: (payload: NowPlayingPayload) => void;
  user_joined: (payload: UserJoinedPayload) => void;
  user_left: (payload: UserLeftPayload) => void;
  error: (payload: ErrorPayload) => void;
}

/**
 * YouTube API types
 */
export interface YouTubeSearchResult {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
}
