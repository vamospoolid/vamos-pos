"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Venue", href: "#venue" },
  { label: "Turnamen", href: "#tournament" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "Galeri", href: "#gallery" },
  { label: "Kontak", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: "all 0.4s ease",
          background: scrolled
            ? "rgba(8, 8, 15, 0.92)"
            : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(201, 168, 76, 0.12)"
            : "1px solid transparent",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "72px" }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 36, height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #C9A84C, #A07830)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", fontWeight: "900",
              fontFamily: "Montserrat, sans-serif",
              color: "#0A0A0F",
              boxShadow: "0 0 20px rgba(201,168,76,0.4)",
            }}>V</div>
            <span style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 800,
              fontSize: "18px",
              letterSpacing: "-0.02em",
            }}>
              <span className="gold-text">VAMOS</span>
              <span style={{ color: "rgba(240,237,230,0.7)", marginLeft: "4px" }}>POOL</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="desktop-nav">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = "var(--gold)";
                  (e.target as HTMLElement).style.background = "rgba(201,168,76,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = "var(--text-secondary)";
                  (e.target as HTMLElement).style.background = "transparent";
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA + Mobile toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <a href="#tournament" className="btn-gold" style={{ padding: "10px 22px", fontSize: "12px" }}>
              Daftar Turnamen
            </a>
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-secondary)", display: "none",
                padding: "8px",
              }}
              className="mobile-toggle"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div style={{
            background: "rgba(8,8,15,0.98)",
            borderTop: "1px solid var(--border-subtle)",
            padding: "16px 24px 24px",
          }}>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "block",
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                {link.label}
              </a>
            ))}
            <a href="#tournament" className="btn-gold" style={{ marginTop: "20px", display: "block", textAlign: "center" }}>
              Daftar Turnamen
            </a>
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </>
  );
}
