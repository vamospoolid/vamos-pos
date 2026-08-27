import { useState } from 'react';
import { Trophy, Medal, Crown, Sparkles, User, Gift, ChevronDown, ChevronUp } from 'lucide-react';
import { getAvatarUrl } from '../api';

export interface PodiumResult {
  champion: any | null;
  runnerUp: any | null;
  semiFinalists: any[];
  isFinished: boolean;
}

export function calculateTournamentPodium(tournament: any): PodiumResult {
  if (!tournament || !tournament.matches || tournament.matches.length === 0) {
    return { champion: null, runnerUp: null, semiFinalists: [], isFinished: false };
  }

  const matches = tournament.matches || [];
  const participants = tournament.participants || [];

  // Find max round
  const rounds: number[] = Array.from(new Set<number>(matches.map((m: any) => Number(m.round) || 1))).sort((a: number, b: number) => b - a);
  if (rounds.length === 0) return { champion: null, runnerUp: null, semiFinalists: [], isFinished: false };

  const maxRound: number = rounds[0];
  const finalMatch = matches.find((m: any) => Number(m.round) === maxRound);

  let champion: any = null;
  let runnerUp: any = null;
  let semiFinalists: any[] = [];
  let isFinished = false;

  // Check if final match has completed or has scores
  if (finalMatch && (finalMatch.status === 'COMPLETED' || (finalMatch.score1 !== null && finalMatch.score2 !== null && finalMatch.score1 !== finalMatch.score2))) {
    const isP1Win = finalMatch.winnerId 
      ? finalMatch.winnerId === finalMatch.player1Id 
      : (finalMatch.score1 !== null && finalMatch.score2 !== null && Number(finalMatch.score1) > Number(finalMatch.score2));
    
    const champId = isP1Win ? finalMatch.player1Id : finalMatch.player2Id;
    const runnerId = isP1Win ? finalMatch.player2Id : finalMatch.player1Id;

    champion = participants.find((p: any) => p.id === champId) || null;
    runnerUp = participants.find((p: any) => p.id === runnerId) || null;
    isFinished = true;

    // Semi-finalists from round (maxRound - 1)
    if (rounds.length > 1) {
      const semiRound = maxRound - 1;
      const semiMatches = matches.filter((m: any) => Number(m.round) === semiRound);
      
      semiMatches.forEach((sm: any) => {
        if (sm.score1 !== null && sm.score2 !== null) {
          const isSemiP1Win = sm.winnerId 
            ? sm.winnerId === sm.player1Id 
            : Number(sm.score1) > Number(sm.score2);
          const loserId = isSemiP1Win ? sm.player2Id : sm.player1Id;
          const semiPart = participants.find((p: any) => p.id === loserId);
          if (semiPart && !semiFinalists.some((sp: any) => sp.id === semiPart.id)) {
            semiFinalists.push(semiPart);
          }
        }
      });
    }
  }

  return { champion, runnerUp, semiFinalists, isFinished };
}

interface TournamentPodiumCardProps {
  tournament: any;
  member?: any;
}

export function TournamentPodiumCard({ tournament, member }: TournamentPodiumCardProps) {
  const [expanded, setExpanded] = useState(true);
  const podium = calculateTournamentPodium(tournament);

  if (!podium.isFinished || !podium.champion) return null;

  const { champion, runnerUp, semiFinalists } = podium;

  // Check if logged-in user is one of the winners
  const isMeChamp = member && (champion?.memberId === member.id || champion?.name?.toLowerCase() === member.name?.toLowerCase());
  const isMeRunner = member && (runnerUp?.memberId === member.id || runnerUp?.name?.toLowerCase() === member.name?.toLowerCase());
  const isMeSemi = member && semiFinalists.some((sp: any) => sp.memberId === member.id || sp.name?.toLowerCase() === member.name?.toLowerCase());

  const myPrize = isMeChamp 
    ? tournament.prizeChampion 
    : isMeRunner 
    ? tournament.prizeRunnerUp 
    : isMeSemi 
    ? tournament.prizeSemiFinal 
    : 0;

  const myRankTitle = isMeChamp 
    ? 'JUARA 1 (CHAMPION)' 
    : isMeRunner 
    ? 'JUARA 2 (RUNNER-UP)' 
    : isMeSemi 
    ? 'SEMI-FINALIS (TOP 4)' 
    : null;

  return (
    <div className="space-y-4">
      {/* ─── PERSONAL REWARD BANNER (JIKA MEMBER YANG LOGIN MENANG) ─── */}
      {myRankTitle && (
        <div className="relative overflow-hidden rounded-[28px] p-6 border-2 border-yellow-400 bg-gradient-to-br from-yellow-500/20 via-[#0d1628] to-[#070b14] shadow-[0_0_40px_rgba(234,179,8,0.25)] animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute top-0 right-0 w-44 h-44 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-black shadow-lg shadow-yellow-500/30">
                <Crown className="w-7 h-7" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-[9px] font-black uppercase italic tracking-wider">
                  <Sparkles className="w-3 h-3 animate-spin" /> PENGHARGAAN JUARA
                </span>
                <h3 className="text-base font-black text-white italic uppercase tracking-tight mt-1">
                  SELAMAT, {member.name}!
                </h3>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Status Anda:</span>
              <span className="text-xs font-black text-yellow-400 uppercase italic">{myRankTitle}</span>
            </div>
          </div>

          <div className="bg-black/50 border border-yellow-500/30 rounded-2xl p-4 flex items-center justify-between relative z-10 mb-3">
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Total Reward Hadiah</p>
              <p className="text-xl font-black text-yellow-400 italic tracking-tighter leading-none mt-1">
                {myPrize > 0 ? `RP ${Number(myPrize).toLocaleString()}` : 'TROPHY & PENGHARGAAN'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase italic bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
              <Gift className="w-4 h-4" />
              <span>Klaim di Kasir</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic text-center relative z-10">
            Tunjukkan layar akun aplikasi ini ke petugas kasir Vamos untuk serah terima hadiah & klaim reward.
          </p>
        </div>
      )}

      {/* ─── PODIUM JUARA (HALL OF CHAMPIONS) ─── */}
      <div className="rounded-[28px] border-2 border-amber-500/40 bg-gradient-to-b from-[#0f1d36] via-[#09101f] to-[#070b14] p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Header Podium */}
        <div className="flex justify-between items-center relative z-10 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.25em] italic leading-none">
                HALL OF CHAMPIONS
              </p>
              <h3 className="text-sm font-black text-white italic uppercase tracking-wider mt-1">
                Podium Juara & Reward
              </h3>
            </div>
          </div>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
          <div className="space-y-6 relative z-10 animate-in fade-in duration-200">
            
            {/* 3-Column Podium Graphic */}
            <div className="grid grid-cols-3 gap-2.5 items-end pt-4 pb-2">
              
              {/* 🥈 #2 RUNNER-UP (Kiri) */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-slate-700/40 border-2 border-slate-300/60 p-0.5 overflow-hidden shadow-lg shadow-slate-500/20">
                    {runnerUp?.member?.photo ? (
                      <img src={getAvatarUrl(runnerUp.member.photo)!} alt="" className="w-full h-full object-cover rounded-[13px]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-[13px]">
                        <User className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-300 text-black font-black text-[10px] flex items-center justify-center border-2 border-[#09101f] shadow">
                    2
                  </div>
                </div>
                
                <p className="text-xs font-black text-white italic uppercase truncate max-w-full px-1">
                  {runnerUp?.name || runnerUp?.member?.name || 'Runner Up'}
                </p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">
                  HC {runnerUp?.handicap || '-'}
                </p>

                {/* Podium Stand 2 */}
                <div className="w-full mt-3 rounded-t-2xl bg-gradient-to-b from-slate-700/50 to-slate-900/80 border-t-2 border-x-2 border-slate-400/40 py-3 flex flex-col items-center justify-center min-h-[75px]">
                  <Medal className="w-5 h-5 text-slate-300 mb-1" />
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-wider">RUNNER UP</span>
                  {tournament.prizeRunnerUp > 0 && (
                    <span className="text-[10px] font-black text-white italic mt-0.5">
                      RP {(tournament.prizeRunnerUp / 1000).toLocaleString()}K
                    </span>
                  )}
                </div>
              </div>

              {/* 🥇 #1 JUARA 1 (Tengah - Tertinggi) */}
              <div className="flex flex-col items-center text-center -mt-6">
                <div className="relative mb-2">
                  {/* Crown */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce">
                    <Crown className="w-6 h-6 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                  </div>
                  <div className="w-18 h-18 rounded-2xl bg-amber-500/30 border-2 border-yellow-400 p-0.5 overflow-hidden shadow-[0_0_25px_rgba(250,204,21,0.4)] ring-2 ring-yellow-400/30">
                    {champion?.member?.photo ? (
                      <img src={getAvatarUrl(champion.member.photo)!} alt="" className="w-full h-full object-cover rounded-[13px]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-500/20 rounded-[13px]">
                        <User className="w-8 h-8 text-yellow-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-yellow-400 text-black font-black text-xs flex items-center justify-center border-2 border-[#09101f] shadow-lg shadow-yellow-400/40">
                    1
                  </div>
                </div>

                <p className="text-sm font-black text-yellow-400 italic uppercase truncate max-w-full px-1">
                  {champion?.name || champion?.member?.name || 'Champion'}
                </p>
                <p className="text-[10px] text-amber-300/80 font-bold uppercase">
                  HC {champion?.handicap || '-'}
                </p>

                {/* Podium Stand 1 */}
                <div className="w-full mt-3 rounded-t-2xl bg-gradient-to-b from-yellow-500/30 via-amber-600/20 to-black/90 border-t-2 border-x-2 border-yellow-400 py-4 flex flex-col items-center justify-center min-h-[105px] shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                  <Trophy className="w-6 h-6 text-yellow-400 mb-1" />
                  <span className="text-[9px] font-black text-yellow-300 uppercase tracking-widest">CHAMPION</span>
                  {tournament.prizeChampion > 0 && (
                    <span className="text-xs font-black text-yellow-400 italic mt-0.5 font-mono">
                      RP {Number(tournament.prizeChampion).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* 🥉 #3 SEMI-FINALIS (Kanan) */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-amber-900/40 border-2 border-amber-600/60 p-0.5 overflow-hidden shadow-lg shadow-amber-900/20">
                    {semiFinalists[0]?.member?.photo ? (
                      <img src={getAvatarUrl(semiFinalists[0].member.photo)!} alt="" className="w-full h-full object-cover rounded-[13px]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-950/60 rounded-[13px]">
                        <User className="w-6 h-6 text-amber-500" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-600 text-white font-black text-[10px] flex items-center justify-center border-2 border-[#09101f] shadow">
                    3
                  </div>
                </div>

                <p className="text-xs font-black text-white italic uppercase truncate max-w-full px-1">
                  {semiFinalists[0]?.name || semiFinalists[0]?.member?.name || 'Semi Finalis'}
                </p>
                <p className="text-[9px] text-amber-500 font-bold uppercase">
                  HC {semiFinalists[0]?.handicap || '-'}
                </p>

                {/* Podium Stand 3 */}
                <div className="w-full mt-3 rounded-t-2xl bg-gradient-to-b from-amber-900/40 to-slate-900/80 border-t-2 border-x-2 border-amber-600/40 py-3 flex flex-col items-center justify-center min-h-[60px]">
                  <Medal className="w-5 h-5 text-amber-500 mb-1" />
                  <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider">SEMI FINAL</span>
                  {tournament.prizeSemiFinal > 0 && (
                    <span className="text-[10px] font-black text-white italic mt-0.5">
                      RP {(tournament.prizeSemiFinal / 1000).toLocaleString()}K
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* List Detail Penerima Reward */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-yellow-500/20">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-yellow-400 text-black font-black text-[10px] flex items-center justify-center">1</span>
                  <div>
                    <span className="text-xs font-black text-white uppercase italic">{champion?.name || champion?.member?.name}</span>
                    <span className="text-[9px] text-yellow-400 font-bold ml-2">JUARA 1</span>
                  </div>
                </div>
                <span className="text-xs font-black text-yellow-400 italic">
                  {tournament.prizeChampion > 0 ? `RP ${Number(tournament.prizeChampion).toLocaleString()}` : 'Trophy & Poin'}
                </span>
              </div>

              {runnerUp && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-slate-400/20">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-300 text-black font-black text-[10px] flex items-center justify-center">2</span>
                    <div>
                      <span className="text-xs font-black text-white uppercase italic">{runnerUp?.name || runnerUp?.member?.name}</span>
                      <span className="text-[9px] text-slate-300 font-bold ml-2">JUARA 2</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-300 italic">
                    {tournament.prizeRunnerUp > 0 ? `RP ${Number(tournament.prizeRunnerUp).toLocaleString()}` : 'Medali & Poin'}
                  </span>
                </div>
              )}

              {semiFinalists.map((sp: any, sIdx: number) => (
                <div key={sp.id || sIdx} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-amber-600/20">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-600 text-white font-black text-[10px] flex items-center justify-center">3</span>
                    <div>
                      <span className="text-xs font-black text-white uppercase italic">{sp?.name || sp?.member?.name}</span>
                      <span className="text-[9px] text-amber-500 font-bold ml-2">SEMI FINALIS</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-400 italic">
                    {tournament.prizeSemiFinal > 0 ? `RP ${Number(tournament.prizeSemiFinal).toLocaleString()}` : 'Poin'}
                  </span>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
