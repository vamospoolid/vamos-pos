import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit3, Megaphone, CheckCircle2, XCircle, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { announcementsApi, type Announcement } from '../services/api';
import { vamosAlert, vamosConfirm } from '../utils/dialog';

const Announcements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Announcement | null>(null);

    // Form state
    const [form, setForm] = useState({
        title: '',
        content: '',
        isActive: true,
        priority: 0,
        imageUrl: '',
        targetUrl: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await announcementsApi.getAll();
            setAnnouncements(res.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal memuat data bulletin');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenModal = (item?: Announcement) => {
        if (item) {
            setEditingItem(item);
            setForm({
                title: item.title,
                content: item.content,
                isActive: item.isActive,
                priority: item.priority,
                imageUrl: item.imageUrl || '',
                targetUrl: item.targetUrl || ''
            });
        } else {
            setEditingItem(null);
            setForm({
                title: '',
                content: '',
                isActive: true,
                priority: 0,
                imageUrl: '',
                targetUrl: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingItem) {
                await announcementsApi.update(editingItem.id, form);
                vamosAlert('Bulletin berhasil diperbarui');
            } else {
                await announcementsApi.create(form);
                vamosAlert('Bulletin baru berhasil dibuat');
            }
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Terjadi kesalahan');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (await vamosConfirm('Hapus bulletin ini? Ini akan hilang dari aplikasi Player.')) {
            try {
                await announcementsApi.delete(id);
                fetchData();
            } catch (err: any) {
                vamosAlert('Gagal menghapus');
            }
        }
    };

    return (
        <div className="space-y-10 pb-20 animate-in">
            {/* ── COMMAND HEADER ─────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 italic">Broadcast Control</p>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Bulletin <span className="text-primary">Command</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Signal Transmission Ready</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={fetchData}
                        className="p-4 rounded-2xl bg-[#1a1f35]/40 border border-white/5 text-slate-500 hover:text-primary transition-all active:scale-95 group"
                    >
                        <RefreshCw size={22} className={loading ? 'animate-spin text-primary' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="fiery-btn-primary px-8 py-4 text-[10px] flex items-center gap-3"
                    >
                        <Plus size={18} strokeWidth={3} />
                        BRDCST NEW INTEL
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[24px] flex items-center gap-4 text-rose-400 text-[11px] font-black uppercase italic tracking-widest animate-in slide-in-from-top-4">
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            {/* ── TRANSMISSION LIST ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-64 bg-[#1a1f35]/20 rounded-[32px] animate-pulse border border-white/5" />
                    ))
                ) : announcements.length === 0 ? (
                    <div className="col-span-full py-32 text-center fiery-card flex flex-col items-center justify-center border-dashed border-2">
                        <Megaphone size={64} className="text-slate-800 mb-8" />
                        <h3 className="text-2xl font-black text-slate-700 uppercase italic tracking-tighter">No Active Transmissions</h3>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4 italic">START BROADCASTING TACTICAL INFO TO ALL OPERATIVES</p>
                    </div>
                ) : (
                    announcements.map(item => (
                        <div key={item.id} className="fiery-card p-6 md:p-8 flex flex-col justify-between border-2 border-transparent hover:border-primary/30 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-all duration-700" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic border shadow-lg ${item.isActive
                                        ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                        : 'bg-[#101423] text-slate-500 border-white/5'
                                        }`}>
                                        {item.isActive ? '• LIVE SIGNAL' : 'OFFLINE DRAFT'}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                        <button
                                            onClick={() => handleOpenModal(item)}
                                            className="p-3 bg-[#101423] rounded-xl text-slate-400 hover:text-primary border border-white/5 hover:border-primary/30 transition-all"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-3 bg-[#101423] rounded-xl text-slate-400 hover:text-rose-500 border border-white/5 hover:border-rose-500/30 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4 line-clamp-1 group-hover:text-primary transition-colors duration-300">{item.title}</h3>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-3 italic opacity-80 group-hover:opacity-100 transition-opacity">{item.content}</p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-widest">PRIORITY LVL</span>
                                    <span className="text-lg font-black text-white italic">{item.priority}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Info size={14} className="text-primary" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Transmission Stable</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── BROADCAST AUTHORIZATION MODAL ───────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0a0c14]/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-xl bg-[#101423] rounded-[40px] p-6 md:p-10 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none" />

                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic">Protocol: Broadcast</p>
                                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                                    {editingItem ? 'Edit Signal' : 'New Transmission'}
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-3 rounded-2xl bg-[#1a1f35] text-slate-500 hover:text-white border border-white/5 transition-all"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1 italic">Intelligence Codename / Title</label>
                                <input
                                    type="text"
                                    required
                                    className="fiery-input !py-5 !px-6"
                                    placeholder="GRAND TOURNAMENT 2026"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1 italic">Transmission Content / Intel Data</label>
                                <textarea
                                    required
                                    rows={5}
                                    className="fiery-input !py-5 !px-6 min-h-[160px] resize-none leading-relaxed"
                                    placeholder="Enter detailed intelligence for the operative community..."
                                    value={form.content}
                                    onChange={e => setForm({ ...form, content: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1 italic">Urgency Scale (0-10)</label>
                                    <input
                                        type="number"
                                        className="fiery-input !py-5 !px-6"
                                        value={form.priority}
                                        onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1 italic">Signal Status</label>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                        className={`w-full py-5 rounded-[22px] border-2 font-black text-[10px] uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 ${form.isActive
                                            ? 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                            }`}
                                    >
                                        {form.isActive ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                        {form.isActive ? 'LINK ACTIVE' : 'STEALTH DRAFT'}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full fiery-btn-primary py-6 text-base flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 transition-all mt-4"
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw size={20} className="animate-spin" />
                                        TRANSMITTING SIGNAL...
                                    </>
                                ) : (
                                    <>
                                        <Megaphone size={20} strokeWidth={3} />
                                        {editingItem ? 'AUTHORIZE UPDATE' : 'SEND BROADCAST'}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcements;
