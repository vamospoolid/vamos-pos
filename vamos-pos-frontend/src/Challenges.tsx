import { useState, useEffect, useCallback } from 'react';
import { Swords, Search, Trophy, Loader2, User, Skull, Plus, Flame, X, CheckCircle2 } from 'lucide-react';
import { api } from './api';
import { vamosAlert } from './utils/dialog';
import { io } from 'socket.io-client';

interface Player {
    id: string;
    name: string;
}

interface Challenge {
    id: string;
    isFightForTable: boolean;
    challengerId: string;
    opponentId: string;
    winnerId: string;
    pointsStake: number;
    status: 'PENDING' | 'ACCEPTED' | 'WAITING_VERIFICATION' | 'COMPLETED' | 'DECLINED';
    note?: string;
    challenger: Player;
    opponent: Player;
    session?: {
        table: {
            name: string;
        }
    }
}

export default function Challenges() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Verification Modal
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
    const [score1, setScore1] = useState(0);
    const [score2, setScore2] = useState(0);

    // Create Match Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [members, setMembers] = useState<Player[]>([]);
    const [challengerId, setChallengerId] = useState('');
    const [opponentId, setOpponentId] = useState('');
    const [pointsStake, setPointsStake] = useState(0);
    const [isFightForTable, setIsFightForTable] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const fetchChallenges = useCallback(async () => {
        try {
            const res = await api.get('/player/challenges/pending-verification');
            setChallenges(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await api.get('/members');
            setMembers(res.data.data);
        } catch (err) {
            console.error('Failed to fetch members:', err);
        }
    };

    useEffect(() => {
        fetchChallenges();
        const interval = setInterval(fetchChallenges, 5000);

        const socket = io('http://localhost:3000');
        socket.on('challenge:new_arena', () => {
            fetchChallenges();
        });

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [fetchChallenges]);

    const handleCreateMatch = async () => {
        if (!challengerId || !opponentId) {
            vamosAlert('Please select both players');
            return;
        }
        if (challengerId === opponentId) {
            vamosAlert('Players must be different');
            return;
        }

        setIsCreating(true);
        try {
            await api.post('/player/challenges/admin-create', {
                challengerId,
                opponentId,
                pointsStake,
                isFightForTable,
                note: adminNote || 'Admin Generated Match'
            });
            vamosAlert('Match created successfully! Both players have been notified.');
            setIsCreateModalOpen(false);
            setChallengerId('');
            setOpponentId('');
            setPointsStake(0);
            setIsFightForTable(false);
            setAdminNote('');
            fetchChallenges();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to create match');
        } finally {
            setIsCreating(false);
        }
    };

    const handleComplete = async (action: 'APPROVE' | 'REJECT' = 'APPROVE') => {
        if (!selectedChallenge) return;
        if (action === 'APPROVE' && !selectedWinnerId) {
            vamosAlert('Please select a winner first.');
            return;
        }

        try {
            await api.put(`/player/challenge/${selectedChallenge.id}/complete`, { 
                action,
                winnerId: selectedWinnerId,
                score1,
                score2
            });
            vamosAlert(action === 'APPROVE' ? 'Match verified! XP has been awarded.' : 'Verification rejected.');
            setIsCompleteModalOpen(false);
            setSelectedChallenge(null);
            setSelectedWinnerId(null);
            fetchChallenges();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            vamosAlert(error.response?.data?.message || 'Failed to process verification');
        }
    };

    const filteredChallenges = challenges.filter(c =>
        c.challenger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.opponent.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && challenges.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 fade-in p-6">
            <div className="flex justify-between items-center bg-[#111] p-6 rounded-3xl border border-[#222]">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                            <Flame className="text-orange-500 w-8 h-8" />
                            Elite Arena Challenge
                        </h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Admin Controlled Matchmaking & XP Rewards</p>
                    </div>
                    <button
                        onClick={() => {
                            fetchMembers();
                            setIsCreateModalOpen(true);
                        }}
                        className="bg-[#00ff66] text-[#0a0a0a] px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center hover:bg-[#00e65c] shadow-[0_0_15px_rgba(0,255,102,0.2)] transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Initiate Fight
                    </button>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search live duel..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-[#0a0a0a] border border-[#222] rounded-xl px-10 py-3 text-sm focus:outline-none focus:border-yellow-500 w-64 text-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredChallenges.length > 0 ? filteredChallenges.map(c => (
                    <div key={c.id} className="bg-[#141414] border border-[#222] rounded-[32px] p-1 overflow-hidden group hover:border-orange-500/50 transition-all">
                        <div className="bg-[#0a0a0a] rounded-[28px] p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex gap-2">
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${
                                        c.isFightForTable ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    }`}>
                                        {c.isFightForTable ? 'Fight for Table' : 'Ranked Duel'}
                                    </span>
                                    {c.status === 'PENDING' && <span className="bg-slate-500/10 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full border border-slate-500/20 uppercase tracking-widest">Awaiting Player</span>}
                                    {c.status === 'ACCEPTED' && <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest animate-pulse">In Progress</span>}
                                    {c.status === 'WAITING_VERIFICATION' && <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-3 py-1 rounded-full border border-amber-500/20 uppercase tracking-widest">Verification Required</span>}
                                </div>
                                <span className="text-gray-500 font-mono text-[10px]">#{c.id.substring(0, 8)}</span>
                            </div>

                            <div className="flex items-center justify-between gap-4 mb-8">
                                <div className="flex-1 text-center">
                                    <div className="relative mx-auto mb-3">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                                            <User className="w-8 h-8 text-white/20" />
                                        </div>
                                        {c.winnerId === c.challengerId && c.status === 'WAITING_VERIFICATION' && (
                                            <div className="absolute -top-2 -right-2 bg-yellow-500 p-1.5 rounded-lg shadow-lg">
                                                <Trophy className="w-4 h-4 text-black" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-white font-bold text-sm truncate">{c.challenger.name}</p>
                                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-tighter">Player 1</p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="bg-orange-500/10 px-3 py-1 rounded-lg mb-2">
                                        <p className="text-orange-500 font-black text-xs font-mono">VS</p>
                                    </div>
                                    <div className="h-px w-8 bg-[#222] relative">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500">
                                            <Swords className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 text-center">
                                    <div className="relative mx-auto mb-3">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                                            <User className="w-8 h-8 text-white/20" />
                                        </div>
                                        {c.winnerId === c.opponentId && c.status === 'WAITING_VERIFICATION' && (
                                            <div className="absolute -top-2 -right-2 bg-yellow-500 p-1.5 rounded-lg shadow-lg">
                                                <Trophy className="w-4 h-4 text-black" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-white font-bold text-sm truncate">{c.opponent.name}</p>
                                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-tighter">Player 2</p>
                                </div>
                            </div>

                                {c.note && (
                                    <div className="mb-4 bg-white/5 border border-white/5 rounded-2xl p-4 text-left">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">Match Notes</p>
                                        <p className="text-xs font-bold text-gray-300 italic">"{c.note}"</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between bg-black/40 p-3 rounded-2xl border border-white/5 mb-4">
                                     <div className="flex items-center gap-2">
                                        <Flame size={14} className="text-orange-500" />
                                        <span className="text-[10px] font-black text-white uppercase italic">STAKE: {c.pointsStake || 0} PTS</span>
                                    </div>
                                    {c.isFightForTable && (
                                         <div className="flex items-center gap-2">
                                            <Trophy size={14} className="text-orange-500" />
                                            <span className="text-[10px] font-black text-orange-500 uppercase italic">FIGHT FOR TABLE</span>
                                        </div>
                                    )}
                                </div>

                                {c.session?.table?.name && (
                                    <div className="mb-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-left flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic">Active Table</p>
                                            <p className="text-sm font-black text-white">{c.session.table.name}</p>
                                        </div>
                                        <div className="bg-emerald-500/20 p-2 rounded-xl">
                                            <Trophy className="w-4 h-4 text-emerald-500" />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        setSelectedChallenge(c);
                                        setSelectedWinnerId(c.winnerId || null);
                                        setScore1((c as any).score1 || 0);
                                        setScore2((c as any).score2 || 0);
                                        setIsCompleteModalOpen(true);
                                    }}
                                    className={`w-full border py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
                                        c.status === 'WAITING_VERIFICATION' 
                                            ? 'bg-orange-500 border-orange-500 text-black shadow-lg shadow-orange-500/20 hover:scale-[1.02]' 
                                            : c.status === 'ACCEPTED'
                                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/20 hover:scale-[1.02]'
                                            : 'bg-[#111] border-[#222] text-gray-600 hover:bg-white/5'
                                    }`}
                                >
                                    {c.status === 'WAITING_VERIFICATION' ? 'VERIFY RESULTS' : c.status === 'ACCEPTED' ? 'FORCE FINALIZE' : 'VIEW FIGHT'}
                                </button>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 bg-[#111] rounded-[32px] border border-dashed border-[#222] flex flex-col items-center justify-center">
                        <Skull className="w-12 h-12 text-gray-700 mb-4" />
                        <p className="text-gray-500 font-bold uppercase tracking-widest">No active arena fights detected</p>
                    </div>
                )}
            </div>

            {/* Initiate Match Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-white/10 rounded-[40px] w-full max-w-lg overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                        <div className="p-8 border-b border-[#222] flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-white italic uppercase">Arena Matchmaking</h2>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Initiate professional duel</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-2">Player 1 (Challenger)</label>
                                    <select 
                                        value={challengerId}
                                        onChange={e => setChallengerId(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#222] rounded-2xl px-4 py-4 text-white focus:border-orange-500 transition-all outline-none"
                                    >
                                        <option value="">Select Player</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-2">Player 2 (Opponent)</label>
                                    <select 
                                        value={opponentId}
                                        onChange={e => setOpponentId(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#222] rounded-2xl px-4 py-4 text-white focus:border-orange-500 transition-all outline-none"
                                    >
                                        <option value="">Select Player</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-2">Point Staking</label>
                                    <select 
                                        value={pointsStake}
                                        onChange={e => setPointsStake(Number(e.target.value))}
                                        className="w-full bg-[#0a0a0a] border border-[#222] rounded-2xl px-4 py-4 text-white focus:border-orange-500 transition-all outline-none"
                                    >
                                        <option value="0">Friendly (0 Pts)</option>
                                        <option value="20">Casual (20 Pts)</option>
                                        <option value="50">Serious (50 Pts)</option>
                                        <option value="100">Pro (100 Pts)</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-2">Match Type</label>
                                    <button 
                                        type="button"
                                        onClick={() => setIsFightForTable(!isFightForTable)}
                                        className={`w-full py-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${isFightForTable ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-[#0a0a0a] border-[#222] text-gray-500'}`}
                                    >
                                        {isFightForTable ? '🔥 FIGHT FOR TABLE' : 'STANDARD DUEL'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-2">Rules / Notes</label>
                                <textarea 
                                    value={adminNote}
                                    onChange={e => setAdminNote(e.target.value)}
                                    placeholder="e.g. Standard 8-ball, 10-rack race..."
                                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-2xl px-4 py-4 text-white focus:border-orange-500 transition-all outline-none h-20"
                                />
                            </div>

                            <div className="bg-orange-500/5 border border-orange-500/20 p-6 rounded-3xl flex items-center gap-4">
                                <div className="p-3 bg-orange-500/20 rounded-2xl">
                                    <Flame className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Background XP Protocol Active</p>
                                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest leading-relaxed">Winner will receive +100 XP, Loser will receive +20 XP. No billing changes unless manually linked.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-[#0a0a0a]">
                            <button
                                onClick={handleCreateMatch}
                                disabled={isCreating}
                                className="w-full py-5 bg-orange-500 text-black font-black rounded-3xl text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
                            >
                                {isCreating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Flame className="w-5 h-5 mr-2" />}
                                Deploy Match to Arena
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Finalization Modal */}
            {isCompleteModalOpen && selectedChallenge && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-orange-500/30 rounded-[40px] w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.15)]">
                        <div className="p-8 border-b border-[#222] text-center relative">
                            <button 
                                onClick={() => setIsCompleteModalOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-20 h-20 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
                                <Trophy className="w-10 h-10 text-orange-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white italic uppercase mb-2">
                                Terminate Duel
                            </h2>
                            <p className="text-gray-400 text-xs uppercase tracking-widest font-black">
                                Status: <span className="text-orange-500">{selectedChallenge.status}</span>
                            </p>
                        </div>

                        <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                             <div className="bg-orange-500/5 border border-orange-500/10 p-5 rounded-[32px] space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                    <p className="text-[10px] uppercase font-black text-white ml-2 tracking-widest">Final Match Score</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                        <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{selectedChallenge.challenger.name}</p>
                                        <input 
                                            type="number" 
                                            value={score1}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                setScore1(val);
                                                if (val > score2) setSelectedWinnerId(selectedChallenge.challengerId);
                                                else if (score2 > val) setSelectedWinnerId(selectedChallenge.opponentId);
                                            }}
                                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2 text-white font-black text-center focus:border-orange-500 outline-none"
                                        />
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                        <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{selectedChallenge.opponent.name}</p>
                                        <input 
                                            type="number" 
                                            value={score2}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                setScore2(val);
                                                if (score1 > val) setSelectedWinnerId(selectedChallenge.challengerId);
                                                else if (val > score1) setSelectedWinnerId(selectedChallenge.opponentId);
                                            }}
                                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2 text-white font-black text-center focus:border-orange-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
 
                            <div className="space-y-3">
                                <p className="text-[10px] uppercase font-black text-gray-500 ml-2">Select Victor:</p>
                                <div className="grid grid-cols-1 gap-2">
                                    <button 
                                        onClick={() => setSelectedWinnerId(selectedChallenge.challengerId)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                            selectedWinnerId === selectedChallenge.challengerId 
                                            ? 'bg-orange-500/20 border-orange-500 text-white' 
                                            : 'bg-white/5 border-transparent text-gray-400'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <User className={`w-5 h-5 ${selectedWinnerId === selectedChallenge.challengerId ? 'text-orange-500' : 'text-gray-600'}`} />
                                            <span className="font-bold">{selectedChallenge.challenger.name}</span>
                                        </div>
                                        {selectedWinnerId === selectedChallenge.challengerId && <CheckCircle2 className="w-5 h-5 text-orange-500" />}
                                    </button>
                                    <button 
                                        onClick={() => setSelectedWinnerId(selectedChallenge.opponentId)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                            selectedWinnerId === selectedChallenge.opponentId 
                                            ? 'bg-orange-500/20 border-orange-500 text-white' 
                                            : 'bg-white/5 border-transparent text-gray-400'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <User className={`w-5 h-5 ${selectedWinnerId === selectedChallenge.opponentId ? 'text-orange-500' : 'text-gray-600'}`} />
                                            <span className="font-bold">{selectedChallenge.opponent.name}</span>
                                        </div>
                                        {selectedWinnerId === selectedChallenge.opponentId && <CheckCircle2 className="w-5 h-5 text-orange-500" />}
                                    </button>
                                </div>
                            </div>

                            {selectedChallenge.status === 'WAITING_VERIFICATION' && selectedChallenge.winnerId && (
                                <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest text-center animate-pulse">
                                    Player claimed winner: {selectedChallenge.winnerId === selectedChallenge.challengerId ? selectedChallenge.challenger.name : selectedChallenge.opponent.name}
                                </p>
                            )}

                            {selectedChallenge.isFightForTable && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">⚠️ Billing Transfer</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Completion will transfer the active bill {selectedChallenge.session?.table?.name ? `(${selectedChallenge.session.table.name})` : ''} to the loser.
                                    </p>
                                </div>
                            )}

                            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                                <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">⭐ Reward Protocol</p>
                                <p className="text-xs text-gray-300 mt-1">Winner: <span className="text-white font-bold">+100 XP</span> | Loser: <span className="text-white font-bold">+20 XP</span></p>
                            </div>
                        </div>

                        <div className="p-8 bg-[#0a0a0a] flex flex-col gap-3">
                            <button
                                onClick={() => handleComplete('APPROVE')}
                                className="w-full py-4 bg-orange-500 text-black font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-[1.02] transition-all"
                            >
                                {selectedChallenge.status === 'ACCEPTED' ? 'FORCE AUTHORIZE' : 'AUTHORIZE PROTOCOL'}
                            </button>
                            {selectedChallenge.status === 'WAITING_VERIFICATION' && (
                                <button
                                    onClick={() => handleComplete('REJECT')}
                                    className="w-full py-4 bg-transparent border border-[#333] text-gray-500 font-bold rounded-2xl text-xs uppercase tracking-widest hover:text-white hover:border-[#444] transition-all"
                                >
                                    REFUTE CLAIM
                                </button>
                            )}
                            <button
                                onClick={() => setIsCompleteModalOpen(false)}
                                className="w-full py-2 text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:text-gray-400 mt-2"
                            >
                                ABORT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
