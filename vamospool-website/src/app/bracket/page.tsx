"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Search, RefreshCw, Maximize2, Minimize2, Check, Sparkles, Flame, User, Swords, GitBranch, ListFilter, LayoutGrid, Edit3, Plus, Minus, ShieldCheck, AlertCircle, Layers, Shuffle, Lock, Unlock, LogOut, Key, Tv } from "lucide-react";

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
  startDate?: string;
  entryFee?: number;
  prizePool?: number;
  prizeChampion?: number;
  prizeRunnerUp?: number;
  format?: string;
  status?: string;
  eliminationType?: string;
  transitionSize?: number;
  maxPlayers?: number;
  matches?: Match[];
  participants?: any[];
}

export default function BracketPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [bracketMode, setBracketMode] = useState<"DUAL_WING" | "LINEAR" | "LIST">("DUAL_WING");
  const [activeBracketType, setActiveBracketType] = useState<"WINNERS" | "LOSERS">("WINNERS");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Staff Authentication State
  const [staffToken, setStaffToken] = useState<string | null>(null);
  const [staffUser, setStaffUser] = useState<{ name?: string; role?: string } | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Edit Score States (Staff Only)
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [editScore1, setEditScore1] = useState(0);
  const [editScore2, setEditScore2] = useState(0);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Load saved token on mount
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

  // Fetch tournament from public API
  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://api.vamospool.id/api/tournaments");
      if (!res.ok) throw new Error("Gagal mengambil data turnamen");
      const json = await res.json();
      const list: Tournament[] = Array.isArray(json) ? json : (json.data || []);

      if (list && list.length > 0) {
        const active = list.find((t) => t.status !== "COMPLETED") || list[0];
        if (active) {
          try {
            const detailRes = await fetch(`https://api.vamospool.id/api/tournaments/${active.id}`);
            if (detailRes.ok) {
              const detailJson = await detailRes.json();
              const fullData = detailJson.data || detailJson;
              setTournament(fullData);
            } else {
              setTournament(active);
            }
          } catch (e) {
            setTournament(active);
          }
        }
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Fetch tournament error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentData();
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(fetchTournamentData, 10000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

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

  const isDoubleElimination = useMemo(() => {
    if (!tournament) return false;
    return tournament.eliminationType === "DOUBLE" || (tournament.matches || []).some((m) => m.bracket === "LOSERS");
  }, [tournament]);

  // Login handler
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch("https://api.vamospool.id/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
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

  // Logout handler
  const handleStaffLogout = () => {
    setStaffToken(null);
    setStaffUser(null);
    setIsEditingScore(false);
    localStorage.removeItem("vamos_staff_token");
    localStorage.removeItem("vamos_staff_user");
  };

  // Open detail/edit modal
  const handleOpenMatchModal = (m: Match) => {
    setSelectedMatch(m);
    setEditScore1(m.score1 || 0);
    setEditScore2(m.score2 || 0);
    setIsEditingScore(false);
    setSaveSuccessMsg(null);
  };

  // Submit score update (Staff only)
  const handleSaveScore = async () => {
    if (!selectedMatch) return;
    if (!staffToken) {
      setIsLoginModalOpen(true);
      return;
    }

    if (editScore1 === editScore2) {
      alert("Pertandingan biliar harus memiliki pemenang (tidak boleh seri).");
      return;
    }

    const winnerId = editScore1 > editScore2 ? selectedMatch.player1Id : selectedMatch.player2Id;
    if (!winnerId) {
      alert("Pemain belum terdaftar pada slot ini.");
      return;
    }

    try {
      setIsSavingScore(true);
      const res = await fetch(`https://api.vamospool.id/api/tournaments/matches/${selectedMatch.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${staffToken}`
        },
        body: JSON.stringify({
          score1: editScore1,
          score2: editScore2,
          winnerId: winnerId
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Gagal mengupdate skor (Sesi login berakhir)");
      }

      setSaveSuccessMsg("✅ Skor pertandingan berhasil disimpan & bagan terupdate!");
      setIsEditingScore(false);
      await fetchTournamentData();

      setTimeout(() => {
        setSaveSuccessMsg(null);
        setSelectedMatch(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan skor");
      if (err.message?.includes("Sesi") || err.message?.includes("Unauthorized")) {
        handleStaffLogout();
        setIsLoginModalOpen(true);
      }
    } finally {
      setIsSavingScore(false);
    }
  };

  // Filter matches by current bracket tab (Winners vs Losers)
  const matches = useMemo(() => {
    const allMatches = tournament?.matches || [];
    if (!isDoubleElimination) {
      return allMatches.slice().sort((a, b) => Number(a.matchNumber) - Number(b.matchNumber));
    }
    return allMatches
      .filter((m) => (m.bracket || "WINNERS") === activeBracketType)
      .sort((a, b) => Number(a.matchNumber) - Number(b.matchNumber));
  }, [tournament, isDoubleElimination, activeBracketType]);

  // Group matches by round
  const roundMap = useMemo(() => {
    const map: Record<number, Match[]> = {};
    matches.forEach((m) => {
      const r = Number(m.round) || 1;
      if (!map[r]) map[r] = [];
      map[r].push(m);
    });
    return map;
  }, [matches]);

  const roundsList = useMemo(() => {
    return Object.keys(roundMap).map(Number).sort((a, b) => a - b);
  }, [roundMap]);

  // Helper to get player info from participant list
  const getPlayerInfo = (m: Match | undefined, slot: 1 | 2) => {
    if (!m) return { name: "TBD", hc: "", score: 0, isWinner: false, isSearchMatch: false };
    
    let p = slot === 1 ? m.player1 : m.player2;
    const pId = slot === 1 ? m.player1Id : m.player2Id;

    if (!p && pId && tournament?.participants) {
      p = tournament.participants.find((pt: any) => pt.id === pId);
    }

    const pName = p ? (p.name || p.member?.name || `Peserta ${slot}`) : (m.status === 'COMPLETED' ? 'BYE' : 'TBD');
    const pHC = p?.handicap || (p as any)?.member?.handicap || '3';
    const score = slot === 1 ? (m.score1 ?? 0) : (m.score2 ?? 0);
    const isWinner = !!(m.winnerId && m.winnerId === pId && pId);
    const isSearchMatch = searchQuery ? pName.toLowerCase().includes(searchQuery.toLowerCase().trim()) : false;

    return { name: pName, hc: pHC, score, isWinner, isSearchMatch };
  };

  // Render a match node card in the bracket tree
  const renderMatchNode = (m: Match | undefined, isFinal = false) => {
    if (!m) {
      return (
        <div style={{
          width: isFinal ? "280px" : "240px",
          background: "rgba(10, 16, 32, 0.4)",
          border: "1px dashed rgba(0, 240, 255, 0.2)",
          borderRadius: "12px",
          padding: "16px 12px",
          textAlign: "center",
          color: "#475569",
          fontSize: "11px",
        }}>
          Menunggu Babak Sebelumnya...
        </div>
      );
    }

    const p1 = getPlayerInfo(m, 1);
    const p2 = getPlayerInfo(m, 2);
    const isSearchTarget = p1.isSearchMatch || p2.isSearchMatch;
    const isDone = m.status === "COMPLETED";
    const isLoserBracket = m.bracket === "LOSERS";

    return (
      <div
        key={m.id}
        onClick={() => handleOpenMatchModal(m)}
        style={{
          width: isFinal ? "280px" : "240px",
          background: isSearchTarget 
            ? "linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(10, 28, 54, 0.95))" 
            : isFinal 
              ? "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(10, 20, 40, 0.95))"
              : isDone 
                ? "rgba(8, 16, 32, 0.92)" 
                : "rgba(6, 12, 24, 0.85)",
          border: isSearchTarget
            ? "2px solid #00F0FF"
            : isFinal
              ? "2px solid #F59E0B"
              : isDone 
                ? "1px solid rgba(16, 185, 129, 0.4)" 
                : isLoserBracket
                  ? "1px solid rgba(245, 158, 11, 0.25)"
                  : "1px solid rgba(0, 240, 255, 0.2)",
          borderRadius: "12px",
          padding: "10px 12px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: isSearchTarget 
            ? "0 0 25px rgba(0, 240, 255, 0.5)" 
            : isFinal 
              ? "0 0 30px rgba(245, 158, 11, 0.3)" 
              : "0 4px 15px rgba(0, 0, 0, 0.3)",
          position: "relative",
          zIndex: 10,
        }}
        className="bracket-card-node"
        title="Klik untuk lihat detail pertandingan"
      >
        {/* Match Header Tag */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{
              fontSize: "9px",
              fontWeight: 800,
              fontFamily: "Montserrat",
              color: isFinal ? "#F59E0B" : (isLoserBracket ? "#F59E0B" : "#00F0FF"),
              background: isFinal ? "rgba(245, 158, 11, 0.15)" : (isLoserBracket ? "rgba(245, 158, 11, 0.12)" : "rgba(0, 240, 255, 0.12)"),
              padding: "1px 6px",
              borderRadius: "4px"
            }}>
              #{m.matchNumber} {isLoserBracket && "• LB"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              fontSize: "8px",
              fontWeight: 800,
              color: isDone ? "#10B981" : "#F59E0B",
              textTransform: "uppercase"
            }}>
              {isDone ? "✓ Selesai" : "● Live"}
            </span>
            {staffToken && <Edit3 size={10} style={{ color: "#00F0FF", opacity: 0.8 }} />}
          </div>
        </div>

        {/* Player 1 Row */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px 6px",
          borderRadius: "6px",
          background: p1.isWinner ? "rgba(16, 185, 129, 0.18)" : "transparent",
          color: p1.isWinner ? "#10B981" : (p1.isSearchMatch ? "#00F0FF" : "#F1F5F9"),
          fontWeight: p1.isWinner || p1.isSearchMatch ? 700 : 500,
          fontSize: "12px",
          marginBottom: "2px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", overflow: "hidden" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
              {p1.name}
            </span>
            {p1.hc && (
              <span style={{ fontSize: "9px", color: p1.isWinner ? "#10B981" : "#94A3B8", fontWeight: 600 }}>
                [{p1.hc}]
              </span>
            )}
          </div>
          <span style={{
            fontFamily: "Montserrat",
            fontWeight: 900,
            fontSize: "13px",
            color: p1.isWinner ? "#10B981" : "#64748B",
            marginLeft: "6px",
          }}>
            {p1.score}
          </span>
        </div>

        {/* Player 2 Row */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px 6px",
          borderRadius: "6px",
          background: p2.isWinner ? "rgba(16, 185, 129, 0.18)" : "transparent",
          color: p2.isWinner ? "#10B981" : (p2.isSearchMatch ? "#00F0FF" : "#F1F5F9"),
          fontWeight: p2.isWinner || p2.isSearchMatch ? 700 : 500,
          fontSize: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", overflow: "hidden" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
              {p2.name}
            </span>
            {p2.hc && (
              <span style={{ fontSize: "9px", color: p2.isWinner ? "#10B981" : "#94A3B8", fontWeight: 600 }}>
                [{p2.hc}]
              </span>
            )}
          </div>
          <span style={{
            fontFamily: "Montserrat",
            fontWeight: 900,
            fontSize: "13px",
            color: p2.isWinner ? "#10B981" : "#64748B",
            marginLeft: "6px",
          }}>
            {p2.score}
          </span>
        </div>
      </div>
    );
  };

  // Prepare rounds for Dual-Wing representation
  const r1 = roundMap[1] || [];
  const r2 = roundMap[2] || [];
  const r3 = roundMap[3] || [];
  const r4 = roundMap[4] || [];
  const r5 = roundMap[5] || [];

  // Left Wing
  const leftR1 = r1.slice(0, Math.ceil(r1.length / 2));
  const leftR2 = r2.slice(0, Math.ceil(r2.length / 2));
  const leftR3 = r3.slice(0, Math.ceil(r3.length / 2));
  const leftSF = r4[0];

  // Center (Grand Final)
  const finalMatch = r5[0];

  // Right Wing
  const rightSF = r4[1];
  const rightR3 = r3.slice(Math.ceil(r3.length / 2));
  const rightR2 = r2.slice(Math.ceil(r2.length / 2));
  const rightR1 = r1.slice(Math.ceil(r1.length / 2));

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 0%, rgba(0, 102, 255, 0.2) 0%, rgba(4, 8, 17, 1) 80%)",
      color: "#F1F5F9",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top Sticky Header */}
      <header style={{
        background: "rgba(4, 8, 17, 0.95)",
        borderBottom: "1px solid rgba(0, 240, 255, 0.2)",
        padding: "14px 20px",
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(16px)",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          maxWidth: "1800px",
          margin: "0 auto",
        }}>
          {/* Back & Tournament Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Link
              href="/#tournaments"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#94A3B8",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: 600,
                background: "rgba(255, 255, 255, 0.06)",
                padding: "8px 12px",
                borderRadius: "8px",
              }}
            >
              <ArrowLeft size={14} />
              <span>Beranda</span>
            </Link>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1 style={{
                  fontFamily: "Montserrat",
                  fontSize: "17px",
                  fontWeight: 900,
                  color: "#F1F5F9",
                  margin: 0
                }}>
                  {tournament?.name || "VAMOS FUN GAME"}
                </h1>
                <span style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: isDoubleElimination ? "#F59E0B" : "#10B981",
                  background: isDoubleElimination ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                  border: isDoubleElimination ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                  padding: "2px 8px",
                  borderRadius: "100px"
                }}>
                  {isDoubleElimination ? "⚡ DOUBLE ELIMINATION" : "🔴 LIVE SINGLE ELIMINATION"}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                {tournament?.venue || "VAMOS SMART ARENA"} • {tournament?.participants?.length || 32} PESERTA • {tournament?.format || "8-BALL"}
              </div>
            </div>
          </div>

          {/* Search Player */}
          <div style={{ position: "relative", minWidth: "200px" }}>
            <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748B" }} />
            <input
              type="text"
              placeholder="Highlight atlet (cth: IDRUS)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(10, 16, 32, 0.8)",
                border: "1px solid rgba(0, 240, 255, 0.25)",
                borderRadius: "8px",
                padding: "6px 10px 6px 30px",
                color: "#F1F5F9",
                fontSize: "11px",
                outline: "none",
              }}
            />
          </div>

          {/* View Mode Switcher */}
          <div style={{
            display: "flex",
            background: "rgba(10, 16, 32, 0.9)",
            padding: "4px",
            borderRadius: "10px",
            border: "1px solid rgba(0, 240, 255, 0.2)",
            gap: "4px"
          }}>
            <button
              onClick={() => setBracketMode("DUAL_WING")}
              style={{
                background: bracketMode === "DUAL_WING" ? "linear-gradient(135deg, #00F0FF, #0066FF)" : "transparent",
                color: bracketMode === "DUAL_WING" ? "#040811" : "#94A3B8",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <GitBranch size={13} />
              <span>2 Sayap</span>
            </button>

            <button
              onClick={() => setBracketMode("LINEAR")}
              style={{
                background: bracketMode === "LINEAR" ? "linear-gradient(135deg, #00F0FF, #0066FF)" : "transparent",
                color: bracketMode === "LINEAR" ? "#040811" : "#94A3B8",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <LayoutGrid size={13} />
              <span>Linear</span>
            </button>

            <button
              onClick={() => setBracketMode("LIST")}
              style={{
                background: bracketMode === "LIST" ? "linear-gradient(135deg, #00F0FF, #0066FF)" : "transparent",
                color: bracketMode === "LIST" ? "#040811" : "#94A3B8",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <ListFilter size={13} />
              <span>List</span>
            </button>
          </div>

          {/* Actions & Staff Login Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link
              href="/scoreboard"
              style={{
                background: "rgba(0, 240, 255, 0.15)",
                border: "1px solid #00F0FF",
                color: "#00F0FF",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                textDecoration: "none"
              }}
            >
              <Tv size={12} />
              <span>Live Scoreboard</span>
            </Link>

            <Link
              href="/drawing"
              className="btn-gold"
              style={{
                padding: "6px 12px",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                textDecoration: "none"
              }}
            >
              <Shuffle size={12} />
              <span>Live Drawing</span>
            </Link>

            {/* Staff Auth Button */}
            {staffToken ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                padding: "4px 10px",
                borderRadius: "8px"
              }}>
                <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700 }}>
                  🟢 Wasit: {staffUser?.name || "Staff"}
                </span>
                <button
                  onClick={handleStaffLogout}
                  title="Logout Wasit"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#EF4444",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <LogOut size={12} />
                </button>
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
                  gap: "5px",
                  fontSize: "11px",
                  fontWeight: 600
                }}
              >
                <Lock size={12} />
                <span>Login Panitia</span>
              </button>
            )}

            <button
              onClick={fetchTournamentData}
              title="Refresh Data"
              style={{
                background: "rgba(0, 240, 255, 0.1)",
                border: "1px solid rgba(0, 240, 255, 0.3)",
                color: "#00F0FF",
                padding: "6px 10px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: 600
              }}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#F1F5F9",
                padding: "6px 10px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px"
              }}
            >
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          </div>
        </div>
      </header>

      {/* Double Elimination Bracket Switcher Tabs */}
      {isDoubleElimination && (
        <div style={{
          background: "rgba(10, 16, 32, 0.9)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          position: "sticky",
          top: "61px",
          zIndex: 40,
          backdropFilter: "blur(12px)"
        }}>
          <button
            onClick={() => setActiveBracketType("WINNERS")}
            style={{
              background: activeBracketType === "WINNERS" ? "linear-gradient(135deg, #00F0FF, #0066FF)" : "rgba(255, 255, 255, 0.05)",
              color: activeBracketType === "WINNERS" ? "#040811" : "#94A3B8",
              border: "none",
              padding: "8px 20px",
              borderRadius: "100px",
              fontFamily: "Montserrat",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Sparkles size={14} />
            <span>🟢 Winners Bracket (Bagan Pemenang)</span>
          </button>

          <button
            onClick={() => setActiveBracketType("LOSERS")}
            style={{
              background: activeBracketType === "LOSERS" ? "linear-gradient(135deg, #F59E0B, #D97706)" : "rgba(255, 255, 255, 0.05)",
              color: activeBracketType === "LOSERS" ? "#040811" : "#94A3B8",
              border: "none",
              padding: "8px 20px",
              borderRadius: "100px",
              fontFamily: "Montserrat",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Flame size={14} />
            <span>🟡 Losers Bracket (Jalur Kesempatan Kedua)</span>
          </button>
        </div>
      )}

      {/* Main Bracket Canvas */}
      <main style={{
        flex: 1,
        padding: "20px 16px 40px 16px",
        width: "100%",
        overflowX: "auto",
        display: "flex",
        flexDirection: "column",
      }}>

        {/* 1. DUAL WING TREE VIEW (BAGAN POHON 2 SAYAP) */}
        {bracketMode === "DUAL_WING" && (
          <div style={{
            minWidth: "1600px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "24px"
          }}>
            {/* Headers Bar for Dual Wing */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "240px 240px 240px 240px 280px 240px 240px 240px 240px",
              gap: "24px",
              textAlign: "center",
              fontSize: "11px",
              fontWeight: 800,
              fontFamily: "Montserrat",
              color: activeBracketType === "LOSERS" ? "#F59E0B" : "#00F0FF",
              textTransform: "uppercase"
            }}>
              <div>🔵 Pool A (Round 1)</div>
              <div>Round 2 (16 Besar)</div>
              <div>Quarter Final</div>
              <div>Semi Final 1</div>
              <div style={{ color: "#F59E0B" }}>🏆 Grand Final</div>
              <div>Semi Final 2</div>
              <div>Quarter Final</div>
              <div>Round 2 (16 Besar)</div>
              <div style={{ color: "#F43F5E" }}>🔴 Pool B (Round 1)</div>
            </div>

            {/* Tree Grid Row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "240px 240px 240px 240px 280px 240px 240px 240px 240px",
              gap: "24px",
              alignItems: "stretch",
            }}>
              {/* Left Wing Column 1: Round 1 */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: "16px" }}>
                {leftR1.map((m) => renderMatchNode(m))}
              </div>

              {/* Left Wing Column 2: Round 2 */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: "16px" }}>
                {leftR2.map((m) => renderMatchNode(m))}
              </div>

              {/* Left Wing Column 3: Quarter Final */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: "16px" }}>
                {leftR3.map((m) => renderMatchNode(m))}
              </div>

              {/* Left Wing Column 4: Semi Final 1 */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: "16px" }}>
                {renderMatchNode(leftSF)}
              </div>

              {/* CENTER COLUMN: GRAND FINAL & TROPHY */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "20px"
              }}>
                <div style={{
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(10, 20, 40, 0.95))",
                  border: "2px solid #F59E0B",
                  borderRadius: "20px",
                  padding: "20px 16px",
                  textAlign: "center",
                  boxShadow: "0 0 40px rgba(245, 158, 11, 0.35)",
                  width: "100%",
                }}>
                  <Trophy size={36} style={{ color: "#F59E0B", margin: "0 auto 8px auto" }} />
                  <div style={{ fontFamily: "Montserrat", fontSize: "14px", fontWeight: 900, color: "#F59E0B", letterSpacing: "0.05em" }}>
                    CHAMPIONSHIP STAGE
                  </div>
                  <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "16px" }}>
                    Total Hadiah: Rp {(tournament?.prizePool || 4200000).toLocaleString('id-ID')}
                  </div>
                  {renderMatchNode(finalMatch, true)}
                </div>
              </div>

              {/* Right Wing Column 4: Semi Final 2 */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: "16px" }}>
                {renderMatchNode(rightSF)}
              </div>

              {/* Right Wing Column 3: Quarter Final */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: "16px" }}>
                {rightR3.map((m) => renderMatchNode(m))}
              </div>

              {/* Right Wing Column 2: Round 2 */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: "16px" }}>
                {rightR2.map((m) => renderMatchNode(m))}
              </div>

              {/* Right Wing Column 1: Round 1 */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: "16px" }}>
                {rightR1.map((m) => renderMatchNode(m))}
              </div>
            </div>
          </div>
        )}

        {/* 2. LINEAR TREE VIEW */}
        {bracketMode === "LINEAR" && (
          <div style={{
            minWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            gap: "32px",
            alignItems: "stretch"
          }}>
            {roundsList.map((r) => {
              const rMatches = roundMap[r] || [];
              const isFinal = r === roundsList.length;

              return (
                <div key={r} style={{
                  display: "flex",
                  flexDirection: "column",
                  width: isFinal ? "280px" : "240px",
                  flexShrink: 0
                }}>
                  <div style={{
                    textAlign: "center",
                    fontSize: "11px",
                    fontWeight: 800,
                    fontFamily: "Montserrat",
                    color: isFinal ? "#F59E0B" : "#00F0FF",
                    marginBottom: "16px",
                    background: "rgba(10, 16, 32, 0.8)",
                    padding: "6px",
                    borderRadius: "8px",
                    border: "1px solid rgba(0, 240, 255, 0.2)"
                  }}>
                    {isFinal ? "🏆 GRAND FINAL" : (r === roundsList.length - 1 ? "🔥 SEMI FINAL" : `ROUND ${r}`)}
                  </div>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-around",
                    flex: 1,
                    gap: "16px"
                  }}>
                    {rMatches.map((m) => renderMatchNode(m, isFinal))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. LIST VIEW */}
        {bracketMode === "LIST" && (
          <div style={{ maxWidth: "900px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
            {roundsList.map((r) => (
              <div key={r} style={{
                background: "rgba(10, 16, 32, 0.6)",
                border: "1px solid rgba(0, 240, 255, 0.2)",
                borderRadius: "16px",
                padding: "20px"
              }}>
                <h3 style={{ fontFamily: "Montserrat", fontSize: "14px", fontWeight: 800, color: "#00F0FF", marginBottom: "14px" }}>
                  ROUND {r} ({roundMap[r]?.length || 0} Pertandingan)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
                  {(roundMap[r] || []).map((m) => renderMatchNode(m))}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Match Detail Modal Popup (READ-ONLY FOR PUBLIC, EDITABLE ONLY FOR LOGGED IN STAFF) */}
      {selectedMatch && (
        <div
          onClick={() => {
            if (!isSavingScore) {
              setSelectedMatch(null);
              setIsEditingScore(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(10, 20, 40, 0.98)",
              border: "2px solid #00F0FF",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 0 60px rgba(0, 240, 255, 0.4)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "#00F0FF", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  MATCH #{selectedMatch.matchNumber} ({selectedMatch.bracket || "WINNERS"} • R{selectedMatch.round})
                </span>
              </div>
              <span style={{
                fontSize: "11px",
                fontWeight: 800,
                color: selectedMatch.status === "COMPLETED" ? "#10B981" : "#F59E0B"
              }}>
                {selectedMatch.status === "COMPLETED" ? "✓ SELESAI" : "● SIAP BERTANDING"}
              </span>
            </div>

            {saveSuccessMsg && (
              <div style={{
                background: "rgba(16, 185, 129, 0.2)",
                border: "1px solid #10B981",
                color: "#10B981",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 700,
                textAlign: "center",
                marginBottom: "18px"
              }}>
                {saveSuccessMsg}
              </div>
            )}

            {/* Scoreboard in Modal */}
            {(() => {
              const p1 = getPlayerInfo(selectedMatch, 1);
              const p2 = getPlayerInfo(selectedMatch, 2);

              return (
                <div style={{
                  background: "rgba(4, 8, 17, 0.9)",
                  borderRadius: "16px",
                  padding: "20px",
                  marginBottom: "24px",
                  border: "1px solid rgba(0, 240, 255, 0.2)"
                }}>
                  {/* Player 1 Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ flex: 1, paddingRight: "12px" }}>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: (isEditingScore ? editScore1 > editScore2 : p1.isWinner) ? "#10B981" : "#F1F5F9" }}>
                        {p1.name} {(isEditingScore ? editScore1 > editScore2 : p1.isWinner) && "👑"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>Handicap: {p1.hc || "3"}</div>
                    </div>

                    {isEditingScore ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          onClick={() => setEditScore1((prev) => Math.max(0, prev - 1))}
                          style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={editScore1}
                          onChange={(e) => setEditScore1(Number(e.target.value) || 0)}
                          style={{ width: "50px", textAlign: "center", background: "rgba(10, 16, 32, 0.9)", border: "1px solid #00F0FF", borderRadius: "8px", padding: "6px", color: "#F1F5F9", fontSize: "18px", fontWeight: 900 }}
                        />
                        <button
                          onClick={() => setEditScore1((prev) => prev + 1)}
                          style={{ background: "rgba(0,240,255,0.2)", border: "none", color: "#00F0FF", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontFamily: "Montserrat", fontSize: "28px", fontWeight: 900, color: p1.isWinner ? "#10B981" : "#94A3B8" }}>
                        {p1.score}
                      </div>
                    )}
                  </div>

                  <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.1)", margin: "14px 0" }} />

                  {/* Player 2 Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1, paddingRight: "12px" }}>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: (isEditingScore ? editScore2 > editScore1 : p2.isWinner) ? "#10B981" : "#F1F5F9" }}>
                        {p2.name} {(isEditingScore ? editScore2 > editScore1 : p2.isWinner) && "👑"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>Handicap: {p2.hc || "3"}</div>
                    </div>

                    {isEditingScore ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          onClick={() => setEditScore2((prev) => Math.max(0, prev - 1))}
                          style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={editScore2}
                          onChange={(e) => setEditScore2(Number(e.target.value) || 0)}
                          style={{ width: "50px", textAlign: "center", background: "rgba(10, 16, 32, 0.9)", border: "1px solid #00F0FF", borderRadius: "8px", padding: "6px", color: "#F1F5F9", fontSize: "18px", fontWeight: 900 }}
                        />
                        <button
                          onClick={() => setEditScore2((prev) => prev + 1)}
                          style={{ background: "rgba(0,240,255,0.2)", border: "none", color: "#00F0FF", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontFamily: "Montserrat", fontSize: "28px", fontWeight: 900, color: p2.isWinner ? "#10B981" : "#94A3B8" }}>
                        {p2.score}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div style={{ display: "flex", gap: "10px" }}>
              {isEditingScore ? (
                <>
                  <button
                    disabled={isSavingScore}
                    onClick={handleSaveScore}
                    style={{
                      flex: 1,
                      background: "linear-gradient(135deg, #10B981, #059669)",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "12px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <Check size={16} />
                    <span>{isSavingScore ? "Menyimpan..." : "Simpan & Update Bagan"}</span>
                  </button>

                  <button
                    disabled={isSavingScore}
                    onClick={() => setIsEditingScore(false)}
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "#F1F5F9",
                      border: "none",
                      padding: "12px 18px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Batal
                  </button>
                </>
              ) : (
                <>
                  {staffToken ? (
                    <button
                      onClick={() => setIsEditingScore(true)}
                      className="btn-gold"
                      style={{
                        flex: 1,
                        padding: "12px",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <Edit3 size={15} />
                      <span>Input / Edit Skor</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedMatch(null);
                        setIsLoginModalOpen(true);
                      }}
                      style={{
                        flex: 1,
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(0, 240, 255, 0.3)",
                        color: "#00F0FF",
                        padding: "12px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <Lock size={14} />
                      <span>Login Panitia untuk Edit Skor</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedMatch(null)}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "#94A3B8",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      padding: "12px 18px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Tutup
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
            padding: "20px"
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
              <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #00F0FF, #0066FF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
                boxShadow: "0 0 25px rgba(0, 240, 255, 0.5)"
              }}>
                <Lock size={22} color="#040811" />
              </div>
              <h2 style={{ fontFamily: "Montserrat", fontSize: "18px", fontWeight: 900, color: "#F1F5F9", margin: 0 }}>
                Login Panitia / Wasit
              </h2>
              <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
                Masukkan akun admin atau kasir Vamos untuk mengedit skor & bagan turnamen.
              </p>
            </div>

            {loginError && (
              <div style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #EF4444",
                color: "#EF4444",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "16px",
                textAlign: "center"
              }}>
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
                    outline: "none"
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
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="btn-gold"
                  style={{ flex: 1, padding: "12px", fontSize: "13px" }}
                >
                  {isLoggingIn ? "Memverifikasi..." : "Login & Buka Akses Edit"}
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
                    cursor: "pointer"
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
        .bracket-card-node:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}
