import { History, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { PublicRoomState } from "../lib/types";

export function HistoryPanel({ room }: { room: PublicRoomState }) {
  const [expanded, setExpanded] = useState(false);
  const reversed = [...room.history].reverse();
  const recentWords = expanded ? reversed.slice(0, 20) : reversed.slice(0, 6);

  return (
    <section className="panel-card side-panel-section">
      <div className="panel-title">
        <History size={18} />
        WORD HISTORY
        <span className="history-count">{room.history.length}</span>
      </div>
      <div className="word-history-list">
        {recentWords.length === 0 && (
          <div className="empty-history">
            <div className="empty-history-icon">📝</div>
            <p>No words yet. Be the first!</p>
          </div>
        )}
        {recentWords.map((item, index) => (
          <div
            key={item.id}
            className="word-history-item"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="word-rank">#{room.history.length - index}</div>
            <div className="word-main">
              <div className="word-text">{item.word.toUpperCase()}</div>
              <div className="word-meta">
                by <span>{item.playerName}</span>
              </div>
            </div>
            <div className="word-points">+{item.points ?? item.word.length}</div>
          </div>
        ))}
      </div>
      {room.history.length > 6 && (
        <button
          className="history-expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <><ChevronUp size={14} /> Show Less</>
          ) : (
            <><ChevronDown size={14} /> Show All ({room.history.length})</>
          )}
        </button>
      )}
    </section>
  );
}
