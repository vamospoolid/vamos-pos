import { Swords, Trophy, ChevronRight, User, Flame } from 'lucide-react';
import { getAvatarUrl } from '../api';

interface MyMatchTrackerCardProps {
  member: any;
  tournaments?: any[];
  onOpenBracket?: (tournament: any) => void;
}

export function MyMatchTrackerCard({ member, tournaments = [], onOpenBracket }: MyMatchTrackerCardProps) {
  if (!member || !tournaments || tournaments.length === 0) return null;

  // Find all active/pending tournaments where this member is a participant
  const myTournamentEntries: Array<{
    tournament: any;
    participant: any;
    currentMatch: any | null;
    opponent: any | null;
    matchType: 'LIVE' | 'NEXT' | 'WAITING_OPPONENT' | 'COMPLETED' | 'PENDING_BRACKET';
  }> = [];

  tournaments.forEach(t => {
    // Find my participant profile(s) in this tournament
    const myParticipants = (t.participants || []).filter(
      (p: any) => p.memberId === member.id || (p.name && p.name.toLowerCase() === member.name?.toLowerCase())
    );

    if (myParticipants.length === 0) return;

    myParticipants.forEach((myPart: any) => {
      const allMatches = t.matches || [];
      if (allMatches.length === 0) {
        myTournamentEntries.push({
          tournament: t,
          participant: myPart,
          currentMatch: null,
          opponent: null,
          matchType: 'PENDING_BRACKET'
        });
        return;
      }

      // Filter matches involving this participant
      const myMatches = allMatches.filter(
        (m: any) => m.player1Id === myPart.id || m.player2Id === myPart.id
      );

      if (myMatches.length === 0) {
        // Maybe in next round that hasn't seeded yet
        myTournamentEntries.push({
          tournament: t,
          participant: myPart,
          currentMatch: null,
          opponent: null,
          matchType: 'PENDING_BRACKET'
        });
        return;
      }

      // 1. Check for LIVE / ONGOING match
      const liveMatch = myMatches.find((m: any) => m.status === 'ONGOING' || m.status === 'LIVE');
      if (liveMatch) {
        const oppId = liveMatch.player1Id === myPart.id ? liveMatch.player2Id : liveMatch.player1Id;
        const opponent = oppId ? t.participants?.find((p: any) => p.id === oppId) : null;
        myTournamentEntries.push({
          tournament: t,
          participant: myPart,
          currentMatch: liveMatch,
          opponent,
          matchType: 'LIVE'
        });
        return;
      }

      // 2. Check for NEXT pending match
      const nextMatch = myMatches.find((m: any) => m.status === 'PENDING');
      if (nextMatch) {
        const oppId = nextMatch.player1Id === myPart.id ? nextMatch.player2Id : nextMatch.player1Id;
        const opponent = oppId ? t.participants?.find((p: any) => p.id === oppId) : null;
        myTournamentEntries.push({
          tournament: t,
          participant: myPart,
          currentMatch: nextMatch,
          opponent,
          matchType: opponent ? 'NEXT' : 'WAITING_OPPONENT'
        });
        return;
      }

      // 3. Check for recently completed match
      const completedMatches = myMatches.filter((m: any) => m.status === 'COMPLETED').sort((a: any, b: any) => b.round - a.round);
      if (completedMatches.length > 0) {
        const lastMatch = completedMatches[0];
        const oppId = lastMatch.player1Id === myPart.id ? lastMatch.player2Id : lastMatch.player1Id;
        const opponent = oppId ? t.participants?.find((p: any) => p.id === oppId) : null;
        myTournamentEntries.push({
          tournament: t,
          participant: myPart,
          currentMatch: lastMatch,
          opponent,
          matchType: 'COMPLETED'
        });
      }
    });
  });

  if (myTournamentEntries.length === 0) return null;

  return (
    <div className="space-y-4">
      {myTournamentEntries.map((entry, idx) => {
        const { tournament, participant, currentMatch, opponent, matchType } = entry;
        const isPlayer1 = currentMatch?.player1Id === participant.id;
        const myScore = isPlayer1 ? currentMatch?.score1 : currentMatch?.score2;
        const oppScore = isPlayer1 ? currentMatch?.score2 : currentMatch?.score1;
        const iWon = currentMatch?.winnerId 
          ? currentMatch.winnerId === participant.id 
          : (myScore !== null && oppScore !== null && Number(myScore) > Number(oppScore));
        const isLive = matchType === 'LIVE';

        // Check if final round
        const maxRound = Math.max(...(tournament.matches || []).map((m: any) => Number(m.round) || 1), 1);
        const isFinalRound = currentMatch && Number(currentMatch.round) === maxRound;
        const isChampion = isFinalRound && matchType === 'COMPLETED' && iWon;
        const isRunnerUp = isFinalRound && matchType === 'COMPLETED' && !iWon;

        return (
          <div
            key={`${tournament.id}-${participant.id}-${idx}`}
            onClick={() => onOpenBracket?.(tournament)}
            className={`fiery-card p-5 rounded-[28px] border-2 relative overflow-hidden transition-all active:scale-[0.98] cursor-pointer group shadow-xl ${
              isChampion
                ? 'border-yellow-400 bg-gradient-to-br from-yellow-500/20 via-[#0d1628] to-[#070b14] shadow-[0_0_35px_rgba(250,204,21,0.3)] ring-1 ring-yellow-400/40'
                : isRunnerUp
                ? 'border-slate-400/60 bg-gradient-to-br from-slate-500/15 via-[#0d1628] to-[#070b14] shadow-[0_0_25px_rgba(148,163,184,0.2)]'
                : isLive
                ? 'border-red-500/50 bg-gradient-to-br from-red-500/10 via-[#0a101f] to-[#070b14] shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                : matchType === 'NEXT'
                ? 'border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-[#0a101f] to-[#070b14] shadow-[0_0_25px_rgba(6,182,212,0.15)]'
                : 'border-white/10 bg-gradient-to-br from-white/5 via-[#0a101f] to-[#070b14]'
            }`}
          >
            {/* Background Ambient Glow */}
            <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-[50px] pointer-events-none ${
              isChampion ? 'bg-yellow-400/20' : isLive ? 'bg-red-500/15' : 'bg-cyan-500/10'
            }`} />

            {/* ─── HEADER: TOURNAMENT & STATUS BADGE ─── */}
            <div className="flex justify-between items-center mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isChampion
                    ? 'bg-yellow-400 text-black border-yellow-400 font-bold shadow-lg shadow-yellow-500/40'
                    : isRunnerUp
                    ? 'bg-slate-300 text-black border-slate-300 font-bold'
                    : isLive 
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                }`}>
                  <Swords className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {tournament.name}
                  </p>
                  <p className="text-xs font-black text-white italic uppercase tracking-wider mt-0.5">
                    {isFinalRound ? 'BABAK FINAL (CHAMPIONSHIP)' : currentMatch ? `Match #${currentMatch.matchNumber || ''} • Round ${currentMatch.round}` : 'Turnamen Aktif'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {isChampion && (
                  <span className="px-3 py-1 rounded-full bg-yellow-400 text-black font-black text-[9px] uppercase tracking-widest italic flex items-center gap-1 shadow-[0_0_15px_rgba(250,204,21,0.6)]">
                    👑 JUARA 1 (CHAMPION)
                  </span>
                )}
                {isRunnerUp && (
                  <span className="px-3 py-1 rounded-full bg-slate-300 text-black font-black text-[9px] uppercase tracking-widest italic flex items-center gap-1 shadow">
                    🥈 JUARA 2 (RUNNER-UP)
                  </span>
                )}
                {!isChampion && !isRunnerUp && isLive && (
                  <span className="px-3 py-1 rounded-full bg-red-500 text-white font-black text-[9px] uppercase tracking-widest italic flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE MATCH
                  </span>
                )}
                {!isChampion && !isRunnerUp && matchType === 'NEXT' && (
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-black text-[9px] uppercase tracking-widest italic flex items-center gap-1">
                    <Flame className="w-3 h-3 text-cyan-400" />
                    NEXT MATCH
                  </span>
                )}
                {!isChampion && !isRunnerUp && matchType === 'WAITING_OPPONENT' && (
                  <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-black text-[9px] uppercase tracking-widest italic flex items-center gap-1">
                    Menunggu Lawan
                  </span>
                )}
                {!isChampion && !isRunnerUp && matchType === 'COMPLETED' && (
                  <span className={`px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest italic border flex items-center gap-1 ${
                    iWon 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                      : 'bg-slate-500/20 text-slate-400 border-slate-500/40'
                  }`}>
                    {iWon ? '✓ MENANG' : 'SELESAI'}
                  </span>
                )}
                {matchType === 'PENDING_BRACKET' && (
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-black text-[9px] uppercase tracking-widest italic">
                    ✓ Terdaftar
                  </span>
                )}
              </div>
            </div>

            {/* ─── VS ARENA DISPLAY ─── */}
            {currentMatch ? (
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-3 relative z-10">
                <div className="grid grid-cols-5 items-center gap-2">
                  
                  {/* Player 1: YOU */}
                  <div className="col-span-2 flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/40 p-0.5 overflow-hidden shrink-0">
                      {member.photo ? (
                        <img src={getAvatarUrl(member.photo)!} alt="" className="w-full h-full object-cover rounded-[10px]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-cyan-500/10 rounded-[10px]">
                          <User className="w-5 h-5 text-cyan-400" />
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-black text-white italic uppercase truncate">
                        {participant.name || member.name}
                      </p>
                      <p className="text-[9px] text-cyan-400 font-bold uppercase">
                        HC: {participant.handicap || member.handicapLabel || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Center: Score / VS */}
                  <div className="col-span-1 text-center flex flex-col items-center justify-center">
                    {currentMatch.score1 !== null && currentMatch.score2 !== null ? (
                      <div className="flex items-center justify-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-xl border border-white/10">
                        <span className={`text-base font-black italic font-mono ${isPlayer1 ? (myScore > oppScore ? 'text-cyan-400' : 'text-white') : (oppScore > myScore ? 'text-white' : 'text-cyan-400')}`}>
                          {myScore ?? 0}
                        </span>
                        <span className="text-slate-600 text-xs font-bold">:</span>
                        <span className={`text-base font-black italic font-mono ${!isPlayer1 ? (myScore > oppScore ? 'text-cyan-400' : 'text-white') : (oppScore > myScore ? 'text-white' : 'text-cyan-400')}`}>
                          {oppScore ?? 0}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-black text-slate-500 italic bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        VS
                      </span>
                    )}
                  </div>

                  {/* Player 2: OPPONENT */}
                  <div className="col-span-2 flex items-center justify-end gap-2.5 text-right">
                    <div className="truncate">
                      <p className="text-xs font-black text-white italic uppercase truncate">
                        {opponent ? (opponent.name || opponent.member?.name || 'Rival') : 'TBD (Menunggu)'}
                      </p>
                      <p className="text-[9px] text-amber-400 font-bold uppercase">
                        {opponent?.handicap ? `HC: ${opponent.handicap}` : 'Lawan Berikutnya'}
                      </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 p-0.5 overflow-hidden shrink-0">
                      {opponent?.member?.photo ? (
                        <img src={getAvatarUrl(opponent.member.photo)!} alt="" className="w-full h-full object-cover rounded-[10px]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-500/10 rounded-[10px]">
                          <User className="w-5 h-5 text-amber-400" />
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="bg-black/30 border border-white/5 rounded-2xl p-3.5 mb-3 text-center">
                <p className="text-xs font-black text-white uppercase italic">Pendaftaran Anda Terkonfirmasi</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Bagan pertandingan dan jadwal babak pertama sedang disusun oleh panitia.</p>
              </div>
            )}

            {/* ─── FOOTER ACTION HINT ─── */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1 group-hover:text-cyan-300">
                <Trophy className="w-3.5 h-3.5 inline" /> Buka Bagan Pertandingan
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
