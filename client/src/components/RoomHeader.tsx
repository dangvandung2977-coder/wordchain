import { Copy, Users, Zap, ShieldBan, Lock, Check, Link2, Bomb, Trophy } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { PublicRoomState } from "../lib/types";

export function RoomHeader({ room }: { room: PublicRoomState }) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(room.turnDuration);
  const svgRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (room.status !== "playing" || !room.turnStartedAt) {
      setTimeLeft(room.turnDuration);
      return;
    }
    const serverTime = room.serverTime ?? Date.now();
    const offset = Date.now() - serverTime;

    const timer = setInterval(() => {
      const now = Date.now() - offset;
      const elapsed = Math.floor((now - room.turnStartedAt!) / 1000);
      const remaining = Math.max(0, room.turnDuration - elapsed);
      setTimeLeft(remaining);
    }, 200);
    return () => clearInterval(timer);
  }, [room.status, room.turnStartedAt, room.turnDuration, room.serverTime]);

  // SVG circular progress
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / room.turnDuration;
  const offset = circumference * (1 - progress);
  const isLowTime = timeLeft <= 5;

  const copyLink = () => {
    const url = `${window.location.origin}/room/${room.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modeConfig = {
    basic: { icon: <Zap size={16} />, label: "Basic", color: "var(--accent-cyan)" },
    ban_letter: {
      icon: <ShieldBan size={16} />,
      label: room.bannedLetter ? `Ban: ${room.bannedLetter.toUpperCase()}` : "Ban Letter",
      color: "var(--accent-purple)"
    },
    hard_chain: { icon: <Lock size={16} />, label: "Hard Chain", color: "#ff9900" },
    bomb: { icon: <Bomb size={16} />, label: "Bomb Mode", color: "var(--danger)" },
    escalating: { icon: <Zap size={16} />, label: "Escalating", color: "var(--accent-pink)" },
    themed: { icon: <Zap size={16} />, label: room.theme ? `Theme: ${room.theme.charAt(0).toUpperCase() + room.theme.slice(1)}` : "Themed", color: "var(--success)" }
  };
  const currentMode = modeConfig[room.mode];

  return (
    <section className="top-stats-grid">
      {/* Room Code */}
      <div className="stats-card room-code-card">
        <span className="label">Room Code</span>
        <div className="room-code-box">
          <strong>{room.code}</strong>
          <button className="icon-btn" onClick={copyLink} title="Copy invite link" aria-label="Copy link">
            {copied ? <Check size={15} color="var(--success)" /> : <Copy size={15} />}
          </button>
          <button className="icon-btn" onClick={copyLink} title="Copy invite link" aria-label="Share">
            <Link2 size={15} />
          </button>
        </div>
        {copied && <span className="copy-toast">Link copied!</span>}
      </div>

      {/* Game Mode */}
      <div className="stats-card mode-card">
        <span className="label">Game Mode</span>
        <div className="active-mode-badge" style={{ borderColor: currentMode.color, color: currentMode.color }}>
          {currentMode.icon}
          {currentMode.label}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
          {room.mode === 'basic' && "Standard word chain rules"}
          {room.mode === 'bomb' && `${room.bombDuration}s countdown potato`}
          {room.mode === 'hard_chain' && "Share last 2 characters"}
          {room.mode === 'ban_letter' && (room.bannedLetterChoice === 'random' ? "Random letter banned" : `Letter ${room.bannedLetterChoice?.toUpperCase()} banned`)}
          {room.mode === 'escalating' && "Min length increases!"}
          {room.mode === 'themed' && "Stick to the topic!"}
        </div>
      </div>

      {/* Win Goal */}
      <div className="stats-card win-goal-card">
        <span className="label">Win Goal</span>
        <div className="win-goal-display" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          <Trophy size={18} color="var(--warning)" fill="var(--warning)" style={{ filter: 'drop-shadow(0 0 5px rgba(255, 204, 0, 0.4))' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>
            {room.targetScore} <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)' }}>pts</span>
          </span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>First player to reach wins!</div>
      </div>

      {/* Timer */}
      <div className={`stats-card timer-card ${isLowTime ? "timer-danger" : ""}`}>
        <span className="label" style={{ color: isLowTime ? "var(--danger)" : "var(--text-dim)" }}>
          {room.status === "playing" ? "Time Left" : "Turn Timer"}
        </span>
        <div className="svg-timer">
          <svg width="72" height="72" viewBox="0 0 72 72">
            {/* Track */}
            <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            {/* Progress */}
            <circle
              ref={svgRef}
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke={isLowTime ? "var(--danger)" : "var(--accent-cyan)"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.3s linear, stroke 0.5s ease" }}
            />
            <text x="36" y="40" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif">
              {timeLeft}
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
