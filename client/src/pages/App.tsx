import {
  BrainCircuit,
  LogOut,
  MessageCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Settings,
  Globe,
  User,
  Edit3,
  Plus,
  LogIn,
  ArrowRight,
  ShieldBan,
  Lock,
  Link,
  Calendar,
  Star,
  Trophy,
  ShieldCheck,
  Users,
  Gift,
  X,
  Send,
  Clock,
  Zap,
  Bomb,
  AlertCircle
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { HistoryPanel } from "../components/HistoryPanel";
import { RoomHeader } from "../components/RoomHeader";
import { Scoreboard } from "../components/Scoreboard";
import { TurnPanel } from "../components/TurnPanel";
import { RulesPanel } from "../components/RulesPanel";
import { getSocket } from "../lib/socket";
import { getOrCreatePlayerId, getStoredPlayerName, storePlayerName, getStoredPlayerAvatar, storePlayerAvatar } from "../lib/session";
import type {
  ApiAck,
  GameMode,
  PublicRoomState,
  ThemeChoice
} from "../lib/types";

const socket = getSocket();

const AVATAR_PRESETS = [
  // 1. Premium Custom Gartic Characters (10 Uploaded Assets)
  { id: "/avatars/cactus.jpg", label: "Rockstar Cactus" },
  { id: "/avatars/ramen.jpg", label: "Cute Ramen Bowl" },
  { id: "/avatars/slot.jpg", label: "Pirate Slot" },
  { id: "/avatars/pencil.jpg", label: "Happy Pencil" },
  { id: "/avatars/shark.jpg", label: "Gamer Shark" },
  { id: "/avatars/icecream.jpg", label: "Star-glasses Ice Cream" },
  { id: "/avatars/pineapple.jpg", label: "Rockstar Pineapple" },
  { id: "/avatars/frog.jpg", label: "Wizard Frog" },
  { id: "/avatars/cow.jpg", label: "Unicorn Cow" },
  { id: "/avatars/duck.jpg", label: "Astronaut Duck" },

  // 2. Robohash Cats (16 presets - extremely colorful, funny, googly-eyed animal sticker look!)
  { id: "https://robohash.org/CoolCat?set=set4", label: "Cool Cat" },
  { id: "https://robohash.org/KingCat?set=set4", label: "King Cat" },
  { id: "https://robohash.org/NerdCat?set=set4", label: "Nerd Cat" },
  { id: "https://robohash.org/WizardCat?set=set4", label: "Wizard Cat" },
  { id: "https://robohash.org/PirateCat?set=set4", label: "Pirate Cat" },
  { id: "https://robohash.org/NinjaCat?set=set4", label: "Ninja Cat" },
  { id: "https://robohash.org/GamerCat?set=set4", label: "Gamer Cat" },
  { id: "https://robohash.org/DJCat?set=set4", label: "DJ Cat" },
  { id: "https://robohash.org/DetectiveCat?set=set4", label: "Detective Cat" },
  { id: "https://robohash.org/ChefCat?set=set4", label: "Chef Cat" },
  { id: "https://robohash.org/SantaCat?set=set4", label: "Santa Cat" },
  { id: "https://robohash.org/SpaceCat?set=set4", label: "Space Cat" },
  { id: "https://robohash.org/AngelCat?set=set4", label: "Angel Cat" },
  { id: "https://robohash.org/DevilCat?set=set4", label: "Devil Cat" },
  { id: "https://robohash.org/GentlemanCat?set=set4", label: "Gentleman Cat" },
  { id: "https://robohash.org/PrincessCat?set=set4", label: "Princess Cat" },

  // 3. Robohash Monsters (16 presets - extremely colorful, funny, googly-eyed creature sticker look!)
  { id: "https://robohash.org/TikiMonster?set=set3", label: "Tiki Monster" },
  { id: "https://robohash.org/CyclopsMonster?set=set3", label: "Cyclops Monster" },
  { id: "https://robohash.org/OctoMonster?set=set3", label: "Octo Monster" },
  { id: "https://robohash.org/AlienMonster?set=set3", label: "Alien Monster" },
  { id: "https://robohash.org/HornMonster?set=set3", label: "Horn Monster" },
  { id: "https://robohash.org/HappyMonster?set=set3", label: "Happy Monster" },
  { id: "https://robohash.org/GoofyMonster?set=set3", label: "Goofy Monster" },
  { id: "https://robohash.org/ShadesMonster?set=set3", label: "Shades Monster" },
  { id: "https://robohash.org/PirateMonster?set=set3", label: "Pirate Monster" },
  { id: "https://robohash.org/CrownMonster?set=set3", label: "Crown Monster" },
  { id: "https://robohash.org/NerdMonster?set=set3", label: "Nerd Monster" },
  { id: "https://robohash.org/WizardMonster?set=set3", label: "Wizard Monster" },
  { id: "https://robohash.org/RoboMonster?set=set3", label: "Robo Monster" },
  { id: "https://robohash.org/SpookyMonster?set=set3", label: "Spooky Monster" },
  { id: "https://robohash.org/WildMonster?set=set3", label: "Wild Monster" },
  { id: "https://robohash.org/GhostMonster?set=set3", label: "Ghost Monster" }
];

function roomFromPath(): string | null {
  const match = window.location.pathname.match(/^\/room\/([A-Za-z0-9_-]+)$/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function App() {
  const [routeRoomCode, setRouteRoomCode] = useState<string | null>(() => roomFromPath());
  const [playerId] = useState(() => getOrCreatePlayerId());
  const [name, setName] = useState(() => getStoredPlayerName());
  const [avatar, setAvatar] = useState(() => getStoredPlayerAvatar());
  const [joinCode, setJoinCode] = useState(() => roomFromPath() ?? "");
  const [room, setRoom] = useState<PublicRoomState | null>(null);
  const [targetScore, setTargetScore] = useState(100);
  const [turnDuration, setTurnDuration] = useState(20);
  const [bombDuration, setBombDuration] = useState(45);
  const [mode, setMode] = useState<GameMode>("basic");
  const [bannedLetterChoice, setBannedLetterChoice] = useState<string>("random");
  const [minWordLength, setMinWordLength] = useState<number>(2);
  const [maxWordLength, setMaxWordLength] = useState<number>(64);
  const [forcedStartLetterChoice, setForcedStartLetterChoice] = useState<string>("none");
  const [theme, setTheme] = useState<ThemeChoice | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [busy, setBusy] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [wordError, setWordError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [muted, setMuted] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatLog, setChatLog] = useState<{name:string;text:string;time:number}[]>([]);

  useEffect(() => {
    if (globalError || notice) {
      const timer = setTimeout(() => {
        setGlobalError(null);
        setNotice(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [globalError, notice]);

  const self = useMemo(() => room?.players.find((player) => player.id === playerId) ?? null, [room, playerId]);
  
  useEffect(() => {
    function onPopState() {
      const code = roomFromPath();
      setRouteRoomCode(code);
      setJoinCode(code ?? "");
      if (!code) setRoom(null);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    function onRoomState(nextRoom: PublicRoomState) {
      setRoom(nextRoom);
    }
    function onNotice(message: string) {
      setNotice(message);
      window.setTimeout(() => setNotice(null), 3200);
    }
    socket.on("room:state", onRoomState);
    socket.on("room:notice", onNotice);
    return () => {
      socket.off("room:state", onRoomState);
      socket.off("room:notice", onNotice);
    };
  }, []);

  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const code = routeRoomCode;
    if (!code || !name.trim()) return;

    setConnecting(true);
    const timeout = window.setTimeout(() => {
      socket.emit("room:join", { code, playerId, name: name.trim(), avatar }, (ack: ApiAck<PublicRoomState>) => {
        setConnecting(false);
        if (ack.ok && ack.data) {
          setRoom(ack.data);
          setGlobalError(null);
        } else {
          setGlobalError(ack.error ?? "Không thể vào phòng.");
        }
      });
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [routeRoomCode, playerId, name, avatar]);

  const createRoom = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalError(null);
    const safeName = name.trim();
    if (!safeName) return setGlobalError("Nhập tên trước đã.");
    setBusy(true);
    storePlayerName(safeName);
    storePlayerAvatar(avatar);
    socket.emit("room:create", { playerId, name: safeName, avatar, targetScore, mode, bannedLetterChoice, minWordLength, maxWordLength, forcedStartLetterChoice, theme, turnDuration, bombDuration }, (ack: ApiAck<PublicRoomState>) => {
      setBusy(false);
      if (!ack.ok || !ack.data) return setGlobalError(ack.error ?? "Tạo phòng thất bại.");
      setRoom(ack.data);
      navigate(`/room/${ack.data.code}`);
      setRouteRoomCode(ack.data.code);
      setJoinCode(ack.data.code);
    });
  }, [bannedLetterChoice, minWordLength, maxWordLength, forcedStartLetterChoice, theme, mode, name, playerId, targetScore, turnDuration, avatar, bombDuration, joinCode, routeRoomCode]);

  const joinRoom = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalError(null);
    const safeName = name.trim();
    const safeCode = (routeRoomCode || joinCode).trim().toUpperCase();
    if (!safeName) return setGlobalError("Nhập tên trước đã.");
    if (!safeCode) return setGlobalError("Nhập mã phòng.");
    setBusy(true);
    storePlayerName(safeName);
    storePlayerAvatar(avatar);
    socket.emit("room:join", { code: safeCode, playerId, name: safeName, avatar }, (ack: ApiAck<PublicRoomState>) => {
      setBusy(false);
      if (!ack.ok || !ack.data) return setGlobalError(ack.error ?? "Vào phòng thất bại.");
      setRoom(ack.data);
      navigate(`/room/${ack.data.code}`);
      setRouteRoomCode(ack.data.code);
    });
  }, [routeRoomCode, joinCode, name, avatar, playerId]);

  const startGame = useCallback(() => {
    if (!room) return;
    setBusy(true);
    socket.emit("game:start", { code: room.code, playerId }, (ack: ApiAck<PublicRoomState>) => {
      setBusy(false);
      if (!ack.ok) setGlobalError(ack.error ?? "Không thể bắt đầu.");
    });
  }, [playerId, room]);

  const resetGame = useCallback(() => {
    if (!room) return;
    setBusy(true);
    socket.emit("game:reset", { code: room.code, playerId }, (ack: ApiAck<PublicRoomState>) => {
      setBusy(false);
      if (!ack.ok) setGlobalError(ack.error ?? "Không thể reset phòng.");
    });
  }, [playerId, room]);

  const leaveRoom = useCallback(() => {
    if (!room) return navigate("/");
    socket.emit("room:leave", { code: room.code, playerId }, () => {
      setRoom(null);
      setRouteRoomCode(null);
      setJoinCode("");
      navigate("/");
    });
  }, [playerId, room]);

  const updateSettings = useCallback((patch: { turnDuration?: number; bombDuration?: number; targetScore?: number; mode?: GameMode; bannedLetterChoice?: string; minWordLength?: number; maxWordLength?: number; forcedStartLetterChoice?: string; theme?: ThemeChoice | null }) => {
    if (!room) return;
    socket.emit("room:settings" as any, { code: room.code, playerId, ...patch }, (ack: ApiAck<PublicRoomState>) => {
      if (!ack.ok) setGlobalError(ack.error ?? "Cập nhật thất bại.");
    });
  }, [playerId, room]);

  const submitWord = useCallback(async (word: string) => {
    if (!room) return false;
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) { setWordError("Nhập từ đã."); return false; }
    setWordError(null);
    setBusy(true);
    return new Promise<boolean>((resolve) => {
      socket.emit("word:submit", { code: room.code, playerId, word: trimmed }, (ack: ApiAck<PublicRoomState>) => {
        setBusy(false);
        if (!ack.ok) { setWordError(ack.error ?? "Từ không hợp lệ."); resolve(false); return; }
        resolve(true);
      });
    });
  }, [playerId, room]);

  if (!room) {
    return (
      <div className="landing-page-container">
        {/* Header */}
        <nav className="header-nav">
          <div className="logo-group">
            <div className="logo-icon"><BrainCircuit size={24} color="white" /></div>
            <div className="logo-text">Word Chain <span>Online</span></div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '1rem' }}>✦ Nối từ tiếng Anh ✦</div>
          </div>
          <div className="nav-actions">
            <button className="nav-btn" onClick={() => setShowHelp(true)}><HelpCircle size={18} /> How to Play</button>
            <button className="nav-btn" onClick={() => setMuted(prev => !prev)} title={muted ? 'Unmute' : 'Mute'}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button className="nav-btn" onClick={() => setShowSettings(v => !v)} style={{ borderColor: showSettings ? 'var(--accent-purple)' : '' }} title="Room Settings">
              <Settings size={18} />
            </button>
            <button className="nav-btn"><Globe size={18} /> English</button>
          </div>
        </nav>

        <main className="landing-shell">
          <div className="landing-main-column">
            {/* Main Banner */}
            <section className="banner-card">
              <div className="banner-content">
                <p className="eyebrow" style={{ color: 'var(--accent-cyan)' }}>
                  {routeRoomCode ? `Joining Room ${routeRoomCode}` : 'Word Chain Revolution'}
                </p>
                <h1>
                  {routeRoomCode ? `Ready to join ${routeRoomCode}?` : 'Play Word Chain '}
                  <span>{routeRoomCode ? '' : 'with Friends'}</span> ✨
                </h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '1rem', marginBottom: '1rem' }}>
                  {routeRoomCode 
                    ? `Enter your nickname below to jump into room ${routeRoomCode}!` 
                    : 'Create a room or join a room to start a thrilling word chain battle!'}
                </p>

                <div className="banner-forms">
                  <div className="banner-header-row" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div className="giant-avatar-preview-wrapper" style={{ flexShrink: 0 }}>
                      <img
                        src={avatar.startsWith("http") || avatar.startsWith("/") ? avatar : `https://api.dicebear.com/7.x/${avatar}&backgroundColor=0a0b1e`}
                        alt="Selected Avatar"
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: '50%',
                          border: '3px solid var(--accent-cyan)',
                          boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)',
                          background: 'rgba(10, 11, 30, 0.6)',
                          objectFit: 'cover',
                          transition: 'all 0.3s ease',
                          animation: 'avatar-pulse 2s infinite ease-in-out'
                        }}
                      />
                    </div>
                    <div style={{ flexGrow: 1, textAlign: 'left' }}>
                      <div className="input-group-premium" style={{ borderColor: routeRoomCode && !name ? 'var(--accent-cyan)' : '' }}>
                        <User size={20} color="var(--accent-cyan)" />
                        <input 
                          id="player-name-input"
                          autoFocus={!!routeRoomCode && !name}
                          placeholder="Your Nickname" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)}
                        />
                        <Edit3 size={18} color="var(--text-dim)" />
                      </div>

                    </div>
                  </div>

                  {/* Collapsible Match Options for Host */}
                  {!routeRoomCode && (
                    <details className="landing-settings-details" open={showSettings} onToggle={(e) => setShowSettings((e.target as HTMLDetailsElement).open)} style={{
                      marginBottom: '1rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '0.5rem 0.75rem',
                      textAlign: 'left'
                    }}>
                      <summary style={{
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        color: 'var(--accent-purple)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        userSelect: 'none',
                        outline: 'none'
                      }}>
                        <Settings size={15} />
                        Configure Game Modes & Settings
                      </summary>
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="setting-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Globe size={13} /> Select Game Mode</label>
                          <div className="mode-pill-group" style={{ display: 'flex', gap: '0.35rem', width: '100%', flexWrap: 'wrap' }}>
                            <button type="button" className={`mode-pill ${mode === "basic" ? "active" : ""}`} onClick={() => setMode("basic")}>Classic</button>
                            <button type="button" className={`mode-pill ${mode === "bomb" ? "active" : ""}`} onClick={() => setMode("bomb")}>Bomb</button>
                            <button type="button" className={`mode-pill ${mode === "hard_chain" ? "active" : ""}`} onClick={() => setMode("hard_chain")}>Hard Chain</button>
                            <button type="button" className={`mode-pill ${mode === "ban_letter" ? "active" : ""}`} onClick={() => setMode("ban_letter")}>Ban Letter</button>
                            <button type="button" className={`mode-pill ${mode === "escalating" ? "active" : ""}`} onClick={() => setMode("escalating")}>Escalating</button>
                            <button type="button" className={`mode-pill ${mode === "themed" ? "active" : ""}`} onClick={() => setMode("themed")}>Themed</button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                          <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.6rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Globe size={14} /> Word Length</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <select value={minWordLength} onChange={(e) => setMinWordLength(parseInt(e.target.value))} style={{ background: 'var(--bg-deep)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '0.35rem 0.6rem', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}>
                                <option value="2">Min 2</option>
                                <option value="3">Min 3</option>
                                <option value="4">Min 4</option>
                                <option value="5">Min 5</option>
                              </select>
                              <select value={maxWordLength} onChange={(e) => setMaxWordLength(parseInt(e.target.value))} style={{ background: 'var(--bg-deep)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '0.35rem 0.6rem', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}>
                                <option value="64">No Max</option>
                                <option value="12">Max 12</option>
                                <option value="10">Max 10</option>
                                <option value="8">Max 8</option>
                              </select>
                            </div>
                          </div>

                          <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.6rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><AlertCircle size={14} /> Forced Start Letter</label>
                            <select value={forcedStartLetterChoice} onChange={(e) => setForcedStartLetterChoice(e.target.value)} style={{ background: 'var(--bg-deep)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '0.35rem 0.6rem', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}>
                              <option value="none">None</option>
                              <option value="random">Random Letter</option>
                              {Array.from("abcdefghijklmnopqrstuvwxyz").map(l => (
                                <option key={l} value={l}>Start with {l.toUpperCase()}</option>
                              ))}
                            </select>
                          </div>

                          {mode === "ban_letter" && (
                            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.6rem' }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><AlertCircle size={14} /> Banned Letter</label>
                              <select value={bannedLetterChoice} onChange={(e) => setBannedLetterChoice(e.target.value)} style={{ background: 'var(--bg-deep)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '0.35rem 0.6rem', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}>
                                <option value="random">Random Letter</option>
                                {Array.from("abcdefghijklmnopqrstuvwxyz").map(l => (
                                  <option key={l} value={l}>Ban {l.toUpperCase()}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {mode === "themed" && (
                            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.6rem' }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Globe size={14} /> Theme</label>
                              <select value={theme ?? "animals"} onChange={(e) => setTheme(e.target.value as ThemeChoice)} style={{ background: 'var(--bg-deep)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '0.35rem 0.6rem', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}>
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
                              <button type="button" onClick={() => setTurnDuration(v => Math.max(10, v - 5))}>−</button>
                              <span>{turnDuration}s</span>
                              <button type="button" onClick={() => setTurnDuration(v => Math.min(60, v + 5))}>+</button>
                            </div>
                          </div>

                          {mode !== "themed" && (
                            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.6rem' }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Trophy size={14} /> Target Score</label>
                              <div className="setting-stepper">
                                <button type="button" onClick={() => setTargetScore(v => Math.max(20, v - 20))}>−</button>
                                <span>{targetScore} pts</span>
                                <button type="button" onClick={() => setTargetScore(v => Math.min(500, v + 20))}>+</button>
                              </div>
                            </div>
                          )}

                          {mode === "bomb" && (
                            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.6rem' }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Bomb size={14} /> Bomb Time</label>
                              <div className="setting-stepper">
                                <button type="button" onClick={() => setBombDuration(v => Math.max(20, v - 5))}>−</button>
                                <span>{bombDuration}s</span>
                                <button type="button" onClick={() => setBombDuration(v => Math.min(90, v + 5))}>+</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </details>
                  )}

                  {/* Avatar Preset Picker */}
                  <div className="avatar-picker-section">
                    <p className="avatar-picker-title">Choose Your Avatar Preset</p>
                    <div className="avatar-picker-grid">
                      {AVATAR_PRESETS.map((p) => {
                        const active = avatar === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            className={`avatar-picker-item ${active ? "active" : ""}`}
                            onClick={() => {
                              setAvatar(p.id);
                              storePlayerAvatar(p.id);
                            }}
                            title={p.label}
                          >
                            <img
                              src={p.id.startsWith("http") || p.id.startsWith("/") ? p.id : `https://api.dicebear.com/7.x/${p.id}&backgroundColor=0a0b1e`}
                              alt={p.label}
                            />
                            {active && <div className="avatar-active-ring" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="big-actions">
                    <button className="big-btn purple" onClick={(e) => createRoom(e as any)}>
                      <div className="btn-icon-circle"><Plus size={24} /></div>
                      <div className="btn-text">
                        <strong>Create Room</strong>
                        <span>Make your own room</span>
                      </div>
                    </button>
                    <button className="big-btn cyan" onClick={(e) => {
                      const codeToJoin = routeRoomCode || joinCode;
                      if (!codeToJoin.trim()) {
                        document.getElementById('room-code-input')?.focus();
                        setGlobalError("Vui lòng nhập mã phòng ở bên dưới.");
                        return;
                      }
                      joinRoom(e as any);
                    }}>
                      <div className="btn-icon-circle"><LogIn size={24} /></div>
                      <div className="btn-text">
                        <strong>{routeRoomCode ? `Join ${routeRoomCode}` : 'Join Room'}</strong>
                        <span>{routeRoomCode ? 'Enter this room' : 'Join with friends'}</span>
                      </div>
                    </button>
                  </div>

                  <div className="separator-or" style={{ margin: '0.75rem 0' }}>OR</div>

                  <div className="join-now-group">
                    <div className="input-group-premium">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>Enter Room Code</span>
                      <input 
                        id="room-code-input"
                        placeholder="ABX29K" 
                        value={joinCode} 
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        style={{ textAlign: 'center', letterSpacing: '0.1em' }}
                      />
                    </div>
                    <button className="primary-button" style={{ borderRadius: '16px', padding: '0 2rem' }} onClick={(e) => joinRoom(e as any)}>
                      Join Now <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>


        </main>

        <footer className="footer-bar">
          <div className="footer-item">
            <div className="icon-circle"><ShieldCheck size={20} /></div>
            <div><strong>Fair Play</strong><span>No cheating, 100% fair</span></div>
          </div>
          <div className="footer-item">
            <div className="icon-circle"><Users size={20} /></div>
            <div><strong>Play with Friends</strong><span>Invite and battle together</span></div>
          </div>
        </footer>

        {globalError && <div className="floating-alert error">{globalError}</div>}
        {notice && <div className="floating-alert success">{notice}</div>}

        {/* Help Modal */}
        {showHelp && (
          <div className="modal-backdrop" onClick={() => setShowHelp(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span><HelpCircle size={20} /> How to Play</span>
                <button className="icon-btn" onClick={() => setShowHelp(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div className="help-rule"><span className="help-num">1</span><span>Type a word that starts with the <strong>last letter</strong> of the previous word.</span></div>
                <div className="help-rule"><span className="help-num">2</span><span>Each <strong>character = 1 point</strong>. Longer words = more points!</span></div>
                <div className="help-rule"><span className="help-num">3</span><span><strong>No repeating</strong> words allowed in the same match.</span></div>
                <div className="help-rule"><span className="help-num">4</span><span>You have <strong>20 seconds</strong> per turn. Don't run out!</span></div>
                <div className="help-rule"><span className="help-num">5</span><span>First player to reach <strong>100 points</strong> wins the game!</span></div>
                
                <div style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>Game Modes</div>
                <div className="help-rule"><span className="help-num"><Zap size={14} /></span><span><strong>Classic:</strong> Standard word chain rules.</span></div>
                <div className="help-rule"><span className="help-num" style={{ background: 'rgba(255,77,77,0.15)', borderColor: 'var(--danger)', color: 'var(--danger)' }}><Bomb size={14} /></span><span><strong>Bomb:</strong> Pass the ticking bomb before it explodes to avoid losing 15 points!</span></div>
                <div className="help-rule"><span className="help-num" style={{ background: 'rgba(255,204,0,0.15)', borderColor: 'var(--warning)', color: 'var(--warning)' }}><Link size={14} /></span><span><strong>Hard Chain:</strong> Words must connect using the last <strong>2 letters</strong>.</span></div>
                <div className="help-rule"><span className="help-num" style={{ background: 'rgba(255,77,77,0.15)', borderColor: 'var(--danger)', color: 'var(--danger)' }}><ShieldBan size={14} /></span><span><strong>Ban Letter:</strong> A specific letter is completely forbidden from all words.</span></div>
                <div className="help-rule"><span className="help-num"><AlertCircle size={14} /></span><span><strong>Escalating:</strong> Each word you play must be strictly <strong>longer</strong> than your previous word!</span></div>
                <div className="help-rule"><span className="help-num" style={{ background: 'rgba(255,204,0,0.15)', borderColor: 'var(--warning)', color: 'var(--warning)' }}><Star size={14} /></span><span><strong>Themed (Survival):</strong> Mỗi người có 3 mạng. Hết thời gian bị trừ 1 mạng, hết 3 mạng bị loại. Ai sống sót cuối cùng sẽ thắng!</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <nav className="header-nav">
        <div className="logo-group">
          <div className="logo-icon"><BrainCircuit size={24} color="white" /></div>
          <div className="logo-text">Word Chain <span>Online</span></div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '1rem' }}>✦ Nối từ tiếng Anh ✦</div>
        </div>
        <div className="nav-actions">
          <button className={`nav-btn ${showChat ? 'active-btn' : ''}`} onClick={() => setShowChat(v => !v)}>
            <MessageCircle size={18} /> Chat
          </button>
          <button className={`nav-btn ${muted ? 'active-btn' : ''}`} onClick={() => setMuted(v => !v)} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button className="nav-btn" onClick={() => setShowHelp(true)} title="How to Play">
            <HelpCircle size={18} />
          </button>
          <button className="nav-btn danger" onClick={leaveRoom}><LogOut size={18} /> Leave
          </button>
        </div>
      </nav>

      {/* Stats Row */}
      <RoomHeader room={room} />

      {/* Main Layout */}
      <main className="main-game-layout">
        {/* Left Sidebar: Players List */}
        <aside className="side-panel left-panel">
          <Scoreboard room={room} variant="list" selfId={playerId} />
        </aside>

        {/* Center Area: Game Input & Progress */}
        <section className="game-center-area">
          <TurnPanel 
            room={room} 
            selfId={playerId} 
            onSubmitWord={submitWord} 
            onStartGame={startGame}
            onResetGame={resetGame}
            onUpdateSettings={updateSettings}
            busy={busy} 
            error={wordError} 
            showSettings={showSettings}
            setShowSettings={setShowSettings}
          />
          {room.status !== "lobby" && (
            <Scoreboard room={room} variant="progress" selfId={playerId} />
          )}
        </section>

        {/* Right Sidebar: Rules & Recent Words */}
        <aside className="side-panel right-panel">
          <RulesPanel room={room} />
          <HistoryPanel room={room} />
        </aside>
      </main>

      {globalError && <div className="floating-alert error"><X size={16} onClick={() => setGlobalError(null)} style={{cursor:'pointer'}} /> {globalError}</div>}
      {notice && <div className="floating-alert success">{notice}</div>}

      {/* Help Modal */}
      {showHelp && (
        <div className="modal-backdrop" onClick={() => setShowHelp(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span><HelpCircle size={20} /> How to Play</span>
              <button className="icon-btn" onClick={() => setShowHelp(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="help-rule"><span className="help-num">1</span><span>Type a word that starts with the <strong>last letter</strong> of the previous word.</span></div>
              <div className="help-rule"><span className="help-num">2</span><span>Each <strong>character = 1 point</strong>. Longer words = more points!</span></div>
              <div className="help-rule"><span className="help-num">3</span><span><strong>No repeating</strong> words allowed in the same match.</span></div>
              <div className="help-rule"><span className="help-num">4</span><span>You have <strong>{room?.turnDuration ?? 20} seconds</strong> per turn. Don't run out!</span></div>
              <div className="help-rule"><span className="help-num">5</span><span>{room?.mode === "themed" ? <strong>Last player standing wins!</strong> : <>First player to reach <strong>{room?.targetScore ?? 100} points</strong> wins the game!</>}</span></div>
              
              <div style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>Game Modes</div>
              <div className="help-rule"><span className="help-num"><Zap size={14} /></span><span><strong>Classic:</strong> Standard word chain rules.</span></div>
              <div className="help-rule"><span className="help-num" style={{ background: 'rgba(255,77,77,0.15)', borderColor: 'var(--danger)', color: 'var(--danger)' }}><Bomb size={14} /></span><span><strong>Bomb:</strong> Pass the ticking bomb before it explodes to avoid losing 15 points!</span></div>
              <div className="help-rule"><span className="help-num" style={{ background: 'rgba(255,204,0,0.15)', borderColor: 'var(--warning)', color: 'var(--warning)' }}><Link size={14} /></span><span><strong>Hard Chain:</strong> Words must connect using the last <strong>2 letters</strong>.</span></div>
              <div className="help-rule"><span className="help-num" style={{ background: 'rgba(255,77,77,0.15)', borderColor: 'var(--danger)', color: 'var(--danger)' }}><ShieldBan size={14} /></span><span><strong>Ban Letter:</strong> A specific letter is completely forbidden from all words.</span></div>
              <div className="help-rule"><span className="help-num"><AlertCircle size={14} /></span><span><strong>Escalating:</strong> Each word you play must be strictly <strong>longer</strong> than your previous word!</span></div>
              <div className="help-rule"><span className="help-num" style={{ background: 'rgba(255,204,0,0.15)', borderColor: 'var(--warning)', color: 'var(--warning)' }}><Star size={14} /></span><span><strong>Themed (Survival):</strong> Mỗi người có 3 mạng. Hết thời gian bị trừ 1 mạng, hết 3 mạng bị loại. Ai sống sót cuối cùng sẽ thắng!</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="chat-panel">
          <div className="chat-header">
            <span><MessageCircle size={16} /> Room Chat</span>
            <button className="icon-btn" onClick={() => setShowChat(false)}><X size={16} /></button>
          </div>
          <div className="chat-log">
            {chatLog.length === 0 && <p className="chat-empty">No messages yet. Say hi!</p>}
            {chatLog.map((m, i) => (
              <div key={i} className="chat-msg">
                <span className="chat-name">{m.name}</span>
                <span className="chat-text">{m.text}</span>
              </div>
            ))}
          </div>
          <form className="chat-input-row" onSubmit={e => {
            e.preventDefault();
            const text = chatMsg.trim();
            if (!text) return;
            setChatLog(prev => [...prev, { name: self?.name ?? 'You', text, time: Date.now() }]);
            setChatMsg("");
          }}>
            <input
              className="chat-input"
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              placeholder="Type a message..."
              maxLength={120}
            />
            <button type="submit" className="icon-btn" style={{color:'var(--accent-cyan)'}}><Send size={16} /></button>
          </form>
        </div>
      )}
    </div>
  );
}
