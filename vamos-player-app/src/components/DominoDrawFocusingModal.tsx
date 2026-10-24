import React, { useEffect, useState } from 'react';
import type { DominoParticipant, DominoMatch } from '../screens/DominoScreen';
import { DominoTile } from './DominoTile';
import { Trophy, X, Play, Pause, ArrowRight, ShieldCheck } from 'lucide-react';

interface DominoDrawFocusingModalProps {
  isOpen: boolean;
  isRolling: boolean;
  rollingCandidate: string;
  currentDrawn: {
    participant: DominoParticipant;
    matchNumber: number;
    slot: 1 | 2;
    pool: 'POOL_A' | 'POOL_B';
  } | null;
  currentMatch?: DominoMatch | null;
  onClose: () => void;
  isAutoRunning: boolean;
  onToggleAuto: () => void;
  onNextSlot: () => void;
  speed: 'SLOW' | 'NORMAL' | 'FAST' | 'INSTANT';
  totalDrawnCount: number;
  totalSlots?: number;
}

export const DominoDrawFocusingModal: React.FC<DominoDrawFocusingModalProps> = ({
  isOpen,
  isRolling,
  rollingCandidate,
  currentDrawn,
  currentMatch,
  onClose,
  isAutoRunning,
  onToggleAuto,
  onNextSlot,
  speed,
  totalDrawnCount,
  totalSlots = 64,
}) => {
  const [pulseGlow, setPulseGlow] = useState(false);
  const [randomDots, setRandomDots] = useState<{ top: number; bottom: number }>({ top: 6, bottom: 6 });

  // Shuffle random dots rapidly while rolling
  useEffect(() => {
    if (!isRolling) {
      setPulseGlow(true);
      const t = setTimeout(() => setPulseGlow(false), 1200);
      return () => clearTimeout(t);
    }

    const interval = setInterval(() => {
      setRandomDots({
        top: Math.floor(Math.random() * 7),
        bottom: Math.floor(Math.random() * 7),
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isRolling]);

  if (!isOpen) return null;

  // Determine physical table info
  const targetMatchNumber = currentDrawn?.matchNumber || 1;
  const isPoolA = targetMatchNumber <= 16;
  const physicalTable = isPoolA ? targetMatchNumber : targetMatchNumber - 16;
  const sessionNumber = isPoolA ? 1 : 2;

  const opponent = currentDrawn?.slot === 2 && currentMatch ? currentMatch.player1 : null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in select-none">
      {/* Background searchlight effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-red-600/20 via-amber-500/15 to-blue-600/20 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute top-10 left-1/4 w-80 h-80 bg-red-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#0e172e] via-[#091024] to-[#050917] border-2 border-red-500/40 rounded-[36px] p-6 sm:p-10 shadow-[0_0_80px_rgba(239,68,68,0.35)] flex flex-col items-center text-center overflow-hidden">
        {/* Top Header Banner */}
        <div className="w-full flex items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-red-400 italic">
              {isRolling ? 'LIVE DRAWING STAGE • SISTEM ANTI-CLASH AKTIF' : 'HASIL UNDIAN TERKUNCI'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono font-bold text-amber-400">
              SLOT {totalDrawnCount} / {totalSlots}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all active:scale-95"
              title="Tutup Fokus (Kembali ke Papan)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Spotlight Focus Arena */}
        <div className="py-6 sm:py-8 w-full flex flex-col items-center relative z-10 space-y-6">
          {/* Target Physical Table Badge */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <div className="px-4 py-1.5 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 text-amber-300 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>MEJA {String(physicalTable).padStart(2, '0')}</span>
              <span className="text-white/60">•</span>
              <span>SESI {sessionNumber} ({isPoolA ? 'POOL A' : 'POOL B'})</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold text-xs uppercase">
              {currentDrawn?.slot === 1 ? 'SLOT 1 (TIM PERTAMA)' : 'SLOT 2 (PENANTANG)'}
            </div>
          </div>

          {/* 3D Animated Domino Tile with Neon Glow */}
          <div className="relative py-2 group">
            <div
              className={`transform transition-all duration-300 ${
                isRolling ? 'rotate-[-8deg] scale-110' : pulseGlow ? 'scale-125 rotate-0' : 'scale-105'
              }`}
            >
              <DominoTile
                top={isRolling ? randomDots.top : currentDrawn ? (targetMatchNumber % 6) + 1 : 6}
                bottom={isRolling ? randomDots.bottom : currentDrawn ? (currentDrawn.slot === 1 ? 6 : 1) : 6}
                size="xl"
                glow={!isRolling}
                isShuffling={isRolling}
                className="shadow-[0_0_60px_rgba(239,68,68,0.7)]"
              />
            </div>

            {isRolling && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[10px] uppercase tracking-widest italic shadow-lg animate-bounce">
                MENGACAK TONGKRONGAN
              </div>
            )}
          </div>

          {/* Participant Name Spotlight */}
          <div className="space-y-3 max-w-2xl w-full">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              {isRolling ? 'CALON PESERTA BERIKUTNYA...' : 'PASANGAN TERPILIH:'}
            </div>

            <div
              className={`py-3 px-6 rounded-3xl transition-all duration-300 ${
                isRolling
                  ? 'bg-black/40 border border-white/10'
                  : 'bg-gradient-to-r from-red-950/60 via-slate-900 to-red-950/60 border-2 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.4)]'
              }`}
            >
              <h2
                className={`text-2xl sm:text-5xl font-black uppercase italic tracking-tight transition-all duration-150 ${
                  isRolling
                    ? 'text-slate-300 opacity-90 scale-95 blur-[0.4px]'
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-white scale-100 drop-shadow-[0_5px_15px_rgba(245,158,11,0.5)]'
                }`}
              >
                {isRolling ? rollingCandidate : currentDrawn ? currentDrawn.participant.name : 'VAMOS DOMINO 2026'}
              </h2>

              {/* Team or tongkrongan tag */}
              {(!isRolling && currentDrawn?.participant.team && currentDrawn.participant.team !== 'INDIVIDUAL') && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>KLUB / KOMUNITAS: {currentDrawn.participant.team}</span>
                </div>
              )}
            </div>

            {/* Duel Face-off Indicator when Slot 2 is filled */}
            {!isRolling && opponent && (
              <div className="p-4 rounded-2xl bg-[#121c38] border border-blue-500/30 flex items-center justify-between gap-4 text-left animate-slide-up">
                <div className="flex-1">
                  <span className="text-[9px] font-bold uppercase text-blue-400 block">LAWANDI MEJA {physicalTable}:</span>
                  <p className="text-sm font-black text-white uppercase italic">{opponent.name}</p>
                  {opponent.team && opponent.team !== 'INDIVIDUAL' && (
                    <span className="text-[9px] text-amber-400 uppercase font-bold">{opponent.team}</span>
                  )}
                </div>

                <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center font-black text-red-400 text-xs italic shrink-0">
                  VS
                </div>

                <div className="flex-1 text-right">
                  <span className="text-[9px] font-bold uppercase text-red-400 block">PENANTANG:</span>
                  <p className="text-sm font-black text-white uppercase italic">{currentDrawn?.participant.name}</p>
                  {currentDrawn?.participant.team && currentDrawn.participant.team !== 'INDIVIDUAL' && (
                    <span className="text-[9px] text-amber-400 uppercase font-bold">{currentDrawn.participant.team}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Interactive Controls */}
        <div className="w-full pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="text-xs text-slate-400 font-medium text-left">
            Kecepatan Undian: <strong className="text-white uppercase">{speed}</strong>
            {isAutoRunning && <span className="text-emerald-400 font-bold ml-2 animate-pulse">• AUTO RUNNING</span>}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onToggleAuto}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider italic flex items-center justify-center gap-2 transition-all active:scale-95 ${
                isAutoRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              }`}
            >
              {isAutoRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isAutoRunning ? 'JEDA' : 'LANJUTKAN OTOMATIS'}</span>
            </button>

            {!isAutoRunning && totalDrawnCount < totalSlots && (
              <button
                onClick={onNextSlot}
                disabled={isRolling}
                className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs uppercase tracking-wider italic flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50"
              >
                <span>UNDI SLOT BERIKUTNYA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-xs font-black uppercase tracking-wider transition-all"
            >
              LIHAT PAPAN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
