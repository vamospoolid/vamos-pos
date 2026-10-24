import { useState, useEffect } from 'react';
import { api } from './api';
import { useAppStore } from './store/appStore';
import { Clock, Calendar, ShieldCheck, ChevronRight, Crown, Flame } from 'lucide-react';

export function LiveTableScreen({ member: _member }: { member?: any } = {}) {
  const { setActiveTab } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<any[]>([]);
  const [kings, setKings] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const [availRes, kingRes] = await Promise.all([
          api.get(`/player/availability?date=${todayStr}`),
          api.get('/player/kings')
        ]);

        if (availRes.data?.success) {
          // Hanya ambil slot yang masih memiliki meja kosong
          const availableSlots = (availRes.data.data?.slots || []).filter((s: any) => s.isAvailable);
          setSlots(availableSlots);
        }

        if (kingRes.data?.success) {
          setKings(kingRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch arena live data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Polling setiap 30 detik
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fade-in space-y-8 pb-40">
      {/* Header */}
      <div className="pt-6 relative">
        <div className="absolute top-0 left-0 w-32 h-16 bg-primary/10 blur-[40px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">
              Privasi Tamu Terlindungi
            </span>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
            ARENA <span className="text-primary">LIVE PULSE</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em] mt-1 italic">
            Ketersediaan Waktu Bermain & Jadwal Arena Real-time
          </p>
        </div>
      </div>

      {/* Surveillance Summary Banner */}
      <div className="fiery-card p-6 bg-primary/5 border border-primary/20 rounded-[28px] relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Clock className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] italic">Status Arena Hari Ini</p>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">
                {slots.length > 0 ? `${slots.length} Slot Waktu Tersedia` : 'Arena Sedang Padat'}
              </h3>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('booking')}
            className="px-4 py-2.5 rounded-xl bg-primary text-secondary font-black text-xs uppercase tracking-wider italic flex items-center gap-1.5 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <span>Reservasi</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Kings of the Arena Section */}
      {kings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              <h3 className="text-sm font-black text-white uppercase italic tracking-wider">King of the Arena</h3>
            </div>
            <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest italic">Tantang di Arena</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {kings.map((king: any) => (
              <div 
                key={king.id || king.tableId} 
                onClick={() => setActiveTab('play')}
                className="fiery-card p-5 rounded-[24px] bg-yellow-500/5 border border-yellow-500/20 flex items-center justify-between cursor-pointer hover:border-yellow-500/40 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-yellow-500/40 overflow-hidden relative flex items-center justify-center">
                    {king.king?.photo ? (
                      <img src={king.king.photo} alt={king.king.name} className="w-full h-full object-cover" />
                    ) : (
                      <Crown className="w-6 h-6 text-yellow-500" />
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-red-600 text-[8px] font-black px-1.5 py-0.5 rounded-full text-white">
                      {king.streak || 1}X
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                      <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest italic">Juara Bertahan</span>
                    </div>
                    <h4 className="text-sm font-black text-white uppercase italic">{king.king?.name || 'Raja Arena'}</h4>
                    <p className="text-[9px] font-bold text-slate-400 italic">Streak: {king.streak || 1} Kemenangan Beruntun</p>
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-black uppercase tracking-wider italic flex items-center gap-1">
                  <span>Tantang</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Time Slots Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black text-white uppercase italic tracking-wider">Slot Jam Kosong Hari Ini</h3>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Pilih jam untuk main</span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Memeriksa ketersediaan arena...</p>
          </div>
        ) : slots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {slots.slice(0, 12).map((slot: any, idx: number) => {
              const regFree = slot.availableRegular || 0;
              const vipFree = slot.availableVip || 0;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab('booking')}
                  className="fiery-card p-4 rounded-[22px] bg-[#101423] border border-white/5 hover:border-primary/40 text-left transition-all active:scale-95 group relative overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-black text-white italic font-mono group-hover:text-primary transition-colors">
                      {slot.time}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    {regFree > 0 && (
                      <p className="text-[9px] font-bold text-slate-400 italic">
                        Regular: <span className="text-emerald-400 font-black">{regFree} Slot</span>
                      </p>
                    )}
                    {vipFree > 0 && (
                      <p className="text-[9px] font-bold text-slate-400 italic">
                        VIP: <span className="text-yellow-400 font-black">{vipFree} Slot</span>
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="fiery-card p-8 rounded-[24px] text-center border border-white/5 bg-[#101423]">
            <p className="text-xs font-bold text-slate-400 mb-2">Slot waktu hari ini sedang terisi penuh.</p>
            <button
              onClick={() => setActiveTab('booking')}
              className="text-[10px] font-black text-primary uppercase tracking-widest underline hover:text-cyan-300"
            >
              Lihat Jadwal Hari Esok →
            </button>
          </div>
        )}
      </div>

      {/* CTA Box */}
      <div className="fiery-card p-6 rounded-[28px] bg-gradient-to-r from-primary/10 via-[#101423] to-[#101423] border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-black text-white uppercase italic tracking-wider">Ingin Main Jam Pasti?</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Lakukan reservasi lebih awal untuk mengamankan slot waktu favorit Anda.</p>
        </div>
        <button
          onClick={() => setActiveTab('booking')}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-primary text-secondary font-black text-xs uppercase tracking-wider italic flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span>Pesan Slot Waktu</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
