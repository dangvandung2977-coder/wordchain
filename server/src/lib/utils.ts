import type { GameMode, Room } from "../types/game.js";

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 24);
}

export function sanitizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

export function sanitizeWord(word: string): string {
  return word.trim().toLowerCase();
}

export function isAlphaWord(word: string): boolean {
  return /^[a-z]+$/.test(word);
}

export function generateRoomCode(existingCodes: Set<string>): string {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    let code = "";
    for (let index = 0; index < 6; index += 1) {
      code += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
    }
    if (!existingCodes.has(code)) return code;
  }
  throw new Error("Không thể tạo mã phòng mới.");
}



export function modeLabel(room: Pick<Room, "mode" | "bannedLetter" | "theme">): string {
  if (room.mode === "ban_letter") {
    return room.bannedLetter ? `Cấm chữ ${room.bannedLetter.toUpperCase()}` : "Cấm 1 chữ cái";
  }
  if (room.mode === "hard_chain") return "Hard Chain";
  if (room.mode === "bomb") return "Bomb Mode 💣";
  if (room.mode === "escalating") return "Tăng Dần (Escalating)";
  if (room.mode === "themed") return `Chủ đề: ${room.theme || "?"}`;
  return "Basic";
}

export function modeChainLength(mode: GameMode): 1 | 2 {
  return mode === "hard_chain" ? 2 : 1;
}

export function now(): number {
  return Date.now();
}
