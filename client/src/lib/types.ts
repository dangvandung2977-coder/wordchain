export type GameMode = "basic" | "ban_letter" | "hard_chain" | "bomb" | "escalating" | "themed";
export type RoomStatus = "lobby" | "playing" | "finished";
export type ThemeChoice = "animals" | "colors" | "countries" | "food" | "fruits";

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  score: number;
  connected: boolean;
  isHost: boolean;
  lives?: number;
  eliminated?: boolean;
}

export interface WordEntry {
  id: string;
  playerId: string;
  playerName: string;
  word: string;
  points: number;
  createdAt: number;
}

export interface PublicRoomState {
  code: string;
  hostId: string;
  status: RoomStatus;
  targetScore: number;
  mode: GameMode;
  modeLabel: string;
  minWordLength: number;
  maxWordLength: number;
  bannedLetterChoice: string;
  bannedLetter: string | null;
  forcedStartLetterChoice: string;
  forcedStartLetter: string | null;
  theme: ThemeChoice | null;
  chainLength: 1 | 2;
  players: PlayerState[];
  currentTurnPlayerId: string | null;
  lastWord: string | null;
  requiredStart: string | null;
  winnerId: string | null;
  wordsUsedCount: number;
  history: WordEntry[];
  turnStartedAt: number | null;
  turnDuration: number;
  bombHolderId: string | null;
  bombStartedAt: number | null;
  bombDuration: number;
  createdAt: number;
  serverTime?: number;
}

export interface ApiAck<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

export interface CreateRoomPayload {
  playerId: string;
  name: string;
  avatar: string;
  targetScore: number;
  mode: GameMode;
  minWordLength?: number;
  maxWordLength?: number;
  bannedLetterChoice?: string;
  forcedStartLetterChoice?: string;
  theme?: ThemeChoice | null;
  turnDuration?: number;
  bombDuration?: number;
}

export interface JoinRoomPayload {
  code: string;
  playerId: string;
  name: string;
  avatar: string;
}

export interface SubmitWordPayload {
  code: string;
  playerId: string;
  word: string;
}
