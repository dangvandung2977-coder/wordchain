import { Trophy, Play, RotateCcw, Clock, Users, Settings, ChevronUp, ChevronDown, Bomb, Globe, AlertCircle } from "lucide-react";
import { FormEvent, useMemo, useRef, useEffect, useState } from "react";
import type { GameMode, PublicRoomState, ThemeChoice } from "../lib/types";
import { Keyboard } from "./Keyboard";
import { fireVictoryConfetti } from "../lib/confetti";

export function TurnPanel({
  room,
  selfId,
  onSubmitWord,
  onStartGame,
  onResetGame,
  onUpdateSettings,
  busy,
  error,
  showSettings,
  setShowSettings
}: {
  room: PublicRoomState;
  selfId: string;
  onSubmitWord: (word: string) => Promise<boolean>;
  onStartGame: () => void;
  onResetGame: () => void;
  onUpdateSettings?: (patch: { turnDuration?: number; bombDuration?: number; targetScore?: number; mode?: GameMode; bannedLetterChoice?: string; minWordLength?: number; maxWordLength?: number; forcedStartLetterChoice?: string; theme?: ThemeChoice | null }) => void;
  busy: boolean;
  error: string | null;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [word, setWord] = useState("");
  const [shake, setShake] = useState(false);
  const [localDuration, setLocalDuration] = useState(room.turnDuration);
  const [localScore, setLocalScore] = useState(room.targetScore);
  const [localBombDuration, setLocalBombDuration] = useState(room.bombDuration || 45);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if room state changes
  useEffect(() => { setLocalDuration(room.turnDuration); }, [room.turnDuration]);
  useEffect(() => { setLocalScore(room.targetScore); }, [room.targetScore]);
  useEffect(() => { setLocalBombDuration(room.bombDuration || 45); }, [room.bombDuration]);

  const self = useMemo(() => room.players.find((p) => p.id === selfId), [room.players, selfId]);
  const isHost = Boolean(self?.isHost);
  const isMyTurn = room.status === "playing" && room.currentTurnPlayerId === selfId;
  const currentPlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);
  const winner = useMemo(() => room.players.find((p) => p.id === room.winnerId), [room.players, room.winnerId]);

  const [bombElapsed, setBombElapsed] = useState(0);

  useEffect(() => {
    if (room.status !== "playing" || room.mode !== "bomb" || !room.bombStartedAt) return;
    const serverTime = room.serverTime ?? Date.now();
    const offset = Date.now() - serverTime;

    setBombElapsed((Date.now() - offset - room.bombStartedAt) / 1000);
    const interval = setInterval(() => {
      const elapsedSec = (Date.now() - offset - room.bombStartedAt!) / 1000;
      setBombElapsed(elapsedSec);
    }, 100);
    return () => clearInterval(interval);
  }, [room.status, room.mode, room.bombStartedAt, room.serverTime]);

  const bombTimeLeft = room.bombDuration != null && room.bombStartedAt != null
    ? Math.max(0, room.bombDuration - bombElapsed)
    : 0;
  const bombTimePercent = room.bombDuration ? (bombTimeLeft / room.bombDuration) * 100 : 0;
  const isBombCritical = bombTimeLeft <= 10;
  const bombHolder = useMemo(() => room.players.find(p => p.id === room.bombHolderId), [room.players, room.bombHolderId]);
  const isIBombHolder = room.bombHolderId === selfId;

  // Auto-focus when it's my turn
  useEffect(() => {
    if (isMyTurn) inputRef.current?.focus();
  }, [isMyTurn]);

  // Shake on error
  useEffect(() => {
    if (error) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, [error]);

  // Fire victory confetti when status is finished
  useEffect(() => {
    if (room.status === "finished") {
      fireVictoryConfetti();
    }
  }, [room.status]);

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!word.trim() || busy || !isMyTurn) return;
    const ok = await onSubmitWord(word);
    if (ok) setWord("");
  }

  const handleKey = (key: string) => {
    if (word.length < 64) setWord(prev => prev + key);
  };

  const handleBackspace = () => setWord(prev => prev.slice(0, -1));

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (room.status === "lobby") {
    const canStart = isHost && room.players.length >= 2;
    return (
      <section className="panel-card main-input-card lobby-screen">
        <div className="lobby-orb">
          <Play size={36} fill="currentColor" />
        </div>
        <h2 className="lobby-title">Waiting for Players</h2>

        <div className="lobby-players-preview">
          {room.players.map((p) => (
            <div key={p.id} className="lobby-player-chip">
              <img
                src={p.avatar ? (p.avatar.startsWith("http") || p.avatar.startsWith("/") ? p.avatar : `https://api.dicebear.com/7.x/${p.avatar}&backgroundColor=0a0b1e`) : `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(p.name)}&backgroundColor=0a0b1e`}
                alt={p.name} className="chip-avatar"
              />
              <span>{p.name}</span>
              {p.isHost && <span className="chip-host">HOST</span>}
            </div>
          ))}
          {room.players.length < 2 && (
            <div className="lobby-player-chip waiting">
              <div className="chip-avatar ghost" />
              <span>Waiting...</span>
            </div>
          )}
        </div>

        <p className="lobby-status-text">
          {isHost
            ? room.players.length < 2
              ? "Need at least 2 players to start."
              : `${room.players.length} players ready — let's go!`
            : "Waiting for the host to start..."}
        </p>

        {/* Host Settings */}
        {isHost && (
          <div className="lobby-settings-section">
            <button className="lobby-settings-toggle" onClick={() => setShowSettings(v => !v)}>
              <Settings size={15} />
              Room Settings
              {showSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showSettings && (
              <div className="lobby-settings-panel">
                {/* Game Mode Selector */}
                <div className="setting-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.50rem', marginBottom: '0.50rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Globe size={13} /> Select Game Mode</label>
                  <div className="mode-pill-group" style={{ display: 'flex', gap: '0.35rem', width: '100%', flexWrap: 'wrap' }}>
                    <button type="button" className={`mode-pill ${room.mode === "basic" ? "active" : ""}`} onClick={() => onUpdateSettings?.({ mode: "basic" })}>Classic</button>
                    <button type="button" className={`mode-pill ${room.mode === "bomb" ? "active" : ""}`} onClick={() => onUpdateSettings?.({ mode: "bomb" })}>Bomb</button>
                    <button type="button" className={`mode-pill ${room.mode === "hard_chain" ? "active" : ""}`} onClick={() => onUpdateSettings?.({ mode: "hard_chain" })}>Hard Chain</button>
                    <button type="button" className={`mode-pill ${room.mode === "ban_letter" ? "active" : ""}`} onClick={() => onUpdateSettings?.({ mode: "ban_letter" })}>Ban Letter</button>
                    <button type="button" className={`mode-pill ${room.mode === "escalating" ? "active" : ""}`} onClick={() => onUpdateSettings?.({ mode: "escalating" })}>Escalating</button>
                    <button type="button" className={`mode-pill ${room.mode === "themed" ? "active" : ""}`} onClick={() => onUpdateSettings?.({ mode: "themed" })}>Themed</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.6rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Globe size={14} /> Word Length</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select value={room.minWordLength ?? 2} onChange={(e) => onUpdateSettings?.({ minWordLength: parseInt(e.target.value) })} style={{ background: 'var(--bg-card)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '0.35rem 0.6rem', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <option value="2">Min 2</option>
                        <option value="3">Min 3</option>
                        <option value="4">Min 4</option>
                        <option value="5">Min 5</option>
                        <option value="6">Min 6</option>
                        <option value="7">Min 7</option>
                        <option value="8">Min 8</option>
                      </select>
                      <select value={room.maxWordLength ?? 64} onChange={(e) => onUpdateSettings?.({ maxWordLength: parseInt(e.target.value) })} style={{ background: 'var(--bg-card)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '0.35rem 0.6rem', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <option value="64">No Max</option>
                        <option value="12">Max 12</option>
                        <option value="10">Max 10</option>
                        <option value="8">Max 8</option>
                        <option value="6">Max 6</option>
                      </select>
                    </div>
                  </div>

                  <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.6rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><AlertCircle size={14} /> Forced Start Letter</label>
                    <select value={room.forcedStartLetterChoice ?? "none"} onChange={(e) => onUpdateSettings?.({ forcedStartLetterChoice: e.target.value })} style={{ background: 'var(--bg-card)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '0.35rem 0.6rem', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <option value="none">None</option>
                      <option value="random">Random Letter</option>
                      {Array.from("abcdefghijklmnopqrstuvwxyz").map(l => (
                        <option key={l} value={l}>Start with {l.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {room.mode === "ban_letter" && (
                    <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.6rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><AlertCircle size={14} /> Banned Letter</label>
                      <select value={room.bannedLetterChoice ?? "random"} onChange={(e) => onUpdateSettings?.({ bannedLetterChoice: e.target.value })} style={{ background: 'var(--bg-card)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '0.35rem 0.6rem', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <option value="random">Random Letter</option>
                        {Array.from("abcdefghijklmnopqrstuvwxyz").map(l => (
                          <option key={l} value={l}>Ban {l.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {room.mode === "themed" && (
                    <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.6rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Globe size={14} /> Theme</label>
                      <select value={room.theme ?? "animals"} onChange={(e) => onUpdateSettings?.({ theme: e.target.value as ThemeChoice })} style={{ background: 'var(--bg-card)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '0.35rem 0.6rem', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <option value="animals">Animals</option>
                        <option value="colors">Colors</option>
                        <option value="countries">Countries</option>
                        <option value="food">Food</option>
                        <option value="fruits">Fruits</option>
                      </select>
                    </div>
                  )}

                  <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.6rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} /> Turn Duration</label>
                    <div className="setting-stepper">
                      <button onClick={() => { const v = Math.max(10, localDuration - 5); setLocalDuration(v); onUpdateSettings?.({ turnDuration: v }); }}>−</button>
                      <span>{localDuration}s</span>
                      <button onClick={() => { const v = Math.min(60, localDuration + 5); setLocalDuration(v); onUpdateSettings?.({ turnDuration: v }); }}>+</button>
                    </div>
                  </div>

                  <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.6rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Trophy size={14} /> Target Score</label>
                    <div className="setting-stepper">
                      <button onClick={() => { const v = Math.max(20, localScore - 20); setLocalScore(v); onUpdateSettings?.({ targetScore: v }); }}>−</button>
                      <span>{localScore} pts</span>
                      <button onClick={() => { const v = Math.min(500, localScore + 20); setLocalScore(v); onUpdateSettings?.({ targetScore: v }); }}>+</button>
                    </div>
                  </div>

                  {room.mode === "bomb" && (
                    <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.6rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Bomb size={14} /> Bomb Time</label>
                      <div className="setting-stepper">
                        <button onClick={() => { const v = Math.max(20, localBombDuration - 5); setLocalBombDuration(v); onUpdateSettings?.({ bombDuration: v }); }}>−</button>
                        <span>{localBombDuration}s</span>
                        <button onClick={() => { const v = Math.min(90, localBombDuration + 5); setLocalBombDuration(v); onUpdateSettings?.({ bombDuration: v }); }}>+</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {isHost && (
          <button
            className={`start-btn ${canStart ? "ready" : "disabled"}`}
            onClick={onStartGame}
            disabled={!canStart || busy}
          >
            <Play size={22} fill="currentColor" />
            {busy ? "Starting..." : "START MATCH"}
          </button>
        )}

        <div className="lobby-info-row">
          <span><Clock size={14} /> {room.turnDuration}s per turn</span>
          <span><Users size={14} /> Max 8 players</span>
          <span><Trophy size={14} /> {room.targetScore} pts to win</span>
        </div>
      </section>
    );
  }

  // ── FINISHED ──────────────────────────────────────────────────────────────
  if (room.status === "finished") {
    const sorted = [...room.players].sort((a, b) => b.score - a.score);
    return (
      <section className="panel-card main-input-card winner-screen winner-glow-card">
        <div className="winner-confetti" aria-hidden>{"🎉🏆🎊✨🌟"}</div>
        <Trophy size={70} color="var(--warning)" className="winner-trophy winner-glow" />
        <h2 className="winner-name">{winner?.name ?? "Player"} WINS!</h2>
        <p className="winner-score">with {winner?.score} points</p>

        <div className="final-podium">
          {sorted.slice(0, 3).map((p, i) => (
            <div key={p.id} className={`podium-entry rank-${i + 1}`}>
              <span className="podium-rank">{["🥇", "🥈", "🥉"][i]}</span>
              <span className="podium-name">{p.name}</span>
              <span className="podium-score">{p.score} pts</span>
            </div>
          ))}
        </div>

        {isHost && (
          <button className="reset-btn" onClick={onResetGame} disabled={busy}>
            <RotateCcw size={18} />
            Play Again
          </button>
        )}
      </section>
    );
  }

  // ── PLAYING ───────────────────────────────────────────────────────────────
  const requiredLetter = room.requiredStart?.toUpperCase() ?? null;
  const wordLetters = word.toUpperCase().split("");

  return (
    <section className={`panel-card main-input-card playing-screen ${isMyTurn ? "my-turn" : ""}`}>
      {/* Turn indicator */}
      <div className={`turn-banner ${isMyTurn ? "my-turn-banner" : ""}`}>
        {isMyTurn ? (
          room.mode === "themed" ? (
            <span>⚡ Your Turn! Type a word belonging to theme <strong>{room.theme ? room.theme.charAt(0).toUpperCase() + room.theme.slice(1) : ""}</strong></span>
          ) : (
            <span>⚡ Your Turn! Type a word starting with <strong>{requiredLetter ?? "any letter"}</strong></span>
          )
        ) : (
          room.mode === "themed" ? (
            <span>⏳ <strong>{currentPlayer?.name ?? "..."}</strong>'s turn (Theme: <strong>{room.theme ? room.theme.charAt(0).toUpperCase() + room.theme.slice(1) : ""}</strong>)</span>
          ) : (
            <span>
              ⏳ <strong>{currentPlayer?.name ?? "..."}</strong>'s turn
            </span>
          )
        )}
      </div>

      {/* Bomb Mode indicator */}
      {room.mode === "bomb" && bombHolder && (
        <div className={`bomb-active-indicator ${isIBombHolder ? "bomb-holder-banner" : ""}`}>
          <div className="bomb-active-header">
            <span className="bomb-badge-text">
              <Bomb size={16} /> BOMB HOLDER: {bombHolder.name} {isIBombHolder && "(YOU!)"}
            </span>
            <span className="bomb-time-text">{Math.ceil(bombTimeLeft)}s left</span>
          </div>
          <div className="bomb-timer-container">
            <div
              className={`bomb-timer-bar ${isBombCritical ? "critical" : ""}`}
              style={{ width: `${bombTimePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Previous word display */}
      <div className="prev-word-section">
        <p className="prev-word-label">PREVIOUS WORD</p>
        <div className="big-word">
          {room.lastWord
            ? room.lastWord.toUpperCase().split("").map((ch, i) => (
                <span
                  key={i}
                  className={`word-letter ${room.mode !== "themed" && i === room.lastWord!.length - 1 ? "last-letter" : ""}`}
                >
                  {ch}
                </span>
              ))
            : <span className="word-letter">—</span>}
        </div>
      </div>

      {/* Required start */}
      {requiredLetter && (
        <div className="required-start-row">
          <div className="letter-circle pulse">{requiredLetter}</div>
          <p className="hint-text">
            Must start with <span>{requiredLetter}</span>
          </p>
        </div>
      )}

      {/* Input */}
      <form className={`game-input-container ${shake ? "shake" : ""}`} onSubmit={submit}>
        <div className="word-preview-row">
          {wordLetters.length > 0
            ? wordLetters.map((ch, i) => (
                <span key={i} className={`typed-letter ${i === 0 && requiredLetter && ch === requiredLetter ? "correct-start" : ""}`}>
                  {ch}
                </span>
              ))
            : <span className="typed-placeholder">{isMyTurn ? "Start typing..." : "Waiting..."}</span>}
        </div>
        <div className="input-row">
          <input
            ref={inputRef}
            className="main-input"
            value={word}
            onChange={(e) => setWord(e.target.value.toLowerCase())}
            disabled={!isMyTurn || busy}
            placeholder={isMyTurn ? "Type your word..." : `${currentPlayer?.name ?? "..."} is typing...`}
            autoComplete="off"
            spellCheck={false}
            maxLength={64}
          />
          <button
            className="submit-btn"
            disabled={!isMyTurn || busy || !word.trim()}
          >
            {busy ? <span className="loading-dots" /> : "SUBMIT"}
          </button>
        </div>
      </form>

      {error && (
        <div className="word-error">
          ⚠ {error}
        </div>
      )}

      {/* Keyboard */}
      {isMyTurn && (
        <div className="game-keyboard-container">
          <Keyboard
            onKey={handleKey}
            onBackspace={handleBackspace}
            onSubmit={() => submit()}
            disabled={busy}
            bannedLetter={room.mode === "ban_letter" ? room.bannedLetter : null}
            requiredStart={room.requiredStart}
            currentWord={word}
          />
        </div>
      )}
    </section>
  );
}
