import { useState, useEffect } from 'react';
import { Trophy, Users, GitMerge, Loader2, Check, ChevronDown, ChevronUp, Calendar, Trash2 } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';

export default function Competitions() {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', entryFee: 0, prizePool: 0, maxPlayers: 32, prizeChampion: 0, prizeRunnerUp: 0, prizeSemiFinal: 0, startDate: '' });
    const [expandedBrackets, setExpandedBrackets] = useState<Record<string, boolean>>({});

    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [registerTournamentId, setRegisterTournamentId] = useState<string | null>(null);
    const [registerType, setRegisterType] = useState<'member' | 'guest'>('member');
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');
    const [guestName, setGuestName] = useState('');
    const [handicap, setHandicap] = useState('');

    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    const [finishTournamentId, setFinishTournamentId] = useState<string | null>(null);
    const [finishData, setFinishData] = useState({ champion: '', runnerUp: '' });

    const [isPlayerlotModalOpen, setIsPlayerLotModalOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState<{ matchId: string, tournamentId: string, slot: 1 | 2 } | null>(null);
    const [selectedSlotPlayerId, setSelectedSlotPlayerId] = useState<string>('');

    const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
    const [scoreMatchData, setScoreMatchData] = useState<{ matchId: string, player1Id: string, player2Id: string, p1Name: string, p2Name: string, score1: number, score2: number } | null>(null);

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
        const inter = setInterval(fetchData, 30000);
        return () => clearInterval(inter);
    }, []);

    const createTournament = async () => {
        try {
            await api.post('/tournaments', form);
            setIsCreateModalOpen(false);
            setForm({ name: '', description: '', entryFee: 0, prizePool: 0, maxPlayers: 32, prizeChampion: 0, prizeRunnerUp: 0, prizeSemiFinal: 0, startDate: '' });
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
                name: registerType === 'guest' ? guestName : undefined,
                handicap: handicap || undefined
            });
            setIsRegisterModalOpen(false);
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Registration failed');
        }
    };

    const generateBracket = async (tournamentId: string) => {
        if (!(await vamosConfirm('Are you sure you want to lock registrations and generate the bracket?'))) return;
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
                                        {t.participants.length >= 2 && (
                                            <button onClick={() => generateBracket(t.id)} className="flex-1 px-2 py-1 bg-[#00ff66] hover:bg-[#00e65c] text-[#0a0a0a] text-xs font-bold rounded transition-colors">Start Event</button>
                                        )}
                                    </div>
                                )}
                                {t.status === 'ONGOING' && (
                                    <button onClick={() => { setFinishTournamentId(t.id); setIsFinishModalOpen(true); }} className="w-full px-2 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded transition-colors flex items-center justify-center">
                                        <Trophy className="w-3 h-3 mr-1" /> Conclude Event
                                    </button>
                                )}
                                {t.status === 'COMPLETED' && (
                                    <span className="text-xs text-green-500 font-bold tracking-widest uppercase"><Check className="w-3 h-3 inline mr-1" /> Event Finished</span>
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
                                    <div className="flex overflow-x-auto space-x-8 pb-4">
                                        {[...new Set(t.matches.map((m: any) => m.round))].sort().map((roundNum: any) => {
                                            const roundMatches = t.matches.filter((m: any) => m.round === roundNum).sort((a: any, b: any) => a.matchNumber - b.matchNumber);
                                            return (
                                                <div key={roundNum} className="flex flex-col justify-around min-w-[280px] space-y-4 relative">
                                                    <h4 className="text-center text-xs text-gray-500 font-bold uppercase mb-2">Round {roundNum}</h4>
                                                    {roundMatches.map((m: any) => {
                                                        const p1 = t.participants.find((p: any) => p.id === m.player1Id);
                                                        const p2 = t.participants.find((p: any) => p.id === m.player2Id);
                                                        const p1Name = p1 ? (p1.member?.name || p1.name) : undefined;
                                                        const p2Name = p2 ? (p2.member?.name || p2.name) : undefined;

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
                                                        )
                                                    })}
                                                </div>
                                            );
                                        })}
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
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">Select Member</label>
                                    <select
                                        value={selectedMemberId}
                                        onChange={(e) => setSelectedMemberId(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500 transition-colors"
                                    >
                                        <option value="">-- Choose Member --</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                                        ))}
                                    </select>
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
                                        <option key={p.id} value={p.id}>{p.member?.name || p.name} {p.handicap ? `(HC: ${p.handicap})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">2nd Place (Runner Up)</label>
                                <select value={finishData.runnerUp} onChange={e => setFinishData({ ...finishData, runnerUp: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none flex focus:border-yellow-500">
                                    <option value="">-- Select Runner Up (Optional) --</option>
                                    {tournaments.find(t => t.id === finishTournamentId)?.participants.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.member?.name || p.name} {p.handicap ? `(HC: ${p.handicap})` : ''}</option>
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
                                            <option key={p.id} value={p.id}>{p.member?.name || p.name} {p.handicap ? `(HC: ${p.handicap})` : ''}</option>
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
        </div>
    );
}
