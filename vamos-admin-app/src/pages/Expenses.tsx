import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Plus, TrendingDown, Trash2, Shield } from 'lucide-react';
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
            vamosAlert('Expense recorded successfully.');
        } catch (e: any) {
            vamosAlert(e?.response?.data?.message ?? 'Authorization failure: entry denied.');
        }
        finally { setSaving(false); }
    };

    const del = async (id: string) => {
        if (!(await vamosConfirm('Delete this expense entry?'))) return;
        await api.delete(`/expenses/${id}`).catch(() => vamosAlert('Deletion failed.'));
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
        'Gaji': { color: '#2563eb', bg: '#eff6ff' }, // blue
        'Operasional': { color: '#d97706', bg: '#fffbeb' }, // amber
        'Bahan Baku': { color: '#059669', bg: '#ecfdf5' }, // emerald
        'Maintenance': { color: '#e11d48', bg: '#fff1f2' }, // rose
        'DEBT': { color: '#ea580c', bg: '#fff7ed' }, // orange
        'Lainnya': { color: '#475569', bg: '#f8fafc' }, // slate
    };

    const fmtK = (n: number) => n >= 1_000_000 ? `Rp ${(n / 1e6).toFixed(1)}M` : `Rp ${(n / 1000).toFixed(0)}K`;

    return (
        <div className="space-y-6">
            {/* ── COMMAND HEADER (Overlapping Blue Header from Layout) ─────────────────────────────────────────────────── */}
            <div className="flex justify-between items-center bg-white/10 backdrop-blur-md rounded-[28px] p-5 border border-white/20">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">Expense Tracker</h2>
                    <p className="text-[13px] text-blue-100 font-medium mt-0.5">Manage operational costs</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={load} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/20 text-white hover:bg-white/30 transition-all active:scale-95">
                        <RefreshCw size={20} strokeWidth={2.5} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setShowAdd(true)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-blue-700 shadow-lg hover:shadow-xl transition-all active:scale-95">
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* ── SECTOR DRAIN OVERVIEW ─────────────────────────────────────────── */}
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-50 flex items-center justify-between">
                <div>
                    <p className="text-[13px] text-slate-500 font-semibold mb-1">Current Month Total</p>
                    <div className="flex items-baseline gap-1">
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{fmtK(totalMonth)}</h2>
                    </div>
                </div>
                <div className="w-14 h-14 rounded-full bg-rose-50 flex flex-col items-center justify-center text-rose-500 shrink-0">
                    <TrendingDown size={24} strokeWidth={2} />
                </div>
            </div>

            {/* ── REGISTRY LIST ──────────────────────────────────────────────────── */}
            <div className="space-y-3 pt-2">
                {loading ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-[24px] bg-white border border-slate-50 shadow-sm animate-pulse" />)
                ) : list.length === 0 ? (
                    <div className="py-16 text-center bg-white rounded-[24px] border border-slate-50 shadow-sm flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Shield size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Budget Intact</h3>
                        <p className="text-slate-400 text-[13px] font-medium mt-1">No expenses recorded yet.</p>
                    </div>
                ) : (
                    list.map((e: any) => {
                        const style = CAT_STYLE[e.category] ?? CAT_STYLE['Lainnya'];
                        return (
                            <div key={e.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-50 flex items-center gap-4 group hover:shadow-md transition-all">
                                <div
                                    className="w-14 h-14 rounded-[20px] flex items-center justify-center font-bold text-lg shrink-0"
                                    style={{ color: style.color, backgroundColor: style.bg }}
                                >
                                    {(e.category ?? 'L').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[15px] font-bold text-slate-800 truncate">
                                        {e.description || e.category}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase tracking-wider">{e.category}</span>
                                        <span className="text-[11px] font-semibold text-slate-400">
                                            {new Date(e.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                    {e.member && (
                                        <p className="text-[11px] font-semibold text-orange-500 mt-1.5">
                                            Member: {e.member.name}
                                            {e.status === 'PENDING' && <span className="text-rose-500 ml-1">(Pending)</span>}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right flex flex-col items-end gap-2 shrink-0">
                                    <p className="text-base font-extrabold text-rose-500">
                                        {e.id.startsWith('temp') ? '...' : `-${fmtK(e.amount)}`}
                                    </p>
                                    <div className="flex gap-2">
                                        {e.isDebt && e.status === 'PENDING' && (
                                            <button
                                                onClick={() => payDebt(e.id)}
                                                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs hover:bg-blue-100 transition-colors"
                                            >
                                                Pay
                                            </button>
                                        )}
                                        <button onClick={() => del(e.id)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                                            <Trash2 size={18} strokeWidth={2} />
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
                    <div className="w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Add Expense</h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">Record a new operational cost</p>
                        </div>

                        <form onSubmit={add} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                                >
                                    {EXPENSE_CATS.map(c => (
                                        <option key={c} value={c}>{c === 'DEBT' ? 'Piutang' : c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Amount (IDR) *</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</div>
                                    <input
                                        type="number"
                                        value={form.amount}
                                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                        placeholder="0"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-800 font-bold text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        required
                                        min={0}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Description</label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Brief details..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Date</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAdd(false)}
                                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !form.amount}
                                    className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(37,99,235,0.2)] active:scale-95"
                                >
                                    {saving ? 'Saving...' : 'Save Expense'}
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
