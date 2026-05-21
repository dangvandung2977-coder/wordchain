import { Delete } from "lucide-react";
import { useState, useEffect } from "react";

interface KeyboardProps {
  onKey: (key: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  bannedLetter?: string | null;
  requiredStart?: string | null;
  currentWord?: string;
}

export function Keyboard({ onKey, onBackspace, onSubmit, disabled, bannedLetter, requiredStart, currentWord }: KeyboardProps) {
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      const key = e.key.toLowerCase();
      if (/^[a-z]$/.test(key)) {
        if (bannedLetter?.toLowerCase() !== key) {
          setPressedKey(key);
        }
      } else if (e.key === "Backspace") {
        setPressedKey("⌫");
      } else if (e.key === "Enter") {
        setPressedKey("↵");
      }
    };

    const handleKeyUp = () => {
      setPressedKey(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [disabled, bannedLetter]);

  const row1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
  const row2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
  const row3 = ["z", "x", "c", "v", "b", "n", "m"];

  const VOWELS = ["a", "e", "i", "o", "u"];

  const handleKeyPress = (key: string) => {
    if (disabled) return;
    setPressedKey(key);
    onKey(key);
    setTimeout(() => setPressedKey(null), 120);
  };

  const handleBackspace = () => {
    if (disabled) return;
    setPressedKey("⌫");
    onBackspace();
    setTimeout(() => setPressedKey(null), 120);
  };

  const handleSubmit = () => {
    if (disabled) return;
    setPressedKey("↵");
    onSubmit();
    setTimeout(() => setPressedKey(null), 120);
  };

  const getKeyClass = (key: string) => {
    const isBanned = bannedLetter?.toLowerCase() === key;
    const isVowel = VOWELS.includes(key);
    const isRequired = requiredStart?.toLowerCase() === key && !currentWord;
    const isPressed = pressedKey === key;
    const classes = ["key"];
    if (isBanned) classes.push("banned");
    else if (isRequired) {
      classes.push("required");
      classes.push("required-start-glow");
    } else if (isVowel && bannedLetter) classes.push("vowel");
    if (isPressed) classes.push("pressed");
    return classes.join(" ");
  };

  const renderKey = (key: string) => (
    <button
      key={key}
      type="button"
      className={getKeyClass(key)}
      onClick={() => handleKeyPress(key)}
      disabled={disabled || bannedLetter?.toLowerCase() === key}
      aria-label={key.toUpperCase()}
    >
      {key.toUpperCase()}
      {bannedLetter?.toLowerCase() === key && <span className="key-ban-mark">✕</span>}
    </button>
  );

  return (
    <div className="keyboard-container game-keyboard">
      <div className="keyboard-row">
        {row1.map(renderKey)}
      </div>
      <div className="keyboard-row">
        {row2.map(renderKey)}
      </div>
      <div className="keyboard-row">
        <button
          type="button"
          className={`key wide-icon ${pressedKey === "⌫" ? "pressed" : ""}`}
          onClick={handleBackspace}
          disabled={disabled}
          aria-label="Backspace"
        >
          <Delete size={18} />
        </button>
        {row3.map(renderKey)}
        <button
          type="button"
          className={`key enter-key primary ${pressedKey === "↵" ? "pressed" : ""}`}
          onClick={handleSubmit}
          disabled={disabled}
          aria-label="Submit"
        >
          GO
        </button>
      </div>
    </div>
  );
}
