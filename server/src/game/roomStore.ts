import type { Room } from "../types/game.js";

const rooms = new Map<string, Room>();

export function getRooms(): Map<string, Room> {
  return rooms;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function saveRoom(room: Room): void {
  rooms.set(room.code, room);
}

export function deleteRoom(code: string): void {
  rooms.delete(code);
}

export function roomCodes(): Set<string> {
  return new Set(rooms.keys());
}
