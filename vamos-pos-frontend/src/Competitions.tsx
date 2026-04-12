import { useState, useEffect } from 'react';
import { Trophy, Users, GitMerge, Loader2, Check, ChevronDown, ChevronUp, Calendar, Trash2, Edit3, X } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';
import { io } from 'socket.io-client';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function Competitions() {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [form, setForm] = useState({ 
        name: '', 
        description: '', 
        entryFee: 0, 
        prizePool: 0, 
        maxPlayers: 32, 
        prizeChampion: 0, 
        prizeRunnerUp: 0, 
        prizeSemiFinal: 0, 
        startDate: '', 
        eliminationType: 'SINGLE',
        transitionSize: 32
    });
    const [expandedBrackets, setExpandedBrackets] = useState<Record<string, boolean>>({});
    const [activeBracketTab, setActiveBracketTab] = useState<Record<string, 'WINNERS' | 'LOSERS'>>({});

    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [registerTournamentId, setRegisterTournamentId] = useState<string | null>(null);
    const [registerType, setRegisterType] = useState<'member' | 'guest'>('member');
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');
    const [guestName, setGuestName] = useState('');
    const [aliasName, setAliasName] = useState('');
    const [handicap, setHandicap] = useState('');

    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    const [finishTournamentId, setFinishTournamentId] = useState<string | null>(null);
    const [finishData, setFinishData] = useState({ champion: '', runnerUp: '' });

    const [isPlayerlotModalOpen, setIsPlayerLotModalOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState<{ matchId: string, tournamentId: string, slot: 1 | 2 } | null>(null);
    const [selectedSlotPlayerId, setSelectedSlotPlayerId] = useState<string>('');

    const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
    const [scoreMatchData, setScoreMatchData] = useState<{ matchId: string, player1Id: string, player2Id: string, p1Name: string, p2Name: string, score1: number, score2: number } | null>(null);

    const [isManageParticipantsOpen, setIsManageParticipantsOpen] = useState(false);
    const [manageTournamentId, setManageTournamentId] = useState<string | null>(null);
    const [isEditParticipantOpen, setIsEditParticipantOpen] = useState(false);
    const [editParticipantData, setEditParticipantData] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [tRes, mRes] = await Promise.all([
                api.get('/tournaments'),
                api.get('/members')
            ]);
            setTournaments(tRes.data.data);
            setMembers(mRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        const socket = io(socketUrl);

        socket.on('tournaments:updated', () => {
            fetchData();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const createTournament = async () => {
        try {
            await api.post('/tournaments', form);
            setIsCreateModalOpen(false);
            setForm({ 
                name: '', 
                description: '', 
                entryFee: 0, 
                prizePool: 0, 
                maxPlayers: 32, 
                prizeChampion: 0, 
                prizeRunnerUp: 0, 
                prizeSemiFinal: 0, 
                startDate: '', 
                eliminationType: 'SINGLE',
                transitionSize: 32
            });
            fetchData();
        } catch (err) {
            vamosAlert('Failed to create tournament');
        }
    };

    const openRegisterModal = (tournamentId: string) => {
        setRegisterTournamentId(tournamentId);
        setRegisterType('member');
        setSelectedMemberId('');
        setGuestName('');
        setAliasName('');
        setHandicap('');
        setIsRegisterModalOpen(true);
    };

    const confirmRegistration = async () => {
        if (!registerTournamentId) return;
        if (registerType === 'member' && !selectedMemberId) return;
        if (registerType === 'guest' && !guestName) return;

        try {
            await api.post(`/tournaments/${registerTournamentId}/register`, {
                memberId: registerType === 'member' ? selectedMemberId : undefined,
                name: registerType === 'member' ? aliasName : guestName,
                handicap: handicap || undefined
            });
            setIsRegisterModalOpen(false);
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Registration failed');
        }
    };

    const generateBracket = async (tournamentId: string) => {
        const tournament = tournaments.find(t => t.id === tournamentId);
        if (!tournament) return;

        if (tournament.participants?.length < 2) {
            vamosAlert('PESERTA BELUM CUKUP. Minimal dibutuhkan 2 peserta untuk memulai turnamen.');
            return;
        }

        // Calculate expected bracket size for the message
        let bSize = 1;
        const target = Math.max(tournament.participants.length, tournament.maxPlayers || 0);
        while (bSize < target) bSize *= 2;

        if (!(await vamosConfirm(`Generate bracket dengan ${bSize} slot? Pendaftar saat ini: ${tournament.participants.length}. Slot kosong dapat diisi manual nanti.`))) return;
        try {
            await api.post(`/tournaments/${tournamentId}/generate-bracket`);
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to generate bracket');
        }
    };

    const deleteTournamentData = async (tournamentId: string) => {
        if (!(await vamosConfirm('Warning: This will permanently delete the tournament, all matches, and participants. Continue?'))) return;
        try {
            await api.delete(`/tournaments/${tournamentId}`);
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to delete tournament');
        }
    };

    const openScoreModal = (m: any, p1Name: string, p2Name: string) => {
        setScoreMatchData({
            matchId: m.id,
            player1Id: m.player1Id,
            player2Id: m.player2Id,
            p1Name: p1Name,
            p2Name: p2Name,
            score1: m.score1,
            score2: m.score2
        });
        setIsScoreModalOpen(true);
    };

    const submitMatchScore = async () => {
        if (!scoreMatchData) return;

        const { matchId, player1Id, player2Id, score1, score2 } = scoreMatchData;

        let winnerId = score1 > score2 ? player1Id : player2Id;

        if (score1 === score2) {
            vamosAlert('A match must have a clear winner (no draw in Billiards)');
            return;
        }

        try {
            await api.put(`/tournaments/matches/${matchId}`, { score1, score2, winnerId });
            setIsScoreModalOpen(false);
            setScoreMatchData(null);
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to update match');
        }
    };

    const handleFinishTournament = async () => {
        if (!finishTournamentId || !finishData.champion) {
            vamosAlert('Please select at least a champion.');
            return;
        }

        try {
            await api.post(`/tournaments/${finishTournamentId}/finish`, {
                championId: finishData.champion,
                runnerUpId: finishData.runnerUp || undefined
            });
            setIsFinishModalOpen(false);
            setFinishData({ champion: '', runnerUp: '' });
            setFinishTournamentId(null);
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to finish tournament');
        }
    };

    const handleAssignPlayerSlot = async () => {
        if (!editingMatch) return;
        try {
            await api.put(`/tournaments/matches/${editingMatch.matchId}/players`, {
                [editingMatch.slot === 1 ? 'player1Id' : 'player2Id']: selectedSlotPlayerId || null
            });
            setIsPlayerLotModalOpen(false);
            setEditingMatch(null);
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to update player slot');
        }
    };

    const handleUpdateParticipant = async () => {
        if (!editParticipantData || !manageTournamentId) return;
        try {
            await api.put(`/tournaments/${manageTournamentId}/participants/${editParticipantData.id}`, {
                name: editParticipantData.name,
                handicap: editParticipantData.handicap,
                paymentNotes: editParticipantData.paymentNotes
            });
            setIsEditParticipantOpen(false);
            setEditParticipantData(null);
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to update participant');
        }
    };

    const handleRemoveParticipant = async (participantId: string) => {
        if (!manageTournamentId) return;
        if (!(await vamosConfirm('Hapus peserta ini dari turnamen? Slot di bracket akan dikosongkan.'))) return;
        try {
            await api.delete(`/tournaments/${manageTournamentId}/participants/${participantId}`);
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to remove participant');
        }
    };

    const handleUpdateParticipantStatus = async (participantId: string, newStatus: string) => {
        if (!manageTournamentId) return;
        try {
            await api.put(`/tournaments/${manageTournamentId}/participants/${participantId}/status`, {
                paymentStatus: newStatus
            });
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const roundLabel = (r: number, total: number) => {
        if (r === total) return 'GRAND FINAL';
        if (r === total - 1) return 'SEMI FINAL';
        if (r === total - 2) return 'QUARTER FINAL';
        return `ROUND ${r}`;
    };

    const handleExportPDF = (tournament: any) => {
        if (!tournament) return;

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Theme colors (Clean & White Dominant)
        const colors = {
            primary: [37, 99, 235],    // blue-600
            secondary: [15, 23, 42],   // slate-900 (Text)
            muted: [100, 116, 139],    // slate-500
            border: [226, 232, 240],   // slate-200
            winner: [5, 150, 105],     // emerald-600
            cardBg: [255, 255, 255]
        };

        // Header (Narrowed to 25mm)
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, 25, 'F');
        
        // Identity Line
        doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setLineWidth(1);
        doc.line(15, 22, pageWidth - 15, 22);

        // Logo
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text("VAMOS", 15, 15);
        
        doc.setFontSize(8);
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setFont('helvetica', 'bold');
        doc.text("SMART ARENA POOL & CAFE", 45, 15);

        // Right side
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.setFontSize(14);
        doc.text(tournament.name.toUpperCase(), pageWidth - 15, 13, { align: 'right' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        const dateStr = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'UNDEFINED';
        doc.text(`${tournament.venue?.toUpperCase() || 'VAMOS MAIN SECTOR'} | ${dateStr.toUpperCase()}`, pageWidth - 15, 18, { align: 'right' });

        // Content
        const matchesByRound: Record<number, any[]> = {};
        tournament.matches?.forEach((m: any) => {
            if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
            matchesByRound[m.round].push(m);
        });

        const sortedRounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
        const totalRoundsCount = sortedRounds.length;
        if (totalRoundsCount === 0) {
            vamosAlert('Bracket empty. Please generate bracket first.');
            return;
        }

        const colWidth = (pageWidth - 30) / totalRoundsCount;
        const startY = 40;
        const cardWidth = colWidth - 8;
        const cardHeight = 14;

        const matchPositions: Record<string, { x: number, y: number }> = {};

        sortedRounds.forEach((r, rIdx) => {
            const roundMatches = matchesByRound[r].sort((a, b) => a.matchNumber - b.matchNumber);
            const x = 15 + (rIdx * colWidth);

            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
            doc.text(roundLabel(r, totalRoundsCount), x + cardWidth / 2, startY - 5, { align: 'center' });

            const totalAvailableHeight = pageHeight - startY - 20;
            const matchesCount = roundMatches.length;

            roundMatches.forEach((m, mIdx) => {
                const spacing = totalAvailableHeight / matchesCount;
                const y = startY + (mIdx * spacing) + (spacing / 2) - cardHeight / 2;
                matchPositions[`${r}-${mIdx}`] = { x, y };

                doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
                doc.setLineWidth(0.2);
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(x, y, cardWidth, cardHeight, 0.5, 0.5, 'FD');

                const drawPlayer = (pId: string | undefined, score: number | null | undefined, py: number, isWinner: boolean) => {
                    const p = tournament.participants.find((pt: any) => pt.id === pId);
                    const pName = p ? (p.name || p.member?.name) : (m.status === 'COMPLETED' ? 'BYE' : 'TBD');
                    const pHC = p?.handicap;
                    const hcStr = pHC ? `[HC:${pHC}]` : '';

                    doc.setFontSize(7);
                    doc.setFont('helvetica', isWinner ? 'bold' : 'normal');
                    doc.setTextColor(isWinner ? colors.winner[0] : colors.secondary[0], isWinner ? colors.winner[1] : colors.secondary[1], isWinner ? colors.winner[2] : colors.secondary[2]);

                    let displayName = pName.toUpperCase();
                    if (displayName.length > 18) displayName = displayName.substring(0, 16) + '..';
                    doc.text(displayName, x + 2.5, py);

                    if (hcStr) {
                        doc.setFontSize(5.5);
                        doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
                        doc.text(hcStr, x + cardWidth - 8, py, { align: 'right' });
                    }

                    doc.setFontSize(7.5);
                    doc.text(String(score || 0), x + cardWidth - 2, py, { align: 'right' });
                };

                const p1Winner = m.score1 !== null && m.score2 !== null && m.score1! > m.score2!;
                const p2Winner = m.score2 !== null && m.score1 !== null && m.score2! > m.score1!;

                drawPlayer(m.player1Id, m.score1, y + 5, p1Winner);
                doc.setDrawColor(248, 250, 252);
                doc.line(x + 2, y + 7, x + cardWidth - 2, y + 7);
                drawPlayer(m.player2Id, m.score2, y + 11, p2Winner);

                if (rIdx < totalRoundsCount - 1) {
                    const nextX = x + cardWidth;
                    const midX = nextX + (colWidth - cardWidth) / 2;
                    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
                    doc.line(nextX, y + cardHeight / 2, midX, y + cardHeight / 2);

                    if (mIdx % 2 !== 0) {
                        const prevMatchY = matchPositions[`${r}-${mIdx - 1}`].y;
                        doc.line(midX, prevMatchY + cardHeight / 2, midX, y + cardHeight / 2);
                        doc.line(midX, (prevMatchY + y) / 2 + cardHeight / 2, x + colWidth, (prevMatchY + y) / 2 + cardHeight / 2);
                    }
                }
            });
        });

        doc.setFillColor(252, 252, 252);
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        doc.setFontSize(6.5);
        doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        doc.text(`TOTAL OPERATIVES: ${tournament.participants?.length || 0} | FORMAT: ${tournament.format || 'SINGLE ELIMINATION'}`, 15, pageHeight - 5);
        doc.text(`VAMOS SMART ARENA - OFFICIAL BRACKET | ${new Date().toLocaleString('id-ID')}`, pageWidth - 15, pageHeight - 5, { align: 'right' });

        doc.save(`BRACKET-${tournament.name.toUpperCase().replace(/\s+/g, '-')}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a] min-h-screen text-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="flex justify-end mb-8">
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-yellow-500 text-[#0a0a0a] px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                >
                    + New Tournament
                </button>
            </div>

            <div className="space-y-6">
                {tournaments.map(t => (
                    <div key={t.id} className="bg-[#141414] border border-[#222222] rounded-2xl p-6 relative overflow-hidden group">
                        {t.status === 'ONGOING' && <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff66]"></div>}
                        {t.status === 'COMPLETED' && <div className="absolute top-0 left-0 w-1 h-full bg-gray-600"></div>}
                        {t.status === 'PENDING' && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>}

                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold font-mono text-white mb-1 flex items-center">
                                    {t.name}
                                    <button onClick={() => deleteTournamentData(t.id)} className="ml-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 p-1.5 rounded transition-colors" title="Delete Tournament">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </h2>
                                <p className="text-sm text-gray-400 mb-4">{t.description || 'No description provided.'}</p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-bold rounded tracking-wider uppercase border
                                ${t.status === 'PENDING' ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' :
                                    t.status === 'ONGOING' ? 'text-[#00ff66] border-[#00ff66]/30 bg-[#00ff66]/10' :
                                        'text-gray-400 border-gray-600 bg-white/5'}`}
                            >
                                {t.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-[#0a0a0a] border border-[#222222] p-3 rounded-xl">
                                <p className="text-xs text-gray-500 font-bold mb-1">ENTRY FEE</p>
                                <p className="font-mono text-white text-sm">Rp {t.entryFee.toLocaleString()}</p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#222222] p-3 rounded-xl">
                                <p className="text-xs text-gray-500 font-bold mb-1">PRIZE POOL</p>
                                <p className="font-mono text-yellow-500 font-bold flex items-center text-sm">
                                    Rp {t.prizePool.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#222222] p-3 rounded-xl">
                                <p className="text-xs text-gray-500 font-bold mb-1">PARTICIPANTS</p>
                                <p className="font-mono text-white text-sm flex items-center">
                                    <Users className="w-3 h-3 mr-1 text-[#00aaff]" /> {t.participants.length} / {t.maxPlayers}
                                </p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#222222] p-3 rounded-xl flex items-center justify-center">
                                {t.status === 'PENDING' && (
                                    <div className="flex space-x-2 w-full">
                                        <button onClick={() => openRegisterModal(t.id)} className="flex-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-xs font-bold rounded transition-colors text-white">Register</button>
                                        <button onClick={() => { setManageTournamentId(t.id); setIsManageParticipantsOpen(true); }} className="flex-1 px-2 py-1 bg-[#00aaff]/10 hover:bg-[#00aaff]/20 text-[#00aaff] text-xs font-bold rounded transition-colors border border-[#00aaff]/30">Manage</button>
                                        {t.participants.length >= 2 && (
                                            <button onClick={() => generateBracket(t.id)} className="flex-1 px-2 py-1 bg-[#00ff66] hover:bg-[#00e65c] text-[#0a0a0a] text-xs font-bold rounded transition-colors">Start Event</button>
                                        )}
                                    </div>
                                )}
                                {t.status === 'ONGOING' && (
                                    <div className="flex space-x-2 w-full">
                                        <button onClick={() => { setManageTournamentId(t.id); setIsManageParticipantsOpen(true); }} className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-bold rounded transition-colors border border-white/5">Participants</button>
                                        <button onClick={() => { setFinishTournamentId(t.id); setIsFinishModalOpen(true); }} className="flex-[2] px-2 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded transition-colors flex items-center justify-center">
                                            <Trophy className="w-3 h-3 mr-1" /> Conclude Event
                                        </button>
                                    </div>
                                )}
                                {t.status === 'COMPLETED' && (
                                    <span className="text-xs text-green-500 font-bold tracking-widest uppercase"><Check className="w-3 h-3 inline mr-1" /> Event Finished</span>
                                )}
                                {t.matches && t.matches.length > 0 && (
                                    <button 
                                        onClick={() => handleExportPDF(t)} 
                                        className="ml-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-xs font-bold rounded transition-colors text-white flex items-center"
                                    >
                                        PDF
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bracket Display (Grouped by Round) */}
                        {t.matches && t.matches.length > 0 && (
                            <div className="mt-4 border-t border-[#222222] pt-4">
                                <div
                                    className="flex justify-between items-center cursor-pointer mb-4 hover:bg-white/5 p-2 rounded -ml-2 transition-colors"
                                    onClick={() => setExpandedBrackets(prev => ({ ...prev, [t.id]: prev[t.id] === undefined ? false : !prev[t.id] }))}
                                >
                                    <div>
                                        <h3 className="font-bold flex items-center text-sm">
                                            <GitMerge className="w-4 h-4 mr-2 text-[#00aaff]" />
                                            Live Match Bracket - {t.name}
                                        </h3>
                                        {t.startDate && <p className="text-xs text-gray-400 mt-1 flex items-center ml-6"><Calendar className="w-3 h-3 mr-1" />{new Date(t.startDate).toLocaleDateString()}</p>}
                                    </div>
                                    {expandedBrackets[t.id] === false ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
                                </div>

                                {expandedBrackets[t.id] !== false && (
                                    <div className="space-y-4">
                                        {t.eliminationType === 'DOUBLE' && (
                                            <div className="flex gap-2 mb-4 bg-[#0a0a0a] p-1 rounded-lg w-fit border border-[#222222]">
                                                <button 
                                                    onClick={() => setActiveBracketTab(p => ({...p, [t.id]: 'WINNERS'}))}
                                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeBracketTab[t.id] !== 'LOSERS' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    Winners Bracket
                                                </button>
                                                <button 
                                                    onClick={() => setActiveBracketTab(p => ({...p, [t.id]: 'LOSERS'}))}
                                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeBracketTab[t.id] === 'LOSERS' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    Losers Bracket
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex overflow-x-auto space-x-8 pb-4">
                                            {[...new Set(t.matches.filter((m: any) => m.bracket === (activeBracketTab[t.id] || 'WINNERS')).map((m: any) => m.round))].sort().map((roundNum: any) => {
                                                const roundMatches = t.matches
                                                    .filter((m: any) => m.bracket === (activeBracketTab[t.id] || 'WINNERS') && m.round === roundNum)
                                                    .sort((a: any, b: any) => a.matchNumber - b.matchNumber);
                                                
                                                if (roundMatches.length === 0) return null;

                                                return (
                                                    <div key={roundNum} className="flex flex-col justify-around min-w-[280px] space-y-4 relative">
                                                        <h4 className="text-center text-xs text-gray-500 font-bold uppercase mb-2">Round {roundNum}</h4>
                                                        {roundMatches.map((m: any) => {
                                                        const p1 = t.participants.find((p: any) => p.id === m.player1Id);
                                                        const p2 = t.participants.find((p: any) => p.id === m.player2Id);
                                                        const p1Name = p1 ? (p1.name || p1.member?.name) : undefined;
                                                        const p2Name = p2 ? (p2.name || p2.member?.name) : undefined;

                                                        return (
                                                            <div key={m.id} className="bg-[#0a0a0a] border border-[#222222] p-3 rounded-lg flex items-center shadow-sm relative z-10 w-full mb-4">
                                                                <div className="flex-1 space-y-2">
                                                                    <div
                                                                        onClick={() => {
                                                                            if (roundNum === 1 && m.status !== 'COMPLETED') {
                                                                                setEditingMatch({ matchId: m.id, tournamentId: t.id, slot: 1 });
                                                                                setSelectedSlotPlayerId(p1?.id || '');
                                                                                setIsPlayerLotModalOpen(true);
                                                                            }
                                                                        }}
                                                                        className={`flex justify-between items-center text-xs font-bold px-2 py-1 rounded cursor-pointer ${m.winnerId === m.player1Id ? 'bg-[#00ff66]/10 text-[#00ff66]' : 'text-gray-300 hover:bg-white/10'}`}>
                                                                        <div className="flex flex-col truncate w-24">
                                                                            <span>{p1Name || (roundNum === 1 ? 'Select P1...' : 'TBD')}</span>
                                                                            {p1?.handicap && <span className="text-[10px] text-yellow-500 font-normal">HC: {p1.handicap}</span>}
                                                                        </div>
                                                                        <span>{m.score1}</span>
                                                                    </div>
                                                                    <div
                                                                        onClick={() => {
                                                                            if (roundNum === 1 && m.status !== 'COMPLETED') {
                                                                                setEditingMatch({ matchId: m.id, tournamentId: t.id, slot: 2 });
                                                                                setSelectedSlotPlayerId(p2?.id || '');
                                                                                setIsPlayerLotModalOpen(true);
                                                                            }
                                                                        }}
                                                                        className={`flex justify-between items-center text-xs font-bold px-2 py-1 rounded cursor-pointer ${m.winnerId === m.player2Id ? 'bg-[#00ff66]/10 text-[#00ff66]' : 'text-gray-300 hover:bg-white/10'}`}>
                                                                        <div className="flex flex-col truncate w-24">
                                                                            <span>{p2Name || (roundNum === 1 ? 'Select P2...' : 'TBD')}</span>
                                                                            {p2?.handicap && <span className="text-[10px] text-yellow-500 font-normal">HC: {p2.handicap}</span>}
                                                                        </div>
                                                                        <span>{m.score2}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="ml-4 pl-4 border-l border-[#222222] min-w-[70px] text-center">
                                                                    {m.status === 'COMPLETED' ? (
                                                                        <span className="text-[10px] text-gray-500 font-bold block uppercase"><Check className="w-4 h-4 mx-auto text-green-500 mb-1" />Done</span>
                                                                    ) : (
                                                                        <button onClick={() => openScoreModal(m, p1Name || 'Player 1', p2Name || 'Player 2')} className="bg-white/10 hover:bg-white/20 px-2 py-1 text-[10px] rounded font-bold transition-colors w-full">Record<br />Score</button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-6 border-b border-[#222222]">
                            <h2 className="text-xl font-bold flex items-center">Create Tournament</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">Tournament Name</label>
                                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-2 focus:border-yellow-500 focus:outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">Start Date (Optional)</label>
                                    <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-2 focus:border-yellow-500 font-mono text-sm focus:outline-none text-gray-300" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-2">Elimination Format</label>
                                <div className="flex gap-2 bg-[#0a0a0a] p-1 rounded-xl border border-[#222222]">
                                    <button 
                                        type="button"
                                        onClick={() => setForm({...form, eliminationType: 'SINGLE'})}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${form.eliminationType === 'SINGLE' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Single Elimination
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setForm({...form, eliminationType: 'DOUBLE'})}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${form.eliminationType === 'DOUBLE' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Double Elimination (Hybrid)
                                    </button>
                                </div>
                            </div>
                            {form.eliminationType === 'DOUBLE' && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">Transition to Single at (e.g. 32)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-2 focus:border-yellow-500 font-mono text-sm focus:outline-none"
                                        placeholder="32"
                                        value={form.transitionSize}
                                        onChange={(e) => setForm({ ...form, transitionSize: parseInt(e.target.value) || 0 })}
                                    />
                                    <p className="text-[10px] text-gray-500 italic">Turnamen akan berubah menjadi Single Elimination saat tersisa jumlah peserta ini.</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">Entry Fee (Rp)</label>
                                    <input type="text" value={form.entryFee ? form.entryFee.toLocaleString('id-ID') : ''} onChange={e => setForm({ ...form, entryFee: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} placeholder="0" className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-2 focus:border-yellow-500 font-mono text-sm focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">Max Players</label>
                                    <input type="number" value={form.maxPlayers} onChange={e => setForm({ ...form, maxPlayers: parseInt(e.target.value) || 32 })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-2 focus:border-yellow-500 font-mono text-sm focus:outline-none" />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-[#222222]">
                                <label className="block text-xs font-semibold text-yellow-500 mb-2 mt-2">Total Prize Pool (Rp)</label>
                                <input type="text" value={form.prizePool ? form.prizePool.toLocaleString('id-ID') : ''} onChange={e => setForm({ ...form, prizePool: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} placeholder="0" className="w-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-lg px-4 py-2 focus:border-yellow-500 font-mono text-sm focus:outline-none" />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-400 mb-1">Champion 1st (Rp)</label>
                                    <input type="text" value={form.prizeChampion ? form.prizeChampion.toLocaleString('id-ID') : ''} onChange={e => setForm({ ...form, prizeChampion: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} placeholder="0" className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-2 py-2 focus:border-yellow-500 font-mono text-xs focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-400 mb-1">Runner Up 2nd (Rp)</label>
                                    <input type="text" value={form.prizeRunnerUp ? form.prizeRunnerUp.toLocaleString('id-ID') : ''} onChange={e => setForm({ ...form, prizeRunnerUp: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} placeholder="0" className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-2 py-2 focus:border-yellow-500 font-mono text-xs focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-400 mb-1">Semi-Final 3/4 (Rp)</label>
                                    <input type="text" value={form.prizeSemiFinal ? form.prizeSemiFinal.toLocaleString('id-ID') : ''} onChange={e => setForm({ ...form, prizeSemiFinal: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} placeholder="0" className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-2 py-2 focus:border-yellow-500 font-mono text-xs focus:outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#222222] flex space-x-3">
                            <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-2 bg-[#0a0a0a] rounded-lg font-bold text-white border border-[#222222] hover:bg-white/5">Cancel</button>
                            <button onClick={createTournament} className="flex-1 py-2 bg-yellow-500 rounded-lg text-[#0a0a0a] font-bold hover:bg-yellow-400">Deploy Event</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Register Modal */}
            {isRegisterModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-6 border-b border-[#222222]">
                            <h2 className="text-xl font-bold flex items-center">Register Participant</h2>
                            <p className="text-xs text-gray-400 mt-2">Select an active member or register a guest to join the tournament.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex border border-[#222222] rounded-lg overflow-hidden">
                                <button type="button" onClick={() => setRegisterType('member')} className={`flex-1 py-2 text-xs font-bold transition-colors ${registerType === 'member' ? 'bg-[#00ff66] text-black' : 'bg-transparent text-gray-400 hover:bg-white/5'}`}>Member</button>
                                <button type="button" onClick={() => setRegisterType('guest')} className={`flex-1 py-2 text-xs font-bold transition-colors ${registerType === 'guest' ? 'bg-[#00ff66] text-black' : 'bg-transparent text-gray-400 hover:bg-white/5'}`}>Guest</button>
                            </div>

                             {registerType === 'member' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-2">Select Member</label>
                                        <select
                                            value={selectedMemberId}
                                            onChange={(e) => setSelectedMemberId(e.target.value)}
                                            className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500 transition-colors"
                                        >
                                            <option value="">-- Choose Member --</option>
                                            {members.map(m => (
                                                <option key={m.id} value={m.id}>{m.name} - HC: {m.handicap || '-'} ({m.phone})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-2">Tournament Alias / Team <span className="text-gray-600 font-normal">(Optional)</span></label>
                                        <input 
                                            type="text" 
                                            value={aliasName} 
                                            onChange={e => setAliasName(e.target.value)} 
                                            placeholder="e.g. Arif Vamos, Akil 55" 
                                            className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:border-yellow-500 focus:outline-none text-sm" 
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">Guest Player Name</label>
                                    <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:border-yellow-500 focus:outline-none text-sm" />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-2">Handicap (HC) <span className="text-gray-600 font-normal">- Optional</span></label>
                                <input type="text" value={handicap} onChange={e => setHandicap(e.target.value)} placeholder="e.g. 4, 4+, 5" className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:border-[#00ff66] focus:outline-none font-mono text-sm" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#222222] flex space-x-3">
                            <button onClick={() => setIsRegisterModalOpen(false)} className="flex-1 py-2 bg-[#0a0a0a] rounded-lg font-bold text-white border border-[#222222] hover:bg-white/5">Cancel</button>
                            <button onClick={confirmRegistration} disabled={(registerType === 'member' && !selectedMemberId) || (registerType === 'guest' && !guestName)} className="flex-1 py-2 bg-[#00ff66] rounded-lg text-[#0a0a0a] font-bold hover:bg-[#00e65c] disabled:opacity-50">Register Now</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Finish Tournament Modal */}
            {isFinishModalOpen && finishTournamentId && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-sm overflow-hidden border-yellow-500/30">
                        <div className="p-6 border-b border-[#222222]">
                            <h2 className="text-xl font-bold flex items-center text-yellow-500">Conclude Tournament</h2>
                            <p className="text-xs text-gray-400 mt-2">Distribute prizes and record loyalty points.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-yellow-500 mb-2 uppercase tracking-wider">1st Place (Champion)</label>
                                <select value={finishData.champion} onChange={e => setFinishData({ ...finishData, champion: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500">
                                    <option value="">-- Select Champion --</option>
                                    {tournaments.find(t => t.id === finishTournamentId)?.participants.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name || p.member?.name} {p.handicap ? `(HC: ${p.handicap})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">2nd Place (Runner Up)</label>
                                <select value={finishData.runnerUp} onChange={e => setFinishData({ ...finishData, runnerUp: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none flex focus:border-yellow-500">
                                    <option value="">-- Select Runner Up (Optional) --</option>
                                    {tournaments.find(t => t.id === finishTournamentId)?.participants.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name || p.member?.name} {p.handicap ? `(HC: ${p.handicap})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#222222] flex space-x-3">
                            <button onClick={() => { setIsFinishModalOpen(false); setFinishData({ champion: '', runnerUp: '' }); }} className="flex-1 py-2 bg-[#0a0a0a] rounded-lg font-bold text-white border border-[#222222] hover:bg-white/5">Cancel</button>
                            <button onClick={handleFinishTournament} disabled={!finishData.champion} className="flex-1 py-2 bg-yellow-500 rounded-lg text-black font-bold hover:bg-yellow-400 disabled:opacity-50 shadow-[0_0_15px_rgba(234,179,8,0.3)]">Distribute Prizes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Player Lot Modal */}
            {isPlayerlotModalOpen && editingMatch && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-sm overflow-hidden border-yellow-500/30">
                        <div className="p-6 border-b border-[#222222]">
                            <h2 className="text-xl font-bold flex items-center text-yellow-500">Pick Player for Slot</h2>
                            <p className="text-xs text-gray-400 mt-2">Select a registered participant for this match (hasil lot/draw).</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Select Participant</label>
                                <select value={selectedSlotPlayerId} onChange={e => setSelectedSlotPlayerId(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500">
                                    <option value="">-- TBD / Empty Slot --</option>
                                    {tournaments
                                        .find(t => t.id === editingMatch.tournamentId)
                                        ?.participants.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name || p.member?.name} {p.handicap ? `(HC: ${p.handicap})` : ''}</option>
                                        ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#222222] flex space-x-3">
                            <button onClick={() => { setIsPlayerLotModalOpen(false); setEditingMatch(null); }} className="flex-1 py-2 bg-[#0a0a0a] rounded-lg font-bold text-white border border-[#222222] hover:bg-white/5">Cancel</button>
                            <button onClick={handleAssignPlayerSlot} className="flex-1 py-2 bg-yellow-500 rounded-lg text-black font-bold hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]">Save Slot</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Participants Modal */}
            {isManageParticipantsOpen && manageTournamentId && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-[#222222] flex justify-between items-center bg-[#1a1a1a]">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center">
                                    <Users className="w-5 h-5 mr-3 text-[#00aaff]" /> 
                                    Manage Participants
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">
                                    {tournaments.find(t => t.id === manageTournamentId)?.name}
                                </p>
                            </div>
                            <button onClick={() => { setIsManageParticipantsOpen(false); setManageTournamentId(null); }} className="text-gray-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto bg-[#0a0a0a]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-[#222222]">
                                        <th className="pb-3 pl-2">Participant</th>
                                        <th className="pb-3">HC</th>
                                        <th className="pb-3">Payment Ref (Invoice)</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3 text-right pr-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1a1a1a]">
                                    {tournaments.find(t => t.id === manageTournamentId)?.participants.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="py-4 pl-2">
                                                <p className="font-bold text-sm text-white">{p.name || p.member?.name || 'Unknown'}</p>
                                                {p.member && <p className="text-[10px] text-gray-500 font-mono">{p.member.phone}</p>}
                                            </td>
                                            <td className="py-4">
                                                <span className="bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                                                    {p.handicap || '-'}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <p className="text-xs text-gray-400 font-mono italic">
                                                    {p.paymentNotes || '---'}
                                                </p>
                                            </td>
                                            <td className="py-4">
                                                <button 
                                                    onClick={() => handleUpdateParticipantStatus(p.id, p.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID')}
                                                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${p.paymentStatus === 'PAID' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                                                >
                                                    {p.paymentStatus}
                                                </button>
                                            </td>
                                            <td className="py-4 text-right pr-2 space-x-2">
                                                <button 
                                                    onClick={() => { setEditParticipantData(p); setIsEditParticipantOpen(true); }}
                                                    className="bg-white/5 hover:bg-white/10 text-gray-400 p-1.5 rounded transition-colors"
                                                    title="Edit Details"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleRemoveParticipant(p.id)}
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-1.5 rounded transition-colors"
                                                    title="Remove Participant"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!tournaments.find(t => t.id === manageTournamentId)?.participants || tournaments.find(t => t.id === manageTournamentId)?.participants.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-gray-600 text-xs italic uppercase tracking-widest bg-black/20">
                                                No participants registered yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-[#222222] flex justify-center bg-[#141414]">
                            <button onClick={() => { setIsManageParticipantsOpen(false); setManageTournamentId(null); }} className="px-8 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-sm transition-colors uppercase tracking-widest">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Participant Modal */}
            {isEditParticipantOpen && editParticipantData && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 backdrop-blur-md">
                    <div className="bg-[#1a1a1a] border border-[#333333] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl scale-in">
                        <div className="p-6 border-b border-[#333333] bg-[#222222] flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white uppercase italic">Edit Participant</h2>
                            <X className="w-5 h-5 text-gray-500 cursor-pointer hover:text-white" onClick={() => setIsEditParticipantOpen(false)} />
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Tournament Alias / Name</label>
                                <input 
                                    type="text" 
                                    value={editParticipantData.name || ''} 
                                    onChange={e => setEditParticipantData({...editParticipantData, name: e.target.value})}
                                    className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors" 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Handicap (HC)</label>
                                <input 
                                    type="text" 
                                    value={editParticipantData.handicap || ''} 
                                    onChange={e => setEditParticipantData({...editParticipantData, handicap: e.target.value})}
                                    className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-sm text-yellow-500 font-mono focus:outline-none focus:border-yellow-500 transition-colors" 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Payment Ref / Invoice ID</label>
                                <input 
                                    type="text" 
                                    value={editParticipantData.paymentNotes || ''} 
                                    onChange={e => setEditParticipantData({...editParticipantData, paymentNotes: e.target.value})}
                                    className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-sm text-[#00ff66] font-mono italic focus:outline-none focus:border-yellow-500 transition-colors" 
                                />
                                <p className="text-[10px] text-gray-600 mt-2 italic px-1 italic">
                                    "Invoice ini bisa diubah sesuai kebutuhan admin (e.g. untuk verifikasi manual)."
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#333333] flex space-x-3 bg-[#1a1a1a]">
                            <button onClick={() => setIsEditParticipantOpen(false)} className="flex-1 py-3 bg-[#222222] rounded-lg font-bold text-gray-400 border border-[#333333] hover:bg-white/5 transition-colors uppercase text-xs">Cancel</button>
                            <button onClick={handleUpdateParticipant} className="flex-1 py-3 bg-yellow-500 rounded-lg text-black font-black hover:bg-yellow-400 transition-all shadow-[0_5px_15px_rgba(234,179,8,0.2)] uppercase text-xs">Update Profile</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
