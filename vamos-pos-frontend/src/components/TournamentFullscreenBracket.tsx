import { useState, useEffect, useRef } from 'react';
import { Trophy, X, Maximize, Minimize, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { getSocketURL } from '../api';
import { io } from 'socket.io-client';

interface TournamentFullscreenBracketProps {
    tournament: any;
    onClose: () => void;
    onScoreClick?: (match: any, p1Name: string, p2Name: string) => void;
    onSlotClick?: (matchId: string, slot: 1 | 2, participant: any) => void;
}

export function TournamentFullscreenBracket({
    tournament: initialTournament,
    onClose,
    onScoreClick,
    onSlotClick
}: TournamentFullscreenBracketProps) {
    const [tournament, setTournament] = useState<any>(initialTournament);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [activeSection, setActiveSection] = useState<'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FINALS'>('ALL');
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync with Socket.IO updates
    useEffect(() => {
        const socketUrl = getSocketURL();
        const socket = io(socketUrl);

        socket.on('tournaments:updated', () => {
            // Re-fetch tournament or let parent pass updated props
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        setTournament(initialTournament);
    }, [initialTournament]);

    // Handle Native Fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
            }
        }
    };

    // ESC key listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => { });
                }
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const matches = tournament?.matches || [];
    const participants = tournament?.participants || [];

    const getParticipant = (pId: string | null | undefined) => {
        if (!pId) return null;
        return participants.find((p: any) => p.id === pId) || null;
    };

    const rounds: number[] = Array.from(new Set<number>(matches.map((m: any) => Number(m.round)))).sort((a: number, b: number) => a - b);

    // Filter matches based on selected section (Kuadran 1-4 or Finals)
    const filterMatchBySection = (m: any) => {
        if (activeSection === 'ALL') return true;
        const totalR1 = matches.filter((x: any) => Number(x.round) === 1).length;
        if (totalR1 <= 16) return true; // smaller bracket doesn't need quadrants

        const qSize = Math.max(1, Math.floor(totalR1 / 4));
        if (activeSection === 'FINALS') {
            return Number(m.round) >= (totalR1 >= 64 ? 5 : 4);
        }

        const matchIdx = Number(m.matchNumber) - 1;
        if (activeSection === 'Q1') return matchIdx < qSize * 2;
        if (activeSection === 'Q2') return matchIdx >= qSize * 2 && matchIdx < qSize * 4;
        if (activeSection === 'Q3') return matchIdx >= qSize * 4 && matchIdx < qSize * 6;
        if (activeSection === 'Q4') return matchIdx >= qSize * 6 && matchIdx < qSize * 8;
        return true;
    };

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-50 bg-[#070707] text-white flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
        >
            {/* ─── STADIUM TOP BAR ─── */}
            <div className="bg-[#101010]/95 backdrop-blur-md border-b border-[#222222] px-6 py-3 flex items-center justify-between z-20 shadow-xl">
                {/* Left: Tournament Identity */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-black text-white uppercase tracking-wider font-mono">
                                {tournament?.name}
                            </h1>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 border border-red-500/30 text-red-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                LIVE BRACKET
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                            <span>{tournament?.format || 'PES 3 - Single Elimination'}</span>
                            <span>•</span>
                            <span>{participants.length} / {tournament?.maxPlayers || 128} Slot</span>
                            {tournament?.prizePool > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="text-yellow-400 font-bold font-mono">
                                        Total Hadiah: Rp {tournament.prizePool.toLocaleString('id-ID')}
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Center: Kuadran Quick Filters */}
                <div className="hidden xl:flex items-center gap-1.5 bg-[#0a0a0a] p-1 rounded-xl border border-[#222222]">
                    {[
                        { id: 'ALL', label: 'Semua Bagan' },
                        { id: 'Q1', label: 'Kuadran 1' },
                        { id: 'Q2', label: 'Kuadran 2' },
                        { id: 'Q3', label: 'Kuadran 3' },
                        { id: 'Q4', label: 'Kuadran 4' },
                        { id: 'FINALS', label: '🏆 8 Besar & Final' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSection(tab.id as any)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeSection === tab.id
                                    ? 'bg-yellow-500 text-black shadow-sm font-black'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Right: Controls & Fullscreen */}
                <div className="flex items-center gap-2">
                    {/* Zoom Buttons */}
                    <div className="flex items-center bg-[#1a1a1a] rounded-xl border border-[#262626] p-0.5">
                        <button
                            onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="px-2 font-mono text-[11px] font-bold text-gray-400 min-w-[45px] text-center">
                            {Math.round(zoomLevel * 100)}%
                        </span>
                        <button
                            onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.1))}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setZoomLevel(1)}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-yellow-400 transition-colors ml-0.5"
                            title="Reset Zoom (100%)"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Toggle Native Fullscreen */}
                    <button
                        onClick={toggleFullscreen}
                        className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-white/10 text-gray-300 hover:text-white border border-[#262626] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh TV (F11)'}
                    >
                        {isFullscreen ? <Minimize className="w-4 h-4 text-yellow-400" /> : <Maximize className="w-4 h-4 text-yellow-400" />}
                        <span className="hidden md:inline">{isFullscreen ? 'Exit Full' : 'Layar Penuh TV'}</span>
                    </button>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl transition-colors ml-1"
                        title="Tutup (ESC)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* ─── BRACKET CANVAS ─── */}
            <div className="flex-1 overflow-auto p-6 md:p-8 bg-radial from-[#121212] to-[#070707] flex justify-start items-start">
                <div
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                    className="transition-transform duration-100 flex space-x-12 pb-12"
                >
                    {rounds.map(roundNum => {
                        const roundMatches = matches
                            .filter((m: any) => Number(m.round) === roundNum && filterMatchBySection(m))
                            .sort((a: any, b: any) => Number(a.matchNumber) - Number(b.matchNumber));

                        if (roundMatches.length === 0) return null;

                        // Round Title formatting
                        const totalR1 = matches.filter((x: any) => Number(x.round) === 1).length;
                        let roundTitle = `PUTARAN ${roundNum}`;
                        if (totalR1 === 64) {
                            if (roundNum === 1) roundTitle = 'BABAK 128 BESAR';
                            else if (roundNum === 2) roundTitle = 'BABAK 64 BESAR';
                            else if (roundNum === 3) roundTitle = 'BABAK 32 BESAR';
                            else if (roundNum === 4) roundTitle = 'BABAK 16 BESAR';
                            else if (roundNum === 5) roundTitle = '⚔️ 8 BESAR (QF)';
                            else if (roundNum === 6) roundTitle = 'SEMIFINAL';
                            else if (roundNum === 7) roundTitle = '🏆 GRAND FINAL';
                        } else if (totalR1 === 32) {
                            if (roundNum === 1) roundTitle = 'BABAK 64 BESAR';
                            else if (roundNum === 2) roundTitle = 'BABAK 32 BESAR';
                            else if (roundNum === 3) roundTitle = 'BABAK 16 BESAR';
                            else if (roundNum === 4) roundTitle = '⚔️ 8 BESAR (QF)';
                            else if (roundNum === 5) roundTitle = 'SEMIFINAL';
                            else if (roundNum === 6) roundTitle = '🏆 GRAND FINAL';
                        } else if (totalR1 === 16) {
                            if (roundNum === 1) roundTitle = 'BABAK 32 BESAR';
                            else if (roundNum === 2) roundTitle = 'BABAK 16 BESAR';
                            else if (roundNum === 3) roundTitle = '⚔️ 8 BESAR (QF)';
                            else if (roundNum === 4) roundTitle = 'SEMIFINAL';
                            else if (roundNum === 5) roundTitle = '🏆 GRAND FINAL';
                        }

                        return (
                            <div key={roundNum} className="flex flex-col justify-around min-w-[320px] max-w-[340px] space-y-4 relative">
                                <div className="text-center sticky top-0 z-30 pb-2">
                                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#161616] border border-[#282828] text-yellow-400 shadow-md">
                                        {roundTitle}
                                    </span>
                                </div>

                                {roundMatches.map((m: any) => {
                                    const p1 = getParticipant(m.player1Id);
                                    const p2 = getParticipant(m.player2Id);
                                    const p1Name = p1 ? (p1.name || p1.member?.name) : undefined;
                                    const p2Name = p2 ? (p2.name || p2.member?.name) : undefined;
                                    const isP1Winner = Boolean(m.winnerId && m.winnerId === m.player1Id);
                                    const isP2Winner = Boolean(m.winnerId && m.winnerId === m.player2Id);
                                    const isCompleted = m.status === 'COMPLETED';

                                    return (
                                        <div
                                            key={m.id}
                                            className={`bg-[#121212]/95 border rounded-2xl p-3 shadow-lg relative transition-all ${isCompleted
                                                    ? 'border-emerald-500/30 shadow-emerald-500/5'
                                                    : 'border-[#262626] hover:border-yellow-500/40'
                                                }`}
                                        >
                                            {/* Match Number & Status Header */}
                                            <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#202020] text-[10px]">
                                                <span className="font-mono text-gray-500 font-bold">
                                                    MATCH #{m.matchNumber}
                                                </span>
                                                {isCompleted ? (
                                                    <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> SELESAI
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 font-mono">
                                                        {m.round === 1 ? 'BABAK AWAL' : 'MENUNGGU HASIL'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Players List */}
                                            <div className="space-y-1.5">
                                                {/* Player 1 */}
                                                <div
                                                    onClick={() => onSlotClick && onSlotClick(m.id, 1, p1)}
                                                    className={`flex justify-between items-center text-xs px-2.5 py-2 rounded-xl transition-all cursor-pointer ${isP1Winner
                                                            ? 'bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/40 shadow-sm'
                                                            : !p1Name
                                                                ? m.round === 1
                                                                    ? 'bg-amber-500/5 border border-dashed border-amber-500/30 text-amber-400/80 hover:bg-amber-500/15'
                                                                    : 'bg-white/[0.02] border border-dashed border-[#222222] text-gray-600'
                                                                : 'text-gray-200 bg-white/5 hover:bg-white/10 font-bold'
                                                        }`}
                                                >
                                                    <div className="truncate flex-1 min-w-0 pr-2">
                                                        <span className={`truncate ${!p1Name ? 'italic text-[11px]' : ''}`}>
                                                            {p1Name || (m.round === 1 ? '⚡ TBD (Slot Kosong)' : `TBD (Laga R${m.round - 1})`)}
                                                        </span>
                                                        {p1?.handicap && (
                                                            <span className="block text-[10px] text-yellow-500 font-normal">
                                                                HC: {p1.handicap}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`font-mono text-sm ${isP1Winner ? 'font-black text-emerald-300' : 'text-gray-400'}`}>
                                                        {m.score1}
                                                    </span>
                                                </div>

                                                {/* Player 2 */}
                                                <div
                                                    onClick={() => onSlotClick && onSlotClick(m.id, 2, p2)}
                                                    className={`flex justify-between items-center text-xs px-2.5 py-2 rounded-xl transition-all cursor-pointer ${isP2Winner
                                                            ? 'bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/40 shadow-sm'
                                                            : !p2Name
                                                                ? m.round === 1
                                                                    ? 'bg-amber-500/5 border border-dashed border-amber-500/30 text-amber-400/80 hover:bg-amber-500/15'
                                                                    : 'bg-white/[0.02] border border-dashed border-[#222222] text-gray-600'
                                                                : 'text-gray-200 bg-white/5 hover:bg-white/10 font-bold'
                                                        }`}
                                                >
                                                    <div className="truncate flex-1 min-w-0 pr-2">
                                                        <span className={`truncate ${!p2Name ? 'italic text-[11px]' : ''}`}>
                                                            {p2Name || (m.round === 1 ? '⚡ TBD (Slot Kosong)' : `TBD (Laga R${m.round - 1})`)}
                                                        </span>
                                                        {p2?.handicap && (
                                                            <span className="block text-[10px] text-yellow-500 font-normal">
                                                                HC: {p2.handicap}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`font-mono text-sm ${isP2Winner ? 'font-black text-emerald-300' : 'text-gray-400'}`}>
                                                        {m.score2}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action / Record Score Button */}
                                            {onScoreClick && (
                                                <div className="mt-2.5 pt-2 border-t border-[#1c1c1c]">
                                                    <button
                                                        onClick={() => onScoreClick(m, p1Name || 'Player 1', p2Name || 'Player 2')}
                                                        className={`w-full py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${isCompleted
                                                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                                : 'bg-white/10 hover:bg-white/20 text-gray-300'
                                                            }`}
                                                    >
                                                        {isCompleted ? 'Koreksi Skor Laga' : 'Input Hasil Skor'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── FOOTER BAR ─── */}
            <div className="bg-[#101010] border-t border-[#222222] px-6 py-2.5 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                    <span>💡 Tip: Gunakan <strong className="text-gray-300">F11</strong> atau tombol <strong className="text-yellow-400">Layar Penuh TV</strong> untuk tampilan Proyektor / TV Smart Arena.</span>
                    <span>•</span>
                    <span>Tekan <strong className="text-gray-300">ESC</strong> untuk keluar.</span>
                </div>
                <div className="font-mono text-[11px] text-gray-400">
                    VAMOS ARENA POOL & CAFE • OFFICIAL BRACKET SYSTEM
                </div>
            </div>
        </div>
    );
}
