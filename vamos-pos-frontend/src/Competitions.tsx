import { useState, useEffect } from 'react';
import { Trophy, Users, GitMerge, Loader2, Check, ChevronDown, ChevronUp, Calendar, Trash2, Edit3, X, Wallet, TrendingUp, CheckCircle2, Copy, MessageSquare, Share2, ExternalLink, CheckCheck, Shield, Flag, Building2, FileSpreadsheet, Award, Layers, Sparkles } from 'lucide-react';
import { api, getSocketURL } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';
import { io } from 'socket.io-client';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { LiveDrawDisplay } from './components/LiveDrawDisplay';
import { FlyerBuilder } from './components/FlyerBuilder';
import { Image as ImageIcon } from 'lucide-react';

export default function Competitions() {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModeTab, setCreateModeTab] = useState<'INDIVIDUAL' | 'TEAM'>('INDIVIDUAL');
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
        transitionSize: 32,
        rules: '',
        format: '8-Ball'
    });

    // Team Tournament Creation Specific Form State
    const [teamForm, setTeamForm] = useState({
        name: '',
        description: 'Kompetisi Beregu Antar Rumah Billiard Se-Polman & Majene',
        teamCount: 6,
        feePerTeam: 1000000,
        playersPerTeam: 6,
        formatType: 'TEAM_ROUND_ROBIN', // 'TEAM_ROUND_ROBIN' | 'TEAM_DOUBLE'
        startDate: '',
        rules: 'Format 5 Partai (3 Single, 1 Double, 1 Decider). Race to 3 frames per partai. Non-Kejurnas (HC 3 - 5).'
    });

    const [expandedBrackets, setExpandedBrackets] = useState<Record<string, boolean>>({});
    const [activeBracketTab, setActiveBracketTab] = useState<Record<string, 'WINNERS' | 'LOSERS'>>({});
    const [activeTeamTab, setActiveTeamTab] = useState<Record<string, 'STANDINGS' | 'FIXTURES'>>({});

    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [registerTournamentId, setRegisterTournamentId] = useState<string | null>(null);
    const [registerType, setRegisterType] = useState<'member' | 'guest'>('member');
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');
    const [guestName, setGuestName] = useState('');
    const [aliasName, setAliasName] = useState('');
    const [handicap, setHandicap] = useState('');

    // Team Registration Modal State
    const [isTeamRegisterModalOpen, setIsTeamRegisterModalOpen] = useState(false);
    const [teamRegisterForm, setTeamRegisterForm] = useState({
        tournamentId: '',
        teamName: '',
        city: 'Polewali Mandar',
        captainName: '',
        captainPhone: '',
        members: [
            { name: '', handicap: '4', role: 'Pemain Inti 1 (Single 9-Ball)' },
            { name: '', handicap: '4', role: 'Pemain Inti 2 (Single 10-Ball)' },
            { name: '', handicap: '3', role: 'Pemain Inti 3 (Scotch Double)' },
            { name: '', handicap: '3', role: 'Pemain Inti 4 (Scotch Double)' },
            { name: '', handicap: '4', role: 'Pemain Inti 5 (Single 8-Ball)' },
            { name: '', handicap: '3', role: 'Pemain Cadangan 1' },
            { name: '', handicap: '3', role: 'Pemain Cadangan 2' }
        ]
    });

    // Team Match Scoring Sheet Modal State
    const [isTeamScoreModalOpen, setIsTeamScoreModalOpen] = useState(false);
    const [teamScoreMatchData, setTeamScoreMatchData] = useState<any>(null);

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

    const [activeLiveDraw, setActiveLiveDraw] = useState<any>(null);
    const [flyerTournament, setFlyerTournament] = useState<any>(null);

    // WhatsApp Text & Sharing State
    const [waModalTournament, setWaModalTournament] = useState<any | null>(null);
    const [waTextContent, setWaTextContent] = useState<string>('');
    const [copiedWa, setCopiedWa] = useState(false);
    const [copyToast, setCopyToast] = useState<string | null>(null);

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
        const socketUrl = getSocketURL();
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
            if (createModeTab === 'TEAM') {
                const totalPool = teamForm.teamCount * teamForm.feePerTeam;
                const pChampion = Math.round(totalPool * 0.45);
                const pRunnerUp = Math.round(totalPool * 0.27);
                const pSemi = Math.round(totalPool * 0.14);

                const payload = {
                    name: teamForm.name || 'Inter-Club Championship Beregu',
                    description: teamForm.description,
                    entryFee: teamForm.feePerTeam,
                    prizePool: totalPool,
                    prizeChampion: pChampion,
                    prizeRunnerUp: pRunnerUp,
                    prizeSemiFinal: pSemi,
                    maxPlayers: teamForm.teamCount,
                    format: teamForm.formatType,
                    eliminationType: teamForm.formatType === 'TEAM_ROUND_ROBIN' ? 'SINGLE' : 'DOUBLE',
                    rules: `[TEAM_ROSTER_SIZE: ${teamForm.playersPerTeam}] ${teamForm.rules}`,
                    startDate: teamForm.startDate || undefined
                };

                await api.post('/tournaments', payload);
            } else {
                await api.post('/tournaments', form);
            }

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
                transitionSize: 32,
                rules: '',
                format: '8-Ball'
            });
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to create tournament');
        }
    };

    // Calculate standings for Round Robin & Team competitions
    const computeTeamStandings = (tournament: any) => {
        if (!tournament) return [];
        const participants = tournament.participants || [];
        const matches = tournament.matches || [];

        const stats = participants.map((p: any) => {
            let played = 0;
            let won = 0;
            let lost = 0;
            let framesWon = 0;
            let framesLost = 0;

            matches.forEach((m: any) => {
                if (m.status === 'COMPLETED') {
                    if (m.player1Id === p.id) {
                        played++;
                        framesWon += Number(m.score1 || 0);
                        framesLost += Number(m.score2 || 0);
                        if (m.winnerId === p.id) won++;
                        else lost++;
                    } else if (m.player2Id === p.id) {
                        played++;
                        framesWon += Number(m.score2 || 0);
                        framesLost += Number(m.score1 || 0);
                        if (m.winnerId === p.id) won++;
                        else lost++;
                    }
                }
            });

            const points = won * 3;
            const frameDiff = framesWon - framesLost;

            let parsedNotes: any = {};
            try {
                if (p.paymentNotes && p.paymentNotes.startsWith('{')) {
                    parsedNotes = JSON.parse(p.paymentNotes);
                }
            } catch (e) {}

            return {
                ...p,
                teamName: p.name || p.member?.name || 'Unknown Team',
                city: parsedNotes.city || (p.handicap?.includes('•') ? p.handicap.split('•')[1]?.trim() : 'Polman / Majene'),
                captain: parsedNotes.captain || '-',
                phone: parsedNotes.phone || '',
                membersList: parsedNotes.members || [],
                played,
                won,
                lost,
                framesWon,
                framesLost,
                frameDiff,
                points
            };
        });

        stats.sort((a: any, b: any) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.frameDiff !== a.frameDiff) return b.frameDiff - a.frameDiff;
            return b.framesWon - a.framesWon;
        });

        return stats;
    };

    const openTeamRegisterModal = (tournamentId: string) => {
        setTeamRegisterForm({
            tournamentId,
            teamName: '',
            city: 'Polewali Mandar',
            captainName: '',
            captainPhone: '',
            members: [
                { name: '', handicap: '4', role: 'Pemain Inti 1 (Single 9-Ball)' },
                { name: '', handicap: '4', role: 'Pemain Inti 2 (Single 10-Ball)' },
                { name: '', handicap: '3', role: 'Pemain Inti 3 (Scotch Double)' },
                { name: '', handicap: '3', role: 'Pemain Inti 4 (Scotch Double)' },
                { name: '', handicap: '4', role: 'Pemain Inti 5 (Single 8-Ball)' },
                { name: '', handicap: '3', role: 'Pemain Cadangan 1' },
                { name: '', handicap: '3', role: 'Pemain Cadangan 2' }
            ]
        });
        setIsTeamRegisterModalOpen(true);
    };

    const submitTeamRegistration = async () => {
        if (!teamRegisterForm.tournamentId || !teamRegisterForm.teamName.trim()) {
            vamosAlert('Harap isi Nama Rumah Billiard / Tim');
            return;
        }
        const filteredMembers = teamRegisterForm.members.filter(m => m.name.trim().length > 0);
        if (filteredMembers.length < 3) {
            vamosAlert('Minimal cantumkan 3 nama pemain dalam tim');
            return;
        }

        const teamPayload = {
            isTeam: true,
            teamName: teamRegisterForm.teamName.trim(),
            city: teamRegisterForm.city.trim() || 'Polman',
            captain: teamRegisterForm.captainName.trim(),
            phone: teamRegisterForm.captainPhone.trim(),
            members: filteredMembers
        };

        try {
            await api.post(`/tournaments/${teamRegisterForm.tournamentId}/register`, {
                name: `${teamRegisterForm.teamName.trim()} (${teamPayload.city})`,
                handicap: `${filteredMembers.length} Pemain • ${teamPayload.city}`,
                paymentNotes: JSON.stringify(teamPayload)
            });
            setIsTeamRegisterModalOpen(false);
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal mendaftarkan tim');
        }
    };

    const openTeamScoreModal = (m: any, t: any) => {
        const p1 = t.participants?.find((p: any) => p.id === m.player1Id);
        const p2 = t.participants?.find((p: any) => p.id === m.player2Id);
        const p1Name = p1 ? (p1.name || p1.member?.name) : 'Tim 1';
        const p2Name = p2 ? (p2.name || p2.member?.name) : 'Tim 2';

        let p1Members: any[] = [];
        let p2Members: any[] = [];
        try {
            if (p1?.paymentNotes?.startsWith('{')) p1Members = JSON.parse(p1.paymentNotes).members || [];
            if (p2?.paymentNotes?.startsWith('{')) p2Members = JSON.parse(p2.paymentNotes).members || [];
        } catch (e) {}

        const defaultParties = [
            { partyName: 'Partai 1', gameType: 'Single 9-Ball (Race to 3)', p1: p1Members[0]?.name || `${p1Name} (P1)`, p2: p2Members[0]?.name || `${p2Name} (P1)`, s1: 0, s2: 0 },
            { partyName: 'Partai 2', gameType: 'Single 10-Ball (Race to 3)', p1: p1Members[1]?.name || `${p1Name} (P2)`, p2: p2Members[1]?.name || `${p2Name} (P2)`, s1: 0, s2: 0 },
            { partyName: 'Partai 3', gameType: 'Scotch Doubles 9-Ball (Race to 3)', p1: `${p1Members[2]?.name || 'P3'} & ${p1Members[3]?.name || 'P4'}`, p2: `${p2Members[2]?.name || 'P3'} & ${p2Members[3]?.name || 'P4'}`, s1: 0, s2: 0 },
            { partyName: 'Partai 4', gameType: 'Single 8-Ball (Race to 3)', p1: p1Members[4]?.name || `${p1Name} (P5)`, p2: p2Members[4]?.name || `${p2Name} (P5)`, s1: 0, s2: 0 },
            { partyName: 'Partai 5', gameType: 'Single 9-Ball Decider (Kapten)', p1: `Kapten ${p1Name}`, p2: `Kapten ${p2Name}`, s1: 0, s2: 0 },
        ];

        setTeamScoreMatchData({
            matchId: m.id,
            tournamentId: t.id,
            p1Id: m.player1Id,
            p2Id: m.player2Id,
            p1Name,
            p2Name,
            parties: defaultParties,
            teamScore1: m.score1 || 0,
            teamScore2: m.score2 || 0
        });
        setIsTeamScoreModalOpen(true);
    };

    const submitTeamMatchScore = async () => {
        if (!teamScoreMatchData) return;
        const { matchId, p1Id, p2Id, teamScore1, teamScore2 } = teamScoreMatchData;

        if (teamScore1 === teamScore2) {
            vamosAlert('Pertandingan beregu harus ada pemenang (tidak boleh seri). Silakan selesaikan partai penentu.');
            return;
        }

        const winnerId = teamScore1 > teamScore2 ? p1Id : p2Id;

        try {
            await api.put(`/tournaments/matches/${matchId}`, {
                score1: teamScore1,
                score2: teamScore2,
                winnerId
            });
            setIsTeamScoreModalOpen(false);
            setTeamScoreMatchData(null);
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal menyimpan skor pertandingan tim');
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

    const generateWhatsAppText = (t: any) => {
        if (!t) return '';
        const rawParticipants = t.participants || [];
        const isTeamTournament = (t.format || '').includes('TEAM') || (t.format || '').includes('BEREGU') || (t.rules || '').includes('TEAM');

        const dateStr = t.startDate 
            ? new Date(t.startDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : null;

        if (isTeamTournament) {
            const standings = computeTeamStandings(t);
            let text = `🎱 *TURNAMEN BEREGU ANTAR RUMAH BILLIARD*\n`;
            text += `🏆 *${(t.name || 'INTER-CLUB CHAMPIONSHIP').toUpperCase()}*\n`;
            text += `─────────────────────────\n`;
            text += `🏢 *Tuan Rumah* : ${t.venue || 'VAMOS POOL & CAFE (POLMAN)'}\n`;
            if (dateStr) text += `📅 *Tanggal* : ${dateStr}\n`;
            if (t.entryFee) text += `💵 *Registrasi* : Rp ${t.entryFee.toLocaleString('id-ID')} / Tim\n`;
            if (t.prizePool) text += `🎁 *Total Prize Pool* : Rp ${t.prizePool.toLocaleString('id-ID')}\n`;
            text += `👥 *Slot Tim* : ${rawParticipants.length} / ${t.maxPlayers || 6} Rumah Billiard\n`;
            text += `─────────────────────────\n\n`;

            if (t.status === 'ONGOING' || t.status === 'COMPLETED') {
                text += `📊 *KLASEMEN SEMENTARA:*\n`;
                standings.forEach((st: any, idx: number) => {
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
                    text += `${medal} *${st.teamName}* (${st.city})\n`;
                    text += `   Main: ${st.played} | M: ${st.won} | K: ${st.lost} | Frame: ${st.framesWon}-${st.framesLost} (Diff: ${st.frameDiff > 0 ? '+' : ''}${st.frameDiff}) | *PTS: ${st.points}*\n`;
                });
                text += `\n─────────────────────────\n\n`;
            }

            text += `📋 *DAFTAR TIM & SQUAD PEMAIN:*\n`;
            rawParticipants.forEach((p: any, idx: number) => {
                let parsed: any = {};
                try {
                    if (p.paymentNotes && p.paymentNotes.startsWith('{')) parsed = JSON.parse(p.paymentNotes);
                } catch (e) {}

                const statusSymbol = p.paymentStatus === 'PAID' ? '✅ Lunas' : '⏳ Pending';
                text += `*${idx + 1}. ${p.name || 'Tim'}* [${statusSymbol}]\n`;
                if (parsed.captain) text += `   👑 Kapten: ${parsed.captain} (${parsed.phone || '-'})\n`;
                if (parsed.members && parsed.members.length > 0) {
                    text += `   👥 Squad: ${parsed.members.map((m: any) => `${m.name} [HC:${m.handicap || '4'}]`).join(', ')}\n`;
                }
                text += `\n`;
            });

            return text.trimEnd();
        }

        // Sort participants alphabetically by name (A-Z)
        const participants = [...rawParticipants].sort((a: any, b: any) => {
            const nameA = (a.name || a.member?.name || '').trim().toUpperCase();
            const nameB = (b.name || b.member?.name || '').trim().toUpperCase();
            return nameA.localeCompare(nameB, 'id-ID', { sensitivity: 'base' });
        });
        const maxSlots = t.maxPlayers || 32;
        const totalSlots = Math.max(maxSlots, participants.length);

        let text = `🎱 *DAFTAR PESERTA TURNAMEN*\n`;
        text += `🏆 *${(t.name || 'TURNAMEN BILLIARD').toUpperCase()}*\n`;
        text += `─────────────────────────\n`;
        text += `🏢 *Venue* : ${t.venue || 'VAMOS SMART ARENA POOL & CAFE'}\n`;
        if (dateStr) text += `📅 *Tanggal* : ${dateStr}\n`;
        if (t.entryFee) text += `💵 *Entry Fee* : Rp ${t.entryFee.toLocaleString('id-ID')}\n`;
        if (t.prizePool) text += `🎁 *Prize Pool* : Rp ${t.prizePool.toLocaleString('id-ID')}\n`;
        text += `👥 *Slot* : ${participants.length} / ${maxSlots} Peserta\n`;
        text += `─────────────────────────\n\n`;
        text += `*LIST PESERTA (A-Z):*\n`;

        for (let i = 1; i <= totalSlots; i++) {
            const p = participants[i - 1];
            if (p) {
                const name = (p.name || p.member?.name || 'Peserta').trim().toUpperCase();
                const hc = p.handicap || p.member?.handicap || '-';
                const isPaid = p.paymentStatus === 'PAID';
                const statusSymbol = isPaid ? '✅' : '⏳';
                text += `${i}. ${name} [HC: ${hc}] ${statusSymbol}\n`;
            } else {
                text += `${i}. \n`;
            }
        }

        return text.trimEnd();
    };

    const copyToClipboard = async (text: string) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            }
        } catch (err) {
            console.error('Failed to copy: ', err);
            return false;
        }
    };

    const handleCopyWhatsAppDirect = async (tournament: any) => {
        const text = generateWhatsAppText(tournament);
        const success = await copyToClipboard(text);
        if (success) {
            setCopyToast(`List peserta "${tournament.name}" berhasil disalin untuk WhatsApp!`);
            setTimeout(() => setCopyToast(null), 3500);
        } else {
            vamosAlert('Gagal menyalin ke clipboard. Silakan gunakan tombol preview.');
        }
    };

    const handleOpenWaModal = (tournament: any) => {
        const text = generateWhatsAppText(tournament);
        setWaModalTournament(tournament);
        setWaTextContent(text);
        setCopiedWa(false);
    };

    const handleShareWhatsAppWeb = (text: string) => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
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


    const handleExportPDF = (tournament: any) => {
        if (!tournament) return;

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();   // 297mm
        const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

        const colors = {
            primary: [37, 99, 235],       // #2563eb Blue
            secondary: [15, 23, 42],      // #0f172a Slate-900 (Dark text)
            muted: [100, 116, 139],       // #64748b Slate-500
            border: [203, 213, 225],      // #cbd5e1 Slate-300
            cardBg: [255, 255, 255],
            cardHeader: [241, 245, 249],  // #f1f5f9
            winner: [16, 185, 129],       // #10b981 Emerald
            goldBg: [254, 252, 232],
            goldBorder: [250, 204, 21]
        };

        // ─── 1. HEADER ───
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, 24, 'F');

        doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setLineWidth(0.8);
        doc.line(12, 22, pageWidth - 12, 22);

        // Left: Brand
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("VAMOS", 12, 14);

        doc.setFontSize(8);
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text("SMART ARENA POOL & CAFE", 42, 14);

        // Right: Tournament Info
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(tournament.name.toUpperCase(), pageWidth - 12, 12, { align: 'right' });

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        const dateStr = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'UNDEFINED';
        doc.text(`${tournament.venue?.toUpperCase() || 'VAMOS SMART ARENA'} • ${dateStr.toUpperCase()} • ${tournament.participants?.length || 32} PLAYERS`, pageWidth - 12, 18, { align: 'right' });

        // ─── 2. SEPARATE MATCHES INTO POOL A (LEFT) & POOL B (RIGHT) ───
        const round1Matches = (tournament.matches || [])
            .filter((m: any) => Number(m.round) === 1)
            .sort((a: any, b: any) => Number(a.matchNumber) - Number(b.matchNumber));

        if (round1Matches.length === 0) {
            vamosAlert('Bagan masih kosong. Silakan generate drawing bagan terlebih dahulu.');
            return;
        }

        const totalR1 = round1Matches.length;
        const halfR1 = Math.ceil(totalR1 / 2);

        const startY = 32;
        const availableHeight = pageHeight - startY - 14; // ~164mm
        const cardHeight = totalR1 <= 8 ? 14 : 12;
        const cardWidth = totalR1 <= 8 ? 48 : 42;

        // Pool A Header (Left)
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.roundedRect(12, startY - 6, 88, 4.5, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text("POOL A • BAGAN ATAS", 56, startY - 3, { align: 'center' });

        // Pool B Header (Right)
        doc.setFillColor(225, 29, 72); // Rose/Red
        doc.roundedRect(pageWidth - 100, startY - 6, 88, 4.5, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text("POOL B • BAGAN BAWAH", pageWidth - 56, startY - 3, { align: 'center' });

        // Center Grand Final Header
        doc.setFillColor(234, 179, 8); // Gold
        doc.roundedRect(pageWidth / 2 - 22, startY - 6, 44, 4.5, 1, 1, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text("🏆 GRAND FINAL", pageWidth / 2, startY - 3, { align: 'center' });

        const getParticipant = (pId: string | undefined) => {
            if (!pId) return null;
            return (tournament.participants || []).find((pt: any) => pt.id === pId) || null;
        };

        const drawMatchBox = (m: any, x: number, y: number, width = cardWidth, height = cardHeight, isFinal = false) => {
            doc.setDrawColor(isFinal ? colors.goldBorder[0] : colors.border[0], isFinal ? colors.goldBorder[1] : colors.border[1], isFinal ? colors.goldBorder[2] : colors.border[2]);
            doc.setLineWidth(isFinal ? 0.4 : 0.2);
            doc.setFillColor(isFinal ? colors.goldBg[0] : 255, isFinal ? colors.goldBg[1] : 255, isFinal ? colors.goldBg[2] : 255);
            doc.roundedRect(x, y, width, height, 0.8, 0.8, 'FD');

            const p1 = getParticipant(m?.player1Id);
            const p2 = getParticipant(m?.player2Id);
            const p1Name = p1 ? (p1.name || p1.member?.name || 'TBD') : (m?.status === 'COMPLETED' ? 'BYE' : 'TBD');
            const p2Name = p2 ? (p2.name || p2.member?.name || 'TBD') : (m?.status === 'COMPLETED' ? 'BYE' : 'TBD');
            const p1HC = p1?.handicap ? `[${p1.handicap}]` : '';
            const p2HC = p2?.handicap ? `[${p2.handicap}]` : '';

            const p1Score = m?.score1 ?? 0;
            const p2Score = m?.score2 ?? 0;
            const p1Winner = m?.winnerId && m?.winnerId === m?.player1Id;
            const p2Winner = m?.winnerId && m?.winnerId === m?.player2Id;

            // Player 1 line
            doc.setFontSize(6.5);
            doc.setFont('helvetica', p1Winner ? 'bold' : 'normal');
            doc.setTextColor(p1Winner ? colors.winner[0] : colors.secondary[0], p1Winner ? colors.winner[1] : colors.secondary[1], p1Winner ? colors.winner[2] : colors.secondary[2]);
            let d1 = p1Name.toUpperCase();
            if (d1.length > 17) d1 = d1.substring(0, 15) + '..';
            doc.text(d1, x + 2, y + 4.2);
            if (p1HC) {
                doc.setFontSize(5);
                doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
                doc.text(p1HC, x + width - 6.5, y + 4.2, { align: 'right' });
            }
            doc.setFontSize(6.5);
            doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
            doc.text(String(p1Score), x + width - 2, y + 4.2, { align: 'right' });

            // Divider
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.setLineWidth(0.15);
            doc.line(x + 1.5, y + 6, x + width - 1.5, y + 6);

            // Player 2 line
            doc.setFontSize(6.5);
            doc.setFont('helvetica', p2Winner ? 'bold' : 'normal');
            doc.setTextColor(p2Winner ? colors.winner[0] : colors.secondary[0], p2Winner ? colors.winner[1] : colors.secondary[1], p2Winner ? colors.winner[2] : colors.secondary[2]);
            let d2 = p2Name.toUpperCase();
            if (d2.length > 17) d2 = d2.substring(0, 15) + '..';
            doc.text(d2, x + 2, y + 10);
            if (p2HC) {
                doc.setFontSize(5);
                doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
                doc.text(p2HC, x + width - 6.5, y + 10, { align: 'right' });
            }
            doc.setFontSize(6.5);
            doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
            doc.text(String(p2Score), x + width - 2, y + 10, { align: 'right' });

            // Match number badge
            if (m?.matchNumber) {
                doc.setFillColor(colors.cardHeader[0], colors.cardHeader[1], colors.cardHeader[2]);
                doc.rect(x + width - 7, y, 7, 2.5, 'F');
                doc.setFontSize(4);
                doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
                doc.text(`#${m.matchNumber}`, x + width - 3.5, y + 1.8, { align: 'center' });
            }
        };

        const leftMatches = round1Matches.slice(0, halfR1);
        const rightMatches = round1Matches.slice(halfR1);
        const r1Spacing = availableHeight / halfR1;

        const leftPos: Record<string, { x: number; y: number; cx: number; cy: number }> = {};
        const rightPos: Record<string, { x: number; y: number; cx: number; cy: number }> = {};

        // 1. Left Wing - Round 1 (x=12)
        leftMatches.forEach((m: any, idx: number) => {
            const x = 12;
            const y = startY + (idx * r1Spacing) + (r1Spacing / 2) - (cardHeight / 2);
            leftPos[`1_${idx}`] = { x, y, cx: x + cardWidth, cy: y + cardHeight / 2 };
            drawMatchBox(m, x, y);
        });

        // 2. Left Wing - Round 2 (x=52, 4 matches if 32 players, 2 if 16 players)
        const leftR2Count = Math.max(1, Math.floor(halfR1 / 2));
        for (let i = 0; i < leftR2Count; i++) {
            const x = 52;
            const m1Y = leftPos[`1_${i * 2}`].cy;
            const m2Y = leftPos[`1_${i * 2 + 1}`].cy;
            const y = (m1Y + m2Y) / 2 - cardHeight / 2;
            leftPos[`2_${i}`] = { x, y, cx: x + cardWidth, cy: y + cardHeight / 2 };
            drawMatchBox(null, x, y);

            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.setLineWidth(0.3);
            const midX = (leftPos[`1_${i * 2}`].cx + x) / 2;
            doc.line(leftPos[`1_${i * 2}`].cx, m1Y, midX, m1Y);
            doc.line(leftPos[`1_${i * 2 + 1}`].cx, m2Y, midX, m2Y);
            doc.line(midX, m1Y, midX, m2Y);
            doc.line(midX, (m1Y + m2Y) / 2, x, (m1Y + m2Y) / 2);
        }

        // 3. Left Wing - Quarter Final (x=92, 2 matches if 32 players)
        const leftQFCount = Math.max(1, Math.floor(leftR2Count / 2));
        if (halfR1 >= 8) {
            for (let i = 0; i < leftQFCount; i++) {
                const x = 92;
                const m1Y = leftPos[`2_${i * 2}`].cy;
                const m2Y = leftPos[`2_${i * 2 + 1}`].cy;
                const y = (m1Y + m2Y) / 2 - cardHeight / 2;
                leftPos[`3_${i}`] = { x, y, cx: x + cardWidth, cy: y + cardHeight / 2 };
                drawMatchBox(null, x, y);

                doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
                doc.setLineWidth(0.3);
                const midX = (leftPos[`2_${i * 2}`].cx + x) / 2;
                doc.line(leftPos[`2_${i * 2}`].cx, m1Y, midX, m1Y);
                doc.line(leftPos[`2_${i * 2 + 1}`].cx, m2Y, midX, m2Y);
                doc.line(midX, m1Y, midX, m2Y);
                doc.line(midX, (m1Y + m2Y) / 2, x, (m1Y + m2Y) / 2);
            }
        }

        // 4. Right Wing - Round 1 (x = pageWidth - 12 - cardWidth = 243)
        const rightX = pageWidth - 12 - cardWidth;
        rightMatches.forEach((m: any, idx: number) => {
            const x = rightX;
            const y = startY + (idx * r1Spacing) + (r1Spacing / 2) - (cardHeight / 2);
            rightPos[`1_${idx}`] = { x, y, cx: x, cy: y + cardHeight / 2 };
            drawMatchBox(m, x, y);
        });

        // 5. Right Wing - Round 2 (x = rightX - 40 = 203)
        for (let i = 0; i < leftR2Count; i++) {
            const x = rightX - 40;
            const m1Y = rightPos[`1_${i * 2}`].cy;
            const m2Y = rightPos[`1_${i * 2 + 1}`].cy;
            const y = (m1Y + m2Y) / 2 - cardHeight / 2;
            rightPos[`2_${i}`] = { x, y, cx: x, cy: y + cardHeight / 2 };
            drawMatchBox(null, x, y);

            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.setLineWidth(0.3);
            const midX = (rightPos[`1_${i * 2}`].cx + x + cardWidth) / 2;
            doc.line(rightPos[`1_${i * 2}`].cx, m1Y, midX, m1Y);
            doc.line(rightPos[`1_${i * 2 + 1}`].cx, m2Y, midX, m2Y);
            doc.line(midX, m1Y, midX, m2Y);
            doc.line(midX, (m1Y + m2Y) / 2, x + cardWidth, (m1Y + m2Y) / 2);
        }

        // 6. Right Wing - Quarter Final (x = rightX - 80 = 163)
        if (halfR1 >= 8) {
            for (let i = 0; i < leftQFCount; i++) {
                const x = rightX - 80;
                const m1Y = rightPos[`2_${i * 2}`].cy;
                const m2Y = rightPos[`2_${i * 2 + 1}`].cy;
                const y = (m1Y + m2Y) / 2 - cardHeight / 2;
                rightPos[`3_${i}`] = { x, y, cx: x, cy: y + cardHeight / 2 };
                drawMatchBox(null, x, y);

                doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
                doc.setLineWidth(0.3);
                const midX = (rightPos[`2_${i * 2}`].cx + x + cardWidth) / 2;
                doc.line(rightPos[`2_${i * 2}`].cx, m1Y, midX, m1Y);
                doc.line(rightPos[`2_${i * 2 + 1}`].cx, m2Y, midX, m2Y);
                doc.line(midX, m1Y, midX, m2Y);
                doc.line(midX, (m1Y + m2Y) / 2, x + cardWidth, (m1Y + m2Y) / 2);
            }
        }

        // 7. Center Grand Final
        const lastLeftKey = halfR1 >= 8 ? '3' : '2';
        const leftSF_Y = halfR1 >= 8 
            ? (leftPos['3_0'].cy + leftPos['3_1'].cy) / 2
            : (leftPos['2_0'].cy + leftPos['2_1'].cy) / 2;

        const rightSF_Y = halfR1 >= 8 
            ? (rightPos['3_0'].cy + rightPos['3_1'].cy) / 2
            : (rightPos['2_0'].cy + rightPos['2_1'].cy) / 2;

        const finalWidth = 46;
        const finalHeight = 15;
        const finalX = (pageWidth - finalWidth) / 2;
        const finalY = (leftSF_Y + rightSF_Y) / 2 - finalHeight / 2;

        drawMatchBox(null, finalX, finalY, finalWidth, finalHeight, true);

        // Connectors to Final
        const leftMidX = ((halfR1 >= 8 ? leftPos['3_0'].cx : leftPos['2_0'].cx) + finalX) / 2;
        doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setLineWidth(0.4);
        const lKey0 = `${lastLeftKey}_0`;
        const lKey1 = `${lastLeftKey}_1`;
        doc.line(leftPos[lKey0].cx, leftPos[lKey0].cy, leftMidX, leftPos[lKey0].cy);
        doc.line(leftPos[lKey1].cx, leftPos[lKey1].cy, leftMidX, leftPos[lKey1].cy);
        doc.line(leftMidX, leftPos[lKey0].cy, leftMidX, leftPos[lKey1].cy);
        doc.line(leftMidX, leftSF_Y, finalX, leftSF_Y);

        const rightMidX = ((halfR1 >= 8 ? rightPos['3_0'].cx : rightPos['2_0'].cx) + finalX + finalWidth) / 2;
        doc.setDrawColor(225, 29, 72);
        doc.setLineWidth(0.4);
        const rKey0 = `${lastLeftKey}_0`;
        const rKey1 = `${lastLeftKey}_1`;
        doc.line(rightPos[rKey0].cx, rightPos[rKey0].cy, rightMidX, rightPos[rKey0].cy);
        doc.line(rightPos[rKey1].cx, rightPos[rKey1].cy, rightMidX, rightPos[rKey1].cy);
        doc.line(rightMidX, rightPos[rKey0].cy, rightMidX, rightPos[rKey1].cy);
        doc.line(rightMidX, rightSF_Y, finalX + finalWidth, rightSF_Y);

        // ─── 3. FOOTER ───
        doc.setFillColor(248, 250, 252);
        doc.rect(0, pageHeight - 9, pageWidth, 9, 'F');
        doc.setFontSize(6.5);
        doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        doc.text(`TOTAL PARTICIPANTS: ${tournament.participants?.length || 32} SLOTS | FORMAT: ${tournament.format || 'SINGLE ELIMINATION (8-BALL)'}`, 12, pageHeight - 3.5);
        doc.text(`VAMOS SMART ARENA - OFFICIAL BRACKET SHEET | GENERATED: ${new Date().toLocaleString('id-ID')}`, pageWidth - 12, pageHeight - 3.5, { align: 'right' });

        doc.save(`BRACKET-${tournament.name.toUpperCase().replace(/\s+/g, '-')}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a] min-h-screen text-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    // Calculate Tournament Financials & Statistics
    const totalEntryCollected = tournaments.reduce((sum, t) => {
        const paidCount = (t.participants || []).filter((p: any) => p.paymentStatus === 'PAID').length;
        return sum + (paidCount * (t.entryFee || 0));
    }, 0);

    const totalPrizePool = tournaments.reduce((sum, t) => sum + (t.prizePool || 0), 0);

    const totalPaidParticipants = tournaments.reduce((sum, t) => {
        return sum + (t.participants || []).filter((p: any) => p.paymentStatus === 'PAID').length;
    }, 0);

    const totalUnpaidParticipants = tournaments.reduce((sum, t) => {
        return sum + (t.participants || []).filter((p: any) => p.paymentStatus !== 'PAID').length;
    }, 0);

    const totalAllParticipants = totalPaidParticipants + totalUnpaidParticipants;
    const netMargin = totalEntryCollected - totalPrizePool;

    return (
        <div className="fade-in space-y-6">
            {/* ─── FINANCIAL & COMPETITION SUMMARY CARDS ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Pendaftaran Terkumpul */}
                <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5 relative overflow-hidden shadow-lg group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Uang Pendaftaran Masuk</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-black font-mono text-emerald-400 leading-tight">
                        Rp {totalEntryCollected.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5 text-xs">
                        <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 inline" /> {totalPaidParticipants} Peserta Lunas
                        </span>
                        {totalUnpaidParticipants > 0 && (
                            <span className="text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded">
                                {totalUnpaidParticipants} Pending
                            </span>
                        )}
                    </div>
                </div>

                {/* Card 2: Total Alokasi Hadiah (Prize Pool) */}
                <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5 relative overflow-hidden shadow-lg group hover:border-yellow-500/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Hadiah (Prize Pool)</span>
                        <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                            <Trophy className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-black font-mono text-yellow-500 leading-tight">
                        Rp {totalPrizePool.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2.5">
                        Alokasi hadiah untuk {tournaments.length} Event Turnamen
                    </p>
                </div>

                {/* Card 3: Selisih Kas Turnamen (Net Cashflow) */}
                <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5 relative overflow-hidden shadow-lg group hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Net Kas Turnamen</span>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            netMargin >= 0 
                                ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' 
                                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        }`}>
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <p className={`text-2xl font-black font-mono leading-tight ${
                        netMargin >= 0 ? 'text-cyan-400' : 'text-rose-400'
                    }`}>
                        {netMargin >= 0 ? '+' : ''}Rp {netMargin.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2.5">
                        {netMargin >= 0 ? 'Surplus dari pendaftaran' : 'Alokasi / Subsidi hadiah'}
                    </p>
                </div>

                {/* Card 4: Total Peserta & Turnamen */}
                <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5 relative overflow-hidden shadow-lg group hover:border-blue-500/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Partisipan</span>
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-black font-mono text-white leading-tight">
                        {totalAllParticipants} <span className="text-sm font-normal text-gray-500">Pendaftar</span>
                    </p>
                    <div className="flex items-center gap-2 mt-2.5 text-xs text-gray-400">
                        <span>{tournaments.filter(t => t.status === 'PENDING').length} Pendaftaran Buka</span>
                        <span>• {tournaments.filter(t => t.status === 'ONGOING').length} Bertanding</span>
                    </div>
                </div>
            </div>

            {/* ─── ACTION BAR ─── */}
            <div className="flex justify-between items-center bg-[#111111] p-4 rounded-2xl border border-[#222222]">
                <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" /> Daftar Turnamen Aktif
                    </h3>
                    <p className="text-xs text-gray-400">Keuangan turnamen terisolasi di fitur ini (tidak digabung dengan laporan meja & FnB harian kasir)</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-yellow-500 text-[#0a0a0a] px-5 py-2.5 rounded-xl font-bold hover:bg-yellow-400 transition-colors shadow-[0_0_15px_rgba(234,179,8,0.2)] flex items-center gap-2 text-sm"
                >
                    + New Tournament
                </button>
            </div>

            <div className="space-y-6">
                {tournaments.map(t => {
                    const paidParticipants = (t.participants || []).filter((p: any) => p.paymentStatus === 'PAID');
                    const paidMoney = paidParticipants.length * (t.entryFee || 0);
                    const isTeamTournament = (t.format || '').includes('TEAM') || (t.format || '').includes('BEREGU') || (t.rules || '').includes('TEAM');
                    const teamStandings = isTeamTournament ? computeTeamStandings(t) : [];
                    const activeTab = activeTeamTab[t.id] || 'STANDINGS';

                    return (
                    <div key={t.id} className="bg-[#141414] border border-[#222222] rounded-2xl p-6 relative overflow-hidden group">
                        {t.status === 'ONGOING' && <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00ff66]"></div>}
                        {t.status === 'COMPLETED' && <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-600"></div>}
                        {t.status === 'PENDING' && <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-500"></div>}

                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h2 className="text-2xl font-bold font-mono text-white flex items-center">
                                        {t.name}
                                    </h2>
                                    {isTeamTournament && (
                                        <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg uppercase tracking-wider bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 shadow-sm">
                                            <Shield className="w-3.5 h-3.5 text-cyan-400" /> Beregu Antar Pool Hall
                                        </span>
                                    )}
                                    <button onClick={() => deleteTournamentData(t.id)} className="ml-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 p-1.5 rounded transition-colors" title="Delete Tournament">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-400 mb-4">{t.description || 'No description provided.'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {t.startDate && (
                                    <span className="px-3 py-1 text-xs font-bold rounded tracking-wider uppercase border text-cyan-400 border-cyan-500/30 bg-cyan-500/10 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(t.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                )}
                                <span className={`px-3 py-1 text-xs font-bold rounded tracking-wider uppercase border
                                    ${t.status === 'PENDING' ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' :
                                        t.status === 'ONGOING' ? 'text-[#00ff66] border-[#00ff66]/30 bg-[#00ff66]/10' :
                                            'text-gray-400 border-gray-600 bg-white/5'}`}
                                >
                                    {t.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                            <div className="bg-[#0a0a0a] border border-[#222222] p-3 rounded-xl">
                                <p className="text-xs text-gray-500 font-bold mb-1">{isTeamTournament ? 'BIAYA PER TIM' : 'ENTRY FEE'}</p>
                                <p className="font-mono text-white text-sm">Rp {t.entryFee.toLocaleString()}</p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#222222] p-3 rounded-xl">
                                <p className="text-xs text-gray-500 font-bold mb-1">TOTAL PRIZE POOL</p>
                                <p className="font-mono text-yellow-500 font-bold flex items-center text-sm">
                                    Rp {t.prizePool.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-emerald-500/20 bg-emerald-500/5 p-3 rounded-xl">
                                <p className="text-xs text-emerald-400 font-bold mb-1">KAS MASUK ({paidParticipants.length} Lunas)</p>
                                <p className="font-mono text-emerald-400 font-bold text-sm">
                                    Rp {paidMoney.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#222222] p-3 rounded-xl">
                                <p className="text-xs text-gray-500 font-bold mb-1">{isTeamTournament ? 'TIM TERDAFTAR' : 'PARTICIPANTS'}</p>
                                <p className="font-mono text-white text-sm flex items-center">
                                    <Users className="w-3 h-3 mr-1 text-[#00aaff]" /> {t.participants.length} / {t.maxPlayers} {isTeamTournament ? 'Tim' : 'Slot'}
                                </p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#222222] p-3 rounded-xl flex items-center justify-center col-span-2 md:col-span-1">
                                {t.status === 'PENDING' && (
                                    <div className="flex space-x-1.5 w-full">
                                        {isTeamTournament ? (
                                            <button onClick={() => openTeamRegisterModal(t.id)} className="flex-1 px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold rounded transition-colors border border-cyan-500/30 flex items-center justify-center gap-1">
                                                <Building2 className="w-3 h-3" /> + Tim
                                            </button>
                                        ) : (
                                            <button onClick={() => openRegisterModal(t.id)} className="flex-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-xs font-bold rounded transition-colors text-white">Register</button>
                                        )}
                                        <button onClick={() => { setManageTournamentId(t.id); setIsManageParticipantsOpen(true); }} className="flex-1 px-2 py-1 bg-[#00aaff]/10 hover:bg-[#00aaff]/20 text-[#00aaff] text-xs font-bold rounded transition-colors border border-[#00aaff]/30">Manage</button>
                                        {t.participants.length >= 2 && (
                                            <button onClick={() => generateBracket(t.id)} className="flex-1 px-2 py-1 bg-[#00ff66] hover:bg-[#00e65c] text-[#0a0a0a] text-xs font-bold rounded transition-colors">Start</button>
                                        )}
                                    </div>
                                )}
                                {t.status === 'ONGOING' && (
                                    <div className="flex space-x-1.5 w-full">
                                        <button onClick={() => { setActiveLiveDraw(t); }} className="flex-1 px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 text-xs font-bold rounded transition-colors border border-cyan-500/30">
                                            Live Draw
                                        </button>
                                        <button onClick={() => { setFinishTournamentId(t.id); setIsFinishModalOpen(true); }} className="flex-[2] px-2 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded transition-colors flex items-center justify-center">
                                            <Trophy className="w-3 h-3 mr-1" /> Conclude
                                        </button>
                                    </div>
                                )}
                                {t.status === 'COMPLETED' && (
                                    <span className="text-xs text-green-500 font-bold tracking-widest uppercase"><Check className="w-3 h-3 inline mr-1" /> Finished</span>
                                )}
                                {t.matches && t.matches.length > 0 && !isTeamTournament && (
                                    <button 
                                        onClick={() => handleExportPDF(t)} 
                                        className="ml-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-xs font-bold rounded transition-colors text-white flex items-center"
                                        title="Export PDF"
                                    >
                                        PDF
                                    </button>
                                )}
                                <button 
                                    onClick={() => setFlyerTournament(t)} 
                                    className="ml-1.5 px-2.5 py-1 bg-[#00ff66]/10 hover:bg-[#00ff66]/20 text-xs font-bold rounded transition-colors text-[#00ff66] flex items-center border border-[#00ff66]/20"
                                    title="Flyer Builder"
                                >
                                    <ImageIcon className="w-3 h-3" />
                                </button>
                                <button 
                                    onClick={() => handleOpenWaModal(t)} 
                                    className="ml-1.5 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/25 text-xs font-bold rounded transition-colors text-emerald-400 flex items-center gap-1 border border-emerald-500/30 shadow-sm"
                                    title="Salin / Bagikan List Peserta ke WhatsApp"
                                >
                                    <MessageSquare className="w-3 h-3" />
                                    <span className="hidden xl:inline text-[11px]">WA</span>
                                </button>
                            </div>
                        </div>

                        {/* ─── TEAM TOURNAMENT: STANDINGS & FIXTURES PANEL ─── */}
                        {isTeamTournament && t.matches && t.matches.length > 0 && (
                            <div className="mt-4 border-t border-[#222222] pt-4 space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex gap-2 bg-[#0a0a0a] p-1 rounded-xl border border-[#222222]">
                                        <button
                                            onClick={() => setActiveTeamTab(p => ({ ...p, [t.id]: 'STANDINGS' }))}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'STANDINGS' ? 'bg-yellow-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            <Award className="w-3.5 h-3.5" />
                                            <span>Klasemen Liga Beregu</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTeamTab(p => ({ ...p, [t.id]: 'FIXTURES' }))}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'FIXTURES' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            <Layers className="w-3.5 h-3.5" />
                                            <span>Jadwal & Lembar Skor ({t.matches.length} Match)</span>
                                        </button>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        Format: <strong className="text-yellow-500">5 Partai per Pertemuan</strong> • Menang: <strong>3 Poin</strong>
                                    </span>
                                </div>

                                {activeTab === 'STANDINGS' && (
                                    <div className="overflow-x-auto bg-[#0a0a0a] rounded-xl border border-[#222222]">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-[#111111] text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-[#222222]">
                                                <tr>
                                                    <th className="py-3 px-3 text-center w-12">Pos</th>
                                                    <th className="py-3 px-4">Rumah Billiard / Tim</th>
                                                    <th className="py-3 px-3">Kota Asal</th>
                                                    <th className="py-3 px-3 text-center">P (Main)</th>
                                                    <th className="py-3 px-3 text-center text-emerald-400">W</th>
                                                    <th className="py-3 px-3 text-center text-red-400">L</th>
                                                    <th className="py-3 px-3 text-center">Frame (W-L)</th>
                                                    <th className="py-3 px-3 text-center">Diff</th>
                                                    <th className="py-3 px-4 text-center text-yellow-500 font-black">PTS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#1a1a1a]">
                                                {teamStandings.map((st: any, idx: number) => {
                                                    const isTop2 = idx < 2;
                                                    return (
                                                        <tr key={st.id} className={`hover:bg-white/5 transition-colors ${isTop2 ? 'bg-yellow-500/5' : ''}`}>
                                                            <td className="py-3 px-3 text-center">
                                                                {idx === 0 ? (
                                                                    <span className="w-6 h-6 rounded-full bg-yellow-500 text-black font-black inline-flex items-center justify-center text-xs shadow-sm">1</span>
                                                                ) : idx === 1 ? (
                                                                    <span className="w-6 h-6 rounded-full bg-slate-300 text-black font-black inline-flex items-center justify-center text-xs shadow-sm">2</span>
                                                                ) : idx === 2 ? (
                                                                    <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-bold inline-flex items-center justify-center text-xs shadow-sm">3</span>
                                                                ) : (
                                                                    <span className="text-gray-500 font-mono">{idx + 1}</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 font-bold text-white">
                                                                <div className="flex items-center gap-2">
                                                                    <span>{st.teamName}</span>
                                                                    {isTop2 && (
                                                                        <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/30 uppercase">
                                                                            Lolos Final
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {st.captain && st.captain !== '-' && (
                                                                    <p className="text-[10px] text-gray-500 font-normal">Kapten: {st.captain}</p>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-3">
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-cyan-300">
                                                                    {st.city}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 text-center font-mono">{st.played}</td>
                                                            <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">{st.won}</td>
                                                            <td className="py-3 px-3 text-center font-mono text-red-400">{st.lost}</td>
                                                            <td className="py-3 px-3 text-center font-mono text-gray-300">{st.framesWon} - {st.framesLost}</td>
                                                            <td className="py-3 px-3 text-center font-mono font-bold text-gray-300">
                                                                {st.frameDiff > 0 ? `+${st.frameDiff}` : st.frameDiff}
                                                            </td>
                                                            <td className="py-3 px-4 text-center font-mono font-black text-yellow-400 text-sm">
                                                                {st.points}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'FIXTURES' && (
                                    <div className="space-y-4">
                                        {[...new Set(t.matches.map((m: any) => m.round))].sort((a: any, b: any) => a - b).map((roundNum: any) => {
                                            const roundMatches = t.matches.filter((m: any) => m.round === roundNum);
                                            return (
                                                <div key={roundNum} className="bg-[#0a0a0a] rounded-xl border border-[#222222] p-4">
                                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#1c1c1c]">
                                                        <h4 className="text-xs font-bold uppercase text-yellow-500 flex items-center gap-2">
                                                            <Flag className="w-3.5 h-3.5" /> Putaran {roundNum} (Sesi Pertandingan)
                                                        </h4>
                                                        <span className="text-[10px] text-gray-400 font-mono">{roundMatches.length} Laga Antar Tim</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {roundMatches.map((m: any) => {
                                                            const p1 = t.participants.find((p: any) => p.id === m.player1Id);
                                                            const p2 = t.participants.find((p: any) => p.id === m.player2Id);
                                                            const p1Name = p1 ? (p1.name || p1.member?.name) : 'TBD';
                                                            const p2Name = p2 ? (p2.name || p2.member?.name) : 'TBD';
                                                            const isCompleted = m.status === 'COMPLETED';

                                                            return (
                                                                <div key={m.id} className="bg-[#121212] border border-[#262626] rounded-xl p-3.5 flex flex-col justify-between hover:border-yellow-500/40 transition-all shadow-sm">
                                                                    <div className="space-y-2 mb-3">
                                                                        <div className={`flex justify-between items-center text-xs font-bold px-2.5 py-1.5 rounded-lg ${m.winnerId === m.player1Id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-gray-200 bg-white/5'}`}>
                                                                            <span className="truncate max-w-[150px]">{p1Name}</span>
                                                                            <span className="font-mono text-sm">{m.score1}</span>
                                                                        </div>
                                                                        <div className={`flex justify-between items-center text-xs font-bold px-2.5 py-1.5 rounded-lg ${m.winnerId === m.player2Id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-gray-200 bg-white/5'}`}>
                                                                            <span className="truncate max-w-[150px]">{p2Name}</span>
                                                                            <span className="font-mono text-sm">{m.score2}</span>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => openTeamScoreModal(m, t)}
                                                                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                                            isCompleted
                                                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                                                                : 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-md shadow-yellow-500/10'
                                                                        }`}
                                                                    >
                                                                        <FileSpreadsheet className="w-3.5 h-3.5" />
                                                                        <span>{isCompleted ? 'Edit Lembar Skor (5 Partai)' : 'Input Skor 5 Partai'}</span>
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Standard Individual Bracket Display (Grouped by Round) */}
                        {!isTeamTournament && t.matches && t.matches.length > 0 && (
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
                                                                        <button 
                                                                            onClick={() => openScoreModal(m, p1Name || 'Player 1', p2Name || 'Player 2')} 
                                                                            className="bg-green-500/10 hover:bg-green-500/25 border border-green-500/30 px-2 py-1 text-[10px] rounded font-bold transition-all w-full text-green-400 hover:text-green-300"
                                                                            title="Klik untuk koreksi / edit skor"
                                                                        >
                                                                            <Check className="w-3.5 h-3.5 mx-auto mb-0.5 text-green-400" />
                                                                            <span className="block text-[9px] uppercase tracking-wide">Edit</span>
                                                                        </button>
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
                    );
                })}
            </div>

            {/* ─── CREATE TOURNAMENT MODAL (INDIVIDU / BEREGU) ─── */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                    <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in">
                        <div className="p-5 border-b border-[#222222] bg-[#1a1a1a] flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" /> Buat Turnamen Baru
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Pilih format individu atau kejuaraan beregu antar pool hall</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Mode Switcher Tab */}
                        <div className="flex bg-[#0d0d0d] p-1.5 border-b border-[#222222]">
                            <button
                                type="button"
                                onClick={() => setCreateModeTab('INDIVIDUAL')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    createModeTab === 'INDIVIDUAL'
                                        ? 'bg-yellow-500 text-black shadow-md'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5" /> Turnamen Individu (Single Player)
                            </button>
                            <button
                                type="button"
                                onClick={() => setCreateModeTab('TEAM')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    createModeTab === 'TEAM'
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-md'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Shield className="w-3.5 h-3.5" /> Beregu (Antar Pool Hall)
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto bg-[#0a0a0a]">
                            {createModeTab === 'TEAM' ? (
                                <div className="space-y-4">
                                    <div className="bg-cyan-500/10 border border-cyan-500/30 p-3.5 rounded-xl text-xs text-cyan-300">
                                        <p className="font-bold flex items-center gap-1.5 mb-1">
                                            <Sparkles className="w-4 h-4 text-cyan-400" /> Mode Turnamen Beregu / Antar Rumah Billiard
                                        </p>
                                        <p className="text-[11px] text-cyan-200/80 leading-relaxed">
                                            Format ini dirancang khusus untuk mewakili rumah billiard (Polman, Majene, dll) dengan sistem 5 partai per pertemuan dan kalkulator hadiah otomatis.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Nama Kejuaraan / Turnamen</label>
                                        <input
                                            type="text"
                                            value={teamForm.name}
                                            onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                                            placeholder="e.g. Inter-Club Championship Polman & Majene 2026"
                                            className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-300 mb-1.5">Jumlah Tim (Slot)</label>
                                            <select
                                                value={teamForm.teamCount}
                                                onChange={e => setTeamForm({ ...teamForm, teamCount: parseInt(e.target.value) || 6 })}
                                                className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none font-bold font-mono"
                                            >
                                                <option value={4}>4 Tim</option>
                                                <option value={5}>5 Tim</option>
                                                <option value={6}>6 Tim (Rekomendasi Polman-Majene)</option>
                                                <option value={8}>8 Tim (2 Grup / Double Elim)</option>
                                                <option value={10}>10 Tim</option>
                                                <option value={12}>12 Tim</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-300 mb-1.5">Pemain per Tim</label>
                                            <select
                                                value={teamForm.playersPerTeam}
                                                onChange={e => setTeamForm({ ...teamForm, playersPerTeam: parseInt(e.target.value) || 6 })}
                                                className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none font-bold font-mono"
                                            >
                                                <option value={3}>3 Pemain (Best of 3)</option>
                                                <option value={5}>5 Pemain (5 Single/Double)</option>
                                                <option value={6}>6 Pemain (5 Inti + 1 Cadangan)</option>
                                                <option value={7}>7 Pemain (5 Inti + 2 Cadangan)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-cyan-400 mb-1.5">Biaya Pendaftaran per Tim (Rp)</label>
                                            <input
                                                type="text"
                                                value={teamForm.feePerTeam ? teamForm.feePerTeam.toLocaleString('id-ID') : ''}
                                                onChange={e => setTeamForm({ ...teamForm, feePerTeam: parseInt(e.target.value.replace(/\D/g, '')) || 0 })}
                                                placeholder="1.000.000"
                                                className="w-full bg-[#121212] border border-cyan-500/30 text-cyan-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold focus:border-cyan-400 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-300 mb-1.5">Sistem Bagan</label>
                                            <select
                                                value={teamForm.formatType}
                                                onChange={e => setTeamForm({ ...teamForm, formatType: e.target.value })}
                                                className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                            >
                                                <option value="TEAM_ROUND_ROBIN">Full Round Robin (Liga Semua Ketemu)</option>
                                                <option value="TEAM_DOUBLE">Double Elimination Beregu</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Auto Calculated Financial Breakdown Card */}
                                    <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-2.5">
                                        <div className="flex justify-between items-center pb-2 border-b border-[#222222]">
                                            <span className="text-xs text-gray-400 font-bold uppercase">Total Prize Pool ({teamForm.teamCount} Tim)</span>
                                            <span className="text-sm font-black font-mono text-yellow-400">
                                                Rp {(teamForm.teamCount * teamForm.feePerTeam).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="bg-[#0a0a0a] p-2 rounded-lg border border-[#222222]">
                                                <p className="text-[10px] text-gray-500 font-bold">JUARA 1 (45%)</p>
                                                <p className="font-mono font-bold text-yellow-400">Rp {Math.round(teamForm.teamCount * teamForm.feePerTeam * 0.45).toLocaleString('id-ID')}</p>
                                            </div>
                                            <div className="bg-[#0a0a0a] p-2 rounded-lg border border-[#222222]">
                                                <p className="text-[10px] text-gray-500 font-bold">JUARA 2 (27%)</p>
                                                <p className="font-mono font-bold text-slate-300">Rp {Math.round(teamForm.teamCount * teamForm.feePerTeam * 0.27).toLocaleString('id-ID')}</p>
                                            </div>
                                            <div className="bg-[#0a0a0a] p-2 rounded-lg border border-[#222222]">
                                                <p className="text-[10px] text-gray-500 font-bold">JUARA 3 (14%)</p>
                                                <p className="font-mono font-bold text-amber-500">Rp {Math.round(teamForm.teamCount * teamForm.feePerTeam * 0.14).toLocaleString('id-ID')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Tanggal Mulai (Opsional)</label>
                                        <input
                                            type="date"
                                            value={teamForm.startDate}
                                            onChange={e => setTeamForm({ ...teamForm, startDate: e.target.value })}
                                            className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3.5 py-2 text-xs text-gray-300 focus:border-cyan-400 focus:outline-none font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Regulasi & Format Pertandingan</label>
                                        <textarea
                                            value={teamForm.rules}
                                            onChange={e => setTeamForm({ ...teamForm, rules: e.target.value })}
                                            rows={3}
                                            className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl p-3 text-xs text-gray-300 focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tournament Name</label>
                                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 focus:border-yellow-500 focus:outline-none text-xs text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Start Date (Optional)</label>
                                            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2 focus:border-yellow-500 font-mono text-xs focus:outline-none text-gray-300" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Elimination Format</label>
                                        <div className="flex gap-2 bg-[#121212] p-1 rounded-xl border border-[#262626]">
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

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Entry Fee (Rp)</label>
                                            <input type="text" value={form.entryFee ? form.entryFee.toLocaleString('id-ID') : ''} onChange={e => setForm({ ...form, entryFee: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} placeholder="0" className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 focus:border-yellow-500 font-mono text-xs focus:outline-none text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Max Players</label>
                                            <input type="number" value={form.maxPlayers} onChange={e => setForm({ ...form, maxPlayers: parseInt(e.target.value) || 32 })} className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2.5 focus:border-yellow-500 font-mono text-xs focus:outline-none text-white" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-yellow-500 mb-1.5">Total Prize Pool (Rp)</label>
                                        <input type="text" value={form.prizePool ? form.prizePool.toLocaleString('id-ID') : ''} onChange={e => setForm({ ...form, prizePool: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} placeholder="0" className="w-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-xl px-3.5 py-2.5 focus:border-yellow-500 font-mono text-xs focus:outline-none font-bold" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tournament Rules & Information</label>
                                        <textarea 
                                            value={form.rules} 
                                            onChange={e => setForm({ ...form, rules: e.target.value })} 
                                            placeholder="e.g. Max HC 5, Single Elimination, Lag for break..." 
                                            rows={2} 
                                            className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2 focus:border-yellow-500 text-xs focus:outline-none resize-none text-gray-300"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-400 mb-1">Champion 1st</label>
                                            <input type="text" value={form.prizeChampion ? form.prizeChampion.toLocaleString('id-ID') : ''} onChange={e => setForm({ ...form, prizeChampion: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} placeholder="0" className="w-full bg-[#121212] border border-[#262626] rounded-lg px-2 py-1.5 focus:border-yellow-500 font-mono text-xs focus:outline-none text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-400 mb-1">Runner Up 2nd</label>
                                            <input type="text" value={form.prizeRunnerUp ? form.prizeRunnerUp.toLocaleString('id-ID') : ''} onChange={e => setForm({ ...form, prizeRunnerUp: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} placeholder="0" className="w-full bg-[#121212] border border-[#262626] rounded-lg px-2 py-1.5 focus:border-yellow-500 font-mono text-xs focus:outline-none text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-400 mb-1">Semi-Final 3/4</label>
                                            <input type="text" value={form.prizeSemiFinal ? form.prizeSemiFinal.toLocaleString('id-ID') : ''} onChange={e => setForm({ ...form, prizeSemiFinal: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} placeholder="0" className="w-full bg-[#121212] border border-[#262626] rounded-lg px-2 py-1.5 focus:border-yellow-500 font-mono text-xs focus:outline-none text-white" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-[#222222] flex space-x-3 bg-[#141414]">
                            <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-2.5 bg-[#0a0a0a] rounded-xl font-bold text-xs text-gray-400 border border-[#222222] hover:bg-white/5">Batal</button>
                            <button onClick={createTournament} className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-black transition-all ${createModeTab === 'TEAM' ? 'bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300' : 'bg-yellow-500 hover:bg-yellow-400'}`}>
                                {createModeTab === 'TEAM' ? '🚀 Luncurkan Liga Beregu' : 'Deploy Event'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL PENDAFTARAN TIM (BEREGU) ─── */}
            {isTeamRegisterModalOpen && (
                <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                    <div className="bg-[#141414] border border-cyan-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in">
                        <div className="p-5 border-b border-[#222222] bg-[#1a1a1a] flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Daftarkan Tim / Rumah Billiard</h2>
                                    <p className="text-xs text-gray-400">Input nama pool hall & squad pemain 5–7 orang</p>
                                </div>
                            </div>
                            <button onClick={() => setIsTeamRegisterModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[68vh] overflow-y-auto bg-[#0a0a0a]">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-cyan-300 mb-1">Nama Rumah Billiard / Tim *</label>
                                    <input
                                        type="text"
                                        value={teamRegisterForm.teamName}
                                        onChange={e => setTeamRegisterForm({ ...teamRegisterForm, teamName: e.target.value })}
                                        placeholder="e.g. Ksatria Pool Club"
                                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1">Asal Kota / Daerah</label>
                                    <select
                                        value={teamRegisterForm.city}
                                        onChange={e => setTeamRegisterForm({ ...teamRegisterForm, city: e.target.value })}
                                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none font-bold"
                                    >
                                        <option value="Polewali Mandar">Polewali Mandar (Polman)</option>
                                        <option value="Majene">Majene</option>
                                        <option value="Mamuju">Mamuju</option>
                                        <option value="Pinrang">Pinrang</option>
                                        <option value="Parepare">Parepare</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1">Nama Kapten Tim</label>
                                    <input
                                        type="text"
                                        value={teamRegisterForm.captainName}
                                        onChange={e => setTeamRegisterForm({ ...teamRegisterForm, captainName: e.target.value })}
                                        placeholder="e.g. Bang Arif"
                                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1">No. WhatsApp Kapten</label>
                                    <input
                                        type="text"
                                        value={teamRegisterForm.captainPhone}
                                        onChange={e => setTeamRegisterForm({ ...teamRegisterForm, captainPhone: e.target.value })}
                                        placeholder="e.g. 08123456789"
                                        className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                                    />
                                </div>
                            </div>

                            {/* Squad Roster Inputs */}
                            <div className="pt-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" /> Susunan Squad Pemain (5 Inti + Cadangan)
                                    </span>
                                    <span className="text-[10px] text-gray-500">Min 3 Pemain</span>
                                </div>
                                <div className="space-y-2">
                                    {teamRegisterForm.members.map((mem, idx) => (
                                        <div key={idx} className="flex gap-2 items-center bg-[#121212] p-2 rounded-xl border border-[#222222]">
                                            <span className="text-[10px] font-mono font-bold text-gray-400 w-6 text-center bg-white/5 py-1 rounded">
                                                P{idx + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={mem.name}
                                                onChange={e => {
                                                    const updated = [...teamRegisterForm.members];
                                                    updated[idx].name = e.target.value;
                                                    setTeamRegisterForm({ ...teamRegisterForm, members: updated });
                                                }}
                                                placeholder={`Nama Pemain ${idx + 1} (${mem.role})`}
                                                className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder:text-gray-600"
                                            />
                                            <div className="flex items-center gap-1 bg-[#0a0a0a] px-2 py-1 rounded-lg border border-[#262626]">
                                                <span className="text-[9px] text-gray-500 font-bold">HC:</span>
                                                <input
                                                    type="text"
                                                    value={mem.handicap}
                                                    onChange={e => {
                                                        const updated = [...teamRegisterForm.members];
                                                        updated[idx].handicap = e.target.value;
                                                        setTeamRegisterForm({ ...teamRegisterForm, members: updated });
                                                    }}
                                                    placeholder="4"
                                                    className="w-7 text-center text-xs font-mono font-bold text-yellow-400 bg-transparent focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#222222] flex space-x-3 bg-[#141414]">
                            <button onClick={() => setIsTeamRegisterModalOpen(false)} className="flex-1 py-2.5 bg-[#0a0a0a] rounded-xl font-bold text-xs text-gray-400 border border-[#222222] hover:bg-white/5">Batal</button>
                            <button onClick={submitTeamRegistration} className="flex-1 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-bold text-xs rounded-xl shadow-md">
                                Daftarkan Tim Resmi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL LEMBAR SKOR 5 PARTAI (TEAM MATCH SHEET) ─── */}
            {isTeamScoreModalOpen && teamScoreMatchData && (
                <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                    <div className="bg-[#141414] border border-yellow-500/30 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in">
                        <div className="p-5 border-b border-[#222222] bg-[#1a1a1a] flex justify-between items-center">
                            <div>
                                <h2 className="text-base font-bold text-white flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4 text-yellow-500" /> Lembar Skor Pertandingan Beregu
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Format 5 Partai (3 Single, 1 Double, 1 Decider)</p>
                            </div>
                            <button onClick={() => setIsTeamScoreModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Team Match Header Banner */}
                        <div className="bg-[#0e0e0e] p-4 border-b border-[#222222] flex items-center justify-between">
                            <div className="text-left max-w-[40%]">
                                <p className="text-xs font-bold text-cyan-400 uppercase tracking-wide truncate">{teamScoreMatchData.p1Name}</p>
                                <span className="text-[10px] text-gray-500">Tim Home</span>
                            </div>
                            <div className="flex items-center gap-3 bg-[#161616] px-5 py-2 rounded-xl border border-[#2a2a2a]">
                                <span className="text-2xl font-black font-mono text-cyan-400">{teamScoreMatchData.teamScore1}</span>
                                <span className="text-xs font-bold text-gray-600">VS</span>
                                <span className="text-2xl font-black font-mono text-yellow-400">{teamScoreMatchData.teamScore2}</span>
                            </div>
                            <div className="text-right max-w-[40%]">
                                <p className="text-xs font-bold text-yellow-400 uppercase tracking-wide truncate">{teamScoreMatchData.p2Name}</p>
                                <span className="text-[10px] text-gray-500">Tim Away</span>
                            </div>
                        </div>

                        {/* 5 Parties Scoring Rows */}
                        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto bg-[#0a0a0a]">
                            {teamScoreMatchData.parties.map((party: any, pIdx: number) => {
                                const p1Won = party.s1 > party.s2 && party.s1 > 0;
                                const p2Won = party.s2 > party.s1 && party.s2 > 0;

                                return (
                                    <div key={pIdx} className="bg-[#121212] border border-[#222222] rounded-xl p-3 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-gray-300 flex items-center gap-1.5">
                                                <span className="w-5 h-5 rounded-full bg-white/10 inline-flex items-center justify-center text-[10px] font-mono font-bold text-yellow-400">
                                                    {pIdx + 1}
                                                </span>
                                                {party.partyName}
                                            </span>
                                            <span className="text-[11px] text-gray-400 bg-white/5 px-2 py-0.5 rounded font-mono">
                                                {party.gameType}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-12 gap-2 items-center">
                                            <div className="col-span-4 text-xs font-medium text-gray-300 truncate">
                                                {party.p1}
                                            </div>
                                            <div className="col-span-4 flex items-center justify-center gap-2">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={7}
                                                    value={party.s1}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        const updated = [...teamScoreMatchData.parties];
                                                        updated[pIdx].s1 = val;
                                                        
                                                        // Recount total won parties
                                                        let sc1 = 0;
                                                        let sc2 = 0;
                                                        updated.forEach(p => {
                                                            if (p.s1 > p.s2) sc1++;
                                                            else if (p.s2 > p.s1) sc2++;
                                                        });

                                                        setTeamScoreMatchData({
                                                            ...teamScoreMatchData,
                                                            parties: updated,
                                                            teamScore1: sc1,
                                                            teamScore2: sc2
                                                        });
                                                    }}
                                                    className={`w-11 py-1.5 text-center font-mono font-black text-sm rounded-lg border focus:outline-none ${
                                                        p1Won ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-[#0a0a0a] border-[#333333] text-white'
                                                    }`}
                                                />
                                                <span className="text-gray-600 font-bold">:</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={7}
                                                    value={party.s2}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        const updated = [...teamScoreMatchData.parties];
                                                        updated[pIdx].s2 = val;

                                                        let sc1 = 0;
                                                        let sc2 = 0;
                                                        updated.forEach(p => {
                                                            if (p.s1 > p.s2) sc1++;
                                                            else if (p.s2 > p.s1) sc2++;
                                                        });

                                                        setTeamScoreMatchData({
                                                            ...teamScoreMatchData,
                                                            parties: updated,
                                                            teamScore1: sc1,
                                                            teamScore2: sc2
                                                        });
                                                    }}
                                                    className={`w-11 py-1.5 text-center font-mono font-black text-sm rounded-lg border focus:outline-none ${
                                                        p2Won ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' : 'bg-[#0a0a0a] border-[#333333] text-white'
                                                    }`}
                                                />
                                            </div>
                                            <div className="col-span-4 text-xs font-medium text-gray-300 text-right truncate">
                                                {party.p2}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t border-[#222222] flex space-x-3 bg-[#141414]">
                            <button onClick={() => setIsTeamScoreModalOpen(false)} className="flex-1 py-2.5 bg-[#0a0a0a] rounded-xl font-bold text-xs text-gray-400 border border-[#222222] hover:bg-white/5">Batal</button>
                            <button
                                onClick={submitTeamMatchScore}
                                disabled={teamScoreMatchData.teamScore1 === teamScoreMatchData.teamScore2}
                                className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:hover:bg-yellow-500 text-black font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                            >
                                <Check className="w-4 h-4" />
                                <span>Simpan Hasil Pertandingan</span>
                            </button>
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

            {flyerTournament && (
                <FlyerBuilder 
                    tournament={flyerTournament} 
                    onClose={() => setFlyerTournament(null)} 
                />
            )}


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
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const currentTournament = tournaments.find(t => t.id === manageTournamentId);
                                        if (currentTournament) handleOpenWaModal(currentTournament);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors"
                                    title="Buka Format WhatsApp"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Salin List WA</span>
                                </button>
                                <button onClick={() => { setIsManageParticipantsOpen(false); setManageTournamentId(null); }} className="text-gray-500 hover:text-white transition-colors ml-2">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto bg-[#0a0a0a]">
                            {(() => {
                                const currentTournament = tournaments.find(t => t.id === manageTournamentId);
                                const rawParticipants = currentTournament?.participants || [];
                                const sortedParticipants = [...rawParticipants].sort((a: any, b: any) => {
                                    const nameA = (a.name || a.member?.name || '').trim().toUpperCase();
                                    const nameB = (b.name || b.member?.name || '').trim().toUpperCase();
                                    return nameA.localeCompare(nameB, 'id-ID', { sensitivity: 'base' });
                                });
                                const maxSlots = currentTournament?.maxPlayers || 32;
                                const totalSlots = Math.max(maxSlots, sortedParticipants.length);
                                const slotRows = Array.from({ length: totalSlots }, (_, i) => ({
                                    slotNumber: i + 1,
                                    participant: sortedParticipants[i] || null
                                }));

                                return (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-[#222222]">
                                                <th className="pb-3 pl-3 w-12 text-center">#</th>
                                                <th className="pb-3 pl-2">Participant</th>
                                                <th className="pb-3">HC</th>
                                                <th className="pb-3">Payment Ref (Invoice)</th>
                                                <th className="pb-3">Status</th>
                                                <th className="pb-3 text-right pr-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#1a1a1a]">
                                            {slotRows.map(({ slotNumber, participant: p }) => {
                                                if (p) {
                                                    return (
                                                        <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                                            <td className="py-3 pl-3 text-center">
                                                                <span className="font-mono font-bold text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
                                                                    {slotNumber}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 pl-2">
                                                                <p className="font-bold text-sm text-white uppercase">{(p.name || p.member?.name || 'Unknown').toUpperCase()}</p>
                                                                {p.member && <p className="text-[10px] text-gray-500 font-mono">{p.member.phone}</p>}
                                                            </td>
                                                            <td className="py-3">
                                                                <span className="bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                                                                    {p.handicap || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3">
                                                                <p className="text-xs text-gray-400 font-mono italic">
                                                                    {p.paymentNotes || '---'}
                                                                </p>
                                                            </td>
                                                            <td className="py-3">
                                                                <button 
                                                                    onClick={() => handleUpdateParticipantStatus(p.id, p.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID')}
                                                                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${p.paymentStatus === 'PAID' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}
                                                                >
                                                                    {p.paymentStatus || 'UNPAID'}
                                                                </button>
                                                            </td>
                                                            <td className="py-3 text-right pr-3 space-x-2">
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
                                                    );
                                                }

                                                return (
                                                    <tr key={`empty-${slotNumber}`} className="opacity-40 hover:opacity-75 transition-opacity">
                                                        <td className="py-2.5 pl-3 text-center">
                                                            <span className="font-mono text-xs text-gray-500">
                                                                {slotNumber}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 pl-2">
                                                            <p className="text-xs text-gray-500 italic uppercase tracking-wider">Slot Kosong</p>
                                                        </td>
                                                        <td className="py-2.5">
                                                            <span className="text-gray-600 text-xs font-mono">-</span>
                                                        </td>
                                                        <td className="py-2.5">
                                                            <span className="text-gray-600 text-xs font-mono">---</span>
                                                        </td>
                                                        <td className="py-2.5">
                                                            <span className="text-[10px] text-gray-600 font-mono uppercase bg-white/5 px-2 py-0.5 rounded">
                                                                EMPTY
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 text-right pr-3">
                                                            {currentTournament?.status === 'PENDING' ? (
                                                                <button 
                                                                    onClick={() => {
                                                                        setIsManageParticipantsOpen(false);
                                                                        openRegisterModal(currentTournament.id);
                                                                    }}
                                                                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded transition-colors"
                                                                >
                                                                    + Isi Slot
                                                                </button>
                                                            ) : (
                                                                <span className="text-gray-700 text-xs">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                );
                            })()}
                        </div>
                        <div className="p-4 border-t border-[#222222] flex justify-between items-center bg-[#141414]">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                        const currentTournament = tournaments.find(t => t.id === manageTournamentId);
                                        if (currentTournament) handleCopyWhatsAppDirect(currentTournament);
                                    }}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-lg font-bold text-xs transition-colors"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Salin Data WA (Langsung)</span>
                                </button>
                                <button 
                                    onClick={() => {
                                        const currentTournament = tournaments.find(t => t.id === manageTournamentId);
                                        if (currentTournament) handleOpenWaModal(currentTournament);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg font-bold text-xs transition-colors"
                                >
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span>Preview / Edit Teks</span>
                                </button>
                            </div>
                            <button onClick={() => { setIsManageParticipantsOpen(false); setManageTournamentId(null); }} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-sm transition-colors uppercase tracking-widest">Close</button>
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
            {/* Record Score Modal */}
            {isScoreModalOpen && scoreMatchData && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-sm overflow-hidden border-[#00aaff]/30">
                        <div className="p-6 border-b border-[#222222]">
                            <h2 className="text-xl font-bold flex items-center text-[#00aaff]">Record Score</h2>
                            <p className="text-xs text-gray-400 mt-2">Enter final match score points.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-bold truncate w-32">{scoreMatchData.p1Name}</span>
                                <input
                                    type="number"
                                    value={scoreMatchData.score1}
                                    onChange={(e) => setScoreMatchData({ ...scoreMatchData, score1: parseInt(e.target.value) || 0 })}
                                    className="w-16 bg-[#0a0a0a] border border-[#222222] rounded text-center py-2 focus:outline-none focus:border-[#00aaff] font-mono font-bold"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold truncate w-32">{scoreMatchData.p2Name}</span>
                                <input
                                    type="number"
                                    value={scoreMatchData.score2}
                                    onChange={(e) => setScoreMatchData({ ...scoreMatchData, score2: parseInt(e.target.value) || 0 })}
                                    className="w-16 bg-[#0a0a0a] border border-[#222222] rounded text-center py-2 focus:outline-none focus:border-[#00aaff] font-mono font-bold"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#222222] flex space-x-3">
                            <button onClick={() => setIsScoreModalOpen(false)} className="flex-1 py-2 bg-[#0a0a0a] rounded-lg font-bold text-white border border-[#222222] hover:bg-white/5">Cancel</button>
                            <button onClick={submitMatchScore} className="flex-1 py-2 bg-[#00aaff] rounded-lg text-black font-bold hover:bg-[#0088cc] shadow-[0_0_15px_rgba(0,170,255,0.3)]">Save Result</button>
                        </div>
                    </div>
                </div>
            )}
            {activeLiveDraw && (
                <LiveDrawDisplay 
                    tournament={activeLiveDraw} 
                    onClose={() => setActiveLiveDraw(null)} 
                />
            )}

            {/* ─── WHATSAPP PARTICIPANT LIST PREVIEW & COPY MODAL ─── */}
            {waModalTournament && (
                <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#141414] border border-emerald-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-[#222222] bg-[#1a1a1a] flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        Salin Data WhatsApp Peserta
                                    </h2>
                                    <p className="text-xs text-gray-400">
                                        {waModalTournament.name} • {waModalTournament.participants?.length || 0} Peserta
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setWaModalTournament(null)} 
                                className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4 bg-[#0d0d0d]">
                            {/* Summary Badge */}
                            <div className="flex items-center justify-between bg-[#141414] border border-[#222222] px-4 py-2.5 rounded-xl text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {(waModalTournament.participants || []).filter((p: any) => p.paymentStatus === 'PAID').length} Lunas
                                    </span>
                                    <span className="text-gray-500">•</span>
                                    <span className="text-yellow-500 font-bold">
                                        {(waModalTournament.participants || []).filter((p: any) => p.paymentStatus !== 'PAID').length} Pending
                                    </span>
                                </div>
                                <span className="text-gray-400 font-mono">
                                    Total: {waModalTournament.participants?.length || 0} / {waModalTournament.maxPlayers || 32} Slot
                                </span>
                            </div>

                            {/* Textarea Preview */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Preview Teks WhatsApp (Bisa diedit langsung):
                                    </label>
                                    <span className="text-[10px] text-gray-500">Siap di-paste ke Group WA</span>
                                </div>
                                <textarea
                                    value={waTextContent}
                                    onChange={(e) => setWaTextContent(e.target.value)}
                                    rows={12}
                                    className="w-full bg-[#080808] border border-[#262626] rounded-xl p-3.5 text-xs font-mono text-gray-200 focus:outline-none focus:border-emerald-500/50 leading-relaxed resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-[#222222] flex flex-col sm:flex-row gap-2.5 bg-[#141414]">
                            <button
                                onClick={async () => {
                                    const success = await copyToClipboard(waTextContent);
                                    if (success) {
                                        setCopiedWa(true);
                                        setCopyToast(`List peserta "${waModalTournament.name}" berhasil disalin!`);
                                        setTimeout(() => setCopiedWa(false), 3000);
                                        setTimeout(() => setCopyToast(null), 3500);
                                    }
                                }}
                                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                    copiedWa 
                                        ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                                        : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                                }`}
                            >
                                {copiedWa ? (
                                    <>
                                        <CheckCheck className="w-4 h-4" />
                                        <span>Tersalin ke Clipboard!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        <span>Salin Teks ke Clipboard</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => handleShareWhatsAppWeb(waTextContent)}
                                className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                                title="Buka di WhatsApp Web / App"
                            >
                                <Share2 className="w-4 h-4" />
                                <span>Buka WhatsApp</span>
                                <ExternalLink className="w-3 h-3 text-emerald-500/60" />
                            </button>
                            <button
                                onClick={() => setWaModalTournament(null)}
                                className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold text-xs transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── FLOATING COPY TOAST NOTIFICATION ─── */}
            {copyToast && (
                <div className="fixed bottom-6 right-6 z-[100] bg-emerald-500 text-black font-bold text-sm px-5 py-3 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.4)] flex items-center gap-2.5 border border-emerald-300 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-black" />
                    <span>{copyToast}</span>
                </div>
            )}
        </div>
    );
}
