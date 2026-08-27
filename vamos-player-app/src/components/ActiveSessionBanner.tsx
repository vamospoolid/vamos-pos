import { useEffect, useState } from 'react';
import { ChevronRight, Clock, Wallet } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export function ActiveSessionBanner() {
    const { member, setActiveTab } = useAppStore();
    const activeSession = member?.sessions?.find((s: any) => s.status === 'ACTIVE');
    if (!activeSession) return null;

    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsed(Date.now() - new Date(activeSession.startTime).getTime());
        }, 1000);
        return () => clearInterval(timer);
    }, [activeSession.startTime]);

    const formatElapsed = (ms: number) => {
        if (ms < 0) ms = 0;
        const totalSecs = Math.floor(ms / 1000);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
        return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    };

    // Total tagihan = table + semua FnB orders
    const fnbTotal = (activeSession.orders || []).reduce(
        (sum: number, o: any) => sum + ((o.price || 0) * (o.quantity || 1)), 0
    );
    const totalBill = (activeSession.tableAmount || 0) + fnbTotal;

    return (
        <button
            onClick={() => setActiveTab('active-session')}
            className="w-full fiery-card p-0 bg-primary/10 border-2 border-primary/30 relative overflow-hidden group text-left active:scale-95 transition-all shadow-[0_0_40px_rgba(6,182,212,0.15)]"
        >
            {/* Ambient Background Accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/15 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 pointer-events-none" />

            <div className="p-5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    {/* Pulsing Signal Dot */}
                    <div className="relative flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-primary/30 animate-ping absolute" />
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] italic leading-none mb-1">Meja Aktif</p>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
                            {activeSession.table?.name || 'Voucher Session'}
                        </h3>
                    </div>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all">
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>

            <div className="px-5 pb-5 pt-0 relative z-10">
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0a0d18]/80 p-3.5 rounded-[18px] border border-white/10 backdrop-blur-md flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic leading-none mb-0.5">Waktu Berjalan</p>
                            <p className="text-sm font-bold font-mono text-white tracking-tight">
                                {formatElapsed(elapsed || (Date.now() - new Date(activeSession.startTime).getTime()))}
                            </p>
                        </div>
                    </div>
                    <div className="bg-[#0a0d18]/80 p-3.5 rounded-[18px] border border-white/10 backdrop-blur-md flex items-center gap-2.5">
                        <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic leading-none mb-0.5">Total Tagihan</p>
                            <p className="text-sm font-black text-emerald-400 font-mono tracking-tight">
                                Rp {totalBill.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
}
