const PLAYER_ID_KEY = "word-chain-player-id";
const PLAYER_NAME_KEY = "word-chain-player-name";

function randomId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
  return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getOrCreatePlayerId(): string {
  const stored = localStorage.getItem(PLAYER_ID_KEY);
  if (stored) return stored;

  const id = randomId();
  localStorage.setItem(PLAYER_ID_KEY, id);
  return id;
}

export function getStoredPlayerName(): string {
  return localStorage.getItem(PLAYER_NAME_KEY) ?? "";
}

export function storePlayerName(name: string): void {
  localStorage.setItem(PLAYER_NAME_KEY, name.trim());
}

const PLAYER_AVATAR_KEY = "word-chain-player-avatar";

export function getStoredPlayerAvatar(): string {
  return localStorage.getItem(PLAYER_AVATAR_KEY) ?? "/avatars/icecream.jpg";
}

export function storePlayerAvatar(avatar: string): void {
  localStorage.setItem(PLAYER_AVATAR_KEY, avatar.trim());
}
