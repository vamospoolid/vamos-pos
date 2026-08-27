"use client";

import { useState } from "react";
import { MapPin, Clock, Phone, Mail, MessageCircle, ChevronDown, Sparkles, Send } from "lucide-react";

const faqs = [
  {
    q: "Bagaimana cara melakukan reservasi meja di Vamos Smart Arena?",
    a: "Anda dapat melakukan reservasi secara instan melalui WhatsApp Hotline kami atau langsung dari aplikasi Vamos Player App. Meja akan disiapkan dan di-lock sesuai waktu kedatangan Anda.",
  },
  {
    q: "Apakah pemula boleh ikut serta dalam turnamen Vamos?",
    a: "Sangat boleh! Kami memiliki seri turnamen berkala dengan kategori Handicap (HC 3 s/d HC 7) dan Youth Cup khusus pemula/pelajar, di mana Anda akan bertanding dengan pemain di tingkat kemahiran yang setara.",
  },
  {
    q: "Apa saja fasilitas yang tersedia di ruang VIP?",
    a: "Ruang VIP kami dilengkapi meja 9-ft berstandar turnamen, ruangan ber-AC dingin kedap suara, sofa empuk, Smart TV 65-inch, sound system premium, dan layanan butler F&B khusus.",
  },
  {
    q: "Apakah tersedia paket hemat atau diskon khusus member?",
    a: "Ya! Kami menyediakan Paket Happy Hour setiap hari (Pukul 10:00 – 17:00 WITA) dengan tarif mulai Rp 25.000/jam, serta potongan harga spesial untuk member terdaftar.",
  },
];

export default function ContactSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section id="contact" style={{ padding: "100px 0", position: "relative" }}>
      {/* Background Accent */}
      <div style={{
        position: "absolute",
        bottom: "10%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "600px",
        height: "400px",
        background: "radial-gradient(circle, rgba(0, 102, 255, 0.08) 0%, transparent 70%)",
        pointerEvents: "none",
        filter: "blur(60px)",
      }} />

      <div className="container" style={{ position: "relative", zIndex: 5 }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div className="section-label">📍 LOCATION & SUPPORT</div>
          <h2 className="section-title">
            Kunjungi <span className="gold-text">Vamos Smart Arena</span>
          </h2>
          <p className="section-desc" style={{ margin: "0 auto" }}>
            Siap untuk mengasah pukulan terbaik Anda? Kunjungi venue kami atau hubungi tim customer service kami untuk informasi dan reservasi.
          </p>
        </div>

        {/* Info Cards Grid & Map */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "36px",
          marginBottom: "64px",
        }} className="contact-grid">
          
          {/* Left Column: Contact Cards & Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="glass-card" style={{
              padding: "28px",
              background: "rgba(10, 16, 32, 0.75)",
              border: "1px solid rgba(0, 240, 255, 0.2)",
              display: "flex",
              alignItems: "flex-start",
              gap: "16px",
            }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(0, 240, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00F0FF",
                flexShrink: 0,
              }}>
                <MapPin size={22} />
              </div>
              <div>
                <h4 style={{ fontFamily: "Montserrat", fontSize: "16px", fontWeight: 800, color: "#F1F5F9", marginBottom: "6px" }}>
                  Alamat Venue
                </h4>
                <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6 }}>
                  Jl. Boulevard Panakkukang No. 88, Makassar, Sulawesi Selatan (Pusat Kota & Akses Parkir Mudah).
                </p>
              </div>
            </div>

            <div className="glass-card" style={{
              padding: "28px",
              background: "rgba(10, 16, 32, 0.75)",
              border: "1px solid rgba(0, 240, 255, 0.2)",
              display: "flex",
              alignItems: "flex-start",
              gap: "16px",
            }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(0, 240, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00F0FF",
                flexShrink: 0,
              }}>
                <Clock size={22} />
              </div>
              <div>
                <h4 style={{ fontFamily: "Montserrat", fontSize: "16px", fontWeight: 800, color: "#F1F5F9", marginBottom: "6px" }}>
                  Jam Operasional
                </h4>
                <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6 }}>
                  Buka Setiap Hari: <strong>10:00 – 02:00 WITA</strong><br />
                  (Turnamen & Event sesuai jadwal khusus).
                </p>
              </div>
            </div>

            <div className="glass-card" style={{
              padding: "28px",
              background: "rgba(10, 16, 32, 0.75)",
              border: "1px solid rgba(0, 240, 255, 0.2)",
              display: "flex",
              alignItems: "flex-start",
              gap: "16px",
            }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(0, 240, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00F0FF",
                flexShrink: 0,
              }}>
                <MessageCircle size={22} />
              </div>
              <div>
                <h4 style={{ fontFamily: "Montserrat", fontSize: "16px", fontWeight: 800, color: "#F1F5F9", marginBottom: "6px" }}>
                  WhatsApp Hotline & Reservasi
                </h4>
                <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6, marginBottom: "12px" }}>
                  Respons cepat untuk ketersediaan meja, pendaftaran turnamen, dan event gathering.
                </p>
                <a
                  href="https://wa.me/62811444000?text=Halo%20Vamos%20Pool,%20saya%20ingin%20bertanya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold"
                  style={{
                    padding: "8px 18px",
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span>Chat WhatsApp</span>
                  <Send size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Google Maps Embed */}
          <div className="glass-card" style={{
            overflow: "hidden",
            border: "1px solid rgba(0, 240, 255, 0.25)",
            borderRadius: "20px",
            minHeight: "340px",
            height: "100%",
            position: "relative",
          }}>
            <iframe
              title="Lokasi Vamos Smart Arena"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3973.743126895318!2d119.444100!3d-5.147800!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwMDgnNTIuMSJTIDExOcKwMjYnMzguOCJF!5e0!3m2!1sid!2sid!4v1620000000000!5m2!1sid!2sid"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "340px", filter: "invert(90%) hue-rotate(180deg) brightness(85%) contrast(120%)" }}
              allowFullScreen={false}
              loading="lazy"
            />
          </div>
        </div>

        {/* Interactive FAQ Section */}
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <h3 style={{ fontFamily: "Montserrat", fontSize: "24px", fontWeight: 800, color: "#F1F5F9" }}>
              Frequently Asked Questions (FAQ)
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-card" style={{
                padding: "20px 24px",
                background: "rgba(10, 16, 32, 0.7)",
                border: "1px solid rgba(0, 240, 255, 0.15)",
                cursor: "pointer",
              }} onClick={() => toggleFaq(idx)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontFamily: "Montserrat", fontSize: "14px", fontWeight: 700, color: openFaq === idx ? "#00F0FF" : "#F1F5F9" }}>
                    {faq.q}
                  </h4>
                  <ChevronDown
                    size={18}
                    color={openFaq === idx ? "#00F0FF" : "#94A3B8"}
                    style={{
                      transform: openFaq === idx ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s ease",
                    }}
                  />
                </div>
                {openFaq === idx && (
                  <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6, marginTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "12px" }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 900px) {
          .contact-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
