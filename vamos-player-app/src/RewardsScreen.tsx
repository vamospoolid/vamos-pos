import { ArrowLeft, Loader2, Star, Share2, Zap, Gift, ShoppingBag, Lock, Box, ArrowRight, TrendingUp, TrendingDown, UserCog } from 'lucide-react';
import { useAppStore } from './store/appStore';
import { useState, useEffect } from 'react';
import { api } from './api';

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIER = {
    BRONZE: { color: '#cd7f32', label: 'Bronze', emoji: '🥉', min: 0, nextMin: 1000 },
    SILVER: { color: '#a8a9ad', label: 'Silver', emoji: '🥈', min: 1000, nextMin: 2500 },
    GOLD: { color: '#00d4ff', label: 'Arena Gold', emoji: '🥇', min: 2500, nextMin: 5000 },
    PLATINUM: { color: '#1f22ff', label: 'Champion', emoji: '💎', min: 5000, nextMin: 5000 },
} as const;

const NEXT_TIER: Record<string, keyof typeof TIER> = {
    BRONZE: 'SILVER', SILVER: 'GOLD', GOLD: 'PLATINUM', PLATINUM: 'PLATINUM'
};

const TIER_BENEFITS: Record<string, string[]> = {
    BRONZE: ['Dashboard Access', 'View Leaderboard', 'Basic rewards access'],
    SILVER: ['Priority table booking', 'Point Multiplier (1.1x)', 'Early access to tournaments'],
    GOLD: ['Point Multiplier (1.25x)', 'Monthly free signature drink', 'VIP event access', 'All lower tier benefits'],
    PLATINUM: ['Point Multiplier (1.5x)', 'Free weekend booking', 'Personal coach session', 'All lower tier VIP benefits'],
};

export function RewardsScreen() {
    const { member, setMember, setActiveTab, rewardsTab, setRewardsTab } = useAppStore();

    const [rewards, setRewards] = useState<any[]>([]);
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [redeemingId, setRedeemingId] = useState<string | null>(null);
    const [confirmReward, setConfirmReward] = useState<any>(null);
    const [mysteryOpening, setMysteryOpening] = useState(false);
    const [mysteryResult, setMysteryResult] = useState<any>(null);

    const points = member?.loyaltyPoints || 0;
    const experience = member?.experience || 0;
    const tier = (member?.tier || 'BRONZE') as keyof typeof TIER;
    const tierCfg = TIER[tier] || TIER.BRONZE;
    const nextTierKey = NEXT_TIER[tier];
    const nextTierCfg = TIER[nextTierKey];
    const isMaxTier = tier === 'PLATINUM';

    const progressFloor = tierCfg.min;
    const progressCeil = isMaxTier ? experience : nextTierCfg.min;
    const progressPct = isMaxTier ? 100 : Math.min(100, Math.max(0, Math.round(((experience - progressFloor) / (progressCeil - progressFloor)) * 100)));
    const xpToGo = isMaxTier ? 0 : Math.max(0, nextTierCfg.min - experience);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [rewardsRes, redemptionsRes] = await Promise.all([
                api.get('/player/rewards'),
                member?.id ? api.get(`/player/rewards/redemptions/member/${member.id}`) : Promise.resolve({ data: { data: [] } }),
            ]);
            setRewards(rewardsRes.data.data || []);
            setRedemptions(redemptionsRes.data.data || []);
            
            // Re-fetch member to get latest pointLogs
            if (member?.id) {
                const memberRes = await api.get(`/player/${member.id}`);
                if (memberRes.data.success) {
                    setMember(memberRes.data.data);
                }
            }
        } catch (err) {
            console.error('Failed to fetch rewards', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (reward: any) => {
        setRedeemingId(reward.id);
        setConfirmReward(null);
        try {
            const res = await api.post('/player/rewards/redeem', {
                memberId: member.id,
                rewardId: reward.id
            });
            if (res.data.success) {
                setMember(res.data.data);
                await fetchAll();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to authorize redemption.');
        } finally {
            setRedeemingId(null);
        }
    };

    const handleOpenMystery = async () => {
        if (points < 50) return alert('Poin tidak cukup (Butuh 50 Poin)');
        setMysteryOpening(true);
        setMysteryResult(null);
        try {
            await new Promise(r => setTimeout(r, 1500)); // Dramatic pause
            const res = await api.post('/player/loyalty/mystery-box', {
                memberId: member.id
            });
            if (res.data.success) {
                setMysteryResult(res.data);
                setMember(res.data.updated);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Gagal membuka box.');
        } finally {
            setMysteryOpening(false);
        }
    };

    return (
        <div className="pb-40 text-white min-h-screen fade-in relative px-1">
            {/* Header */}
            <div className="pt-6 pb-6 flex justify-between items-center bg-[#101423]/90 backdrop-blur-xl sticky top-0 z-50 -mx-6 px-10 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <button onClick={() => setActiveTab('dashboard')} className="w-12 h-12 rounded-2xl bg-[#1a1f35] flex items-center justify-center active:scale-90 transition-all text-white border border-white/5">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">Rewards Hub</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Loyalty HQ</p>
                    </div>
                </div>
                <button className="w-12 h-12 rounded-2xl bg-[#1a1f35] flex items-center justify-center text-slate-500 hover:text-white border border-white/5">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            <div className="mt-8 space-y-10">
                {/* Points Hero */}
                <div className="relative fiery-card p-12 overflow-hidden flex flex-col items-center justify-center border-primary/10 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                    <div className="absolute top-[-40%] right-[-20%] w-80 h-80 bg-primary/5 rounded-full blur-[80px]" />
                    <div className="absolute bottom-[-30%] left-[-20%] w-60 h-60 bg-[#1f22ff]/5 rounded-full blur-[60px]" />

                    <div className="relative z-10 text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 italic">Available Credits</p>
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-[20px] bg-primary/10 flex items-center justify-center border border-primary/20 fiery-glow">
                                <Star className="w-7 h-7 text-primary" fill="currentColor" />
                            </div>
                            <h2 className="text-6xl font-black text-white italic tracking-tighter leading-none">{points.toLocaleString('id-ID')}</h2>
                        </div>

                        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                            <span className="text-2xl">{tierCfg.emoji}</span>
                            <span className="text-xs font-black text-white uppercase italic tracking-widest">{tierCfg.label}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                {!isMaxTier && (
                    <div className="fiery-card p-10 bg-[#1a1f35]/50 border-white/5">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Promotion Path</p>
                                <p className="text-sm font-black text-white italic uppercase">To <span style={{ color: nextTierCfg.color }} className="italic">{nextTierCfg.label} Rank</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic">Estimated Req.</p>
                                <p className="text-xs font-black text-primary italic">+{(xpToGo).toLocaleString('id-ID')} XP</p>
                            </div>
                        </div>
                        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-[2px] border border-white/5">
                            <div className="h-full transition-all duration-1000 rounded-full fiery-glow shadow-[0_0_15px_rgba(31,34,255,0.3)]"
                                style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${tierCfg.color}, ${nextTierCfg.color})` }} />
                        </div>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="flex bg-[#1a1f35] p-2 rounded-[32px] border border-white/5 shadow-inner">
                    {[
                        { key: 'catalog', label: 'Market' },
                        { key: 'vault', label: 'Vault' },
                        { key: 'history', label: 'History' },
                        { key: 'tiers', label: 'Ranks' },
                    ].map(t => (
                        <button key={t.key} onClick={() => setRewardsTab(t.key as any)}
                            className={`flex-1 py-4 text-[10px] font-black rounded-[24px] uppercase tracking-widest transition-all italic ${rewardsTab === t.key ? 'bg-primary text-secondary fiery-glow shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 space-y-8">
                        <div className="relative">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" strokeWidth={3} />
                            <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Syncing Marketplace...</p>
                    </div>
                )}

                {/* Catalog */}
                {!loading && rewardsTab === 'catalog' && (
                    <div className="space-y-6">
                        {/* Mystery Box Gacha Hero */}
                        <div className="relative group overflow-hidden bg-gradient-to-br from-[#1f22ff]/20 via-[#1a1f35]/80 to-transparent p-[2px] rounded-[32px] border border-white/10 shadow-2xl mb-8">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="bg-[#101423] p-8 rounded-[31px] relative overflow-hidden flex items-center justify-between">
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
                                
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center relative">
                                        <div className="absolute inset-0 bg-primary/10 blur-xl animate-pulse" />
                                        <Box className={`w-8 h-8 text-primary transition-all duration-300 ${mysteryOpening ? 'animate-bounce' : 'group-hover:scale-110'}`} fill="currentColor" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Arena Mystery Box</h3>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic opacity-80">Chance to win 500 Poin Jackpot!</p>
                                    </div>
                                </div>

                                <button onClick={handleOpenMystery} disabled={mysteryOpening}
                                    className="px-6 py-3 rounded-xl bg-primary text-secondary text-[10px] font-black uppercase tracking-widest italic shadow-lg shadow-primary/20 active:scale-95 transition-all">
                                    {mysteryOpening ? 'Opening...' : '50 Poin'}
                                </button>
                            </div>
                        </div>

                        {rewards.length === 0 && (
                            <div className="fiery-card py-24 text-center border-dashed border-white/10 opacity-60">
                                <Gift className="w-14 h-14 text-slate-700 mx-auto mb-6" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic leading-relaxed">Marketplace currently dormant.<br />Stand by for supplies.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 gap-6">
                            {rewards.map(reward => {
                                const isLocked = points < reward.pointsRequired;
                                const isRedeeming = redeemingId === reward.id;
                                return (
                                    <div key={reward.id}
                                        className={`group fiery-card overflow-hidden border transition-all duration-300 ${isLocked ? 'border-transparent bg-[#1a1f35]/20' : 'border-white/5 bg-[#1a1f35]/40 hover:border-primary/30 shadow-lg'}`}>
                                        <div className="flex p-3.5 gap-4 items-center">
                                            {/* Compact Image Container */}
                                            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 relative bg-[#101423] border border-white/5">
                                                {reward.imageUrl
                                                    ? <img src={reward.imageUrl} alt={reward.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                    : <div className="w-full h-full flex items-center justify-center bg-primary/5"><Gift className="w-6 h-6 text-primary/20" /></div>
                                                }
                                                {isLocked && (
                                                    <div className="absolute inset-0 bg-[#0a0d18]/70 flex items-center justify-center backdrop-blur-[2px]">
                                                        <Lock className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-col h-20 justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <h4 className="font-black text-sm text-white leading-none truncate uppercase italic tracking-tighter">{reward.title}</h4>
                                                        <Zap className={`w-3 h-3 shrink-0 ${isLocked ? 'text-slate-800' : 'text-primary'}`} fill="currentColor" />
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-600 line-clamp-2 leading-tight uppercase italic tracking-tight">{reward.description}</p>
                                                </div>

                                                <div className="flex items-end justify-between">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className={`text-xl font-black italic tracking-tighter ${isLocked ? 'text-slate-800' : 'text-white'}`}>
                                                            {reward.pointsRequired}
                                                        </span>
                                                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">PTS</span>
                                                    </div>

                                                    <button
                                                        onClick={() => !isLocked && setConfirmReward(reward)}
                                                        disabled={isLocked || isRedeeming}
                                                        className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic ${isLocked ? 'bg-white/5 text-slate-700' : 'fiery-btn-primary text-secondary shadow-primary/10 active:scale-95'}`}
                                                    >
                                                        {isRedeeming ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : isLocked ? 'Locked' : 'Claim'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Vault */}
                {!loading && rewardsTab === 'vault' && (
                    <div className="space-y-6">
                        {redemptions.filter(r => r.status === 'PENDING').length === 0 ? (
                            <div className="fiery-card py-24 text-center border-dashed border-white/10 opacity-60">
                                <Box className="w-14 h-14 text-slate-700 mx-auto mb-6" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Vault Storage Empty.</p>
                            </div>
                        ) : (
                            redemptions.filter(r => r.status === 'PENDING').map((r: any) => (
                                <div key={r.id} className="relative group overflow-hidden bg-gradient-to-br from-primary/20 via-transparent to-transparent p-[2px] rounded-[40px] border border-white/5">
                                    <div className="bg-[#1a1f35] p-10 rounded-[39px] flex gap-8 items-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] translate-x-10 -translate-y-10" />

                                        <div className="w-24 h-24 rounded-[32px] bg-primary/10 flex flex-col items-center justify-center border border-primary/20 shrink-0 fiery-glow">
                                            <Gift className="w-10 h-10 text-primary mb-2" />
                                            <span className="text-[8px] font-black text-primary uppercase tracking-widest italic">Voucher</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-white text-2xl leading-tight uppercase italic tracking-tighter mb-4">{r.reward?.title}</h4>
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">CODE: {r.id.substring(0, 8).toUpperCase()}</span>
                                                </div>
                                                <span className="text-[9px] font-black text-primary uppercase tracking-widest italic flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Ready
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold mt-6 uppercase tracking-widest italic opacity-60">Present to Command Post (Cashier)</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* History */}
                {!loading && rewardsTab === 'history' && (
                    <div className="space-y-4">
                        {(member?.pointLogs || []).length === 0 ? (
                            <div className="fiery-card py-24 text-center border-dashed border-white/10 opacity-60">
                                <ShoppingBag className="w-14 h-14 text-slate-700 mx-auto mb-6" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">No mission records found.</p>
                            </div>
                        ) : member.pointLogs.map((log: any) => {
                            const isPositive = log.points > 0;
                            const Icon = log.type === 'REDEEM' ? ShoppingBag : (log.type === 'ADMIN_ADJUST' ? UserCog : (isPositive ? TrendingUp : TrendingDown));
                            
                            return (
                                <div key={log.id} className="fiery-card p-6 flex items-center gap-6 border border-white/5 bg-[#1a1f35]/40 hover:bg-[#1a1f35]/60 transition-all rounded-[32px]">
                                    <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center border border-white/5 ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-xs text-white uppercase italic tracking-widest leading-none mb-1.5">{log.description || log.type}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">
                                            {new Date(log.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-xl font-black italic tracking-tighter ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {isPositive ? '+' : ''}{log.points}
                                        </p>
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Credits</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tiers / Ranks */}
                {!loading && rewardsTab === 'tiers' && (
                    <div className="space-y-6">
                        {Object.entries(TIER).map(([key, cfg]) => {
                            const isCurrentTier = key === tier;
                            const benefits = TIER_BENEFITS[key] || [];
                            return (
                                <div key={key} className={`rounded-[40px] p-10 transition-all border-2 relative overflow-hidden ${isCurrentTier ? 'border-primary bg-primary/5 shadow-[0_0_40px_rgba(31,34,255,0.15)]' : 'border-white/5 bg-[#1a1f35]/40'}`}>
                                    {isCurrentTier && (
                                        <div className="absolute top-8 right-8">
                                            <div className="px-5 py-1.5 bg-primary rounded-full text-secondary text-[10px] font-black uppercase tracking-widest italic fiery-glow">Active Rank</div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-8 mb-10">
                                        <div className="text-5xl p-6 rounded-[32px] bg-[#101423] border border-white/5 shadow-xl">{cfg.emoji}</div>
                                        <div>
                                            <p className="font-black text-3xl leading-none italic uppercase tracking-tighter" style={{ color: cfg.color }}>{cfg.label}</p>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-3 italic">
                                                {cfg.min === 0 ? 'Foundation Level' : `REQ ${(cfg.min).toLocaleString('id-ID')} XP`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {benefits.map((b, i) => (
                                            <div key={i} className="flex items-center gap-4 group">
                                                <div className="w-2 h-2 rounded-full fiery-glow" style={{ background: cfg.color }} />
                                                <span className={`text-[11px] font-black uppercase tracking-widest italic ${isCurrentTier ? 'text-white' : 'text-slate-500'}`}>{b}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {isCurrentTier && (
                                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Redemption Confirmation Modal */}
            {confirmReward && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8" onClick={() => setConfirmReward(null)}>
                    <div className="absolute inset-0 bg-[#0a0d18]/95 backdrop-blur-2xl" />
                    <div className="relative w-full max-w-sm fiery-card p-12 overflow-hidden border-2 border-primary/20 shadow-[0_0_100px_rgba(31,34,255,0.2)]"
                        onClick={e => e.stopPropagation()}>

                        <div className="absolute top-[-20%] right-[-20%] w-60 h-60 bg-primary/10 rounded-full blur-[60px]" />

                        <div className="text-center mb-10">
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Authorize Claim?</h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Credits will be permanently deducted.</p>
                        </div>

                        <div className="bg-[#101423] rounded-[32px] p-8 mb-10 flex gap-8 border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-white/5 border border-white/5 relative z-10">
                                {confirmReward.imageUrl
                                    ? <img src={confirmReward.imageUrl} alt={confirmReward.title} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><Gift className="w-8 h-8 text-primary/30" /></div>
                                }
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
                                <p className="font-black text-lg text-white truncate leading-tight mb-3 uppercase italic tracking-tighter">{confirmReward.title}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-black text-primary text-3xl italic tracking-tighter">
                                        {confirmReward.pointsRequired}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">PTS</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-4 mb-10">
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-1">Remaining Balance</p>
                                <p className="text-xl font-black text-white italic tracking-tighter">{(points - confirmReward.pointsRequired).toLocaleString()}</p>
                            </div>
                            <ArrowRight className="w-6 h-6 text-slate-700" />
                        </div>

                        <div className="flex flex-col gap-4">
                            <button onClick={() => setConfirmReward(null)}
                                className="w-full py-5 rounded-2xl font-black text-[10px] text-slate-500 uppercase tracking-[0.3em] bg-white/5 hover:text-white transition-all italic border border-white/5">
                                Abort Mission
                            </button>
                            <button onClick={() => handleRedeem(confirmReward)}
                                disabled={!!redeemingId}
                                className="w-full fiery-btn-primary py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] text-secondary italic shadow-primary/30">
                                {redeemingId ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Confirm Protocol'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mystery Box Result Modal */}
            {mysteryResult && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-8" onClick={() => setMysteryResult(null)}>
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" />
                    <div className="relative w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
                        
                        <div className={`mx-auto mb-10 w-32 h-32 rounded-[40px] flex items-center justify-center text-5xl transition-all duration-700 scale-110 shadow-2xl ${mysteryResult.win ? 'bg-primary/20 border-primary shadow-primary/30' : 'bg-slate-800/40 border-white/5'}`}>
                            {mysteryResult.win ? '🔥' : '💀'}
                        </div>

                        <h2 className={`text-4xl font-black italic uppercase tracking-tighter mb-4 ${mysteryResult.win ? 'text-primary animate-pulse' : 'text-slate-500'}`}>
                            {mysteryResult.win ? 'WINNER!' : 'BETTER LUCK NEXT TIME'}
                        </h2>
                        <p className="text-lg font-black text-white italic uppercase tracking-widest mb-12 opacity-80">
                            {mysteryResult.description}
                        </p>

                        <button onClick={() => setMysteryResult(null)}
                            className="w-full py-6 rounded-[24px] bg-[#1a1f35] border border-white/5 text-white font-black text-xs uppercase tracking-widest italic hover:bg-white/5 transition-all">
                            Back to Store
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


