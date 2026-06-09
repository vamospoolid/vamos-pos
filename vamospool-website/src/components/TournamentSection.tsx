"use client";

import { useState } from "react";
import { Trophy, Calendar, Users, DollarSign, ChevronRight, Clock, CheckCircle2, Circle } from "lucide-react";

const tournaments = [
  {
    id: 1,
    status: "LIVE",
    name: "Vamos Open Championship 2025",
    format: "9-Ball / Double Elimination",
    date: "20–22 Juni 2025",
    participants: 64,
    maxParticipants: 64,
    prize: "Rp 25.000.000",
    fee: "Rp 150.000",
    color: "#C9A84C",
    progress: 100,
  },
  {
    id: 2,
    status: "OPEN",
    name: "Makassar Pool Masters Series",
    format: "8-Ball / Single Elimination",
    date: "5–6 Juli 2025",
    participants: 28,
    maxParticipants: 32,
    prize: "Rp 10.000.000",
    fee: "Rp 100.000",
    color: "#2D6A4F",
    progress: 87,
  },
  {
    id: 3,
    status: "OPEN",
    name: "Vamos Youth Cup 2025",
    format: "10-Ball / Round Robin",
    date: "19–20 Juli 2025",
    participants: 12,
    maxParticipants: 16,
    prize: "Rp 5.000.000",
    fee: "Gratis",
    color: "#1A3A5C",
    progress: 75,
  },
];

// Bracket data
const bracket = {
  rounds: [
    {
      name: "Semifinal",
      matches: [
        { p1: "Ahmad R.", p2: "Budi S.", score1: 5, score2: 3, done: true, winner: 1 },
        { p1: "Citra M.", p2: "Deni K.", score1: 5, score2: 4, done: true, winner: 1 },
      ],
    },
    {
      name: "Final",
      matches: [
        { p1: "Ahmad R.", p2: "Citra M.", score1: null, score2: null, done: false, winner: null },
      ],
    },
  ],
};

function BracketMatch({ match }: { match: any }) {
  return (
    <div style={{
      border: "1px solid var(--border-subtle)",
      borderRadius: "10px",
      overflow: "hidden",
      background: "var(--bg-secondary)",
      minWidth: "200px",
    }}>
      {[1, 2].map((n) => {
        const name = n === 1 ? match.p1 : match.p2;
        const score = n === 1 ? match.score1 : match.score2;
        const isWinner = match.winner === n;
        return (
          <div key={n} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 14px",
            borderBottom: n === 1 ? "1px solid var(--border-subtle)" : "none",
            background: isWinner ? "rgba(201,168,76,0.08)" : "transparent",
          }}>
            <span style={{
              fontSize: "13px", fontWeight: isWinner ? 700 : 400,
              color: isWinner ? "var(--gold)" : "var(--text-secondary)",
              fontFamily: isWinner ? "Montserrat" : "Inter",
            }}>
              {name}
            </span>
            <span style={{
              fontFamily: "Montserrat", fontWeight: 800, fontSize: "14px",
              color: isWinner ? "var(--gold)" : "var(--text-muted)",
            }}>
              {score !== null ? score : "–"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function TournamentSection() {
  const [activeTab, setActiveTab] = useState<"list" | "bracket">("list");

  return (
    <section id="tournament" style={{ padding: "120px 0", position: "relative" }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, var(--border), transparent)",
      }} />
      <div className="bg-radial-gold" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      <div className="container" style={{ position: "relative" }}>
        {/* Header */}
        <div style={{ marginBottom: "56px" }}>
          <div className="section-label">🏆 Turnamen</div>
          <h2 className="section-title">
            Kompetisi <span className="gold-text">Bergengsi</span>
          </h2>
          <p className="section-desc">
            Dari pemula hingga profesional, Vamos Pool menghadirkan turnamen berkualitas tinggi dengan prize pool menarik sepanjang tahun.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "inline-flex", background: "var(--bg-secondary)", borderRadius: "10px",
          padding: "4px", border: "1px solid var(--border-subtle)", marginBottom: "40px",
        }}>
          {[{ key: "list", label: "Turnamen Aktif" }, { key: "bracket", label: "Bracket / Bagan" }].map((tab) => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontFamily: "Montserrat",
                fontWeight: 700,
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                transition: "all 0.2s ease",
                background: activeTab === tab.key ? "linear-gradient(135deg, var(--gold-light), var(--gold))" : "transparent",
                color: activeTab === tab.key ? "#0A0A0F" : "var(--text-muted)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tournament List */}
        {activeTab === "list" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {tournaments.map((t) => (
              <div key={t.id} className="glass-card" style={{ padding: "32px", position: "relative", overflow: "hidden" }}>
                {/* Color accent */}
                <div style={{
                  position: "absolute", top: 0, left: 0, width: "4px", height: "100%",
                  background: `linear-gradient(180deg, ${t.color}, ${t.color}40)`,
                }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <span style={{
                        fontFamily: "Montserrat", fontWeight: 800, fontSize: "10px",
                        letterSpacing: "0.2em", textTransform: "uppercase",
                        padding: "4px 10px", borderRadius: "100px",
                        background: t.status === "LIVE" ? "rgba(201,168,76,0.15)" : "rgba(45,106,79,0.15)",
                        color: t.status === "LIVE" ? "var(--gold)" : "#4CAF7D",
                        border: `1px solid ${t.status === "LIVE" ? "rgba(201,168,76,0.3)" : "rgba(45,106,79,0.3)"}`,
                      }}>
                        {t.status === "LIVE" ? "🔴 LIVE" : "✅ OPEN"}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "Montserrat" }}>{t.format}</span>
                    </div>

                    <h3 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "20px", marginBottom: "16px" }}>
                      {t.name}
                    </h3>

                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                      {[
                        { icon: <Calendar size={14} />, val: t.date },
                        { icon: <Users size={14} />, val: `${t.participants}/${t.maxParticipants} Peserta` },
                        { icon: <Trophy size={14} />, val: t.prize },
                        { icon: <DollarSign size={14} />, val: `Fee: ${t.fee}` },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "13px" }}>
                          <span style={{ color: "var(--gold)" }}>{item.icon}</span>
                          {item.val}
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginTop: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Slot terisi</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: t.color }}>{t.progress}%</span>
                      </div>
                      <div style={{ height: "4px", background: "var(--border-subtle)", borderRadius: "2px" }}>
                        <div style={{ height: "100%", width: `${t.progress}%`, background: `linear-gradient(90deg, ${t.color}80, ${t.color})`, borderRadius: "2px", transition: "width 1s ease" }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                    {t.status === "OPEN" ? (
                      <a href="#contact" className="btn-gold" id={`register-tournament-${t.id}`} style={{ whiteSpace: "nowrap" }}>
                        Daftar Sekarang
                      </a>
                    ) : (
                      <a href="#" className="btn-outline" style={{ whiteSpace: "nowrap" }}>
                        Lihat Bracket →
                      </a>
                    )}
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "right" }}>
                      Prize Pool <span style={{ color: "var(--gold)", fontWeight: 700 }}>{t.prize}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bracket View */}
        {activeTab === "bracket" && (
          <div className="glass-card" style={{ padding: "40px" }}>
            <div style={{ marginBottom: "28px" }}>
              <h3 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "18px", marginBottom: "4px" }}>
                Vamos Open Championship 2025
              </h3>
              <span className="badge">🔴 Live</span>
            </div>

            <div style={{ display: "flex", gap: "48px", overflowX: "auto", paddingBottom: "16px" }}>
              {bracket.rounds.map((round, ri) => (
                <div key={ri} style={{ minWidth: "220px" }}>
                  <div style={{
                    fontFamily: "Montserrat", fontWeight: 700, fontSize: "11px",
                    letterSpacing: "0.15em", textTransform: "uppercase",
                    color: "var(--text-muted)", marginBottom: "20px",
                  }}>
                    {round.name}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", justifyContent: "space-around" }}>
                    {round.matches.map((match, mi) => (
                      <BracketMatch key={mi} match={match} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Champion placeholder */}
              <div style={{ minWidth: "160px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{
                  fontFamily: "Montserrat", fontWeight: 700, fontSize: "11px",
                  letterSpacing: "0.15em", textTransform: "uppercase",
                  color: "var(--text-muted)", marginBottom: "20px",
                }}>Juara</div>
                <div className="glass-card glow-gold" style={{
                  padding: "24px", textAlign: "center",
                  border: "1px solid var(--border)",
                }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>🏆</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Ditentukan Final</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
