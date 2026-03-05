import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, Trophy,
    ArrowRight, Clock, Activity, Shield, ChevronRight, Zap, BarChart3
} from 'lucide-react';
import { sessionsApi, reportsApi, membersApi, tournamentsApi } from '../services/api';

interface ActiveSession {
    id: string;
    table?: { name: string };
    startTime: string;
    status: string;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as { name?: string };

    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [todayRevenue, setTodayRevenue] = useState<number>(0);
    const [todayExpenses, setTodayExpenses] = useState<number>(0);
    const [todayHours, setTodayHours] = useState<number>(0);
    const [memberCount, setMemberCount] = useState<number>(0);
    const [activeTournaments, setActiveTournaments] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sessRes, revRes, playersRes, eventsRes, expRes, utilRes] = await Promise.allSettled([
                    sessionsApi.getActive(),
                    reportsApi.dailyRevenue({ days: 1 }),
                    membersApi.getAll(),
                    tournamentsApi.getAll(),
                    reportsApi.getExpenses({ days: 1 }),
                    reportsApi.tableUtilization({ days: 1 }),
                ]);

                if (sessRes.status === 'fulfilled') setActiveSessions(sessRes.value.data as ActiveSession[]);

                if (revRes.status === 'fulfilled') {
                    const res = revRes.value.data as any;
                    if (res.success && res.data && res.data.length > 0) {
                        setTodayRevenue(res.data[0].totalRevenue || 0);
                    }
                }

                if (expRes.status === 'fulfilled') {
                    const res = expRes.value.data as any;
                    const data = res.data || res;
                    if (Array.isArray(data)) {
                        const total = data.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
                        setTodayExpenses(total);
                    }
                }

                if (utilRes.status === 'fulfilled') {
                    const res = utilRes.value.data as any;
                    const data = res.data || res;
                    if (Array.isArray(data)) {
                        const hours = data.reduce((sum: number, t: any) => sum + (t.totalHours || 0), 0);
                        setTodayHours(hours);
                    }
                }

                if (playersRes.status === 'fulfilled') {
                    const res = playersRes.value.data as any;
                    const data = res.data || res;
                    if (Array.isArray(data)) setMemberCount(data.length);
                }

                if (eventsRes.status === 'fulfilled') {
                    const res = eventsRes.value.data as any;
                    const data = res.data || res;
                    if (Array.isArray(data)) {
                        const ongoing = data.filter((t: any) => t.status === 'ONGOING' || t.status === 'PENDING').length;
                        setActiveTournaments(ongoing);
                    }
                }
            } catch (_) { }
            finally { setLoading(false); }
        };
        fetchData();
        const interval = setInterval(() => {
            sessionsApi.getActive().then(r => setActiveSessions(r.data as ActiveSession[])).catch(() => { });
        }, 30_000);
        return () => clearInterval(interval);
    }, []);

    const fmt = (val: number) => {
        if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
        if (val >= 1_000) return `${Math.round(val / 1_000)}K`;
        return `${val}`;
    };

    const getElapsed = (startTime: string) => {
        const ms = Date.now() - new Date(startTime).getTime();
        const h = Math.floor(ms / 3_600_000);
        const m = Math.floor((ms % 3_600_000) / 60_000);
        return `${h}h ${m}m`;
    };

    return (
        <div className="fade-in space-y-6 pb-6">

            {/* ── IDENTITY / WELCOME BLOCK ─────────── */}
            <div className="fiery-card p-6 mt-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-400 mb-1 leading-none">Good day,</p>
                        <h1 className="text-3xl font-black text-white italic uppercase tracking-tight leading-tight truncate">
                            {user.name?.split(' ')[0] || 'Admin'}
                        </h1>
                        <div className="flex items-center gap-2 mt-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                            <span className="text-sm font-bold text-emerald-400 leading-none">System Online</span>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Sessions</p>
                        <p className="text-5xl font-black text-primary leading-none">{activeSessions.length}</p>
                        <p className="text-xs font-bold text-slate-500 leading-none mt-1">Live Now</p>
                    </div>
                </div>
            </div>

            {/* ── STATS ROW (2+2 grid) ─────────────── */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Revenue', value: fmt(todayRevenue), sub: 'Today', color: '#f43f5e', icon: TrendingUp },
                    { label: 'Expenses', value: fmt(todayExpenses), sub: 'Today', color: '#9333ea', icon: BarChart3 },
                    { label: 'Playtime', value: `${todayHours.toFixed(1)}h`, sub: 'Total', color: '#2b80ff', icon: Clock },
                    { label: 'Members', value: `${memberCount}`, sub: 'Registered', color: '#10b981', icon: Activity },
                ].map((s, i) => (
                    <div
                        key={i}
                        className="fiery-card p-5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[28px]" style={{ background: s.color }} />
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-white/5">
                            <s.icon size={18} style={{ color: s.color }} />
                        </div>
                        <p className="text-2xl font-black text-white tracking-tight leading-none mb-1">
                            {loading ? '–' : s.value}
                        </p>
                        <p className="text-sm font-bold text-white leading-none">{s.label}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── LIVE SESSIONS ────────────────────── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-black text-white tracking-tight">Active Sessions</h2>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        <span className="text-sm font-bold text-primary">{activeSessions.length} Live</span>
                    </div>
                </div>

                {loading ? (
                    [1, 2].map(i => <div key={i} className="h-20 rounded-[28px] bg-[#1a1f35] animate-pulse" />)
                ) : activeSessions.length === 0 ? (
                    <div className="fiery-card p-12 text-center border-2 border-dashed border-white/5">
                        <Activity size={36} className="mx-auto mb-4 text-slate-800" />
                        <p className="text-base font-bold text-slate-600">No active sessions right now</p>
                    </div>
                ) : (
                    activeSessions.slice(0, 4).map((s) => (
                        <div key={s.id} className="fiery-card p-4 flex items-center gap-4 border-l-4 border-l-primary">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                <Activity size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-black text-white uppercase tracking-tight truncate">{s.table?.name ?? 'Table'}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-sm font-bold text-emerald-400">{getElapsed(s.startTime)}</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-600 flex-shrink-0" />
                        </div>
                    ))
                )}
            </div>

            {/* ── QUICK ACTIONS ─────────────────────── */}
            <div className="space-y-3">
                <h2 className="text-lg font-black text-white tracking-tight px-1">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Reports', sub: 'View Analytics', icon: BarChart3, color: '#f59e0b', path: '/reports' },
                        { label: 'Events', sub: `${activeTournaments} Active`, icon: Trophy, color: '#2b80ff', path: '/events' },
                        { label: 'Players', sub: `${memberCount} Total`, icon: Activity, color: '#10b981', path: '/players' },
                        { label: 'Bulletin', sub: 'Post Updates', icon: Shield, color: '#9333ea', path: '/announcements' },
                    ].map((a, i) => (
                        <button
                            key={i}
                            onClick={() => navigate(a.path)}
                            className="fiery-card p-5 flex flex-col items-start gap-3 hover:bg-[#252b45] active:scale-[0.97] transition-all text-left"
                        >
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${a.color}18`, border: `1px solid ${a.color}30` }}>
                                <a.icon size={22} style={{ color: a.color }} />
                            </div>
                            <div>
                                <p className="text-base font-black text-white leading-none">{a.label}</p>
                                <p className="text-xs font-semibold text-slate-500 mt-0.5">{a.sub}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── SYSTEM STATUS ─────────────────────── */}
            <div className="fiery-card p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Zap size={18} className="text-primary" fill="currentColor" />
                    </div>
                    <div>
                        <p className="text-base font-black text-white">System Firewall Active</p>
                        <p className="text-sm font-bold text-slate-500">{memberCount} Ops Connected</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/players')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-black rounded-2xl shadow-[0_4px_15px_rgba(59,130,246,0.4)] active:scale-95 transition-all"
                >
                    View <ArrowRight size={16} strokeWidth={3} />
                </button>
            </div>

        </div>
    );
};

export default Dashboard;
