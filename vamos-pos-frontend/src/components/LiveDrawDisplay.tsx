import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, X, Crown, Volume2, VolumeX, Zap } from 'lucide-react';

interface LiveDrawDisplayProps {
  tournament: any;
  onClose: () => void;
}

export function LiveDrawDisplay({ tournament, onClose }: LiveDrawDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [revealedMatchIndex, setRevealedMatchIndex] = useState(-1);
  const [shufflingName, setShufflingName] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  // Sort round 1 matches only (initial draw)
  const round1Matches = tournament.matches
    ? tournament.matches
        .filter((m: any) => m.round === 1)
        .sort((a: any, b: any) => a.matchNumber - b.matchNumber)
    : [];

  const participants = tournament.participants || [];

  // Random player name getter for the slot machine effect
  const getRandomName = () => {
    if (!participants.length) return 'TBD';
    const rand = participants[Math.floor(Math.random() * participants.length)];
    return rand.name || rand.member?.name || 'TBD';
  };

  const getPlayerName = (pId: string) => {
    if (!pId) return 'TBD';
    const p = participants.find((pt: any) => pt.id === pId);
    return p ? (p.name || p.member?.name) : 'TBD';
  };

  useEffect(() => {
    if (!isPlaying) return;

    const MATCH_SHUFFLE_DURATION = 1500; // 1.5 seconds per slot

    if (revealedMatchIndex >= round1Matches.length * 2) {
      setIsPlaying(false);
      setShufflingName(null);
      return; // Finished
    }

    // Effect: Fast slot machine shuffling
    const shuffleInterval = setInterval(() => {
      setShufflingName(getRandomName());
    }, 50); // fast tick

    // Timeout to lock in the name
    const lockInTimeout = setTimeout(() => {
      clearInterval(shuffleInterval);
      setShufflingName(null);
      setRevealedMatchIndex((prev) => prev + 1);
    }, MATCH_SHUFFLE_DURATION);

    return () => {
      clearInterval(shuffleInterval);
      clearTimeout(lockInTimeout);
    };
  }, [isPlaying, revealedMatchIndex, round1Matches.length]);

  const toggleSound = () => setSoundEnabled(!soundEnabled);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050510] flex flex-col font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,170,255,0.1)_0%,rgba(0,0,0,1)_100%)]"></div>
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#00aaff]/20 rounded-2xl flex items-center justify-center border border-[#00aaff]/30 shadow-[0_0_30px_rgba(0,170,255,0.3)]">
            <Trophy className="w-8 h-8 text-[#00aaff]" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              {tournament.name}
            </h1>
            <p className="text-[#00aaff] font-mono text-lg font-bold tracking-widest mt-1">
              OFFICIAL LIVE BRACKET DRAW
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={toggleSound} className="text-gray-400 hover:text-white transition">
            {soundEnabled ? <Volume2 className="w-8 h-8" /> : <VolumeX className="w-8 h-8" />}
          </button>
          <button 
            onClick={onClose}
            className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content Arena */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-10">
        
        {/* Giant Shuffler */}
        <div className="mb-12 h-40 flex items-center justify-center w-full max-w-4xl">
          {!isPlaying && revealedMatchIndex === -1 && (
            <button 
              onClick={() => setIsPlaying(true)}
              className="px-16 py-8 bg-gradient-to-r from-[#00ff66] to-[#00aaff] text-black font-black text-4xl rounded-full uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(0,255,102,0.5)] hover:scale-105 transition-transform active:scale-95 flex items-center gap-4"
            >
              <Zap className="w-10 h-10" /> START DRAW
            </button>
          )}

          {isPlaying && shufflingName && (
            <div className="w-full text-center animate-pulse">
              <span className="text-[80px] font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
                {shufflingName}
              </span>
            </div>
          )}

          {!isPlaying && revealedMatchIndex >= round1Matches.length * 2 && (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <span className="text-6xl font-black text-amber-400 uppercase italic tracking-widest drop-shadow-[0_0_30px_rgba(251,191,36,0.6)] flex items-center gap-4">
                <Crown className="w-16 h-16" /> BRACKET COMPLETE
              </span>
            </div>
          )}
        </div>

        {/* Bracket Slots Display */}
        <div className="w-full max-w-7xl grid grid-cols-4 gap-6 px-10">
          {round1Matches.map((m: any, idx: number) => {
            // Slot indexes for p1 and p2 in this linear animation sequence
            const p1Index = idx * 2;
            const p2Index = idx * 2 + 1;

            const isP1Revealed = revealedMatchIndex >= p1Index + 1;
            const isP2Revealed = revealedMatchIndex >= p2Index + 1;

            const isP1CurrentlyDrawing = isPlaying && revealedMatchIndex === p1Index;
            const isP2CurrentlyDrawing = isPlaying && revealedMatchIndex === p2Index;

            return (
              <div key={m.id} className="relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#00aaff]"></div>
                <div className="bg-black/40 px-4 py-2 border-b border-white/5 flex justify-between items-center">
                   <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Match {m.matchNumber}</span>
                </div>
                <div className="p-4 space-y-3">
                  {/* P1 Slot */}
                  <div className={`h-12 bg-black/60 rounded-xl border flex items-center px-4 transition-all duration-300 ${
                      isP1CurrentlyDrawing ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] scale-105' :
                      isP1Revealed ? 'border-[#00ff66]/30 bg-[#00ff66]/10' : 'border-dashed border-white/20'
                  }`}>
                    <span className={`text-lg font-black uppercase truncate ${isP1Revealed ? 'text-white drop-shadow-md' : 'text-gray-600'}`}>
                      {isP1Revealed ? getPlayerName(m.player1Id) : '???'}
                    </span>
                  </div>

                  <div className="text-center text-[10px] text-gray-600 font-black italic">VS</div>

                  {/* P2 Slot */}
                  <div className={`h-12 bg-black/60 rounded-xl border flex items-center px-4 transition-all duration-300 ${
                      isP2CurrentlyDrawing ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] scale-105' :
                      isP2Revealed ? 'border-red-500/30 bg-red-500/10' : 'border-dashed border-white/20'
                  }`}>
                    <span className={`text-lg font-black uppercase truncate ${isP2Revealed ? 'text-white drop-shadow-md' : 'text-gray-600'}`}>
                      {isP2Revealed ? getPlayerName(m.player2Id) : '???'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
