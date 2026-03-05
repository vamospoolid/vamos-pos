import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Search, RefreshCw, AlertCircle, Clock, Tablet, User, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { waitlistApi } from '../services/api';
import type { WaitlistEntry } from '../services/api';
import { vamosAlert, vamosConfirm } from '../utils/dialog';
import { format } from 'date-fns';

const Bookings: React.FC = () => {
    const [bookings, setBookings] = useState<WaitlistEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await waitlistApi.getAll();
            // The backend returns an array directly based on waitlist.controller.ts
            setBookings(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Gagal memuat data booking');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleUpdateStatus = async (id: string, status: string) => {
        const confirmMsg = status === 'CANCELLED' ? 'Batalkan booking ini?' : `Ubah status menjadi ${status}?`;
        if (!(await vamosConfirm(confirmMsg))) return;

        try {
            await waitlistApi.updateStatus(id, { status });
            fetchBookings();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal memperbarui status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!(await vamosConfirm('Hapus data booking ini permanen?'))) return;

        try {
            await waitlistApi.delete(id);
            fetchBookings();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal menghapus booking');
        }
    };

    const filtered = bookings.filter(b => {
        const matchesSearch =
            b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.phone || '').includes(searchTerm) ||
            (b.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'WAITING': return 'text-orange-500 bg-orange-500/10 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]';
            case 'PLAYING': return 'text-primary bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]';
            case 'FINISHED': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
            case 'CANCELLED': return 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]';
            default: return 'text-slate-500 bg-[#101423] border-white/5';
        }
    };

    return (
        <div className="space-y-10 pb-20 animate-in">
            {/* ── COMMAND HEADER ─────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 italic">Operation Waitlist</p>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Reserve <span className="text-primary">Command</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Waitlist Manifest Active</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={fetchBookings}
                        className="p-4 rounded-2xl bg-[#1a1f35]/40 border border-white/5 text-slate-500 hover:text-primary transition-all active:scale-95 group shadow-xl"
                    >
                        <RefreshCw size={22} className={loading ? 'animate-spin text-primary' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                </div>
            </div>

            {/* ── SECTOR FILTERS ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 relative group">
                    <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors duration-300" />
                    <input
                        type="text"
                        placeholder="SEARCH OPERATIVE, PHONE, OR INTEL..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="fiery-input !pl-16 !py-5"
                    />
                </div>
                <div className="lg:col-span-2 flex gap-3 overflow-x-auto pb-4 lg:pb-0 no-scrollbar">
                    {['ALL', 'WAITING', 'PLAYING', 'CANCELLED'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 italic whitespace-nowrap border-2 ${statusFilter === s
                                ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105 z-10'
                                : 'bg-[#101423] text-slate-500 border-white/5 hover:border-primary/30 hover:text-slate-300'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── ERROR ALERT ───────────────────────────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-4 p-6 rounded-[28px] bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-black uppercase italic tracking-widest animate-in slide-in-from-top-4">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={fetchBookings} className="ml-auto px-4 py-2 bg-rose-500/20 rounded-xl hover:bg-rose-500/30 transition-all">RETRY LINK</button>
                </div>
            )}

            {/* ── MANIFEST LIST ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 rounded-[40px] bg-[#1a1f35]/20 border border-white/5 animate-pulse"></div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="col-span-full py-32 text-center fiery-card flex flex-col items-center justify-center border-dashed border-2">
                        <div className="w-20 h-20 bg-[#101423] rounded-[32px] border border-white/5 flex items-center justify-center mb-8 text-slate-800 shadow-2xl">
                            <Calendar size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-700 uppercase italic tracking-tighter">Manifest Empty</h3>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4 italic">NO RESERVATIONS DETECTED IN CURRENT SECTOR</p>
                    </div>
                ) : (
                    filtered.map((b) => (
                        <div key={b.id} className="fiery-card p-8 flex flex-col group hover:border-primary/30 transition-all duration-500 animate-in relative overflow-hidden">
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-all duration-700" />

                            {/* Status Header */}
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic border ${getStatusColor(b.status)}`}>
                                    {b.status}
                                </div>
                                <div className="text-[10px] font-black text-slate-500 flex items-center gap-2 italic uppercase tracking-widest">
                                    <Clock size={12} className="text-primary" />
                                    {format(new Date(b.createdAt), 'MMM d, HH:mm')}
                                </div>
                            </div>

                            {/* Operative Specs */}
                            <div className="flex items-center gap-6 mb-8 relative z-10">
                                <div className="w-16 h-16 rounded-[28px] bg-[#101423] border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:border-primary/30 transition-all duration-500 shadow-inner">
                                    <User size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-2xl font-black text-white group-hover:text-primary transition-all truncate tracking-tighter uppercase italic leading-tight">
                                        {b.customerName}
                                    </h4>
                                    <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mt-1 italic">{b.phone || 'NO COMMS LINK'}</p>
                                </div>
                            </div>

                            {/* Tactical Parameters */}
                            <div className="space-y-4 mb-8 bg-[#0a0c14]/50 p-6 rounded-[32px] border border-white/5 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Tablet size={16} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Sector Assignment</span>
                                    </div>
                                    <span className="text-sm font-black text-white tracking-widest uppercase italic">
                                        {b.table?.name || b.tableType || 'UNASSIGNED'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Calendar size={16} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Deployment Time</span>
                                    </div>
                                    <span className="text-sm font-black text-primary tracking-widest italic">
                                        {b.reservedTime ? format(new Date(b.reservedTime), 'HH:mm') : 'IMMEDIATE'}
                                    </span>
                                </div>
                                {b.pointsCost && (
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Redemption Cost</span>
                                        <span className="text-sm font-black text-orange-500 tracking-widest italic">{b.pointsCost} PTS</span>
                                    </div>
                                )}
                            </div>

                            {b.notes && (
                                <p className="text-[11px] font-medium text-slate-500 italic mb-8 line-clamp-2 px-2 bg-primary/5 py-3 rounded-2xl border-l-2 border-primary/30 leading-relaxed">
                                    "{b.notes}"
                                </p>
                            )}

                            {/* Combat Actions */}
                            <div className="mt-auto flex gap-4 relative z-10">
                                {b.status === 'WAITING' && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus(b.id, 'PLAYING')}
                                            className="flex-1 fiery-btn-primary py-4 text-[10px] flex items-center justify-center gap-3 active:scale-95"
                                        >
                                            <CheckCircle2 size={18} strokeWidth={3} /> CHECK-IN OPS
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(b.id, 'CANCELLED')}
                                            className="w-14 h-14 rounded-[22px] bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-lg active:scale-95"
                                        >
                                            <XCircle size={22} />
                                        </button>
                                    </>
                                )}
                                {b.status !== 'WAITING' && (
                                    <button
                                        onClick={() => handleDelete(b.id)}
                                        className="flex-1 py-4 h-14 rounded-[22px] bg-[#1a1f35]/40 border border-white/5 text-slate-600 hover:text-rose-500 hover:border-rose-500/30 transition-all duration-300 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] italic active:scale-95"
                                    >
                                        <Trash2 size={18} /> PURGE RECORD
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Bookings;
