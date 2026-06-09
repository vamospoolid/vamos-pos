"use client";

import { useState } from "react";
import { Play, Sparkles, Image as ImageIcon } from "lucide-react";

const galleryItems = [
  {
    id: 1,
    title: "Tournament Main Stage",
    category: "Venue",
    desc: "Meja utama dengan pencahayaan professional-grade.",
    image: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    title: "VIP Lounge Area",
    category: "VIP",
    desc: "Suasana nyaman meja VIP dengan sofa mewah & mini bar.",
    image: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    title: "Champions Night",
    category: "Turnamen",
    desc: "Momen penyerahan piala Vamos Open Cup.",
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    title: "F&B Premium Cafe",
    category: "Fasilitas",
    desc: "Pilihan menu steak dan minuman kopi dingin khas Vamos.",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    title: "Precision Practice",
    category: "Latihan",
    desc: "Pemain pro berlatih trik pukulan presisi.",
    image: "https://images.unsplash.com/photo-1609137144813-2dbe49160d5b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    title: "Community Gathering",
    category: "Komunitas",
    desc: "Keseruan kumpul mingguan komunitas Makassar Billiard Club.",
    image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80",
  },
];

const categories = ["Semua", "Venue", "VIP", "Turnamen", "Fasilitas", "Komunitas"];

export default function GallerySection() {
  const [activeCategory, setActiveCategory] = useState("Semua");

  const filteredItems = activeCategory === "Semua" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory);

  return (
    <section id="gallery" style={{ padding: "120px 0", position: "relative" }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, var(--border), transparent)",
      }} />

      <div className="container" style={{ position: "relative" }}>
        {/* Header */}
        <div style={{ marginBottom: "56px" }}>
          <div className="section-label">📸 Galeri</div>
          <h2 className="section-title">
            Sudut Terbaik <span className="gold-text">Vamos Pool</span>
          </h2>
          <p className="section-desc">
            Intip kemewahan desain interior, keseruan turnamen, dan hangatnya suasana komunitas kami langsung dari galeri foto.
          </p>
        </div>

        {/* Categories Bar */}
        <div style={{
          display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "40px"
        }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 20px",
                borderRadius: "100px",
                border: activeCategory === cat ? "1px solid var(--gold)" : "1px solid var(--border-subtle)",
                cursor: "pointer",
                fontFamily: "Montserrat",
                fontWeight: 600,
                fontSize: "12px",
                transition: "all 0.2s ease",
                background: activeCategory === cat ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.02)",
                color: activeCategory === cat ? "var(--gold-light)" : "var(--text-secondary)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                overflow: "hidden",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Image Container */}
              <div style={{
                position: "relative",
                height: "220px",
                width: "100%",
                background: "var(--bg-secondary)",
                overflow: "hidden",
              }}>
                <img
                  src={item.image}
                  alt={item.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.5s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                />
                <span
                  className="badge"
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    background: "rgba(8, 8, 15, 0.75)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {item.category}
                </span>
              </div>

              {/* Content */}
              <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: "16px", marginBottom: "8px", color: "var(--text-primary)" }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
