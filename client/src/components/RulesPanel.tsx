import { ShieldAlert, RefreshCcw, Link, Trophy } from "lucide-react";
import type { PublicRoomState } from "../lib/types";

export function RulesPanel({ room }: { room: PublicRoomState | null }) {
  const isThemed = room?.mode === "themed";
  const targetScore = room?.targetScore ?? 100;
  const themeName = room?.theme ? room.theme.charAt(0).toUpperCase() + room.theme.slice(1) : "";
  const chainLength = room?.chainLength ?? 1;

  return (
    <section className="panel-card side-panel-section">
      <div className="panel-title">
        <ShieldAlert size={18} />
        RULES & TIPS
      </div>
      <div className="rules-list">
        <div className="rule-item">
          <Trophy size={16} />
          <span><strong>1 character = 1 point</strong>. Longer words get more points!</span>
        </div>
        <div className="rule-item">
          < ShieldAlert size={16} style={{ color: 'var(--danger)' }} />
          <span><strong>No repeated words</strong> allowed in the same match.</span>
        </div>
        {isThemed ? (
          <div className="rule-item">
            <Link size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span>Must be a valid word from the theme: <strong>{themeName}</strong>. No letter chaining required!</span>
          </div>
        ) : (
          <div className="rule-item">
            <Link size={16} />
            <span>Word must start with the <strong>last {chainLength === 2 ? "2 letters" : "letter"}</strong> of the previous word.</span>
          </div>
        )}
        <div className="rule-item">
          <RefreshCcw size={16} style={{ color: 'var(--warning)' }} />
          <span>{isThemed ? <strong>Last player standing wins!</strong> : <>First to <strong>{targetScore} points</strong> wins the game!</>}</span>
        </div>
      </div>
    </section>
  );
}
