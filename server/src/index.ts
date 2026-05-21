import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { loadDictionary } from "./lib/dictionary.js";
import { generateRoomCode, sanitizeCode, sanitizeName } from "./lib/utils.js";
import { addOrReconnectPlayer, canStartGame, createRoomState, disconnectSocket, leavePlayer, resetGame, startGame } from "./game/roomService.js";
import { getRoom, getRooms, roomCodes, saveRoom } from "./game/roomStore.js";
import { toPublicRoomState } from "./game/publicState.js";
import { submitWord } from "./game/wordService.js";
import type { GameMode, PublicRoomState, ThemeChoice } from "./types/game.js";

interface Ack<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

interface ClientToServerEvents {
  "room:create": (
    payload: {
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
    },
    callback: (ack: Ack<PublicRoomState>) => void
  ) => void;
  "room:settings": (
    payload: { 
      code: string; 
      playerId: string; 
      turnDuration?: number; 
      bombDuration?: number; 
      targetScore?: number; 
      mode?: GameMode; 
      minWordLength?: number;
      maxWordLength?: number;
      bannedLetterChoice?: string;
      forcedStartLetterChoice?: string;
      theme?: ThemeChoice | null;
    },
    callback: (ack: Ack<PublicRoomState>) => void
  ) => void;
  "room:join": (
    payload: { code: string; playerId: string; name: string; avatar: string },
    callback: (ack: Ack<PublicRoomState>) => void
  ) => void;
  "room:leave": (
    payload: { code: string; playerId: string },
    callback: (ack: Ack) => void
  ) => void;
  "game:start": (
    payload: { code: string; playerId: string },
    callback: (ack: Ack<PublicRoomState>) => void
  ) => void;
  "game:reset": (
    payload: { code: string; playerId: string },
    callback: (ack: Ack<PublicRoomState>) => void
  ) => void;
  "word:submit": (
    payload: { code: string; playerId: string; word: string },
    callback: (ack: Ack<PublicRoomState>) => void
  ) => void;
  "room:ping": (
    payload: { code: string; playerId: string },
    callback: (ack: Ack<PublicRoomState>) => void
  ) => void;
}

interface ServerToClientEvents {
  "room:state": (room: PublicRoomState) => void;
  "room:notice": (message: string) => void;
}

const app = express();
const httpServer = createServer(app);
const port = Number(process.env.PORT ?? 3001);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
let dictionary = loadDictionary();
const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDist = resolve(__dirname, "../../client/dist");

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    rooms: getRooms().size,
    dictionarySize: dictionary.size
  });
});

app.post("/api/dictionary/reload", (_request, response) => {
  try {
    dictionary = loadDictionary();
    response.json({ ok: true, size: dictionary.size });
  } catch (error) {
    response.status(500).json({ ok: false, error: "Failed to reload dictionary" });
  }
});

if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/).*/, (_request, response) => {
    response.sendFile(resolve(clientDist, "index.html"));
  });
}

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: clientOrigin
  }
});

function emitRoomState(code: string): PublicRoomState | null {
  const room = getRoom(code);
  if (!room) return null;
  const publicState = toPublicRoomState(room);
  io.to(code).emit("room:state", publicState);
  return publicState;
}

function safeMode(mode: GameMode): GameMode {
  return mode === "ban_letter" || mode === "hard_chain" || mode === "bomb" || mode === "escalating" || mode === "themed" ? mode : "basic";
}



io.on("connection", (socket) => {
  socket.on("room:create", (payload, callback) => {
    try {
      const hostName = sanitizeName(payload.name);
      if (!payload.playerId || !hostName) {
        callback({ ok: false, error: "Thiếu tên hoặc player id." });
        return;
      }

      const code = generateRoomCode(roomCodes());
      const room = createRoomState({
        code,
        hostId: payload.playerId,
        hostName,
        hostAvatar: payload.avatar || "shapes/svg?seed=Luna",
        targetScore: payload.targetScore,
        mode: safeMode(payload.mode),
        minWordLength: payload.minWordLength,
        maxWordLength: payload.maxWordLength,
        bannedLetterChoice: payload.bannedLetterChoice,
        forcedStartLetterChoice: payload.forcedStartLetterChoice,
        theme: payload.theme,
        turnDuration: payload.turnDuration,
        bombDuration: payload.bombDuration,
        socketId: socket.id
      });

      saveRoom(room);
      socket.join(code);
      const publicState = toPublicRoomState(room);
      callback({ ok: true, data: publicState });
      io.to(code).emit("room:state", publicState);
      socket.emit("room:notice", "Tạo phòng thành công.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tạo phòng thất bại.";
      callback({ ok: false, error: message });
    }
  });

  socket.on("room:join", (payload, callback) => {
    const code = sanitizeCode(payload.code);
    const room = getRoom(code);
    if (!room) {
      callback({ ok: false, error: "Không tìm thấy phòng." });
      return;
    }

    if (!payload.playerId) {
      callback({ ok: false, error: "Thiếu player id." });
      return;
    }

    const joined = addOrReconnectPlayer(room, {
      playerId: payload.playerId,
      name: payload.name,
      avatar: payload.avatar || "shapes/svg?seed=Luna",
      socketId: socket.id
    });

    if (!joined.ok) {
      callback({ ok: false, error: joined.error });
      return;
    }

    saveRoom(room);
    socket.join(room.code);
    const publicState = emitRoomState(room.code) ?? toPublicRoomState(room);
    callback({ ok: true, data: publicState });
    socket.emit("room:notice", "Đã vào phòng.");
  });

  socket.on("room:leave", (payload, callback) => {
    const room = getRoom(sanitizeCode(payload.code));
    if (!room) {
      callback({ ok: true });
      return;
    }

    leavePlayer(room, payload.playerId);
    socket.leave(room.code);
    saveRoom(room);
    emitRoomState(room.code);
    callback({ ok: true });
  });

  socket.on("game:start", (payload, callback) => {
    const room = getRoom(sanitizeCode(payload.code));
    if (!room) {
      callback({ ok: false, error: "Không tìm thấy phòng." });
      return;
    }

    const permission = canStartGame(room, payload.playerId);
    if (!permission.ok) {
      callback({ ok: false, error: permission.error });
      return;
    }

    startGame(room);
    saveRoom(room);
    const publicState = emitRoomState(room.code) ?? toPublicRoomState(room);
    io.to(room.code).emit("room:notice", "Trận đấu đã bắt đầu.");
    callback({ ok: true, data: publicState });
  });

  socket.on("game:reset", (payload, callback) => {
    const room = getRoom(sanitizeCode(payload.code));
    if (!room) {
      callback({ ok: false, error: "Không tìm thấy phòng." });
      return;
    }

    const result = resetGame(room, payload.playerId);
    if (!result.ok) {
      callback({ ok: false, error: result.error });
      return;
    }

    saveRoom(room);
    const publicState = emitRoomState(room.code) ?? toPublicRoomState(room);
    io.to(room.code).emit("room:notice", "Phòng đã quay lại sảnh chờ.");
    callback({ ok: true, data: publicState });
  });

  socket.on("word:submit", (payload, callback) => {
    const room = getRoom(sanitizeCode(payload.code));
    if (!room) {
      callback({ ok: false, error: "Không tìm thấy phòng." });
      return;
    }

    const result = submitWord({
      room,
      playerId: payload.playerId,
      rawWord: payload.word,
      dictionary
    });

    if (!result.ok) {
      callback({ ok: false, error: result.error });
      return;
    }

    saveRoom(room);
    const publicState = emitRoomState(room.code) ?? toPublicRoomState(room);
    callback({ ok: true, data: publicState });

    if (room.status === "finished") {
      const winner = room.players.find((player) => player.id === room.winnerId);
      io.to(room.code).emit("room:notice", `${winner?.name ?? "Một người chơi"} đã thắng trận.`);
    }
  });

  socket.on("room:settings", (payload, callback) => {
    const room = getRoom(sanitizeCode(payload.code));
    if (!room) { callback({ ok: false, error: "Không tìm thấy phòng." }); return; }
    if (room.hostId !== payload.playerId) { callback({ ok: false, error: "Chỉ host mới được đổi cài đặt." }); return; }
    if (room.status !== "lobby") { callback({ ok: false, error: "Không thể đổi cài đặt khi đang chơi." }); return; }

    if (payload.turnDuration != null) {
      room.turnDuration = Math.min(60, Math.max(10, Math.round(payload.turnDuration)));
    }
    if (payload.bombDuration != null) {
      room.bombDuration = Math.min(90, Math.max(20, Math.round(payload.bombDuration)));
    }
    if (payload.targetScore != null) {
      room.targetScore = Math.min(999, Math.max(20, Math.round(payload.targetScore)));
    }
    if (payload.mode != null) {
      room.mode = safeMode(payload.mode);
      room.chainLength = room.mode === "hard_chain" ? 2 : 1;
    }
    if (payload.minWordLength != null) {
      room.minWordLength = Math.min(10, Math.max(2, Math.round(payload.minWordLength)));
    }
    if (payload.maxWordLength != null) {
      room.maxWordLength = Math.min(64, Math.max(4, Math.round(payload.maxWordLength)));
    }
    if (payload.bannedLetterChoice !== undefined) {
      room.bannedLetterChoice = payload.bannedLetterChoice || "random";
    }
    if (payload.forcedStartLetterChoice !== undefined) {
      room.forcedStartLetterChoice = payload.forcedStartLetterChoice || "none";
    }
    if (payload.theme !== undefined) {
      room.theme = payload.theme || null;
    }
    room.updatedAt = Date.now();
    saveRoom(room);
    const publicState = emitRoomState(room.code) ?? toPublicRoomState(room);
    callback({ ok: true, data: publicState });
  });

  socket.on("room:ping", (payload, callback) => {
    const room = getRoom(sanitizeCode(payload.code));
    if (!room) {
      callback({ ok: false, error: "Không tìm thấy phòng." });
      return;
    }

    const publicState = toPublicRoomState(room);
    callback({ ok: true, data: publicState });
  });

  socket.on("disconnect", () => {
    for (const room of getRooms().values()) {
      const changed = disconnectSocket(room, socket.id);
      if (changed) {
        saveRoom(room);
        emitRoomState(room.code);
      }
    }
  });
});

// Turn Timeout Background Check
setInterval(() => {
  const currentTime = Date.now();
  for (const room of getRooms().values()) {
    if (room.status !== "playing") continue;

    // Standard Turn Timeout
    if (room.turnStartedAt && room.currentTurnPlayerId) {
      const elapsed = (currentTime - room.turnStartedAt) / 1000;
      if (elapsed >= room.turnDuration) {
        // Timeout! Skip to next player
        const currentIndex = room.players.findIndex(p => p.id === room.currentTurnPlayerId);
        let noticeMessage = "Hết thời gian! Lượt chơi đã được chuyển.";
        let gameFinished = false;

        if (room.mode === "themed") {
          const currentPlayer = room.players[currentIndex];
          if (currentPlayer && !currentPlayer.eliminated) {
            currentPlayer.lives = (currentPlayer.lives ?? 3) - 1;
            if (currentPlayer.lives <= 0) {
              currentPlayer.eliminated = true;
              noticeMessage = `Hết thời gian! ${currentPlayer.name} đã hết mạng và bị loại!`;
            } else {
              noticeMessage = `Hết thời gian! ${currentPlayer.name} bị trừ 1 mạng (còn ${currentPlayer.lives} mạng).`;
            }
          }
          
          const alivePlayers = room.players.filter(p => !p.eliminated && p.connected);
          if (alivePlayers.length === 1 && room.players.length > 1) {
            room.winnerId = alivePlayers[0].id;
            room.status = "finished";
            io.to(room.code).emit("room:notice", noticeMessage);
            io.to(room.code).emit("room:notice", `${alivePlayers[0].name} là người sống sót cuối cùng và giành chiến thắng!`);
            gameFinished = true;
          } else if (alivePlayers.length === 0) {
            room.status = "finished";
            io.to(room.code).emit("room:notice", noticeMessage);
            io.to(room.code).emit("room:notice", `Tất cả đã bị loại! Trận đấu hòa.`);
            gameFinished = true;
          }
        }

        if (gameFinished) {
          saveRoom(room);
          emitRoomState(room.code);
          continue;
        }

        let nextIndex = (currentIndex + 1) % room.players.length;
        if (room.mode === "themed") {
          let loopCount = 0;
          while (room.players[nextIndex]?.eliminated && loopCount < room.players.length) {
            nextIndex = (nextIndex + 1) % room.players.length;
            loopCount++;
          }
        }
        
        room.currentTurnPlayerId = room.players[nextIndex]?.id ?? null;
        room.turnStartedAt = currentTime;
        room.updatedAt = currentTime;
        
        saveRoom(room);
        emitRoomState(room.code);
        io.to(room.code).emit("room:notice", noticeMessage);
      }
    }

    // Bomb Mode ticking check
    if (room.mode === "bomb" && room.bombStartedAt && room.bombHolderId) {
      const bombElapsed = (currentTime - room.bombStartedAt) / 1000;
      if (bombElapsed >= room.bombDuration) {
        // Boom! The bomb explodes!
        const holder = room.players.find(p => p.id === room.bombHolderId);
        if (holder) {
          holder.score = holder.score - 15;
          io.to(room.code).emit("room:notice", `💥 BÙM! Quả bom đã nổ trên tay của ${holder.name}! Bị trừ 15 điểm.`);
        }

        // Pass the bomb to a random OTHER player (different from the current holder if there is > 1 player)
        const otherPlayers = room.players.filter(p => p.id !== room.bombHolderId && p.connected);
        const candidates = otherPlayers.length > 0 ? otherPlayers : room.players;
        if (candidates.length > 0) {
          const randomIndex = Math.floor(Math.random() * candidates.length);
          room.bombHolderId = candidates[randomIndex]?.id ?? null;
        }
        
        // Reset the bomb timer
        room.bombStartedAt = currentTime;
        room.updatedAt = currentTime;
        
        saveRoom(room);
        emitRoomState(room.code);
      }
    }
  }
}, 1000);

httpServer.listen(port, () => {
  console.log(`[word-chain] server listening on http://localhost:${port}`);
  console.log(`[word-chain] dictionary loaded: ${dictionary.size.toLocaleString("en-US")} words`);
});
