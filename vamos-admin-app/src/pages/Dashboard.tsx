import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Flag, Plus, MessageSquare, Clock, Zap, FileText, Users
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
        <div className="space-y-6">
            
            {/* Quick Actions Grid (White Cards overlaying blue header) */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50">
                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                    {/* Action 1 */}
                    <button onClick={() => navigate('/referee')} className="flex flex-col items-center gap-3 group active:scale-95 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100/50">
                            <Flag size={26} strokeWidth={2} />
                        </div>
                        <span className="text-[13px] font-semibold text-slate-700">Referee</span>
                    </button>
                    
                    {/* Action 2 */}
                    <button onClick={() => navigate('/expenses')} className="flex flex-col items-center gap-3 group active:scale-95 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100/50">
                            <Plus size={26} strokeWidth={2} />
                        </div>
                        <span className="text-[13px] font-semibold text-slate-700">Expense</span>
                    </button>
                    
                    {/* Action 3 */}
                    <button onClick={() => navigate('/events')} className="flex flex-col items-center gap-3 group active:scale-95 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100/50">
                            <Clock size={26} strokeWidth={2} />
                        </div>
                        <span className="text-[13px] font-semibold text-slate-700">Match</span>
                    </button>
                    
                    {/* Action 4 */}
                    <button onClick={() => navigate('/announcements')} className="flex flex-col items-center gap-3 group active:scale-95 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100/50">
                            <MessageSquare size={26} strokeWidth={2} />
                        </div>
                        <span className="text-[13px] font-semibold text-slate-700">Broadcast</span>
                    </button>
                    
                    {/* Action 5 */}
                    <button onClick={() => navigate('/reports')} className="flex flex-col items-center gap-3 group active:scale-95 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100/50">
                            <FileText size={26} strokeWidth={2} />
                        </div>
                        <span className="text-[13px] font-semibold text-slate-700">Reports</span>
                    </button>
                    
                    {/* Action 6 */}
                    <button onClick={() => navigate('/players')} className="flex flex-col items-center gap-3 group active:scale-95 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center border border-purple-100/50">
                            <Users size={26} strokeWidth={2} />
                        </div>
                        <span className="text-[13px] font-semibold text-slate-700">Players</span>
                    </button>
                </div>
            </div>

            {/* Today's Revenue */}
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-50 flex items-center justify-between">
                <div>
                    <p className="text-[13px] text-slate-500 font-semibold mb-1">Today's Revenue</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-slate-400">Rp</span>
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                            {loading ? '...' : (todayRevenue).toLocaleString('id-ID')}
                        </h2>
                    </div>
                </div>
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex flex-col items-center justify-center text-emerald-600 shrink-0">
                   <span className="text-xs font-bold">{loading ? '...' : (todayRevenue > 0 ? ((todayRevenue - todayExpenses) / todayRevenue * 100).toFixed(0) : '0')}%</span>
                   <span className="text-[8px] font-bold uppercase tracking-wider">MRG</span>
                </div>
            </div>

            {/* Live Status Banner */}
            {activeSessions.length > 0 && (
                <div onClick={() => navigate('/events')} className="bg-blue-600 rounded-[24px] p-5 shadow-[0_8px_20px_rgba(37,99,235,0.2)] flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center relative">
                            <Zap size={24} strokeWidth={2} fill="currentColor" />
                            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-600 animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">{activeSessions.length} Tables Active</h4>
                            <p className="text-sm text-blue-100 font-medium">Currently playing</p>
                        </div>
                    </div>
                </div>
            )}

            {/* List Cards */}
            <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">Transactions</h3>
                    <span className="text-[13px] text-blue-600 font-bold cursor-pointer">View All</span>
                </div>
                <div className="space-y-3">
                    {liveTransactions.length > 0 ? liveTransactions.slice(0, 4).map((tx, i) => (
                        <div key={i} className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                    <span className="text-slate-600 font-bold text-lg">{tx.customer.charAt(0)}</span>
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-slate-800">{tx.customer}</p>
                                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{tx.method}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[15px] font-extrabold text-emerald-600">+{fmt(tx.amount)}</p>
                                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                    {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white rounded-[24px] p-8 text-center border border-slate-50">
                            <p className="text-slate-400 text-sm font-semibold">No transactions yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default Dashboard;
