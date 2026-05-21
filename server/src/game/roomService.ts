import type { GameMode, Player, Room } from "../types/game.js";
import { modeChainLength, now, sanitizeName } from "../lib/utils.js";

export function createRoomState(input: {
  code: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  targetScore: number;
  mode: GameMode;
  minWordLength?: number;
  maxWordLength?: number;
  bannedLetterChoice?: string;
  forcedStartLetterChoice?: string;
  theme?: any;
  turnDuration?: number;
  bombDuration?: number;
  socketId: string;
}): Room {
  const timestamp = now();
  const host: Player = {
    id: input.hostId,
    name: sanitizeName(input.hostName),
    avatar: input.hostAvatar,
    score: 0,
    connected: true,
    socketId: input.socketId,
    joinedAt: timestamp,
    lives: 3,
    eliminated: false
  };

  return {
    code: input.code,
    hostId: input.hostId,
    status: "lobby",
    targetScore: clampTargetScore(input.targetScore),
    mode: input.mode,
    minWordLength: input.minWordLength != null ? Math.min(10, Math.max(2, Math.round(input.minWordLength))) : 2,
    maxWordLength: input.maxWordLength != null ? Math.min(64, Math.max(4, Math.round(input.maxWordLength))) : 64,
    bannedLetterChoice: input.bannedLetterChoice || "random",
    bannedLetter: null,
    forcedStartLetterChoice: input.forcedStartLetterChoice || "none",
    forcedStartLetter: null,
    theme: input.theme || null,
    chainLength: modeChainLength(input.mode),
    players: [host],
    currentTurnPlayerId: null,
    lastWord: null,
    winnerId: null,
    usedWords: new Set<string>(),
    history: [],
    turnStartedAt: null,
    turnDuration: input.turnDuration != null
      ? Math.min(60, Math.max(10, Math.round(input.turnDuration)))
      : 20,
    bombHolderId: null,
    bombStartedAt: null,
    bombDuration: input.bombDuration != null
      ? Math.min(90, Math.max(20, Math.round(input.bombDuration)))
      : 45,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function clampTargetScore(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(999, Math.max(20, Math.round(value)));
}

export function addOrReconnectPlayer(room: Room, input: {
  playerId: string;
  name: string;
  avatar: string;
  socketId: string;
}): { ok: true } | { ok: false; error: string } {
  const safeName = sanitizeName(input.name);
  if (!safeName) return { ok: false, error: "Tên người chơi không hợp lệ." };

  const existing = room.players.find((player) => player.id === input.playerId);
  if (existing) {
    existing.name = safeName;
    existing.avatar = input.avatar;
    existing.connected = true;
    existing.socketId = input.socketId;
    room.updatedAt = now();
    return { ok: true };
  }

  if (room.players.length >= 8) {
    return { ok: false, error: "Phòng đã đủ 8 người." };
  }

  if (room.status !== "lobby") {
    return { ok: false, error: "Trận đã bắt đầu, người mới chưa thể vào." };
  }

  room.players.push({
    id: input.playerId,
    name: safeName,
    avatar: input.avatar,
    score: 0,
    connected: true,
    socketId: input.socketId,
    joinedAt: now(),
    lives: 3,
    eliminated: false
  });
  room.updatedAt = now();
  return { ok: true };
}

export function leavePlayer(room: Room, playerId: string): void {
  const player = room.players.find((item) => item.id === playerId);
  if (!player) return;

  player.connected = false;
  player.socketId = null;
  room.updatedAt = now();
}

export function disconnectSocket(room: Room, socketId: string): boolean {
  const player = room.players.find((item) => item.socketId === socketId);
  if (!player) return false;

  player.connected = false;
  player.socketId = null;
  room.updatedAt = now();
  return true;
}

export function canStartGame(room: Room, playerId: string): { ok: true } | { ok: false; error: string } {
  if (room.hostId !== playerId) return { ok: false, error: "Chỉ host mới được bắt đầu." };
  if (room.status !== "lobby") return { ok: false, error: "Phòng đã bắt đầu rồi." };
  if (room.players.length < 2) return { ok: false, error: "Cần ít nhất 2 người chơi." };
  return { ok: true };
}

export function startGame(room: Room): void {
  room.status = "playing";
  room.players.forEach((player) => {
    player.score = 0;
    if (room.mode === "themed") {
      player.lives = 3;
      player.eliminated = false;
    }
  });
  room.lastWord = null;
  room.winnerId = null;
  room.usedWords = new Set<string>();
  room.history = [];
  room.currentTurnPlayerId = room.players[0]?.id ?? null;
  room.chainLength = modeChainLength(room.mode);
  
  if (room.mode === "ban_letter") {
    if (room.bannedLetterChoice === "random") {
      const alphabet = "abcdefghijklmnopqrstuvwxyz";
      room.bannedLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    } else {
      room.bannedLetter = room.bannedLetterChoice.toLowerCase();
    }
  } else {
    room.bannedLetter = null;
  }

  if (room.forcedStartLetterChoice && room.forcedStartLetterChoice !== "none") {
    if (room.forcedStartLetterChoice === "random") {
      const alphabet = "abcdefghijklmnopqrstuvwxyz";
      room.forcedStartLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    } else {
      room.forcedStartLetter = room.forcedStartLetterChoice.toLowerCase();
    }
  } else {
    room.forcedStartLetter = null;
  }

  if (room.mode === "bomb") {
    const randomIndex = Math.floor(Math.random() * room.players.length);
    room.bombHolderId = room.players[randomIndex]?.id ?? null;
    room.bombStartedAt = now();
  } else {
    room.bombHolderId = null;
    room.bombStartedAt = null;
  }
  room.turnStartedAt = now();
  room.updatedAt = now();
}

export function resetGame(room: Room, playerId: string): { ok: true } | { ok: false; error: string } {
  if (room.hostId !== playerId) return { ok: false, error: "Chỉ host mới được chơi lại." };

  room.status = "lobby";
  room.players.forEach((player) => {
    player.score = 0;
    if (room.mode === "themed") {
      player.lives = 3;
      player.eliminated = false;
    }
  });
  room.currentTurnPlayerId = null;
  room.lastWord = null;
  room.winnerId = null;
  room.usedWords = new Set<string>();
  room.history = [];
  room.bannedLetter = null;
  room.forcedStartLetter = null;
  room.bombHolderId = null;
  room.bombStartedAt = null;
  room.turnStartedAt = null;
  room.updatedAt = now();
  return { ok: true };
}
