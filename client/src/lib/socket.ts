import { io, Socket } from "socket.io-client";
import type {
  ApiAck,
  CreateRoomPayload,
  JoinRoomPayload,
  PublicRoomState,
  SubmitWordPayload
} from "./types";

const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined;

export interface ClientToServerEvents {
  "room:create": (payload: CreateRoomPayload, callback: (ack: ApiAck<PublicRoomState>) => void) => void;
  "room:join": (payload: JoinRoomPayload, callback: (ack: ApiAck<PublicRoomState>) => void) => void;
  "room:leave": (payload: { code: string; playerId: string }, callback: (ack: ApiAck) => void) => void;
  "game:start": (payload: { code: string; playerId: string }, callback: (ack: ApiAck<PublicRoomState>) => void) => void;
  "game:reset": (payload: { code: string; playerId: string }, callback: (ack: ApiAck<PublicRoomState>) => void) => void;
  "word:submit": (payload: SubmitWordPayload, callback: (ack: ApiAck<PublicRoomState>) => void) => void;
  "room:ping": (payload: { code: string; playerId: string }, callback: (ack: ApiAck<PublicRoomState>) => void) => void;
}

export interface ServerToClientEvents {
  "room:state": (room: PublicRoomState) => void;
  "room:notice": (message: string) => void;
}

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true
    });
  }
  return socket;
}
