import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock, Zap, BarChart3, Users, Receipt
} from 'lucide-react';
import { sessionsApi, reportsApi, membersApi, tournamentsApi } from '../services/api';

interface ActiveSession {
    id: string;
    table?: { name: string };
    startTime: string;
    status: string;
}

interface Transaction {
    customer: string;
    amount: number;
    method: string;
    date: string;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [liveTransactions, setLiveTransactions] = useState<Transaction[]>([]);
    const [todayRevenue, setTodayRevenue] = useState<number>(0);
    const [todayExpenses, setTodayExpenses] = useState<number>(0);
    const [memberCount, setMemberCount] = useState<number>(0);
    const [activeTournaments, setActiveTournaments] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = { startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] };
                const [sessRes, revRes, playersRes, eventsRes, expRes, txRes] = await Promise.allSettled([
                    sessionsApi.getActive(),
                    reportsApi.dailyRevenue({ days: 1 }),
                    membersApi.getAll(),
                    tournamentsApi.getAll(),
                    reportsApi.getExpenses({ days: 1 }),
                    reportsApi.transactions(params)
                ]);

                if (sessRes.status === 'fulfilled') setActiveSessions(sessRes.value.data as ActiveSession[]);
                if (txRes.status === 'fulfilled') {
                    const res = txRes.value.data as any;
                    if (res.success && Array.isArray(res.data)) {
                        setLiveTransactions(res.data.map((t: any) => ({
                            customer: t.memberName || 'Walk-in',
                            amount: t.totalAmount,
                            method: t.paymentMethod,
                            date: t.endTime || t.createdAt
                        })));
                    }
                }
                if (revRes.status === 'fulfilled') {
                    const res = revRes.value.data as any;
                    if (res.success && res.data && res.data.length > 0) setTodayRevenue(res.data[0].totalRevenue || 0);
                }
                if (expRes.status === 'fulfilled') {
                    const res = expRes.value.data as any;
                    const data = res.data || res;
                    if (Array.isArray(data)) setTodayExpenses(data.reduce((sum: number, e: any) => sum + (e.amount || 0), 0));
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

    return (
        <div className="fade-in space-y-8 pb-32">
            {/* Identity Block matched to Player App */}
            <div className="fiery-card p-8 mt-4 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-primary/10 rounded-full blur-[40px]" />

                <div className="flex items-center gap-6 relative z-10">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-[32px] bg-secondary border-2 border-primary/20 p-1 flex items-center justify-center overflow-hidden shadow-2xl">
                            <Zap className="w-12 h-12 text-primary animate-pulse" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter truncate leading-tight">
                            COMMAND
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="px-3 py-1 bg-[#252b45] rounded-full border border-white/5 flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">MASTER</span>
                            </div>
                            <div className="px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/10 flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">ADMIN</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <div className="flex justify-between items-center mb-2.5 px-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Daily Yield Progress</p>
                        <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{loading ? '...' : fmt(todayRevenue)} / 10M</p>
                    </div>
                    <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 fiery-glow"
                            style={{ width: `${Math.min((todayRevenue / 10000000) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid - Expanded for Desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <button
                    onClick={() => navigate('/events')}
                    className="fiery-card p-6 flex flex-col gap-4 hover:scale-[1.02] transition-all duration-300"
                >
                    <div className="w-12 h-12 rounded-2xl bg-[#a855f7]/10 flex items-center justify-center border border-[#a855f7]/20">
                        <Clock className="w-6 h-6 text-[#a855f7]" />
                    </div>
                    <div className="text-left">
                        <p className="text-lg font-black text-white uppercase italic truncate">Events</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live: {activeTournaments}</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/players')}
                    className="fiery-card p-6 flex flex-col gap-4 hover:scale-[1.02] transition-all duration-300"
                >
                    <div className="w-12 h-12 rounded-2xl bg-[#00d084]/10 flex items-center justify-center border border-[#00d084]/20">
                        <Users className="w-6 h-6 text-[#00d084]" />
                    </div>
                    <div className="text-left">
                        <p className="text-lg font-black text-white uppercase italic truncate">Members</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total: {memberCount}</p>
                    </div>
                </button>
            </div>

            {/* Live Status Banner alike Player App */}
            {activeSessions.length > 0 && (
                <button
                    onClick={() => navigate('/events')}
                    className="scale-in fiery-card-highlight p-6 flex items-center justify-between fiery-glow border border-primary/20 w-full"
                >
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                <Zap className="w-6 h-6 text-primary animate-pulse" fill="currentColor" />
                            </div>
                            <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-[#101423] animate-ping" />
                        </div>
                        <div className="text-left">
                            <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic">
                                LIVE SESSIONS
                            </p>
                            <h4 className="text-lg font-black text-white uppercase italic truncate leading-tight">
                                {activeSessions.length} TABLES BUSY
                            </h4>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center cursor-pointer transition-all">
                        <span className="text-xs font-black text-primary">ACT</span>
                    </div>
                </button>
            )}

            {/* Loyalty Vault matched block for Revenue */}
            <div className="fiery-card p-8 relative overflow-hidden">
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-accent/5 rounded-full blur-[50px] pointer-events-none" />

                <div className="flex justify-between items-start mb-6 px-1">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 italic">Gross Revenue</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-primary font-black text-lg italic uppercase">RP</span>
                            <h2 className="text-5xl font-black text-white tracking-tighter italic">
                                {loading ? '...' : (todayRevenue).toLocaleString('id-ID')}
                            </h2>
                        </div>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                            MARGIN: {loading ? '...' : (todayRevenue > 0 ? ((todayRevenue - todayExpenses) / todayRevenue * 100).toFixed(0) : '0')}%
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-8">
                    <button
                        onClick={() => navigate('/bookings')}
                        className="fiery-btn-primary py-4 text-[10px] font-black flex items-center justify-center gap-2"
                    >
                        New Booking
                    </button>
                    <button
                        onClick={() => navigate('/reports')}
                        className="fiery-btn-secondary py-4 text-[10px] font-black uppercase tracking-widest border border-white/5 flex items-center justify-center gap-2"
                    >
                        <BarChart3 className="w-4 h-4 text-slate-500" /> Metrics
                    </button>
                </div>
            </div>

            {/* Recent Activity alike "Challenge History" list in Player app */}
            <div className="space-y-6 mt-8">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Recent Tx</h3>
                </div>
                
                <div className="space-y-4">
                    {liveTransactions.length > 0 ? liveTransactions.slice(0, 3).map((tx, i) => (
                        <div key={i} className="fiery-card p-6 flex flex-col gap-4 border-l-4 border-l-primary relative overflow-hidden group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic">Transaction Log</p>
                                    <p className="text-sm font-black text-white uppercase italic truncate">
                                        CLIENT: {tx.customer}
                                    </p>
                                    <div className="flex gap-3 items-center mt-2">
                                        <p className="text-xs text-emerald-400 font-bold tracking-widest">+ {fmt(tx.amount)}</p>
                                        <span className="text-[9px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-black uppercase border border-emerald-500/20">
                                            {tx.method}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="fiery-card p-12 text-center border-2 border-white/5 bg-[#1a1f35]/20">
                            <Receipt className="w-8 h-8 text-slate-700 mx-auto mb-4 opacity-50" />
                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] italic">No Logs Detected</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
