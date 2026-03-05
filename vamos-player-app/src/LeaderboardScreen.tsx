import { useState, useMemo, useEffect } from 'react';
import { Search, Crown, TrendingUp, User, Swords, X, Zap, Trophy, Flame, Loader2 } from 'lucide-react';
import { api } from './api';

export function LeaderboardScreen({ leaderboard, currentUser }: { leaderboard: any[], currentUser: any }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRival, setSelectedRival] = useState<any>(null);
    const [h2hStats, setH2hStats] = useState<any>(null);
    const [loadingH2H, setLoadingH2H] = useState(false);

    const filteredLeaderboard = useMemo(() => {
        if (!searchQuery) return leaderboard;
        return leaderboard.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.tier && p.tier.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [leaderboard, searchQuery]);

    const top3 = leaderboard.slice(0, 3);
    const others = filteredLeaderboard.slice(3).filter(p => p.id !== top3[0]?.id && p.id !== top3[1]?.id && p.id !== top3[2]?.id);

    const fetchH2H = async (rivalId: string) => {
        setLoadingH2H(true);
        try {
            // We reuse the getH2H endpoint but we only want the one for this specific rival
            const res = await api.get(`/player/${currentUser.id}/h2h`);
            const rivalData = res.data.data.find((r: any) => r.opponentId === rivalId);
            setH2hStats(rivalData || { wins: 0, losses: 0, total: 0 });
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingH2H(false);
        }
    };

    useEffect(() => {
        if (selectedRival) {
            fetchH2H(selectedRival.id);
        } else {
            setH2hStats(null);
        }
    }, [selectedRival]);

    return (
        <div className="fade-in space-y-12 pb-40 px-1">
            {/* Header */}
            <div className="text-center pt-8 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />
                <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white leading-none">
                    HALL OF <span className="text-primary italic">FAME</span>
                </h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-4 italic opacity-60">Elite Ranking • Season 2026</p>
            </div>

            {/* Podium Visual */}
            {!searchQuery && top3.length >= 3 && (
                <div className="flex items-end justify-center gap-4 pt-12 pb-8 h-[320px] relative px-2">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all" onClick={() => setSelectedRival(top3[1])}>
                        <div className="w-16 h-16 rounded-[24px] bg-[#1a1f35] border-2 border-slate-500 overflow-hidden mb-4 shadow-xl relative z-20 group-hover:-translate-y-2 transition-transform duration-500">
                            {top3[1].photo ? <img src={top3[1].photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500 font-black italic">{top3[1].name[0]}</div>}
                        </div>
                        <div className="bg-gradient-to-b from-slate-500 to-slate-700 w-24 h-28 rounded-t-[32px] flex flex-col items-center justify-start pt-6 shadow-2xl relative z-10 border-x border-t border-white/10">
                            <span className="text-[#101423] font-black text-3xl italic">2</span>
                            <div className="absolute -bottom-14 w-28 text-center">
                                <p className="text-[10px] font-black text-white truncate uppercase italic tracking-tighter">{top3[1].name}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">{top3[1].totalWins} VICTORIES</p>
                            </div>
                        </div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center group z-30 -translate-y-6 cursor-pointer active:scale-95 transition-all" onClick={() => setSelectedRival(top3[0])}>
                        <div className="relative mb-4">
                            <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-10 text-primary fill-primary animate-bounce fiery-glow" />
                            <div className="w-24 h-24 rounded-[32px] bg-[#1a1f35] border-[4px] border-primary overflow-hidden shadow-[0_0_50px_rgba(31,34,255,0.4)] relative z-20 group-hover:-translate-y-2 transition-transform duration-500">
                                {top3[0].photo ? <img src={top3[0].photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary font-black italic text-2xl">{top3[0].name[0]}</div>}
                            </div>
                        </div>
                        <div className="bg-gradient-to-b from-primary to-[#1f22ff] w-28 h-40 rounded-t-[40px] flex flex-col items-center justify-start pt-8 shadow-[0_20px_60px_rgba(31,34,255,0.3)] relative z-10 border-x border-t border-white/20">
                            <span className="text-secondary font-black text-4xl italic">1</span>
                            <div className="absolute -bottom-14 w-32 text-center">
                                <p className="text-sm font-black text-white truncate uppercase italic tracking-tighter leading-none">{top3[0].name}</p>
                                <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-2 italic animate-pulse">{top3[0].totalWins} VICTORIES</p>
                            </div>
                        </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all" onClick={() => setSelectedRival(top3[2])}>
                        <div className="w-16 h-16 rounded-[24px] bg-[#1a1f35] border-2 border-amber-800 overflow-hidden mb-4 shadow-xl relative z-20 group-hover:-translate-y-2 transition-transform duration-500">
                            {top3[2].photo ? <img src={top3[2].photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-amber-800 font-black italic">{top3[2].name[0]}</div>}
                        </div>
                        <div className="bg-gradient-to-b from-amber-800 to-amber-950 w-24 h-24 rounded-t-[32px] flex flex-col items-center justify-start pt-6 shadow-2xl relative z-10 border-x border-t border-white/10">
                            <span className="text-[#101423] font-black text-3xl italic">3</span>
                            <div className="absolute -bottom-14 w-28 text-center">
                                <p className="text-[10px] font-black text-white truncate uppercase italic tracking-tighter">{top3[2].name}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">{top3[2].totalWins} VICTORIES</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="pt-8 space-y-10">
                <div className="relative group mx-2">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Scan for Legend Identity..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1a1f35]/50 border-2 border-white/5 rounded-[32px] pl-16 pr-8 py-5 text-sm font-black text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:bg-[#1a1f35] transition-all uppercase tracking-widest italic"
                    />
                </div>

                <div className="space-y-4">
                    {others.map((p: any, i: number) => {
                        const rank = searchQuery ? leaderboard.indexOf(p) + 1 : i + 4;
                        return (
                            <div key={p.id} onClick={() => setSelectedRival(p)}
                                className="fiery-card p-6 flex items-center justify-between border-2 border-white/5 bg-[#1a1f35]/40 hover:border-primary/40 hover:bg-[#1a1f35]/60 transition-all duration-300 group cursor-pointer active:scale-[0.98] rounded-[40px]">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-[20px] bg-[#101423] flex items-center justify-center border border-white/5 relative overflow-hidden group-hover:scale-110 transition-transform">
                                        <span className="text-slate-600 font-black italic text-xs relative z-10 group-hover:text-primary transition-colors">#{rank}</span>
                                    </div>
                                    <div className="w-16 h-16 rounded-2xl bg-[#101423] border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                                        {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-slate-700" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-lg text-white uppercase italic tracking-tighter truncate leading-tight mb-2">{p.name}</p>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full italic border border-white/5">{p.tier || 'CHALLENGER'}</span>
                                            {p.streakCount > 2 && <div className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-primary" /><span className="text-[9px] font-black text-primary italic pt-0.5">ON FIRE</span></div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-2xl font-black text-white italic tracking-tighter leading-none mb-1">{p.totalWins || 0}W</p>
                                    <p className="text-[9px] text-primary font-black tracking-widest uppercase leading-none italic">
                                        {((p.winRate || 0)).toFixed(0)}% RATE
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Rivalry Modal */}
            {selectedRival && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-[#0a0d18]/95 backdrop-blur-2xl" onClick={() => setSelectedRival(null)} />
                    <div className="relative w-full max-w-sm fiery-card rounded-[48px] p-12 border-2 border-primary/20 text-center fade-in overflow-hidden shadow-[0_0_100px_rgba(31,34,255,0.2)]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />

                        <div className="flex justify-between items-center mb-12">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Combat Rivalry Analytics</span>
                            <button onClick={() => setSelectedRival(null)} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white border border-white/5 active:scale-90 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-6 mb-12 relative">
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary fiery-glow z-10 backdrop-blur-md">
                                    <Swords className="w-7 h-7" />
                                </div>
                                <div className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                            </div>

                            <div className="flex-1 relative">
                                <div className="w-24 h-24 rounded-[32px] bg-[#1a1f35] mb-4 mx-auto overflow-hidden border-2 border-white/5 shadow-xl">
                                    {currentUser.photo ? <img src={currentUser.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600 font-black italic">YOU</div>}
                                </div>
                                <p className="text-[10px] font-black text-white uppercase italic tracking-widest">{currentUser.name.split(' ')[0]}</p>
                            </div>

                            <div className="flex-1 relative">
                                <div className="w-24 h-24 rounded-[32px] bg-[#1a1f35] mb-4 mx-auto overflow-hidden border-2 border-white/5 shadow-xl">
                                    {selectedRival.photo ? <img src={selectedRival.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600 font-black italic">{selectedRival.name[0]}</div>}
                                </div>
                                <p className="text-[10px] font-black text-white uppercase italic tracking-widest">{selectedRival.name.split(' ')[0]}</p>
                            </div>
                        </div>

                        {loadingH2H ? (
                            <div className="py-16">
                                <div className="relative">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                                    <div className="absolute inset-0 blur-lg bg-primary/20 animate-pulse" />
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase mt-8 tracking-[0.3em] italic">Scanning Mission Records...</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5">
                                        <p className="text-[9px] font-black text-slate-600 uppercase mb-2 italic">Victory</p>
                                        <p className="text-3xl font-black text-emerald-500 italic tracking-tighter">{h2hStats?.wins || 0}</p>
                                    </div>
                                    <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5">
                                        <p className="text-[9px] font-black text-slate-600 uppercase mb-2 italic">Defeat</p>
                                        <p className="text-3xl font-black text-rose-500 italic tracking-tighter">{h2hStats?.losses || 0}</p>
                                    </div>
                                    <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5">
                                        <p className="text-[9px] font-black text-slate-600 uppercase mb-2 italic">Draw</p>
                                        <p className="text-3xl font-black text-slate-500 italic tracking-tighter">0</p>
                                    </div>
                                </div>

                                <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/20 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                                    <div className="flex justify-between items-center mb-6">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3 italic">
                                            <Zap className="w-4 h-4 fill-primary animate-pulse" />
                                            Engagement Advantage
                                        </p>
                                        <p className="text-2xl font-black text-white italic tracking-tighter">
                                            {h2hStats?.total > 0 ? ((h2hStats.wins / h2hStats.total) * 100).toFixed(0) : '50'}%
                                        </p>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                                        <div className="h-full bg-primary rounded-full fiery-glow" style={{ width: `${h2hStats?.total > 0 ? (h2hStats.wins / h2hStats.total) * 100 : 50}%` }} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-[24px] border border-white/5">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary fiery-glow">
                                            <Trophy className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[9px] font-black text-slate-500 uppercase italic">Op. Wins</p>
                                            <p className="text-sm font-black text-white italic tracking-tighter">{selectedRival.totalWins}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-[24px] border border-white/5">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                                            <Flame className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[9px] font-black text-slate-500 uppercase italic">Streak</p>
                                            <p className="text-sm font-black text-white italic tracking-tighter">{selectedRival.streakCount} 🔥</p>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => setSelectedRival(null)} className="w-full py-5 fiery-btn-secondary rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] transition-all mt-6 italic">
                                    Dismiss Report
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
