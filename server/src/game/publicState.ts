import type { PublicRoomState, Room } from "../types/game.js";
import { modeLabel } from "../lib/utils.js";

function requiredStart(room: Room): string | null {
  if (room.mode === "themed") {
    return null;
  }
  if (!room.lastWord) {
    return room.forcedStartLetter || null;
  }
  return room.lastWord.slice(-room.chainLength);
}

export function toPublicRoomState(room: Room): PublicRoomState {
  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    targetScore: room.targetScore,
    mode: room.mode,
    modeLabel: modeLabel(room),
    minWordLength: room.minWordLength,
    maxWordLength: room.maxWordLength,
    bannedLetter: room.bannedLetter,
    bannedLetterChoice: room.bannedLetterChoice,
    forcedStartLetter: room.forcedStartLetter,
    forcedStartLetterChoice: room.forcedStartLetterChoice,
    theme: room.theme,
    chainLength: room.chainLength,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      score: player.score,
      connected: player.connected,
      isHost: player.id === room.hostId,
      lives: player.lives,
      eliminated: player.eliminated
    })),
    currentTurnPlayerId: room.currentTurnPlayerId,
    lastWord: room.lastWord,
    requiredStart: requiredStart(room),
    winnerId: room.winnerId,
    wordsUsedCount: room.usedWords.size,
    history: room.history.slice(-60),
    turnStartedAt: room.turnStartedAt,
    turnDuration: room.turnDuration,
    bombHolderId: room.bombHolderId,
    bombStartedAt: room.bombStartedAt,
    bombDuration: room.bombDuration,
    createdAt: room.createdAt,
    serverTime: Date.now()
  };
}
