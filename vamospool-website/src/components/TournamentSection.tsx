"use client";

import { useState } from "react";
import { Trophy, Calendar, Users, DollarSign, ChevronRight, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

const tournaments = [
  {
    id: 1,
    status: "ONGOING",
    statusLabel: "SEDANG BERJALAN",
    name: "FUN GAME HC 3 SERIES 1",
    format: "8-Ball Single Elimination (POBSI Standard)",
    date: "Sabtu, 22 Agustus 2026",
    participants: 32,
    maxParticipants: 32,
    prize: "Rp 4.200.000",
    fee: "Rp 150.000",
    color: "#00F0FF",
  },
  {
    id: 2,
    status: "OPEN",
    statusLabel: "PENDAFTARAN DIBUKA",
    name: "VAMOS OPEN 9-BALL CHAMPIONSHIP",
    format: "9-Ball Double to Single Elimination",
    date: "5–7 September 2026",
    participants: 48,
    maxParticipants: 64,
    prize: "Rp 25.000.000",
    fee: "Rp 200.000",
    color: "#0066FF",
  },
  {
    id: 3,
    status: "UPCOMING",
    statusLabel: "SEGERA",
    name: "MAKASSAR YOUTH POOL CUP 2026",
    format: "10-Ball Handicap 3-4 Series",
    date: "20–21 September 2026",
    participants: 12,
    maxParticipants: 32,
    prize: "Rp 7.500.000",
    fee: "Rp 100.000",
    color: "#10B981",
  }
];

// Sample live bracket matches matching our anti-clash & semifinal convergence engine
const poolAMatches = [
  { id: 1, p1: "ANDRY GOMES", p2: "STARBOY", score1: 5, score2: 2, winner: 1 },
  { id: 2, p1: "RIVAL AND (1)", p2: "BAHRIADI 59", score1: 5, score2: 4, winner: 1 },
  { id: 3, p1: "FARIZ VAMOS (1)", p2: "PUTRA AND", score1: 5, score2: 3, winner: 1 },
  { id: 4, p1: "AHLAN SALOPI (1)", p2: "HAYYUL", score1: 5, score2: 1, winner: 1 },
];

const poolBMatches = [
  { id: 9, p1: "RAMS 59 (1)", p2: "SHAFA VAMOS", score1: 5, score2: 3, winner: 1 },
  { id: 10, p1: "CING VAMOS (1)", p2: "FATUL 59", score1: 5, score2: 2, winner: 1 },
  { id: 11, p1: "RAHMAT DONE (1)", p2: "SAFAR SALOPI", score1: 5, score2: 4, winner: 1 },
  { id: 12, p1: "ADRIL AND (1)", p2: "ICCANK", score1: 5, score2: 1, winner: 1 },
];

export default function TournamentSection() {
  const [activeTab, setActiveTab] = useState<"tournaments" | "bracket">("tournaments");

  return (
    <section id="tournaments" style={{ padding: "100px 0", position: "relative" }}>
      {/* Background radial aura */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "700px",
        height: "500px",
        background: "radial-gradient(circle, rgba(0, 102, 255, 0.1) 0%, transparent 70%)",
        pointerEvents: "none",
        filter: "blur(60px)",
      }} />

      <div className="container" style={{ position: "relative", zIndex: 5 }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-label">🏆 TOURNAMENTS & LIVE BRACKET</div>
          <h2 className="section-title">
            Kompetisi Bergengsi & <span className="gold-text">Bagan Live</span>
          </h2>
          <p className="section-desc" style={{ margin: "0 auto 32px auto" }}>
            Ikuti turnamen biliar resmi bersertifikasi Handicap POBSI dengan total hadiah puluhan juta rupiah dan sistem live drawing anti-clash.
          </p>

          {/* Tab Switcher */}
          <div style={{
            display: "inline-flex",
            background: "rgba(10, 16, 32, 0.8)",
            padding: "6px",
            borderRadius: "100px",
            border: "1px solid rgba(0, 240, 255, 0.2)",
          }}>
            <button
              onClick={() => setActiveTab("tournaments")}
              style={{
                background: activeTab === "tournaments" ? "linear-gradient(135deg, #00F0FF, #0066FF)" : "transparent",
                color: activeTab === "tournaments" ? "#040811" : "#94A3B8",
                border: "none",
                padding: "10px 24px",
                borderRadius: "100px",
                fontFamily: "Montserrat",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
            >
              Daftar Turnamen
            </button>

            <button
              onClick={() => setActiveTab("bracket")}
              style={{
                background: activeTab === "bracket" ? "linear-gradient(135deg, #00F0FF, #0066FF)" : "transparent",
                color: activeTab === "bracket" ? "#040811" : "#94A3B8",
                border: "none",
                padding: "10px 24px",
                borderRadius: "100px",
                fontFamily: "Montserrat",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
            >
              Interactive Live Bracket
            </button>
          </div>
        </div>

        {/* Content Tab 1: Tournaments List */}
        {activeTab === "tournaments" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}>
            {tournaments.map((t) => (
              <div key={t.id} className="glass-card" style={{
                padding: "32px 28px",
                background: "rgba(10, 16, 32, 0.75)",
                border: "1px solid rgba(0, 240, 255, 0.2)",
                position: "relative",
              }}>
                {/* Status Badge */}
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: t.status === "ONGOING" ? "rgba(0, 240, 255, 0.15)" : "rgba(16, 185, 129, 0.15)",
                  border: `1px solid ${t.status === "ONGOING" ? "rgba(0, 240, 255, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
                  color: t.status === "ONGOING" ? "#00F0FF" : "#10B981",
                  fontSize: "11px",
                  fontWeight: 800,
                  fontFamily: "Montserrat",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  textTransform: "uppercase"
                }}>
                  <span style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: t.status === "ONGOING" ? "#00F0FF" : "#10B981",
                  }} />
                  <span>{t.statusLabel}</span>
                </div>

                <h3 style={{
                  fontFamily: "Montserrat",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#F1F5F9",
                  marginBottom: "8px",
                }}>
                  {t.name}
                </h3>
                <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "24px" }}>
                  {t.format}
                </p>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  padding: "16px",
                  background: "rgba(4, 8, 17, 0.6)",
                  borderRadius: "12px",
                  marginBottom: "24px",
                  border: "1px solid rgba(255, 255, 255, 0.05)"
                }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>Tanggal</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#F1F5F9" }}>{t.date}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>Total Hadiah</div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#00F0FF" }}>{t.prize}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>Entry Fee</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#F1F5F9" }}>{t.fee}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>Slot Peserta</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#10B981" }}>
                      {t.participants} / {t.maxParticipants} Slot
                    </div>
                  </div>
                </div>

                <a
                  href="https://wa.me/62811444000?text=Halo%20Vamos,%20saya%20ingin%20mendaftar%20turnamen%20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold"
                  style={{
                    width: "100%",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    fontSize: "13px",
                  }}
                >
                  <Trophy size={16} />
                  <span>Daftar Turnamen Ini</span>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Content Tab 2: Live Bracket Interactive Preview */}
        {activeTab === "bracket" && (
          <div className="glass-card" style={{
            padding: "36px 28px",
            background: "rgba(10, 16, 32, 0.85)",
            border: "1px solid rgba(0, 240, 255, 0.25)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#00F0FF", fontWeight: 800, textTransform: "uppercase" }}>
                  Official Tournament Bracket
                </span>
                <h3 style={{ fontFamily: "Montserrat", fontSize: "22px", fontWeight: 900, color: "#F1F5F9" }}>
                  FUN GAME HC 3 SERIES 1
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  background: "rgba(0, 240, 255, 0.1)",
                  border: "1px solid rgba(0, 240, 255, 0.3)",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  color: "#00F0FF",
                  fontSize: "12px",
                  fontWeight: 700,
                }}>
                  Dual-Wing Format • 32 Players
                </div>

                <a
                  href="/bracket"
                  className="btn-gold"
                  style={{
                    padding: "8px 16px",
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span>Buka Detail Bagan</span>
                  <ChevronRight size={14} />
                </a>
              </div>
            </div>

            {/* 2-Wing Layout Showcase */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "28px",
            }} className="bracket-wings-grid">
              
              {/* Pool A: Left Wing */}
              <div>
                <div style={{
                  background: "linear-gradient(135deg, #00F0FF, #0066FF)",
                  color: "#040811",
                  fontWeight: 800,
                  fontSize: "12px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  textAlign: "center",
                  marginBottom: "16px",
                  fontFamily: "Montserrat",
                }}>
                  POOL A • BAGAN ATAS
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {poolAMatches.map((m) => (
                    <div key={m.id} style={{
                      background: "rgba(4, 8, 17, 0.7)",
                      border: "1px solid rgba(0, 240, 255, 0.18)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: m.winner === 1 ? "#00F0FF" : "#94A3B8", fontWeight: m.winner === 1 ? 700 : 500 }}>
                        <span>{m.p1} [HC: 3]</span>
                        <span>{m.score1}</span>
                      </div>
                      <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.06)" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: m.winner === 2 ? "#00F0FF" : "#94A3B8", fontWeight: m.winner === 2 ? 700 : 500 }}>
                        <span>{m.p2} [HC: 3]</span>
                        <span>{m.score2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pool B: Right Wing */}
              <div>
                <div style={{
                  background: "linear-gradient(135deg, #E11D48, #BE123C)",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "12px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  textAlign: "center",
                  marginBottom: "16px",
                  fontFamily: "Montserrat",
                }}>
                  POOL B • BAGAN BAWAH
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {poolBMatches.map((m) => (
                    <div key={m.id} style={{
                      background: "rgba(4, 8, 17, 0.7)",
                      border: "1px solid rgba(225, 29, 72, 0.25)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: m.winner === 1 ? "#F43F5E" : "#94A3B8", fontWeight: m.winner === 1 ? 700 : 500 }}>
                        <span>{m.p1} [HC: 3]</span>
                        <span>{m.score1}</span>
                      </div>
                      <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.06)" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: m.winner === 2 ? "#F43F5E" : "#94A3B8", fontWeight: m.winner === 2 ? 700 : 500 }}>
                        <span>{m.p2} [HC: 3]</span>
                        <span>{m.score2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .bracket-wings-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
