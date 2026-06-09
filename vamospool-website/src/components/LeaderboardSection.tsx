"use client";

import { Trophy, ArrowUp, Medal, Sparkles } from "lucide-react";

const leaderboardData = [
  { rank: 1, name: "Ahmad Rian", points: 2450, winRate: "78%", matches: 124, trend: "up" },
  { rank: 2, name: "Budi Santoso", points: 2320, winRate: "72%", matches: 110, trend: "up" },
  { rank: 3, name: "Citra Monica", points: 2180, winRate: "70%", matches: 98, trend: "down" },
  { rank: 4, name: "Deni Kurniawan", points: 1950, winRate: "65%", matches: 84, trend: "up" },
  { rank: 5, name: "Eko Prasetyo", points: 1890, winRate: "63%", matches: 90, trend: "down" },
  { rank: 6, name: "Farhan Ali", points: 1750, winRate: "60%", matches: 76, trend: "up" },
  { rank: 7, name: "Gita Lestari", points: 1680, winRate: "58%", matches: 72, trend: "down" },
];

export default function LeaderboardSection() {
  return (
    <section id="leaderboard" style={{ padding: "120px 0", position: "relative" }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, var(--border), transparent)",
      }} />
      <div className="bg-radial-green" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      <div className="container" style={{ position: "relative" }}>
        {/* Header */}
        <div style={{ marginBottom: "56px" }}>
          <div className="section-label">📊 Ranking & Leaderboard</div>
          <h2 className="section-title">
            Para <span className="gold-text">Juara</span> Vamos
          </h2>
          <p className="section-desc">
            Pemain teratas dengan poin turnamen dan tingkat kemenangan tertinggi di ekosistem Vamos Pool. Dapatkan poin dari setiap kompetisi resmi.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "40px", alignItems: "start" }}>
          {/* Highlight Top 3 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="glass-card glow-gold" style={{ padding: "40px", textAlign: "center", border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute", top: "12px", right: "12px",
                color: "var(--gold)",
              }}>
                <Sparkles size={20} className="float-anim" />
              </div>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "linear-gradient(135deg, var(--gold-light), var(--gold))",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
                boxShadow: "0 0 30px rgba(201, 168, 76, 0.4)",
              }}>
                <Trophy size={40} color="#0A0A0F" />
              </div>
              <span className="badge" style={{ marginBottom: "12px" }}>Rank #1 MVP</span>
              <h3 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "22px", marginBottom: "8px" }}>
                {leaderboardData[0].name}
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Juara bertahan 3 turnamen beruntun dengan win rate fantastis {leaderboardData[0].winRate}.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "24px", borderTop: "1px solid var(--border-subtle)", paddingTop: "20px" }}>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "Montserrat" }} className="gold-text">
                    {leaderboardData[0].points}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Poin</div>
                </div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "Montserrat", color: "var(--text-primary)" }}>
                    {leaderboardData[0].winRate}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Win Rate</div>
                </div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "Montserrat", color: "var(--text-primary)" }}>
                    {leaderboardData[0].matches}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Matches</div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-secondary)", fontWeight: 700,
              }}>2</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px" }}>{leaderboardData[1].name}</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{leaderboardData[1].points} Poin • {leaderboardData[1].winRate} Win Rate</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", color: "#4CAF7D", fontSize: "12px", gap: "2px" }}>
                <ArrowUp size={12} /> Rank Up
              </div>
            </div>
          </div>

          {/* Table Leaderboard */}
          <div className="glass-card" style={{ padding: "32px", overflowX: "auto" }}>
            <table className="table-gold">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Rank</th>
                  <th>Nama Pemain</th>
                  <th style={{ textAlign: "right" }}>Matches</th>
                  <th style={{ textAlign: "right" }}>Win Rate</th>
                  <th style={{ textAlign: "right" }}>Total Poin</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((player) => (
                  <tr key={player.rank}>
                    <td style={{ fontWeight: 800, fontFamily: "Montserrat" }}>
                      {player.rank === 1 ? (
                        <span style={{ color: "var(--gold)" }}>🥇 #1</span>
                      ) : player.rank === 2 ? (
                        <span style={{ color: "var(--text-primary)" }}>🥈 #2</span>
                      ) : player.rank === 3 ? (
                        <span style={{ color: "#CD7F32" }}>🥉 #3</span>
                      ) : (
                        `#${player.rank}`
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{player.name}</td>
                    <td style={{ textAlign: "right" }}>{player.matches}</td>
                    <td style={{ textAlign: "right", color: "var(--text-primary)", fontWeight: 600 }}>{player.winRate}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }} className="gold-text">{player.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <a href="#contact" className="btn-outline" style={{ fontSize: "12px", padding: "10px 20px" }}>
                Daftar Member & Mulai Kumpulkan Poin
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 992px) {
          #leaderboard .container > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
