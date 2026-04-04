import { useState, useEffect } from 'react';
import { User, ChevronRight, Loader2, ArrowLeft, CheckCircle2, ShieldCheck, X, RefreshCw, LayoutGrid, Medal, Flame, Target, Gift, Trophy, Swords, Calendar, Camera, Zap, Star, Users, Crown, Plus, ArrowRight, TrendingUp } from 'lucide-react';
import { api } from './api';
import { RewardsScreen } from './RewardsScreen';
import { BookingScreen } from './BookingScreen';
import { ActiveSessionScreen } from './ActiveSessionScreen';
import { MenuScreen } from './MenuScreen';
import { VictoryNotification } from './components/VictoryNotification';
import { LeaderboardScreen } from './LeaderboardScreen';
import { PlayScreen } from './PlayScreen';
import { HistoryScreen } from './HistoryScreen';
import { LiveTableScreen } from './LiveTableScreen';

// ═══════════════════════════════════════════════
// FALLBACK MOCK DATA (if DB is empty)
// ═══════════════════════════════════════════════


const MOCK_TOURNAMENT = {
  id: 'T001',
  name: 'Grand Billiard Cup 2026',
  status: 'ONGOING',
  startDate: '2026-02-15',
  endDate: '2026-03-01',
  prizePool: 10000000,
  format: '8-Ball Single Elimination',
  venue: 'Vamos Billiard Club',
  description: 'Turnamen billiard tahunan terbesar di Vamos!',
};

const MOCK_MATCHES = [
  { id: 'M001', round: 'Quarter Final', player1: 'Fajar Nugroho', player2: 'Hendra Setiawan', winner: 'Fajar Nugroho', score: '4-2', date: '2026-02-24' },
];

// ═══════════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════════

import { useAppStore } from './store/appStore';
import { VamosLogo } from './components/VamosLogo';

function LoginScreen({ onLogin }: { onLogin: (member: any) => void }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const deviceId = localStorage.getItem('playerDeviceId');
      const endpoint = isRegister ? '/player/register' : '/player/login';
      const payload = isRegister ? { phone, name, password, deviceId } : { phone, password, deviceId };
      const res = await api.post(endpoint, payload);

      if (res.data.success) {
        localStorage.setItem('playerToken', res.data.data.token);
        onLogin(res.data.data.member);
      } else {
        alert(res.data.message || 'Gagal login.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-secondary relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[250px] h-[250px] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="glass-card p-10 rounded-[2.5rem] w-full max-w-sm relative z-10 fade-in border border-white/5 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
            <VamosLogo className="w-12 h-12" color="white" glowing />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase italic">VAMOS<span className="text-accent underline decoration-primary decoration-4 underline-offset-4 ml-1">POOL</span></h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-3">{isRegister ? 'Join the champion league' : 'Welcome back, legend'}</p>
        </div>

        <div className="flex bg-surface-highlight/40 p-1.5 rounded-2xl mb-8 border border-white/5">
          <button
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isRegister ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isRegister ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div className="fade-in">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="NEXUS"
                className="w-full bg-surface-highlight/30 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary text-white font-medium placeholder:text-slate-600 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">WhatsApp Access</label>
            <div className="flex gap-2">
              <div className="bg-surface-highlight/30 border border-white/10 rounded-xl px-4 py-4 text-slate-400 font-bold text-xs flex items-center">+62</div>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="812 3456 7890"
                className="flex-1 w-full bg-surface-highlight/30 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary text-white font-medium placeholder:text-slate-600 transition-colors"
              />
            </div>
          </div>

          <div className="fade-in mt-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Security PIN / Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-highlight/30 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary text-white font-medium placeholder:text-slate-600 transition-colors"
            />
            {!isRegister && (
               <p className="text-[9px] text-slate-500 mt-2 px-2 italic font-bold">Jika ini Login pertama, ketik Sandi Baru yang akan langsung menjadi Sandi permanen Akun Anda.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 flex items-center justify-center active:scale-95 transition-all mt-6 text-sm uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegister ? 'Create Profile' : 'Enter Arena')}
          </button>
        </form>

        <p className="text-center text-[9px] text-slate-600 font-bold uppercase mt-8 tracking-widest">
          {isRegister ? 'By joining you agree to our pool rules' : 'Trouble accessing? Contact HQ.'}
        </p>
      </div>
    </div>
  );
}


function DashboardScreen({ member }: { member: any }) {
  const activeSession = member.sessions?.find((s: any) => s.status === 'ACTIVE');
  const [showMasteryInfo, setShowMasteryInfo] = useState(false);
  const [showRankHistory, setShowRankHistory] = useState(false);
  const [rankHistory, setRankHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (showRankHistory) {
      setLoadingHistory(true);
      api.get(`/player/${member.id}/rank-history`).then(res => {
          setRankHistory(res.data.data);
      }).catch(() => {}).finally(() => setLoadingHistory(false));
    }
  }, [showRankHistory]);

  return (
    <div className="fade-in space-y-8 pb-32">
      {/* ─── RANK HISTORY MODAL ────────────────────────────────────────────── */}
      {showRankHistory && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0a0f1d]/95 backdrop-blur-xl" onClick={() => setShowRankHistory(false)} />
          <div className="relative w-full max-w-sm fiery-card p-10 text-left scale-in border-2 border-primary/20 overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-8 shrink-0">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Riwayat Progres</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Evolusi Keahlian Anda</p>
              </div>
              <button onClick={() => setShowRankHistory(false)} className="text-slate-500 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar no-scrollbar">
              {loadingHistory ? (
                  <div className="py-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Synchronizing Protocols...</p>
                  </div>
              ) : rankHistory.length > 0 ? rankHistory.map((log: any, i: number) => (
                  <div key={log.id} className="relative pl-8 pb-2">
                      {/* Timeline Line */}
                      {i < rankHistory.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-[1px] bg-white/5" />}
                      {/* Dot */}
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#101423] border border-white/10 flex items-center justify-center">
                          <div className={`w-2 h-2 rounded-full ${log.reason === 'MATCH_RESULT' ? 'bg-primary shadow-[0_0_10px_rgba(31,34,255,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                      </div>
                      
                      <div className="flex justify-between items-start gap-4">
                          <div>
                              <p className="text-xs font-black text-white uppercase italic">{log.reason === 'MATCH_RESULT' ? 'HASIL TANDING' : 'VERIFIKASI ADMIN'}</p>
                              <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest leading-none font-mono">
                                  {new Date(log.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                          </div>
                          {(log.newRating - (log.oldRating || 150)) !== 0 && (
                             <div className={`px-2 py-0.5 rounded text-[10px] font-black italic ${log.newRating > (log.oldRating || 150) ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {log.newRating > (log.oldRating || 150) ? '▲' : '▼'} {Math.abs(log.newRating - (log.oldRating || 150))}
                             </div>
                          )}
                      </div>

                      <div className="mt-4 bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                          <div>
                             <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1 italic">Handicap</p>
                             <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-xs font-black italic">{log.oldHandicap || '-'}</span>
                                <ArrowRight className="w-3 h-3 text-slate-800" />
                                <span className="text-white text-xs font-black italic">HC {log.newHandicap}</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1 italic">Elo Rating</p>
                             <div className="flex items-center justify-end gap-2">
                                <span className="text-slate-500 text-sm font-black italic">{log.oldRating || '-'}</span>
                                <ArrowRight className="w-3 h-3 text-slate-800" />
                                <span className="text-primary text-sm font-black italic">{log.newRating}</span>
                             </div>
                          </div>
                      </div>
                  </div>
              )) : (
                  <div className="py-20 text-center opacity-40">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] italic leading-loose">Data riwayat belum mencukupi.<br/>Mainkan pertandingan untuk membangun profil!</p>
                  </div>
              )}
            </div>

            <button onClick={() => setShowRankHistory(false)} className="w-full mt-6 py-5 fiery-btn-primary text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shrink-0">
               Tutup Perjalanan
            </button>
          </div>
        </div>
      )}
      {/* ─── MASTERY INTEL MODAL ────────────────────────────────────────────── */}
      {showMasteryInfo && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0a0f1d]/95 backdrop-blur-xl" onClick={() => setShowMasteryInfo(false)} />
          <div className="relative w-full max-w-sm fiery-card p-10 text-left scale-in border-2 border-primary/20">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Protokol Keahlian</h3>
              <button onClick={() => setShowMasteryInfo(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase italic">Hall of Fame</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight leading-relaxed">Pemain papan atas mendominasi papan peringkat global dan mendapatkan pengakuan sosial maksimal.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase italic">Akses Elit</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight leading-relaxed">Turnamen tingkat pro dan acara VIP seringkali mensyaratkan Tingkat Keahlian minimum untuk dapat diikuti.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
                  <Target className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase italic">Handicap Pro</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight leading-relaxed">Peringkat Anda membantu menetapkan standar Handicap resmi demi memastikan pertandingan yang adil dan seimbang.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Gift className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase italic">Keistimewaan Member</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight leading-relaxed">Capai Peringkat 10+ guna membuka diskon eksklusif untuk biaya pendaftaran turnamen profesional.</p>
                </div>
              </div>
            </div>

            <button onClick={() => setShowMasteryInfo(false)} className="w-full mt-10 py-4 fiery-btn-primary text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Mengerti
            </button>
          </div>
        </div>
      )}

      {/* ─── IDENTITY BLOCK ─────────────────────────────────────────────────── */}
      <div className="fiery-card p-8 mt-4 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-primary/10 rounded-full blur-[40px]" />

        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-[32px] bg-secondary border-2 border-primary/20 p-1 flex items-center justify-center overflow-hidden shadow-2xl">
              {member.photo ? (
                <img src={member.photo} alt="P" className="w-full h-full rounded-[28px] object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-700" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#101423] shadow-lg">
              <Crown className="w-4 h-4 text-white" fill="currentColor" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter truncate leading-tight">
              {member.name?.split(' ')[0] || 'Member'}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="px-3 py-1 bg-[#252b45] rounded-full border border-white/5 flex items-center gap-1.5">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{member.tier || 'Pool'}</span>
              </div>
              <div className="px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/10 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-yellow-500" fill="currentColor" />
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">HC {member.handicap || '4'}</span>
              </div>
              <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-1.5 shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]">
                <Trophy className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{member.skillRating || 200} <span className="opacity-50 text-[8px]">PRO</span></span>
                <div className="px-1 bg-primary text-[6px] font-bold rounded-sm text-white">BETA</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-2.5 px-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Progres Keahlian Tingkat {member.level || 1}</p>
              <button
                onClick={() => setShowMasteryInfo(true)}
                className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 transition-colors"
                title="Info Protokol"
              >
                <div className="text-[8px] font-black text-primary">i</div>
              </button>
            </div>
            <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{member.experience || 0} / {(member.level || 1) * 1000} Reputasi</p>
          </div>
          <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 fiery-glow"
              style={{ width: `${Math.min(((member.experience || 0) / ((member.level || 1) * 1000)) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── QUICK ACTIONS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => useAppStore.getState().setActiveTab('booking')}
          className="fiery-card p-6 flex flex-col gap-4 hover:scale-[1.02] transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#a855f7]/10 flex items-center justify-center border border-[#a855f7]/20">
            <Calendar className="w-6 h-6 text-[#a855f7]" />
          </div>
          <div className="text-left">
            <p className="text-lg font-black text-white uppercase italic truncate">Pesan Meja</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Reservasi Arena</p>
          </div>
        </button>

        <button
          onClick={() => useAppStore.getState().setActiveTab('leaderboard')}
          className="fiery-card p-6 flex flex-col gap-4 hover:scale-[1.02] transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#00d084]/10 flex items-center justify-center border border-[#00d084]/20">
            <Trophy className="w-6 h-6 text-[#00d084]" />
          </div>
          <div className="text-left">
            <p className="text-lg font-black text-white uppercase italic truncate">Peringkat</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Klasemen Global</p>
          </div>
        </button>
      </div>

      {/* ─── LIVE STATUS BANNER ────────────────────────────────────────────── */}
      {(activeSession || (member.sessions?.some((s: any) => s.status === 'PENDING' && !s.tableId))) && (
        <button
          onClick={() => useAppStore.getState().setActiveTab('active-session')}
          className="scale-in fiery-card-highlight p-6 flex items-center justify-between fiery-glow border border-primary/20"
        >
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <Flame className="w-6 h-6 text-primary animate-pulse" fill="currentColor" />
              </div>
              <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-[#101423] animate-ping" />
            </div>
            <div className="text-left">
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic">
                {activeSession ? 'SESI AKTIF' : 'STATUS PESANAN'}
              </p>
              <h4 className="text-lg font-black text-white uppercase italic truncate leading-tight">
                {activeSession?.table?.name || 'Protokol Voucher'}
              </h4>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary hover:text-secondary group transition-all">
            <ChevronRight className="w-5 h-5 text-white group-hover:text-secondary" />
          </div>
        </button>
      )}

      {/* ─── LOYALTY CARD ──────────────────────────────────────────────────── */}
      <div className="fiery-card p-8 relative overflow-hidden">
        <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-accent/5 rounded-full blur-[50px] pointer-events-none" />

        <div className="flex justify-between items-start mb-6 px-1">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 italic">Tabungan Poin</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-5xl font-black text-white tracking-tighter italic">
                {(member.loyaltyPoints ?? 0).toLocaleString('id-ID')}
              </h2>
              <span className="text-primary font-black text-lg italic uppercase">PTS</span>
            </div>
          </div>
          <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
              Dapat: {member.tier === 'GOLD' ? '10%' : member.tier === 'SILVER' ? '7%' : '5%'}
            </span>
          </div>
        </div>

        {member.nextTier && (
          <div className="mb-6 px-1">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Progres ke {member.nextTier}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{member.progress}%</p>
            </div>
            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${member.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => useAppStore.getState().setActiveTab('rewards')}
            className="fiery-btn-primary py-4 text-[10px] font-black flex items-center justify-center gap-2"
          >
            Tukar Poin <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => useAppStore.getState().setActiveTab('ledger')}
            className="fiery-btn-secondary py-4 text-[10px] font-black uppercase tracking-widest border border-white/5 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" /> Riwayat
          </button>
        </div>
      </div>

      <button 
        onClick={() => setShowRankHistory(true)}
        className="w-full fiery-card p-8 bg-amber-500/5 border-2 border-amber-500/10 rounded-[40px] flex items-center justify-between group active:scale-95 transition-all"
      >
         <div className="text-left">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2 italic">Official Handicap</p>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter truncate max-w-[200px]">
                {member.handicapLabel || 'ELITE FRAGGER'}
            </h3>
         </div>
         <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-secondary transition-all">
            <TrendingUp className="w-7 h-7 text-amber-500 group-hover:text-secondary" />
         </div>
      </button>

    </div>
  );
}




function TournamentScreen({ member, activeTournaments, leaderboard }: { member: any, activeTournaments: any[], leaderboard: {allTime: any[], monthly: any[], activeKings: any[], hallOfFame: any[]} }) {
  const [activeView, setActiveView] = useState<'overview' | 'leaderboard' | 'bracket'>('overview');
  const [lbSubView, setLbSubView] = useState<'legends' | 'kings' | 'hall'>('legends');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTournamentIndex, setSelectedTournamentIndex] = useState(0);
  const [loadingReg, setLoadingReg] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

  const tournament = activeTournaments[selectedTournamentIndex] || MOCK_TOURNAMENT;
  const matches = tournament?.matches || MOCK_MATCHES;

  const handleRegister = async () => {
    if (!tournament.id || tournament.id === 'T001') return;
    setLoadingReg(true);
    try {
      const res = await api.post(`/player/tournaments/${tournament.id}/register`, {
        memberId: member.id,
        handicap: member.handicap || '0',
        paymentNotes: paymentRef,
        paymentStatus: tournament.entryFee > 0 ? 'PENDING' : 'PAID'
      });
      if (res.data.success) {
        setIsRegModalOpen(false);
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Authorization failed.');
    } finally {
      setLoadingReg(false);
    }
  };

  const getPlayerName = (participantId: string) => {
    if (!participantId) return 'TBD';
    const p = tournament?.participants?.find((p: any) => p.id === participantId);
    if (p) return p.member?.name || p.name || 'Unknown';
    return 'TBD';
  };

  const myParticipantId = tournament?.participants?.find((p: any) => p.memberId === member?.id)?.id;

  const getLbData = () => {
    if (lbSubView === 'legends') return leaderboard.allTime;
    if (lbSubView === 'kings') return leaderboard.activeKings;
    if (lbSubView === 'hall') return leaderboard.hallOfFame;
    return [];
  };

  const filteredLeaderboard = getLbData().filter((p: any) =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fade-in space-y-10 pb-32">
      <div className="pt-2 flex justify-between items-end relative">
        <div className="absolute top-0 left-0 w-32 h-16 bg-primary/10 blur-[40px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
            POOL <span className="text-primary">EVENTS</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic opacity-60">Official Arena Bracket & Logistics</p>
        </div>
        {activeTournaments.length > 1 && (
          <div className="flex gap-2 relative z-10">
            {activeTournaments.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedTournamentIndex(i)}
                className={`w-12 h-12 rounded-2xl text-[10px] font-black transition-all border-2 italic ${selectedTournamentIndex === i ? 'bg-primary text-secondary border-primary shadow-[0_0_20px_rgba(31,34,255,0.3)]' : 'bg-[#1a1f35]/50 text-slate-500 border-white/5 hover:border-white/10'}`}
              >
                E{i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hero Tournament Card */}
      <div className="fiery-card rounded-[48px] p-10 relative overflow-hidden border-2 border-white/5 bg-[#1a1f35]/40 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-x-8 -translate-y-8 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute bottom-0 left-0 p-8 opacity-5">
          <Trophy className="w-40 h-40 text-primary" />
        </div>

        <div className="flex items-center gap-4 mb-10 relative z-10">
          <div className="w-1.5 h-10 bg-primary rounded-full" />
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-1">Status: Open Protocol</p>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{tournament.name}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-12 relative z-10">
          <div className="bg-[#101423] rounded-[32px] p-6 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest italic pt-0.5">Grand Yield</p>
            </div>
            <p className="text-white font-black text-2xl italic tracking-tighter leading-none">
              <span className="text-primary text-sm mr-1">RP</span>{(tournament.prizePool || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-[#101423] rounded-[32px] p-6 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-3.5 h-3.5 text-primary" />
              <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest italic pt-0.5">Entry Access</p>
            </div>
            <p className="text-white font-black text-2xl italic tracking-tighter leading-none">
              {tournament.entryFee > 0 ? <><span className="text-primary text-sm mr-1">RP</span>{tournament.entryFee.toLocaleString()}</> : 'OPEN'}
            </p>
          </div>
        </div>

        {!myParticipantId && tournament.id !== 'T001' && (
          <button
            onClick={() => setIsRegModalOpen(true)}
            className="w-full fiery-btn-primary py-6 flex items-center justify-center gap-4 text-xs tracking-[0.3em] font-black uppercase italic relative z-10 active:scale-[0.98]"
          >
            <span>Secure Entry Ticket</span>
            <ArrowRight className="w-5 h-5" strokeWidth={3} />
          </button>
        )}

        {myParticipantId && (
          <div className="w-full bg-emerald-500/10 border border-emerald-500/20 py-4 rounded-[24px] flex items-center justify-center gap-3 relative z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Provisioned • Entry Verified</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-[#1a1f35]/50 p-2 rounded-[32px] sticky top-2 z-50 border border-white/5 backdrop-blur-xl mx-2 shadow-2xl">
        {[
          { id: 'overview', label: 'TACTICAL BRACKET' },
          { id: 'leaderboard', label: 'HALL RANKINGS' },
          { id: 'bracket', label: 'MISSION INTEL' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`flex-1 py-4 text-[9px] font-black uppercase tracking-[0.2em] rounded-[24px] transition-all duration-300 italic ${activeView === tab.id ? 'bg-primary text-[#101423] shadow-[0_0_20px_rgba(31,34,255,0.3)] font-black' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <div className="mt-8 px-1">
        {activeView === 'overview' && (
          <div className="space-y-6">
            {matches.length > 0 ? matches.map((match: any) => {
              const isMyMatch = myParticipantId && (match.player1Id === myParticipantId || match.player2Id === myParticipantId);
              const p1Name = getPlayerName(match.player1Id);
              const p2Name = getPlayerName(match.player2Id);

              return (
                <div key={match.id} className={`fiery-card p-10 relative overflow-hidden transition-all duration-500 group border-2 ${isMyMatch ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-[#1a1f35]/30'}`}>
                  {isMyMatch && <div className="absolute top-0 left-0 w-full h-[2px] bg-primary fiery-glow z-10" />}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${match.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-primary'}`} />
                      <span className={`text-[9px] font-black uppercase tracking-[0.3em] pt-0.5 italic ${match.status === 'COMPLETED' ? 'text-emerald-500' : 'text-primary'}`}>
                        {match.status === 'COMPLETED' ? 'OPERATION FINALIZED' : 'PROTOCOL PENDING'}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">PHASE {match.round}</span>
                  </div>
                  <div className="flex items-center gap-6 relative">
                    <div className="flex-1 text-right">
                      <p className={`text-xl font-black truncate uppercase italic tracking-tighter ${match.winnerId === match.player1Id ? 'text-primary' : 'text-white'}`}>{p1Name.split(' ')[0] || 'TBD'}</p>
                      <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest mt-1">OPERATIVE A</p>
                    </div>
                    <div className="bg-[#101423] py-4 px-6 rounded-[24px] min-w-[100px] text-center font-black text-xl italic tracking-tighter border-2 border-white/5 relative group-hover:border-primary/40 transition-colors shadow-inner">
                      {match.status === 'COMPLETED' ? (
                        <span className="flex items-center justify-center gap-3">
                          <span className={match.winnerId === match.player1Id ? 'text-primary' : 'text-white'}>{match.score1}</span>
                          <span className="text-slate-800">:</span>
                          <span className={match.winnerId === match.player2Id ? 'text-primary' : 'text-white'}>{match.score2}</span>
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Swords className="w-6 h-6 text-slate-800" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-xl font-black truncate uppercase italic tracking-tighter ${match.winnerId === match.player2Id ? 'text-primary' : 'text-white'}`}>{p2Name.split(' ')[0] || 'TBD'}</p>
                      <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest mt-1">OPERATIVE B</p>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="fiery-card p-24 text-center border-2 border-white/5 bg-[#1a1f35]/20">
                <div className="w-16 h-16 rounded-[24px] bg-[#1a1f35] flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
                </div>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] italic">Deploying combat log...</p>
              </div>
            )}
          </div>
        )}

        {activeView === 'leaderboard' && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-6">
              {[
                { id: 'legends', label: 'LEGENDS' },
                { id: 'kings', label: 'ACTIVE KINGS' },
                { id: 'hall', label: 'HALL OF FAME' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setLbSubView(sub.id as any)}
                  className={`flex-1 py-3 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all border ${lbSubView === sub.id ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(31,34,255,0.2)]' : 'bg-white/5 border-white/5 text-slate-500'}`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
            
            <div className="bg-[#1a1f35]/50 flex items-center px-6 py-4 rounded-2xl mb-6 border border-white/5">
              <input
                className="bg-transparent border-none focus:outline-none text-sm w-full font-bold placeholder:text-slate-600 text-white uppercase italic"
                placeholder={`Search ${lbSubView === 'hall' ? 'Hall of Famers' : 'Players'}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            {filteredLeaderboard.length > 0 ? filteredLeaderboard.map((p: any, i: number) => (
              <div key={p.id} className="fiery-card p-6 rounded-3xl flex items-center justify-between border border-white/5 hover:border-primary/20 transition-all bg-[#1a1f35]/30 group">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 transition-all ${i < 3 ? 'border-primary bg-primary/20 text-white shadow-lg shadow-primary/20' : 'border-slate-800 bg-slate-900 text-slate-500'}`}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <p className="font-black text-white text-base uppercase italic tracking-tighter">{p.name}</p>
                       {lbSubView === 'hall' && i === 0 && <Crown className="w-4 h-4 text-primary animate-bounce" />}
                    </div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{p.tier || 'ELITE OPERATIVE'}</p>
                  </div>
                </div>
                <div className="text-right">
                  {lbSubView === 'legends' && (
                    <>
                      <p className="text-xl font-black text-white italic tracking-tighter leading-none">{p.totalWins || 0}W</p>
                      <p className="text-[8px] text-primary font-black tracking-[0.2em] uppercase mt-1">VICTORIES</p>
                    </>
                  )}
                  {lbSubView === 'kings' && (
                    <>
                      <p className="text-xl font-black text-amber-400 italic tracking-tighter leading-none">{p.streakCount || 0} 🔥</p>
                      <p className="text-[8px] text-amber-500/60 font-black tracking-[0.2em] uppercase mt-1">CURRENT STREAK</p>
                    </>
                  )}
                  {lbSubView === 'hall' && (
                    <>
                      <p className="text-xl font-black text-primary italic tracking-tighter leading-none">{p.highestKingStreak || 0} 🏆</p>
                      <p className="text-[8px] text-primary/60 font-black tracking-[0.2em] uppercase mt-1">PEAK STREAK</p>
                    </>
                  )}
                </div>
              </div>
            )) : (
              <div className="py-20 text-center opacity-40">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">No operatives detected in this sector</p>
              </div>
            )}
          </div>
        )}

        {activeView === 'bracket' && (
          <div className="fiery-card p-20 text-center rounded-[2.5rem] border border-white/5 bg-[#1a1f35]/20">
            <Swords className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">Visual brackets display on main club panels.<br />Consult tournament director for details.</p>
          </div>
        )}
      </div>

      {isRegModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-[#0a0d18]/95 backdrop-blur-2xl" onClick={() => setIsRegModalOpen(false)} />
          <div className="relative w-full max-w-sm fiery-card rounded-[48px] p-12 border-2 border-primary/20 fade-in overflow-hidden shadow-[0_0_100px_rgba(31,34,255,0.2)]">
            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">SECURE ENTRY</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10 italic opacity-60">Authorize Mission Participation</p>

            <div className="space-y-8">
              <div className="bg-[#101423] p-6 rounded-[32px] border border-white/5">
                <p className="text-[9px] text-slate-600 font-extrabold uppercase tracking-widest italic mb-3">Participation Cost</p>
                <p className="text-2xl font-black text-white italic tracking-tighter leading-none">
                  <span className="text-primary text-sm mr-1">RP</span>{tournament.entryFee.toLocaleString()}
                </p>
              </div>

              {tournament.entryFee > 0 && (
                <input
                  type="text"
                  placeholder="PAYMENT REF CODE"
                  className="w-full bg-[#101423] border-2 border-white/5 rounded-[24px] px-6 py-4 text-xs font-black text-white uppercase tracking-widest focus:outline-none focus:border-primary/40"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              )}

              <div className="flex gap-4">
                <button onClick={() => setIsRegModalOpen(false)} className="flex-1 py-5 rounded-[24px] bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest active:scale-95 italic">CANCEL</button>
                <button
                  onClick={handleRegister}
                  disabled={loadingReg || (tournament.entryFee > 0 && !paymentRef)}
                  className="flex-[2] fiery-btn-primary py-5 rounded-[24px] text-[10px] uppercase tracking-widest font-black italic disabled:opacity-50"
                >
                  {loadingReg ? 'AUTHORIZING...' : 'AUTHORIZE ENTRY'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function VerificationCard({ member }: { member: any }) {
  const [uploading, setUploading] = useState(false);
  const { refreshMemberData } = useAppStore();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await api.put(`/player/profile`, { memberId: member.id, photo: base64, identityStatus: 'PENDING' });
        refreshMemberData();
        alert("Foto Identitas / KTP berhasil diunggah. Menunggu verifikasi admin.");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Synchronization failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyWa = async () => {
    const code = prompt("ENTER AUTHORIZATION CODE (MOCK: 123456)");
    if (code === '123456') {
      await api.patch(`/members/${member.id}/verify/wa`);
      refreshMemberData();
      alert("Comms Protocol Verified.");
    } else if (code !== null) {
      alert("Authorization denied. Protocol compromised.");
    }
  };

  return (
    <div className="fiery-card p-8 border-2 border-white/5 bg-[#1a1f35]/40 rounded-[40px] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-1000">
        <ShieldCheck className="w-24 h-24 text-primary" />
      </div>
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic">Security Protocol</p>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">ID VERIFICATION</h3>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic border tracking-widest transition-all ${member.identityStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
          {member.identityStatus === 'VERIFIED' ? 'SECURED' : 'BREACHED'}
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between p-5 rounded-[28px] bg-[#101423] border border-white/5 hover:border-white/10 transition-colors shadow-inner">
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border ${member.isWaVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#1a1f35] text-slate-700 border-white/5'}`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase italic tracking-tighter mb-0.5">WhatsApp Protocol</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{member.isWaVerified ? 'COMMS SECURED' : 'ACTION REQUIRED'}</p>
            </div>
          </div>
          {!member.isWaVerified && (
            <button onClick={handleVerifyWa} className="px-5 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all active:scale-95 border border-primary/20 italic">Verify</button>
          )}
        </div>

        <div className="flex items-center justify-between p-5 rounded-[28px] bg-[#101423] border border-white/5 hover:border-white/10 transition-colors shadow-inner">
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border ${member.identityStatus === 'VERIFIED' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-[#1a1f35] text-slate-700 border-white/5'}`}>
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase italic tracking-tighter mb-0.5">Verifikasi Foto / KTP</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{member.identityStatus === 'VERIFIED' ? 'SIGNATURE SECURED' : member.identityStatus === 'PENDING' ? 'AWAITING AUTH' : 'UPLOAD REQUIRED'}</p>
            </div>
          </div>
          {member.identityStatus === 'UNVERIFIED' && (
            <label className="cursor-pointer px-5 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all active:scale-95 border border-primary/20 italic">
              {uploading ? 'SYNCING...' : 'UPLOAD'}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ member, onLogout }: { member: any, onLogout: () => void }) {
  const [view, setView] = useState<'main' | 'history' | 'h2h'>('main');
  const [history, setHistory] = useState<any[]>([]);
  const [h2h, setH2h] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const { refreshMemberData } = useAppStore();

  useEffect(() => {
    if (view === 'history') {
      api.get(`/player/${member.id}/history`).then(res => setHistory(res.data.data)).catch(() => { });
    }
    if (view === 'h2h') {
      api.get(`/player/${member.id}/h2h`).then(res => setH2h(res.data.data)).catch(() => { });
    }
  }, [view, member.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await api.post(`/player/${member.id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        refreshMemberData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengunggah foto.');
    } finally {
      setUploading(false);
    }
  };

  if (view === 'history') {
    return (
      <div className="fade-in space-y-10 pb-32 px-1">
        <div className="flex items-center gap-6 pt-4 mb-8">
          <button onClick={() => setView('main')} className="w-14 h-14 rounded-[20px] bg-[#1a1f35] flex items-center justify-center border-2 border-white/5 active:scale-90 transition-all text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">RIWAYAT <span className="text-primary italic">LAGA</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 italic opacity-60">Catatan Pertandingan Anda</p>
          </div>
        </div>

        <div className="space-y-6">
          {history.length > 0 ? history.map((match: any) => (
            <div key={match.id} className="fiery-card p-10 relative overflow-hidden group border-2 border-white/5 bg-[#1a1f35]/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col gap-8">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${match.winnerId === member.id ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-[0.3em] pt-0.5 italic ${match.winnerId === member.id ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {match.winnerId === member.id ? 'MENANG' : 'KALAH'}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest">
                    {new Date(match.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center gap-6 relative px-2">
                  <div className="flex-1 text-center">
                    <p className={`text-lg font-black truncate uppercase italic tracking-tighter ${match.player1Id === member.id ? 'text-primary' : 'text-white'}`}>{match.player1Name.split(' ')[0]}</p>
                    <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-[0.2em] mt-1 shrink-0">{match.player1Id === member.id ? 'ANDA' : 'LAWAN'}</p>
                  </div>
                  <div className="bg-[#101423] py-4 px-6 rounded-[24px] min-w-[90px] text-center font-black text-xl italic tracking-tighter border-2 border-white/5 shadow-inner">
                    {match.score1} : {match.score2}
                  </div>
                  <div className="flex-1 text-center">
                    <p className={`text-lg font-black truncate uppercase italic tracking-tighter ${match.player2Id === member.id ? 'text-primary' : 'text-white'}`}>{match.player2Name.split(' ')[0]}</p>
                    <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-[0.2em] mt-1 shrink-0">{match.player2Id === member.id ? 'ANDA' : 'LAWAN'}</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-0 right-0 p-3">
                <span className="text-[7px] font-black px-3 py-1 bg-primary/10 text-primary rounded-bl-xl border-l border-b border-primary/20 uppercase italic tracking-widest">
                  {match.tournamentName || 'ARENA'}
                </span>
              </div>
            </div>
          )) : (
            <div className="fiery-card rounded-[48px] p-24 text-center border-2 border-white/5 bg-[#1a1f35]/20">
              <Swords className="w-16 h-16 text-slate-800 mx-auto mb-6 border-2 border-slate-900 rounded-[28px] p-4 opacity-40 shadow-inner" />
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-relaxed">No tactical match records detected in the synchronization grid.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'h2h') {
    return (
      <div className="fade-in space-y-10 pb-32 px-1">
        <div className="flex items-center gap-6 pt-4 mb-8">
          <button onClick={() => setView('main')} className="w-14 h-14 rounded-[20px] bg-[#1a1f35] flex items-center justify-center border-2 border-white/5 active:scale-90 transition-all text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">TOP <span className="text-primary italic">RIVALRIES</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 italic opacity-60">Comparative Operative Analytics</p>
          </div>
        </div>

        <div className="space-y-6">
          {h2h.length > 0 ? h2h.map((rival: any) => (
            <div key={rival.opponentId} className="fiery-card rounded-[48px] p-10 relative overflow-hidden group border-2 border-white/5 bg-[#1a1f35]/30 hover:border-primary/40 transition-all duration-300">
              <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[32px] bg-[#101423] border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                    {rival.photo ? (
                      <img src={rival.photo} alt="Rival" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-black text-slate-700 uppercase italic text-2xl">{rival.name.substring(0, 2)}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-2xl text-white leading-none uppercase italic tracking-tighter mb-3">{rival.name}</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase italic leading-none mb-1">RECORD</span>
                        <span className="text-sm font-black text-slate-400 font-mono tracking-tighter uppercase">{rival.wins}W / {rival.losses}L</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 italic">ENGAGEMENTS</p>
                  <p className="text-4xl font-black text-white italic tracking-tighter leading-none">{rival.total}</p>
                </div>
              </div>
              <div className="mt-8 h-2.5 w-full bg-[#101423] rounded-full overflow-hidden flex p-[1px] border border-white/5 shadow-inner">
                <div className="h-full bg-emerald-500 rounded-full fiery-glow" style={{ width: `${(rival.wins / rival.total) * 100}%` }} />
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(rival.losses / rival.total) * 100}%` }} />
              </div>
            </div>
          )) : (
            <div className="fiery-card rounded-[48px] p-24 text-center border-2 border-white/5 bg-[#1a1f35]/20">
              <Users className="w-16 h-16 text-slate-800 mx-auto mb-6 border-2 border-slate-900 rounded-[28px] p-4 opacity-40 shadow-inner" />
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-relaxed">No consistent rival signatures detected in the local sector.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-12 pb-32 px-1">
      <div className="flex flex-col items-center gap-8 pt-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative group z-10">
          <div className="w-36 h-36 rounded-[48px] bg-[#1a1f35] border-[6px] border-[#101423] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            {member.photo ? (
              <img src={member.photo} alt="Profile" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <User className="w-16 h-16 text-slate-700" />
            )}
          </div>
          <label className="absolute -bottom-3 -right-3 w-14 h-14 rounded-[24px] bg-primary flex items-center justify-center border-[4px] border-[#101423] shadow-2xl cursor-pointer hover:scale-105 active:scale-90 transition-all fiery-glow">
            {uploading ? <Loader2 className="w-6 h-6 animate-spin text-secondary" /> : <Camera className="w-6 h-6 text-secondary" />}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        <div className="text-center relative z-10">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-4">{member.name}</h2>
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] italic mb-1">BALANCE</p>
              <p className="text-lg font-black text-white uppercase italic tracking-tighter">{member.loyaltyPoints ?? 0} <span className="text-[10px] opacity-40">PTS</span></p>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] italic mb-1">STANDING</p>
              <p className="text-lg font-black text-white uppercase italic tracking-tighter">Level {member.level || 1} <span className="text-[10px] opacity-40">ELITE</span></p>
            </div>
          </div>
        </div>
      </div>

      <VerificationCard member={member} />

      <div className="fiery-card p-10 rounded-[48px] border-2 border-primary/20 bg-primary/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
          <Medal className="w-40 h-40 text-primary" />
        </div>
        <div className="flex justify-between items-end mb-8 relative z-10">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic">Engagement Potential</p>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">RANK STATUS {member.level || 1}</h3>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase italic">{Math.floor((member.experience / ((member.level || 1) * 1000)) * 100)}% COMPLETE</p>
        </div>
        <div className="h-4 w-full bg-[#101423] rounded-full overflow-hidden border border-white/10 p-[2px] shadow-inner mb-6 relative z-10">
          <div
            className="h-full bg-gradient-to-r from-primary to-[#1f22ff] rounded-full transition-all duration-1000 relative fiery-glow"
            style={{ width: `${Math.min(((member.experience || 0) / ((member.level || 1) * 1000)) * 100, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-600 font-black uppercase mt-2 text-center tracking-[0.3em] italic relative z-10">Kumpulkan {((member.level || 1) * 1000) - (member.experience || 0)} XP lagi untuk Tingkat {(member.level || 1) + 1}</p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Lencana Kehormatan</p>
          <span className="text-[10px] font-black text-primary uppercase italic">{(member.badges || []).length} DIDAPATKAN</span>
        </div>
        <div className="flex gap-4">
          {[
            { key: 'PIONEER', label: 'Pioneer', icon: Crown, color: 'text-amber-400', bg: 'bg-amber-400/10' },
            { key: 'STREAK_KING', label: 'Berserker', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { key: 'DEATHMATCH', label: 'High Roller', icon: Target, color: 'text-primary', bg: 'bg-primary/10' }
          ].map(badge => {
            const isEarned = (member.badges || []).includes(badge.key);
            return (
              <div key={badge.key} className={`flex-1 fiery-card p-6 rounded-[32px] flex flex-col items-center gap-4 transition-all duration-700 border-2 ${isEarned ? 'opacity-100 border-white/10 bg-[#1a1f35]/50' : 'opacity-20 grayscale border-white/5 bg-transparent'}`}>
                <div className={`w-14 h-14 rounded-[20px] ${isEarned ? badge.bg : 'bg-slate-800/10'} flex items-center justify-center ${isEarned ? badge.color : 'text-slate-700'} border border-white/5 shadow-inner`}>
                  <badge.icon className={`w-7 h-7 ${isEarned ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
                </div>
                <p className="text-[9px] font-black text-white uppercase tracking-widest text-center leading-none italic">{badge.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <button
          onClick={() => setView('history')}
          className="w-full fiery-card flex items-center justify-between p-8 rounded-[40px] transition-all hover:bg-[#1a1f35] border-2 border-white/5 group active:scale-[0.98]"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-[24px] bg-[#1a1f35] flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-all shadow-inner">
              <Swords className="w-6 h-6 text-primary" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="font-black text-white text-lg uppercase italic tracking-tighter">Riwayat Arena</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic opacity-60">Catatan pertandingan global</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-primary transition-colors" strokeWidth={3} />
        </button>

        <button
          onClick={() => setView('h2h')}
          className="w-full fiery-card flex items-center justify-between p-8 rounded-[40px] transition-all hover:bg-[#1a1f35] border-2 border-white/5 group active:scale-[0.98]"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-[24px] bg-[#1a1f35] flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-all shadow-inner">
              <Users className="w-6 h-6 text-primary" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="font-black text-white text-lg uppercase italic tracking-tighter">Analitik Tanding</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic opacity-60">Statistik Head to Head lawan</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-primary transition-colors" strokeWidth={3} />
        </button>

        <button
          onClick={() => useAppStore.getState().setActiveTab('booking')}
          className="w-full fiery-card flex items-center justify-between p-8 rounded-[40px] transition-all hover:bg-[#1a1f35] border-2 border-white/5 group active:scale-[0.98]"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-[24px] bg-[#1a1f35] flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-all shadow-inner">
              <Calendar className="w-6 h-6 text-primary" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="font-black text-white text-lg uppercase italic tracking-tighter">Pemesanan Meja</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic opacity-60">Reservasi arena bertanding</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-primary transition-colors" strokeWidth={3} />
        </button>

        <button
          onClick={() => useAppStore.getState().setActiveTab('rewards')}
          className="w-full fiery-card flex items-center justify-between p-8 rounded-[40px] transition-all hover:bg-[#1a1f35] border-2 border-white/5 group active:scale-[0.98]"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-[24px] bg-[#1a1f35] flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-all shadow-inner">
              <Gift className="w-6 h-6 text-primary" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="font-black text-white text-lg uppercase italic tracking-tighter">Rewards Depot</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic opacity-60">Redeem loyalty assets</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-primary transition-colors" strokeWidth={3} />
        </button>

        <button
          onClick={onLogout}
          className="w-full py-6 rounded-[32px] mt-12 transition-all font-black text-[10px] uppercase tracking-[0.4em] bg-rose-500/10 text-rose-500 border-2 border-rose-500/20 hover:bg-rose-500/20 active:scale-95 italic"
        >
          Abort Mission Protocol
        </button>
      </div>
    </div>
  );
}

function MainApp() {
  const { member, setMember, activeTab, setActiveTab, refreshMemberData, logout } = useAppStore();
  const [tournaments, setTournaments] = useState([]);
  const [leaderboard, setLeaderboard] = useState<{allTime: any[], monthly: any[], activeKings: any[], hallOfFame: any[]}>({allTime: [], monthly: [], activeKings: [], hallOfFame: []});
  const [activeNotification, setActiveNotification] = useState<any>(null);

  useEffect(() => {
    if (!member) return;
    const allChallenges = [...(member.challengesSent || []), ...(member.challengesReceived || [])];
    const latestCompleted = allChallenges.find(c => c.status === 'COMPLETED');

    if (latestCompleted) {
      try {
        const notifiedStr = localStorage.getItem('notifiedChallenges');
        const notifiedChallenges = notifiedStr ? JSON.parse(notifiedStr) : [];

        if (!notifiedChallenges.includes(latestCompleted.id)) {
          setActiveNotification(latestCompleted);
          notifiedChallenges.push(latestCompleted.id);
          localStorage.setItem('notifiedChallenges', JSON.stringify(notifiedChallenges));
        }
      } catch (e) {
        console.error("Local storage error in notification logic", e);
      }
    }
  }, [member]);

  useEffect(() => {
    api.get('/player/tournaments').then(res => setTournaments(res.data.data)).catch(() => { });
    api.get('/player/leaderboard').then(res => setLeaderboard(res.data.data)).catch(() => { });
  }, []);

  useEffect(() => {
    if (member?.id) {
      refreshMemberData();
      const interval = setInterval(refreshMemberData, 5000);
      return () => clearInterval(interval);
    }
  }, [member?.id, refreshMemberData]);

  if (!member) return <LoginScreen onLogin={setMember} />;

  // Updated Nav Items directly aligned with E-Sports theme & Native Feel
  const navItems = [
    { id: 'home', icon: LayoutGrid, label: 'ARENA' },
    { id: 'ledger', icon: Swords, label: 'HISTORY' },
    { id: 'leaderboard', icon: Trophy, label: 'RANK' },
    { id: 'profile', icon: User, label: 'PROFILE' },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden border-x border-white/5">
      <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-[0.15] bg-primary/20" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-[0.15] bg-accent/10" />

      {activeNotification && (
        <VictoryNotification
          challenge={activeNotification}
          currentMemberId={member.id}
          onClose={() => setActiveNotification(null)}
        />
      )}

      {/* ─── DYNAMIC TOP BAR ─── */}
      <div className="flex justify-between items-center px-6 pt-12 pb-4 relative z-30 bg-gradient-to-b from-[#070b14] to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-[14px] flex items-center justify-center border border-primary/20 shadow-inner">
             <VamosLogo className="w-6 h-6" color="#3b82f6" glowing />
          </div>
          <div>
            <h1 onClick={() => setActiveTab('home')} className="text-xl font-black tracking-tighter italic uppercase cursor-pointer leading-none">
              VAMOS<span className="text-primary">POOL</span>
            </h1>
            <p className="text-[8px] font-black text-slate-500 tracking-[0.3em] uppercase italic mt-1">E-Sports Arena</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#101423]/80 backdrop-blur-md px-3 py-1.5 rounded-[12px] flex items-center gap-2 border border-white/10 shadow-inner cursor-pointer hover:border-primary/50 transition-colors"
               onClick={() => setActiveTab('rewards')}>
            <Star className="w-3.5 h-3.5 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" fill="currentColor" />
            <span className="text-xs font-black text-white pt-0.5">{member.loyaltyPoints ?? 0}</span>
          </div>

          <button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-[14px] bg-[#101423] overflow-hidden border border-white/10 p-[2px] shadow-inner active:scale-90 transition-transform">
            {member.photo ? (
              <img src={member.photo} alt="P" className="w-full h-full rounded-[10px] object-cover" />
            ) : (
              <div className="w-full h-full rounded-[10px] bg-[#1a1f35] flex items-center justify-center text-sm font-black text-primary">
                {member.name?.[0].toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* ─── MAIN SCROLLABLE CONTENT ─── */}
      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-32 scrollbar-hide relative z-10 transition-all duration-300">
        {activeTab === 'home' && <DashboardScreen member={member} />}
        {activeTab === 'live-table' && <LiveTableScreen member={member} />}
        {activeTab === 'play' && <PlayScreen member={member} />}
        {activeTab === 'booking' && <BookingScreen />}
        {activeTab === 'rewards' && <RewardsScreen />}
        {activeTab === 'active-session' && <ActiveSessionScreen />}
        {activeTab === 'menu' && <MenuScreen />}
        {activeTab === 'leaderboard' && <LeaderboardScreen leaderboard={leaderboard} currentUser={member} />}
        {activeTab === 'tournaments' && <TournamentScreen member={member} activeTournaments={tournaments} leaderboard={leaderboard} />}
        {activeTab === 'profile' && <ProfileScreen member={member} onLogout={logout} />}
        {activeTab === 'ledger' && <HistoryScreen member={member} onBack={() => setActiveTab('home')} />}
      </div>

      {/* ─── NATIVE STICKY BOTTOM NAVIGATION ─── */}
      <div className="fixed bottom-0 top-auto left-0 w-full z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
        {/* Glow effect matching the selected active tab */}
        <div className="absolute bottom-0 left-0 w-full h-[100px] bg-gradient-to-t from-[#070b14] to-transparent pointer-events-none" />
        
        <div className="max-w-md mx-auto w-full pointer-events-auto bg-[#101423]/95 backdrop-blur-2xl border-t border-white/5 relative shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex justify-around items-center px-2 py-4 relative">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`relative flex flex-col items-center justify-center w-[20%] transition-all duration-300 ease-out group ${isActive ? 'text-primary scale-110 -translate-y-2' : 'text-slate-500 hover:text-white'}`}
                >
                  {/* Glowing active indicator dot */}
                  {isActive && (
                    <div className="absolute -top-3 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,1)]" />
                  )}
                  
                  {/* Active backdrop highlight */}
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full scale-[2]" />
                  )}
                  
                  <item.icon 
                     className={`w-6 h-6 mb-1 relative z-10 transition-colors ${isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'stroke-[2] opacity-70 group-hover:opacity-100'}`} 
                     fill={isActive ? 'currentColor' : 'none'} 
                  />
                  
                  <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${isActive ? 'text-primary opacity-100' : 'opacity-0 scale-75'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function App() {
  return <MainApp />;
}
