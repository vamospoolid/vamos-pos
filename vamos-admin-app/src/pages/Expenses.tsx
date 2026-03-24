import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Plus, TrendingDown, Trash2, Calendar, ArrowRight, Shield } from 'lucide-react';
import api from '../services/api';
import { vamosAlert, vamosConfirm } from '../utils/dialog';

const EXPENSE_CATS = ['Gaji', 'Operasional', 'Bahan Baku', 'Maintenance', 'DEBT', 'Lainnya'];

const Expenses: React.FC = () => {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ category: 'Operasional', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get('/expenses');
            const data = (r.data as any)?.data ?? r.data ?? [];
            setList(Array.isArray(data) ? data : []);
        }
        catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.amount) return;
        setSaving(true);
        try {
            await api.post('/expenses', { ...form, amount: Number(form.amount) });
            setShowAdd(false);
            setForm({ category: 'Operasional', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
            load();
            vamosAlert('Logistik recorded successfully.');
        } catch (e: any) {
            vamosAlert(e?.response?.data?.message ?? 'Authorization failure: entry denied.');
        }
        finally { setSaving(false); }
    };

    const del = async (id: string) => {
        if (!(await vamosConfirm('Redact this logistical entry?'))) return;
        await api.delete(`/expenses/${id}`).catch(() => vamosAlert('Deletion protocol failed.'));
        load();
    };

    const payDebt = async (id: string) => {
        if (!(await vamosConfirm('Selesaikan piutang ini? Saldo kasir akan bertambah.'))) return;
        try {
            await api.post(`/expenses/${id}/pay-debt`);
            vamosAlert('Piutang berhasil dilunasi!');
            load();
        } catch (e: any) {
            vamosAlert(e?.response?.data?.message || 'Gagal melunasi piutang.');
        }
    };

    const totalMonth = list.filter(e => {
        const d = new Date(e.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, e) => s + (e.amount ?? 0), 0);

    const CAT_STYLE: Record<string, { color: string, bg: string }> = {
        'Gaji': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
        'Operasional': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        'Bahan Baku': { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        'Maintenance': { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
        'DEBT': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
        'Lainnya': { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' },
    };

    const fmtK = (n: number) => n >= 1_000_000 ? `Rp ${(n / 1e6).toFixed(1)}M` : `Rp ${(n / 1000).toFixed(0)}K`;

    return (
        <div className="space-y-10 pb-20 animate-in">
            {/* ── COMMAND HEADER ─────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 italic">Logistics Command</p>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Outflow <span className="text-primary">Registry</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]" />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">REAL-TIME SECTOR DRAIN MONITOR</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={load}
                        className="p-4 rounded-2xl bg-[#1a1f35]/40 border border-white/5 text-slate-500 hover:text-primary transition-all active:scale-95 group"
                    >
                        <RefreshCw size={22} className={loading ? 'animate-spin text-primary' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="fiery-btn-primary px-8 py-4 text-[10px] flex items-center gap-3"
                    >
                        <Plus size={18} strokeWidth={3} />
                        Log Outflow
                    </button>
                </div>
            </div>

            {/* ── SECTOR DRAIN OVERVIEW ─────────────────────────────────────────── */}
            <div className="fiery-card-highlight p-8 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-rose-500/10 blur-[100px] pointer-events-none group-hover:bg-rose-500/20 transition-all duration-700"></div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 italic">Current Cycle Operational Drain</p>
                    <h2 className="text-5xl font-black text-rose-500 tracking-tighter italic uppercase leading-none">{fmtK(totalMonth)}</h2>
                </div>
                <div className="w-20 h-20 rounded-[32px] bg-rose-500/5 flex items-center justify-center border border-rose-500/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <TrendingDown size={40} className="text-rose-500" />
                </div>
            </div>

            {/* ── REGISTRY LIST ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-[32px] bg-[#1a1f35]/20 border border-white/5 animate-pulse" />)
                ) : list.length === 0 ? (
                    <div className="py-32 text-center fiery-card bg-[#1a1f35]/10 flex flex-col items-center justify-center border-dashed border-white/10">
                        <div className="w-20 h-20 bg-[#101423] rounded-[32px] border border-white/5 flex items-center justify-center mb-8 shadow-inner">
                            <Shield size={40} className="text-slate-800" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Budget Intact</h3>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 italic">ZERO OPERATIONAL DRAIN RECORDED IN CURRENT SECTOR</p>
                    </div>
                ) : (
                    list.map((e: any) => {
                        const style = CAT_STYLE[e.category] ?? CAT_STYLE['Lainnya'];
                        return (
                            <div key={e.id} className="fiery-card p-6 flex items-center gap-6 group hover:bg-[#1e2540]/60 transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                                <div
                                    className="w-16 h-16 rounded-[28px] flex items-center justify-center font-black text-xl italic shadow-inner border"
                                    style={{ color: style.color, backgroundColor: style.bg, borderColor: `${style.color}20` }}
                                >
                                    {(e.category ?? 'L').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter group-hover:text-primary transition-colors truncate">
                                        {e.description || e.category}
                                    </h4>
                                    {e.member && (
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest italic mt-1 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                            Member Impact: {e.member.name}
                                            {e.status === 'PENDING' && <span className="text-rose-500 ml-2 animate-pulse">[OUTSTANDING]</span>}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-[9px] font-black px-3 py-1 rounded-full bg-[#101423] text-slate-400 border border-white/5 uppercase tracking-widest italic">{e.category}</span>
                                        <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 italic uppercase tracking-widest">
                                            <Calendar size={14} className="opacity-50" />
                                            {new Date(e.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <p className="text-2xl font-black text-rose-500 italic tracking-tighter">
                                        {e.id.startsWith('temp') ? '...' : `-${fmtK(e.amount)}`}
                                    </p>
                                    <div className="flex gap-2">
                                        {e.isDebt && e.status === 'PENDING' && (
                                            <button
                                                onClick={() => payDebt(e.id)}
                                                className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-[#0a0d18] transition-all font-black text-[10px] uppercase tracking-widest italic"
                                            >
                                                Selesaikan
                                            </button>
                                        )}
                                        <button onClick={() => del(e.id)} className="p-3.5 rounded-2xl bg-[#101423] border border-white/5 text-slate-600 hover:text-rose-500 hover:border-rose-500/50 transition-all opacity-0 group-hover:opacity-100 active:scale-90">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── LOGISTICAL PROVISIONING MODAL ───────────────────────────────────── */}
            {showAdd && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-[#0a0d18]/90 backdrop-blur-xl animate-in" onClick={() => setShowAdd(false)} />
                    <div className="w-full max-w-xl fiery-card rounded-[48px] p-12 border-2 border-primary/20 shadow-[0_0_80px_rgba(59,130,246,0.2)] relative animate-in overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <TrendingDown size={160} className="text-rose-500" />
                        </div>

                        <div className="mb-10 relative">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic">Registry Authorization</p>
                            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Log Outflow</h2>
                        </div>

                        <form onSubmit={add} className="space-y-8 relative">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">DEPLOYMENT CLASS (CATEGORY)</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className="fiery-input w-full uppercase appearance-none"
                                >
                                    {EXPENSE_CATS.map(c => (
                                        <option key={c} value={c} className="bg-[#101423]">
                                            {c === 'DEBT' ? 'PIUTANG' : c.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">DRAIN MAGNITUDE (AMOUNT IDR) *</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 font-black text-xs">IDR</div>
                                    <input
                                        type="number"
                                        value={form.amount}
                                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                        placeholder="0"
                                        className="fiery-input w-full !pl-16 font-mono text-lg"
                                        required
                                        min={0}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3 md:col-span-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">PROTOCOLS (DESCRIPTION)</label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="DESIGNATE PURPOSE..."
                                        className="fiery-input w-full uppercase text-xs"
                                    />
                                </div>
                                <div className="space-y-3 md:col-span-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">TIMESTAMP</label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        className="fiery-input w-full"
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
                                    disabled={saving || !form.amount}
                                    className="fiery-btn-primary flex-[2] py-5 rounded-[24px] text-[10px] uppercase tracking-widest font-black italic disabled:opacity-50"
                                >
                                    {saving ? 'AUTHORIZING...' : (
                                        <span className="flex items-center gap-3 justify-center">
                                            Authorize Registry Entry <ArrowRight size={18} strokeWidth={3} />
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

export default Expenses;
