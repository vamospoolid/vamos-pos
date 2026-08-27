"use client";

import { Coffee, Utensils, GlassWater, Flame, Sparkles } from "lucide-react";

const menuItems = [
  {
    category: "Signature Coffee & Mocktail",
    icon: <Coffee size={20} />,
    items: [
      { name: "Vamos Blue Ice Mocktail", price: "Rp 25.000", desc: "Perpaduan sirup curacao biru, soda segar, dan perasan jeruk nipis" },
      { name: "Arena Signature Latte", price: "Rp 28.000", desc: "Espresso premium dengan susu lembut dan salted caramel" },
      { name: "Matcha Fusion Cold", price: "Rp 26.000", desc: "Pure Japanese Uji matcha dengan susu segar dingin" },
    ]
  },
  {
    category: "Main Course & Rice Bowl",
    icon: <Utensils size={20} />,
    items: [
      { name: "Nasi Goreng Spesial Vamos", price: "Rp 32.000", desc: "Nasi goreng bumbu rempah khas dengan sate ayam dan telur mata sapi" },
      { name: "Chicken Katsu Curry Bowl", price: "Rp 35.000", desc: "Ayam fillet krispi dengan saus kari Jepang autentik" },
      { name: "Sirloin Beef Rice Bowl", price: "Rp 45.000", desc: "Daging sirloin empuk dengan saus blackpepper lada hitam" },
    ]
  },
  {
    category: "Snack & Platter Sharing",
    icon: <Flame size={20} />,
    items: [
      { name: "Vamos Mega Platter", price: "Rp 48.000", desc: "Kombinasi sosis bratwurst, french fries, chicken nugget, dan onion ring" },
      { name: "French Fries Truffle", price: "Rp 22.000", desc: "Kentang goreng renyah dengan taburan keju parmesan dan minyak truffle" },
      { name: "Crispy Chicken Wings", price: "Rp 30.000", desc: "Sayap ayam renyah berbalut bumbu spicy garlic honey" },
    ]
  }
];

export default function CafeSection() {
  return (
    <section id="cafe" style={{ padding: "100px 0", position: "relative" }}>
      <div className="container" style={{ position: "relative", zIndex: 5 }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div className="section-label">🍽️ VAMOS CAFE & RESTO</div>
          <h2 className="section-title">
            Santap Lezat Sambil <span className="gold-text">Menikmati Pertandingan</span>
          </h2>
          <p className="section-desc" style={{ margin: "0 auto" }}>
            Layanan F&B langsung diantar ke meja biliar Anda. Mulai dari kopi mocktail penyegar hingga makanan berat pengisi tenaga.
          </p>
        </div>

        {/* Menu Columns Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
        }}>
          {menuItems.map((cat, idx) => (
            <div key={idx} className="glass-card" style={{
              padding: "32px 24px",
              background: "rgba(10, 16, 32, 0.75)",
              border: "1px solid rgba(0, 240, 255, 0.18)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(0, 240, 255, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00F0FF",
                }}>
                  {cat.icon}
                </div>
                <h3 style={{
                  fontFamily: "Montserrat",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#F1F5F9",
                }}>
                  {cat.category}
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {cat.items.map((item, iIdx) => (
                  <div key={iIdx} style={{
                    borderBottom: iIdx < cat.items.length - 1 ? "1px solid rgba(255, 255, 255, 0.06)" : "none",
                    paddingBottom: iIdx < cat.items.length - 1 ? "16px" : "0",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#F1F5F9" }}>
                        {item.name}
                      </span>
                      <span style={{ fontFamily: "Montserrat", fontSize: "13px", fontWeight: 800, color: "#00F0FF" }}>
                        {item.price}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#94A3B8", lineHeight: 1.5 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
