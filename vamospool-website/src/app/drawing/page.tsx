"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Shuffle,
  Play,
  Pause,
  RotateCcw,
  Check,
  Sparkles,
  Flame,
  User,
  Swords,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Lock,
  LogOut,
  ExternalLink,
  ChevronRight,
  Zap,
  Columns,
  Rows,
  Crosshair,
} from "lucide-react";

interface Participant {
  id: string;
  name?: string;
  handicap?: string;
  paymentStatus?: string;
  member?: { name: string; handicap?: string };
}

interface Tournament {
  id: string;
  name: string;
  venue?: string;
  entryFee?: number;
  prizePool?: number;
  maxPlayers?: number;
  status?: string;
  eliminationType?: string;
  participants?: Participant[];
  matches?: any[];
}

export default function LiveDrawingPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoCameraFocus, setAutoCameraFocus] = useState(true);

  // Layout View Mode: STUDIO_SPLIT (1-Screen TV Split) or STAGE_STACK (Top & Bottom)
  const [layoutMode, setLayoutMode] = useState<"STUDIO_SPLIT" | "STAGE_STACK">("STUDIO_SPLIT");

  // Staff Authentication
  const [staffToken, setStaffToken] = useState<string | null>(null);
  const [staffUser, setStaffUser] = useState<{ name?: string; role?: string } | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Drawing State
  const [drawnSlots, setDrawnSlots] = useState<
    Array<{ slotIndex: number; matchNumber: number; slot: 1 | 2; wing: "POOL_A" | "POOL_B"; participant: Participant }>
  >([]);
  const [isDrawingRunning, setIsDrawingRunning] = useState(false);
  const [isRollingAnimation, setIsRollingAnimation] = useState(false);
  const [rollingPlayerName, setRollingPlayerName] = useState("VAMOS POOL");
  const [drawingSpeed, setDrawingSpeed] = useState<"SLOW" | "NORMAL" | "FAST">("NORMAL");
  const [currentDrawnItem, setCurrentDrawnItem] = useState<{
    drawIndex: number;
    ballNumber: number;
    participant: Participant;
    slotDef: { slotIndex: number; matchNumber: number; slot: 1 | 2; wing: "POOL_A" | "POOL_B" };
  } | null>(null);

  const [targetFlashSlot, setTargetFlashSlot] = useState<string | null>(null);
  const [isApplyingToLive, setIsApplyingToLive] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  const timerRef = useRef<any>(null);
  const rollingIntervalRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Load auth state
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("vamos_staff_token");
      const savedUser = localStorage.getItem("vamos_staff_user");
      if (savedToken) {
        setStaffToken(savedToken);
        if (savedUser) setStaffUser(JSON.parse(savedUser));
      }
    } catch (e) {}
  }, []);

  // Web Audio FX synthesizer
  const playSoundEffect = (type: "ROLL" | "DRAW_HIT" | "SLOT_FILL" | "CHEER") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      if (type === "ROLL") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400 + Math.random() * 200, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "DRAW_HIT") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === "SLOT_FILL") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(783.99, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {}
  };

  // Fetch active tournament
  const fetchTournament = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://api.vamospool.id/api/tournaments");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const json = await res.json();
      const list: Tournament[] = Array.isArray(json) ? json : json.data || [];
      const active = list.find((t) => t.status !== "COMPLETED") || list[0];
      if (active) {
        const detailRes = await fetch(`https://api.vamospool.id/api/tournaments/${active.id}`);
        if (detailRes.ok) {
          const detailJson = await detailRes.json();
          setTournament(detailJson.data || detailJson);
        } else {
          setTournament(active);
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

  const participantsList = useMemo(() => {
    return (tournament?.participants || []).slice();
  }, [tournament]);

  const maxSlots = tournament?.maxPlayers || 32;
  const matchCount = Math.floor(maxSlots / 2);

  // Prepare full target slots
  const allSlotDefinitions = useMemo(() => {
    const slots: Array<{ slotIndex: number; matchNumber: number; slot: 1 | 2; wing: "POOL_A" | "POOL_B" }> = [];
    for (let i = 0; i < matchCount; i++) {
      const matchNum = i + 1;
      const wing = matchNum <= Math.ceil(matchCount / 2) ? "POOL_A" : "POOL_B";
      slots.push({ slotIndex: i * 2, matchNumber: matchNum, slot: 1, wing });
      slots.push({ slotIndex: i * 2 + 1, matchNumber: matchNum, slot: 2, wing });
    }
    return slots;
  }, [matchCount]);

  // Execute one step drawing
  const executeSingleDrawStep = (
    currentDrawn: typeof drawnSlots,
    remainingParticipants: Participant[],
    callbackWhenDone?: () => void
  ) => {
    if (remainingParticipants.length === 0 || currentDrawn.length >= allSlotDefinitions.length) {
      setIsDrawingRunning(false);
      return;
    }

    const nextSlotDef = allSlotDefinitions[currentDrawn.length];
    setIsRollingAnimation(true);

    let rollTicks = 0;
    const maxRollTicks = drawingSpeed === "SLOW" ? 12 : drawingSpeed === "NORMAL" ? 7 : 3;

    if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current);

    rollingIntervalRef.current = setInterval(() => {
      rollTicks++;
      const randomIdx = Math.floor(Math.random() * remainingParticipants.length);
      const tempP = remainingParticipants[randomIdx];
      const tempName = tempP.name || tempP.member?.name || "ROLLING...";
      setRollingPlayerName(tempName);
      playSoundEffect("ROLL");

      if (rollTicks >= maxRollTicks) {
        clearInterval(rollingIntervalRef.current);
        setIsRollingAnimation(false);

        const chosenParticipant = remainingParticipants[randomIdx];
        const newDrawnItem = {
          slotIndex: nextSlotDef.slotIndex,
          matchNumber: nextSlotDef.matchNumber,
          slot: nextSlotDef.slot,
          wing: nextSlotDef.wing,
          participant: chosenParticipant,
        };

        const updatedDrawn = [...currentDrawn, newDrawnItem];
        setDrawnSlots(updatedDrawn);

        const slotKey = `M${nextSlotDef.matchNumber}_P${nextSlotDef.slot}`;
        setTargetFlashSlot(slotKey);

        setCurrentDrawnItem({
          drawIndex: updatedDrawn.length,
          ballNumber: updatedDrawn.length,
          participant: chosenParticipant,
          slotDef: nextSlotDef,
        });

        playSoundEffect("DRAW_HIT");
        setTimeout(() => playSoundEffect("SLOT_FILL"), 400);

        // AUTO CAMERA FOCUS: Smoothly scroll and center the match card in view
        if (autoCameraFocus) {
          setTimeout(() => {
            const elem = document.getElementById(`drawing_match_node_${nextSlotDef.matchNumber}`);
            if (elem) {
              elem.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 300);
        }

        if (callbackWhenDone) callbackWhenDone();
      }
    }, 70);
  };

  // Auto Drawing loop
  useEffect(() => {
    if (!isDrawingRunning) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current);
      return;
    }

    const drawnIds = new Set(drawnSlots.map((d) => d.participant.id));
    const remaining = participantsList.filter((p) => !drawnIds.has(p.id));

    if (remaining.length === 0 || drawnSlots.length >= allSlotDefinitions.length) {
      setIsDrawingRunning(false);
      return;
    }

    const delayMs = drawingSpeed === "SLOW" ? 2400 : drawingSpeed === "NORMAL" ? 1400 : 700;

    timerRef.current = setTimeout(() => {
      executeSingleDrawStep(drawnSlots, remaining);
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDrawingRunning, drawnSlots, participantsList, allSlotDefinitions, drawingSpeed, autoCameraFocus]);

  // Login handler
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch("https://api.vamospool.id/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      const token = data.data?.token || data.token;
      const user = data.data?.user || data.user;

      if (!res.ok || !token) {
        throw new Error(data.message || "Email atau password salah");
      }

      setStaffToken(token);
      setStaffUser(user);
      localStorage.setItem("vamos_staff_token", token);
      localStorage.setItem("vamos_staff_user", JSON.stringify(user));

      setIsLoginModalOpen(false);
      setLoginEmail("");
      setLoginPassword("");
    } catch (err: any) {
      setLoginError(err.message || "Login gagal");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Staff Smart Auto-Drawing and Sync to Database
  const handleInstantSmartShuffle = async () => {
    if (!tournament) return;
    if (!staffToken) {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      setIsApplyingToLive(true);
      const res = await fetch(`https://api.vamospool.id/api/tournaments/${tournament.id}/reshuffle-bracket`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${staffToken}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal mengocok bagan turnamen");
      }

      setApplySuccess(true);
      playSoundEffect("CHEER");
      setTimeout(() => {
        window.location.href = "/bracket";
      }, 1500);
    } catch (e: any) {
      alert(e.message || "Gagal melakukan smart drawing");
    } finally {
      setIsApplyingToLive(false);
    }
  };

  // Reset Drawing Stage
  const handleResetDrawing = () => {
    setIsDrawingRunning(false);
    setDrawnSlots([]);
    setCurrentDrawnItem(null);
    setTargetFlashSlot(null);
    setApplySuccess(false);
  };

  const getPlayerTeamTag = (name: string) => {
    if (!name) return null;
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, rgba(0, 102, 255, 0.28) 0%, rgba(3, 6, 14, 1) 75%)",
        color: "#F1F5F9",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      {/* Header Sticky */}
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
          {/* Back & Tournament Title */}
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
              <span>Lihat Bagan</span>
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
                  LIVE DRAWING CEREMONY
                </h1>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 900,
                    color: "#00F0FF",
                    background: "rgba(0, 240, 255, 0.15)",
                    border: "1px solid rgba(0, 240, 255, 0.4)",
                    padding: "2px 8px",
                    borderRadius: "100px",
                  }}
                >
                  🎯 STAGE BROADCAST
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                {tournament?.name || "VAMOS TOURNAMENT"} • {participantsList.length} / {maxSlots} PESERTA
              </div>
            </div>
          </div>

          {/* Layout Mode Switcher */}
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
              onClick={() => setLayoutMode("STUDIO_SPLIT")}
              style={{
                background: layoutMode === "STUDIO_SPLIT" ? "linear-gradient(135deg, #00F0FF, #0066FF)" : "transparent",
                color: layoutMode === "STUDIO_SPLIT" ? "#040811" : "#94A3B8",
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
              title="Tampilan 1 Layar TV: Spotlight di kiri & Bagan di kanan agar semua muat di 1 layar"
            >
              <Columns size={13} />
              <span>🖥️ 1 Layar Penuh (Split)</span>
            </button>

            <button
              onClick={() => setLayoutMode("STAGE_STACK")}
              style={{
                background: layoutMode === "STAGE_STACK" ? "linear-gradient(135deg, #00F0FF, #0066FF)" : "transparent",
                color: layoutMode === "STAGE_STACK" ? "#040811" : "#94A3B8",
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
              title="Tampilan Atas-Bawah Tradisional"
            >
              <Rows size={13} />
              <span>📺 Atas - Bawah</span>
            </button>
          </div>

          {/* Right Action Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Auto Camera Focus Toggle */}
            <button
              onClick={() => setAutoCameraFocus(!autoCameraFocus)}
              title={autoCameraFocus ? "Auto-Focus Kamera: AKTIF (Otomatis geser ke slot yang diundi)" : "Auto-Focus Kamera: NONAKTIF"}
              style={{
                background: autoCameraFocus ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)",
                border: autoCameraFocus ? "1px solid #10B981" : "1px solid rgba(255, 255, 255, 0.1)",
                color: autoCameraFocus ? "#10B981" : "#64748B",
                padding: "6px 10px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Crosshair size={13} />
              <span>Auto Focus {autoCameraFocus ? "ON" : "OFF"}</span>
            </button>

            {/* Audio Toggle */}
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
                display: "flex",
                alignItems: "center",
              }}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            {/* Fullscreen Button */}
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
              <span>{isFullscreen ? "Exit" : "Proyektor"}</span>
            </button>

            {/* Staff Auth Button */}
            {staffToken ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  padding: "4px 8px",
                  borderRadius: "8px",
                }}
              >
                <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700 }}>
                  🟢 Panitia
                </span>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#94A3B8",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                <Lock size={12} />
                <span>Login Panitia</span>
              </button>
            )}

            {/* Apply & Sync Button */}
            <button
              disabled={isApplyingToLive}
              onClick={handleInstantSmartShuffle}
              className="btn-gold"
              style={{
                padding: "6px 14px",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Shuffle size={13} />
              <span>{isApplyingToLive ? "Sync..." : "⚡ Terapkan"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Drawing Stage Area */}
      <main
        style={{
          flex: 1,
          padding: "16px 18px 40px 18px",
          maxWidth: "1800px",
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {applySuccess && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.25)",
              border: "2px solid #10B981",
              color: "#10B981",
              padding: "12px",
              borderRadius: "12px",
              textAlign: "center",
              fontSize: "15px",
              fontWeight: 800,
              boxShadow: "0 0 40px rgba(16, 185, 129, 0.4)",
            }}
          >
            🎉 HASIL UNDIAN DISINKRONKAN! Membuka bagan utama...
          </div>
        )}

        {/* CONTAINER WRAPPER: SWITCH BETWEEN STUDIO SPLIT & STAGE STACK */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: layoutMode === "STUDIO_SPLIT" ? "420px 1fr" : "1fr",
            gap: "20px",
            alignItems: "start",
          }}
          className="drawing-main-grid"
        >
          {/* ============================================================== */}
          {/* LEFT / TOP: SPOTLIGHT & CONTROL DECK (STICKY IN SPLIT MODE)    */}
          {/* ============================================================== */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: layoutMode === "STUDIO_SPLIT" ? "sticky" : "relative",
              top: layoutMode === "STUDIO_SPLIT" ? "70px" : "0",
              zIndex: 30,
            }}
          >
            {/* Spotlight Banner Card */}
            <div
              style={{
                position: "relative",
                background: "linear-gradient(135deg, rgba(0, 102, 255, 0.25) 0%, rgba(6, 14, 30, 0.98) 60%, rgba(0, 240, 255, 0.15) 100%)",
                border: "2px solid #00F0FF",
                borderRadius: "22px",
                padding: "24px 20px",
                boxShadow: "0 0 50px rgba(0, 240, 255, 0.35), inset 0 0 30px rgba(0, 102, 255, 0.2)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                overflow: "hidden",
                minHeight: layoutMode === "STUDIO_SPLIT" ? "320px" : "220px",
              }}
            >
              {isRollingAnimation ? (
                <div style={{ width: "100%", zIndex: 10 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "linear-gradient(135deg, #F59E0B, #D97706)",
                      color: "#040811",
                      fontFamily: "Montserrat",
                      fontWeight: 900,
                      fontSize: "12px",
                      padding: "4px 14px",
                      borderRadius: "100px",
                      marginBottom: "14px",
                      boxShadow: "0 0 20px rgba(245, 158, 11, 0.6)",
                      animation: "pulse 0.6s infinite alternate",
                    }}
                  >
                    <Shuffle size={14} className="animate-spin" />
                    <span>MENGUNDI SLOT #{drawnSlots.length + 1}...</span>
                  </div>

                  <div
                    style={{
                      fontFamily: "Montserrat",
                      fontSize: layoutMode === "STUDIO_SPLIT" ? "34px" : "42px",
                      fontWeight: 900,
                      color: "#F59E0B",
                      textShadow: "0 0 30px rgba(245, 158, 11, 0.9)",
                      minHeight: "50px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {rollingPlayerName}
                  </div>
                </div>
              ) : currentDrawnItem ? (
                <div style={{ width: "100%", zIndex: 10 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "linear-gradient(135deg, #00F0FF, #0066FF)",
                      color: "#040811",
                      fontFamily: "Montserrat",
                      fontWeight: 900,
                      fontSize: "12px",
                      padding: "4px 14px",
                      borderRadius: "100px",
                      marginBottom: "12px",
                      boxShadow: "0 0 25px rgba(0, 240, 255, 0.6)",
                    }}
                  >
                    <Sparkles size={13} />
                    <span>BOLA #{currentDrawnItem.ballNumber} DARI {participantsList.length}</span>
                  </div>

                  {/* EXTRA LARGE ATHLETE NAME */}
                  <div
                    style={{
                      fontFamily: "Montserrat",
                      fontSize: layoutMode === "STUDIO_SPLIT" ? "36px" : "46px",
                      fontWeight: 900,
                      color: "#FFFFFF",
                      textShadow: "0 0 30px rgba(0, 240, 255, 0.9), 0 0 50px rgba(0, 102, 255, 0.6)",
                      marginBottom: "8px",
                      lineHeight: 1.15,
                    }}
                  >
                    {currentDrawnItem.participant.name || currentDrawnItem.participant.member?.name || "Peserta"}
                  </div>

                  {/* Handicap & Club Tag */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <span
                      style={{
                        background: "rgba(245, 158, 11, 0.18)",
                        border: "1px solid #F59E0B",
                        color: "#F59E0B",
                        fontSize: "12px",
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: "6px",
                      }}
                    >
                      HC: {currentDrawnItem.participant.handicap || currentDrawnItem.participant.member?.handicap || "3"}
                    </span>

                    {(() => {
                      const rawName = currentDrawnItem.participant.name || currentDrawnItem.participant.member?.name || "";
                      const teamTag = getPlayerTeamTag(rawName);
                      if (teamTag) {
                        return (
                          <span
                            style={{
                              background: "rgba(0, 240, 255, 0.15)",
                              border: "1px solid #00F0FF",
                              color: "#00F0FF",
                              fontSize: "12px",
                              fontWeight: 800,
                              padding: "3px 10px",
                              borderRadius: "6px",
                            }}
                          >
                            KLUB: {teamTag}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Destination Slot */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(0, 240, 255, 0.15)",
                      border: "1.5px solid #00F0FF",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      color: "#00F0FF",
                      fontSize: "13px",
                      fontWeight: 900,
                      fontFamily: "Montserrat",
                      boxShadow: "0 0 20px rgba(0, 240, 255, 0.35)",
                    }}
                  >
                    <span>📍</span>
                    <span
                      style={{
                        background: currentDrawnItem.slotDef.wing === "POOL_A" ? "linear-gradient(135deg, #00F0FF, #0066FF)" : "linear-gradient(135deg, #E11D48, #BE123C)",
                        color: "#FFFFFF",
                        padding: "2px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      MATCH #{currentDrawnItem.slotDef.matchNumber} • SLOT {currentDrawnItem.slotDef.slot} ({currentDrawnItem.slotDef.wing === "POOL_A" ? "POOL A" : "POOL B"})
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ zIndex: 10 }}>
                  <Shuffle size={36} style={{ color: "#00F0FF", margin: "0 auto 10px auto" }} />
                  <h3 style={{ fontFamily: "Montserrat", fontSize: "18px", fontWeight: 800, color: "#F1F5F9", marginBottom: "6px" }}>
                    Undian Siap Dimulai
                  </h3>
                  <p style={{ fontSize: "12px", color: "#94A3B8", maxWidth: "300px", margin: "0 auto" }}>
                    Klik <b>"Mulai Auto-Drawing"</b> untuk mengundi slot satu per satu.
                  </p>
                </div>
              )}
            </div>

            {/* Control Deck */}
            <div
              style={{
                background: "rgba(8, 14, 28, 0.85)",
                border: "1px solid rgba(0, 240, 255, 0.2)",
                borderRadius: "18px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* Progress */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#00F0FF", fontWeight: 800 }}>PROGRESS</span>
                  <span style={{ fontFamily: "Montserrat", fontSize: "12px", fontWeight: 800, color: "#10B981" }}>
                    {drawnSlots.length} / {participantsList.length} Terundi
                  </span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "100px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(drawnSlots.length / Math.max(1, participantsList.length)) * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #00F0FF, #10B981)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Speed Buttons */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700 }}>Kecepatan:</span>
                <div style={{ display: "flex", gap: "4px" }}>
                  {(["SLOW", "NORMAL", "FAST"] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setDrawingSpeed(spd)}
                      style={{
                        background: drawingSpeed === spd ? "rgba(0, 240, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        border: drawingSpeed === spd ? "1px solid #00F0FF" : "1px solid rgba(255, 255, 255, 0.1)",
                        color: drawingSpeed === spd ? "#00F0FF" : "#94A3B8",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "10px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {spd === "SLOW" ? "Dramatis" : spd === "NORMAL" ? "Normal" : "Cepat"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Controller Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  onClick={() => {
                    if (drawnSlots.length >= participantsList.length) {
                      handleResetDrawing();
                    } else {
                      setIsDrawingRunning(!isDrawingRunning);
                    }
                  }}
                  style={{
                    background: isDrawingRunning ? "rgba(239, 68, 68, 0.2)" : "linear-gradient(135deg, #00F0FF, #0066FF)",
                    border: isDrawingRunning ? "1px solid #EF4444" : "none",
                    color: isDrawingRunning ? "#EF4444" : "#040811",
                    padding: "10px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 900,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {isDrawingRunning ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isDrawingRunning ? "Pause" : drawnSlots.length >= participantsList.length ? "Ulangi" : "Auto-Draw"}</span>
                </button>

                <button
                  onClick={() => {
                    const drawnIds = new Set(drawnSlots.map((d) => d.participant.id));
                    const remaining = participantsList.filter((p) => !drawnIds.has(p.id));
                    executeSingleDrawStep(drawnSlots, remaining);
                  }}
                  disabled={isDrawingRunning || isRollingAnimation || drawnSlots.length >= participantsList.length}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#F1F5F9",
                    padding: "10px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    opacity: isDrawingRunning || drawnSlots.length >= participantsList.length ? 0.5 : 1,
                  }}
                >
                  <Sparkles size={14} />
                  <span>Undi 1 Bola</span>
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT / BOTTOM: LIVE BRACKET SLOTS GRID WITH CAMERA TRACKING   */}
          {/* ============================================================== */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
            className="drawing-slots-grid"
          >
            {/* POOL A */}
            <div
              style={{
                background: "rgba(8, 14, 28, 0.75)",
                border: "1px solid rgba(0, 240, 255, 0.3)",
                borderRadius: "20px",
                padding: "18px",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, #00F0FF, #0066FF)",
                  color: "#040811",
                  fontFamily: "Montserrat",
                  fontWeight: 900,
                  fontSize: "12px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  textAlign: "center",
                  marginBottom: "14px",
                  letterSpacing: "0.05em",
                }}
              >
                🔵 POOL A • SAYAP KIRI (MATCH #01 s/d #{Math.ceil(matchCount / 2)})
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                {Array.from({ length: Math.ceil(matchCount / 2) }).map((_, mIdx) => {
                  const matchNum = mIdx + 1;
                  const slot1Item = drawnSlots.find((d) => d.matchNumber === matchNum && d.slot === 1);
                  const slot2Item = drawnSlots.find((d) => d.matchNumber === matchNum && d.slot === 2);

                  const isSlot1Flashing = targetFlashSlot === `M${matchNum}_P1`;
                  const isSlot2Flashing = targetFlashSlot === `M${matchNum}_P2`;
                  const isMatchActive = isSlot1Flashing || isSlot2Flashing;

                  return (
                    <div
                      id={`drawing_match_node_${matchNum}`}
                      key={matchNum}
                      style={{
                        background: isMatchActive ? "rgba(0, 240, 255, 0.15)" : "rgba(5, 10, 22, 0.9)",
                        border: isMatchActive ? "2px solid #00F0FF" : "1px solid rgba(0, 240, 255, 0.2)",
                        borderRadius: "12px",
                        padding: "10px 12px",
                        boxShadow: isMatchActive ? "0 0 30px rgba(0, 240, 255, 0.6)" : "none",
                        transform: isMatchActive ? "scale(1.02)" : "scale(1)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "#00F0FF", fontFamily: "Montserrat" }}>
                          MATCH #{matchNum}
                        </span>
                        <span style={{ fontSize: "9px", color: slot1Item && slot2Item ? "#10B981" : "#F59E0B", fontWeight: 700 }}>
                          {slot1Item && slot2Item ? "✓ Siap Tanding" : "● Menunggu"}
                        </span>
                      </div>

                      {/* Slot 1 */}
                      <div
                        style={{
                          background: slot1Item ? (isSlot1Flashing ? "rgba(0, 240, 255, 0.35)" : "rgba(255, 255, 255, 0.05)") : "rgba(255, 255, 255, 0.02)",
                          border: slot1Item ? "1px solid rgba(0, 240, 255, 0.4)" : "1px dashed rgba(255, 255, 255, 0.1)",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                          <span style={{ fontSize: "9px", color: "#64748B", fontWeight: 700 }}>P1:</span>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: slot1Item ? 800 : 400,
                              color: slot1Item ? "#FFFFFF" : "#475569",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {slot1Item ? (slot1Item.participant.name || slot1Item.participant.member?.name) : "— Belum Terundi —"}
                          </span>
                        </div>
                        {slot1Item && (
                          <span style={{ fontSize: "10px", color: "#10B981", fontWeight: 800, flexShrink: 0 }}>
                            [HC: {slot1Item.participant.handicap || slot1Item.participant.member?.handicap || "3"}]
                          </span>
                        )}
                      </div>

                      {/* Slot 2 */}
                      <div
                        style={{
                          background: slot2Item ? (isSlot2Flashing ? "rgba(0, 240, 255, 0.35)" : "rgba(255, 255, 255, 0.05)") : "rgba(255, 255, 255, 0.02)",
                          border: slot2Item ? "1px solid rgba(0, 240, 255, 0.4)" : "1px dashed rgba(255, 255, 255, 0.1)",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                          <span style={{ fontSize: "9px", color: "#64748B", fontWeight: 700 }}>P2:</span>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: slot2Item ? 800 : 400,
                              color: slot2Item ? "#FFFFFF" : "#475569",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {slot2Item ? (slot2Item.participant.name || slot2Item.participant.member?.name) : "— Belum Terundi —"}
                          </span>
                        </div>
                        {slot2Item && (
                          <span style={{ fontSize: "10px", color: "#10B981", fontWeight: 800, flexShrink: 0 }}>
                            [HC: {slot2Item.participant.handicap || slot2Item.participant.member?.handicap || "3"}]
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* POOL B */}
            <div
              style={{
                background: "rgba(8, 14, 28, 0.75)",
                border: "1px solid rgba(225, 29, 72, 0.3)",
                borderRadius: "20px",
                padding: "18px",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, #E11D48, #BE123C)",
                  color: "#FFFFFF",
                  fontFamily: "Montserrat",
                  fontWeight: 900,
                  fontSize: "12px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  textAlign: "center",
                  marginBottom: "14px",
                  letterSpacing: "0.05em",
                }}
              >
                🔴 POOL B • SAYAP KANAN (MATCH #{Math.ceil(matchCount / 2) + 1} s/d #{matchCount})
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                {Array.from({ length: Math.floor(matchCount / 2) }).map((_, idx) => {
                  const matchNum = Math.ceil(matchCount / 2) + idx + 1;
                  const slot1Item = drawnSlots.find((d) => d.matchNumber === matchNum && d.slot === 1);
                  const slot2Item = drawnSlots.find((d) => d.matchNumber === matchNum && d.slot === 2);

                  const isSlot1Flashing = targetFlashSlot === `M${matchNum}_P1`;
                  const isSlot2Flashing = targetFlashSlot === `M${matchNum}_P2`;
                  const isMatchActive = isSlot1Flashing || isSlot2Flashing;

                  return (
                    <div
                      id={`drawing_match_node_${matchNum}`}
                      key={matchNum}
                      style={{
                        background: isMatchActive ? "rgba(225, 29, 72, 0.15)" : "rgba(5, 10, 22, 0.9)",
                        border: isMatchActive ? "2px solid #E11D48" : "1px solid rgba(225, 29, 72, 0.2)",
                        borderRadius: "12px",
                        padding: "10px 12px",
                        boxShadow: isMatchActive ? "0 0 30px rgba(225, 29, 72, 0.6)" : "none",
                        transform: isMatchActive ? "scale(1.02)" : "scale(1)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "#F43F5E", fontFamily: "Montserrat" }}>
                          MATCH #{matchNum}
                        </span>
                        <span style={{ fontSize: "9px", color: slot1Item && slot2Item ? "#10B981" : "#F59E0B", fontWeight: 700 }}>
                          {slot1Item && slot2Item ? "✓ Siap Tanding" : "● Menunggu"}
                        </span>
                      </div>

                      {/* Slot 1 */}
                      <div
                        style={{
                          background: slot1Item ? (isSlot1Flashing ? "rgba(225, 29, 72, 0.35)" : "rgba(255, 255, 255, 0.05)") : "rgba(255, 255, 255, 0.02)",
                          border: slot1Item ? "1px solid rgba(225, 29, 72, 0.4)" : "1px dashed rgba(255, 255, 255, 0.1)",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                          <span style={{ fontSize: "9px", color: "#64748B", fontWeight: 700 }}>P1:</span>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: slot1Item ? 800 : 400,
                              color: slot1Item ? "#FFFFFF" : "#475569",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {slot1Item ? (slot1Item.participant.name || slot1Item.participant.member?.name) : "— Belum Terundi —"}
                          </span>
                        </div>
                        {slot1Item && (
                          <span style={{ fontSize: "10px", color: "#10B981", fontWeight: 800, flexShrink: 0 }}>
                            [HC: {slot1Item.participant.handicap || slot1Item.participant.member?.handicap || "3"}]
                          </span>
                        )}
                      </div>

                      {/* Slot 2 */}
                      <div
                        style={{
                          background: slot2Item ? (isSlot2Flashing ? "rgba(225, 29, 72, 0.35)" : "rgba(255, 255, 255, 0.05)") : "rgba(255, 255, 255, 0.02)",
                          border: slot2Item ? "1px solid rgba(225, 29, 72, 0.4)" : "1px dashed rgba(255, 255, 255, 0.1)",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                          <span style={{ fontSize: "9px", color: "#64748B", fontWeight: 700 }}>P2:</span>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: slot2Item ? 800 : 400,
                              color: slot2Item ? "#FFFFFF" : "#475569",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {slot2Item ? (slot2Item.participant.name || slot2Item.participant.member?.name) : "— Belum Terundi —"}
                          </span>
                        </div>
                        {slot2Item && (
                          <span style={{ fontSize: "10px", color: "#10B981", fontWeight: 800, flexShrink: 0 }}>
                            [HC: {slot2Item.participant.handicap || slot2Item.participant.member?.handicap || "3"}]
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Staff Login Modal */}
      {isLoginModalOpen && (
        <div
          onClick={() => setIsLoginModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 150,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(10, 20, 40, 0.98)",
              border: "2px solid #00F0FF",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 0 50px rgba(0, 240, 255, 0.35)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #00F0FF, #0066FF)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto",
                  boxShadow: "0 0 25px rgba(0, 240, 255, 0.5)",
                }}
              >
                <Lock size={22} color="#040811" />
              </div>
              <h2 style={{ fontFamily: "Montserrat", fontSize: "18px", fontWeight: 900, color: "#F1F5F9", margin: 0 }}>
                Login Panitia Technical Meeting
              </h2>
              <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
                Masukkan akun admin atau kasir Vamos untuk menerapkan hasil drawing ke sistem turnamen.
              </p>
            </div>

            {loginError && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid #EF4444",
                  color: "#EF4444",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                {loginError}
              </div>
            )}

            <form onSubmit={handleStaffLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", fontWeight: 700, marginBottom: "6px" }}>
                  EMAIL / USERNAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="admin@vamos.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(4, 8, 17, 0.9)",
                    border: "1px solid rgba(0, 240, 255, 0.25)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    color: "#F1F5F9",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", fontWeight: 700, marginBottom: "6px" }}>
                  PASSWORD / PIN
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(4, 8, 17, 0.9)",
                    border: "1px solid rgba(0, 240, 255, 0.25)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    color: "#F1F5F9",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="submit" disabled={isLoggingIn} className="btn-gold" style={{ flex: 1, padding: "12px", fontSize: "13px" }}>
                  {isLoggingIn ? "Memverifikasi..." : "Login & Terapkan"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#94A3B8",
                    border: "none",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 1024px) {
          .drawing-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .drawing-slots-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
