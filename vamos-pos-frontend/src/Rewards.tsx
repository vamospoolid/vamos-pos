import { useState, useEffect, useMemo } from 'react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';
import {
    Gift, Plus, Trash2, Loader2, Star, CheckCircle2, Clock,
    Package, Edit2, X, Users, Award, Zap,
    ShoppingBag, RefreshCw, Info
} from 'lucide-react';

// ─── Tier Config ──────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { color: string; bg: string; label: string; min: number }> = {
    BRONZE: { color: '#cd7f32', bg: 'rgba(205,127,50,0.12)', label: 'Bronze', min: 0 },
    SILVER: { color: '#a8a9ad', bg: 'rgba(168,169,173,0.12)', label: 'Silver', min: 1000 },
    GOLD: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Gold', min: 2000 },
    PLATINUM: { color: '#00aaff', bg: 'rgba(0,170,255,0.12)', label: 'Platinum', min: 3000 },
};

export default function Rewards() {
    const [activeTab, setActiveTab] = useState<'catalog' | 'redemptions'>('catalog');
    const [rewards, setRewards] = useState<any[]>([]);
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editReward, setEditReward] = useState<any>(null);
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Form state
    const [form, setForm] = useState({
        title: '', description: '', pointsRequired: '', stock: '', imageUrl: ''
    });

    // Redeem form
    const [redeemMemberQuery, setRedeemMemberQuery] = useState('');
    const [redeemMemberId, setRedeemMemberId] = useState('');
    const [redeemRewardId, setRedeemRewardId] = useState('');
    const [redeeming, setRedeeming] = useState(false);

    const fetchAll = async () => {
        try {
            const [rewardsRes, redemptionsRes, membersRes] = await Promise.all([
                api.get('/rewards'),
                api.get('/rewards/redemptions'),
                api.get('/members'),
            ]);
            setRewards(rewardsRes.data.data || []);
            setRedemptions(redemptionsRes.data.data || []);
            setMembers(membersRes.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const openCreate = () => {
        setEditReward(null);
        setForm({ title: '', description: '', pointsRequired: '', stock: '999', imageUrl: '' });
        setShowModal(true);
    };

    const openEdit = (r: any) => {
        setEditReward(r);
        setForm({
            title: r.title,
            description: r.description || '',
            pointsRequired: String(r.pointsRequired),
            stock: String(r.stock),
            imageUrl: r.imageUrl || '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.title || !form.pointsRequired) { vamosAlert('Isi judul dan poin yang dibutuhkan.'); return; }
        setSaving(true);
        try {
            if (editReward) {
                await api.put(`/rewards/${editReward.id}`, {
                    title: form.title, description: form.description,
                    pointsRequired: Number(form.pointsRequired),
                    stock: Number(form.stock || 999),
                    imageUrl: form.imageUrl || null,
                });
            } else {
                await api.post('/rewards', {
                    title: form.title, description: form.description,
                    pointsRequired: Number(form.pointsRequired),
                    stock: Number(form.stock || 999),
                    imageUrl: form.imageUrl || null,
                });
            }
            setShowModal(false);
            fetchAll();
        } catch (err: any) {
            vamosAlert(err?.response?.data?.message || 'Gagal menyimpan reward.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!(await vamosConfirm(`Nonaktifkan reward "${title}"?`))) return;
        try {
            await api.delete(`/rewards/${id}`);
            setRewards(prev => prev.filter(r => r.id !== id));
        } catch { vamosAlert('Gagal menghapus reward.'); }
    };

    const handleFulfill = async (id: string) => {
        try {
            await api.put(`/rewards/redemptions/${id}/fulfill`);
            setRedemptions(prev => prev.map(r => r.id === id ? { ...r, status: 'DELIVERED' } : r));
        } catch { vamosAlert('Gagal mengupdate status.'); }
    };

    const handleRedeem = async () => {
        if (!redeemMemberId || !redeemRewardId) { vamosAlert('Pilih member dan reward.'); return; }
        setRedeeming(true);
        try {
            await api.post('/rewards/redeem', { memberId: redeemMemberId, rewardId: redeemRewardId });
            setShowRedeemModal(false);
            setRedeemMemberId('');
            setRedeemMemberQuery('');
            setRedeemRewardId('');
            fetchAll();
        } catch (err: any) {
            vamosAlert(err?.response?.data?.message || 'Gagal melakukan penukaran.');
        } finally {
            setRedeeming(false);
        }
    };

    // ─── Stats ────────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const totalRedeemed = redemptions.length;
        const pending = redemptions.filter(r => r.status === 'PENDING').length;
        const delivered = redemptions.filter(r => r.status === 'DELIVERED').length;
        const totalPtsUsed = redemptions.reduce((s: number, r: any) => s + (r.reward?.pointsRequired || 0), 0);
        return { totalRedeemed, pending, delivered, totalPtsUsed };
    }, [redemptions]);

    const filteredRedemptions = useMemo(() => {
        if (statusFilter === 'ALL') return redemptions;
        return redemptions.filter(r => r.status === statusFilter);
    }, [redemptions, statusFilter]);

    const redeemMember = members.find((m: any) => m.id === redeemMemberId);
    const redeemRewardObj = rewards.find((r: any) => r.id === redeemRewardId);

    if (loading) return (
        <div className="flex-1 bg-[#0a0a0a] min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#f59e0b]" />
                <p className="text-gray-500 font-mono text-sm tracking-widest">LOADING REWARDS...</p>
            </div>
        </div>
    );

    return (
        <div className="fade-in">

            {/* ─── Header ──────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Rewards & Loyalty</h1>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Manage player progression and prize fulfillment</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowRedeemModal(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border border-[#f59e0b]/30 text-[#f59e0b] bg-[#f59e0b]/5 hover:bg-[#f59e0b]/10 active:scale-95 shadow-lg shadow-orange-500/5"
                    >
                        <Zap className="w-4 h-4" /> Tukar Poin Member
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all bg-[#f59e0b] text-[#0a0a0a] hover:bg-[#ffb020] active:scale-95 shadow-lg shadow-orange-500/10"
                    >
                        <Plus className="w-4 h-4" /> Tambah Reward
                    </button>
                </div>
            </div>

            {/* ─── Stats Cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Total Reward', value: rewards.length, icon: <Gift className="w-5 h-5" />, color: '#f59e0b', bg: 'rgba(245,158,11,0.05)' },
                    { label: 'Ditukar', value: stats.totalRedeemed, icon: <ShoppingBag className="w-5 h-5" />, color: 'var(--color-vamos-neon)', bg: 'rgba(0,255,102,0.05)' },
                    { label: 'Pending', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: '#ff9900', bg: 'rgba(255,153,0,0.05)' },
                    { label: 'Poin Digunakan', value: stats.totalPtsUsed.toLocaleString('id-ID'), icon: <Star className="w-5 h-5" />, color: '#00aaff', bg: 'rgba(0,170,255,0.05)' },
                ].map((s, i) => (
                    <div key={i} className="glass-panel p-6 border-white/5 relative group transition-all hover:border-white/10 hover:bg-white/[0.04]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-xl" style={{ background: s.bg, color: s.color }}>
                                {s.icon}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{s.label}</p>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-white font-mono">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ─── Tier Guide ───────────────────────────────────────────── */}
            <div className="glass-panel p-6 border-white/5 mb-8 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b]">
                            <Award size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Sistem Tier Member</h3>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Automated progression benchmarks</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                        <Info size={14} className="text-[#f59e0b]" />
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                            Dapatkan <span className="text-[#f59e0b]">1 poin</span> / <span className="text-[#f59e0b]">Rp 10.000</span> pengeluaran
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
                        <div key={key} className="relative group p-4 rounded-2xl border transition-all hover:bg-white/[0.02]"
                            style={{ background: 'rgba(255,255,255,0.01)', borderColor: `${cfg.color}15` }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner"
                                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}20` }}>
                                    {key === 'PLATINUM' ? '💎' : key === 'GOLD' ? '🥇' : key === 'SILVER' ? '🥈' : '🥉'}
                                </div>
                                <div>
                                    <p className="font-black text-xs uppercase tracking-widest mb-0.5" style={{ color: cfg.color }}>{cfg.label}</p>
                                    <p className="text-[10px] font-bold text-zinc-500 font-mono tracking-tighter">
                                        {cfg.min > 0 ? `≥ ${cfg.min.toLocaleString()} PTS` : 'ENTRY LEVEL'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Tab Navigation ───────────────────────────────────────── */}
            <div className="flex gap-4 mb-8 border-b border-white/5 px-2">
                {[
                    { key: 'catalog', label: 'Reward Catalog', icon: <Gift className="w-4 h-4" /> },
                    { key: 'redemptions', label: `Redemption Requests`, count: stats.pending, icon: <Package className="w-4 h-4" /> },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`group flex items-center gap-2 pb-4 px-2 font-black text-[11px] uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.key ? 'text-[#f59e0b]' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-[9px] border border-orange-500/20">
                                {tab.count}
                            </span>
                        )}
                        {activeTab === tab.key && (
                            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        )}
                    </button>
                ))}
            </div>

            {/* ─── Catalog Tab ──────────────────────────────────────────── */}
            {activeTab === 'catalog' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {rewards.map(reward => (
                        <div key={reward.id}
                            className="glass-panel group relative flex flex-col h-full border-white/5 hover:border-[#f59e0b]/30 transition-all duration-300 hover:-translate-y-1">

                            {/* Card Image/Icon */}
                            <div className="aspect-[16/10] overflow-hidden relative bg-zinc-900 flex items-center justify-center border-b border-white/5">
                                {reward.imageUrl ? (
                                    <img src={reward.imageUrl} alt={reward.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-900 to-[#111]">
                                        <Gift className="w-10 h-10 text-zinc-800" />
                                        <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">No Visual Data</p>
                                    </div>
                                )}

                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                    <button onClick={() => openEdit(reward)}
                                        className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/10 backdrop-blur-md">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(reward.id, reward.title)}
                                        className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all border border-red-500/10 backdrop-blur-md">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Stock Badge */}
                                <div className="absolute top-3 left-3">
                                    <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md shadow-lg ${reward.stock > 10 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                        STOCK: {reward.stock === 999 ? '∞' : reward.stock}
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-black text-xs text-white uppercase tracking-tight line-clamp-1 group-hover:text-[#f59e0b] transition-colors">{reward.title}</h3>
                                </div>
                                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed line-clamp-2 mb-4 h-8">{reward.description || 'Exclusive member reward.'}</p>

                                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#f59e0b]/5 border border-[#f59e0b]/10">
                                        <Star className="w-3.5 h-3.5 text-[#f59e0b]" fill="#f59e0b" />
                                        <span className="font-black text-sm text-[#f59e0b] font-mono tracking-tighter">{reward.pointsRequired.toLocaleString()}</span>
                                        <span className="text-[8px] font-black text-[#f59e0b]/60 uppercase tracking-tighter">PTS</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">
                                            {reward._count?.redemptions || 0} REDEEMED
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {rewards.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center glass-panel border-dashed border-zinc-800">
                            <Gift className="w-12 h-12 text-zinc-800 mb-4" />
                            <p className="text-zinc-600 font-black text-[10px] uppercase tracking-widest">Catalog is currently empty</p>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Redemptions Tab ──────────────────────────────────────── */}
            {activeTab === 'redemptions' && (
                <div>
                    {/* Filter */}
                    <div className="flex gap-2 mb-5">
                        {['ALL', 'PENDING', 'DELIVERED'].map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={statusFilter === s ? {
                                    background: '#f59e0b', color: '#0a0a0a'
                                } : {
                                    background: '#141414', color: '#6b7280', border: '1px solid #222'
                                }}>
                                {s === 'ALL' ? 'Semua' : s === 'PENDING' ? '⏳ Menunggu' : '✅ Selesai'}
                                {s !== 'ALL' && (
                                    <span className="ml-1 opacity-70">
                                        ({redemptions.filter(r => r.status === s).length})
                                    </span>
                                )}
                            </button>
                        ))}
                        <button onClick={fetchAll}
                            className="ml-auto text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead style={{ background: '#0f0f0f' }}>
                                <tr className="border-b border-[#222]">
                                    {['Waktu', 'Member', 'Reward', 'Poin', 'Status', 'Aksi'].map((col, i) => (
                                        <th key={col} className={`px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-500 ${i >= 3 ? 'text-center' : 'text-left'}`}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRedemptions.map(r => {
                                    const tierCfg = TIER_CONFIG[r.member?.tier || 'BRONZE'];
                                    return (
                                        <tr key={r.id} className="border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors">
                                            <td className="px-5 py-4 text-gray-500 font-mono text-xs">
                                                {new Date(r.claimedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                <br />{new Date(r.claimedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                                                        style={{ background: tierCfg.bg, color: tierCfg.color, border: `1px solid ${tierCfg.color}40` }}>
                                                        {r.member?.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-white">{r.member?.name}</p>
                                                        <p className="text-[10px]" style={{ color: tierCfg.color }}>{tierCfg.label}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-sm text-white">{r.reward?.title}</p>
                                                <p className="text-[10px] text-gray-600">{r.member?.phone}</p>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="flex items-center justify-center gap-1 font-black text-[#f59e0b]">
                                                    <Star className="w-3.5 h-3.5" fill="#f59e0b" />
                                                    {r.reward?.pointsRequired?.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                                                    style={r.status === 'DELIVERED' ? {
                                                        background: 'rgba(0,255,102,0.1)', color: '#00ff66', border: '1px solid rgba(0,255,102,0.2)'
                                                    } : {
                                                        background: 'rgba(255,153,0,0.1)', color: '#ff9900', border: '1px solid rgba(255,153,0,0.2)'
                                                    }}>
                                                    {r.status === 'DELIVERED' ? <><CheckCircle2 className="w-3 h-3" /> Selesai</> : <><Clock className="w-3 h-3" /> Menunggu</>}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {r.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleFulfill(r.id)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                                                        style={{ background: 'rgba(0,255,102,0.1)', color: '#00ff66', border: '1px solid rgba(0,255,102,0.2)' }}
                                                    >
                                                        ✓ Serahkan
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredRedemptions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center">
                                            <Package className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                            <p className="text-gray-600">Belum ada permintaan penukaran.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── Create/Edit Reward Modal ─────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#222] rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Gift className="w-5 h-5 text-[#f59e0b]" />
                                {editReward ? 'Edit Reward' : 'Tambah Reward Baru'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { label: 'Nama Reward *', key: 'title', placeholder: 'Contoh: Free Play 1 Jam' },
                                { label: 'Deskripsi', key: 'description', placeholder: 'Keterangan singkat reward ini...' },
                                { label: 'URL Gambar (opsional)', key: 'imageUrl', placeholder: 'https://...' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{f.label}</label>
                                    <input
                                        value={(form as any)[f.key]}
                                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f59e0b] transition-colors placeholder:text-gray-700"
                                    />
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Poin Dibutuhkan *</label>
                                    <div className="relative">
                                        <Star className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#f59e0b]" fill="#f59e0b" />
                                        <input
                                            type="number" min="1"
                                            value={form.pointsRequired}
                                            onChange={e => setForm(prev => ({ ...prev, pointsRequired: e.target.value }))}
                                            placeholder="500"
                                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#f59e0b] font-mono font-bold focus:outline-none focus:border-[#f59e0b] transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Stok</label>
                                    <input
                                        type="number" min="0"
                                        value={form.stock}
                                        onChange={e => setForm(prev => ({ ...prev, stock: e.target.value }))}
                                        placeholder="999"
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#f59e0b] transition-colors"
                                    />
                                </div>
                            </div>
                            {/* Points quick-set */}
                            <div>
                                <p className="text-[10px] text-gray-600 mb-2">Quick set poin:</p>
                                <div className="flex gap-2 flex-wrap">
                                    {[250, 500, 1000, 2000, 5000].map(pts => (
                                        <button key={pts} onClick={() => setForm(prev => ({ ...prev, pointsRequired: String(pts) }))}
                                            className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                                            style={form.pointsRequired === String(pts) ? {
                                                background: '#f59e0b', color: '#0a0a0a'
                                            } : {
                                                background: '#141414', color: '#6b7280', border: '1px solid #2a2a2a'
                                            }}>
                                            {pts.toLocaleString()} pts
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 py-3 rounded-xl bg-transparent border border-[#2a2a2a] text-gray-400 font-semibold hover:bg-white/5 transition-all text-sm">
                                Batal
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                style={{ background: '#f59e0b', color: '#0a0a0a' }}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                                {saving ? 'Menyimpan...' : editReward ? 'Update Reward' : 'Simpan Reward'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Redeem Modal (POS cashier side) ─────────────────────── */}
            {showRedeemModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#222] rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Zap className="w-5 h-5 text-[#f59e0b]" />
                                Tukar Poin Member
                            </h2>
                            <button onClick={() => setShowRedeemModal(false)} className="text-gray-600 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Member search */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cari Member</label>
                                <div className="relative">
                                    <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        value={redeemMember ? redeemMember.name : redeemMemberQuery}
                                        onChange={e => { if (redeemMember) setRedeemMemberId(''); setRedeemMemberQuery(e.target.value); }}
                                        placeholder="Nama atau nomor HP..."
                                        className="w-full bg-[#0a0a0a] border rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none transition-colors"
                                        style={{ borderColor: redeemMember ? '#f59e0b' : '#2a2a2a', color: redeemMember ? '#f59e0b' : '#fff' }}
                                    />
                                    {redeemMember && (
                                        <button onClick={() => { setRedeemMemberId(''); setRedeemMemberQuery(''); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                {/* Dropdown */}
                                {!redeemMember && redeemMemberQuery.length > 1 && (() => {
                                    const filtered = members.filter((m: any) =>
                                        m.name?.toLowerCase().includes(redeemMemberQuery.toLowerCase()) || m.phone?.includes(redeemMemberQuery)
                                    );
                                    return (
                                        <div className="mt-1 bg-[#111] border border-[#2a2a2a] rounded-xl max-h-40 overflow-y-auto">
                                            {filtered.length > 0 ? filtered.map((m: any) => {
                                                const tc = TIER_CONFIG[m.tier || 'BRONZE'];
                                                return (
                                                    <div key={m.id} onClick={() => { setRedeemMemberId(m.id); setRedeemMemberQuery(''); }}
                                                        className="px-4 py-3 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-[#1a1a1a] last:border-0">
                                                        <div>
                                                            <p className="font-bold text-sm text-white">{m.name}</p>
                                                            <p className="text-[10px] text-gray-500">{m.phone}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-sm flex items-center gap-1" style={{ color: tc.color }}>
                                                                <Star className="w-3 h-3" fill={tc.color} />
                                                                {(m.loyaltyPoints || 0).toLocaleString()}
                                                            </p>
                                                            <p className="text-[9px]" style={{ color: tc.color }}>{tc.label}</p>
                                                        </div>
                                                    </div>
                                                );
                                            }) : <div className="px-4 py-4 text-sm text-gray-500 text-center">Tidak ditemukan.</div>}
                                        </div>
                                    );
                                })()}
                                {/* Member card */}
                                {redeemMember && (() => {
                                    const tc = TIER_CONFIG[redeemMember.tier || 'BRONZE'];
                                    return (
                                        <div className="mt-2 flex items-center gap-3 bg-[#0a0a0a] border rounded-xl p-3"
                                            style={{ borderColor: `${tc.color}30` }}>
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black"
                                                style={{ background: tc.bg, color: tc.color }}>
                                                {redeemMember.name?.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm" style={{ color: tc.color }}>{redeemMember.name}</p>
                                                <p className="text-[11px] text-gray-500">{tc.label} · {redeemMember.phone}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-lg flex items-center gap-1" style={{ color: tc.color }}>
                                                    <Star className="w-4 h-4" fill={tc.color} />
                                                    {(redeemMember.loyaltyPoints || 0).toLocaleString()}
                                                </p>
                                                <p className="text-[10px] text-gray-500">poin tersedia</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Reward selection */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pilih Reward</label>
                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                    {rewards.map(r => {
                                        const canAfford = redeemMember ? redeemMember.loyaltyPoints >= r.pointsRequired : false;
                                        const isSelected = redeemRewardId === r.id;
                                        return (
                                            <button key={r.id} onClick={() => setRedeemRewardId(r.id)}
                                                disabled={!canAfford}
                                                className="w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                style={isSelected ? {
                                                    borderColor: '#f59e0b', background: 'rgba(245,158,11,0.08)'
                                                } : {
                                                    borderColor: '#2a2a2a', background: '#0a0a0a'
                                                }}>
                                                <div>
                                                    <p className={`font-bold text-sm ${isSelected ? 'text-[#f59e0b]' : 'text-white'}`}>{r.title}</p>
                                                    <p className="text-[10px] text-gray-500">{r.description}</p>
                                                </div>
                                                <div className="flex items-center gap-1 ml-3">
                                                    <Star className="w-3.5 h-3.5 text-[#f59e0b]" fill="#f59e0b" />
                                                    <span className="font-black text-sm text-[#f59e0b]">{r.pointsRequired.toLocaleString()}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Summary */}
                            {redeemMember && redeemRewardObj && (
                                <div className="bg-[#0a0a0a] border border-[#f59e0b]/20 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 mb-2">Ringkasan Penukaran:</p>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Poin sekarang</span>
                                        <span className="font-mono font-bold text-white">{redeemMember.loyaltyPoints.toLocaleString()} pts</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Digunakan</span>
                                        <span className="font-mono font-bold text-red-400">-{redeemRewardObj.pointsRequired.toLocaleString()} pts</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-[#2a2a2a] mt-2">
                                        <span className="font-bold text-gray-300">Sisa Poin</span>
                                        <span className="font-black font-mono text-[#f59e0b]">
                                            {(redeemMember.loyaltyPoints - redeemRewardObj.pointsRequired).toLocaleString()} pts
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button onClick={() => setShowRedeemModal(false)}
                                className="flex-1 py-3 rounded-xl bg-transparent border border-[#2a2a2a] text-gray-400 font-semibold text-sm">
                                Batal
                            </button>
                            <button
                                onClick={handleRedeem}
                                disabled={!redeemMemberId || !redeemRewardId || redeeming}
                                className="flex-[2] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                                style={{ background: '#f59e0b', color: '#0a0a0a' }}>
                                {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                {redeeming ? 'Memproses...' : 'Konfirmasi Penukaran'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
