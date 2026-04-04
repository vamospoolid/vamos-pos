import { useState, useEffect } from 'react';
import { User, ChevronRight, Loader2, CheckCircle2, ShieldCheck, X, LayoutGrid, Flame, Trophy, Swords, Calendar, Camera, Zap, Star, TrendingUp } from 'lucide-react';
import { api } from './api';
import { RewardsScreen } from './RewardsScreen';
import { BookingScreen } from './BookingScreen';
import { ActiveSessionScreen } from './ActiveSessionScreen';
import { MenuScreen } from './MenuScreen';
import { VictoryNotification } from './components/VictoryNotification';
import { LeaderboardScreen } from './LeaderboardScreen';
import { HistoryScreen } from './HistoryScreen';
import { useAppStore } from './store/appStore';
import { VamosLogo } from './components/VamosLogo';

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

// ═══════════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════════

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
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-[0_0_50px_rgba(255,87,34,0.3)]">
            <VamosLogo className="w-12 h-12" glowing />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase italic">VAMOS<span className="text-accent underline decoration-primary decoration-4 underline-offset-4 ml-1">POOL</span></h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-3">{isRegister ? 'Bergabung dengan liga juara' : 'Selamat datang kembali, legenda'}</p>
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
            Daftar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegister && (
            <div className="fade-in">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Nama Tampilan</label>
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
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Akses WhatsApp</label>
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
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">PIN Keamanan / Sandi</label>
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
            className="w-full fiery-btn-primary py-4 flex items-center justify-center active:scale-95 transition-all mt-6 text-sm uppercase tracking-widest font-black italic"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegister ? 'Buat Profil' : 'Masuk Arena')}
          </button>
        </form>

        <p className="text-center text-[9px] text-slate-600 font-bold uppercase mt-8 tracking-widest">
          {isRegister ? 'Dengan bergabung Anda menyetujui aturan arena' : 'Kendala login? Hubungi Kasir.'}
        </p>
      </div>
    </div>
  );
}

function DashboardScreen({ member, tournaments = [] }: { member: any, tournaments?: any[] }) {
  const activeSession = member.sessions?.find((s: any) => s.status === 'ACTIVE');
  const ongoingTournament = tournaments.find(t => t.status === 'ONGOING' || t.status === 'IN_PROGRESS');
  const pendingTournament = tournaments.find(t => t.status === 'PENDING' || t.status === 'UPCOMING' || !t.status);
  const [showMasteryInfo, setShowMasteryInfo] = useState(false);
  const [showRankHistory, setShowRankHistory] = useState(false);
  const { setActiveTab } = useAppStore();

  useEffect(() => {
    if (showRankHistory) {
      // Mock loading history
    }
  }, [showRankHistory, member.id]);

  return (
    <div className="fade-in space-y-8 pb-32">
      {/* ─── MASTERY INFO MODAL ─── */}
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
                  <p className="text-[10px] text-slate-500 uppercase tracking-tight leading-relaxed">Capai Peringkat lebih tinggi untuk membuka fitur eksklusif dan diskon pendaftaran turnamen.</p>
               </div>
            </div>
            <button onClick={() => setShowMasteryInfo(false)} className="w-full mt-10 py-4 fiery-btn-primary text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Mengerti
            </button>
          </div>
        </div>
      )}

      {/* ─── IDENTITY BLOCK ─── */}
      <div className="flex flex-col items-center pt-10 pb-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-[40px] bg-surface-highlight/20 border-4 border-white/5 p-1 relative z-10 shadow-2xl overflow-hidden">
            {member.photo ? (
              <img src={member.photo} alt="P" className="w-full h-full rounded-[36px] object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-highlight/30">
                <User className="w-14 h-14 text-slate-600" />
              </div>
            )}
          </div>
        </div>
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">{member.name || 'LEGEND PLAYER'}</h1>
        <div className="flex items-center gap-12 mt-6">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 italic">Balance</p>
            <p className="text-2xl font-black text-white italic tracking-tighter leading-none">{member.loyaltyPoints || 0} <span className="text-[10px] text-primary not-italic ml-1">PTS</span></p>
          </div>
          <div className="w-px h-10 bg-white/5" />
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 italic">Standing</p>
            <p className="text-2xl font-black text-white italic tracking-tighter leading-none uppercase">Level {member.level || 1}</p>
          </div>
        </div>
      </div>

      <VerificationCard member={member} />

      {/* ─── QUICK ACTIONS ─── */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setActiveTab('booking')} className="fiery-card p-6 flex flex-col gap-4 hover:scale-[1.02] transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-[#a855f7]/10 flex items-center justify-center border border-[#a855f7]/20">
            <Calendar className="w-6 h-6 text-[#a855f7]" />
          </div>
          <div className="text-left font-black text-white uppercase italic">Pesan Meja</div>
        </button>
        <button onClick={() => setActiveTab('leaderboard')} className="fiery-card p-6 flex flex-col gap-4 hover:scale-[1.02] transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-[#00d084]/10 flex items-center justify-center border border-[#00d084]/20">
            <Trophy className="w-6 h-6 text-[#00d084]" />
          </div>
          <div className="text-left font-black text-white uppercase italic">Peringkat</div>
        </button>
      </div>

      {activeSession && (
        <button onClick={() => setActiveTab('active-session')} className="fiery-card-highlight p-6 flex items-center justify-between fiery-glow">
          <div className="flex items-center gap-5">
             <Flame className="w-6 h-6 text-primary animate-pulse" fill="currentColor" />
             <div className="text-left font-black text-white uppercase italic">Sesi Aktif: {activeSession?.table?.name}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}

      {/* ─── DYNAMIC TOURNAMENT RADAR ─── */}
      {ongoingTournament && (
        <button onClick={() => setActiveTab('tournaments')} className="w-full fiery-card p-6 bg-blue-500/10 border-2 border-blue-500/30 rounded-[32px] flex items-center justify-between group fiery-glow mt-4">
           <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Swords className="w-6 h-6 text-blue-500 animate-pulse" />
              </div>
              <div className="text-left">
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] mb-1 italic">Event Sedang Berlangsung</p>
                  <p className="font-black text-white text-xl uppercase italic leading-none">{ongoingTournament.name}</p>
              </div>
           </div>
           <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {!ongoingTournament && pendingTournament && (
        <button onClick={() => setActiveTab('tournaments')} className="w-full fiery-card p-6 bg-orange-500/10 border-2 border-orange-500/30 rounded-[32px] flex items-center justify-between group fiery-glow mt-4">
           <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                  <Calendar className="w-6 h-6 text-orange-500 animate-bounce" />
              </div>
              <div className="text-left">
                  <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.4em] mb-1 italic">Pendaftaran Dibuka</p>
                  <p className="font-black text-white text-xl uppercase italic leading-none">{pendingTournament.name}</p>
              </div>
           </div>
           <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      <div className="fiery-card p-8 bg-amber-500/5 border-2 border-amber-500/10 rounded-[40px] flex items-center justify-between group mt-4" onClick={() => setShowRankHistory(true)}>
         <div className="text-left">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2 italic">Official Handicap</p>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter truncate max-w-[200px]">{member.handicapLabel || 'ELITE FRAGGER'}</h3>
         </div>
         <TrendingUp className="w-7 h-7 text-amber-500" />
      </div>
    </div>
  );
}

function TournamentScreen({ activeTournaments }: { member: any, activeTournaments: any[] }) {
  const tournament = activeTournaments[0] || MOCK_TOURNAMENT;
  const isOngoing = tournament.status === 'ONGOING' || tournament.status === 'IN_PROGRESS';
  const isPending = tournament.status === 'PENDING' || tournament.status === 'UPCOMING' || !tournament.status;
  
  const [activeView, setActiveView] = useState<'info' | 'bracket' | 'rankings'>(isOngoing ? 'bracket' : 'info');
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [loadingReg, setLoadingReg] = useState(false);
  const { refreshMemberData } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const participantList = (tournament?.participants || []).map((p: any) => p.member || p);
  const filteredParticipants = participantList.filter((p: any) => (p?.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const handleRegister = async () => {
    setLoadingReg(true);
    try {
      const res = await api.post(`/tournament/${tournament.id}/register`, { paymentRef });
      if (res.data.success) {
        alert('Registration request sent! Please wait for admin approval.');
        setIsRegModalOpen(false);
        refreshMemberData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register.');
    } finally {
      setLoadingReg(false);
    }
  };

  return (
    <div className="fade-in space-y-8 pb-32">
      <div className="text-center pt-8">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">PUSAT <span className="text-primary italic">TURNAMEN</span></h1>
      </div>
      <div className="flex bg-[#1a1f35]/50 p-1.5 rounded-2xl border border-white/5 mx-2">
        {[
          { id: 'info', label: 'Info' },
          { id: 'bracket', label: 'Bagan' },
          { id: 'rankings', label: 'Peserta' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeView === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}>{tab.label}</button>
        ))}
      </div>
      <div className="px-2 space-y-8">
        {activeView === 'info' && (
          <div className="fiery-card p-10 border-2 border-white/5">
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-8">{tournament.name}</h2>
            <div className="grid grid-cols-2 gap-3 mb-10 relative z-10">
               <div className="bg-[#101423] p-4 rounded-[24px] border border-white/5">
                 <p className="text-[8px] text-slate-600 font-extrabold uppercase tracking-[0.2em] italic mb-1">Prize Pool</p>
                 <p className="text-lg font-black text-white italic tracking-tighter leading-none">RP {(tournament.prizePool || 0).toLocaleString()}</p>
               </div>
               <div className="bg-[#101423] p-4 rounded-[24px] border border-white/5">
                 <p className="text-[8px] text-slate-600 font-extrabold uppercase tracking-[0.2em] italic mb-1">Format</p>
                 <p className="text-lg font-black text-white italic tracking-tighter leading-none uppercase">{tournament.format || 'Single Elim'}</p>
               </div>
            </div>
             {isPending && (
                <button onClick={() => setIsRegModalOpen(true)} className="w-full fiery-btn-primary py-5 rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] italic">DAFTAR SEKARANG</button>
             )}
             {!isPending && (
                <div className="w-full bg-white/5 border border-white/10 py-5 rounded-[28px] text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">
                   PENDAFTARAN DITUTUP
                </div>
             )}
          </div>
        )}

        {/* ─── MISSION REGISTRATION MODAL ─── */}
        {isRegModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#0a0f1d]/95 backdrop-blur-xl" onClick={() => setIsRegModalOpen(false)} />
            <div className="relative w-full max-w-sm fiery-card p-10 text-left scale-in border-2 border-primary/20">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Pendaftaran Turnamen</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Protokol Registrasi Peserta</p>
                </div>
                <button onClick={() => setIsRegModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Payment Reference / Invoice ID <span className="text-primary opacity-60">(Opsional)</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={e => setPaymentRef(e.target.value)}
                      placeholder="Kosongkan jika pendaftaran manual..."
                      className="w-full bg-[#101423] border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary text-white font-medium placeholder:text-slate-700 transition-all"
                    />
                    <Zap className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-3 px-1 italic">Jika Anda belum memiliki kode dari kasir, kosongkan saja. Anda bisa mendaftar dan melapor ke Admin nanti secara langsung di Arena.</p>
                </div>
                
                <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl">
                  <div className="flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-white uppercase italic tracking-widest mb-1">Status: Pending Verification</p>
                      <p className="text-[9px] text-slate-500 leading-relaxed uppercase tracking-tight">Nama Anda akan dikirim ke Admin. Setelah disetujui, Anda akan otomatis masuk ke daftar Operative/Peserta turnamen ini.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleRegister} 
                className="w-full mt-10 py-5 fiery-btn-primary text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_15px_30px_rgba(255,87,34,0.2)]"
              >
                {loadingReg ? <Loader2 className="w-5 h-5 animate-spin" /> : <>KONFIRMASI PENDAFTARAN <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}
        {activeView === 'bracket' && (
          <div className="space-y-4">
             {(!tournament.matches || tournament.matches.length === 0) ? (
                 <div className="fiery-card py-24 text-center border-dashed border-white/10 opacity-70">
                    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                        <Swords className="w-8 h-8 text-primary opacity-50" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-2 leading-relaxed">Operasi sedang dikalkulasi markas utama.<br />Harap bersiaga.</p>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Bagan Sedang Disusun</h3>
                 </div>
             ) : (() => {
                 const matchesByRound = tournament.matches.reduce((acc: any, m: any) => {
                     if (!acc[m.round]) acc[m.round] = [];
                     acc[m.round].push(m);
                     return acc;
                 }, {});
                 const sortedRounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

                 return (
                     <div className="flex overflow-x-auto snap-x space-x-6 pb-6 hide-scrollbar items-stretch min-h-[400px]">
                         {sortedRounds.map((roundNum) => {
                             const roundMatches = matchesByRound[roundNum].sort((a: any, b: any) => a.matchNumber - b.matchNumber);
                             return (
                                 <div key={roundNum} className="flex flex-col justify-around min-w-[260px] space-y-6 snap-center py-2">
                                     <h4 className="text-center text-[10px] text-slate-500 font-black uppercase mb-2 italic tracking-[0.2em]">ROUND {roundNum}</h4>
                                     {roundMatches.map((m: any) => {
                                         const p1 = tournament.participants?.find((p: any) => p.id === m.player1Id);
                                         const p2 = tournament.participants?.find((p: any) => p.id === m.player2Id);
                                         const p1Name = p1 ? (p1.member?.name || p1.name) : 'TBD';
                                         const p2Name = p2 ? (p2.member?.name || p2.name) : 'TBD';
                                         const isP1Winner = m.score1 !== null && m.score1 > m.score2;
                                         const isP2Winner = m.score2 !== null && m.score2 > m.score1;

                                         return (
                                             <div key={m.id} className="fiery-card rounded-3xl bg-[#1a1f35]/50 border border-white/5 shadow-lg relative z-10 w-full overflow-hidden">
                                                 <div className={`p-4 flex justify-between items-center border-b border-white/5 ${isP1Winner ? 'bg-primary/10' : ''}`}>
                                                     <div className="flex flex-col truncate pr-4">
                                                         <span className={`font-black uppercase tracking-widest text-[11px] italic truncate ${isP1Winner ? 'text-primary' : 'text-white'}`}>{p1Name}</span>
                                                         {p1?.handicap && <span className="text-[8px] text-primary/70 font-black uppercase mt-0.5">HC: {p1.handicap}</span>}
                                                     </div>
                                                     <span className={`font-black text-sm italic ${isP1Winner ? 'text-primary' : 'text-slate-500'}`}>{m.score1 !== null ? m.score1 : '-'}</span>
                                                 </div>
                                                 <div className={`p-4 flex justify-between items-center ${isP2Winner ? 'bg-primary/10' : ''}`}>
                                                     <div className="flex flex-col truncate pr-4">
                                                         <span className={`font-black uppercase tracking-widest text-[11px] italic truncate ${isP2Winner ? 'text-primary' : 'text-white'}`}>{p2Name}</span>
                                                         {p2?.handicap && <span className="text-[8px] text-primary/70 font-black uppercase mt-0.5">HC: {p2.handicap}</span>}
                                                     </div>
                                                     <span className={`font-black text-sm italic ${isP2Winner ? 'text-primary' : 'text-slate-500'}`}>{m.score2 !== null ? m.score2 : '-'}</span>
                                                 </div>
                                             </div>
                                         );
                                     })}
                                 </div>
                             );
                         })}
                     </div>
                 );
             })()}
          </div>
        )}
        {activeView === 'rankings' && (
          <div className="space-y-6">
            <div className="bg-[#1a1f35]/50 flex items-center px-6 py-4 rounded-2xl border border-white/5"><input className="bg-transparent focus:outline-none text-sm w-full font-bold placeholder:text-slate-600 text-white uppercase italic" placeholder="Cari nama peserta..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
            {filteredParticipants.length === 0 ? (
                <div className="fiery-card py-20 text-center border-dashed border-white/10 opacity-70">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Belum ada peserta yang mendaftar.</p>
                </div>
            ) : (
                filteredParticipants.map((p: any, i: number) => (
                  <div key={p.id || i} className="fiery-card p-6 rounded-3xl flex items-center justify-between border border-white/5 bg-[#1a1f35]/30">
                    <div className="flex items-center gap-5"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 ${i < 3 ? 'border-primary bg-primary/20 text-white' : 'border-slate-800 text-slate-500'}`}>{i + 1}</div><div><p className="font-black text-white text-base uppercase italic">{p?.name || 'PESERTA TIDAK DIKENAL'}</p></div></div>
                    <div className="text-right">
                       <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full uppercase italic tracking-widest">TERDAFTAR</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VerificationCard({ member }: { member: any }) {
  const { refreshMemberData } = useAppStore();
  const [uploading, setUploading] = useState(false);
  const handleVerifyWa = () => window.open(`https://wa.me/6281234567890?text=Halo%20Vamos%20Pool,%20saya%20ingin%20verifikasi%20akun%20member%20saya%20dengan%20ID:%20${member.id}`, '_blank');
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await api.post(`/player/${member.id}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) refreshMemberData();
    } catch (err: any) { alert(err.response?.data?.message || 'Gagal mengunggah foto.'); }
    finally { setUploading(false); }
  };
  return (
    <div className="fiery-card p-10 relative overflow-hidden group">
      <div className="flex justify-between items-center mb-8 relative z-10"><div><p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic">Security Protocol</p><h3 className="text-2xl font-black text-white uppercase italic">PROFIL MEMBER</h3></div></div>
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between p-5 rounded-[28px] bg-[#101423] border border-white/5"><div className="flex items-center gap-5"><div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border ${member.isWaVerified ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-700'}`}><CheckCircle2 className="w-6 h-6" /></div><div><p className="text-sm font-black text-white uppercase italic">WhatsApp Protocol</p></div></div>{!member.isWaVerified && <button onClick={handleVerifyWa} className="px-5 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase italic">Verify</button>}</div>
        <div className="flex items-center justify-between p-5 rounded-[28px] bg-[#101423] border border-white/5"><div className="flex items-center gap-5"><div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border ${member.photo ? 'bg-primary/10 text-primary' : 'text-slate-700'}`}><User className="w-6 h-6" /></div><div><p className="text-sm font-black text-white uppercase italic">Foto Profil</p></div></div>{!member.photo && <label className="px-5 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase italic cursor-pointer">{uploading ? 'SYNC' : 'UPLOAD'}<input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading}/></label>}</div>
      </div>
    </div>
  );
}

function ProfileScreen({ member, onLogout }: { member: any, onLogout: () => void }) {
  const [view, setView] = useState<'main' | 'history' | 'h2h'>('main');
  const [uploading, setUploading] = useState(false);
  const { refreshMemberData } = useAppStore();
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await api.post(`/player/${member.id}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) refreshMemberData();
    } catch (err: any) { alert(err.response?.data?.message || 'Gagal mengunggah foto.'); }
    finally { setUploading(false); }
  };
  if (view !== 'main') return <HistoryScreen member={member} onBack={() => setView('main')} />;
  return (
    <div className="fade-in space-y-10 pb-32">
      <div className="text-center pt-8"><h1 className="text-5xl font-black italic text-white uppercase">PROFIL</h1></div>
      <div className="flex flex-col items-center">
        <div className="relative mb-8"><div className="w-40 h-40 rounded-[48px] bg-[#1a1f35] p-1 border-4 border-white/5 shadow-2xl overflow-hidden">{member.photo ? <img src={member.photo} alt="P" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-16 h-16 text-slate-700" /></div>}</div><label className="absolute -bottom-2 -right-2 bg-primary p-3 rounded-2xl border-4 border-[#070b14] cursor-pointer"><Camera className="w-5 h-5 text-white" /><input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading}/></label></div>
        <h2 className="text-3xl font-black text-white italic uppercase">{member.name}</h2>
      </div>
      <div className="space-y-4">
        <button onClick={() => setView('history')} className="w-full fiery-card flex items-center justify-between p-8 rounded-[40px] border-2 border-white/5 group"><div className="flex items-center gap-6"><div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center"><Swords className="w-6 h-6 text-primary" /></div><span className="font-black text-white text-lg uppercase italic">Riwayat Arena</span></div><ChevronRight className="w-6 h-6 text-slate-700"/></button>
        <button onClick={onLogout} className="w-full py-6 rounded-[32px] mt-12 font-black text-[10px] uppercase bg-rose-500/10 text-rose-500 border-2 border-rose-500/20 italic">Abort Mission Protocol</button>
      </div>
    </div>
  );
}

function MainApp() {
  const { member, setMember, activeTab, setActiveTab, refreshMemberData } = useAppStore();
  const [tournaments, setTournaments] = useState([]);
  const [leaderboard, setLeaderboard] = useState<{allTime: any[], monthly: any[], activeKings: any[], hallOfFame: any[]}>({allTime: [], monthly: [], activeKings: [], hallOfFame: []});
  const [activeNotification, setActiveNotification] = useState<any>(null);

  useEffect(() => {
    if (!member) return;
    const latestCompleted = [...(member.challengesSent || []), ...(member.challengesReceived || [])].find(c => c.status === 'COMPLETED');
    if (latestCompleted) {
        const notified = JSON.parse(localStorage.getItem('notifiedChallenges') || '[]');
        if (!notified.includes(latestCompleted.id)) {
            setActiveNotification(latestCompleted);
            localStorage.setItem('notifiedChallenges', JSON.stringify([...notified, latestCompleted.id]));
        }
    }
  }, [member]);

  useEffect(() => {
    api.get('/player/tournaments').then(res => setTournaments(res.data.data)).catch(() => {});
    api.get('/player/leaderboard').then(res => setLeaderboard(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (member?.id) {
      refreshMemberData();
      const interval = setInterval(refreshMemberData, 5000);
      return () => clearInterval(interval);
    }
  }, [member?.id, refreshMemberData]);

  if (!member) return <LoginScreen onLogin={setMember} />;

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden border-x border-white/5">
      {activeNotification && <VictoryNotification challenge={activeNotification} currentMemberId={member.id} onClose={() => setActiveNotification(null)} />}
      <div className="flex justify-between items-center px-6 pt-12 pb-4 relative z-30">
        <div className="flex items-center gap-3"><VamosLogo className="w-10 h-10" glowing /><h1 onClick={() => setActiveTab('dashboard')} className="text-xl font-black italic uppercase cursor-pointer leading-none">VAMOS<span className="text-primary italic">POOL</span></h1></div>
        <div className="flex items-center gap-3"><div className="bg-[#101423] p-1.5 rounded-[12px] flex items-center gap-2 border border-white/10"><Star className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" /><span className="text-xs font-black text-white">{member.loyaltyPoints ?? 0}</span></div><button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-[14px] bg-[#101423] overflow-hidden border border-white/10">{member.photo ? <img src={member.photo} alt="P" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#1a1f35] flex items-center justify-center text-primary font-black">{member.name?.[0]}</div>}</button></div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-32 relative z-10">
        {activeTab === 'dashboard' && <DashboardScreen member={member} tournaments={tournaments} />}
        {activeTab === 'leaderboard' && <LeaderboardScreen leaderboard={leaderboard} currentUser={member} />}
        {activeTab === 'tournaments' && <TournamentScreen activeTournaments={tournaments} member={member} />}
        {activeTab === 'rewards' && <RewardsScreen />}
        {activeTab === 'booking' && <BookingScreen />}
        {activeTab === 'active-session' && <ActiveSessionScreen />}
        {activeTab === 'profile' && <ProfileScreen member={member} onLogout={() => useAppStore.getState().logout()} />}
        {activeTab === 'menu' && <MenuScreen />}
      </div>
      <nav className="fiery-nav">
        {[{id:'dashboard', icon:LayoutGrid, label:'Rating'}, {id:'leaderboard', icon:Swords, label:'Matches'}, {id:'tournaments', icon:Trophy, label:'Events'}, {id:'rewards', icon:Star, label:'Store'}, {id:'profile', icon:User, label:'Profile'}].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}><div className="icon-container"><item.icon className="w-6 h-6" /></div><span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span></button>
        ))}
      </nav>
    </div>
  );
}

export default function App() { return <MainApp />; }
