import { useState, useEffect } from 'react';
import { Swords, Search, Trophy, Loader2, CheckCircle2, User, Skull } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';

export default function Challenges() {
    const [challenges, setChallenges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
    const [winnerId, setWinnerId] = useState('');

    const fetchChallenges = async () => {
        try {
            // Get all pending/accepted challenges
            const res = await api.get('/player/challenges');
            // Filter to show only ACCEPTED challenges that are not yet COMPLETED
            const activeOnes = res.data.data.filter((c: any) => c.status === 'ACCEPTED');
            setChallenges(activeOnes);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChallenges();
        const interval = setInterval(fetchChallenges, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleComplete = async () => {
        if (!winnerId) {
            vamosAlert('Please select a winner');
            return;
        }

        if (!(await vamosConfirm(`Confirm winner: ${winnerId === selectedChallenge.challengerId ? selectedChallenge.challenger.name : selectedChallenge.opponent.name}?`))) {
            return;
        }

        try {
            await api.put(`/player/challenge/${selectedChallenge.id}/complete`, { winnerId });
            vamosAlert('Challenge completed! XP and Badges awarded.');
            setIsCompleteModalOpen(false);
            setSelectedChallenge(null);
            setWinnerId('');
            fetchChallenges();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to complete challenge');
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
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                        <Swords className="text-yellow-500 w-8 h-8" />
                        Arena Match Management
                    </h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Finalize player challenges & award combat XP</p>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search player..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-[#0a0a0a] border border-[#222] rounded-xl px-10 py-3 text-sm focus:outline-none focus:border-yellow-500 w-64 text-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredChallenges.length > 0 ? filteredChallenges.map(c => (
                    <div key={c.id} className="bg-[#141414] border border-[#222] rounded-[32px] p-1 overflow-hidden group hover:border-yellow-500/50 transition-all">
                        <div className="bg-[#0a0a0a] rounded-[28px] p-6">
                            <div className="flex justify-between items-center mb-6">
                                <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-black px-3 py-1 rounded-full border border-yellow-500/20 uppercase tracking-widest">
                                    {c.isFightForTable ? 'Fight for Table' : 'Standard Duel'}
                                </span>
                                <span className="text-gray-500 font-mono text-[10px]">#{c.id.substring(0, 8)}</span>
                            </div>

                            <div className="flex items-center justify-between gap-4 mb-8">
                                <div className="flex-1 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                                        <User className="w-8 h-8 text-white/20" />
                                    </div>
                                    <p className="text-white font-bold text-sm truncate">{c.challenger.name}</p>
                                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-tighter">Challenger</p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="bg-yellow-500/20 px-3 py-1 rounded-lg mb-2">
                                        <p className="text-yellow-500 font-black text-xs font-mono">{c.pointsStake} PTS</p>
                                    </div>
                                    <div className="h-px w-8 bg-[#222] relative">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#222] px-2 py-1 text-[8px] font-black text-gray-500 italic rotate-45 border border-[#333]">VS</div>
                                    </div>
                                </div>

                                <div className="flex-1 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                                        <User className="w-8 h-8 text-white/20" />
                                    </div>
                                    <p className="text-white font-bold text-sm truncate">{c.opponent.name}</p>
                                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-tighter">Opponent</p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setSelectedChallenge(c);
                                    setIsCompleteModalOpen(true);
                                }}
                                className="w-full bg-[#111] border border-[#222] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] group-hover:bg-yellow-500 group-hover:text-black transition-all"
                            >
                                Finalize Record
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 bg-[#111] rounded-[32px] border border-dashed border-[#222] flex flex-col items-center justify-center">
                        <Skull className="w-12 h-12 text-gray-700 mb-4" />
                        <p className="text-gray-500 font-bold uppercase tracking-widest">No active match duels found</p>
                    </div>
                )}
            </div>

            {/* Complete Challenge Modal */}
            {isCompleteModalOpen && selectedChallenge && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-yellow-500/30 rounded-[40px] w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.15)]">
                        <div className="p-8 border-b border-[#222] text-center">
                            <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
                                <Trophy className="w-10 h-10 text-yellow-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white italic uppercase mb-2">Select Victor</h2>
                            <p className="text-gray-400 text-xs">Who emerged victorious in this duel?</p>
                        </div>

                        <div className="p-8 space-y-4">
                            <button
                                onClick={() => setWinnerId(selectedChallenge.challengerId)}
                                className={`w-full p-6 rounded-3xl border flex items-center justify-between transition-all ${winnerId === selectedChallenge.challengerId ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-[#0a0a0a] border-[#222] text-white hover:border-yellow-500/50'}`}
                            >
                                <div className="flex flex-col items-start">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${winnerId === selectedChallenge.challengerId ? 'text-black/60' : 'text-gray-500'}`}>Challenger</span>
                                    <span className="font-bold">{selectedChallenge.challenger.name}</span>
                                </div>
                                {winnerId === selectedChallenge.challengerId && <CheckCircle2 className="w-6 h-6" />}
                            </button>

                            <button
                                onClick={() => setWinnerId(selectedChallenge.opponentId)}
                                className={`w-full p-6 rounded-3xl border flex items-center justify-between transition-all ${winnerId === selectedChallenge.opponentId ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-[#0a0a0a] border-[#222] text-white hover:border-yellow-500/50'}`}
                            >
                                <div className="flex flex-col items-start">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${winnerId === selectedChallenge.opponentId ? 'text-black/60' : 'text-gray-500'}`}>Opponent</span>
                                    <span className="font-bold">{selectedChallenge.opponent.name}</span>
                                </div>
                                {winnerId === selectedChallenge.opponentId && <CheckCircle2 className="w-6 h-6" />}
                            </button>
                        </div>

                        <div className="p-8 bg-[#0a0a0a] flex gap-4">
                            <button
                                onClick={() => setIsCompleteModalOpen(false)}
                                className="flex-1 py-4 bg-transparent text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={!winnerId}
                                className="flex-[2] py-4 bg-yellow-500 text-black font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:scale-105 transition-all disabled:opacity-30"
                            >
                                Confirm Victory
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
