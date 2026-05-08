import { useState } from 'react';
import { ArrowLeft, X, User, Zap, Trophy, Swords, ScrollText, Camera, Share2, Loader2, ChevronRight } from 'lucide-react';
import { api } from '../api';
import { useAppStore } from '../store/appStore';

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

export function TournamentScreen({ activeTournaments }: { member: any, activeTournaments: any[] }) {
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
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const { member } = useAppStore();

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
                                         const isLive = m.status === 'ONGOING' || m.status === 'LIVE';
                                         const isMyMatch = m.player1Id === member?.id || m.player2Id === member?.id;

                                         return (
                                             <div 
                                               key={m.id} 
                                               onClick={() => setSelectedMatch(m)}
                                               className={`fiery-card rounded-3xl bg-[#1a1f35]/50 border shadow-lg relative z-10 w-full overflow-hidden transition-all active:scale-95 cursor-pointer ${isMyMatch ? 'border-primary shadow-primary/20' : 'border-white/5'}`}
                                             >
                                                 {isLive && (
                                                   <div className="absolute top-0 right-0 p-2 flex items-center gap-1.5">
                                                     <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]" />
                                                     <span className="text-[7px] font-black text-red-500 uppercase tracking-widest italic">LIVE</span>
                                                   </div>
                                                 )}
                                                 <div className={`p-4 flex justify-between items-center border-b border-white/5 ${isP1Winner ? 'bg-primary/10' : ''}`}>
                                                     <div className="flex flex-col truncate pr-4">
                                                         <div className="flex items-center gap-2">
                                                           <span className={`font-black uppercase tracking-widest text-[11px] italic truncate ${isP1Winner ? 'text-primary' : 'text-white'}`}>{p1Name}</span>
                                                           {m.player1Id === member?.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_#ff5722]" />}
                                                         </div>
                                                         {p1?.handicap && <span className="text-[8px] text-primary/70 font-black uppercase mt-0.5">HC: {p1.handicap}</span>}
                                                     </div>
                                                     <span className={`font-black text-sm italic ${isP1Winner ? 'text-primary' : 'text-slate-500'}`}>{m.score1 !== null ? m.score1 : '-'}</span>
                                                 </div>
                                                 <div className={`p-4 flex justify-between items-center ${isP2Winner ? 'bg-primary/10' : ''}`}>
                                                     <div className="flex flex-col truncate pr-4">
                                                         <div className="flex items-center gap-2">
                                                           <span className={`font-black uppercase tracking-widest text-[11px] italic truncate ${isP2Winner ? 'text-primary' : 'text-white'}`}>{p2Name}</span>
                                                           {m.player2Id === member?.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_#ff5722]" />}
                                                         </div>
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

      {/* ─── MATCH DETAIL MODAL ─── */}
      {selectedMatch && (
        <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-[#0a0f1d]/90 backdrop-blur-md" onClick={() => setSelectedMatch(null)} />
          <div className="relative w-full max-w-sm bg-[#101423] rounded-t-[32px] sm:rounded-[32px] p-8 border-t sm:border border-white/10 scale-in-bottom sm:scale-in">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xs font-black text-primary uppercase italic tracking-[0.2em]">Match Protocols</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Arena Detail & Operational Status</p>
              </div>
              <button onClick={() => setSelectedMatch(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Table Number */}
              <div className="bg-[#1a1f35]/50 p-6 rounded-[24px] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Table Location</p>
                  <p className="text-xl font-black text-white italic uppercase tracking-tighter">Table {selectedMatch.tableNumber || '??'}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center">
                   <Trophy className="w-6 h-6 text-primary" />
                </div>
              </div>

              {/* Player Comparison */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: selectedMatch.player1Id, score: selectedMatch.score1 },
                  { id: selectedMatch.player2Id, score: selectedMatch.score2 }
                ].map((pData, idx) => {
                  const p = tournament.participants?.find((p: any) => p.id === pData.id);
                  const isMe = pData.id === member?.id;
                  return (
                    <div key={idx} className={`p-4 rounded-[24px] border ${isMe ? 'bg-primary/10 border-primary/30' : 'bg-[#1a1f35]/30 border-white/5'}`}>
                      <p className="text-[8px] text-slate-600 font-black uppercase mb-2">Player {idx + 1}</p>
                      <p className="text-[11px] font-black text-white uppercase italic truncate mb-1">{p?.name || p?.member?.name || 'TBD'}</p>
                      <p className="text-[9px] text-primary/70 font-black uppercase">HC: {p?.handicap || '-'}</p>
                      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500">SCORE</span>
                        <span className="text-xl font-black text-white italic">{pData.score !== null ? pData.score : '-'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Time / Status */}
              <div className="bg-black/20 p-5 rounded-[24px] border border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase italic">Start Protocol</span>
                  <span className="text-[10px] font-black text-white italic uppercase tracking-wider">{selectedMatch.startTime || 'Scheduled'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase italic">Match Status</span>
                  <div className="flex items-center gap-2">
                    {selectedMatch.status === 'ONGOING' && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                    <span className={`text-[10px] font-black uppercase italic ${selectedMatch.status === 'ONGOING' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {selectedMatch.status || 'Waiting'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedMatch(null)}
              className="w-full mt-8 py-5 fiery-btn-primary rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] italic"
            >
              KEMBALI KE BAGAN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShieldCheck({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
