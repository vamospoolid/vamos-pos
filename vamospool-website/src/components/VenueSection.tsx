"use client";

import { Zap, Tv, Wifi, Coffee, Car, Shield, Award, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

const features = [
  {
    icon: <Zap size={22} />,
    title: "16 Meja 9-ft Standar POBSI",
    desc: "Menggunakan kain Simonis 860 Electric Blue dan bola Aramith Tournament Pro Cup untuk akurasi pantulan maksimal."
  },
  {
    icon: <Tv size={22} />,
    title: "Pencahayaan LED Anti-Shadow",
    desc: "Lampu LED khusus turnamen yang merata tanpa bayangan stick, memberikan visibilitas tajam di setiap sudut."
  },
  {
    icon: <Award size={22} />,
    title: "VIP Private Rooms",
    desc: "Ruang kedap suara ber-AC dengan sofa mewah, Smart TV 65-inch untuk streaming, dan layanan F&B eksklusif."
  },
  {
    icon: <Coffee size={22} />,
    title: "Vamos Cafe & Resto",
    desc: "Sajian kopi mocktail, signature rice bowl, steak, snack platter, dan berbagai minuman dingin segar."
  },
  {
    icon: <Wifi size={22} />,
    title: "WiFi High-Speed 500Mbps",
    desc: "Koneksi fiber ultra cepat untuk live streaming, mobile gaming, dan produktivitas para pengunjung."
  },
  {
    icon: <Car size={22} />,
    title: "Parkir Luas & Aman 24 Jam",
    desc: "Area parkir mobil & motor yang aman dengan pengawasan security dan CCTV 24 jam nonstop."
  }
];

const tariffs = [
  {
    name: "Regular Zone (9-ft)",
    cloth: "Simonis 860 Electric Blue",
    desc: "Arena utama biliar ber-AC dingin & meja standar turnamen",
    rate: "Rp 35.000",
    unit: "/ jam",
    popular: false,
    badge: "Open Arena"
  },
  {
    name: "Happy Hour Package",
    cloth: "Pukul 10:00 – 17:00 WITA",
    desc: "Paket hemat main siang khusus pelajar, mahasiswa & member",
    rate: "Rp 25.000",
    unit: "/ jam",
    popular: true,
    badge: "Paling Hemat"
  },
  {
    name: "VIP Private Room",
    cloth: "Dedicated Tournament Table",
    desc: "Ruang privat eksklusif + Smart TV 65-inch + Sound System",
    rate: "Rp 75.000",
    unit: "/ jam",
    popular: false,
    badge: "Eksklusif VIP"
  }
];

export default function VenueSection() {
  return (
    <section id="venue" style={{ padding: "100px 0", position: "relative" }}>
      {/* Divider Glow */}
      <div style={{
        position: "absolute",
        top: 0,
        left: "10%",
        right: "10%",
        height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.4), transparent)",
      }} />

      <div className="container" style={{ position: "relative", zIndex: 5 }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div className="section-label">🏟️ THE ARENA & FACILITY</div>
          <h2 className="section-title">
            Fasilitas <span className="gold-text">Kelas Dunia</span> di Setiap Sudut
          </h2>
          <p className="section-desc" style={{ margin: "0 auto" }}>
            Setiap meja dan fasilitas di Vamos Smart Arena dirancang untuk memenuhi standar kompetisi biliar profesional Indonesia.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "80px",
        }}>
          {features.map((item, idx) => (
            <div key={idx} className="glass-card" style={{
              padding: "28px 24px",
              background: "rgba(10, 16, 32, 0.7)",
              border: "1px solid rgba(0, 240, 255, 0.15)",
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 102, 255, 0.2))",
                border: "1px solid rgba(0, 240, 255, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00F0FF",
                marginBottom: "20px",
              }}>
                {item.icon}
              </div>
              <h3 style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "17px",
                fontWeight: 700,
                color: "#F1F5F9",
                marginBottom: "10px",
              }}>
                {item.title}
              </h3>
              <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Pricing / Tariff Cards Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(0, 240, 255, 0.08)",
            padding: "6px 14px",
            borderRadius: "100px",
            color: "#00F0FF",
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: "12px"
          }}>
            <Sparkles size={14} />
            <span>Tarif & Paket Main</span>
          </div>
          <h3 style={{
            fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
            fontFamily: "Montserrat",
            fontWeight: 800,
            color: "#F1F5F9",
          }}>
            Harga Sewa Meja Transparan
          </h3>
        </div>

        {/* Tariff Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
        }}>
          {tariffs.map((t, idx) => (
            <div key={idx} className="glass-card" style={{
              padding: "36px 28px",
              position: "relative",
              background: t.popular ? "rgba(10, 28, 54, 0.9)" : "rgba(10, 16, 32, 0.7)",
              border: t.popular ? "2px solid #00F0FF" : "1px solid rgba(0, 240, 255, 0.18)",
              boxShadow: t.popular ? "0 0 35px rgba(0, 240, 255, 0.25)" : "none",
            }}>
              {t.popular && (
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  right: "24px",
                  background: "linear-gradient(135deg, #00F0FF, #0066FF)",
                  color: "#040811",
                  fontSize: "11px",
                  fontWeight: 800,
                  fontFamily: "Montserrat",
                  padding: "4px 12px",
                  borderRadius: "100px",
                  textTransform: "uppercase",
                }}>
                  {t.badge}
                </div>
              )}

              <div style={{ fontSize: "12px", color: "#00F0FF", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                {t.badge}
              </div>

              <h4 style={{
                fontFamily: "Montserrat",
                fontSize: "20px",
                fontWeight: 800,
                color: "#F1F5F9",
                marginBottom: "4px",
              }}>
                {t.name}
              </h4>
              <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "24px" }}>
                {t.cloth}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "20px" }}>
                <span style={{
                  fontFamily: "Montserrat",
                  fontSize: "32px",
                  fontWeight: 900,
                  color: "#F1F5F9",
                }}>
                  {t.rate}
                </span>
                <span style={{ fontSize: "14px", color: "#94A3B8" }}>
                  {t.unit}
                </span>
              </div>

              <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6, marginBottom: "28px" }}>
                {t.desc}
              </p>

              <a
                href={`https://wa.me/62811444000?text=Halo%20Vamos%20Pool,%20saya%20ingin%20booking%20${encodeURIComponent(t.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={t.popular ? "btn-gold" : "btn-outline"}
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
                <span>Pesan Meja Ini</span>
                <ChevronRight size={16} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
