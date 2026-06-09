"use client";

import { MapPin, Clock, Wifi, Car, Coffee, Tv, Zap, Shield } from "lucide-react";

const facilities = [
  { icon: <Zap size={20} />, title: "24 Meja Premium", desc: "Meja Brunswick & Predator dengan kain Simonis 860" },
  { icon: <Tv size={20} />, title: "Live Streaming", desc: "Setup streaming untuk semua meja utama" },
  { icon: <Wifi size={20} />, title: "WiFi Ultra Fast", desc: "Koneksi fiber 500Mbps untuk semua area venue" },
  { icon: <Coffee size={20} />, title: "F&B Lounge", desc: "Kafe premium dengan menu spesial dan minuman segar" },
  { icon: <Car size={20} />, title: "Parkir Luas", desc: "Area parkir aman untuk 50+ kendaraan" },
  { icon: <Shield size={20} />, title: "CCTV 24 Jam", desc: "Keamanan venue terjaga sepanjang waktu" },
];

const tables = [
  { type: "Pool / 9-Ball", count: 16, cloth: "Simonis 860 Electric Blue", price: "Rp 30.000/jam" },
  { type: "Snooker", count: 4, cloth: "Strachan 6811 Tournament", price: "Rp 50.000/jam" },
  { type: "VIP Table", count: 4, cloth: "Simonis 860 Championship Green", price: "Rp 80.000/jam" },
];

const hours = [
  { day: "Senin – Jumat", time: "10:00 – 01:00" },
  { day: "Sabtu", time: "09:00 – 02:00" },
  { day: "Minggu", time: "09:00 – 00:00" },
  { day: "Event / Turnamen", time: "Sesuai Jadwal" },
];

export default function VenueSection() {
  return (
    <section id="venue" style={{ padding: "120px 0", position: "relative" }}>
      {/* Background accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, var(--border), transparent)",
      }} />
      <div className="bg-radial-green" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      <div className="container" style={{ position: "relative" }}>
        {/* Header */}
        <div style={{ marginBottom: "72px" }}>
          <div className="section-label">🏟️ Venue</div>
          <h2 className="section-title">
            Fasilitas <span className="gold-text">Kelas Dunia</span>
          </h2>
          <p className="section-desc">
            Didesain untuk pengalaman bermain terbaik. Setiap detail dipilih dengan cermat untuk memastikan kenyamanan dan performa optimal.
          </p>
        </div>

        {/* Facilities Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginBottom: "80px" }}>
          {facilities.map((f, i) => (
            <div key={i} className="glass-card" style={{ padding: "28px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "10px", flexShrink: 0,
                background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--gold)",
              }}>
                {f.icon}
              </div>
              <div>
                <h3 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "15px", marginBottom: "6px", color: "var(--text-primary)" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tables & Hours */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          {/* Tables */}
          <div className="glass-card" style={{ padding: "40px" }}>
            <h3 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "20px", marginBottom: "8px" }}>
              Tipe Meja
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" }}>Spesifikasi lengkap setiap meja</p>
            <table className="table-gold">
              <thead>
                <tr>
                  <th>Tipe</th>
                  <th style={{ textAlign: "center" }}>Unit</th>
                  <th style={{ textAlign: "right" }}>Tarif</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>{t.type}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{t.cloth}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge" style={{ fontSize: "12px" }}>{t.count}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="gold-text" style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "14px", WebkitTextFillColor: "var(--gold)" }}>
                        {t.price}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Hours + Location */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="glass-card" style={{ padding: "36px", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <Clock size={18} color="var(--gold)" />
                <h3 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "18px" }}>Jam Operasional</h3>
              </div>
              {hours.map((h, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0",
                  borderBottom: i < hours.length - 1 ? "1px solid var(--border-subtle)" : "none",
                }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{h.day}</span>
                  <span style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "13px", color: "var(--gold)" }}>{h.time}</span>
                </div>
              ))}
            </div>

            <div className="glass-card" style={{ padding: "36px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <MapPin size={18} color="var(--gold)" />
                <h3 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "18px" }}>Lokasi</h3>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "16px" }}>
                Jl. Boulevard Raya No. 88, Panakukang, Makassar, Sulawesi Selatan 90231
              </p>
              <a
                href="https://maps.google.com"
                target="_blank"
                className="btn-outline"
                style={{ padding: "10px 20px", fontSize: "12px", display: "inline-block" }}
                id="venue-maps-link"
              >
                Buka di Maps
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #venue .container > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
