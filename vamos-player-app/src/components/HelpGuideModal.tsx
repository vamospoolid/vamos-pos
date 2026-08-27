import { useState } from 'react';
import { X, Swords, QrCode, Crown, Trophy, Sparkles, MessageCircle, ChevronDown, ChevronUp, BookOpen, ShieldCheck } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: 'fight' | 'booking' | 'tournament' | 'points' | 'all';
}

export function HelpGuideModal({ isOpen, onClose, initialCategory = 'fight' }: HelpGuideModalProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'fight' | 'booking' | 'tournament' | 'points'>(initialCategory);
  const [expandedFaq, setExpandedFaq] = useState<Record<string, boolean>>({
    'fight-1': true,
    'fight-2': true,
  });

  if (!isOpen) return null;

  const toggleFaq = (id: string) => {
    setExpandedFaq(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleWhatsAppHelp = () => {
    const phone = '6281234567890'; // WhatsApp CS Vamos Pool
    const text = encodeURIComponent('Halo CS Vamos Pool, saya butuh bantuan panduan di Player App.');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0b0f19] border border-cyan-500/30 rounded-[32px] w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        
        {/* ─── HEADER ─── */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white italic uppercase tracking-wider">PANDUAN & BANTUAN</h2>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Vamos Player Guide Center</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── CATEGORY TABS ─── */}
        <div className="px-5 pt-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
          <button
            onClick={() => setActiveCategory('fight')}
            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase italic tracking-widest whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeCategory === 'fight'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" /> Fight & Rival
          </button>

          <button
            onClick={() => setActiveCategory('booking')}
            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase italic tracking-widest whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeCategory === 'booking'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> Booking Meja
          </button>

          <button
            onClick={() => setActiveCategory('tournament')}
            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase italic tracking-widest whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeCategory === 'tournament'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Turnamen
          </button>

          <button
            onClick={() => setActiveCategory('points')}
            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase italic tracking-widest whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeCategory === 'points'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Poin & Reward
          </button>
        </div>

        {/* ─── SCROLLABLE CONTENT ─── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION: FIGHT & SCAN RIVAL (FOCUS)                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          {(activeCategory === 'all' || activeCategory === 'fight') && (
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-cyan-500/15 via-cyan-500/5 to-transparent border border-cyan-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Swords className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-black text-white italic uppercase tracking-wider">
                    CARA DUEL & SCAN RIVAL (6 LANGKAH MUDAH)
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  Fitur <b>Fight / Duel</b> memungkinkan Anda menantang sesama member di venue secara realtime dengan taruhan Poin Loyalty atau sekadar Fun Match!
                </p>

                {/* Step-by-Step Flow */}
                <div className="space-y-2.5">
                  <div className="flex gap-3 items-start bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">1</span>
                    <div>
                      <p className="text-xs font-bold text-white">Buka Identity QR</p>
                      <p className="text-[11px] text-slate-400">Pemain 1 membuka tombol <b className="text-cyan-400">"Identity QR"</b> di tab Fight untuk memunculkan barcode ID pribadinya.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">2</span>
                    <div>
                      <p className="text-xs font-bold text-white">Scan Rival</p>
                      <p className="text-[11px] text-slate-400">Pemain 2 mengetuk tombol <b className="text-cyan-400">"Scan Rival"</b> dan mengarahkan kamera ke barcode Pemain 1.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">3</span>
                    <div>
                      <p className="text-xs font-bold text-white">Tentukan Taruhan Poin (Stake)</p>
                      <p className="text-[11px] text-slate-400">Pilih jumlah taruhan poin (misal: 0 PTS untuk Fun Match, 50, 100, atau 250 PTS). Poin akan otomatis dikunci dari dompet akun masing-masing.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">4</span>
                    <div>
                      <p className="text-xs font-bold text-white">Terima Duel</p>
                      <p className="text-[11px] text-slate-400">Lawan akan melihat kartu tantangan muncul di layarnya secara realtime dan menekan <b className="text-emerald-400">"TERIMA (LAWANKAN)"</b>.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">5</span>
                    <div>
                      <p className="text-xs font-bold text-white">Main di Meja & Laporkan Skor</p>
                      <p className="text-[11px] text-slate-400">Setelah game selesai di meja biliar, pemenang memasukkan skor frame (contoh: 3 - 1) lalu klik <b className="text-cyan-400">"LAPORKAN KEMENANGAN"</b>.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">6</span>
                    <div>
                      <p className="text-xs font-bold text-white">Verifikasi & Poin Otomatis Masuk</p>
                      <p className="text-[11px] text-slate-400">Lawan menekan tombol konfirmasi skor, dan seluruh poin taruhan + EXP naik level langsung masuk ke akun pemenang secara instan!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* King of the Table FAQ */}
              <div className="bg-[#141927] border border-white/5 rounded-2xl p-4">
                <button
                  onClick={() => toggleFaq('fight-king')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" /> Apa itu Fitur King of the Table?
                  </span>
                  {expandedFaq['fight-king'] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {expandedFaq['fight-king'] && (
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed pl-6">
                    Pemain yang memegang status <b>Raja Meja (King)</b> di meja aktif bisa ditantang oleh pemain lain. Jika penantang menang, status King meja akan berpindah ke penantang dengan bonus Poin Ganda!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION: BOOKING MEJA                                   */}
          {/* ═══════════════════════════════════════════════════════ */}
          {(activeCategory === 'all' || activeCategory === 'booking') && (
            <div className="space-y-3">
              <div className="bg-[#141927] border border-white/5 rounded-2xl p-4">
                <h3 className="text-xs font-black text-white italic uppercase tracking-wider mb-2 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-cyan-400" /> Cara Booking Meja & Check-In
                </h3>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal pl-4">
                  <li>Buka Tab <b>Booking</b> di aplikasi.</li>
                  <li>Pilih Meja yang diinginkan (Meja Reguler / VIP).</li>
                  <li>Tentukan tanggal main, jam mulai, dan durasi main (misal 1 jam, 2 jam, atau Paket Hemat).</li>
                  <li>Konfirmasi booking. Saat tiba di kasir, cukup sebutkan nama / tunjukkan nomor booking di aplikasi untuk menyalakan lampu meja.</li>
                </ol>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION: TOURNAMENT                                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          {(activeCategory === 'all' || activeCategory === 'tournament') && (
            <div className="space-y-3">
              <div className="bg-[#141927] border border-white/5 rounded-2xl p-4">
                <h3 className="text-xs font-black text-white italic uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" /> Pendaftaran & Bagan Turnamen
                </h3>
                <div className="text-xs text-slate-300 space-y-2">
                  <p>• <b>Pendaftaran</b>: Pilih turnamen di Dashboard/Tab Turnamen, lalu tekan <b>DAFTAR SEKARANG</b>. Anda bisa mendaftar 1 atau 2 nama (misal untuk diri sendiri dan teman).</p>
                  <p>• <b>Bagan Pertandingan</b>: Setelah pendaftaran penuh/ditutup panitia, bagan (bracket) Single/Double Elimination akan otomatis muncul. Anda bisa melihat lawan di round berikutnya dan update skor realtime.</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION: POINTS & REDEEM STORE                          */}
          {/* ═══════════════════════════════════════════════════════ */}
          {(activeCategory === 'all' || activeCategory === 'points') && (
            <div className="space-y-3">
              <div className="bg-[#141927] border border-white/5 rounded-2xl p-4">
                <h3 className="text-xs font-black text-white italic uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Poin Loyalty & Redeem Store
                </h3>
                <div className="text-xs text-slate-300 space-y-2">
                  <p>• <b>Mendapatkan Poin & XP</b>: Poin diperoleh setiap kali sewa meja biliar, memenangkan duel Fight, atau berpartisipasi di turnamen resmi.</p>
                  <p>• <b>Redeem Store</b>: Masuk ke Tab <b>Redeem / Rewards</b> untuk menukar poin dengan gratis sewa meja, diskon makanan, atau merchandise eksklusif.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ─── FOOTER: WHATSAPP CUSTOMER SERVICE BUTTON ─── */}
        <div className="p-4 border-t border-white/10 bg-[#090c14] flex flex-col gap-2">
          <button
            onClick={handleWhatsAppHelp}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase italic tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
          >
            <MessageCircle className="w-4 h-4" /> Butuh Bantuan? Chat CS WhatsApp
          </button>
          <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400 inline" /> Official Vamos Pool Support & Community
          </p>
        </div>

      </div>
    </div>
  );
}
