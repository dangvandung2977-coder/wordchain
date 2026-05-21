import { Trophy, Crown, Wifi, WifiOff, Bomb, Heart, Skull } from "lucide-react";
import type { PublicRoomState } from "../lib/types";

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const RANK_LABELS = ["🥇", "🥈", "🥉"];

export function Scoreboard({
  room,
  variant = "list",
  selfId,
}: {
  room: PublicRoomState;
  variant?: "list" | "progress";
  selfId?: string;
}) {
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  if (variant === "progress") {
    return (
      <section className="panel-card progress-card">
        <div className="progress-header">
          <Trophy size={18} color="var(--warning)" />
          <h3>First to <span style={{ color: "var(--accent-cyan)" }}>{room.targetScore}</span> pts wins!</h3>
        </div>
        <div className="progress-grid">
          {sortedPlayers.map((player, index) => {
            const pct = Math.min((player.score / room.targetScore) * 100, 100);
            const isTurn = player.id === room.currentTurnPlayerId;
            const isSelf = player.id === selfId;
            return (
              <div key={player.id} className={`progress-row ${isTurn ? "active-turn" : ""}`}>
                <div className="prog-rank">
                  {index < 3 ? (
                    <span className="rank-emoji">{RANK_LABELS[index]}</span>
                  ) : (
                    <span className="rank-num">#{index + 1}</span>
                  )}
                </div>
                <div className="prog-name">
                  {player.name}
                  {isSelf && <span className="you-badge">YOU</span>}
                  {isTurn && <span className="turn-indicator">▶</span>}
                  {room.mode === "bomb" && room.bombHolderId === player.id && (
                    <span className="bomb-badge-text" style={{ display: "inline-flex", marginLeft: 6, animation: "bomb-text-shake 0.8s infinite" }}>
                      <Bomb size={14} color="var(--danger)" />
                    </span>
                  )}
                  {room.mode === "themed" && player.eliminated && (
                    <span className="eliminated-badge" style={{ display: "inline-flex", marginLeft: 6, color: "var(--danger)", fontSize: "0.7rem", fontWeight: "bold", alignItems: "center", gap: "2px" }}>
                      <Skull size={12} /> BỊ LOẠI
                    </span>
                  )}
                  {room.mode === "themed" && !player.eliminated && player.lives !== undefined && (
                    <span className="lives-badge" style={{ display: "inline-flex", marginLeft: 6, gap: "2px" }}>
                      {Array.from({ length: player.lives }).map((_, i) => (
                        <Heart key={i} size={12} color="var(--danger)" fill="var(--danger)" />
                      ))}
                    </span>
                  )}
                </div>
                <div className="prog-bar-bg">
                  <div
                    className="prog-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: isTurn
                        ? "linear-gradient(90deg, var(--accent-cyan), #00d2ff)"
                        : index === 0
                        ? "linear-gradient(90deg, #FFD700, #FFA500)"
                        : "var(--accent-purple)",
                    }}
                  />
                </div>
                <div className="prog-score">
                  {player.score} <span>/ {room.targetScore}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // List variant (left sidebar)
  return (
    <section className="panel-card players-list-sidebar-card">
      <div className="panel-title">
        <Trophy size={18} />
        PLAYERS
        <span className="player-count-badge">{room.players.length} / 8</span>
      </div>
      <div className="player-list-compact">
        {sortedPlayers.map((player, index) => {
          const isTurn = player.id === room.currentTurnPlayerId;
          const isSelf = player.id === selfId;
          return (
            <div
              key={player.id}
              className={`player-item ${isTurn ? "active" : ""} ${isSelf ? "self" : ""} ${player.eliminated ? "eliminated" : ""}`}
              style={{ opacity: player.eliminated ? 0.5 : 1, filter: player.eliminated ? 'grayscale(1)' : 'none' }}
            >
              <div className="player-rank-col">
                {index < 3 ? (
                  <span style={{ fontSize: "1rem" }}>{RANK_LABELS[index]}</span>
                ) : (
                  <span className="rank-num-small">#{index + 1}</span>
                )}
              </div>
              <div className="avatar-ring">
                <img
                  src={player.avatar ? (player.avatar.startsWith("http") || player.avatar.startsWith("/") ? player.avatar : `https://api.dicebear.com/7.x/${player.avatar}&backgroundColor=0a0b1e`) : `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(player.name)}&backgroundColor=0a0b1e`}
                  alt={player.name}
                />
              </div>
              <div className="player-info">
                <div className="player-name">
                  {player.name}
                  {player.isHost && <Crown size={11} color="var(--warning)" style={{ marginLeft: 4 }} />}
                  {isSelf && <span className="you-tag">you</span>}
                  {room.mode === "bomb" && room.bombHolderId === player.id && (
                    <span className="bomb-badge-text" style={{ display: "inline-flex", marginLeft: 6, verticalAlign: "middle" }}>
                      <Bomb size={12} />
                    </span>
                  )}
                  {room.mode === "themed" && player.eliminated && (
                    <span className="eliminated-badge" style={{ display: "inline-flex", marginLeft: 6, color: "var(--danger)" }}>
                      <Skull size={12} />
                    </span>
                  )}
                  {room.mode === "themed" && !player.eliminated && player.lives !== undefined && (
                    <div style={{ display: "flex", gap: "2px", marginTop: "2px" }}>
                      {Array.from({ length: player.lives }).map((_, i) => (
                        <Heart key={i} size={10} color="var(--danger)" fill="var(--danger)" />
                      ))}
                    </div>
                  )}
                </div>
                {isTurn && room.status === "playing" && (
                  <div className="player-status">● PLAYING NOW</div>
                )}
                {!player.connected && (
                  <div className="player-status disconnected">
                    <WifiOff size={10} /> offline
                  </div>
                )}
              </div>
              <div className="player-score-compact">
                <div className="score-num">{player.score}</div>
                <div className="score-unit">pts</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
