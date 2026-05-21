export type GameMode = "basic" | "ban_letter" | "hard_chain" | "bomb" | "escalating" | "themed";
export type RoomStatus = "lobby" | "playing" | "finished";
export type ThemeChoice = "animals" | "colors" | "countries" | "food" | "fruits";

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  connected: boolean;
  socketId: string | null;
  joinedAt: number;
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

export interface Room {
  code: string;
  hostId: string;
  status: RoomStatus;
  targetScore: number;
  mode: GameMode;
  minWordLength: number;
  maxWordLength: number;
  bannedLetterChoice: string;
  bannedLetter: string | null;
  forcedStartLetterChoice: string;
  forcedStartLetter: string | null;
  theme: ThemeChoice | null;
  chainLength: 1 | 2;
  players: Player[];
  currentTurnPlayerId: string | null;
  lastWord: string | null;
  winnerId: string | null;
  usedWords: Set<string>;
  history: WordEntry[];
  turnStartedAt: number | null;
  turnDuration: number;
  bombHolderId: string | null;
  bombStartedAt: number | null;
  bombDuration: number;
  createdAt: number;
  updatedAt: number;
}

export interface PublicPlayerState {
  id: string;
  name: string;
  avatar: string;
  score: number;
  connected: boolean;
  isHost: boolean;
  lives?: number;
  eliminated?: boolean;
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
  players: PublicPlayerState[];
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
  serverTime: number;
}
