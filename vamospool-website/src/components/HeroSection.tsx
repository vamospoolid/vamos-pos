"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Trophy, Target, Users, ChevronRight, Play, Star, MapPin, Sparkles, Activity } from "lucide-react";

const stats = [
  { value: "16", suffix: " Unit", label: "Meja 9-ft Tournament", icon: "🎱" },
  { value: "1250", suffix: "+", label: "Member Aktif", icon: "👥" },
  { value: "50", suffix: "+ Jt", label: "Prize Pool Bulanan", icon: "🏆" },
  { value: "5.0", suffix: " ★", label: "Rating Kepuasan", icon: "⭐" },
];

function CountUp({ end, suffix }: { end: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const duration = 1500;
          const step = (end / duration) * 16;
          const timer = setInterval(() => {
            start += step;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function HeroSection() {
  return (
    <section
      id="home"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        paddingTop: "90px",
        paddingBottom: "60px",
        background: "radial-gradient(ellipse at 50% 20%, rgba(0, 102, 255, 0.15) 0%, rgba(4, 8, 17, 1) 75%)",
      }}
    >
      {/* Dynamic Background Neon Orbs */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0, 240, 255, 0.12) 0%, rgba(0, 102, 255, 0.04) 50%, transparent 80%)",
        filter: "blur(60px)",
        pointerEvents: "none",
      }} />

      {/* Grid Pattern Overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(0, 240, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        opacity: 0.8,
      }} />

      <div className="container" style={{ position: "relative", zIndex: 10 }}>
        {/* Top Badges & Live Status */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(0, 240, 255, 0.08)",
            border: "1px solid rgba(0, 240, 255, 0.3)",
            padding: "6px 14px",
            borderRadius: "100px",
            color: "#00F0FF",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            boxShadow: "0 0 15px rgba(0, 240, 255, 0.2)",
          }}>
            <Sparkles size={14} />
            <span>Smart Billiard & Esports Arena</span>
          </div>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            padding: "6px 12px",
            borderRadius: "100px",
            color: "#10B981",
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "Montserrat",
          }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#10B981",
              boxShadow: "0 0 8px #10B981",
              display: "inline-block"
            }} />
            <span>VENUE BUKA • 10:00 – 02:00 WITA</span>
          </div>
        </div>

        {/* Main Content Grid (Text Left, Visual Right) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "40px",
          alignItems: "center",
        }} className="hero-grid">
          
          {/* Left Column: Heading & CTA */}
          <div>
            <h1 style={{
              fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "20px",
              fontFamily: "Montserrat, sans-serif",
            }}>
              Sensasi Main Biliar{" "}
              <span className="gold-text">
                Kelas Turnamen
              </span>{" "}
              di Smart Arena
            </h1>

            <p style={{
              fontSize: "clamp(1rem, 2vw, 1.15rem)",
              color: "#94A3B8",
              lineHeight: 1.7,
              marginBottom: "36px",
              maxWidth: "580px",
            }}>
              Nikmati meja 9-ft berstandar POBSI dengan kain Simonis Electric Blue, pencahayaan LED anti-shadow, sistem digital live scoring, serta Cafe & Resto berkelas.
            </p>

            {/* CTA Buttons */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              alignItems: "center",
              marginBottom: "40px",
            }}>
              <a
                href="https://wa.me/62811444000?text=Halo%20Vamos%20Smart%20Arena,%20saya%20ingin%20reservasi%20meja%20billiard"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "14px",
                  padding: "16px 32px",
                }}
              >
                <span>Reservasi Meja</span>
                <ChevronRight size={18} />
              </a>

              <a
                href="#tournaments"
                className="btn-outline"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  padding: "15px 28px",
                }}
              >
                <Trophy size={16} />
                <span>Lihat Bagan Turnamen</span>
              </a>
            </div>

            {/* Quick Live Table Status Card */}
            <div className="glass-card" style={{
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: "520px",
              border: "1px solid rgba(0, 240, 255, 0.2)",
              background: "rgba(10, 16, 32, 0.75)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(0, 240, 255, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00F0FF"
                }}>
                  <Activity size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Status Meja Real-time
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#F1F5F9" }}>
                    12 dari 16 Meja Siap Dimainkan
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#10B981",
                background: "rgba(16, 185, 129, 0.15)",
                padding: "4px 10px",
                borderRadius: "6px",
              }}>
                Tersedia
              </span>
            </div>
          </div>

          {/* Right Column: Hero Visual Arena Mockup */}
          <div style={{ position: "relative" }}>
            <div style={{
              position: "relative",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              boxShadow: "0 20px 50px rgba(0, 102, 255, 0.25)",
              background: "rgba(10, 16, 32, 0.8)",
            }}>
              <img
                src="/images/VAMOS_ARENA_PREVIEW.png"
                alt="Vamos Smart Arena Pool & Cafe"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
              
              {/* Overlay Gradient */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "24px",
                background: "linear-gradient(180deg, transparent 0%, rgba(4, 8, 17, 0.95) 90%)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#00F0FF", fontWeight: 700, textTransform: "uppercase" }}>
                    Official Tournament Arena
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#F1F5F9" }}>
                    VAMOS SMART ARENA
                  </div>
                </div>
                <div style={{
                  background: "linear-gradient(135deg, #00F0FF, #0066FF)",
                  color: "#040811",
                  fontWeight: 800,
                  fontSize: "12px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <Star size={12} fill="#040811" />
                  <span>POBSI GRADE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "16px",
          marginTop: "60px",
          paddingTop: "40px",
          borderTop: "1px solid rgba(0, 240, 255, 0.12)",
        }}>
          {stats.map((s, idx) => (
            <div key={idx} className="glass-card" style={{
              padding: "20px 16px",
              textAlign: "center",
              background: "rgba(10, 16, 32, 0.6)",
            }}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>{s.icon}</div>
              <div style={{
                fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                fontWeight: 900,
                fontFamily: "Montserrat",
                color: "#00F0FF",
                marginBottom: "4px",
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Media query for desktop 2 columns layout */}
      <style jsx>{`
        @media (min-width: 960px) {
          .hero-grid {
            grid-template-columns: 1.15fr 0.85fr !important;
          }
        }
      `}</style>
    </section>
  );
}
