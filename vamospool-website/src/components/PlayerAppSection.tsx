"use client";

import { Download, Smartphone, QrCode, ShieldCheck, Zap, Bell, Trophy, CreditCard } from "lucide-react";

export default function PlayerAppSection() {
  return (
    <section id="player-app" style={{ padding: "100px 0", position: "relative" }}>
      {/* Background Neon Accent */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 80% 50%, rgba(0, 240, 255, 0.08) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      <div className="container" style={{ position: "relative", zIndex: 5 }}>
        <div className="glass-card" style={{
          padding: "48px 36px",
          background: "linear-gradient(135deg, rgba(10, 28, 54, 0.85) 0%, rgba(4, 8, 17, 0.95) 100%)",
          border: "1px solid rgba(0, 240, 255, 0.3)",
          borderRadius: "24px",
          boxShadow: "0 20px 50px rgba(0, 102, 255, 0.2)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "40px",
            alignItems: "center",
          }} className="app-grid">
            
            {/* Left Column: App Description & Features */}
            <div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(0, 240, 255, 0.1)",
                border: "1px solid rgba(0, 240, 255, 0.3)",
                padding: "6px 14px",
                borderRadius: "100px",
                color: "#00F0FF",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: "16px",
              }}>
                <Smartphone size={14} />
                <span>Vamos Player Mobile App</span>
              </div>

              <h2 style={{
                fontFamily: "Montserrat",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 900,
                lineHeight: 1.15,
                color: "#F1F5F9",
                marginBottom: "20px",
              }}>
                Kelola Permainan & Turnamen Langsung dari <span className="gold-text">Smartphone</span>
              </h2>

              <p style={{ fontSize: "14px", color: "#94A3B8", lineHeight: 1.7, marginBottom: "32px" }}>
                Download aplikasi resmi <strong>Vamos Player App</strong> untuk Android. Cek status ketersediaan meja, riwayat pertandingan, booking meja, dan ikuti live bracket turnamen secara instan.
              </p>

              {/* Feature Points */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "36px" }}>
                {[
                  { icon: <Zap size={18} />, title: "Live Score Real-time" },
                  { icon: <Trophy size={18} />, title: "Daftar Turnamen & Bracket" },
                  { icon: <CreditCard size={18} />, title: "Booking & Pembayaran Meja" },
                  { icon: <Bell size={18} />, title: "Notifikasi Giliran Main" },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "rgba(0, 240, 255, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#00F0FF",
                      flexShrink: 0,
                    }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#F1F5F9" }}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
                <a
                  href="/VamosPlayer.apk"
                  download
                  className="btn-gold"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "16px 28px",
                    fontSize: "13px",
                  }}
                >
                  <Download size={18} />
                  <span>Download APK (Android)</span>
                </a>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94A3B8" }}>
                  <ShieldCheck size={16} color="#10B981" />
                  <span>Versi Resmi v4.0 (Aman & Terverifikasi)</span>
                </div>
              </div>
            </div>

            {/* Right Column: QR Code Download Card */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                background: "rgba(4, 8, 17, 0.9)",
                border: "1px solid rgba(0, 240, 255, 0.35)",
                borderRadius: "20px",
                padding: "28px",
                textAlign: "center",
                maxWidth: "300px",
                boxShadow: "0 0 35px rgba(0, 240, 255, 0.2)",
              }}>
                <div style={{
                  background: "#FFFFFF",
                  padding: "16px",
                  borderRadius: "16px",
                  marginBottom: "16px",
                  display: "inline-block",
                }}>
                  <img
                    src="/images/qr_download.png"
                    alt="Scan QR Download Vamos Player"
                    style={{ width: "180px", height: "180px", display: "block" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/QR_VamosPlayer.png";
                    }}
                  />
                </div>

                <div style={{ fontSize: "14px", fontWeight: 800, color: "#F1F5F9", marginBottom: "4px" }}>
                  Scan QR untuk Download
                </div>
                <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                  Arahkan kamera smartphone Anda untuk mengunduh aplikasi Vamos Player secara instan.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 900px) {
          .app-grid {
            grid-template-columns: 1.3fr 0.7fr !important;
          }
        }
      `}</style>
    </section>
  );
}
