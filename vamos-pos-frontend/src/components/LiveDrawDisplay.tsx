import { useState, useEffect, useRef } from 'react';
import { Trophy, X, Crown, Volume2, VolumeX, Zap, Maximize, Minimize, Shuffle, FastForward, RotateCcw, Flame, Loader2 } from 'lucide-react';
import { api } from '../api';

interface LiveDrawDisplayProps {
  tournament: any;
  onClose: () => void;
  onTournamentUpdated?: (updatedTournament: any) => void;
}

export function LiveDrawDisplay({ tournament: initialTournament, onClose, onTournamentUpdated }: LiveDrawDisplayProps) {
  const [tournament, setTournament] = useState<any>(initialTournament);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReshuffling, setIsReshuffling] = useState(false);
  const [revealedMatchIndex, setRevealedMatchIndex] = useState(-1);
  const [shufflingName, setShufflingName] = useState<string | null>(null);
  const [shufflingParticipant, setShufflingParticipant] = useState<any | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawSpeed, setDrawSpeed] = useState<'normal' | 'fast'>('normal');
  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Sound Effects Synthesis
  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio error ignored
    }
  };

  const playLockSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio error ignored
    }
  };

  const playFanfareSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.4);
      });
    } catch {
      // Audio error ignored
    }
  };

  // Sort round 1 matches
  const round1Matches = tournament.matches
    ? tournament.matches
        .filter((m: any) => Number(m.round) === 1)
        .sort((a: any, b: any) => Number(a.matchNumber) - Number(b.matchNumber))
    : [];

  const participants = tournament.participants || [];

  // Split matches into Pool A (Left Wing) & Pool B (Right Wing)
  const halfCount = Math.ceil(round1Matches.length / 2);
  const poolAMatches = round1Matches.slice(0, halfCount);
  const poolBMatches = round1Matches.slice(halfCount);

  const getRandomParticipant = () => {
    if (!participants.length) return { name: 'TBD', handicap: '-' };
    return participants[Math.floor(Math.random() * participants.length)];
  };

  const getParticipant = (pId: string) => {
    if (!pId) return null;
    return participants.find((pt: any) => pt.id === pId) || null;
  };

  // Toggle Browser Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Live Draw Animation Loop
  useEffect(() => {
    if (!isPlaying) return;

    const totalSlots = round1Matches.length * 2;
    if (revealedMatchIndex >= totalSlots) {
      setIsPlaying(false);
      setShufflingName(null);
      setShufflingParticipant(null);
      playFanfareSound();
      return;
    }

    const duration = drawSpeed === 'fast' ? 500 : 1200;

    // Fast shuffle ticks
    const shuffleInterval = setInterval(() => {
      const p = getRandomParticipant();
      setShufflingParticipant(p);
      setShufflingName(p.name || p.member?.name || 'TBD');
      playTickSound();
    }, 60);

    const lockInTimeout = setTimeout(() => {
      clearInterval(shuffleInterval);
      setShufflingName(null);
      setShufflingParticipant(null);
      playLockSound();
      setRevealedMatchIndex((prev) => prev + 1);
    }, duration);

    return () => {
      clearInterval(shuffleInterval);
      clearTimeout(lockInTimeout);
    };
  }, [isPlaying, revealedMatchIndex, round1Matches.length, drawSpeed]);

  const handleInstantComplete = () => {
    setIsPlaying(false);
    setShufflingName(null);
    setShufflingParticipant(null);
    setRevealedMatchIndex(round1Matches.length * 2);
    playFanfareSound();
  };

  const handleResetDraw = () => {
    setIsPlaying(false);
    setRevealedMatchIndex(-1);
    setShufflingName(null);
    setShufflingParticipant(null);
  };

  const handleReshuffleBracket = async () => {
    if (!window.confirm("Acak ulang bagan turnamen? Seluruh pasangan lawan akan diundi ulang secara acak di server.")) {
      return;
    }
    try {
      setIsReshuffling(true);
      setIsPlaying(false);
      const res = await api.post(`/tournaments/${tournament.id}/reshuffle-bracket`);
      if (res.data && res.data.data) {
        setTournament(res.data.data);
        onTournamentUpdated?.(res.data.data);
      }
      setRevealedMatchIndex(-1);
      setShufflingName(null);
      setShufflingParticipant(null);
      setTimeout(() => {
        setIsPlaying(true);
      }, 400);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Gagal mengacak ulang bagan');
    } finally {
      setIsReshuffling(false);
    }
  };

  // Calculate current drawing target info
  const currentSlotIndex = revealedMatchIndex + 1;
  const currentMatchIndex = Math.floor(currentSlotIndex / 2);
  const isDrawingPlayer1 = currentSlotIndex % 2 === 0;
  const targetMatch = round1Matches[currentMatchIndex];
  const targetPlayerId = targetMatch ? (isDrawingPlayer1 ? targetMatch.player1Id : targetMatch.player2Id) : null;
  const targetPlayer = targetPlayerId ? getParticipant(targetPlayerId) : null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[200] bg-[#030712] text-white flex flex-col select-none overflow-hidden font-sans"
    >
      {/* ─── AMBIENT ESPORTS GLOW & GRID ─── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15)_0%,rgba(3,7,18,0.95)_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(234,179,8,0.1)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* ─── TOP BROADCAST HEADER ─── */}
      <header className="relative z-20 flex items-center justify-between px-6 py-3.5 border-b border-cyan-500/20 bg-black/60 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center text-black">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                LIVE BROADCAST
              </span>
              <span className="text-cyan-400 font-mono text-[10px] tracking-widest uppercase">
                {participants.length} PESERTA • {round1Matches.length} MATCHES
              </span>
            </div>
            <h1 className="text-2xl font-black text-white italic tracking-tight uppercase leading-none mt-1 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              {tournament.name}
            </h1>
          </div>
        </div>

        {/* Top Action Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setDrawSpeed(drawSpeed === 'normal' ? 'fast' : 'normal')}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider italic flex items-center gap-1.5 transition-all ${
              drawSpeed === 'fast' 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Kecepatan Undian"
          >
            <FastForward className="w-3.5 h-3.5" />
            {drawSpeed === 'fast' ? 'Turbo (0.5s)' : 'Normal (1.2s)'}
          </button>

          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
            title="Suara FX"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button 
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 flex items-center justify-center text-cyan-400 transition-all"
            title="Full Screen Mode"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-white flex items-center justify-center text-red-400 transition-all ml-2"
            title="Tutup Live Draw"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ─── MAIN STAGE (3 COLUMNS: POOL A | CENTER ARENA | POOL B) ─── */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
        
        {/* ─── LEFT WING: POOL A (BAGAN ATAS) ─── */}
        <div className="col-span-3 flex flex-col min-h-0 bg-black/40 border border-white/5 rounded-3xl p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest italic flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              POOL A • BAGAN ATAS
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              Matches 1 - {poolAMatches.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {poolAMatches.map((m: any, idx: number) => {
              const actualMatchIdx = idx;
              const p1Index = actualMatchIdx * 2;
              const p2Index = actualMatchIdx * 2 + 1;
              const isP1Revealed = revealedMatchIndex >= p1Index + 1;
              const isP2Revealed = revealedMatchIndex >= p2Index + 1;
              const isP1Drawing = isPlaying && revealedMatchIndex === p1Index;
              const isP2Drawing = isPlaying && revealedMatchIndex === p2Index;
              const p1 = getParticipant(m.player1Id);
              const p2 = getParticipant(m.player2Id);

              return (
                <MatchDrawCard 
                  key={m.id || idx}
                  matchNumber={m.matchNumber || idx + 1}
                  p1={p1}
                  p2={p2}
                  isP1Revealed={isP1Revealed}
                  isP2Revealed={isP2Revealed}
                  isP1Drawing={isP1Drawing}
                  isP2Drawing={isP2Drawing}
                />
              );
            })}
          </div>
        </div>

        {/* ─── CENTER STAGE: GIANT SHUFFLER & DRAW CONTROLLER ─── */}
        <div className="col-span-6 flex flex-col justify-between items-center py-2 px-4 relative">
          
          {/* Top Stage Indicator */}
          <div className="w-full flex justify-between items-center px-4">
            <div className="text-left">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Proses Undian</span>
              <span className="text-sm font-black text-cyan-400 font-mono italic">
                {Math.max(0, revealedMatchIndex + 1)} / {round1Matches.length * 2} SLOTS
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-48 h-2.5 rounded-full bg-black/60 border border-white/10 overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-yellow-400 to-emerald-400 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                style={{ width: `${Math.min(100, ((revealedMatchIndex + 1) / (round1Matches.length * 2)) * 100)}%` }}
              />
            </div>

            <div className="text-right">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Target Match</span>
              <span className="text-sm font-black text-white italic">
                {targetMatch ? `Match #${targetMatch.matchNumber} (${isDrawingPlayer1 ? 'Slot 1' : 'Slot 2'})` : 'Selesai'}
              </span>
            </div>
          </div>

          {/* ─── CENTER SHOWCASE STAGE ─── */}
          <div className="w-full max-w-xl my-auto flex flex-col items-center justify-center relative">
            
            {/* Ambient Spotlight */}
            <div className="absolute w-80 h-80 rounded-full bg-cyan-500/15 blur-[90px] pointer-events-none animate-pulse" />

            {/* 1. STATE: SEBELUM START */}
            {!isPlaying && revealedMatchIndex === -1 && (
              <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 mx-auto flex items-center justify-center text-black shadow-[0_0_50px_rgba(6,182,212,0.6)]">
                  <Shuffle className="w-12 h-12 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-wider">
                    SIAPKAN DRAWING BAGAN
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Kocokan transparan live untuk menentukan posisi bagan {participants.length} peserta di babak Round 1.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button 
                    onClick={() => setIsPlaying(true)}
                    className="px-10 py-4 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-black font-black text-lg rounded-2xl uppercase tracking-[0.2em] italic shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                  >
                    <Zap className="w-6 h-6 fill-black" />
                    START LIVE DRAW
                  </button>
                  <button 
                    onClick={handleReshuffleBracket}
                    disabled={isReshuffling}
                    className="px-6 py-4 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-300 font-black text-xs rounded-2xl uppercase tracking-wider italic transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10"
                    title="Kocok ulang seluruh posisi lawan di database"
                  >
                    {isReshuffling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
                    🎲 Acak Baru Bagan
                  </button>
                  <button 
                    onClick={handleInstantComplete}
                    className="px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-xs rounded-2xl uppercase tracking-wider italic transition-all"
                  >
                    Instan (Semua)
                  </button>
                </div>
              </div>
            )}

            {/* 2. STATE: SEDANG DRAWING BERJALAN (SHUFFLING) */}
            {isPlaying && (
              <div className="w-full text-center space-y-5 animate-in fade-in duration-150">
                <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 text-xs font-black uppercase tracking-widest italic animate-bounce">
                  <Flame className="w-4 h-4 fill-yellow-400" />
                  MENGUNDI MATCH #{targetMatch?.matchNumber} • {isDrawingPlayer1 ? 'PLAYER 1' : 'PLAYER 2'}
                </span>

                {/* Giant Rolling Name Display */}
                <div className="p-8 rounded-[36px] bg-gradient-to-b from-black/80 to-[#070e1c] border-2 border-cyan-400/60 shadow-[0_0_60px_rgba(6,182,212,0.35)] relative overflow-hidden backdrop-blur-2xl">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)]" />
                  
                  <p className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.3em] italic mb-1 relative z-10">
                    PESERTA TERPILIH:
                  </p>

                  <h3 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] truncate relative z-10 py-1">
                    {shufflingName || targetPlayer?.name || targetPlayer?.member?.name || 'MENGACAK...'}
                  </h3>

                  <div className="flex items-center justify-center gap-3 mt-3 relative z-10">
                    <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-xs font-black text-yellow-400 italic">
                      HC {shufflingParticipant?.handicap || targetPlayer?.handicap || '-'}
                    </span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      {targetMatch ? `Masuk ke Match #${targetMatch.matchNumber}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button 
                    onClick={() => setIsPlaying(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:text-white uppercase tracking-wider italic"
                  >
                    Pause
                  </button>
                  <button 
                    onClick={handleInstantComplete}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-xs font-black text-cyan-400 hover:bg-cyan-500/30 uppercase tracking-wider italic"
                  >
                    Langsung Selesaikan
                  </button>
                </div>
              </div>
            )}

            {/* 3. STATE: SELESAI (COMPLETE) */}
            {!isPlaying && revealedMatchIndex >= round1Matches.length * 2 && (
              <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-400 to-amber-600 mx-auto flex items-center justify-center text-black shadow-[0_0_50px_rgba(250,204,21,0.6)] animate-bounce">
                  <Crown className="w-14 h-14" />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-yellow-400 uppercase italic tracking-wider drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]">
                    BRACKET DRAW COMPLETE!
                  </h2>
                  <p className="text-sm text-slate-300 mt-2 font-bold max-w-md mx-auto">
                    Semua posisi pertandingan Round 1 telah berhasil diundi dan terkunci di bagan turnamen.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button 
                    onClick={onClose}
                    className="px-10 py-4 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-black text-sm rounded-2xl uppercase tracking-[0.2em] italic shadow-[0_0_30px_rgba(250,204,21,0.5)] hover:scale-105 active:scale-95 transition-all"
                  >
                    TUTUP & LIHAT BAGAN LENGKAP
                  </button>
                  <button 
                    onClick={handleReshuffleBracket}
                    disabled={isReshuffling}
                    className="px-6 py-4 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 font-black text-xs rounded-2xl uppercase tracking-wider italic flex items-center gap-2 shadow-lg shadow-amber-500/10"
                  >
                    {isReshuffling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
                    🎲 Acak Ulang Bagan Baru
                  </button>
                  <button 
                    onClick={handleResetDraw}
                    className="px-5 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs rounded-2xl uppercase tracking-wider italic flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Putar Animasi Lagi
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Footer Info */}
          <div className="w-full flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest px-4 border-t border-white/5 pt-2">
            <span>Vamos Pool Tournament Live Engine</span>
            <span>Tekan F11 / Tombol Maximize untuk Mode Layar Penuh TV</span>
          </div>
        </div>

        {/* ─── RIGHT WING: POOL B (BAGAN BAWAH) ─── */}
        <div className="col-span-3 flex flex-col min-h-0 bg-black/40 border border-white/5 rounded-3xl p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest italic flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              POOL B • BAGAN BAWAH
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              Matches {poolAMatches.length + 1} - {round1Matches.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {poolBMatches.map((m: any, idx: number) => {
              const actualMatchIdx = halfCount + idx;
              const p1Index = actualMatchIdx * 2;
              const p2Index = actualMatchIdx * 2 + 1;
              const isP1Revealed = revealedMatchIndex >= p1Index + 1;
              const isP2Revealed = revealedMatchIndex >= p2Index + 1;
              const isP1Drawing = isPlaying && revealedMatchIndex === p1Index;
              const isP2Drawing = isPlaying && revealedMatchIndex === p2Index;
              const p1 = getParticipant(m.player1Id);
              const p2 = getParticipant(m.player2Id);

              return (
                <MatchDrawCard 
                  key={m.id || actualMatchIdx}
                  matchNumber={m.matchNumber || actualMatchIdx + 1}
                  p1={p1}
                  p2={p2}
                  isP1Revealed={isP1Revealed}
                  isP2Revealed={isP2Revealed}
                  isP1Drawing={isP1Drawing}
                  isP2Drawing={isP2Drawing}
                />
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}

// Sub-component: Match Draw Card
interface MatchDrawCardProps {
  matchNumber: number;
  p1: any;
  p2: any;
  isP1Revealed: boolean;
  isP2Revealed: boolean;
  isP1Drawing: boolean;
  isP2Drawing: boolean;
}

function MatchDrawCard({
  matchNumber,
  p1,
  p2,
  isP1Revealed,
  isP2Revealed,
  isP1Drawing,
  isP2Drawing
}: MatchDrawCardProps) {
  return (
    <div className={`p-2.5 rounded-2xl border transition-all duration-300 ${
      isP1Drawing || isP2Drawing 
        ? 'border-yellow-400/80 bg-yellow-500/10 shadow-[0_0_20px_rgba(250,204,21,0.3)] scale-[1.02]' 
        : isP1Revealed && isP2Revealed 
        ? 'border-cyan-500/30 bg-black/50' 
        : 'border-white/5 bg-black/30'
    }`}>
      <div className="flex justify-between items-center mb-1.5 px-1">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
          Match #{matchNumber}
        </span>
        {isP1Revealed && isP2Revealed ? (
          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">✓ Terisi</span>
        ) : isP1Drawing || isP2Drawing ? (
          <span className="text-[8px] font-black text-yellow-400 uppercase tracking-wider animate-pulse">Mengundi...</span>
        ) : (
          <span className="text-[8px] font-mono text-slate-600 uppercase">Menunggu</span>
        )}
      </div>

      <div className="space-y-1">
        {/* Player 1 Slot */}
        <div className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs transition-all duration-200 ${
          isP1Drawing 
            ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300 animate-pulse font-black' 
            : isP1Revealed 
            ? 'border-cyan-500/40 bg-cyan-950/30 text-white font-bold' 
            : 'border-dashed border-white/10 text-slate-600'
        }`}>
          <span className="truncate max-w-[140px] uppercase italic">
            {isP1Revealed ? (p1?.name || p1?.member?.name || 'TBD') : isP1Drawing ? '🎲 Mengacak...' : '???'}
          </span>
          {isP1Revealed && p1?.handicap && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 shrink-0">
              HC {p1.handicap}
            </span>
          )}
        </div>

        {/* Player 2 Slot */}
        <div className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs transition-all duration-200 ${
          isP2Drawing 
            ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300 animate-pulse font-black' 
            : isP2Revealed 
            ? 'border-amber-500/40 bg-amber-950/30 text-white font-bold' 
            : 'border-dashed border-white/10 text-slate-600'
        }`}>
          <span className="truncate max-w-[140px] uppercase italic">
            {isP2Revealed ? (p2?.name || p2?.member?.name || 'TBD') : isP2Drawing ? '🎲 Mengacak...' : '???'}
          </span>
          {isP2Revealed && p2?.handicap && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
              HC {p2.handicap}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
