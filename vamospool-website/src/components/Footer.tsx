"use client";

import { ArrowUp } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer style={{
      background: "var(--bg-secondary)",
      borderTop: "1px solid var(--border-subtle)",
      padding: "60px 0 32px",
      position: "relative",
    }}>
      <div className="container">
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "40px",
          marginBottom: "48px",
        }}>
          {/* Logo & Brand Slogan */}
          <div style={{ maxWidth: "320px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #C9A84C, #A07830)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", fontWeight: "900",
                color: "#0A0A0F",
              }}>V</div>
              <span style={{
                fontFamily: "Montserrat",
                fontWeight: 800,
                fontSize: "18px",
                letterSpacing: "-0.02em",
              }}>
                <span className="gold-text">VAMOS</span>
                <span style={{ color: "rgba(240,237,230,0.7)" }}>POOL</span>
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Venue billiard dan esports hub modern yang menghadirkan pengalaman kompetitif premium berkelas dunia di Makassar.
            </p>
          </div>

          {/* Navigation links */}
          <div>
            <h4 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
              Navigasi
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {["Venue", "Turnamen", "Leaderboard", "Galeri", "Kontak"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--gold)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h4 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
              Ikuti Kami
            </h4>
            <div style={{ display: "flex", gap: "12px" }}>
              {[
                { 
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  ), 
                  href: "https://instagram.com" 
                },
                { 
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                  ), 
                  href: "https://tiktok.com" 
                },
                { 
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"></path>
                      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
                    </svg>
                  ), 
                  href: "https://youtube.com" 
                },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-secondary)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--gold)";
                    e.currentTarget.style.borderColor = "var(--gold)";
                    e.currentTarget.style.background = "rgba(201,168,76,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Back to top */}
          <button
            onClick={scrollToTop}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px",
              fontFamily: "Montserrat", fontWeight: 700, fontSize: "11px",
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--gold)",
            }}
            id="footer-back-to-top"
          >
            <span>Kembali ke atas</span>
            <ArrowUp size={14} />
          </button>
        </div>

        {/* Bottom copyright */}
        <div style={{
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} Vamos Pool. Hak Cipta Dilindungi Undang-Undang.
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "16px" }}>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Privacy Policy</a>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Terms of Service</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
