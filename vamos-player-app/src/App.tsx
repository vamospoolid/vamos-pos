import { useState, useEffect } from 'react';
import { User, ChevronRight, Loader2, CheckCircle2, ShieldCheck, X, LayoutGrid, Flame, Trophy, Swords, Camera, Zap, Star, TrendingUp, Download, Share2, ArrowLeft, ScrollText } from 'lucide-react';
import { api, getAvatarUrl } from './api';
import { RewardsScreen } from './RewardsScreen';
import { BookingScreen } from './BookingScreen';
import { ActiveSessionScreen } from './ActiveSessionScreen';
import { MenuScreen } from './MenuScreen';
import { VictoryNotification } from './components/VictoryNotification';
import { LeaderboardScreen } from './LeaderboardScreen';
import { HistoryScreen } from './HistoryScreen';
import { PlayScreen } from './PlayScreen';
import { useAppStore } from './store/appStore';
import { VamosLogo } from './components/VamosLogo';
import { SplashScreen } from './components/SplashScreen';
import { DiscoveryHeader } from './components/DiscoveryHeader';
import { HorizontalDateSelector } from './components/HorizontalDateSelector';
import { FeaturedBookingCard } from './components/FeaturedBookingCard';

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
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase italic">ARENA<span className="text-accent underline decoration-primary decoration-4 underline-offset-4 ml-1">FIGHT</span></h1>
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
        
        <a 
          href="/VamosPlayer.apk" 
          download="VamosPlayer_Latest.apk"
          className="mt-6 flex flex-col items-center justify-center py-4 bg-primary/10 border-2 border-primary/20 rounded-2xl mx-auto w-full max-w-[250px] shadow-[0_0_15px_rgba(255,87,34,0.1)] active:scale-95 transition-all text-primary hover:bg-primary/20"
        >
          <div className="flex items-center gap-2 mb-1">
            <Download className="w-5 h-5" />
            <span className="font-black italic uppercase text-xs">Download App Android</span>
          </div>
          <span className="text-[8px] font-bold text-slate-400">Lebih cepat. Lebih stabil.</span>
        </a>
      </div>
    </div>
  );
}

function DashboardScreen({ member, tournaments = [], venueInfo }: { member: any, tournaments?: any[], venueInfo: any }) {
  const activeSession = member.sessions?.find((s: any) => s.status === 'ACTIVE');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { setActiveTab, setSelectedTournament } = useAppStore();

  return (
    <div className="fade-in space-y-6 pb-32">
      {/* ─── NEW DISCOVERY HEADER ─── */}
      <DiscoveryHeader member={member} />

      {/* ─── HORIZONTAL DATE SELECTOR ─── */}
      <div className="pt-2">
         <HorizontalDateSelector 
            selectedDate={selectedDate} 
            onDateChange={setSelectedDate} 
         />
      </div>

      {/* ─── ACTIVE SESSION BANNER (Compact) ─── */}
      {activeSession && (
        <button onClick={() => setActiveTab('active-session')} className="w-full fiery-card-highlight p-5 flex items-center justify-between fiery-glow group">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse">
                <Flame className="w-5 h-5 text-primary" fill="currentColor" />
             </div>
             <div className="text-left">
                <p className="text-[8px] font-black text-primary uppercase tracking-widest italic leading-none mb-1">Live Play</p>
                <div className="font-black text-white uppercase italic text-base leading-none">Table: {activeSession?.table?.name}</div>
             </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* ─── FEATURED CONTENT ─── */}
      <div className="space-y-2">
         <div className="flex justify-between items-baseline px-1 mb-4">
            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Ongoing Events</h3>
            <button className="text-[10px] font-black text-slate-500 hover:text-primary uppercase tracking-widest transition-colors">View More</button>
         </div>

         {/* Mapping Tournaments to Premium Cards */}
         <div className="flex overflow-x-auto snap-x gap-4 hide-scrollbar pb-4 items-stretch">
         {tournaments.length > 0 ? tournaments.map((t: any, i: number) => (
            <div key={t.id || i} className="min-w-[88%] lg:min-w-[80%] snap-center shrink-0 w-full flex flex-col space-y-3">
              <FeaturedBookingCard 
                title={t.name}
                location={venueInfo?.name || "Vamos Arena"}
                prizePool={t.prizePool ? `RP ${(t.prizePool/1000).toLocaleString()}K` : undefined}
                entryFee={t.entryFee ? `RP ${(t.entryFee/1000).toLocaleString()}K` : "FREE"}
                players={`${t.participants?.length || 0}/${t.maxPlayers || 32}`}
                status={t.status === 'ONGOING' ? 'Open' : 'Private'}
                startsIn={t.status === 'ONGOING' ? "3h" : undefined}
                isPremium={i === 0}
                onJoin={() => { setSelectedTournament(t); setActiveTab('tournaments'); }}
              />
              {(t.name || '').toLowerCase().includes('arisan') && t.participants?.length > 0 && (
                <div className="bg-[#1a1f35]/50 border border-white/5 p-4 rounded-3xl group animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <p className="text-[9px] font-black text-primary uppercase italic tracking-[0.2em]">Live Participants</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase italic">{t.participants.length} Active</p>
                  </div>
                  <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
                    {t.participants.slice(0, 9).map((p: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1 opacity-80 overflow-hidden">
                         <span className="text-[7px] font-black text-slate-700 w-2.5 shrink-0">{idx + 1}</span>
                         <span className="text-[9px] font-black text-slate-300 uppercase italic truncate">{(p.name || p.member?.name || '...').split(' ')[0]}</span>
                         {p.handicap && <span className="text-[7px] font-bold text-primary shrink-0">H{p.handicap}</span>}
                      </div>
                    ))}
                    {t.participants.length > 9 && (
                      <div className="flex items-center gap-1 opacity-80">
                         <span className="text-[9px] font-black text-slate-400 italic">+{t.participants.length - 9}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
         )) : (
            <div className="min-w-[88%] lg:min-w-[80%] snap-center shrink-0 w-full flex flex-col space-y-3">
               <FeaturedBookingCard 
                 title="Friday Night League"
                 location="Marina Green, 1.8km away"
                 prizePool="RP 5,000K"
                 entryFee="RP 150K"
                 players="12/16"
                 status="Open"
                 startsIn="3hrs"
                 isPremium={true}
                 onJoin={() => { setSelectedTournament(null); setActiveTab('tournaments'); }}
               />
               <FeaturedBookingCard 
                 title="Courtside Futsal Night"
                 location="City Sports Complex, 1.1 km"
                 prizePool="RP 2,000K"
                 entryFee="RP 85K"
                 players="8/12"
                 status="Open"
                 onJoin={() => { setSelectedTournament(null); setActiveTab('tournaments'); }}
               />
            </div>
         )}
         </div>
      </div>

      {/* ─── SECONDARY SECTION ─── */}
      <div className="space-y-4 pt-4">
         <div className="flex justify-between items-baseline px-1">
            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Pesan Meja</h3>
         </div>

         <div className="space-y-3">
             <button onClick={() => setActiveTab('booking')} className="w-full relative overflow-hidden p-6 rounded-[2rem] border-2 border-white/5 bg-gradient-to-br from-[#1a1f35]/50 to-[#0a0f1d]/50 text-left group transition-all hover:border-primary/30">
               <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />
               <div className="absolute top-2 right-4 w-12 h-12 bg-[#0a0f1d] rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                 <LayoutGrid className="w-5 h-5 text-primary" />
               </div>
               <div className="relative z-10 w-[70%]">
                 <h4 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2 leading-none">Reservasi Meja</h4>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-6">Tanpa antri, langsung main</p>
                 <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest italic">
                   <span>Mulai Pesan</span>
                   <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                 </div>
               </div>
               <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-tl-full blur-[20px] pointer-events-none" />
             </button>
         </div>
      </div>

      {/* Keep Identity Stats (Balance/Level) but smaller or moved */}
      <div className="grid grid-cols-2 gap-3 pt-6">
         <div className="bg-[#101423] border border-white/5 p-4 rounded-[24px]">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic mb-2">Loyalty Points</p>
            <p className="text-xl font-black text-white italic leading-none">{member.loyaltyPoints || 0} <span className="text-[8px] text-primary">PTS</span></p>
         </div>
         <div className="bg-[#101423] border border-white/5 p-4 rounded-[24px]">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic mb-2">Member Standing</p>
            <p className="text-xl font-black text-white italic leading-none uppercase">Level {member.level || 1}</p>
         </div>
      </div>

      <div className="pt-4">
         <VerificationCard member={member} venueInfo={venueInfo} />
      </div>
    </div>
  );
}

function TournamentScreen({ activeTournaments }: { member: any, activeTournaments: any[] }) {
  const { selectedTournament, setSelectedTournament } = useAppStore();
  const tournament = selectedTournament || activeTournaments[0] || MOCK_TOURNAMENT;
  const isOngoing = tournament.status === 'ONGOING' || tournament.status === 'IN_PROGRESS';
  const isPending = tournament.status === 'PENDING' || tournament.status === 'UPCOMING' || !tournament.status;
  
  const [activeView, setActiveView] = useState<'info' | 'bracket' | 'rankings'>(isOngoing ? 'bracket' : 'info');
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isCompact, setIsCompact] = useState((tournament?.name || '').toLowerCase().includes('arisan'));
  const [paymentRef, setPaymentRef] = useState('');
  const [aliasName, setAliasName] = useState('');
  const [loadingReg, setLoadingReg] = useState(false);
  const { refreshMemberData } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const participantList = (tournament?.participants || []).map((p: any) => ({ 
    ...p, 
    displayName: p.name || p.member?.name || 'Unknown' 
  }));
  const filteredParticipants = participantList.filter((p: any) => (p.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const handleRegister = async () => {
    setLoadingReg(true);
    try {
      const res = await api.post(`/player/tournaments/${tournament.id}/register`, { 
        paymentRef,
        name: aliasName 
      });
      if (res.data.success) {
        alert('Registration request sent! Please wait for admin approval.');
        setIsRegModalOpen(false);
        setAliasName('');
        setPaymentRef('');
        refreshMemberData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mendaftar. Silakan hubungi admin atau periksa koneksi Anda.');
    } finally {
      setLoadingReg(false);
    }
  };

  return (
    <div className="fade-in space-y-8 pb-32">
      <div className="flex items-center px-4 pt-8">
        <button onClick={() => setSelectedTournament(null)} className="w-10 h-10 rounded-[18px] bg-[#1a1f35] flex items-center justify-center text-white border border-white/5 active:scale-90 transition-all shadow-lg">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center -ml-10">
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-white leading-none">PUSAT <span className="text-primary italic">TURNAMEN</span></h1>
        </div>
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
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter mb-8">{tournament.name}</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
               <div className="bg-[#101423] p-4 rounded-[24px] border border-white/5">
                 <p className="text-[8px] text-slate-600 font-extrabold uppercase tracking-[0.2em] italic mb-1">Prize Pool</p>
                 <p className="text-lg font-black text-white italic tracking-tighter leading-none">RP {(tournament.prizePool || 0).toLocaleString()}</p>
               </div>
               <div className="bg-[#101423] p-4 rounded-[24px] border border-white/5">
                 <p className="text-[8px] text-slate-600 font-extrabold uppercase tracking-[0.2em] italic mb-1">Format</p>
                 <p className="text-lg font-black text-white italic tracking-tighter leading-none uppercase">{tournament.format || 'Single Elim'}</p>
               </div>
               <div className="bg-[#101423] p-4 rounded-[24px] border border-white/5 col-span-2 flex items-center justify-between">
                 <div>
                   <p className="text-[8px] text-slate-600 font-extrabold uppercase tracking-[0.2em] italic mb-1">Schedule</p>
                   <p className="text-xs font-black text-white italic tracking-widest leading-none uppercase">
                     {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBA'}
                     {tournament.endDate ? ` - ${new Date(tournament.endDate).toLocaleDateString()}` : ''}
                   </p>
                 </div>
                 <div className="bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-[9px] font-black uppercase italic border border-primary/30">
                   Jadwal
                 </div>
               </div>
            </div>

            {tournament.prizeChampion > 0 && (
               <div className="mb-6 relative z-10 bg-[#1a1f35]/30 border border-white/5 p-5 rounded-[24px]">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <h3 className="text-[10px] font-black text-white uppercase italic tracking-widest">Award Protocols</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                      <span className="text-[9px] font-black text-slate-400 uppercase italic">Champion 1st</span>
                      <span className="text-xs font-black text-yellow-500 italic">RP {tournament.prizeChampion.toLocaleString()}</span>
                    </div>
                    {tournament.prizeRunnerUp > 0 && (
                      <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                        <span className="text-[9px] font-black text-slate-400 uppercase italic">Runner Up 2nd</span>
                        <span className="text-xs font-black text-slate-300 italic">RP {tournament.prizeRunnerUp.toLocaleString()}</span>
                      </div>
                    )}
                    {tournament.prizeSemiFinal > 0 && (
                      <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                        <span className="text-[9px] font-black text-slate-400 uppercase italic">Semi-Final 3/4</span>
                        <span className="text-xs font-black text-slate-400 italic">RP {tournament.prizeSemiFinal.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
               </div>
            )}

            {tournament.description && (
              <div className="mb-6 relative z-10 bg-[#1a1f35]/50 border border-white/5 p-5 rounded-[24px]">
                 <div className="flex items-center gap-2 mb-3">
                   <Swords className="w-4 h-4 text-primary" />
                   <h3 className="text-[10px] font-black text-white uppercase italic tracking-widest">Event Description</h3>
                 </div>
                 <p className="text-[10px] text-slate-400 font-medium leading-relaxed whitespace-pre-wrap">{tournament.description}</p>
              </div>
            )}

            {tournament.rules && (
              <div className="mb-10 relative z-10 bg-primary/5 border border-primary/10 p-5 rounded-[24px]">
                 <div className="flex items-center gap-2 mb-3">
                   <ScrollText className="w-4 h-4 text-primary" />
                   <h3 className="text-[10px] font-black text-white uppercase italic tracking-widest">Technical Rules</h3>
                 </div>
                 <p className="text-[10px] text-primary/80 font-bold leading-relaxed whitespace-pre-wrap italic">{tournament.rules}</p>
              </div>
            )}

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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Nama Peserta / Alias <span className="text-primary opacity-60">(Tim/Sponsor)</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      value={aliasName}
                      onChange={e => setAliasName(e.target.value)}
                      placeholder="Contoh: Arif Vamos, Akil 55..."
                      className="w-full bg-[#101423] border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary text-white font-medium placeholder:text-slate-700 transition-all"
                    />
                    <User className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-2 px-1 italic">Kosongkan jika ingin menggunakan nama profil Anda.</p>
                </div>

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
                     <div className="flex overflow-x-auto snap-x space-x-8 pb-6 hide-scrollbar items-stretch min-h-[450px]">
                         {sortedRounds.map((roundNum) => {
                             const roundMatches = matchesByRound[roundNum].sort((a: any, b: any) => a.matchNumber - b.matchNumber);
                             return (
                                 <div key={roundNum} className="flex flex-col min-w-[280px] snap-center py-2 shrink-0">
                                     <h4 className="text-center text-[10px] text-slate-500 font-black uppercase mb-6 italic tracking-[0.2em] relative">
                                        <span className="bg-[#0a0d18] px-3 relative z-10">ROUND {roundNum}</span>
                                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 z-0"></div>
                                     </h4>
                                     <div className="flex flex-col justify-around flex-1 space-y-6 relative">
                                     {roundMatches.map((m: any) => {
                                         const p1 = tournament.participants?.find((p: any) => p.id === m.player1Id);
                                         const p2 = tournament.participants?.find((p: any) => p.id === m.player2Id);
                                         const p1Name = p1 ? (p1.name || p1.member?.name) : 'TBD';
                                         const p2Name = p2 ? (p2.name || p2.member?.name) : 'TBD';
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
            <div className="flex gap-2">
              <div className="flex-1 bg-[#1a1f35]/50 flex items-center px-6 py-4 rounded-2xl border border-white/5">
                <input 
                  className="bg-transparent focus:outline-none text-sm w-full font-bold placeholder:text-slate-600 text-white uppercase italic" 
                  placeholder="Cari nama peserta..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                />
              </div>
              <button 
                onClick={() => setIsCompact(!isCompact)}
                className={`px-4 py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${isCompact ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-[#1a1f35]/50 border-white/5 text-slate-500'}`}
                title="Screenshot mode (Compact)"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase italic hidden sm:inline">Compact</span>
              </button>
              {isCompact && (
                <button 
                  onClick={() => {
                    const text = `*LIST PESERTA: ${tournament.name}*\n\n` + 
                      filteredParticipants.map((p: any, i: number) => `${i+1}. ${p.displayName} ${p.handicap ? `(HC: ${p.handicap})` : ''}`).join('\n') +
                      `\n\n_Generated by Vamos Player App_`;
                    
                    // Copy to clipboard
                    navigator.clipboard.writeText(text);
                    
                    // Open WA
                    const waUrl = `https://wa.me?text=${encodeURIComponent(text)}`;
                    window.open(waUrl, '_blank');
                  }}
                  className="px-4 py-4 rounded-2xl border border-white/5 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  title="Share list to WhatsApp"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-[9px] font-black uppercase italic hidden sm:inline">Share WA</span>
                </button>
              )}
            </div>
            {filteredParticipants.length === 0 ? (
                <div className="fiery-card py-20 text-center border-dashed border-white/10 opacity-70">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Belum ada peserta yang mendaftar.</p>
                </div>
            ) : isCompact ? (
                <div className="grid grid-cols-2 gap-2">
                   {filteredParticipants.map((p: any, i: number) => (
                      <div key={p.id || i} className="bg-[#1a1f35]/50 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                         <div className="text-[8px] font-black text-slate-500 w-4 text-center shrink-0">{i + 1}</div>
                         <div className="flex-1 min-w-0 flex items-baseline gap-2">
                            <p className="font-black text-white text-[10px] uppercase italic truncate">{p.displayName}</p>
                            {p.handicap && <span className="text-[8px] font-bold text-primary italic shrink-0">HC {p.handicap}</span>}
                         </div>
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)] shrink-0" />
                      </div>
                   ))}
                </div>
            ) : (
                filteredParticipants.map((p: any, i: number) => (
                  <div key={p.id || i} className="fiery-card p-6 rounded-3xl flex items-center justify-between border border-white/5 bg-[#1a1f35]/30">
                    <div className="flex items-center gap-5"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 ${i < 3 ? 'border-primary bg-primary/20 text-white' : 'border-slate-800 text-slate-500'}`}>{i + 1}</div><div><p className="font-black text-white text-base uppercase italic">{p.displayName}</p></div></div>
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

function VerificationCard({ member, venueInfo }: { member: any, venueInfo: any }) {
  const { refreshMemberData } = useAppStore();
  const [uploading, setUploading] = useState(false);
  const handleVerifyWa = () => {
    api.post(`/player/${member.id}/notify-verify`).catch(() => {});
    const adminPhone = venueInfo?.phone || "6281244047610";
    const waText = venueInfo?.waVerificationText || "Halo Vamos Pool, saya ingin verifikasi akun member saya dengan ID:";
    window.open(`https://wa.me/${adminPhone.replace(/\+/g, '')}?text=${encodeURIComponent(waText)}%20${member.id}`, '_blank');
  };
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await api.post(`/player/${member.id}/avatar`, formData);
      if (res.data.success) refreshMemberData();
    } catch (err: any) { alert(err.response?.data?.message || 'Gagal mengunggah foto.'); }
    finally { setUploading(false); }
  };
  return (
    <div className="fiery-card p-10 relative overflow-hidden group">
      <div className="flex justify-between items-center mb-8 relative z-10"><div><p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic">Security Protocol</p><h3 className="text-2xl font-black text-white uppercase italic">PROFIL MEMBER</h3></div></div>
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between p-5 rounded-[28px] bg-[#101423] border border-white/5"><div className="flex items-center gap-5"><div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border ${member.isWaVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'text-slate-700 border-white/5'}`}><CheckCircle2 className="w-6 h-6" /></div><div><p className="text-sm font-black text-white uppercase italic">WhatsApp Protocol</p></div></div>{member.isWaVerified ? <div className="px-5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase italic border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">VERIFIED</div> : <button onClick={handleVerifyWa} className="px-5 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase italic border border-primary/20">Verify</button>}</div>
        <div className="flex items-center justify-between p-5 rounded-[28px] bg-[#101423] border border-white/5"><div className="flex items-center gap-5"><div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border ${member.photo ? 'bg-primary/10 text-primary' : 'text-slate-700'}`}><User className="w-6 h-6" /></div><div><p className="text-sm font-black text-white uppercase italic">Foto Profil</p></div></div>{getAvatarUrl(member.photo) ? <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-lg overflow-hidden border border-primary/30"><img src={getAvatarUrl(member.photo)!} alt="" className="w-full h-full object-cover" /></div><label className="text-[9px] font-black text-primary cursor-pointer border-b border-primary/30 pb-0.5">REPLACE<input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} /></label></div> : <label className="px-5 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase italic cursor-pointer">{uploading ? 'SYNC' : 'UPLOAD'}<input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading}/></label>}</div>
      </div>
    </div>
  );
}

function ProfileScreen({ member, onLogout }: { member: any, onLogout: () => void }) {
  const [view, setView] = useState<'main' | 'history'>('main');
  const [uploading, setUploading] = useState(false);
  const [rankData, setRankData] = useState<{ globalRank: number | null; totalWins: number; monthlyScore: number; tier: string } | null>(null);
  const [loadingRank, setLoadingRank] = useState(true);
  const { refreshMemberData, setActiveTab } = useAppStore();

  useEffect(() => {
    const fetchRank = async () => {
      setLoadingRank(true);
      try {
        const res = await api.get('/player/leaderboard');
        const lb = res.data.data;
        const allTime: any[] = lb.allTime || [];
        const monthly: any[] = lb.monthly || [];
        const idx = allTime.findIndex((p: any) => p.id === member.id);
        const monthlyEntry = monthly.find((p: any) => p.id === member.id);
        const entry = allTime[idx] || {};
        setRankData({
          globalRank: idx >= 0 ? idx + 1 : null,
          totalWins: entry.totalWins ?? member.totalWins ?? 0,
          monthlyScore: monthlyEntry?.monthlyScore ?? 0,
          tier: entry.tier ?? member.tier ?? 'OPERATIVE',
        });
      } catch {
        setRankData({
          globalRank: null,
          totalWins: member.totalWins ?? 0,
          monthlyScore: 0,
          tier: member.tier ?? 'OPERATIVE',
        });
      } finally {
        setLoadingRank(false);
      }
    };
    fetchRank();
  }, [member.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await api.post(`/player/${member.id}/avatar`, formData);
      if (res.data.success) refreshMemberData();
    } catch (err: any) { alert(err.response?.data?.message || 'Gagal mengunggah foto.'); }
    finally { setUploading(false); }
  };

  if (view === 'history') return <HistoryScreen member={member} onBack={() => setView('main')} />;

  const tierColors: Record<string, string> = {
    CHAMPION: '#ff5722', ELITE: '#a855f7', VETERAN: '#3b82f6',
    OPERATIVE: '#10b981', ROOKIE: '#94a3b8',
  };
  const tierColor = tierColors[rankData?.tier?.toUpperCase() ?? ''] ?? '#94a3b8';

  return (
    <div className="fade-in space-y-6 pb-32">
      {/* ─── Header ─── */}
      <div className="text-center pt-8">
        <h1 className="text-2xl font-black italic text-white uppercase">PROFIL</h1>
      </div>

      {/* ─── Avatar & Name ─── */}
      <div className="flex flex-col items-center">
        <div className="relative mb-5">
          <div className="w-36 h-36 rounded-[44px] bg-[#1a1f35] p-1 border-4 border-white/5 shadow-2xl overflow-hidden">
            {member.photo
              ? <img src={getAvatarUrl(member.photo)!} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><User className="w-14 h-14 text-slate-700" /></div>}
          </div>
          <label className={`absolute -bottom-2 -right-2 p-3 rounded-2xl border-4 border-[#070b14] cursor-pointer transition-all ${uploading ? 'bg-slate-600 animate-pulse' : 'bg-primary'}`}>
            {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
          </label>
        </div>
        <h2 className="text-2xl font-black text-white italic uppercase leading-none">{member.name}</h2>
        <div className="flex items-center gap-2 mt-2">
          {member.isWaVerified && (
            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase italic tracking-widest">
              ✓ Verified
            </span>
          )}
          <span className="text-[9px] font-black uppercase italic tracking-widest px-3 py-1 rounded-full border" style={{ color: tierColor, borderColor: `${tierColor}33`, backgroundColor: `${tierColor}15` }}>
            {rankData?.tier ?? '...'}
          </span>
        </div>
      </div>

      {/* ─── RANKING STATS CARD ─── */}
      <div className="fiery-card p-6 rounded-[32px] border-2 border-amber-500/15 bg-amber-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none" />
        <div className="flex justify-between items-center mb-5 relative z-10">
          <div>
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] italic mb-1">Ranking Stats</p>
            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">Statistik Peringkat</h3>
          </div>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl text-amber-500 text-[10px] font-black uppercase italic tracking-widest hover:bg-amber-500/20 transition-all"
          >
            <Trophy className="w-4 h-4" />
            Lihat
          </button>
        </div>

        {loadingRank ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500/50" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 relative z-10">
            {/* Global Rank */}
            <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5 col-span-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-1">Posisi Global</p>
              <div className="flex items-end gap-2">
                {rankData?.globalRank ? (
                  <>
                    <span className="text-4xl font-black text-amber-400 italic tracking-tighter leading-none">#{rankData.globalRank}</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase italic mb-1">di Leaderboard</span>
                  </>
                ) : (
                  <span className="text-lg font-black text-slate-600 italic uppercase">Belum Terdaftar</span>
                )}
              </div>
            </div>

            {/* Total Wins */}
            <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2">Kemenangan</p>
              <p className="text-3xl font-black text-emerald-400 italic tracking-tighter leading-none">{rankData?.totalWins ?? 0}<span className="text-[11px] text-slate-500 ml-1 not-italic">W</span></p>
            </div>

            <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2">XP</p>
              <p className="text-3xl font-black text-blue-400 italic tracking-tighter leading-none">{rankData?.monthlyScore ?? 0}<span className="text-[11px] text-slate-500 ml-1 not-italic">XP</span></p>
            </div>

            {/* Level */}
            <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2">Level</p>
              <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{member.level ?? 1}</p>
            </div>

            {/* Loyalty Points */}
            <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2">Loyalty</p>
              <p className="text-3xl font-black text-yellow-400 italic tracking-tighter leading-none">{member.loyaltyPoints ?? 0}<span className="text-[11px] text-slate-500 ml-1 not-italic">PTS</span></p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Handicap Card ─── */}
      {member.handicapLabel && (
        <div className="fiery-card p-6 rounded-[28px] border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] italic mb-1">Official Handicap</p>
            <p className="text-xl font-black text-white italic uppercase tracking-tighter">{member.handicapLabel}</p>
          </div>
          <TrendingUp className="w-6 h-6 text-amber-500" />
        </div>
      )}

      {/* ─── Menu Items ─── */}
      <div className="space-y-3">
        <button onClick={() => setView('history')} className="w-full fiery-card flex items-center justify-between p-6 rounded-[28px] border-2 border-white/5 group">
          <div className="flex items-center gap-5">
            <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center"><Swords className="w-5 h-5 text-primary" /></div>
            <span className="font-black text-white text-sm uppercase italic">Riwayat Arena</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>

        <a href="/VamosPlayer.apk" download="VamosPlayer_Latest.apk" className="w-full fiery-card flex items-center justify-between p-6 rounded-[28px] border-2 border-primary/20 group hover:bg-primary/5 transition-all">
          <div className="flex items-center gap-5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <span className="font-black text-white text-sm uppercase italic block leading-none">Aplikasi Android</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 block">Pasang di Layar Utama HP Anda</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary/50 group-hover:text-primary transition-all" />
        </a>

        <button onClick={onLogout} className="w-full py-5 rounded-[24px] mt-6 font-black text-[10px] uppercase bg-rose-500/10 text-rose-500 border-2 border-rose-500/20 italic tracking-widest">
          Keluar Profil
        </button>
      </div>
    </div>
  );
}

function MainApp({ venueInfo }: { venueInfo: any }) {
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
            // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <div className="flex justify-between items-center px-6 pt-10 pb-4 relative z-30">
        <div className="flex items-center gap-3"><VamosLogo className="w-10 h-10" glowing /><h1 onClick={() => setActiveTab('dashboard')} className="text-xl font-black italic uppercase cursor-pointer leading-none">{venueInfo?.name?.split(' ')[0] || "VAMOS"}<span className="text-primary italic">{venueInfo?.name?.split(' ')[1] || "POOL"}</span></h1></div>
        <div className="flex items-center gap-3"><div className="bg-[#101423] p-1.5 rounded-[12px] flex items-center gap-2 border border-white/10"><Star className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" /><span className="text-xs font-black text-white">{member.loyaltyPoints ?? 0}</span></div><button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-[14px] bg-[#101423] overflow-hidden border border-white/10">{getAvatarUrl(member.photo) ? <img src={getAvatarUrl(member.photo)!} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#1a1f35] flex items-center justify-center text-primary font-black">{member.name?.[0]}</div>}</button></div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-32 relative z-10">
        {activeTab === 'dashboard' && <DashboardScreen member={member} tournaments={tournaments} venueInfo={venueInfo} />}
        {activeTab === 'play' && <PlayScreen member={member} />}
        {activeTab === 'leaderboard' && <LeaderboardScreen leaderboard={leaderboard} currentUser={member} />}
        {activeTab === 'tournaments' && <TournamentScreen activeTournaments={tournaments} member={member} />}
        {activeTab === 'rewards' && <RewardsScreen />}
        {activeTab === 'booking' && <BookingScreen />}
        {activeTab === 'active-session' && <ActiveSessionScreen />}
        {activeTab === 'profile' && <ProfileScreen member={member} onLogout={() => useAppStore.getState().logout()} />}
        {activeTab === 'menu' && <MenuScreen />}
      </div>
      <nav className="fiery-nav fiery-glass mx-4 mb-2 !bottom-4 !left-2 !right-2 rounded-[28px] py-3 px-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5">
        {[
          {id:'dashboard', icon:LayoutGrid, label:'Home'},
          {id:'play',      icon:Swords,     label:'Arena'},
          {id:'leaderboard', icon:Trophy,   label:'Ranking'},
          {id:'rewards',   icon:Star,       label:'Store'},
          {id:'profile',   icon:User,       label:'Profil'},
        ].map(item => {
          const isActive = activeTab === item.id;
          return (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as any)} 
              className={`nav-item flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'active translate-y-[-6px]' : 'opacity-40'}`}
            >
              <div className={`icon-container p-2.5 rounded-2xl transition-all duration-500 ${isActive ? 'bg-primary shadow-[0_5px_15px_rgba(255,87,34,0.4)] text-white' : 'text-slate-400'}`}>
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 3 : 2} />
              </div>
              {isActive && (
                <div className="w-1 h-1 bg-primary rounded-full mt-1 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function App() { 
  const [showSplash, setShowSplash] = useState(true);
  const [venueInfo, setVenueInfo] = useState<any>(null);

  useEffect(() => {
    api.get('/player/venues').then(res => {
      if (res.data.success && res.data.data.length > 0) {
        setVenueInfo(res.data.data[0]);
      }
    }).catch(() => {});
  }, []);

  
  return (
    <>
      {showSplash && (
        <SplashScreen 
          duration={3000} 
          logoUrl={venueInfo?.splashImageUrl}
          title={venueInfo?.name || "ARENA FIGHT"}
          onComplete={() => setShowSplash(false)} 
        />
      )}
      <MainApp venueInfo={venueInfo} />
    </>
  );
}
