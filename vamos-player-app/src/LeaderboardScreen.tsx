import { useState, useMemo, useEffect } from 'react';
import { Search, Crown, User, Swords, X, Zap, Trophy, Flame, Loader2 } from 'lucide-react';
import { api, getAvatarUrl } from './api';

export function LeaderboardScreen({ leaderboard: initialLeaderboard, currentUser }: { leaderboard: {allTime: any[], monthly: any[], activeKings: any[]}, currentUser: any }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRival, setSelectedRival] = useState<any>(null);
    const [h2hStats, setH2hStats] = useState<any>(null);
    const [loadingH2H, setLoadingH2H] = useState(false);
    const [activeTab, setActiveTab] = useState<'allTime' | 'monthly' | 'streak' | 'hof'>('allTime');
    
    const leaderboard = initialLeaderboard;

    const currentListData = useMemo(() => {
        switch(activeTab) {
            case 'monthly': return leaderboard.monthly || [];
            case 'streak': return leaderboard.activeKings || [];
            case 'hof': return (leaderboard as any).hallOfFame || [];
            default: return leaderboard.allTime || [];
        }
    }, [leaderboard, activeTab]);

    const filteredLeaderboard = useMemo(() => {
        if (!searchQuery) return currentListData;
        return currentListData.filter((p: any) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.tier && p.tier.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [currentListData, searchQuery]);

    const top3 = currentListData.slice(0, 3);
    const others = filteredLeaderboard.slice(3).filter((p: any) => p.id !== top3[0]?.id && p.id !== top3[1]?.id && p.id !== top3[2]?.id);

    const fetchH2H = async (rivalId: string) => {
        setLoadingH2H(true);
        try {
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

    const getPrimaryMetricLabel = () => {
        if (activeTab === 'monthly') return 'MONTHLY PTS';
        if (activeTab === 'streak') return 'STREAK';
        if (activeTab === 'hof') return 'MAX STREAK';
        return 'VICTORIES';
    };

    const getPrimaryMetricValue = (p: any) => {
        if (activeTab === 'monthly') return p.monthlyScore?.toLocaleString('id-ID');
        if (activeTab === 'streak') return `${p.streakCount || p.currentStreak} 🔥`;
        if (activeTab === 'hof') return `${p.highestKingStreak} 🔥`;
        return `${p.totalWins || 0}W`;
    };

    return (
        <div className="fade-in space-y-10 pb-40 px-1">
            {/* Header */}
            <div className="pt-16 pb-8 text-center relative z-10 px-4">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />
                <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none glow-text">
                    HALL OF
                    <span className="text-3xl text-primary transform -skew-x-12 inline-block mt-1"> FAME</span>
                </h1>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4 italic">Peringkat Elit • Musim {new Date().getFullYear()}</p>
            </div>

            {/* Category Tabs */}
            <div className="flex bg-[#1a1f35]/50 p-1.5 rounded-2xl border border-white/5 mx-2">
                {['allTime', 'monthly', 'streak', 'hof'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        {tab === 'streak' && <Flame className="w-3 h-3" />}
                        {tab === 'hof' && <Trophy className="w-3 h-3" />}
                        {tab === 'allTime' ? 'Global' : tab === 'monthly' ? 'Liga' : tab === 'streak' ? 'Raja' : 'HOF'}
                    </button>
                ))}
            </div>

            {!searchQuery && top3.length >= 3 && (
                <div className="relative pt-24 pb-20 px-4 fade-in min-h-[460px] flex items-end justify-center overflow-visible">
                    {/* Stage Platform Base */}
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                    
                    <div className="flex items-end justify-center gap-0 sm:gap-4 relative z-10 w-full max-w-sm">
                        {/* ────── 2nd Place ────── */}
                        <div className="flex-1 flex flex-col items-center group cursor-pointer relative" onClick={() => setSelectedRival(top3[1])}>
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 text-monumental select-none">2</div>
                            
                            <div className="relative mb-6 z-20 transition-all duration-500 group-hover:-translate-y-2">
                                <div className="w-16 h-16 rounded-[22px] bg-[#0a0d18] border-2 border-slate-400 p-1 shadow-[0_0_30px_rgba(148,163,184,0.2)] overflow-hidden">
                                     {getAvatarUrl(top3[1].photo) ? <img src={getAvatarUrl(top3[1].photo)!} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-black italic bg-gradient-to-br from-slate-400/20 to-slate-600/10 rounded-[18px]">{top3[1].name[0]}</div>}
                                </div>
                            </div>

                            <div className="glass-pilar w-full h-32 rounded-t-[32px] relative overflow-hidden group-hover:bg-white/[0.05] transition-colors border-b-0">
                                 <div className="animate-shimmer" />
                            </div>

                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-full text-center pt-4">
                                <p className="text-[10px] font-black text-white truncate uppercase italic tracking-tighter mb-1.5">{top3[1].name}</p>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5 backdrop-blur-md">
                                    <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest">{getPrimaryMetricValue(top3[1])}</span>
                                </div>
                            </div>
                        </div>

                        {/* ────── 1st Place (CHAMPION) ────── */}
                        <div className="flex-[1.2] flex flex-col items-center group z-30 scale-110 -translate-y-4 cursor-pointer relative" onClick={() => setSelectedRival(top3[0])}>
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-monumental text-primary/10 select-none !text-[10rem]">1</div>
                            <div className="absolute w-48 h-48 champion-aura top-0 left-1/2 -translate-x-1/2 pointer-events-none" />
                            
                            <div className="relative mb-8 z-30 transition-all duration-700 group-hover:-translate-y-4">
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 pointer-events-none drop-shadow-[0_0_15px_rgba(255,87,34,0.6)]">
                                    <Crown className="w-10 h-10 text-primary fill-primary animate-bounce" />
                                </div>
                                <div className="w-24 h-24 rounded-[32px] bg-[#0a0d18] border-[3px] border-primary p-1.5 shadow-[0_0_50px_rgba(255,87,34,0.4)] overflow-hidden">
                                     {getAvatarUrl(top3[0].photo) ? <img src={getAvatarUrl(top3[0].photo)!} className="w-full h-full object-cover rounded-[24px]" /> : <div className="w-full h-full flex items-center justify-center text-primary font-black italic text-3xl bg-gradient-to-br from-primary/30 to-primary/10 rounded-[24px]">{top3[0].name[0]}</div>}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-primary text-[#0d0f14] w-8 h-8 rounded-xl flex items-center justify-center border-4 border-[#0d0f14] italic font-black text-xs shadow-xl scale-110">#1</div>
                            </div>

                            <div className="glass-pilar w-full h-48 rounded-t-[40px] relative overflow-hidden border-primary/20 group-hover:border-primary/40 transition-colors border-b-0 shadow-[0_0_30px_rgba(255,87,34,0.1)]">
                                 <div className="animate-shimmer" />
                                 <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                            </div>

                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-full text-center pt-6">
                                <h4 className="text-sm font-black text-white truncate uppercase italic tracking-tighter leading-none mb-2">{top3[0].name}</h4>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary/20 border border-primary/30 backdrop-blur-md shadow-lg shadow-primary/10">
                                    <Zap className="w-3.5 h-3.5 text-primary" fill="currentColor" />
                                    <span className="text-[10px] font-black text-primary uppercase italic tracking-widest leading-none">{getPrimaryMetricValue(top3[0])}</span>
                                </div>
                            </div>
                        </div>

                        {/* ────── 3rd Place ────── */}
                        <div className="flex-1 flex flex-col items-center group cursor-pointer relative" onClick={() => setSelectedRival(top3[2])}>
                            <div className="absolute top-14 left-1/2 -translate-x-1/2 text-monumental select-none">3</div>
                            
                            <div className="relative mb-6 z-20 transition-all duration-500 group-hover:-translate-y-2">
                                <div className="w-16 h-16 rounded-[22px] bg-[#0a0d18] border-2 border-amber-600 p-1 shadow-[0_0_30px_rgba(217,119,6,0.2)] overflow-hidden">
                                     {getAvatarUrl(top3[2].photo) ? <img src={getAvatarUrl(top3[2].photo)!} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-amber-600 font-black italic bg-gradient-to-br from-amber-700/20 to-amber-900/10 rounded-[18px]">{top3[2].name[0]}</div>}
                                </div>
                            </div>

                            <div className="glass-pilar w-full h-24 rounded-t-[32px] relative overflow-hidden group-hover:bg-white/[0.05] transition-colors border-b-0">
                                 <div className="animate-shimmer" />
                            </div>

                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-full text-center pt-4">
                                <p className="text-[10px] font-black text-white truncate uppercase italic tracking-tighter mb-1.5">{top3[2].name}</p>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5 backdrop-blur-md">
                                    <span className="text-[9px] font-black text-amber-600 uppercase italic tracking-widest">{getPrimaryMetricValue(top3[2])}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and List */}
            <div className="space-y-6 fade-in">
                <div className="relative group mx-2">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari Pemain..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1a1f35]/50 border-2 border-white/5 rounded-[32px] pl-16 pr-8 py-5 text-sm font-black text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:bg-[#1a1f35] transition-all uppercase tracking-widest italic"
                    />
                </div>

                <div className="space-y-4 px-2">
                    {others.map((p: any, i: number) => {
                        const rank = searchQuery ? currentListData.indexOf(p) + 1 : i + 4;
                        return (
                            <div key={p.id} onClick={() => setSelectedRival(p)}
                                className="fiery-card p-3.5 flex items-center justify-between border-2 border-white/5 bg-[#1a1f35]/40 hover:border-primary/40 hover:bg-[#1a1f35]/60 transition-all duration-300 group cursor-pointer active:scale-[0.98] rounded-[28px]">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-[14px] bg-[#101423] flex items-center justify-center border border-white/5 shrink-0 group-hover:scale-110 transition-transform">
                                        <span className="text-slate-600 font-black italic text-[10px] group-hover:text-primary transition-colors">#{rank}</span>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-[#101423] border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                                        {getAvatarUrl(p.photo) ? <img src={getAvatarUrl(p.photo)!} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-slate-700" />}
                                    </div>
                                    <div className="min-w-0 max-w-[130px]">
                                        <p className="font-black text-sm text-white uppercase italic tracking-tighter truncate leading-tight mb-1">{p.name}</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full italic border border-white/5">{p.tier || 'OPERATIVE'}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-lg font-black text-white italic tracking-tighter leading-none mb-1">{getPrimaryMetricValue(p)}</p>
                                    <p className="text-[9px] text-primary font-black tracking-widest uppercase leading-none italic">{getPrimaryMetricLabel()}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Rivalry Modal (H2H) */}
            {selectedRival && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-[#0a0d18]/95 backdrop-blur-2xl" onClick={() => setSelectedRival(null)} />
                    <div className="relative w-full max-w-sm fiery-card rounded-[48px] p-12 border-2 border-primary/20 text-center fade-in overflow-hidden shadow-[0_0_100px_rgba(31,34,255,0.2)]">
                        <div className="flex justify-between items-center mb-12">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Statistik Tanding</span>
                            <button onClick={() => setSelectedRival(null)} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white border border-white/5 active:scale-90 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between gap-6 mb-12 relative">
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary fiery-glow z-10 backdrop-blur-md">
                                    <Swords className="w-7 h-7" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="w-24 h-24 rounded-[32px] bg-[#1a1f35] mb-4 mx-auto overflow-hidden border-2 border-white/5 shadow-xl">
                                    {getAvatarUrl(currentUser.photo) ? <img src={getAvatarUrl(currentUser.photo)!} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600 font-black italic">YOU</div>}
                                </div>
                                <p className="text-[10px] font-black text-white uppercase italic tracking-widest">{currentUser.name.split(' ')[0]}</p>
                            </div>
                            <div className="flex-1">
                                <div className="w-24 h-24 rounded-[32px] bg-[#1a1f35] mb-4 mx-auto overflow-hidden border-2 border-white/5 shadow-xl">
                                    {getAvatarUrl(selectedRival.photo) ? <img src={getAvatarUrl(selectedRival.photo)!} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600 font-black italic">{selectedRival.name?.[0]}</div>}
                                </div>
                                <p className="text-[10px] font-black text-white uppercase italic tracking-widest">{(selectedRival.name || '').split(' ')[0]}</p>
                            </div>
                        </div>
                        {loadingH2H ? (
                            <div className="py-16"><Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" /></div>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5"><p className="text-[9px] font-black text-slate-600 uppercase mb-2 italic">Menang</p><p className="text-3xl font-black text-emerald-500 italic tracking-tighter">{h2hStats?.wins || 0}</p></div>
                                    <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5"><p className="text-[9px] font-black text-slate-600 uppercase mb-2 italic">Kalah</p><p className="text-3xl font-black text-rose-500 italic tracking-tighter">{h2hStats?.losses || 0}</p></div>
                                    <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5"><p className="text-[9px] font-black text-slate-600 uppercase mb-2 italic">Seri</p><p className="text-3xl font-black text-slate-500 italic tracking-tighter">0</p></div>
                                </div>
                                <button onClick={() => setSelectedRival(null)} className="w-full py-5 fiery-btn-secondary rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] italic">Tutup</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
