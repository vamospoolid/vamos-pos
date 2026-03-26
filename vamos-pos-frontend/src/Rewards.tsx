import { useState, useEffect, useMemo } from 'react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';
import {
    Gift, Plus, Trash2, Loader2, Star, CheckCircle2, Clock,
    Package, Edit2, X, Users, Award, Zap,
    ShoppingBag, RefreshCw
} from 'lucide-react';


export default function Rewards() {
    const [activeTab, setActiveTab] = useState<'catalog' | 'redemptions' | 'logs'>('catalog');
    const [rewards, setRewards] = useState<any[]>([]);
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [pointLogs, setPointLogs] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editReward, setEditReward] = useState<any>(null);
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const [logSearch, setLogSearch] = useState('');
    const [logTypeFilter, setLogTypeFilter] = useState('ALL');
    const [showAdjustPointsModal, setShowAdjustPointsModal] = useState(false);
    const [adjustForm, setAdjustForm] = useState({ memberId: '', points: '', description: '' });
    const [processingExpiry, setProcessingExpiry] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');

    const [form, setForm] = useState({ title: '', description: '', pointsRequired: '', stock: '', imageUrl: '' });

    const [redeemMemberQuery, setRedeemMemberQuery] = useState('');
    const [redeemMemberId, setRedeemMemberId] = useState('');
    const [redeemRewardId, setRedeemRewardId] = useState('');
    const [redeeming, setRedeeming] = useState(false);

    const fetchAll = async () => {
        try {
            const [rewardsRes, redemptionsRes, logsRes, membersRes] = await Promise.all([
                api.get('/loyalty/rewards'),
                api.get('/loyalty/admin/redemptions'),
                api.get('/loyalty/admin/logs'),
                api.get('/members'),
            ]);
            setRewards(rewardsRes.data.data || []);
            setRedemptions(redemptionsRes.data.data || []);
            setPointLogs(logsRes.data.data || []);
            setMembers(membersRes.data.data || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const filteredLogs = useMemo(() => {
        return pointLogs.filter(log => {
            const matchesSearch = (log.member?.name?.toLowerCase() || '').includes(logSearch.toLowerCase()) || 
                                 (log.description?.toLowerCase() || '').includes(logSearch.toLowerCase());
            const matchesType = logTypeFilter === 'ALL' || log.type === logTypeFilter;
            return matchesSearch && matchesType;
        });
    }, [pointLogs, logSearch, logTypeFilter]);

    const filteredMembers = useMemo(() => {
        if (!memberSearch) return [];
        return members.filter(m => 
            m.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
            m.phone?.includes(memberSearch)
        ).slice(0, 5);
    }, [members, memberSearch]);

    const filteredRedemptions = useMemo(() => {
        if (statusFilter === 'ALL') return redemptions;
        return redemptions.filter(r => r.status === statusFilter);
    }, [redemptions, statusFilter]);

    const stats = useMemo(() => {
        const totalRedeemed = redemptions.length;
        const pending = redemptions.filter(r => r.status === 'PENDING').length;
        const delivered = redemptions.filter(r => r.status === 'DELIVERED').length;
        const totalPtsUsed = redemptions.reduce((s: number, r: any) => s + (r.reward?.pointsRequired || 0), 0);
        return { totalRedeemed, pending, delivered, totalPtsUsed };
    }, [redemptions]);

    const openCreate = () => {
        setEditReward(null);
        setForm({ title: '', description: '', pointsRequired: '', stock: '999', imageUrl: '' });
        setShowModal(true);
    };

    const openEdit = (r: any) => {
        setEditReward(r);
        setForm({ title: r.title, description: r.description || '', pointsRequired: String(r.pointsRequired), stock: String(r.stock), imageUrl: r.imageUrl || '' });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.title || !form.pointsRequired) { vamosAlert('Mohon isi nama dan poin.'); return; }
        setSaving(true);
        try {
            const payload = { title: form.title, description: form.description, pointsRequired: Number(form.pointsRequired), stock: Number(form.stock || 999), imageUrl: form.imageUrl || null };
            if (editReward) await api.patch(`/loyalty/rewards/${editReward.id}`, payload);
            else await api.post('/loyalty/rewards', payload);
            setShowModal(false);
            fetchAll();
        } catch (err: any) {
            vamosAlert('Gagal menyimpan reward.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!(await vamosConfirm(`Deaktivasi reward "${title}"?`))) return;
        try {
            await api.delete(`/loyalty/rewards/${id}`);
            fetchAll();
        } catch { vamosAlert('Gagal menghapus reward.'); }
    };

    const handleAdjustPoints = async () => {
        if (!adjustForm.memberId || !adjustForm.points) return vamosAlert('Pilih member & isi poin.');
        setSaving(true);
        try {
            await api.post('/loyalty/admin/award-points', { memberId: adjustForm.memberId, points: Number(adjustForm.points), description: adjustForm.description || 'Adjustment manual admin' });
            vamosAlert('Poin diperbarui!');
            setShowAdjustPointsModal(false);
            setAdjustForm({ memberId: '', points: '', description: '' });
            fetchAll();
        } catch { vamosAlert('Gagal adjust poin.'); }
        finally { setSaving(false); }
    };

    const handleRunExpiry = async () => {
        if (!(await vamosConfirm(`Proses poin yang sudah kadaluarsa (>180 hari)?`))) return;
        setProcessingExpiry(true);
        try {
            const res = await api.post('/loyalty/admin/run-expiry');
            vamosAlert(res.data.message);
            fetchAll();
        } catch { vamosAlert('Gagal memproses expiry.'); }
        finally { setProcessingExpiry(false); }
    };

    const handleFulfill = async (id: string) => {
        try {
            await api.patch(`/loyalty/admin/redemptions/${id}`, { status: 'DELIVERED' });
            fetchAll();
        } catch { vamosAlert('Gagal update status.'); }
    };

    const handleRedeem = async () => {
        if (!redeemMemberId || !redeemRewardId) { vamosAlert('Pilih member & reward.'); return; }
        setRedeeming(true);
        try {
            await api.post('/loyalty/redeem', { memberId: redeemMemberId, rewardId: redeemRewardId });
            setShowRedeemModal(false);
            setRedeemMemberId('');
            setRedeemRewardId('');
            fetchAll();
            vamosAlert('Redeem berhasil!');
        } catch (err: any) {
            vamosAlert(err?.response?.data?.message || 'Gagal redeem.');
        } finally {
            setRedeeming(false);
        }
    };

    if (loading) return (
        <div className="flex-1 bg-[#0a0a0a] min-h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#f59e0b]" />
        </div>
    );

    const selectedMember = members.find(m => m.id === adjustForm.memberId);

    return (
        <div className="fade-in max-w-[1600px] mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Rewards & Loyalty</h1>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Award size={12} className="text-[#f59e0b]" /> Point management & gift fulfillment center
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowRedeemModal(true)} className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border border-[#f59e0b]/20 text-[#f59e0b] bg-[#f59e0b]/5 hover:bg-[#f59e0b]/10 active:scale-95 shadow-lg shadow-orange-500/5">
                        <Zap className="w-4 h-4" /> Tukar Poin
                    </button>
                    <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all bg-[#f59e0b] text-[#0a0a0a] hover:bg-[#ffb020] active:scale-95 shadow-lg shadow-orange-500/10">
                        <Plus className="w-4 h-4" /> Tambah Reward
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total Reward', value: rewards.filter(r => r.isActive).length, icon: <Gift size={20} />, color: '#f59e0b', bg: '#f59e0b10' },
                    { label: 'Total Penukaran', value: stats.totalRedeemed, icon: <ShoppingBag size={20} />, color: '#00ff66', bg: '#00ff6610' },
                    { label: 'Pending', value: stats.pending, icon: <Clock size={20} />, color: '#ff9900', bg: '#ff990010' },
                    { label: 'Poin Dipakai', value: stats.totalPtsUsed.toLocaleString(), icon: <Star size={20} />, color: '#00aaff', bg: '#00aaff10' },
                ].map((s, i) => (
                    <div key={i} className="glass-panel p-6 border-white/5 relative group transition-all hover:bg-white/[0.03]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-2xl" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{s.label}</p>
                        </div>
                        <p className="text-4xl font-black text-white font-mono tracking-tighter">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-6 mb-10 border-b border-white/5 px-2">
                {[
                    { key: 'catalog', label: 'Catalog', icon: <Gift size={16} /> },
                    { key: 'redemptions', label: 'Requests', count: stats.pending, icon: <Package size={16} /> },
                    { key: 'logs', label: 'Audit Trail', icon: <RefreshCw size={16} /> },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`group flex items-center gap-2.5 pb-5 px-1 font-black text-xs uppercase tracking-widest relative transition-all ${activeTab === tab.key ? 'text-[#f59e0b]' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        {tab.icon} {tab.label}
                        {tab.count !== undefined && tab.count > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-lg bg-red-500/10 text-red-500 text-[10px] border border-red-500/20">{tab.count}</span>}
                        {activeTab === tab.key && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.5)]" />}
                    </button>
                ))}
            </div>

            {activeTab === 'catalog' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {rewards.filter(r => r.isActive).map(reward => (
                        <div key={reward.id} className="glass-panel group relative border-white/5 hover:border-[#f59e0b]/30 transition-all flex flex-col overflow-hidden">
                            <div className="aspect-[16/10] bg-zinc-900 border-b border-white/5 overflow-hidden relative">
                                {reward.imageUrl ? <img src={reward.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /> : <div className="w-full h-full flex items-center justify-center text-zinc-800"><Gift size={48} /></div>}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                    <button onClick={() => openEdit(reward)} className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 hover:bg-white/20 active:scale-90"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(reward.id, reward.title)} className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 hover:bg-red-500/20 active:scale-90"><Trash2 size={18} /></button>
                                </div>
                                <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border backdrop-blur-md ${reward.stock > 10 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                    STOCK: {reward.stock === 999 ? '∞' : reward.stock}
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="font-black text-sm text-white uppercase tracking-tight mb-2 group-hover:text-[#f59e0b] transition-colors">{reward.title}</h3>
                                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed line-clamp-2 mb-6 h-9">{reward.description || 'Exclusive member reward for elite players.'}</p>
                                <div className="mt-auto flex items-center justify-between pt-5 border-t border-white/5">
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#f59e0b]/5 border border-[#f59e0b]/10">
                                        <Star size={16} fill="#f59e0b" className="text-[#f59e0b]" /> 
                                        <span className="font-black text-lg text-[#f59e0b] font-mono tracking-tighter leading-none">{reward.pointsRequired.toLocaleString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">REDEEMED</p>
                                        <p className="text-xs font-black text-zinc-400 font-mono italic">{reward._count?.redemptions || 0}x</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {rewards.length === 0 && <div className="col-span-full py-32 text-center glass-panel border-dashed border-zinc-800 flex flex-col items-center justify-center gap-4">
                        <Gift className="w-12 h-12 text-zinc-800" />
                        <p className="text-zinc-600 font-black text-xs uppercase tracking-[0.3em]">No active rewards in catalog</p>
                    </div>}
                </div>
            )}

            {activeTab === 'redemptions' && (
                <div className="space-y-6">
                    <div className="flex gap-2">
                        {['ALL', 'PENDING', 'DELIVERED'].map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === s ? 'bg-[#f59e0b] text-black border-[#f59e0b] shadow-lg shadow-orange-500/20' : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:border-white/10'}`}>
                                {s === 'ALL' ? 'Semua' : s === 'PENDING' ? '⏳ Menunggu' : '✅ Selesai'}
                            </button>
                        ))}
                    </div>
                    <div className="glass-panel border-white/5 overflow-hidden">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-[#0f0f0f] text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                                    <th className="px-8 py-5 text-left font-black">Timestamp</th>
                                    <th className="px-8 py-5 text-left font-black">Player Identity</th>
                                    <th className="px-8 py-5 text-left font-black">Item Info</th>
                                    <th className="px-8 py-5 text-center font-black">Point Burn</th>
                                    <th className="px-8 py-5 text-center font-black">Status</th>
                                    <th className="px-8 py-5 text-right font-black">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredRedemptions.map(r => (
                                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-5">
                                            <p className="text-[10px] font-mono font-black text-zinc-400">{new Date(r.claimedAt).toLocaleDateString()}</p>
                                            <p className="text-[10px] font-mono text-zinc-600">{new Date(r.claimedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="font-black text-xs text-white uppercase tracking-tight">{r.member?.name}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono">{r.member?.phone}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="font-black text-[11px] text-[#f59e0b] uppercase tracking-wide flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <Package size={12} /> {r.reward?.title}
                                            </p>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="font-mono font-black text-sm text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.2)]">-{r.pointsUsed.toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${r.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                                <div className={`w-1 h-1 rounded-full ${r.status === 'DELIVERED' ? 'bg-emerald-400' : 'bg-orange-400 animate-pulse'}`} />
                                                {r.status === 'DELIVERED' ? 'Selesai' : 'Pending'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            {r.status === 'PENDING' && (
                                                <button onClick={() => handleFulfill(r.id)} className="px-4 py-2 bg-[#f59e0b] hover:bg-[#ffb020] text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Selesaikan</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredRedemptions.length === 0 && <div className="py-24 text-center text-zinc-700 font-black text-xs uppercase tracking-widest">No matching requests</div>}
                    </div>
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-6 relative">
                            <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Search player name or activity..." className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white focus:border-[#f59e0b] outline-none transition-all" />
                        </div>
                        <div className="md:col-span-3">
                            <select value={logTypeFilter} onChange={e => setLogTypeFilter(e.target.value)} className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-[#f59e0b] focus:border-[#f59e0b] outline-none cursor-pointer">
                                <option value="ALL">All Transactions</option>
                                <option value="EARN_GAME">Table Sessions</option>
                                <option value="EARN_FNB">F&B Orders</option>
                                <option value="REDEEM">Point Redemptions</option>
                                <option value="ADJUSTMENT">Manual Adjustments</option>
                                <option value="EXPIRY">Expired Points</option>
                            </select>
                        </div>
                        <div className="md:col-span-3 flex gap-2">
                            <button onClick={() => setShowAdjustPointsModal(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
                                <Plus size={14} /> Adjust
                            </button>
                            <button onClick={handleRunExpiry} disabled={processingExpiry} className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-zinc-900 text-zinc-400 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-50">
                                {processingExpiry ? <Loader2 size={12} className="animate-spin" /> : <Zap size={14} />} Expiry
                            </button>
                        </div>
                    </div>
                    <div className="glass-panel border-white/5 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#0f0f0f] text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                                    <th className="px-8 py-5 text-left">Date</th>
                                    <th className="px-8 py-5 text-left">Member</th>
                                    <th className="px-8 py-5 text-left">Transaction Type</th>
                                    <th className="px-8 py-5 text-left">Details</th>
                                    <th className="px-8 py-5 text-right">Amnt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-5 text-[10px] font-mono text-zinc-500">{new Date(log.createdAt).toLocaleDateString()}</td>
                                        <td className="px-8 py-5">
                                            <p className="font-black text-xs text-white uppercase tracking-tight">{log.member?.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/5 text-zinc-500 uppercase">{log.member?.tier}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${log.points > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                                {log.type.replace('EARN_', '')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-zinc-400 text-[11px] font-medium max-w-[300px] truncate italic">{log.description || '-'}</td>
                                        <td className={`px-8 py-5 text-right font-mono font-black text-base ${log.points > 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                            {log.points > 0 ? '+' : ''}{log.points.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredLogs.length === 0 && <div className="py-24 text-center text-zinc-700 font-black text-xs uppercase tracking-widest">No activities logged</div>}
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 scale-in">
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden">
                        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-br from-white/[0.03] to-transparent">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{editReward ? 'Update' : 'Create New'} Reward</h2>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Configure item properties and cost</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 flex items-center justify-center transition-all border border-white/5"><X size={20}/></button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">Reward Name</label>
                                    <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Free 1 Hour Private Table" className="w-full bg-[#070707] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-[#f59e0b] outline-none transition-all shadow-inner placeholder:opacity-20" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">Point Cost</label>
                                        <div className="relative">
                                            <input type="number" value={form.pointsRequired} onChange={e => setForm({...form, pointsRequired: e.target.value})} className="w-full bg-[#070707] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-base font-mono font-black text-[#f59e0b] focus:border-[#f59e0b] outline-none transition-all shadow-inner" />
                                            <Star size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f59e0b]/50" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">Available Stock</label>
                                        <div className="relative">
                                            <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full bg-[#070707] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-black text-white focus:border-[#f59e0b] outline-none transition-all shadow-inner" />
                                            <Package size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">Description</label>
                                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Briefly describe what players get..." className="w-full bg-[#070707] border border-white/10 rounded-2xl px-6 py-4 text-xs text-zinc-400 focus:border-[#f59e0b] outline-none transition-all h-24 shadow-inner resize-none" />
                                </div>
                            </div>
                            <button onClick={handleSave} disabled={saving} className="group w-full py-5 bg-[#f59e0b] hover:bg-[#ffb020] text-[#0a0a0a] rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-[0_10px_30px_rgba(245,158,11,0.2)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                {saving ? 'Verifying...' : 'Publish Reward'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAdjustPointsModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 scale-in">
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div>
                                <h2 className="text-3xl font-black text-emerald-400 italic italic tracking-tighter uppercase">Adjustment</h2>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Manual point manipulation</p>
                            </div>
                            <button onClick={() => setShowAdjustPointsModal(false)} className="w-10 h-10 rounded-2xl bg-white/5 text-zinc-500 flex items-center justify-center border border-white/5"><X/></button>
                        </div>
                        <div className="space-y-6">
                            <div className="relative">
                                <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search member by name..." className="w-full bg-[#070707] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xs font-black text-white outline-none focus:border-emerald-500 transition-all shadow-inner" />
                                {filteredMembers.length > 0 && (
                                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#111] border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl backdrop-blur-xl">
                                        {filteredMembers.map(m => (
                                            <button key={m.id} onClick={() => { setAdjustForm({...adjustForm, memberId: m.id}); setMemberSearch(m.name); }} className="w-full px-5 py-4 text-left group flex flex-col hover:bg-emerald-500/10 transition-all border-b border-white/5 last:border-0 text-zinc-400 hover:text-white">
                                                <span className="font-black text-[11px] uppercase tracking-tighter">{m.name}</span>
                                                <span className="text-[9px] font-bold text-zinc-600 font-mono tracking-widest uppercase">ID: {m.phone} | Bal: {m.loyaltyPoints} PTS</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {selectedMember && (
                                <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">Selected Player Profile</p>
                                        <p className="font-mono font-black text-emerald-400 text-sm mt-1 uppercase italic tracking-tighter">{selectedMember.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">Current Bal</p>
                                        <p className="font-mono font-black text-white text-base mt-1">{selectedMember.loyaltyPoints.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Adjust Value (+/-)</label>
                                <input type="number" placeholder="Enter amount..." value={adjustForm.points} onChange={e => setAdjustForm({...adjustForm, points: e.target.value})} className="w-full bg-[#070707] border border-white/10 rounded-2xl px-6 py-4 font-mono font-black text-2xl text-emerald-400 text-center focus:border-emerald-500 outline-none shadow-inner" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Reason / Notes</label>
                                <textarea placeholder="Why is this change being made?" value={adjustForm.description} onChange={e => setAdjustForm({...adjustForm, description: e.target.value})} className="w-full bg-[#070707] border border-white/10 rounded-2xl px-6 py-4 h-24 text-[11px] text-zinc-400 outline-none focus:border-emerald-500 transition-all shadow-inner resize-none italic" />
                            </div>

                            <button onClick={handleAdjustPoints} disabled={saving || !adjustForm.memberId || !adjustForm.points} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-[#0a0a0a] rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)] active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                Confirm Execution
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRedeemModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 scale-in">
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div>
                                <h2 className="text-3xl font-black text-orange-400 italic tracking-tighter uppercase">Execution</h2>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Manual point redemption process</p>
                            </div>
                            <button onClick={() => setShowRedeemModal(false)} className="w-10 h-10 rounded-2xl bg-white/5 text-zinc-500 flex items-center justify-center border border-white/5"><X/></button>
                        </div>
                        <div className="space-y-6">
                             <div className="relative">
                                <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <input value={redeemMemberQuery} onChange={e => { if (redeemMemberId) setRedeemMemberId(''); setRedeemMemberQuery(e.target.value); }} placeholder="Search member to redeem..." className="w-full bg-[#070707] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xs font-black text-white outline-none focus:border-orange-500 transition-all shadow-inner" />
                                {redeemMemberQuery && !redeemMemberId && (
                                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#111] border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl backdrop-blur-xl">
                                        {members.filter(m => m.name.toLowerCase().includes(redeemMemberQuery.toLowerCase())).slice(0, 5).map(m => (
                                            <button key={m.id} onClick={() => { setRedeemMemberId(m.id); setRedeemMemberQuery(m.name); }} className="w-full px-5 py-4 text-left group flex flex-col hover:bg-orange-500/10 transition-all border-b border-white/5 last:border-0 text-zinc-400 hover:text-white">
                                                <span className="font-black text-[11px] uppercase tracking-tighter">{m.name}</span>
                                                <span className="text-[9px] font-bold text-zinc-600 font-mono tracking-widest">BAL: {m.loyaltyPoints} PTS</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Select Reward Item</label>
                                <select value={redeemRewardId} onChange={e => setRedeemRewardId(e.target.value)} className="w-full bg-[#070707] border border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-white outline-none focus:border-orange-500 transition-all appearance-none cursor-pointer">
                                    <option value="">-- Choose Items --</option>
                                    {rewards.filter(r => r.stock > 0 && r.isActive).map(r => <option key={r.id} value={r.id}>{r.title.toUpperCase()} ({r.pointsRequired.toLocaleString()} PTS) - STOCK: {r.stock}</option>)}
                                </select>
                            </div>

                            {redeemMemberId && redeemRewardId && (
                                <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-3xl space-y-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[9px] font-black text-zinc-500 uppercase">Item Cost</p>
                                        <p className="font-mono font-black text-white">{rewards.find(r => r.id === redeemRewardId)?.pointsRequired.toLocaleString()} PTS</p>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-white/5 pt-3">
                                        <p className="text-[9px] font-black text-zinc-500 uppercase">Remaining Balance</p>
                                        <p className="font-mono font-black text-orange-400 text-lg">{(members.find(m => m.id === redeemMemberId)?.loyaltyPoints - rewards.find(r => r.id === redeemRewardId)?.pointsRequired).toLocaleString()} PTS</p>
                                    </div>
                                </div>
                            )}

                            <button onClick={handleRedeem} disabled={redeeming || !redeemMemberId || !redeemRewardId} className="w-full py-5 bg-orange-500 hover:bg-orange-400 text-[#0a0a0a] rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-[0_10px_30px_rgba(249,115,22,0.2)] active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3">
                                {redeeming ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                {redeeming ? 'Processing...' : 'Complete Redemption'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
