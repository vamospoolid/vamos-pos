import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, RefreshCw, AlertCircle, Trash2, Phone, Mail, Star, Target, Shield, ArrowRight } from 'lucide-react';
import { membersApi } from '../services/api';
import type { Member } from '../services/api';
import { vamosAlert, vamosConfirm } from '../utils/dialog';

const Players: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [saving, setSaving] = useState(false);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await membersApi.getAll();
            const data = (res.data as unknown as { data?: Member[] })?.data ?? res.data;
            setMembers(Array.isArray(data) ? data : []);
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(anyErr?.response?.data?.message ?? anyErr?.message ?? 'PROTOCOL_ERROR: FAILED_TO_FETCH_OPERATIVES');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) return;
        setSaving(true);
        try {
            await membersApi.create(form);
            setShowAdd(false);
            setForm({ name: '', email: '', phone: '' });
            fetchMembers();
            vamosAlert('New Operative Provisioned successfully.');
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } } };
            vamosAlert(anyErr?.response?.data?.message ?? 'Filing Error: Authorization Denied.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!(await vamosConfirm(`Decommission Operative "${name.toUpperCase()}"?`))) return;
        try {
            await membersApi.delete(id);
            fetchMembers();
        } catch {
            vamosAlert('Decommissioning Protocol Failed.');
        }
    };

    const filtered = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.phone ?? '').includes(searchTerm) ||
        (m.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-20 animate-in">
            {/* ── COMMAND HEADER ─────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 italic">Intelligence Bureau</p>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Operative <span className="text-primary">Registry</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">{members.length} OPERATIVES ACTIVE IN SECTOR</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={fetchMembers}
                        className="p-4 rounded-2xl bg-[#1a1f35]/40 border border-white/5 text-slate-500 hover:text-primary transition-all active:scale-95 group"
                    >
                        <RefreshCw size={22} className={loading ? 'animate-spin text-primary' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="fiery-btn-primary px-8 py-4 text-[10px] flex items-center gap-3"
                    >
                        <UserPlus size={18} strokeWidth={3} />
                        Provision Operative
                    </button>
                </div>
            </div>

            {/* ── SEARCH PROTOCOL ────────────────────────────────────────────────── */}
            <div className="relative group max-w-2xl">
                <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors pointer-events-none" />
                <input
                    type="text"
                    placeholder="SCAN BY NAME, COMMS, OR EMAIL..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="fiery-input w-full !pl-16 !py-5 uppercase text-xs tracking-widest placeholder:text-slate-700"
                />
            </div>

            {/* ── ERROR ALERT ────────────────────────────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-4 p-6 rounded-[32px] bg-rose-500/5 border border-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest animate-in italic">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={fetchMembers} className="ml-auto px-6 py-2 bg-rose-500/10 rounded-xl hover:bg-rose-500/20 transition-all border border-rose-500/20">RE-INITIATE</button>
                </div>
            )}

            {/* ── OPERATIVE GRID ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-32 rounded-[32px] bg-[#1a1f35]/20 border border-white/5 animate-pulse" />
                    ))
                ) : filtered.length === 0 ? (
                    <div className="md:col-span-2 py-32 text-center fiery-card bg-[#1a1f35]/10 flex flex-col items-center justify-center border-dashed border-white/10">
                        <div className="w-20 h-20 bg-[#101423] rounded-[32px] border border-white/5 flex items-center justify-center mb-8 shadow-inner">
                            <Target size={40} className="text-slate-800" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Zero Intel Found</h3>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3 italic">ADJUST SCAN PARAMETERS FOR TARGET ACQUISITION</p>
                    </div>
                ) : (
                    filtered.map((m, i) => (
                        <div
                            key={m.id}
                            className="fiery-card p-4 md:p-6 group hover:bg-[#1e2540]/60 transition-all duration-300 flex items-center gap-6 border-2 border-transparent hover:border-primary/20"
                        >
                            {/* RANK INDICATOR */}
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 rounded-[28px] bg-[#101423] border border-white/5 flex items-center justify-center font-black text-2xl text-slate-700 group-hover:text-primary group-hover:border-primary/40 transition-all shadow-inner relative overflow-hidden italic">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {m.name.charAt(0).toUpperCase()}
                                </div>
                                {i < 3 && !searchTerm && (
                                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-[#101423] shadow-lg fiery-glow">
                                        <Star size={12} className="text-white" fill="currentColor" />
                                    </div>
                                )}
                            </div>

                            {/* INTEL BLOCK */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-4">
                                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter group-hover:text-primary transition-colors truncate">{m.name}</h4>
                                    {(m.loyaltyPoints ?? 0) > 0 && (
                                        <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-2">
                                            <Shield size={10} className="text-primary" fill="currentColor" />
                                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">{m.loyaltyPoints} PTS</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                                    {m.phone && (
                                        <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                            <Phone size={14} className="text-slate-700" /> {m.phone}
                                        </span>
                                    )}
                                    {m.email && (
                                        <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                            <Mail size={14} className="text-slate-700" />
                                            <span className="truncate max-w-[140px] lowercase text-[11px] font-mono opacity-60 font-medium tracking-normal">{m.email}</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* ACTION HUB */}
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <button
                                    onClick={() => handleDelete(m.id, m.name)}
                                    className="p-3.5 rounded-2xl bg-[#101423] border border-white/5 text-slate-600 hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all active:scale-90"
                                    title="Decommission Operative"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── PROVISIONING MODAL ────────────────────────────────────────────── */}
            {showAdd && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                    <div className="absolute inset-0 bg-[#0a0d18]/90 backdrop-blur-xl animate-in" onClick={() => setShowAdd(false)} />
                    <div className="w-full max-w-xl fiery-card rounded-[48px] p-6 md:p-12 border-2 border-primary/20 shadow-[0_0_80px_rgba(59,130,246,0.2)] relative animate-in overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <UserPlus size={160} className="text-primary" />
                        </div>

                        <div className="mb-10 relative">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic">Protocol Authorization</p>
                            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Provision Operative</h2>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-8 relative">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">IDENTIFICATION (FULL NAME) *</label>
                                <input
                                    type="text"
                                    placeholder="DESIGNATE OPERATIVE NAME..."
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="fiery-input w-full uppercase"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">COMMS PROTOCOL (PHONE)</label>
                                    <input
                                        type="tel"
                                        placeholder="+62..."
                                        value={form.phone}
                                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                        className="fiery-input w-full"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">DIGITAL SIGNATURE (EMAIL)</label>
                                    <input
                                        type="email"
                                        placeholder="OP@SECTOR.GG"
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        className="fiery-input w-full lowercase font-mono placeholder:uppercase"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAdd(false)}
                                    className="flex-1 py-5 rounded-[24px] bg-white/5 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all italic border border-white/5 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !form.name}
                                    className="fiery-btn-primary flex-[2] py-5 rounded-[24px] text-[10px] uppercase tracking-widest font-black italic disabled:opacity-50"
                                >
                                    {saving ? 'AUTHORIZING...' : (
                                        <span className="flex items-center gap-3 justify-center">
                                            Authorize Entry <ArrowRight size={18} strokeWidth={3} />
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Players;
