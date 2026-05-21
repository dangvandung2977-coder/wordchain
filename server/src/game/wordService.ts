import type { Room, WordEntry } from "../types/game.js";
import { isAlphaWord, now, sanitizeWord } from "../lib/utils.js";
import { themeDictionaries } from "../lib/dictionary.js";

export function submitWord(input: {
  room: Room;
  playerId: string;
  rawWord: string;
  dictionary: Set<string>;
}): { ok: true; entry: WordEntry } | { ok: false; error: string } {
  const { room, playerId, dictionary } = input;
  const word = sanitizeWord(input.rawWord);

  if (room.status !== "playing") {
    return { ok: false, error: "Trận chưa bắt đầu hoặc đã kết thúc." };
  }

  if (room.currentTurnPlayerId !== playerId) {
    return { ok: false, error: "Chưa đến lượt bạn." };
  }

  const player = room.players.find((item) => item.id === playerId);
  if (!player) {
    return { ok: false, error: "Không tìm thấy người chơi." };
  }

  if (!isAlphaWord(word)) {
    return { ok: false, error: "Chỉ được nhập chữ cái a-z." };
  }

  if (word.length < 2) {
    return { ok: false, error: "Từ phải có ít nhất 2 ký tự." };
  }

  // Check theme
  const activeDictionary = room.theme && themeDictionaries[room.theme] ? themeDictionaries[room.theme] : dictionary;

  if (room.theme && themeDictionaries[room.theme]) {
    if (!themeDictionaries[room.theme].has(word)) {
      return { ok: false, error: `Từ này không thuộc chủ đề ${room.theme}.` };
    }
  } else {
    if (!dictionary.has(word)) {
      return { ok: false, error: "Từ này không có trong từ điển." };
    }
  }

  if (room.usedWords.has(word)) {
    return { ok: false, error: "Từ này đã được dùng rồi." };
  }

  if (room.bannedLetter && word.includes(room.bannedLetter)) {
    return { ok: false, error: `Chế độ hiện tại cấm chữ "${room.bannedLetter}".` };
  }
  
  let currentMinLen = room.minWordLength;
  if (room.mode === "escalating") {
    currentMinLen = Math.min(10, Math.floor(room.usedWords.size / 3) + 2);
  }

  if (word.length < currentMinLen) {
    return { ok: false, error: `Từ phải có ít nhất ${currentMinLen} ký tự.` };
  }
  
  if (word.length > room.maxWordLength) {
    return { ok: false, error: `Từ chỉ được có tối đa ${room.maxWordLength} ký tự.` };
  }

  if (room.mode !== "themed") {
    if (room.lastWord) {
      const expectedStart = room.lastWord.slice(-room.chainLength);
      if (!word.startsWith(expectedStart)) {
        return { ok: false, error: `Từ mới phải bắt đầu bằng "${expectedStart}".` };
      }
    } else if (room.forcedStartLetter) {
      if (!word.startsWith(room.forcedStartLetter)) {
        return { ok: false, error: `Từ đầu tiên phải bắt đầu bằng chữ "${room.forcedStartLetter}".` };
      }
    }
  }

  const points = word.length;

  if (room.mode === "themed" || player.score + points < room.targetScore) {
    const suffix = word.slice(-room.chainLength);
    let hasValidContinuation = false;
    let nextMinLen = room.minWordLength;
    if (room.mode === "escalating") {
      nextMinLen = Math.min(10, Math.floor((room.usedWords.size + 1) / 3) + 2);
    }
    
    for (const dictWord of activeDictionary) {
      const matchChain = room.mode === "themed" ? true : dictWord.startsWith(suffix);
      if (matchChain && dictWord !== word && !room.usedWords.has(dictWord)) {
        if (room.bannedLetter && dictWord.includes(room.bannedLetter)) continue;
        if (dictWord.length < nextMinLen) continue;
        if (dictWord.length > room.maxWordLength) continue;
        
        hasValidContinuation = true;
        break;
      }
    }
    if (!hasValidContinuation) {
      const errorMsg = room.mode === "themed"
        ? "Đã hết từ vựng thuộc chủ đề này để tiếp tục!"
        : `Từ này cụt đường đi! Không có từ nào bắt đầu bằng "${suffix}" để tiếp tục.`;
      return { ok: false, error: errorMsg };
    }
  }

  player.score += points;
  room.usedWords.add(word);
  room.lastWord = word;

  const entry: WordEntry = {
    id: `${now()}-${Math.random().toString(16).slice(2)}`,
    playerId: player.id,
    playerName: player.name,
    word,
    points,
    createdAt: now()
  };

  room.history.push(entry);

  if (room.mode !== "themed" && player.score >= room.targetScore) {
    room.status = "finished";
    room.winnerId = player.id;
    room.currentTurnPlayerId = null;
    room.turnStartedAt = null;
    room.bombHolderId = null;
    room.bombStartedAt = null;
  } else {
    room.currentTurnPlayerId = nextPlayerId(room, player.id);
    room.turnStartedAt = now();
    if (room.mode === "bomb") {
      room.bombHolderId = nextPlayerId(room, player.id);
    }
  }

  room.updatedAt = now();
  return { ok: true, entry };
}

function nextPlayerId(room: Room, currentPlayerId: string): string | null {
  if (room.players.length === 0) return null;
  const currentIndex = room.players.findIndex((player) => player.id === currentPlayerId);
  let nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % room.players.length;
  
  if (room.mode === "themed") {
    let loopCount = 0;
    while (room.players[nextIndex]?.eliminated && loopCount < room.players.length) {
      nextIndex = (nextIndex + 1) % room.players.length;
      loopCount++;
    }
  }
  
  return room.players[nextIndex]?.id ?? null;
}
