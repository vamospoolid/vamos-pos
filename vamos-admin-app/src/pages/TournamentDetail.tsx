import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, Settings, Shuffle, Save, Plus, AlertCircle, RefreshCw, Check, Trash2, XCircle, Download } from 'lucide-react';
import { tournamentsApi, membersApi } from '../services/api';
import type { Tournament, Match, Member, Participant } from '../services/api';
import { vamosAlert, vamosConfirm } from '../utils/dialog';
import { io } from 'socket.io-client';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

type TabKey = 'bracket' | 'participants' | 'settings';

const TournamentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tab, setTab] = useState<TabKey>('bracket');
    const [activeBracketTab, setActiveBracketTab] = useState<'WINNERS' | 'LOSERS'>('WINNERS');

    // Members for participant registration
    const [members, setMembers] = useState<Member[]>([]);
    const [regName, setRegName] = useState('');
    const [regMemberId, setRegMemberId] = useState('');
    const [regHandicap, setRegHandicap] = useState('4');
    const [registering, setRegistering] = useState(false);

    // Score editing
    const [scoreEdit, setScoreEdit] = useState<Record<string, { s1: string; s2: string }>>({});
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [saved, setSaved] = useState<Record<string, boolean>>({});

    // Participant selection for bracket
    const [matchSelect, setMatchSelect] = useState<{ matchId: string; slot: 1 | 2 } | null>(null);
    const [quickName, setQuickName] = useState('');
    const [addingQuick, setAddingQuick] = useState(false);

    // Settings editing
    const [isEditingSettings, setIsEditingSettings] = useState(false);
    const [settingsForm, setSettingsForm] = useState({
        name: '',
        format: '',
        startDate: '',
        venue: ''
    });
    const [updatingSettings, setUpdatingSettings] = useState(false);

    const fetchTournament = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const res = await tournamentsApi.getById(id);
            const data = res.data?.data ?? res.data;
            setTournament(data as unknown as Tournament);
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(anyErr?.response?.data?.message ?? anyErr?.message ?? 'Gagal memuat tournament');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTournament();
        membersApi.getAll()
            .then(r => {
                const d = (r.data as unknown as { data?: Member[] })?.data ?? r.data;
                setMembers(Array.isArray(d) ? d : []);
            })
            .catch(() => { });

        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        const socket = io(socketUrl);

        socket.on('tournaments:updated', () => {
            fetchTournament();
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchTournament]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !regName) return;
        setRegistering(true);
        try {
            await tournamentsApi.registerParticipant(id, { 
                name: regName, 
                memberId: regMemberId || undefined,
                handicap: regHandicap ? parseInt(regHandicap, 10) : undefined
            });
            setRegName('');
            setRegMemberId('');
            setRegHandicap('4');
            fetchTournament();
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } } };
            vamosAlert(anyErr?.response?.data?.message ?? 'Gagal mendaftarkan peserta');
        } finally {
            setRegistering(false);
        }
    };

    const handleGenerateBracket = async () => {
        if (!id || !tournament) return;

        // Validation: Minimal 2 participants to deploy
        if ((tournament.participants?.length || 0) < 2) {
            vamosAlert('PESERTA BELUM CUKUP. Mohon daftarkan minimal 2 peserta sebelum melakukan deploy bracket.');
            return;
        }

        // Calculate expected bracket size for the message
        let bSize = 1;
        const target = Math.max(tournament.participants?.length || 0, tournament.maxPlayers || 0);
        while (bSize < target) bSize *= 2;

        if (!(await vamosConfirm(`Generate bracket dengan ${bSize} slot? (Kapasitas: ${tournament.maxPlayers}). Slot kosong tetap bisa diisi manual nanti.`))) return;
        try {
            await tournamentsApi.generateBracket(id);
            fetchTournament();
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } } };
            vamosAlert(anyErr?.response?.data?.message ?? 'Gagal generate bracket');
        }
    };

    const handleResetBracket = async () => {
        if (!id) return;
        if (!(await vamosConfirm('Reset bracket? Semua skor yang sudah dimasukkan akan hilang.'))) return;
        try {
            await tournamentsApi.resetBracket(id);
            fetchTournament();
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } } };
            vamosAlert(anyErr?.response?.data?.message ?? 'Gagal reset bracket');
        }
    };

    const handleSaveScore = async (match: Match) => {
        const edit = scoreEdit[match.id];
        if (!edit) return;
        const s1 = parseInt(edit.s1, 10);
        const s2 = parseInt(edit.s2, 10);
        if (isNaN(s1) || isNaN(s2)) return;
        setSaving(p => ({ ...p, [match.id]: true }));
        try {
            const winnerId = s1 > s2 ? match.player1?.id : s2 > s1 ? match.player2?.id : undefined;
            await tournamentsApi.updateMatchResult(match.id, { score1: s1, score2: s2, winnerId });
            setSaved(p => ({ ...p, [match.id]: true }));
            setTimeout(() => setSaved(p => ({ ...p, [match.id]: false })), 2000);
            fetchTournament();
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } } };
            vamosAlert(anyErr?.response?.data?.message ?? 'Gagal menyimpan skor');
        } finally {
            setSaving(p => ({ ...p, [match.id]: false }));
        }
    };

    const handleUpdatePlayer = async (matchId: string, slot: 1 | 2, participantId: string) => {
        try {
            await tournamentsApi.updateMatchPlayers(matchId, {
                [slot === 1 ? 'player1Id' : 'player2Id']: participantId
            });
            setMatchSelect(null);
            fetchTournament();
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } } };
            vamosAlert(anyErr?.response?.data?.message ?? 'Gagal update pemain');
        }
    };

    const handleAddAndAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !matchSelect || !quickName) return;
        setAddingQuick(true);
        try {
            const res = await tournamentsApi.registerParticipant(id, { name: quickName });
            const newParticipant = (res.data as any)?.data ?? res.data;
            await handleUpdatePlayer(matchSelect.matchId, matchSelect.slot, newParticipant.id);
            setQuickName('');
        } catch (err: unknown) {
            vamosAlert('Gagal menambah pendaftaran');
        } finally {
            setAddingQuick(false);
        }
    };

    const setScore = (matchId: string, field: 's1' | 's2', val: string) => {
        setScoreEdit(p => ({ ...p, [matchId]: { ...p[matchId], [field]: val } }));
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setUpdatingSettings(true);
        try {
            await tournamentsApi.update(id, settingsForm);
            setIsEditingSettings(false);
            fetchTournament();
            vamosAlert('Settings updated successfully');
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } } };
            vamosAlert(anyErr?.response?.data?.message ?? 'Failed to update settings');
        } finally {
            setUpdatingSettings(false);
        }
    };

    const handleUpdatePaymentStatus = async (participantId: string, currentStatus: string) => {
        if (!id) return;
        const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
        try {
            await tournamentsApi.updateParticipantStatus(id, participantId, newStatus);
            fetchTournament();
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } } };
            vamosAlert(anyErr?.response?.data?.message ?? 'Gagal update status pembayaran');
        }
    };

    const handleRemoveParticipant = async (participantId: string) => {
        if (!id) return;
        if (!(await vamosConfirm('Hapus pendaftaran peserta ini?'))) return;
        try {
            await tournamentsApi.removeParticipant(id, participantId);
            fetchTournament();
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } } };
            vamosAlert(anyErr?.response?.data?.message ?? 'Gagal menghapus peserta');
        }
    };

    const handlePurgeParticipants = async () => {
        if (!id) return;
        if (!(await vamosConfirm('Hapus SEMUA pendaftaran? Bracket juga akan dihapus.'))) return;
        try {
            await tournamentsApi.purgeParticipants(id);
            fetchTournament();
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } } };
            vamosAlert(anyErr?.response?.data?.message ?? 'Gagal menghapus semua peserta');
        }
    };

    const handleExportPDF = () => {
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
            cardBg: [255, 255, 255],
            headerLine: [37, 99, 235]
        };

        // Header (Narrowed to 25mm)
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, 25, 'F');
        
        // Identity Line
        doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setLineWidth(1);
        doc.line(15, 22, pageWidth - 15, 22);

        // Logo text 
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text("VAMOS", 15, 15);
        
        doc.setFontSize(8);
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setFont('helvetica', 'bold');
        doc.text("SMART ARENA POOL & CAFE", 45, 15);

        // Tournament Title (Right Aligned)
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.setFontSize(14);
        doc.text(tournament.name.toUpperCase(), pageWidth - 15, 13, { align: 'right' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        const dateStr = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'UNDEFINED';
        doc.text(`${tournament.venue?.toUpperCase() || 'VAMOS MAIN SECTOR'} | ${dateStr.toUpperCase()}`, pageWidth - 15, 18, { align: 'right' });

        // Content Setup
        const matchesByRound: Record<number, Match[]> = {};
        tournament.matches?.forEach(m => {
            if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
            matchesByRound[m.round].push(m);
        });

        const sortedRounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
        const totalRoundsCount = sortedRounds.length;
        const colWidth = (pageWidth - 30) / totalRoundsCount;
        const startY = 40; // Adjusted starting Y for content
        const cardWidth = colWidth - 8;
        const cardHeight = 14; // Slightly slimmer cards

        // Position tracking
        const matchPositions: Record<string, { x: number, y: number }> = {};

        sortedRounds.forEach((r, rIdx) => {
            const roundMatches = matchesByRound[r].sort((a, b) => a.matchNumber - b.matchNumber);
            const x = 15 + (rIdx * colWidth);

            // Round Header Text (Minimalist)
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

                // Draw Slimmer Card
                doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
                doc.setLineWidth(0.2);
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(x, y, cardWidth, cardHeight, 0.5, 0.5, 'FD');

                // Helper for player text
                const drawPlayer = (p: Participant | undefined, score: number | null | undefined, py: number, isWinner: boolean) => {
                    const pName = p?.name || (p as any)?.member?.name || (m.status === 'COMPLETED' ? 'BYE' : 'TBD');
                    const pHC = (p as any)?.member?.handicap || (p as any)?.handicap;
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

                    // Score
                    doc.setFontSize(7.5);
                    doc.text(String(score || 0), x + cardWidth - 2, py, { align: 'right' });
                };

                const p1Winner = m.score1 !== null && m.score2 !== null && m.score1! > m.score2!;
                const p2Winner = m.score2 !== null && m.score1 !== null && m.score2! > m.score1!;

                drawPlayer(m.player1, m.score1, y + 5, p1Winner);
                // Subtle Divider
                doc.setDrawColor(248, 250, 252);
                doc.line(x + 2, y + 7, x + cardWidth - 2, y + 7);
                drawPlayer(m.player2, m.score2, y + 11, p2Winner);

                // Connector lines to NEXT round
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

        // Legend / Stat Footer (Cleaner White Design)
        doc.setFillColor(252, 252, 252);
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        doc.setFontSize(6.5);
        doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        doc.text(`TOTAL OPERATIVES: ${tournament.participants?.length || 0} | FORMAT: ${tournament.format || 'SINGLE ELIMINATION'}`, 15, pageHeight - 5);
        doc.text(`VAMOS SMART ARENA - OFFICIAL BRACKET | ${new Date().toLocaleString('id-ID')}`, pageWidth - 15, pageHeight - 5, { align: 'right' });

        doc.save(`BRACKET-${tournament.name.toUpperCase().replace(/\s+/g, '-')}.pdf`);
    };

    // Group matches by round (filtered by bracket tab)
    const matchesFiltered = tournament?.matches
        ? tournament.matches.filter(m => (m as any).bracket === activeBracketTab)
        : [];
    const rounds = [...new Set(matchesFiltered.map(m => m.round))].sort((a, b) => a - b);

    const roundLabel = (r: number, total: number) => {
        if (r === total) return 'GRAND FINAL';
        if (r === total - 1) return 'SEMI FINAL';
        if (r === total - 2) return 'QUARTER FINAL';
        return `ROUND ${r}`;
    };

    const tabs: { id: TabKey; label: string; icon: React.ReactNode }[] = [
        { id: 'bracket', label: 'Bracket', icon: <Trophy size={16} /> },
        { id: 'participants', label: 'Peserta', icon: <Users size={16} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
    ];

    if (loading) return (
        <div className="space-y-4">
            <div className="skeleton h-12 rounded-xl" />
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-32 rounded-2xl" />
        </div>
    );

    if (error || !tournament) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertCircle size={40} className="text-red-400" />
            <p className="text-red-400 font-bold">{error || 'Tournament tidak ditemukan'}</p>
            <div className="flex gap-3">
                <button onClick={fetchTournament} className="btn-secondary flex items-center gap-2">
                    <RefreshCw size={16} /> Coba Lagi
                </button>
                <button onClick={() => navigate('/events')} className="btn-primary">← Kembali</button>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 pb-20 animate-in">
            {/* ── COMMAND HEADER ─────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/events')}
                        className="p-5 rounded-[22px] bg-[#1a1f35]/40 border border-white/5 text-slate-500 hover:text-primary transition-all active:scale-95 group shadow-xl"
                    >
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`text-[10px] font-black px-4 py-1 rounded-full border italic tracking-widest ${tournament.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                }`}>
                                {tournament.status?.toUpperCase() || 'PENDING OPS'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] italic">
                                {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }).toUpperCase() : 'DATE UNKNOWN'}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                            {tournament.name || 'Unnamed <span className="text-primary">Conflict</span>'}
                        </h1>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={fetchTournament}
                        className="p-4 rounded-2xl bg-[#1a1f35]/40 border border-white/5 text-slate-500 hover:text-primary transition-all active:scale-95 group"
                    >
                        <RefreshCw size={22} className={loading ? 'animate-spin text-primary' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                </div>
            </div>

            {/* ── TACTICAL STATS ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="fiery-card p-8 flex flex-col items-center text-center group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3 italic">Active Operatives</p>
                    <div className="flex items-end gap-2">
                        <Users size={24} className="text-primary mb-1" />
                        <p className="text-4xl font-black text-white italic tracking-tighter">
                            {tournament._count?.participants ?? tournament.participants?.length ?? 0}
                        </p>
                    </div>
                </div>
                <div className="fiery-card p-8 flex flex-col items-center text-center group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3 italic">Conflict Protocol</p>
                    <div className="flex items-end gap-2">
                        <Trophy size={24} className="text-primary mb-1" />
                        <p className="text-4xl font-black text-white italic tracking-tighter uppercase">
                            {tournament.format?.split(' ')[0] || 'S. ELIM'}
                        </p>
                    </div>
                </div>
                <div className="fiery-card p-8 flex flex-col items-center text-center group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3 italic">Total Engagements</p>
                    <p className="text-4xl font-black text-white italic tracking-tighter">
                        {tournament.matches?.length ?? 0}
                    </p>
                </div>
            </div>

            {/* ── SECTOR TABS ─────────────────────────────────────────────────── */}
            <div className="flex gap-2 p-2 rounded-[32px] sticky top-4 z-40 bg-[#101423]/80 backdrop-blur-2xl border border-white/5 shadow-2xl">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-3 flex-1 justify-center py-4 rounded-[22px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 italic ${tab === t.id
                            ? 'bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-105 z-10'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        {t.icon} {t.label.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════ BRACKET ═════════════════════════════════ */}
            {tab === 'bracket' && (
                <div className="space-y-10 animate-in">
                    {/* Bracket Selector (Only for Double Elimination) */}
                    {(tournament as any).eliminationType === 'DOUBLE' && (
                        <div className="flex gap-4 mb-2">
                            <button 
                                onClick={() => setActiveBracketTab('WINNERS')}
                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic transition-all ${activeBracketTab === 'WINNERS' ? 'bg-primary text-white shadow-lg' : 'bg-[#1a1f35]/40 text-slate-500 border border-white/5 hover:text-white'}`}
                            >
                                Winners Bracket
                            </button>
                            <button 
                                onClick={() => setActiveBracketTab('LOSERS')}
                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic transition-all ${activeBracketTab === 'LOSERS' ? 'bg-primary text-white shadow-lg' : 'bg-[#1a1f35]/40 text-slate-500 border border-white/5 hover:text-white'}`}
                            >
                                Losers Bracket
                            </button>
                        </div>
                    )}
                    {/* Action Hub */}
                    <div className="flex gap-4">
                        {tournament.status === 'PENDING' && (
                            <button
                                onClick={handleGenerateBracket}
                                className="fiery-btn-primary flex-1 py-6 text-base italic flex items-center justify-center gap-4"
                            >
                                <Shuffle size={20} strokeWidth={3} /> RE-SHUFFLE & DEPLOY BRACKET
                            </button>
                        )}
                        {tournament.status === 'ONGOING' && (
                            <button
                                onClick={handleResetBracket}
                                className="fiery-btn-primary !bg-amber-600 !border-amber-500/50 flex-1 py-6 text-base italic flex items-center justify-center gap-4"
                            >
                                <RefreshCw size={20} strokeWidth={3} /> RESET & RE-RANDOMIZE BRACKET
                            </button>
                        )}
                        <button
                            onClick={handleExportPDF}
                            className="p-5 rounded-[22px] bg-[#1a1f35]/40 border border-white/5 text-slate-500 hover:text-emerald-500 transition-all active:scale-95 group shadow-xl h-auto"
                            title="Download Bracket PDF"
                        >
                            <Download size={24} />
                        </button>
                    </div>

                    {rounds.length === 0 ? (
                        <div className="fiery-card py-32 text-center border-dashed border-2 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-[#101423] rounded-[32px] border border-white/5 flex items-center justify-center mb-8 text-slate-800 shadow-2xl">
                                <Trophy size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-700 uppercase italic tracking-tighter">Empty Tactical Map</h3>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4 italic max-w-sm mx-auto leading-relaxed">ADD PARTICIPANTS AND GENERATE THE DRAW TO START THE COMPETITION PROTOCOL.</p>
                            <button
                                onClick={() => setTab('participants')}
                                className="mt-8 text-[11px] font-black text-primary uppercase tracking-[0.3em] hover:text-white transition-all bg-primary/10 px-8 py-3 rounded-full border border-primary/20 italic shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                            >
                                + INITIALIZE RECRUITMENT
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto no-scrollbar -mx-6 px-10 pb-12">
                            <div className="flex gap-20" style={{ minWidth: `${rounds.length * 360}px` }}>
                                {rounds.map(r => {
                                    const roundMatches = matchesFiltered.filter(m => m.round === r);
                                    const isLastRound = r === Math.max(...rounds);
                                    return (
                                        <div key={r} className="flex-1 min-w-[320px] space-y-10">
                                            {/* Round Title */}
                                            <div className="flex items-center gap-4">
                                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                                                <p className={`text-[11px] font-black uppercase tracking-[0.4em] italic whitespace-nowrap ${isLastRound ? 'text-primary' : 'text-slate-500'}`}>
                                                    {roundLabel(r, Math.max(...rounds))}
                                                </p>
                                                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                                            </div>

                                            <div className="space-y-12 relative">
                                                {roundMatches.map((m, idx) => {
                                                    const edit = scoreEdit[m.id] ?? { s1: String(m.score1 ?? ''), s2: String(m.score2 ?? '') };
                                                    const isFinished = m.score1 !== null && m.score2 !== null;
                                                    const isLive = edit.s1 !== String(m.score1 ?? '') || edit.s2 !== String(m.score2 ?? '');
                                                    const p1Winner = isFinished && m.score1! > m.score2!;
                                                    const p2Winner = isFinished && m.score2! > m.score1!;

                                                    const adjustScore = (player: 1 | 2, delta: number) => {
                                                        const current = parseInt(player === 1 ? edit.s1 : edit.s2, 10) || 0;
                                                        const next = Math.max(0, current + delta);
                                                        setScore(m.id, player === 1 ? 's1' : 's2', String(next));
                                                    };

                                                    // A BYE match: completed with only 1 player (the other slot is null)
                                                    const isByeMatch = m.status === 'COMPLETED' && (
                                                        (m.player1 !== null && m.player2 === null) ||
                                                        (m.player1 === null && m.player2 !== null)
                                                    );

                                                    return (
                                                        <div key={m.id} className="relative">
                                                            {/* Tactical Visual Connector */}
                                                            {!isLastRound && (
                                                                <div className={`absolute -right-10 top-1/2 w-10 h-[1px] bg-slate-800 border-primary/20 ${idx % 2 === 0
                                                                    ? 'after:content-[""] after:absolute after:left-full after:top-0 after:w-[1px] after:h-[6.5rem] after:bg-slate-800'
                                                                    : 'after:content-[""] after:absolute after:left-full after:bottom-0 after:w-[1px] after:h-[6.5rem] after:bg-slate-800'
                                                                    }`}></div>
                                                            )}

                                                            {/* BYE Match — compact card */}
                                                            {isByeMatch ? (
                                                                <div className="fiery-card !p-0 overflow-hidden border-amber-500/20 shadow-2xl">
                                                                    <div className="flex justify-between items-center px-6 py-3 bg-[#101423] border-b border-amber-500/10">
                                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Entry #{m.matchNumber}</span>
                                                                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 rounded-full">BYE</span>
                                                                    </div>
                                                                    <div className="px-6 py-5 flex items-center gap-4">
                                                                        <div className="w-1.5 h-10 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]"></div>
                                                                        <div>
                                                                            <p className="text-base font-black text-amber-300 uppercase italic tracking-tighter">
                                                                                {(m.player1 as any)?.name || (m.player2 as any)?.name || '—'}
                                                                            </p>
                                                                            <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-[0.3em] mt-0.5">Auto-advance · No match needed</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="fiery-card !p-0 overflow-hidden group hover:border-primary/40 transition-all shadow-2xl">
                                                                    {/* Match Intelligence Header */}
                                                                    <div className="flex justify-between items-center px-6 py-3 bg-[#101423] border-b border-white/5">
                                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic"> Engagement Entry #{m.matchNumber}</span>
                                                                        {isLive && (
                                                                            <span className="flex items-center gap-2 text-[9px] font-black text-primary uppercase animate-pulse italic">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" /> LOGGING...
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="p-6 space-y-6">
                                                                        {/* Combatant 1 */}
                                                                        <div className="flex items-center gap-5">
                                                                            <div className={`w-1.5 h-12 rounded-full transition-all duration-500 ${p1Winner ? 'bg-primary shadow-[0_0_15px_var(--primary)]' : 'bg-slate-800/50'}`}></div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-3">
                                                                                    {m.player1 ? (
                                                                                        <p
                                                                                            onClick={() => setMatchSelect({ matchId: m.id, slot: 1 })}
                                                                                            className={`text-lg font-black truncate cursor-pointer uppercase italic tracking-tighter group-hover:text-primary transition-colors ${p1Winner ? 'text-white' : 'text-slate-500'}`}
                                                                                        >
                                                                                            {(m.player1 as any)?.name || (m.player1 as any)?.member?.name || 'OPERATIVE ALPHA'}
                                                                                        </p>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => setMatchSelect({ matchId: m.id, slot: 1 })}
                                                                                            className="text-[10px] font-black text-primary/40 hover:text-primary transition-all uppercase tracking-widest italic"
                                                                                        >
                                                                                            + ASSIGN OPERATIVE
                                                                                        </button>
                                                                                    )}
                                                                                    <Settings size={12} className="text-slate-700 hover:text-primary cursor-pointer transition-colors" onClick={() => setMatchSelect({ matchId: m.id, slot: 1 })} />
                                                                                </div>
                                                                                {p1Winner && <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1 italic leading-none animate-in fade-in duration-1000">VICTORIOUS</p>}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <button onClick={() => adjustScore(1, -1)} className="w-8 h-8 rounded-xl bg-[#101423] border border-white/5 text-slate-600 hover:text-white transition-all text-xs font-black shadow-inner">-</button>
                                                                                <input
                                                                                    type="number"
                                                                                    value={edit.s1}
                                                                                    onChange={e => setScore(m.id, 's1', e.target.value)}
                                                                                    className="!w-14 !p-2 !text-center !rounded-xl !bg-[#101423] !border-primary/20 !text-lg !font-black !text-primary outline-none focus:ring-2 ring-primary/20 shadow-inner"
                                                                                />
                                                                                <button onClick={() => adjustScore(1, 1)} className="w-8 h-8 rounded-xl bg-[#101423] border border-white/5 text-slate-600 hover:text-white transition-all text-xs font-black shadow-inner">+</button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Combatant 2 */}
                                                                        <div className="flex items-center gap-5">
                                                                            <div className={`w-1.5 h-12 rounded-full transition-all duration-500 ${p2Winner ? 'bg-primary shadow-[0_0_15px_var(--primary)]' : 'bg-slate-800/50'}`}></div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-3">
                                                                                    {m.player2 ? (
                                                                                        <p
                                                                                            onClick={() => setMatchSelect({ matchId: m.id, slot: 2 })}
                                                                                            className={`text-lg font-black truncate cursor-pointer uppercase italic tracking-tighter group-hover:text-primary transition-colors ${p2Winner ? 'text-white' : 'text-slate-500'}`}
                                                                                        >
                                                                                            {(m.player2 as any)?.name || (m.player2 as any)?.member?.name || 'OPERATIVE BRAVO'}
                                                                                        </p>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => setMatchSelect({ matchId: m.id, slot: 2 })}
                                                                                            className="text-[10px] font-black text-primary/40 hover:text-primary transition-all uppercase tracking-widest italic"
                                                                                        >
                                                                                            + ASSIGN OPERATIVE
                                                                                        </button>
                                                                                    )}
                                                                                    <Settings size={12} className="text-slate-700 hover:text-primary cursor-pointer transition-colors" onClick={() => setMatchSelect({ matchId: m.id, slot: 2 })} />
                                                                                </div>
                                                                                {p2Winner && <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1 italic leading-none animate-in fade-in duration-1000">VICTORIOUS</p>}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <button onClick={() => adjustScore(2, -1)} className="w-8 h-8 rounded-xl bg-[#101423] border border-white/5 text-slate-600 hover:text-white transition-all text-xs font-black shadow-inner">-</button>
                                                                                <input
                                                                                    type="number"
                                                                                    value={edit.s2}
                                                                                    onChange={e => setScore(m.id, 's2', e.target.value)}
                                                                                    className="!w-14 !p-2 !text-center !rounded-xl !bg-[#101423] !border-white/5 !text-lg !font-black !text-slate-300 outline-none focus:ring-2 ring-white/10 shadow-inner"
                                                                                />
                                                                                <button onClick={() => adjustScore(2, 1)} className="w-8 h-8 rounded-xl bg-[#101423] border border-white/5 text-slate-600 hover:text-white transition-all text-xs font-black shadow-inner">+</button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Deployment Action Bar */}
                                                                    {isLive && (
                                                                        <button
                                                                            onClick={() => handleSaveScore(m)}
                                                                            disabled={saving[m.id]}
                                                                            className={`w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center justify-center gap-3 transition-all ${saved[m.id]
                                                                                ? 'bg-emerald-500 text-white'
                                                                                : 'bg-primary/20 text-primary hover:text-black hover:bg-primary'
                                                                                }`}
                                                                        >
                                                                            {saved[m.id] ? <Check size={16} strokeWidth={3} /> : saving[m.id] ? <RefreshCw size={16} className="animate-spin" /> : <><Save size={16} /> AUTHORIZE RESULT</>}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* ══════════════════════════════ PARTICIPANTS ═════════════════════════════ */}
            {tab === 'participants' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in">
                    {/* Recruitment Command Card */}
                    <div className="fiery-card p-10 h-fit lg:col-span-1 border-primary/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl pointer-events-none" />

                        <div className="flex items-center gap-5 mb-10 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                                <Plus size={28} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">New Recruit</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Manual Operative Entry</p>
                            </div>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-8 relative z-10">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex justify-between italic pl-2">
                                        <span>Codename</span>
                                        <span className="text-primary">* ESSENTIAL</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. AHMAD ASTO"
                                        value={regName}
                                        onChange={e => setRegName(e.target.value)}
                                        required
                                        className="fiery-input !py-5 !px-6"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic pl-2">Handicap</label>
                                    <input
                                        type="number"
                                        placeholder="4"
                                        value={regHandicap}
                                        onChange={e => setRegHandicap(e.target.value)}
                                        className="fiery-input !py-5 !px-6"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic pl-2">Sync with Registry</label>
                                <select
                                    value={regMemberId}
                                    onChange={e => {
                                        const m = members.find(x => x.id === e.target.value);
                                        setRegMemberId(e.target.value);
                                        if (m) {
                                            if (!regName) setRegName(m.name);
                                            // Handle member handicap if available, or keep default
                                            const mHandicap = (m as any).handicap;
                                            if (mHandicap) setRegHandicap(String(mHandicap));
                                        }
                                    }}
                                    className="fiery-input !py-5 !px-6 cursor-pointer appearance-none"
                                >
                                    <option value="" className="bg-[#101423]">─ SELECT REGISTRY OPS ─</option>
                                    {members.map(m => <option key={m.id} value={m.id} className="bg-[#101423]">{m.name.toUpperCase()} ({m.phone || 'NO COMMS'})</option>)}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={registering || !regName}
                                className="fiery-btn-primary w-full py-6 text-base italic active:scale-95 disabled:opacity-50 mt-4"
                            >
                                {registering ? <RefreshCw size={24} className="animate-spin mx-auto" /> : <><Plus size={24} className="inline mr-2" strokeWidth={3} /> DEPLOY TO BRACKET</>}
                            </button>
                        </form>
                    </div>

                    {/* Operational Manifest */}
                    <div className="space-y-6 lg:col-span-2">
                        <div className="flex items-center justify-between px-4">
                            <div>
                                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Current Manifest</h3>
                                <p className="text-2xl font-black text-white italic tracking-tighter mt-1 uppercase">
                                    {tournament.participants?.length ?? 0} <span className="text-primary text-sm tracking-widest ml-1 font-black">UNITS CHECKED-IN</span>
                                </p>
                            </div>
                            <button
                                onClick={handlePurgeParticipants}
                                className="text-[10px] font-black text-slate-500 uppercase tracking-widest border border-white/5 px-6 py-2 rounded-full hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all italic"
                            >
                                Purge Sector
                            </button>
                        </div>

                        {(tournament.participants ?? []).length === 0 ? (
                            <div className="fiery-card py-32 text-center border-dashed border-2 flex flex-col items-center justify-center">
                                <Users size={56} className="mx-auto text-slate-800 mb-6" />
                                <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] italic">NO OPERATIVES DETECTED IN SECTOR</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(tournament.participants ?? []).map((p, i) => (
                                    <div
                                        key={p.id}
                                        className="fiery-card p-6 flex items-center gap-6 group hover:border-primary/30 transition-all shadow-xl bg-[#1a1f35]/20"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-[#101423] border border-white/5 flex items-center justify-center font-black text-primary text-lg italic shadow-inner">
                                            #{String(i + 1).padStart(2, '0')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xl font-black text-white italic tracking-tighter uppercase group-hover:text-primary transition-colors">{p.name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                                                    Seed Status: {p.seed ?? 'UNASSIGNED'}
                                                    <span className="text-slate-700 mx-1">•</span>
                                                    Payment: <span className={p.paymentStatus === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}>
                                                        {p.paymentStatus || 'PENDING'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleUpdatePaymentStatus(p.id, p.paymentStatus || 'PENDING')}
                                                className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg min-w-[100px] ${p.paymentStatus === 'PAID'
                                                    ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white'
                                                    : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                                                    }`}
                                            >
                                                {p.paymentStatus === 'PAID' ? 'Mark Pending' : 'Mark Paid'}
                                            </button>
                                            <button
                                                onClick={() => handleRemoveParticipant(p.id)}
                                                className="p-3 bg-rose-500/10 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg animate-in slide-in-from-right-4"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════ SETTINGS ══════════════════════════════ */}
            {tab === 'settings' && (
                <div className="max-w-2xl mx-auto space-y-10 animate-in">
                    <div className="fiery-card overflow-hidden !p-0 shadow-2xl">
                        <div className="px-10 py-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                            <h3 className="text-lg font-black text-white italic uppercase tracking-widest">Sector Intelligence</h3>
                            <button
                                onClick={() => {
                                    if (!isEditingSettings) {
                                        setSettingsForm({
                                            name: tournament.name || '',
                                            format: tournament.format || '8-Ball',
                                            startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : '',
                                            venue: tournament.venue || ''
                                        });
                                    }
                                    setIsEditingSettings(!isEditingSettings);
                                }}
                                className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-all italic underline"
                            >
                                {isEditingSettings ? 'CANCEL' : 'UPDATE INTEL'}
                            </button>
                        </div>

                        {isEditingSettings ? (
                            <form onSubmit={handleUpdateSettings} className="p-10 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 italic">MISSION DESIGNATION</label>
                                    <input
                                        type="text"
                                        value={settingsForm.name}
                                        onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                        className="fiery-input w-full uppercase"
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 italic">COMBAT FORMAT</label>
                                    <input
                                        type="text"
                                        value={settingsForm.format}
                                        onChange={e => setSettingsForm({ ...settingsForm, format: e.target.value })}
                                        className="fiery-input w-full uppercase"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 italic">VANGUARD DATE</label>
                                        <input
                                            type="date"
                                            value={settingsForm.startDate}
                                            onChange={e => setSettingsForm({ ...settingsForm, startDate: e.target.value })}
                                            className="fiery-input w-full"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 italic">OPERATIONAL SECTOR</label>
                                        <input
                                            type="text"
                                            value={settingsForm.venue}
                                            onChange={e => setSettingsForm({ ...settingsForm, venue: e.target.value })}
                                            className="fiery-input w-full uppercase"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={updatingSettings}
                                    className="fiery-btn-primary w-full py-5 text-[10px] flex items-center justify-center gap-3 italic"
                                >
                                    {updatingSettings ? <RefreshCw size={18} className="animate-spin" /> : <><Save size={18} /> AUTHORIZE CHANGES</>}
                                </button>
                            </form>
                        ) : (
                            <>
                                {[
                                    { label: 'Deployment Status', value: tournament.status, highlight: true },
                                    { label: 'Operational Format', value: tournament.format || 'Single Elimination' },
                                    { label: 'Vanguard Activation', value: tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase() : 'UNDEFINED' },
                                    { label: 'Conflict Zone', value: tournament.venue || 'VAMOS MAIN SECTOR' },
                                    { label: 'Unit Capacity', value: `${tournament._count?.participants ?? tournament.participants?.length ?? 0} REGISTERED OPERATIVES` },
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-8 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all"
                                    >
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">{item.label}</span>
                                        <span className={`font-black text-base italic uppercase tracking-tighter ${item.highlight ? 'text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-slate-200'}`}>{item.value}</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    <div className="p-10 rounded-[40px] bg-rose-500/5 border-2 border-rose-500/20 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl pointer-events-none group-hover:bg-rose-500/20 transition-all duration-700" />
                        <div className="relative z-10 text-center mb-8">
                            <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.4em] mb-3 italic">Danger Zone: Finalization Protocol</p>
                            <p className="text-slate-500 text-xs italic font-medium max-w-sm mx-auto">ONCE FINALIZED, ALL RESULTS ARE PERMANENT. THE SECTOR CHAMPION WILL BE ANNOUNCED AND LOCKED INTO THE HISTORICAL ARCHIVE.</p>
                        </div>
                        {tournament.status !== 'COMPLETED' && (
                            <button
                                onClick={async () => {
                                    if (!id || !(await vamosConfirm('Authorize competition finalization? All data will be locked.'))) return;
                                    try {
                                        await tournamentsApi.finish(id);
                                        fetchTournament();
                                    } catch {
                                        vamosAlert('Authorization failed: Could not lock sector.');
                                    }
                                }}
                                className="w-full py-6 rounded-[32px] bg-rose-600 text-white font-black text-lg italic uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(225,29,72,0.3)] hover:bg-rose-500 transition-all active:scale-95 flex items-center justify-center gap-4 group/btn"
                            >
                                <Trophy size={28} className="group-hover/btn:rotate-12 transition-transform" /> FINALIZE & LOCK CONFLICT
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Selection Modal ── */}
            {matchSelect && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0c14]/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-xl bg-[#101423] rounded-[40px] p-10 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none" />

                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic">Engagement Control</p>
                                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Assign Operative</h3>
                            </div>
                            <button
                                onClick={() => { setMatchSelect(null); setQuickName(''); }}
                                className="p-3 rounded-2xl bg-[#1a1f35] text-slate-500 hover:text-white border border-white/5 transition-all"
                            >
                                <XCircle size={28} />
                            </button>
                        </div>

                        {/* Quick Assignment */}
                        <form onSubmit={handleAddAndAssign} className="mb-12 relative z-10 space-y-4">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] pl-2 italic">Emergency Field Entry</p>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="CODENAME (e.g. GHOST)..."
                                    value={quickName}
                                    onChange={e => setQuickName(e.target.value)}
                                    className="fiery-input !py-4"
                                />
                                <button
                                    type="submit"
                                    disabled={addingQuick || !quickName}
                                    className="px-8 bg-primary text-white rounded-[22px] font-black text-[11px] uppercase tracking-[0.2em] italic active:scale-95 transition-all disabled:opacity-50 shadow-lg"
                                >
                                    {addingQuick ? '...' : 'DEPLOY'}
                                </button>
                            </div>
                        </form>

                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 pl-2 italic">Select from Registered Pool</p>
                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-4 no-scrollbar relative z-10">
                            {(tournament.participants ?? []).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleUpdatePlayer(matchSelect.matchId, matchSelect.slot, p.id)}
                                    className="w-full text-left p-6 rounded-[28px] bg-[#1a1f35]/40 border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all group flex justify-between items-center"
                                >
                                    <div className="flex flex-col">
                                        <p className="font-black text-lg text-white group-hover:text-primary transition-colors uppercase italic tracking-tighter">{p.name}</p>
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Registry Signal Verified</p>
                                    </div>
                                    <span className="text-[10px] font-black text-primary/60 border border-primary/20 px-4 py-1.5 rounded-full italic group-hover:bg-primary group-hover:text-white transition-all shadow-inner">SEED: {p.seed ?? 'UNSEED'}</span>
                                </button>
                            ))}
                            {(tournament.participants ?? []).length === 0 && (
                                <div className="text-center py-20 bg-[#1a1f35]/20 rounded-[32px] border border-dashed border-white/10">
                                    <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px] italic">NO MANIFEST DATA AVAILABLE</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentDetail;
