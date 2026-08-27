"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Phone, Menu, X, Download, ShieldCheck, Sparkles } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Beranda", href: "/#home" },
    { label: "Venue & Meja", href: "/#venue" },
    { label: "Live Bagan", href: "/bracket" },
    { label: "Live Scoreboard", href: "/scoreboard" },
    { label: "Live Drawing", href: "/drawing" },
    { label: "Cafe & Resto", href: "/#cafe" },
    { label: "Player App", href: "/#player-app" },
    { label: "Kontak & Lokasi", href: "/#contact" },
  ];

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: "all 0.3s ease",
        background: scrolled
          ? "rgba(4, 8, 17, 0.92)"
          : "linear-gradient(180deg, rgba(4,8,17,0.85) 0%, rgba(4,8,17,0) 100%)",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(0, 240, 255, 0.15)"
          : "1px solid transparent",
      }}
    >
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "80px" }}>
        {/* Logo */}
        <Link href="#home" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <div style={{
            position: "relative",
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #00F0FF, #0066FF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 25px rgba(0, 240, 255, 0.4)",
            overflow: "hidden"
          }}>
            <span style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: "20px", color: "#040811" }}>V</span>
          </div>
          <div>
            <div style={{
              fontFamily: "Montserrat",
              fontWeight: 900,
              fontSize: "18px",
              letterSpacing: "0.08em",
              color: "#F1F5F9",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span>VAMOS</span>
              <span style={{
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(0, 240, 255, 0.15)",
                border: "1px solid rgba(0, 240, 255, 0.4)",
                color: "#00F0FF"
              }}>
                ARENA
              </span>
            </div>
            <div style={{ fontSize: "10px", color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Smart Pool & Cafe
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav style={{ display: "none" }} className="desktop-nav">
          <ul style={{ display: "flex", alignItems: "center", gap: "28px", listStyle: "none" }}>
            {navLinks.map((item, idx) => (
              <li key={idx}>
                <Link
                  href={item.href}
                  style={{
                    color: "#94A3B8",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                    fontFamily: "Inter, sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#00F0FF";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#94A3B8";
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop Action Buttons */}
        <div style={{ display: "none", alignItems: "center", gap: "12px" }} className="desktop-actions">
          <a
            href="https://wa.me/62811444000?text=Halo%20Vamos%20Pool,%20saya%20ingin%20reservasi%20meja"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
            style={{
              padding: "10px 20px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Phone size={14} />
            <span>Booking Meja</span>
          </a>

          <a
            href="#player-app"
            className="btn-outline"
            style={{
              padding: "9px 18px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Download size={14} />
            <span>App</span>
          </a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "rgba(0, 240, 255, 0.08)",
            border: "1px solid rgba(0, 240, 255, 0.25)",
            color: "#00F0FF",
            cursor: "pointer"
          }}
          className="mobile-toggle"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: 0,
            right: 0,
            background: "rgba(4, 8, 17, 0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(0, 240, 255, 0.2)",
            padding: "24px 20px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
            animation: "fadeIn 0.25s ease"
          }}
        >
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
            {navLinks.map((item, idx) => (
              <li key={idx}>
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    color: "#F1F5F9",
                    fontSize: "16px",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "block",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <a
              href="https://wa.me/62811444000?text=Halo%20Vamos%20Pool,%20saya%20ingin%20reservasi%20meja"
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
                padding: "14px"
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Phone size={16} />
              <span>Reservasi WhatsApp</span>
            </a>

            <a
              href="#player-app"
              className="btn-outline"
              style={{
                width: "100%",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px"
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Download size={16} />
              <span>Download Player App</span>
            </a>
          </div>
        </div>
      )}

      {/* Media queries style injection for desktop/mobile toggle */}
      <style jsx>{`
        @media (min-width: 900px) {
          .desktop-nav {
            display: block !important;
          }
          .desktop-actions {
            display: flex !important;
          }
          .mobile-toggle {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
