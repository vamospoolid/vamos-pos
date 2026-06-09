"use client";

import { useState } from "react";
import { Send, Phone, MessageSquare, Mail, HelpCircle, ChevronDown, Check } from "lucide-react";

const faqs = [
  {
    q: "Bagaimana cara melakukan reservasi meja di Vamos Pool?",
    a: "Anda bisa langsung reservasi melalui WhatsApp resmi kami dengan menekan tombol 'Reservasi via WhatsApp' atau datang langsung ke venue (walk-in). Kami juga sedang mengintegrasikan sistem booking real-time ke website ini.",
  },
  {
    q: "Apakah pemula boleh mengikuti turnamen Vamos?",
    a: "Tentu saja! Kami mengadakan berbagai kelas turnamen dari tingkat Pemula (Coaching/Youth), Intermediate, hingga Open Championship nasional. Silakan periksa detail syarat di daftar turnamen aktif.",
  },
  {
    q: "Berapa kapasitas meja VIP dan apa saja keunggulannya?",
    a: "Meja VIP kami menggunakan Brunswick Tournament Edition dengan ruang kedap suara ber-AC, sofa mewah, Smart TV untuk monitoring/streaming, serta layanan butler F&B khusus.",
  },
  {
    q: "Apakah ada paket member bulanan?",
    a: "Ya, kami menawarkan Vamos Elite Member dengan keuntungan diskon tarif meja hingga 20%, akses early-bird pendaftaran turnamen, dan merchandise eksklusif.",
  },
];

function FAQItem({ faq }: { faq: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        padding: "16px 0",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          color: open ? "var(--gold)" : "var(--text-primary)",
          fontFamily: "Montserrat",
          fontWeight: 700,
          fontSize: "14px",
          padding: "8px 0",
          transition: "color 0.2s ease",
        }}
      >
        <span>{faq.q}</span>
        <ChevronDown
          size={16}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
            color: "var(--text-muted)",
          }}
        />
      </button>
      <div
        style={{
          maxHeight: open ? "200px" : "0px",
          overflow: "hidden",
          transition: "all 0.3s ease",
        }}
      >
        <p style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          paddingTop: "8px",
          paddingBottom: "16px",
        }}>
          {faq.a}
        </p>
      </div>
    </div>
  );
}

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setName("");
        setEmail("");
        setMessage("");
      }, 3000);
    }
  };

  return (
    <section id="contact" style={{ padding: "120px 0", position: "relative" }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, var(--border), transparent)",
      }} />

      <div className="container" style={{ position: "relative" }}>
        {/* Header */}
        <div style={{ marginBottom: "56px" }}>
          <div className="section-label">📞 Kontak & FAQ</div>
          <h2 className="section-title">
            Hubungi <span className="gold-text">Kami</span>
          </h2>
          <p className="section-desc">
            Punya pertanyaan mengenai turnamen, reservasi tempat, atau kemitraan? Hubungi tim admin kami secara langsung.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "40px", alignItems: "start" }}>
          {/* Contact Details & Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Quick Contact buttons */}
            <div className="glass-card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "16px", marginBottom: "4px" }}>
                Fast Response
              </h3>
              
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                className="btn-gold"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  fontSize: "13px",
                  background: "linear-gradient(135deg, #25D366, #128C7E)",
                  color: "#ffffff",
                }}
                id="contact-whatsapp"
              >
                <MessageSquare size={16} />
                Hubungi via WhatsApp
              </a>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <Phone size={14} color="var(--gold)" />
                  <span>+62 812-3456-7890 (Call Center)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <Mail size={14} color="var(--gold)" />
                  <span>support@vamospool.id</span>
                </div>
              </div>
            </div>

            {/* Email Form */}
            <div className="glass-card" style={{ padding: "32px" }}>
              <h3 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "16px", marginBottom: "16px" }}>
                Kirim Pesan
              </h3>
              
              {submitted ? (
                <div style={{
                  background: "rgba(45, 106, 79, 0.15)",
                  border: "1px solid rgba(45, 106, 79, 0.35)",
                  borderRadius: "8px",
                  padding: "16px",
                  textAlign: "center",
                  color: "#4CAF7D",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <Check size={24} />
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Pesan terkirim! Tim kami akan segera membalas.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        color: "var(--text-primary)",
                        fontSize: "13px",
                        outline: "none",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border-subtle)"}
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Alamat Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        color: "var(--text-primary)",
                        fontSize: "13px",
                        outline: "none",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border-subtle)"}
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Bagaimana kami bisa membantu Anda?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={4}
                      style={{
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        color: "var(--text-primary)",
                        fontSize: "13px",
                        outline: "none",
                        resize: "none",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border-subtle)"}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-gold"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "12px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                    id="submit-contact-form"
                  >
                    <Send size={14} />
                    Kirim Sekarang
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* FAQs Accordion */}
          <div className="glass-card" style={{ padding: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <HelpCircle size={18} color="var(--gold)" />
              <h3 style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: "18px" }}>Tanya Jawab (FAQ)</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {faqs.map((faq, i) => (
                <FAQItem key={i} faq={faq} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #contact .container > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
