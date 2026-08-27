"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Swords,
  Timer,
  Sparkles,
  Flame,
  Tv,
  Smartphone,
  Video,
  Lock,
  Edit3,
  Check,
  Zap,
} from "lucide-react";

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  bracket?: string;
  score1: number;
  score2: number;
  status: string;
  player1Id?: string | null;
  player2Id?: string | null;
  winnerId?: string | null;
  player1?: { id: string; name?: string; handicap?: string; member?: { name: string; handicap?: string } } | null;
  player2?: { id: string; name?: string; handicap?: string; member?: { name: string; handicap?: string } } | null;
  winner?: { id: string; name?: string; handicap?: string } | null;
}

interface Tournament {
  id: string;
  name: string;
  venue?: string;
  format?: string;
  status?: string;
  matches?: Match[];
  participants?: any[];
}

export default function ScoreboardPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("CUSTOM");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Display Mode: ARENA_TV (Full Big Screen), STREAM_HUD (Lower Third Transparent OBS), REFEREE_REMOTE (Mobile Remote)
  const [displayMode, setDisplayMode] = useState<"ARENA_TV" | "STREAM_HUD" | "REFEREE_REMOTE">("ARENA_TV");

  // Custom / Live Score State
  const [tableNumber, setTableNumber] = useState<string>("MEJA 01");
  const [raceTo, setRaceTo] = useState<number>(5);
  const [p1Name, setP1Name] = useState<string>("IDRUS AND");
  const [p1Hc, setP1Hc] = useState<string>("3");
  const [p1Score, setP1Score] = useState<number>(0);
  const [p1Active, setP1Active] = useState<boolean>(true); // Turn indicator

  const [p2Name, setP2Name] = useState<string>("FARIZ VAMOS");
  const [p2Hc, setP2Hc] = useState<string>("3");
  const [p2Score, setP2Score] = useState<number>(0);
  const [p2Active, setP2Active] = useState<boolean>(false);

  // Shot Clock State
  const [defaultShotTime, setDefaultShotTime] = useState<number>(30); // 30s or 45s
  const [shotClockSeconds, setShotClockSeconds] = useState<number>(30);
  const [isShotClockRunning, setIsShotClockRunning] = useState<boolean>(false);
  const [isExtensionUsed, setIsExtensionUsed] = useState<boolean>(false);

  // Staff Token for backend sync
  const [staffToken, setStaffToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const shotTimerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Load auth state
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("vamos_staff_token");
      if (savedToken) setStaffToken(savedToken);
    } catch (e) {}
  }, []);

  // Web Audio FX for Shot Clock & Buzzer
  const playBeep = (type: "TICK_10" | "TICK_WARN" | "BUZZER" | "RACK_WIN") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      if (type === "TICK_10") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "TICK_WARN") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "BUZZER") {
        // Horn buzzer sound (Shot Clock Expired / Foul)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === "RACK_WIN") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.35); // C6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {}
  };

  // Fetch active tournament data
  const fetchTournament = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://api.vamospool.id/api/tournaments");
      if (!res.ok) throw new Error("Gagal mengambil data turnamen");
      const json = await res.json();
      const list: Tournament[] = Array.isArray(json) ? json : json.data || [];
      const active = list.find((t) => t.status !== "COMPLETED") || list[0];
      if (active) {
        const detailRes = await fetch(`https://api.vamospool.id/api/tournaments/${active.id}`);
        if (detailRes.ok) {
          const detailJson = await detailRes.json();
          const fullData = detailJson.data || detailJson;
          setTournament(fullData);

          // If query has match, load it
          if (fullData.matches && fullData.matches.length > 0) {
            const firstActiveMatch = fullData.matches.find((m: Match) => m.status !== "COMPLETED") || fullData.matches[0];
            if (firstActiveMatch) {
              loadMatchData(firstActiveMatch, fullData);
            }
          }
        }
      }
    } catch (e) {
      console.error("Fetch tournament error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();
  }, []);

  // Load a match from the tournament
  const loadMatchData = (m: Match, currentTournament?: Tournament) => {
    const tour = currentTournament || tournament;
    setSelectedMatchId(m.id);
    setTableNumber(`MATCH #${m.matchNumber}`);

    let p1 = m.player1;
    let p2 = m.player2;

    if (!p1 && m.player1Id && tour?.participants) {
      p1 = tour.participants.find((pt: any) => pt.id === m.player1Id);
    }
    if (!p2 && m.player2Id && tour?.participants) {
      p2 = tour.participants.find((pt: any) => pt.id === m.player2Id);
    }

    setP1Name(p1?.name || (p1 as any)?.member?.name || `Peserta 1`);
    setP1Hc(p1?.handicap || (p1 as any)?.member?.handicap || "3");
    setP1Score(m.score1 || 0);

    setP2Name(p2?.name || (p2 as any)?.member?.name || `Peserta 2`);
    setP2Hc(p2?.handicap || (p2 as any)?.member?.handicap || "3");
    setP2Score(m.score2 || 0);

    resetShotClock();
  };

  // Shot clock ticker
  useEffect(() => {
    if (!isShotClockRunning) {
      if (shotTimerRef.current) clearInterval(shotTimerRef.current);
      return;
    }

    shotTimerRef.current = setInterval(() => {
      setShotClockSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(shotTimerRef.current);
          setIsShotClockRunning(false);
          playBeep("BUZZER");
          return 0;
        }

        const next = prev - 1;
        if (next === 10) {
          playBeep("TICK_10");
        } else if (next <= 5 && next >= 1) {
          playBeep("TICK_WARN");
        }
        return next;
      });
    }, 1000);

    return () => {
      if (shotTimerRef.current) clearInterval(shotTimerRef.current);
    };
  }, [isShotClockRunning, soundEnabled]);

  // Shot clock controls
  const resetShotClock = (customTime?: number) => {
    const t = customTime !== undefined ? customTime : defaultShotTime;
    setIsShotClockRunning(false);
    setShotClockSeconds(t);
    setIsExtensionUsed(false);
  };

  const applyExtension = () => {
    if (isExtensionUsed) return;
    setIsExtensionUsed(true);
    setShotClockSeconds((prev) => prev + 30);
    setIsShotClockRunning(true);
    playBeep("TICK_10");
  };

  // Score modifiers
  const handleAddScoreP1 = () => {
    setP1Score((prev) => {
      const next = prev + 1;
      playBeep("RACK_WIN");
      setP1Active(true);
      setP2Active(false);
      resetShotClock();
      return next;
    });
  };

  const handleMinusScoreP1 = () => {
    setP1Score((prev) => Math.max(0, prev - 1));
  };

  const handleAddScoreP2 = () => {
    setP2Score((prev) => {
      const next = prev + 1;
      playBeep("RACK_WIN");
      setP2Active(true);
      setP1Active(false);
      resetShotClock();
      return next;
    });
  };

  const handleMinusScoreP2 = () => {
    setP2Score((prev) => Math.max(0, prev - 1));
  };

  // Sync to database if bound to a tournament match and staff is authenticated
  const handleSyncToLiveBackend = async () => {
    if (selectedMatchId === "CUSTOM" || !selectedMatchId) {
      alert("Pilih pertandingan dari turnamen terlebih dahulu untuk sinkronisasi ke bagan.");
      return;
    }

    if (!staffToken) {
      alert("Silakan login sebagai Panitia/Wasit untuk menyimpan skor ke database server.");
      return;
    }

    const currentMatch = tournament?.matches?.find((m) => m.id === selectedMatchId);
    if (!currentMatch) return;

    const winnerId = p1Score > p2Score ? currentMatch.player1Id : currentMatch.player2Id;

    try {
      setIsSyncing(true);
      const res = await fetch(`https://api.vamospool.id/api/tournaments/matches/${selectedMatchId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          score1: p1Score,
          score2: p2Score,
          winnerId: (p1Score >= raceTo || p2Score >= raceTo) ? winnerId : null,
        }),
      });

      if (!res.ok) throw new Error("Gagal mengupdate skor di server");

      setSyncStatusMsg("✅ Skor tersinkronisasi ke Bagan Utama & Kasir POS!");
      setTimeout(() => setSyncStatusMsg(null), 2500);
      fetchTournament();
    } catch (e: any) {
      alert(e.message || "Gagal sinkronisasi");
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Extract club tag from player name
  const getClubTag = (name: string) => {
    const clean = name.replace(/\[.*?\]|\(.*?\)/g, "").trim();
    const parts = clean.split(/\s+/);
    if (parts.length > 1) {
      const last = parts[parts.length - 1].toUpperCase();
      if (["VAMOS", "AND", "DONE", "59", "BINTANG", "MANTAP", "SULTAN"].includes(last)) {
        return last;
      }
    }
    return null;
  };

  // Shot clock color & ring animation
  const shotClockColor =
    shotClockSeconds <= 5
      ? "#EF4444"
      : shotClockSeconds <= 10
      ? "#F59E0B"
      : "#00F0FF";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: displayMode === "STREAM_HUD" ? "transparent" : "radial-gradient(ellipse at 50% 0%, rgba(0, 102, 255, 0.25) 0%, rgba(2, 5, 12, 1) 85%)",
        color: "#F1F5F9",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      {/* Top Header Controls (Hidden in STREAM_HUD if desired) */}
      <header
        style={{
          background: "rgba(3, 6, 14, 0.95)",
          borderBottom: "1px solid rgba(0, 240, 255, 0.2)",
          padding: "10px 18px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            maxWidth: "1800px",
            margin: "0 auto",
          }}
        >
          {/* Back & Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/bracket"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#94A3B8",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: 600,
                background: "rgba(255, 255, 255, 0.06)",
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <ArrowLeft size={13} />
              <span>Bagan Live</span>
            </Link>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1
                  style={{
                    fontFamily: "Montserrat",
                    fontSize: "16px",
                    fontWeight: 900,
                    color: "#FFFFFF",
                    margin: 0,
                  }}
                >
                  LIVE ARENA SCOREBOARD
                </h1>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 900,
                    color: "#10B981",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    padding: "2px 8px",
                    borderRadius: "100px",
                  }}
                >
                  ● ARENA TV & OBS HUD
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                {tournament?.name || "VAMOS CHAMPIONSHIP"} • {tableNumber}
              </div>
            </div>
          </div>

          {/* Select Active Tournament Match */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700 }}>PILIH MATCH:</span>
            <select
              value={selectedMatchId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedMatchId(val);
                if (val !== "CUSTOM") {
                  const m = tournament?.matches?.find((item) => item.id === val);
                  if (m) loadMatchData(m);
                }
              }}
              style={{
                background: "rgba(10, 20, 40, 0.95)",
                border: "1px solid rgba(0, 240, 255, 0.4)",
                color: "#00F0FF",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="CUSTOM">⚙️ Manual Custom Game</option>
              {(tournament?.matches || []).map((m) => {
                const p1Text = m.player1?.name || (m.player1 as any)?.member?.name || "P1";
                const p2Text = m.player2?.name || (m.player2 as any)?.member?.name || "P2";
                return (
                  <option key={m.id} value={m.id}>
                    Match #{m.matchNumber} (R{m.round}): {p1Text} vs {p2Text}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Display Mode Switcher */}
          <div
            style={{
              display: "flex",
              background: "rgba(10, 16, 32, 0.9)",
              padding: "4px",
              borderRadius: "10px",
              border: "1px solid rgba(0, 240, 255, 0.25)",
              gap: "4px",
            }}
          >
            <button
              onClick={() => setDisplayMode("ARENA_TV")}
              style={{
                background: displayMode === "ARENA_TV" ? "linear-gradient(135deg, #00F0FF, #0066FF)" : "transparent",
                color: displayMode === "ARENA_TV" ? "#040811" : "#94A3B8",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Tv size={13} />
              <span>TV Arena</span>
            </button>

            <button
              onClick={() => setDisplayMode("STREAM_HUD")}
              style={{
                background: displayMode === "STREAM_HUD" ? "linear-gradient(135deg, #00F0FF, #0066FF)" : "transparent",
                color: displayMode === "STREAM_HUD" ? "#040811" : "#94A3B8",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
              title="Transparan Lower-Third untuk OBS / Live Streaming YouTube"
            >
              <Video size={13} />
              <span>OBS HUD</span>
            </button>

            <button
              onClick={() => setDisplayMode("REFEREE_REMOTE")}
              style={{
                background: displayMode === "REFEREE_REMOTE" ? "linear-gradient(135deg, #00F0FF, #0066FF)" : "transparent",
                color: displayMode === "REFEREE_REMOTE" ? "#040811" : "#94A3B8",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Smartphone size={13} />
              <span>Remote Wasit</span>
            </button>
          </div>

          {/* Right Action Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title="Toggle Sound Effects"
              style={{
                background: soundEnabled ? "rgba(0, 240, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                border: soundEnabled ? "1px solid #00F0FF" : "1px solid rgba(255, 255, 255, 0.1)",
                color: soundEnabled ? "#00F0FF" : "#64748B",
                padding: "7px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            <button
              onClick={toggleFullscreen}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#F1F5F9",
                padding: "6px 10px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span>{isFullscreen ? "Exit" : "Layar TV"}</span>
            </button>

            {selectedMatchId !== "CUSTOM" && (
              <button
                disabled={isSyncing}
                onClick={handleSyncToLiveBackend}
                className="btn-gold"
                style={{
                  padding: "6px 12px",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Check size={13} />
                <span>{isSyncing ? "Sync..." : "Simpan ke Bagan"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sync notification toast */}
      {syncStatusMsg && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.25)",
            borderBottom: "1px solid #10B981",
            color: "#10B981",
            padding: "8px",
            textAlign: "center",
            fontSize: "12px",
            fontWeight: 800,
          }}
        >
          {syncStatusMsg}
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. ARENA TV FULLSCREEN DISPLAY MODE                            */}
      {/* ============================================================== */}
      {displayMode === "ARENA_TV" && (
        <main
          style={{
            flex: 1,
            padding: "24px 20px 40px 20px",
            maxWidth: "1600px",
            margin: "0 auto",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          {/* Top Banner: Tournament & Table & Race Target */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(10, 18, 36, 0.8)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              borderRadius: "20px",
              padding: "16px 28px",
              boxShadow: "0 0 30px rgba(0, 102, 255, 0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #00F0FF, #0066FF)",
                  color: "#040811",
                  fontFamily: "Montserrat",
                  fontWeight: 900,
                  fontSize: "14px",
                  padding: "6px 14px",
                  borderRadius: "10px",
                }}
              >
                {tableNumber}
              </div>
              <div style={{ fontFamily: "Montserrat", fontSize: "18px", fontWeight: 900, color: "#FFFFFF" }}>
                {tournament?.name || "VAMOS OPEN TOURNAMENT"}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid #F59E0B",
                padding: "6px 18px",
                borderRadius: "100px",
                color: "#F59E0B",
                fontFamily: "Montserrat",
                fontWeight: 900,
                fontSize: "15px",
                boxShadow: "0 0 20px rgba(245, 158, 11, 0.3)",
              }}
            >
              <Trophy size={18} />
              <span>RACE TO {raceTo} (FIRST TO {raceTo})</span>
            </div>
          </div>

          {/* MAIN SCOREBOARD ARENA (PLAYER 1 vs SHOT CLOCK vs PLAYER 2) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 340px 1.2fr",
              gap: "24px",
              alignItems: "center",
            }}
            className="scoreboard-grid"
          >
            {/* PLAYER 1 CARD (CYAN THEME) */}
            <div
              onClick={() => {
                setP1Active(true);
                setP2Active(false);
              }}
              style={{
                background: p1Active
                  ? "linear-gradient(135deg, rgba(0, 240, 255, 0.25) 0%, rgba(6, 16, 36, 0.95) 100%)"
                  : "rgba(6, 12, 26, 0.8)",
                border: p1Active ? "3px solid #00F0FF" : "1px solid rgba(0, 240, 255, 0.2)",
                borderRadius: "28px",
                padding: "32px 24px",
                textAlign: "center",
                boxShadow: p1Active ? "0 0 60px rgba(0, 240, 255, 0.45)" : "none",
                position: "relative",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {p1Active && (
                <div
                  style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #00F0FF, #0066FF)",
                    color: "#040811",
                    fontFamily: "Montserrat",
                    fontWeight: 900,
                    fontSize: "11px",
                    padding: "3px 14px",
                    borderRadius: "100px",
                    letterSpacing: "0.08em",
                    boxShadow: "0 0 15px rgba(0, 240, 255, 0.8)",
                  }}
                >
                  ⚡ ON TABLE (SHOOTING)
                </div>
              )}

              {/* Club / Suffix Badge */}
              {getClubTag(p1Name) && (
                <span
                  style={{
                    display: "inline-block",
                    background: "rgba(0, 240, 255, 0.15)",
                    border: "1px solid #00F0FF",
                    color: "#00F0FF",
                    fontSize: "12px",
                    fontWeight: 800,
                    padding: "2px 10px",
                    borderRadius: "6px",
                    marginBottom: "10px",
                  }}
                >
                  KLUB: {getClubTag(p1Name)}
                </span>
              )}

              {/* Player 1 Name */}
              <div
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "36px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  textShadow: p1Active ? "0 0 25px rgba(0, 240, 255, 0.8)" : "none",
                  marginBottom: "4px",
                  lineHeight: 1.15,
                }}
              >
                {p1Name}
              </div>

              <div style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 700, marginBottom: "20px" }}>
                Handicap: <span style={{ color: "#F59E0B" }}>{p1Hc}</span>
              </div>

              {/* Player 1 Rack Score */}
              <div
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "100px",
                  fontWeight: 900,
                  color: p1Score >= raceTo ? "#10B981" : "#00F0FF",
                  textShadow: "0 0 40px rgba(0, 240, 255, 0.9)",
                  lineHeight: 1,
                  margin: "10px 0 20px 0",
                }}
              >
                {p1Score}
              </div>

              {/* Rack Counter Balls / Dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
                {Array.from({ length: raceTo }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: idx < p1Score ? "#00F0FF" : "rgba(255, 255, 255, 0.1)",
                      boxShadow: idx < p1Score ? "0 0 12px #00F0FF" : "none",
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </div>

              {/* Quick Score Buttons */}
              <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMinusScoreP1();
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#FFFFFF",
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Minus size={18} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddScoreP1();
                  }}
                  style={{
                    background: "linear-gradient(135deg, #00F0FF, #0066FF)",
                    border: "none",
                    color: "#040811",
                    padding: "0 24px",
                    height: "44px",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: 900,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)",
                  }}
                >
                  <Plus size={18} />
                  <span>+1 Rack</span>
                </button>
              </div>
            </div>

            {/* CENTER: SHOT CLOCK TIMER RING (30s / 45s) */}
            <div
              style={{
                background: "rgba(6, 12, 26, 0.95)",
                border: "2px solid rgba(0, 240, 255, 0.3)",
                borderRadius: "28px",
                padding: "28px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                boxShadow: "0 0 40px rgba(0, 0, 0, 0.6)",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 900, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: "12px" }}>
                ⏱️ SHOT CLOCK
              </div>

              {/* Glowing Timer Circle */}
              <div
                style={{
                  width: "160px",
                  height: "160px",
                  borderRadius: "50%",
                  border: `4px solid ${shotClockColor}`,
                  boxShadow: `0 0 35px ${shotClockColor}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                  transition: "border 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                <div
                  style={{
                    fontFamily: "Montserrat",
                    fontSize: "56px",
                    fontWeight: 900,
                    color: shotClockColor,
                    lineHeight: 1,
                  }}
                >
                  {shotClockSeconds}
                </div>
                <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700, marginTop: "4px" }}>
                  DETIK
                </div>
              </div>

              {/* Timer Controls */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px", width: "100%" }}>
                <button
                  onClick={() => setIsShotClockRunning(!isShotClockRunning)}
                  style={{
                    flex: 1,
                    background: isShotClockRunning ? "rgba(239, 68, 68, 0.2)" : "linear-gradient(135deg, #10B981, #059669)",
                    border: isShotClockRunning ? "1px solid #EF4444" : "none",
                    color: isShotClockRunning ? "#EF4444" : "#FFFFFF",
                    padding: "10px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  {isShotClockRunning ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isShotClockRunning ? "Pause" : "Mulai"}</span>
                </button>

                <button
                  onClick={() => resetShotClock()}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#F1F5F9",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Extension & Shot Mode Switcher */}
              <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                <button
                  disabled={isExtensionUsed}
                  onClick={applyExtension}
                  style={{
                    flex: 1,
                    background: isExtensionUsed ? "rgba(255, 255, 255, 0.03)" : "rgba(245, 158, 11, 0.2)",
                    border: isExtensionUsed ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #F59E0B",
                    color: isExtensionUsed ? "#64748B" : "#F59E0B",
                    padding: "6px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: isExtensionUsed ? "not-allowed" : "pointer",
                  }}
                >
                  {isExtensionUsed ? "Ext Dipakai" : "+30s Ext"}
                </button>

                <button
                  onClick={() => {
                    const newT = defaultShotTime === 30 ? 45 : 30;
                    setDefaultShotTime(newT);
                    resetShotClock(newT);
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#94A3B8",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {defaultShotTime}s Mode
                </button>
              </div>
            </div>

            {/* PLAYER 2 CARD (ROSE THEME) */}
            <div
              onClick={() => {
                setP2Active(true);
                setP1Active(false);
              }}
              style={{
                background: p2Active
                  ? "linear-gradient(135deg, rgba(225, 29, 72, 0.25) 0%, rgba(36, 6, 16, 0.95) 100%)"
                  : "rgba(6, 12, 26, 0.8)",
                border: p2Active ? "3px solid #F43F5E" : "1px solid rgba(225, 29, 72, 0.2)",
                borderRadius: "28px",
                padding: "32px 24px",
                textAlign: "center",
                boxShadow: p2Active ? "0 0 60px rgba(225, 29, 72, 0.45)" : "none",
                position: "relative",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {p2Active && (
                <div
                  style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #E11D48, #BE123C)",
                    color: "#FFFFFF",
                    fontFamily: "Montserrat",
                    fontWeight: 900,
                    fontSize: "11px",
                    padding: "3px 14px",
                    borderRadius: "100px",
                    letterSpacing: "0.08em",
                    boxShadow: "0 0 15px rgba(225, 29, 72, 0.8)",
                  }}
                >
                  ⚡ ON TABLE (SHOOTING)
                </div>
              )}

              {/* Club / Suffix Badge */}
              {getClubTag(p2Name) && (
                <span
                  style={{
                    display: "inline-block",
                    background: "rgba(225, 29, 72, 0.15)",
                    border: "1px solid #F43F5E",
                    color: "#F43F5E",
                    fontSize: "12px",
                    fontWeight: 800,
                    padding: "2px 10px",
                    borderRadius: "6px",
                    marginBottom: "10px",
                  }}
                >
                  KLUB: {getClubTag(p2Name)}
                </span>
              )}

              {/* Player 2 Name */}
              <div
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "36px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  textShadow: p2Active ? "0 0 25px rgba(225, 29, 72, 0.8)" : "none",
                  marginBottom: "4px",
                  lineHeight: 1.15,
                }}
              >
                {p2Name}
              </div>

              <div style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 700, marginBottom: "20px" }}>
                Handicap: <span style={{ color: "#F59E0B" }}>{p2Hc}</span>
              </div>

              {/* Player 2 Rack Score */}
              <div
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "100px",
                  fontWeight: 900,
                  color: p2Score >= raceTo ? "#10B981" : "#F43F5E",
                  textShadow: "0 0 40px rgba(225, 29, 72, 0.9)",
                  lineHeight: 1,
                  margin: "10px 0 20px 0",
                }}
              >
                {p2Score}
              </div>

              {/* Rack Counter Balls */}
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
                {Array.from({ length: raceTo }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: idx < p2Score ? "#F43F5E" : "rgba(255, 255, 255, 0.1)",
                      boxShadow: idx < p2Score ? "0 0 12px #F43F5E" : "none",
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </div>

              {/* Quick Score Buttons */}
              <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMinusScoreP2();
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#FFFFFF",
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Minus size={18} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddScoreP2();
                  }}
                  style={{
                    background: "linear-gradient(135deg, #E11D48, #BE123C)",
                    border: "none",
                    color: "#FFFFFF",
                    padding: "0 24px",
                    height: "44px",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: 900,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 0 20px rgba(225, 29, 72, 0.4)",
                  }}
                >
                  <Plus size={18} />
                  <span>+1 Rack</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Settings Bar: Edit Names, Race, Table */}
          <div
            style={{
              background: "rgba(8, 14, 28, 0.85)",
              border: "1px solid rgba(0, 240, 255, 0.2)",
              borderRadius: "18px",
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700 }}>PENGATURAN MANUAL:</span>
              <input
                type="text"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                placeholder="Nama Pemain 1"
                style={{
                  background: "rgba(0, 240, 255, 0.1)",
                  border: "1px solid rgba(0, 240, 255, 0.4)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  color: "#00F0FF",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              />
              <span style={{ color: "#64748B" }}>vs</span>
              <input
                type="text"
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                placeholder="Nama Pemain 2"
                style={{
                  background: "rgba(225, 29, 72, 0.1)",
                  border: "1px solid rgba(225, 29, 72, 0.4)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  color: "#F43F5E",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700 }}>RACE TO:</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {[3, 4, 5, 6, 7, 9].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRaceTo(r)}
                    style={{
                      background: raceTo === r ? "linear-gradient(135deg, #00F0FF, #0066FF)" : "rgba(255, 255, 255, 0.05)",
                      border: raceTo === r ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
                      color: raceTo === r ? "#040811" : "#94A3B8",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setP1Score(0);
                  setP2Score(0);
                  resetShotClock();
                }}
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid #EF4444",
                  color: "#EF4444",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Reset Skor 0-0
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ============================================================== */}
      {/* 2. OBS STREAM OVERLAY HUD (LOWER THIRD TRANSPARENT)             */}
      {/* ============================================================== */}
      {displayMode === "STREAM_HUD" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "40px",
          }}
        >
          {/* Lower Third HUD Bar */}
          <div
            style={{
              background: "linear-gradient(90deg, rgba(6, 12, 28, 0.95) 0%, rgba(10, 20, 42, 0.98) 50%, rgba(6, 12, 28, 0.95) 100%)",
              border: "2px solid #00F0FF",
              borderRadius: "20px",
              padding: "16px 28px",
              boxShadow: "0 0 40px rgba(0, 240, 255, 0.5)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              maxWidth: "1200px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            {/* Player 1 Side */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
              <div
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "44px",
                  fontWeight: 900,
                  color: "#00F0FF",
                  textShadow: "0 0 20px #00F0FF",
                  minWidth: "50px",
                  textAlign: "center",
                }}
              >
                {p1Score}
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#FFFFFF" }}>{p1Name}</div>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>Handicap: {p1Hc}</div>
              </div>
            </div>

            {/* Center: Shot Clock & Race */}
            <div
              style={{
                textAlign: "center",
                padding: "0 30px",
                borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
                borderRight: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              <div
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "32px",
                  fontWeight: 900,
                  color: shotClockColor,
                  textShadow: `0 0 20px ${shotClockColor}`,
                }}
              >
                {shotClockSeconds}s
              </div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#F59E0B" }}>
                RACE TO {raceTo}
              </div>
            </div>

            {/* Player 2 Side */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "20px", flex: 1 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#FFFFFF" }}>{p2Name}</div>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>Handicap: {p2Hc}</div>
              </div>
              <div
                style={{
                  fontFamily: "Montserrat",
                  fontSize: "44px",
                  fontWeight: 900,
                  color: "#F43F5E",
                  textShadow: "0 0 20px #F43F5E",
                  minWidth: "50px",
                  textAlign: "center",
                }}
              >
                {p2Score}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. REFEREE TOUCH REMOTE CONTROLLER (MOBILE FRIENDLY)           */}
      {/* ============================================================== */}
      {displayMode === "REFEREE_REMOTE" && (
        <main style={{ flex: 1, padding: "20px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
          <div
            style={{
              background: "rgba(10, 20, 40, 0.95)",
              border: "2px solid #00F0FF",
              borderRadius: "24px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#00F0FF", fontWeight: 800 }}>POCKET REFEREE REMOTE</div>
              <div style={{ fontFamily: "Montserrat", fontSize: "18px", fontWeight: 900, color: "#FFFFFF" }}>
                {p1Name} vs {p2Name}
              </div>
            </div>

            {/* Shot Clock Remote */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.6)",
                borderRadius: "16px",
                padding: "16px",
                textAlign: "center",
                border: `1px solid ${shotClockColor}`,
              }}
            >
              <div style={{ fontSize: "40px", fontWeight: 900, color: shotClockColor, fontFamily: "Montserrat" }}>
                {shotClockSeconds}s
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "12px" }}>
                <button
                  onClick={() => setIsShotClockRunning(!isShotClockRunning)}
                  style={{
                    background: isShotClockRunning ? "#EF4444" : "#10B981",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: "10px",
                    fontWeight: 800,
                    border: "none",
                  }}
                >
                  {isShotClockRunning ? "Pause" : "Start"}
                </button>
                <button
                  onClick={() => resetShotClock()}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    border: "none",
                  }}
                >
                  Reset
                </button>
                <button
                  disabled={isExtensionUsed}
                  onClick={applyExtension}
                  style={{
                    background: isExtensionUsed ? "#334155" : "#F59E0B",
                    color: "#000",
                    padding: "12px",
                    borderRadius: "10px",
                    fontWeight: 800,
                    border: "none",
                  }}
                >
                  +30s Ext
                </button>
              </div>
            </div>

            {/* Score Touch Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* P1 */}
              <div style={{ background: "rgba(0, 240, 255, 0.1)", border: "1px solid #00F0FF", borderRadius: "16px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#00F0FF" }}>{p1Name}</div>
                <div style={{ fontSize: "48px", fontWeight: 900, color: "#FFFFFF", margin: "8px 0" }}>{p1Score}</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={handleMinusScoreP1} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px", border: "none" }}>-1</button>
                  <button onClick={handleAddScoreP1} style={{ flex: 2, padding: "12px", background: "#00F0FF", color: "#000", fontWeight: 900, borderRadius: "8px", border: "none" }}>+1 Rack</button>
                </div>
              </div>

              {/* P2 */}
              <div style={{ background: "rgba(225, 29, 72, 0.1)", border: "1px solid #F43F5E", borderRadius: "16px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#F43F5E" }}>{p2Name}</div>
                <div style={{ fontSize: "48px", fontWeight: 900, color: "#FFFFFF", margin: "8px 0" }}>{p2Score}</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={handleMinusScoreP2} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px", border: "none" }}>-1</button>
                  <button onClick={handleAddScoreP2} style={{ flex: 2, padding: "12px", background: "#F43F5E", color: "#fff", fontWeight: 900, borderRadius: "8px", border: "none" }}>+1 Rack</button>
                </div>
              </div>
            </div>

            {selectedMatchId !== "CUSTOM" && (
              <button
                disabled={isSyncing}
                onClick={handleSyncToLiveBackend}
                className="btn-gold"
                style={{ width: "100%", padding: "14px", fontSize: "14px" }}
              >
                {isSyncing ? "Menyimpan ke Server..." : "💾 Simpan Skor ke Bagan Turnamen"}
              </button>
            )}
          </div>
        </main>
      )}

      <style jsx>{`
        @media (max-width: 950px) {
          .scoreboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
