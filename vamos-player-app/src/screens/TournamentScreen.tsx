import { useState, useEffect } from 'react';
import { ArrowLeft, X, User, Trophy, Swords, ScrollText, Camera, Share2, Loader2, ChevronRight, CheckCircle2, Users, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { useAppStore } from '../store/appStore';
import { MyMatchTrackerCard } from '../components/MyMatchTrackerCard';
import { TournamentPodiumCard } from '../components/TournamentPodiumCard';

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
  const { selectedTournament, setSelectedTournament, setActiveTab, member, refreshMemberData, tournamentInitialView } = useAppStore();
  const tournament = selectedTournament || activeTournaments[0] || MOCK_TOURNAMENT;
  const isPending = tournament.status === 'PENDING' || tournament.status === 'UPCOMING' || !tournament.status;
  
  const [activeView, setActiveView] = useState<'info' | 'bracket' | 'rankings'>(tournamentInitialView || 'info');
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isCompact, setIsCompact] = useState((tournament?.name || '').toLowerCase().includes('arisan'));

  useEffect(() => {
    if (tournamentInitialView) {
      setActiveView(tournamentInitialView);
    }
  }, [tournamentInitialView, selectedTournament?.id]);
  
  // Registration form states
  const [slotOption, setSlotOption] = useState<'1' | '2'>('1'); // 1 nama atau 2 nama
  const [nameSlot1, setNameSlot1] = useState(member?.name || '');
  const [nameSlot2, setNameSlot2] = useState('');
  const [loadingReg, setLoadingReg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  // Check how many slots current member already has
  const myRegistrations = (tournament?.participants || []).filter((p: any) => p.memberId === member?.id);
  const mySlotCount = myRegistrations.length; // 0, 1, or 2
  const maxSlotsReached = mySlotCount >= 2;

  const participantList = (tournament?.participants || [])
    .map((p: any) => ({ 
      ...p, 
      displayName: (p.name || p.member?.name || 'Unknown').trim().toUpperCase()
    }))
    .sort((a: any, b: any) => (a.displayName || '').localeCompare(b.displayName || '', 'id-ID', { sensitivity: 'base' }));
  const filteredParticipants = participantList.filter((p: any) => (p.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const handleOpenRegister = () => {
    setNameSlot1(member?.name || '');
    setNameSlot2(member?.name ? `${member.name} (Slot 2)` : '');
    // If user already registered 1 slot, default to 1 slot for the second name
    setSlotOption(mySlotCount === 1 ? '1' : '1');
    setIsRegModalOpen(true);
  };

  const handleRegister = async () => {
    setLoadingReg(true);
    try {
      if (mySlotCount === 1) {
        // Register 2nd slot only
        const nameToUse = nameSlot1.trim() || `${member?.name || 'Peserta'} (Slot 2)`;
        const res = await api.post(`/player/tournaments/${tournament.id}/register`, { 
          memberId: member?.id,
          name: nameToUse 
        });
        if (res.data.success) {
          alert(`Pendaftaran slot ke-2 (${nameToUse}) berhasil! Pembayaran dapat diselesaikan di kasir.`);
        }
      } else if (slotOption === '2') {
        // Register 2 slots at once
        const name1 = nameSlot1.trim() || member?.name || 'Peserta 1';
        const name2 = nameSlot2.trim() || `${member?.name || 'Peserta'} (Slot 2)`;
        
        await api.post(`/player/tournaments/${tournament.id}/register`, { 
          memberId: member?.id,
          name: name1 
        });
        await api.post(`/player/tournaments/${tournament.id}/register`, { 
          memberId: member?.id,
          name: name2 
        });
        alert(`Pendaftaran 2 nama (${name1} & ${name2}) berhasil! Pembayaran dapat diselesaikan di kasir.`);
      } else {
        // Register 1 slot
        const nameToUse = nameSlot1.trim() || member?.name || 'Peserta';
        const res = await api.post(`/player/tournaments/${tournament.id}/register`, { 
          memberId: member?.id,
          name: nameToUse 
        });
        if (res.data.success) {
          alert(`Pendaftaran (${nameToUse}) berhasil! Pembayaran dapat diselesaikan di kasir.`);
        }
      }

      setIsRegModalOpen(false);
      setNameSlot1('');
      setNameSlot2('');
      refreshMemberData();
      // Refetch tournament if possible
      if (selectedTournament?.id) {
        try {
          const tRes = await api.get(`/player/tournaments/${selectedTournament.id}`);
          if (tRes.data.success) {
            setSelectedTournament(tRes.data.data);
          }
        } catch (e) { console.error(e); }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mendaftar. Silakan coba lagi atau hubungi admin/kasir.');
    } finally {
      setLoadingReg(false);
    }
  };

  return (
    <div className="fade-in space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center px-4 pt-8">
        <button onClick={() => { setSelectedTournament(null); setActiveTab('dashboard'); }} className="w-10 h-10 rounded-[18px] bg-[#1a1f35] flex items-center justify-center text-white border border-white/5 active:scale-90 transition-all shadow-lg">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center -ml-10">
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-white leading-none">PUSAT <span className="text-cyan-400 italic">TURNAMEN</span></h1>
        </div>
      </div>

      {/* Tournament Switcher (When multiple active tournaments exist) */}
      {activeTournaments && activeTournaments.length > 1 && (
        <div className="mx-2 p-2 bg-[#09101f] border border-cyan-500/20 rounded-2xl space-y-1.5 shadow-lg">
          <div className="flex justify-between items-center px-2">
            <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.2em] italic">Pilih Turnamen ({activeTournaments.length} Event Aktif)</span>
            <span className="text-[7px] text-slate-500 uppercase italic font-bold">Ketuk untuk ganti</span>
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
            {activeTournaments.map((t: any, idx: number) => {
              const isSelected = (tournament?.id === t.id);
              const dateStr = t.startDate ? new Date(t.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '';
              return (
                <button
                  key={t.id || idx}
                  onClick={() => setSelectedTournament(t)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase italic tracking-wider transition-all whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 border border-cyan-400 scale-[1.02]'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{t.name}</span>
                  {dateStr && <span className={isSelected ? 'text-black/80 font-extrabold text-[8px]' : 'text-slate-500 text-[8px]'}>• {dateStr}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TOURNAMENT PODIUM & HALL OF CHAMPIONS ─── */}
      <div className="mx-2">
        <TournamentPodiumCard 
          tournament={tournament} 
          member={member} 
        />
      </div>

      {/* ─── MY LIVE & NEXT MATCH TRACKER IN TOURNAMENT ─── */}
      <div className="mx-2">
        <MyMatchTrackerCard 
          member={member} 
          tournaments={[tournament]} 
          onOpenBracket={() => setActiveView('bracket')} 
        />
      </div>

      {/* Tabs */}
      <div className="flex bg-[#09101f] p-1.5 rounded-2xl border border-cyan-500/15 mx-2">
        {[
          { id: 'info', label: 'Info' },
          { id: 'bracket', label: 'Bagan' },
          { id: 'rankings', label: `Peserta (${participantList.length})` }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveView(tab.id as any)} 
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all italic ${
              activeView === tab.id 
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' 
                : 'text-slate-500 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-2 space-y-8">
        {activeView === 'info' && (
          <div className="rounded-[28px] p-8 border border-cyan-500/20 bg-[#0d1a2e]/80 shadow-[0_0_40px_rgba(6,182,212,0.06)]">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6">{tournament.name}</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
               <div className="bg-[#09101f] p-4 rounded-[22px] border border-white/5">
                 <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] italic mb-1">Prize Pool</p>
                 <p className="text-lg font-black text-amber-400 italic tracking-tighter leading-none">RP {(tournament.prizePool || 0).toLocaleString()}</p>
               </div>
               <div className="bg-[#09101f] p-4 rounded-[22px] border border-white/5">
                 <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] italic mb-1">Format</p>
                 <p className="text-lg font-black text-white italic tracking-tighter leading-none uppercase">{tournament.format || 'Single Elim'}</p>
               </div>
               <div className="bg-[#09101f] p-4 rounded-[22px] border border-white/5 col-span-2 flex items-center justify-between">
                 <div>
                   <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] italic mb-1">Jadwal Turnamen</p>
                   <p className="text-xs font-black text-white italic tracking-widest leading-none uppercase">
                     {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}
                     {tournament.endDate ? ` - ${new Date(tournament.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                   </p>
                 </div>
                 {tournament.entryFee > 0 ? (
                   <div className="bg-cyan-500/15 text-cyan-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase italic border border-cyan-500/30">
                     HTM: Rp {Number(tournament.entryFee).toLocaleString()}
                   </div>
                 ) : (
                   <div className="bg-emerald-500/15 text-emerald-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase italic border border-emerald-500/30">
                     GRATIS (FREE)
                   </div>
                 )}
               </div>
            </div>

            {/* My Registration Status Banner */}
            {mySlotCount > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-emerald-400 uppercase italic">Anda Sudah Terdaftar ({mySlotCount}/2 Slot)</p>
                  <p className="text-[9px] text-slate-400 truncate">
                    {myRegistrations.map((r: any) => r.name || member?.name).join(', ')}
                  </p>
                </div>
                {mySlotCount === 1 && isPending && (
                  <button
                    onClick={handleOpenRegister}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black text-[9px] font-black uppercase tracking-wider italic active:scale-95 transition-all shrink-0"
                  >
                    + Tambah 1 Slot
                  </button>
                )}
              </div>
            )}

            {tournament.prizeChampion > 0 && (
               <div className="mb-6 relative z-10 bg-[#09101f]/60 border border-white/5 p-5 rounded-[24px]">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <h3 className="text-[10px] font-black text-white uppercase italic tracking-widest">Hadiah Juara</h3>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5">
                      <span className="text-[9px] font-black text-slate-400 uppercase italic">Juara 1 (Champion)</span>
                      <span className="text-xs font-black text-amber-400 italic">RP {tournament.prizeChampion.toLocaleString()}</span>
                    </div>
                    {tournament.prizeRunnerUp > 0 && (
                      <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5">
                        <span className="text-[9px] font-black text-slate-400 uppercase italic">Juara 2 (Runner Up)</span>
                        <span className="text-xs font-black text-slate-300 italic">RP {tournament.prizeRunnerUp.toLocaleString()}</span>
                      </div>
                    )}
                    {tournament.prizeSemiFinal > 0 && (
                      <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5">
                        <span className="text-[9px] font-black text-slate-400 uppercase italic">Semi Final 3/4</span>
                        <span className="text-xs font-black text-slate-400 italic">RP {tournament.prizeSemiFinal.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
               </div>
            )}

            {tournament.description && (
              <div className="mb-6 relative z-10 bg-[#09101f]/50 border border-white/5 p-5 rounded-[24px]">
                 <div className="flex items-center gap-2 mb-3">
                   <Swords className="w-4 h-4 text-cyan-400" />
                   <h3 className="text-[10px] font-black text-white uppercase italic tracking-widest">Deskripsi Turnamen</h3>
                 </div>
                 <p className="text-[10px] text-slate-400 font-medium leading-relaxed whitespace-pre-wrap">{tournament.description}</p>
              </div>
            )}

            {tournament.rules && (
              <div className="mb-8 relative z-10 bg-cyan-500/5 border border-cyan-500/15 p-5 rounded-[24px]">
                 <div className="flex items-center gap-2 mb-3">
                   <ScrollText className="w-4 h-4 text-cyan-400" />
                   <h3 className="text-[10px] font-black text-white uppercase italic tracking-widest">Peraturan & Ketentuan</h3>
                 </div>
                 <p className="text-[10px] text-cyan-300/80 font-bold leading-relaxed whitespace-pre-wrap italic">{tournament.rules}</p>
              </div>
            )}

            {/* Registration Action Buttons */}
            {isPending ? (
               maxSlotsReached ? (
                 <div className="w-full bg-emerald-500/15 border border-emerald-500/30 py-4.5 rounded-[24px] text-center text-xs font-black text-emerald-400 uppercase tracking-widest italic flex items-center justify-center gap-2">
                   <CheckCircle2 className="w-4 h-4" /> TERDAFTAR PENUH (2/2 SLOT)
                 </div>
               ) : (
                 <button 
                   onClick={handleOpenRegister} 
                   className="w-full py-4.5 rounded-[24px] text-xs font-black uppercase tracking-[0.25em] text-black italic transition-all active:scale-98 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                   style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)' }}
                 >
                   <Users className="w-4 h-4 text-black" />
                   {mySlotCount === 1 ? 'DAFTAR SLOT KE-2 SEKARANG' : 'DAFTAR TURNAMEN SEKARANG'}
                 </button>
               )
            ) : (
               <div className="w-full bg-white/5 border border-white/10 py-5 rounded-[24px] text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">
                  PENDAFTARAN DITUTUP
               </div>
            )}
          </div>
        )}

        {/* ─── MODAL PENDAFTARAN (TANPA FORM PAYMENT, SUPPORT 2 NAMA) ─── */}
        {isRegModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-5">
            <div className="absolute inset-0 bg-[#070b14]/95 backdrop-blur-xl" onClick={() => setIsRegModalOpen(false)} />
            <div className="relative w-full max-w-sm rounded-[32px] p-7 text-left border-2 border-cyan-500/30 bg-[#0d1628] shadow-[0_0_80px_rgba(6,182,212,0.2)]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Pendaftaran Turnamen</h3>
                  <p className="text-[9px] text-cyan-400 uppercase tracking-widest mt-0.5">Langsung Daftar Tanpa Pembayaran</p>
                </div>
                <button onClick={() => setIsRegModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                {/* Slot Option Selector (Hanya muncul jika member belum daftar slot sama sekali) */}
                {mySlotCount === 0 && (
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Jumlah Slot Pendaftaran:</label>
                    <div className="grid grid-cols-2 gap-2 bg-[#09101f] p-1.5 rounded-2xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setSlotOption('1')}
                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider italic transition-all ${
                          slotOption === '1' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        1 Nama (1 Slot)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSlotOption('2')}
                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider italic transition-all ${
                          slotOption === '2' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        2 Nama (2 Slot)
                      </button>
                    </div>
                  </div>
                )}

                {/* Slot 1 Input */}
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    {mySlotCount === 1 ? 'Nama Peserta Slot ke-2:' : slotOption === '2' ? 'Nama Peserta 1 (Slot 1):' : 'Nama Peserta / Alias:'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nameSlot1}
                      onChange={e => setNameSlot1(e.target.value)}
                      placeholder="Contoh: Arif Vamos, Akil 55..."
                      className="w-full bg-[#09101f] border border-white/10 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-cyan-400 text-white font-medium placeholder:text-slate-600 transition-all text-xs"
                    />
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  </div>
                </div>

                {/* Slot 2 Input (Jika memilih 2 slot sekaligus) */}
                {mySlotCount === 0 && slotOption === '2' && (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Nama Peserta 2 (Slot 2 / Partner):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nameSlot2}
                        onChange={e => setNameSlot2(e.target.value)}
                        placeholder="Contoh: Nama Partner / Slot 2..."
                        className="w-full bg-[#09101f] border border-white/10 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-cyan-400 text-white font-medium placeholder:text-slate-600 transition-all text-xs"
                      />
                      <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                )}

                {/* Info Bebas Pembayaran */}
                <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-slate-300 leading-relaxed">
                    <p className="font-black text-cyan-300 uppercase italic mb-0.5">Tanpa Pembayaran Online</p>
                    <p className="text-slate-400 text-[9px]">
                      {tournament.entryFee > 0 
                        ? `Biaya pendaftaran (Rp ${Number(tournament.entryFee * (slotOption === '2' ? 2 : 1)).toLocaleString()}) dapat dibayarkan langsung ke kasir sebelum pertandingan dimulai.`
                        : 'Pendaftaran turnamen ini gratis. Nama Anda akan langsung masuk ke daftar peserta.'}
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleRegister} 
                disabled={loadingReg}
                className="w-full mt-6 py-4 rounded-[20px] text-xs font-black uppercase tracking-[0.2em] text-black italic flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)' }}
              >
                {loadingReg ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>KONFIRMASI PENDAFTARAN</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── BRACKET VIEW ─── */}
        {activeView === 'bracket' && (
          <div className="space-y-4">
             {(!tournament.matches || tournament.matches.length === 0) ? (
                 <div className="rounded-[28px] p-16 text-center border border-dashed border-white/10 bg-[#0d1628]/40">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mx-auto mb-4">
                        <Swords className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tight mb-1">Bagan Sedang Disusun</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Bagan pertandingan akan tampil setelah admin menyusun jadwal match.</p>
                 </div>
             ) : (() => {
                 const matchesByRound = tournament.matches.reduce((acc: any, m: any) => {
                     if (!acc[m.round]) acc[m.round] = [];
                     acc[m.round].push(m);
                     return acc;
                 }, {});
                 const sortedRounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

                 return (
                     <div className="flex overflow-x-auto snap-x space-x-6 pb-6 hide-scrollbar items-stretch min-h-[450px]">
                         {sortedRounds.map((roundNum) => {
                             const roundMatches = matchesByRound[roundNum].sort((a: any, b: any) => a.matchNumber - b.matchNumber);
                             return (
                                 <div key={roundNum} className="flex flex-col min-w-[270px] snap-center py-2 shrink-0">
                                     <h4 className="text-center text-[10px] text-cyan-400 font-black uppercase mb-4 italic tracking-[0.2em] relative">
                                        <span className="bg-[#070b14] px-3 relative z-10 border border-cyan-500/20 py-1 rounded-full">ROUND {roundNum}</span>
                                     </h4>
                                     <div className="flex flex-col justify-around flex-1 space-y-4 relative">
                                     {roundMatches.map((m: any) => {
                                         const p1 = tournament.participants?.find((p: any) => p.id === m.player1Id);
                                         const p2 = tournament.participants?.find((p: any) => p.id === m.player2Id);
                                         const p1Name = p1 ? (p1.name || p1.member?.name) : 'TBD';
                                         const p2Name = p2 ? (p2.name || p2.member?.name) : 'TBD';
                                         const isP1Winner = m.score1 !== null && m.score1 > m.score2;
                                         const isP2Winner = m.score2 !== null && m.score2 > m.score1;
                                         const isLive = m.status === 'ONGOING' || m.status === 'LIVE';
                                         const isP1Me = p1?.memberId === member?.id || (p1?.name && p1.name.toLowerCase() === member?.name?.toLowerCase());
                                         const isP2Me = p2?.memberId === member?.id || (p2?.name && p2.name.toLowerCase() === member?.name?.toLowerCase());
                                         const isMyMatch = isP1Me || isP2Me;

                                         return (
                                             <div 
                                               key={m.id} 
                                               onClick={() => setSelectedMatch(m)}
                                               className={`rounded-2xl bg-[#0d1628] border shadow-lg relative z-10 w-full overflow-hidden transition-all active:scale-95 cursor-pointer ${
                                                 isMyMatch 
                                                   ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50' 
                                                   : 'border-white/5'
                                               }`}
                                             >
                                                 {isLive && (
                                                   <div className="absolute top-0 right-0 p-2 flex items-center gap-1.5 z-20">
                                                     <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                                     <span className="text-[7px] font-black text-red-500 uppercase tracking-widest italic">LIVE</span>
                                                   </div>
                                                 )}
                                                 <div className={`p-3.5 flex justify-between items-center border-b border-white/5 ${isP1Winner ? 'bg-cyan-500/10' : ''} ${isP1Me ? 'bg-cyan-500/5' : ''}`}>
                                                     <div className="flex flex-col truncate pr-3">
                                                         <div className="flex items-center gap-1.5">
                                                           <span className={`font-black uppercase tracking-wider text-[10px] italic truncate ${isP1Winner ? 'text-cyan-400' : isP1Me ? 'text-cyan-300 font-extrabold' : 'text-white'}`}>{p1Name}</span>
                                                           {isP1Me && <span className="text-[7px] font-black bg-cyan-500 text-black px-1 py-0.5 rounded uppercase leading-none">ANDA</span>}
                                                         </div>
                                                         {p1?.handicap && <span className="text-[8px] text-cyan-400/70 font-bold uppercase">HC: {p1.handicap}</span>}
                                                     </div>
                                                     <span className={`font-black text-sm italic ${isP1Winner ? 'text-cyan-400' : 'text-slate-500'}`}>{m.score1 !== null ? m.score1 : '-'}</span>
                                                 </div>
                                                 <div className={`p-3.5 flex justify-between items-center ${isP2Winner ? 'bg-cyan-500/10' : ''} ${isP2Me ? 'bg-cyan-500/5' : ''}`}>
                                                     <div className="flex flex-col truncate pr-3">
                                                         <div className="flex items-center gap-1.5">
                                                           <span className={`font-black uppercase tracking-wider text-[10px] italic truncate ${isP2Winner ? 'text-cyan-400' : isP2Me ? 'text-cyan-300 font-extrabold' : 'text-white'}`}>{p2Name}</span>
                                                           {isP2Me && <span className="text-[7px] font-black bg-cyan-500 text-black px-1 py-0.5 rounded uppercase leading-none">ANDA</span>}
                                                         </div>
                                                         {p2?.handicap && <span className="text-[8px] text-cyan-400/70 font-bold uppercase">HC: {p2.handicap}</span>}
                                                     </div>
                                                     <span className={`font-black text-sm italic ${isP2Winner ? 'text-cyan-400' : 'text-slate-500'}`}>{m.score2 !== null ? m.score2 : '-'}</span>
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

        {/* ─── PESERTA (RANKINGS / PARTICIPANTS VIEW) ─── */}
        {activeView === 'rankings' && (
          <div className="space-y-5">
            <div className="flex gap-2">
              <div className="flex-1 bg-[#09101f] flex items-center px-4 py-3.5 rounded-2xl border border-white/10">
                <input 
                  className="bg-transparent focus:outline-none text-xs w-full font-bold placeholder:text-slate-600 text-white uppercase italic" 
                  placeholder="Cari nama peserta..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                />
              </div>
              <button 
                onClick={() => setIsCompact(!isCompact)}
                className={`px-4 py-3.5 rounded-2xl border transition-all flex items-center justify-center gap-1.5 ${isCompact ? 'bg-cyan-500 border-cyan-500 text-black shadow-md' : 'bg-[#09101f] border-white/10 text-slate-500'}`}
                title="Tampilan Rapat"
              >
                <Camera className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase italic hidden sm:inline">Compact</span>
              </button>
              {isCompact && (
                <button 
                  onClick={() => {
                    const sortedParticipants = [...filteredParticipants].sort((a: any, b: any) => {
                      const nameA = (a.displayName || a.name || '').trim().toUpperCase();
                      const nameB = (b.displayName || b.name || '').trim().toUpperCase();
                      return nameA.localeCompare(nameB, 'id-ID', { sensitivity: 'base' });
                    });
                    const text = `*LIST PESERTA (A-Z): ${tournament.name}*\n\n` + 
                      sortedParticipants.map((p: any, i: number) => `${i+1}. ${p.displayName} ${p.handicap ? `(HC: ${p.handicap})` : ''}`).join('\n') +
                      `\n\n_Generated by Vamos Player App_`;
                    
                    navigator.clipboard.writeText(text);
                    const waUrl = `https://wa.me?text=${encodeURIComponent(text)}`;
                    window.open(waUrl, '_blank');
                  }}
                  className="px-4 py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-1.5"
                  title="Bagikan ke WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase italic hidden sm:inline">Share WA</span>
                </button>
              )}
            </div>

            {filteredParticipants.length === 0 ? (
                <div className="py-16 text-center rounded-[28px] border border-dashed border-white/10 bg-[#0d1628]/40">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Belum ada peserta yang mendaftar.</p>
                </div>
            ) : isCompact ? (
                <div className="grid grid-cols-2 gap-2">
                   {filteredParticipants.map((p: any, i: number) => (
                      <div key={p.id || i} className="bg-[#0d1628] border border-white/5 p-3 rounded-xl flex items-center gap-2.5">
                         <div className="text-[8px] font-black text-slate-500 w-4 text-center shrink-0">{i + 1}</div>
                         <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                            <p className="font-black text-white text-[10px] uppercase italic truncate">{p.displayName}</p>
                            {p.handicap && <span className="text-[7px] font-bold text-cyan-400 italic shrink-0">HC {p.handicap}</span>}
                         </div>
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      </div>
                   ))}
                </div>
            ) : (
                filteredParticipants.map((p: any, i: number) => {
                  const isMe = p.memberId === member?.id;
                  return (
                    <div key={p.id || i} className={`p-4.5 rounded-2xl flex items-center justify-between border ${isMe ? 'bg-cyan-500/10 border-cyan-500/30' : 'border-white/5 bg-[#0d1628]'}`}>
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${i < 3 ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' : 'border-slate-800 text-slate-500 bg-[#09101f]'}`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-black text-white text-sm uppercase italic">{p.displayName}</p>
                          {isMe && <span className="text-[8px] font-black text-cyan-400 uppercase tracking-wider">Slot Anda</span>}
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase italic tracking-wider">
                           TERDAFTAR
                         </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>

      {/* ─── MATCH DETAIL MODAL ─── */}
      {selectedMatch && (
        <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-[#070b14]/90 backdrop-blur-md" onClick={() => setSelectedMatch(null)} />
          <div className="relative w-full max-w-sm bg-[#0d1628] rounded-t-[32px] sm:rounded-[32px] p-7 border-t sm:border border-white/10 scale-in-bottom sm:scale-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-black text-cyan-400 uppercase italic tracking-[0.2em]">Detail Pertandingan</h3>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">Status & Jadwal Match</p>
              </div>
              <button onClick={() => setSelectedMatch(null)} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Table Number */}
              <div className="bg-[#09101f] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Lokasi Meja</p>
                  <p className="text-lg font-black text-white italic uppercase tracking-tighter">Meja {selectedMatch.tableNumber || '??'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                   <Trophy className="w-5 h-5" />
                </div>
              </div>

              {/* Player Comparison */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: selectedMatch.player1Id, score: selectedMatch.score1 },
                  { id: selectedMatch.player2Id, score: selectedMatch.score2 }
                ].map((pData, idx) => {
                  const p = tournament.participants?.find((p: any) => p.id === pData.id);
                  const isMe = pData.id === member?.id;
                  return (
                    <div key={idx} className={`p-3.5 rounded-2xl border ${isMe ? 'bg-cyan-500/15 border-cyan-400/40' : 'bg-[#09101f] border-white/5'}`}>
                      <p className="text-[8px] text-slate-500 font-black uppercase mb-1.5">Pemain {idx + 1}</p>
                      <p className="text-[10px] font-black text-white uppercase italic truncate mb-0.5">{p?.name || p?.member?.name || 'TBD'}</p>
                      <p className="text-[8px] text-cyan-400 font-bold uppercase">HC: {p?.handicap || '-'}</p>
                      <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-500">SKOR</span>
                        <span className="text-lg font-black text-white italic">{pData.score !== null ? pData.score : '-'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time / Status */}
              <div className="bg-[#09101f] p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase italic">Waktu Match</span>
                  <span className="text-[10px] font-black text-white italic uppercase">{selectedMatch.startTime || 'Terjadwal'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase italic">Status</span>
                  <div className="flex items-center gap-1.5">
                    {selectedMatch.status === 'ONGOING' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                    <span className={`text-[9px] font-black uppercase italic ${selectedMatch.status === 'ONGOING' ? 'text-red-500' : 'text-emerald-400'}`}>
                      {selectedMatch.status || 'Menunggu'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedMatch(null)}
              className="w-full mt-6 py-3.5 bg-white/10 hover:bg-white/15 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic text-white transition-all"
            >
              KEMBALI KE BAGAN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
