import React, { useState, useMemo } from 'react';
import { getPhysicalTableInfo, type DominoMatch } from '../screens/DominoScreen';
import { Trophy, Crown, ZoomIn, ZoomOut, RotateCcw, Award } from 'lucide-react';

interface DominoBracketTreeProps {
  matches: DominoMatch[];
  onSelectMatch: (match: DominoMatch) => void;
  onAdvanceWinner?: (match: DominoMatch, winnerSlot: 1 | 2) => void;
}

export const DominoBracketTree: React.FC<DominoBracketTreeProps> = ({
  matches,
  onSelectMatch,
  onAdvanceWinner,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [wingView, setWingView] = useState<'ALL' | 'POOL_A' | 'FINAL' | 'POOL_B'>('ALL');

  // Categorize matches by rounds
  const r1PoolA = useMemo(() => matches.filter((m) => m.round === 1 && m.matchNumber <= 16), [matches]);
  const r1PoolB = useMemo(() => matches.filter((m) => m.round === 1 && m.matchNumber > 16), [matches]);

  const r2PoolA = useMemo(() => matches.filter((m) => m.round === 2 && m.matchNumber <= 40), [matches]);
  const r2PoolB = useMemo(() => matches.filter((m) => m.round === 2 && m.matchNumber > 40), [matches]);

  const r3PoolA = useMemo(() => matches.filter((m) => m.round === 3 && m.matchNumber <= 52), [matches]);
  const r3PoolB = useMemo(() => matches.filter((m) => m.round === 3 && m.matchNumber > 52), [matches]);

  const r4PoolA = useMemo(() => matches.filter((m) => m.round === 4 && m.matchNumber <= 58), [matches]);
  const r4PoolB = useMemo(() => matches.filter((m) => m.round === 4 && m.matchNumber > 58), [matches]);

  const sfPoolA = useMemo(() => matches.find((m) => m.round === 5 && m.matchNumber === 61), [matches]);
  const sfPoolB = useMemo(() => matches.find((m) => m.round === 5 && m.matchNumber === 62), [matches]);

  const finalMatch = useMemo(() => matches.find((m) => m.round === 6 && m.matchNumber === 63), [matches]);

  // Grand Champion info
  const champion = useMemo(() => {
    if (!finalMatch || finalMatch.status !== 'COMPLETED' || !finalMatch.winnerId) return null;
    return finalMatch.winnerId === finalMatch.player1?.id ? finalMatch.player1 : finalMatch.player2;
  }, [finalMatch]);

  const runnerUp = useMemo(() => {
    if (!finalMatch || finalMatch.status !== 'COMPLETED' || !finalMatch.winnerId) return null;
    return finalMatch.winnerId === finalMatch.player1?.id ? finalMatch.player2 : finalMatch.player1;
  }, [finalMatch]);

  // Render a compact node for the bracket
  const renderBracketNode = (
    m?: DominoMatch,
    _align: 'left' | 'right' | 'center' = 'left',
    accentColor: 'blue' | 'red' | 'gold' = 'blue'
  ) => {
    if (!m) {
      return (
        <div className="w-56 p-2 rounded-xl border border-white/5 bg-black/20 text-slate-600 text-center text-xs">
          Menunggu Jadwal
        </div>
      );
    }

    const tbl = getPhysicalTableInfo(m);
    const isCompleted = m.status === 'COMPLETED';
    const isP1Win = m.winnerId && m.winnerId === m.player1?.id;
    const isP2Win = m.winnerId && m.winnerId === m.player2?.id;

    return (
      <div
        key={m.id}
        onClick={() => onSelectMatch(m)}
        className={`w-56 p-2.5 rounded-2xl border transition-all cursor-pointer relative group ${
          isCompleted
            ? 'bg-[#0c152a] border-emerald-500/40 shadow-lg'
            : accentColor === 'gold'
            ? 'bg-[#181224] border-amber-500/40 hover:border-amber-400'
            : accentColor === 'blue'
            ? 'bg-[#091226] border-blue-500/30 hover:border-blue-400'
            : 'bg-[#180f22] border-red-500/30 hover:border-red-400'
        }`}
      >
        {/* Node Header */}
        <div className="flex items-center justify-between gap-1 mb-1.5 text-[9px] font-bold">
          <div className="flex items-center gap-1">
            <span className="text-amber-400 uppercase font-black">{tbl.fullLabel}</span>
            <span className="text-slate-500 font-mono">#{m.matchNumber}</span>
          </div>
          {isCompleted ? (
            <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              SELESAI
            </span>
          ) : (
            <span className="text-[8px] text-slate-500">KLIK SKOR</span>
          )}
        </div>

        {/* Player 1 Row */}
        <div
          onClick={(e) => {
            if (onAdvanceWinner && m.player1 && !isCompleted) {
              e.stopPropagation();
              onAdvanceWinner(m, 1);
            }
          }}
          className={`p-1.5 rounded-lg mb-1 flex items-center justify-between text-xs transition-colors ${
            isP1Win
              ? 'bg-blue-600/25 border border-blue-400/50 text-blue-200 font-bold'
              : 'bg-black/30 text-white/90 hover:bg-white/5'
          }`}
          title={!isCompleted && m.player1 ? 'Klik untuk langsung meloloskan P1' : ''}
        >
          <div className="truncate pr-1">
            <span className="truncate block font-bold text-[11px]">
              {m.player1?.name || 'TBD (Menunggu)'}
            </span>
            {m.player1?.team && m.player1.team !== 'INDIVIDUAL' && (
              <span className="text-[8px] text-amber-400/90 font-bold uppercase block">
                {m.player1.team}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 font-mono font-bold text-[11px]">
            {isP1Win && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
            <span className="text-slate-200">{m.score1 ?? '-'}</span>
          </div>
        </div>

        {/* Player 2 Row */}
        <div
          onClick={(e) => {
            if (onAdvanceWinner && m.player2 && !isCompleted) {
              e.stopPropagation();
              onAdvanceWinner(m, 2);
            }
          }}
          className={`p-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
            isP2Win
              ? 'bg-red-600/25 border border-red-400/50 text-red-200 font-bold'
              : 'bg-black/30 text-white/90 hover:bg-white/5'
          }`}
          title={!isCompleted && m.player2 ? 'Klik untuk langsung meloloskan P2' : ''}
        >
          <div className="truncate pr-1">
            <span className="truncate block font-bold text-[11px]">
              {m.player2?.name || 'TBD (Menunggu)'}
            </span>
            {m.player2?.team && m.player2.team !== 'INDIVIDUAL' && (
              <span className="text-[8px] text-amber-400/90 font-bold uppercase block">
                {m.player2.team}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 font-mono font-bold text-[11px]">
            {isP2Win && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
            <span className="text-slate-200">{m.score2 ?? '-'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ─── BRACKET TOOLBAR & VIEW SELECTOR ─── */}
      <div className="bg-[#091124] border border-white/10 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
        {/* Wing Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#060a16] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setWingView('ALL')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase italic tracking-wider transition-all ${
              wingView === 'ALL'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🌟 SEMUA (DUAL WING)
          </button>
          <button
            onClick={() => setWingView('POOL_A')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase italic tracking-wider transition-all ${
              wingView === 'POOL_A'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔵 SAYAP KIRI (POOL A)
          </button>
          <button
            onClick={() => setWingView('FINAL')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase italic tracking-wider transition-all ${
              wingView === 'FINAL'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏆 GRAND FINAL
          </button>
          <button
            onClick={() => setWingView('POOL_B')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase italic tracking-wider transition-all ${
              wingView === 'POOL_B'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔴 SAYAP KANAN (POOL B)
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#060a16] border border-white/10 rounded-xl p-1 text-slate-300">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
              className="p-1.5 rounded-lg hover:bg-white/10"
              title="Perkecil Bagan"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[10px] font-mono font-bold text-amber-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 rounded-lg hover:bg-white/10"
              title="Perbesar Bagan"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              title="Reset 100%"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[10px] text-slate-400 hidden lg:block">
            Tips: Geser horizontal untuk melihat cabang pertandingan
          </div>
        </div>
      </div>

      {/* ─── CHAMPION PODIUM SHOWCASE ─── */}
      {champion && (
        <div className="bg-gradient-to-r from-amber-950/40 via-red-950/50 to-amber-950/40 border-2 border-amber-500/50 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-slide-up">
          <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
            <Award className="w-7 h-7 animate-bounce" />
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest italic text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
              JUARA DOMINO FUN TOURNAMENT 2026
            </h3>
            <Award className="w-7 h-7 animate-bounce" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4">
            {/* Runner-Up */}
            {runnerUp && (
              <div className="order-2 sm:order-1 bg-[#0a1224] border border-slate-600/40 rounded-2xl p-4 w-60">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  🥈 RUNNER-UP (JUARA 2)
                </span>
                <p className="font-black text-sm text-white uppercase italic truncate">
                  {runnerUp.name}
                </p>
                {runnerUp.team && (
                  <span className="text-[9px] font-bold text-amber-400 uppercase">{runnerUp.team}</span>
                )}
              </div>
            )}

            {/* Champion */}
            <div className="order-1 sm:order-2 bg-gradient-to-b from-amber-600/30 to-amber-950/50 border-2 border-amber-400 rounded-3xl p-6 w-72 shadow-2xl scale-105">
              <Crown className="w-8 h-8 text-amber-400 fill-amber-400 mx-auto mb-2 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 block mb-1">
                🥇 GRAND CHAMPION (JUARA 1)
              </span>
              <p className="font-black text-lg text-white uppercase italic truncate">
                {champion.name}
              </p>
              {champion.team && (
                <span className="text-xs font-black text-amber-300 uppercase block mt-0.5">
                  {champion.team}
                </span>
              )}
              <div className="mt-3 pt-2 border-t border-amber-400/30 text-[10px] text-amber-200 font-bold">
                HADIAH RP 3.000.000 + VOUCHER BILLIARD
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DUAL-WING HORIZONTAL TREE CANVAS ─── */}
      <div className="w-full overflow-x-auto pb-8 rounded-3xl bg-[#060a16] border border-white/10 p-4 shadow-2xl scrollbar-thin scrollbar-thumb-white/20">
        <div
          className="min-w-max flex items-center justify-center gap-8 py-6 transition-transform origin-top-left"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
        >
          {/* ────── WING KIRI (POOL A) ────── */}
          {(wingView === 'ALL' || wingView === 'POOL_A') && (
            <div className="flex items-center gap-6">
              {/* R1: 64 Besar Pool A (16 Matches) */}
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-blue-500/30">
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                    BABAK 64 BESAR
                  </span>
                  <div className="text-[9px] text-slate-400 font-mono">Meja 01–16 • Sesi 1</div>
                </div>
                <div className="flex flex-col gap-3">
                  {r1PoolA.map((m) => renderBracketNode(m, 'left', 'blue'))}
                </div>
              </div>

              {/* R2: 32 Besar Pool A (8 Matches) */}
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-blue-500/30">
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                    32 BESAR
                  </span>
                  <div className="text-[9px] text-slate-400 font-mono">Meja 01–08</div>
                </div>
                <div className="flex flex-col justify-around h-full gap-8">
                  {r2PoolA.map((m) => renderBracketNode(m, 'left', 'blue'))}
                </div>
              </div>

              {/* R3: 16 Besar Pool A (4 Matches) */}
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-blue-500/30">
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                    16 BESAR
                  </span>
                  <div className="text-[9px] text-slate-400 font-mono">Meja 01–04</div>
                </div>
                <div className="flex flex-col justify-around h-full gap-16">
                  {r3PoolA.map((m) => renderBracketNode(m, 'left', 'blue'))}
                </div>
              </div>

              {/* R4: 8 Besar / QF Pool A (2 Matches) */}
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-blue-500/30">
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                    8 BESAR (QF)
                  </span>
                  <div className="text-[9px] text-slate-400 font-mono">Meja 01 & 02</div>
                </div>
                <div className="flex flex-col justify-around h-full gap-32">
                  {r4PoolA.map((m) => renderBracketNode(m, 'left', 'blue'))}
                </div>
              </div>

              {/* R5: Semifinal A (1 Match) */}
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-blue-500/30">
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                    SEMIFINAL A
                  </span>
                  <div className="text-[9px] text-slate-400 font-mono">Meja 01</div>
                </div>
                <div className="flex flex-col justify-center h-full">
                  {renderBracketNode(sfPoolA, 'left', 'blue')}
                </div>
              </div>
            </div>
          )}

          {/* ────── CENTER STAGE (GRAND FINAL) ────── */}
          {(wingView === 'ALL' || wingView === 'FINAL') && (
            <div className="px-6 py-8 flex flex-col items-center justify-center bg-gradient-to-b from-amber-950/20 via-black/40 to-amber-950/20 border-2 border-amber-500/30 rounded-3xl relative">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>PARTAI PUNCAK</span>
                </div>
                <h4 className="text-lg font-black uppercase italic text-white tracking-wide">
                  GRAND FINAL
                </h4>
                <span className="text-xs text-amber-400 font-bold block">
                  MEJA 01 (MAIN ARENA)
                </span>
              </div>

              {renderBracketNode(finalMatch, 'center', 'gold')}

              <div className="mt-4 text-[10px] text-slate-400 text-center font-mono">
                Total Hadiah: Rp 3.000.000 + Voucher Billiard 2 Jam
              </div>
            </div>
          )}

          {/* ────── WING KANAN (POOL B) ────── */}
          {(wingView === 'ALL' || wingView === 'POOL_B') && (
            <div className="flex items-center gap-6">
              {/* R5: Semifinal B (1 Match) */}
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-red-500/30">
                  <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">
                    SEMIFINAL B
                  </span>
                  <div className="text-[9px] text-slate-400 font-mono">Meja 02</div>
                </div>
                <div className="flex flex-col justify-center h-full">
                  {renderBracketNode(sfPoolB, 'right', 'red')}
                </div>
              </div>

              {/* R4: 8 Besar / QF Pool B (2 Matches) */}
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-red-500/30">
                  <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">
                    8 BESAR (QF)
                  </span>
                  <div className="text-[9px] text-slate-400 font-mono">Meja 03 & 04</div>
                </div>
                <div className="flex flex-col justify-around h-full gap-32">
                  {r4PoolB.map((m) => renderBracketNode(m, 'right', 'red'))}
                </div>
              </div>

              {/* R3: 16 Besar Pool B (4 Matches) */}
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-red-500/30">
                  <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">
                    16 BESAR
                  </span>
                  <div className="text-[9px] text-slate-400 font-mono">Meja 05–08</div>
                </div>
                <div className="flex flex-col justify-around h-full gap-16">
                  {r3PoolB.map((m) => renderBracketNode(m, 'right', 'red'))}
                </div>
              </div>

              {/* R2: 32 Besar Pool B (8 Matches) */}
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-red-500/30">
                  <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">
                    32 BESAR
                  </span>
                  <div className="text-[9px] text-slate-400 font-mono">Meja 09–16</div>
                </div>
                <div className="flex flex-col justify-around h-full gap-8">
                  {r2PoolB.map((m) => renderBracketNode(m, 'right', 'red'))}
                </div>
              </div>

              {/* R1: 64 Besar Pool B (16 Matches) */}
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-red-500/30">
                  <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">
                    BABAK 64 BESAR
                  </span>
                  <div className="text-[9px] text-slate-400 font-mono">Meja 01–16 • Sesi 2</div>
                </div>
                <div className="flex flex-col gap-3">
                  {r1PoolB.map((m) => renderBracketNode(m, 'right', 'red'))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
