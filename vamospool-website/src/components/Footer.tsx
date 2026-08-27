"use client";

import Link from "next/link";
import { Trophy, Phone, MapPin, Mail, Globe, Share2, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{
      background: "#02050B",
      borderTop: "1px solid rgba(0, 240, 255, 0.15)",
      padding: "80px 0 32px 0",
      position: "relative",
    }}>
      <div className="container" style={{ position: "relative", zIndex: 5 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "40px",
          marginBottom: "60px",
        }}>
          {/* Col 1: Brand Info */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #00F0FF, #0066FF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                color: "#040811",
                fontFamily: "Montserrat",
                boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)",
              }}>
                V
              </div>
              <span style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: "18px", letterSpacing: "0.05em", color: "#F1F5F9" }}>
                VAMOS ARENA
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.7, marginBottom: "20px" }}>
              Rumah Biliar Modern berstandar POBSI dengan fasilitas 16 meja turnamen 9-ft, sistem live scoring digital, F&B Cafe eksklusif, dan komunitas atlet biliar terbaik di Indonesia.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <a
                href="https://instagram.com/vamospool.id"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(0, 240, 255, 0.08)",
                  border: "1px solid rgba(0, 240, 255, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00F0FF",
                  transition: "all 0.2s ease",
                  textDecoration: "none"
                }}
              >
                <Share2 size={18} />
              </a>

              <a
                href="https://wa.me/62811444000"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(0, 240, 255, 0.08)",
                  border: "1px solid rgba(0, 240, 255, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00F0FF",
                  transition: "all 0.2s ease",
                  textDecoration: "none"
                }}
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 style={{ fontFamily: "Montserrat", fontSize: "14px", fontWeight: 800, color: "#F1F5F9", textTransform: "uppercase", marginBottom: "20px" }}>
              Navigasi Cepat
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Beranda", href: "#home" },
                { label: "Fasilitas & Tipe Meja", href: "#venue" },
                { label: "Jadwal & Bagan Turnamen", href: "#tournaments" },
                { label: "Menu Cafe & Resto", href: "#cafe" },
                { label: "Download Player App", href: "#player-app" },
              ].map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    style={{ fontSize: "13px", color: "#94A3B8", textDecoration: "none", transition: "color 0.2s ease" }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Operational & Arena Info */}
          <div>
            <h4 style={{ fontFamily: "Montserrat", fontSize: "14px", fontWeight: 800, color: "#F1F5F9", textTransform: "uppercase", marginBottom: "20px" }}>
              Informasi Arena
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#94A3B8" }}>
              <li>
                <strong style={{ color: "#F1F5F9" }}>Jam Operasional:</strong><br />
                Senin – Minggu: 10:00 – 02:00 WITA
              </li>
              <li>
                <strong style={{ color: "#F1F5F9" }}>Kapasitas Venue:</strong><br />
                16 Meja 9-ft Tournament + VIP Rooms
              </li>
              <li>
                <strong style={{ color: "#F1F5F9" }}>Standar Regulasi:</strong><br />
                POBSI & WPA Official Rules
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Booking */}
          <div>
            <h4 style={{ fontFamily: "Montserrat", fontSize: "14px", fontWeight: 800, color: "#F1F5F9", textTransform: "uppercase", marginBottom: "20px" }}>
              Hotline Reservasi
            </h4>
            <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6, marginBottom: "16px" }}>
              Hubungi staf kami untuk reservasi meja, pendaftaran turnamen, atau sewa venue untuk event komunitas.
            </p>
            <a
              href="https://wa.me/62811444000?text=Halo%20Vamos%20Smart%20Arena"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                fontSize: "12px",
              }}
            >
              <Phone size={14} />
              <span>WhatsApp Admin</span>
            </a>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          paddingTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "12px",
          color: "#64748B",
        }}>
          <div>
            © {new Date().getFullYear()} VAMOS SMART ARENA POOL & CAFE (vamospool.id). All rights reserved.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span>Powered by</span>
            <span style={{ color: "#00F0FF", fontWeight: 700 }}>Vamos Smart POS Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
