"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy, Target, Users, ChevronDown, Play, Star } from "lucide-react";

const stats = [
  { value: "24", suffix: "", label: "Meja Premium", icon: "🎱" },
  { value: "1200", suffix: "+", label: "Member Aktif", icon: "👥" },
  { value: "48", suffix: "+", label: "Turnamen Digelar", icon: "🏆" },
  { value: "5", suffix: "★", label: "Rating Venue", icon: "⭐" },
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
          const duration = 1800;
          const step = (end / duration) * 16;
          const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
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
        paddingTop: "72px",
      }}
    >
      {/* Background layers */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 60% 50%, rgba(201,168,76,0.07) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(45,106,79,0.07) 0%, transparent 50%)",
        pointerEvents: "none",
      }} />

      {/* Animated billiard balls */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {[
          { size: 80, top: "15%", right: "10%", color: "#C9A84C", delay: "0s" },
          { size: 50, top: "65%", right: "18%", color: "#2D6A4F", delay: "1.5s" },
          { size: 35, top: "30%", right: "28%", color: "#1A3A5C", delay: "0.8s" },
          { size: 60, bottom: "20%", left: "8%", color: "#8B2020", delay: "2s" },
          { size: 28, top: "50%", left: "20%", color: "#C9A84C", delay: "1s" },
        ].map((ball, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: ball.size, height: ball.size,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${ball.color}90, ${ball.color}20)`,
              border: `1px solid ${ball.color}40`,
              top: ball.top, right: ball.right,
              bottom: (ball as any).bottom, left: (ball as any).left,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: ball.delay,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Grid lines */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }} />

      <div className="container" style={{ position: "relative", zIndex: 1, paddingTop: "60px", paddingBottom: "100px" }}>
        {/* Badge */}
        <div style={{ marginBottom: "28px" }}>
          <span className="badge">
            <Star size={10} fill="currentColor" />
            Premier Billiard Venue — Makassar
          </span>
        </div>

        {/* Main heading */}
        <h1 style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)", fontWeight: 900, lineHeight: 1.0, marginBottom: "28px", maxWidth: "800px" }}>
          Where<br />
          <span className="gold-text">Champions</span><br />
          Are Made.
        </h1>

        <p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "var(--text-secondary)", maxWidth: "480px", lineHeight: 1.8, marginBottom: "44px" }}>
          Venue billiard premium dengan 24 meja kelas dunia, ekosistem turnamen terlengkap, dan komunitas pemain terbaik di Makassar.
        </p>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "80px" }}>
          <a href="#tournament" className="btn-gold" id="hero-cta-tournament">
            🏆 Ikuti Turnamen
          </a>
          <a href="#venue" className="btn-outline" id="hero-cta-venue">
            Lihat Venue
          </a>
        </div>

        {/* Stats row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1px",
          background: "var(--border-subtle)",
          borderRadius: "16px",
          overflow: "hidden",
          maxWidth: "700px",
        }}>
          {stats.map((s) => (
            <div key={s.label} style={{
              background: "var(--bg-secondary)",
              padding: "24px 20px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{s.icon}</div>
              <div className="stat-number" style={{ fontSize: "2rem" }}>
                <CountUp end={parseInt(s.value)} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "Montserrat", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "4px" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
        animation: "float 2s ease-in-out infinite",
      }}>
        <span style={{ fontSize: "10px", fontFamily: "Montserrat", fontWeight: 600, letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase" }}>Scroll</span>
        <ChevronDown size={16} color="var(--text-muted)" />
      </div>
    </section>
  );
}
