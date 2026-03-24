import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Trophy, MoreVertical, Calendar, MapPin, RefreshCw, AlertCircle, Swords, Target, ArrowRight } from 'lucide-react';
import { tournamentsApi } from '../services/api';
import type { Tournament } from '../services/api';
import { vamosAlert, vamosConfirm } from '../utils/dialog';

const STATUS_STYLE: Record<string, string> = {
    ONGOING: 'bg-primary/10 text-primary border-primary/30',
    PENDING: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    COMPLETED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const Events: React.FC = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreate, setShowCreate] = useState(false);

    // Create form state
    const [form, setForm] = useState({ 
        name: '', 
        format: '8-Ball', 
        startDate: '', 
        venue: '', 
        participants: '',
        eliminationType: 'SINGLE' as 'SINGLE' | 'DOUBLE',
        transitionSize: '32'
    });
    const [creating, setCreating] = useState(false);

    const fetchTournaments = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await tournamentsApi.getAll();
            const data = res.data?.data ?? res.data;
            setTournaments(Array.isArray(data) ? data : []);
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(anyErr?.response?.data?.message ?? anyErr?.message ?? 'SYSTEM_FAILURE: UNABLE_TO_RETRIEVE_ARENA_INTEL');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) return;
        setCreating(true);
        try {
            const players = form.participants.split('\n').filter(p => p.trim());
            await tournamentsApi.create({ 
                ...form, 
                participants: players,
                transitionSize: form.eliminationType === 'DOUBLE' ? parseInt(form.transitionSize) : undefined
            });
            setShowCreate(false);
            setForm({ 
                name: '', 
                format: '8-Ball', 
                startDate: '', 
                venue: '', 
                participants: '',
                eliminationType: 'SINGLE',
                transitionSize: '32'
            });
            fetchTournaments();
            vamosAlert('Strategic Operation Initialized Successfully.');
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } } };
            vamosAlert(anyErr?.response?.data?.message ?? 'Deployment Error: Parameters Invalid.');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!(await vamosConfirm(`Terminate Strategic Operation "${title.toUpperCase()}"?`))) return;
        try {
            await tournamentsApi.delete(id);
            fetchTournaments();
        } catch {
            vamosAlert('Termination protocol failed.');
        }
    };

    const filtered = (tournaments || []).filter(t =>
        (t?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    return (
        <div className="space-y-10 pb-20 animate-in">
            {/* ── COMMAND HEADER ─────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 italic">Global Arena Control</p>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Tactical <span className="text-primary">Ops Hub</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">{tournaments.length} ACTIVE OPERATIONS IN SECTOR</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={fetchTournaments}
                        className="p-4 rounded-2xl bg-[#1a1f35]/40 border border-white/5 text-slate-500 hover:text-primary transition-all active:scale-95 group"
                    >
                        <RefreshCw size={22} className={loading ? 'animate-spin text-primary' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="fiery-btn-primary px-8 py-4 text-[10px] flex items-center gap-3"
                    >
                        <Plus size={18} strokeWidth={3} />
                        Launch New Mission
                    </button>
                </div>
            </div>

            {/* ── SEARCH & SCAN PARAMS ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="relative flex-1 group">
                    <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors pointer-events-none" />
                    <input
                        type="text"
                        placeholder="SCAN OPERATIONS BY DESIGNATION..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="fiery-input w-full !pl-16 !py-5 uppercase text-xs tracking-widest placeholder:text-slate-700"
                    />
                </div>
                <button className="px-8 py-4 rounded-[24px] bg-[#1a1f35]/40 border border-white/5 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-primary hover:border-primary/20 transition-all flex items-center justify-center gap-3 italic">
                    <Filter size={18} /> Tactical Filter
                </button>
            </div>

            {/* ── ALERT SYSTEM ──────────────────────────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-4 p-6 rounded-[32px] bg-rose-500/5 border border-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest animate-in italic">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={fetchTournaments} className="ml-auto px-6 py-2 bg-rose-500/10 rounded-xl hover:bg-rose-500/20 transition-all border border-rose-500/20">RE-INITIATE SCAN</button>
                </div>
            )}

            {/* ── OPERATION GRID ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-80 rounded-[40px] bg-[#1a1f35]/20 border border-white/5 animate-pulse" />
                    ))
                ) : filtered.length === 0 ? (
                    <div className="col-span-full py-32 text-center fiery-card bg-[#1a1f35]/10 flex flex-col items-center justify-center border-dashed border-white/10">
                        <div className="w-20 h-20 bg-[#101423] rounded-[32px] border border-white/5 flex items-center justify-center mb-8 shadow-inner">
                            <Target size={40} className="text-slate-800" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">No Active Protocols</h3>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 italic">INITIALIZE DEPLOYMENT OR ADJUST SECTOR SCAN</p>
                        <button onClick={() => setShowCreate(true)} className="fiery-btn-primary mt-10 px-10 py-4 text-[10px]">
                            Initiate First Mission
                        </button>
                    </div>
                ) : (
                    filtered.map(t => {
                        if (!t) return null;
                        const count = t._count?.participants ?? t.participants?.length ?? 0;
                        const status = (t.status || 'PENDING').toUpperCase();
                        const statusColors = STATUS_STYLE[status] ?? STATUS_STYLE.PENDING;

                        return (
                            <div
                                key={t.id}
                                className="fiery-card group hover:bg-[#1e2540]/60 transition-all duration-500 flex flex-col p-8 border-2 border-transparent hover:border-primary/30 relative overflow-hidden"
                            >
                                {/* SCANLINE EFFECT */}
                                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-[#101423] border border-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner relative overflow-hidden">
                                        <div className="absolute inset-0 bg-primary/20 animate-pulse opacity-0 group-hover:opacity-100" />
                                        <Trophy size={24} className="relative z-10" />
                                    </div>
                                    <span className={`text-[9px] font-black px-4 py-1.5 rounded-full border-2 uppercase tracking-[0.2em] italic ${statusColors}`}>
                                        {status}
                                    </span>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors leading-tight uppercase italic tracking-tighter mb-4">
                                        {t.name || 'UNLISTED MISSION'}
                                    </h3>

                                    <div className="flex flex-col gap-3 mb-8">
                                        {t.startDate && (
                                            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                                <Calendar size={16} className="text-primary/60" />
                                                {new Date(t.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                                            </div>
                                        )}
                                        {t.venue && (
                                            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                                <MapPin size={16} className="text-primary/60" />
                                                {t.venue.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Deployment Status</span>
                                        <span className="text-base font-black text-white italic">{count}<span className="text-slate-600 font-bold ml-1">/ 32 OPS</span></span>
                                    </div>
                                    <div className="h-2 w-full bg-[#101423] rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-1000 fiery-glow relative"
                                            style={{ width: `${Math.min((count / 32) * 100, 100)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-auto">
                                    <button
                                        onClick={() => navigate(`/events/${t.id}`)}
                                        className="fiery-btn-primary flex-1 py-4 text-[10px]"
                                    >
                                        Command Center
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.name || ''); }}
                                        className="p-4 rounded-2xl bg-[#101423] border border-white/5 text-slate-600 hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all"
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── MISSION INITIALIZATION MODAL ────────────────────────────────────── */}
            {showCreate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-[#0a0d18]/90 backdrop-blur-xl animate-in" onClick={() => setShowCreate(false)} />
                    <div className="w-full max-w-xl fiery-card rounded-[48px] p-12 border-2 border-primary/20 shadow-[0_0_80px_rgba(59,130,246,0.2)] relative animate-in overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Swords size={160} className="text-primary" />
                        </div>

                        <div className="mb-10 relative">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic">Operation Authorization</p>
                            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Configure Convention</h2>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-8 relative">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">MISSION DESIGNATION (TOURNAMENT NAME) *</label>
                                <input
                                    type="text"
                                    placeholder="DESIGNATE OPERATION NAME..."
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="fiery-input w-full uppercase"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">COMBAT PROTOCOL</label>
                                    <select
                                        value={form.eliminationType}
                                        onChange={e => setForm(f => ({ ...f, eliminationType: e.target.value as 'SINGLE' | 'DOUBLE' }))}
                                        className="fiery-input w-full uppercase appearance-none"
                                    >
                                        <option value="SINGLE" className="bg-[#101423]">Single Elimination</option>
                                        <option value="DOUBLE" className="bg-[#101423]">Double Elimination (Hybrid)</option>
                                    </select>
                                </div>
                                {form.eliminationType === 'DOUBLE' && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">TRANSITION THRESHOLD (E.G. 32)</label>
                                        <input
                                            type="number"
                                            value={form.transitionSize}
                                            onChange={e => setForm(f => ({ ...f, transitionSize: e.target.value }))}
                                            className="fiery-input w-full"
                                            placeholder="32"
                                        />
                                    </div>
                                )}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">GAME FORMAT</label>
                                    <input
                                        type="text"
                                        value={form.format}
                                        onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
                                        className="fiery-input w-full uppercase"
                                        placeholder="E.G. 9-BALL"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">DEPLOYMENT DATE</label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                        className="fiery-input w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">INITIAL OPERATIVES (ONE PER LINE)</label>
                                <textarea
                                    placeholder="DESIGNATE OPERATIVE NAMES..."
                                    value={form.participants}
                                    onChange={e => setForm(f => ({ ...f, participants: e.target.value }))}
                                    rows={3}
                                    className="fiery-input w-full uppercase resize-none h-32"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">THEATER OF OPERATIONS (VENUE)</label>
                                <input
                                    type="text"
                                    placeholder="VAMOS HQ SECTOR 7"
                                    value={form.venue}
                                    onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                                    className="fiery-input w-full uppercase"
                                />
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 py-5 rounded-[24px] bg-white/5 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all italic border border-white/5 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !form.name}
                                    className="fiery-btn-primary flex-[2] py-5 rounded-[24px] text-[10px] uppercase tracking-widest font-black italic disabled:opacity-50"
                                >
                                    {creating ? 'DEPLOYING...' : (
                                        <span className="flex items-center gap-3 justify-center">
                                            Authorize Mission Launch <ArrowRight size={18} strokeWidth={3} />
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

export default Events;
