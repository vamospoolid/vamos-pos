import { useEffect, useState } from 'react';
import { ChevronRight, Clock, Wallet } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export function ActiveSessionBanner() {
    const { member, setActiveTab } = useAppStore();
    const activeSession = member?.sessions?.find((s: any) => s.status === 'ACTIVE');
    if (!activeSession) return null;

    const [elapsed, setElapsed] = useState(0);
    const isVoucher = Boolean(activeSession.isVoucher);

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
            className={`w-full fiery-card p-0 relative overflow-hidden group text-left active:scale-95 transition-all ${
                isVoucher
                    ? 'bg-purple-950/20 border-2 border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.2)]'
                    : 'bg-primary/10 border-2 border-primary/30 shadow-[0_0_40px_rgba(6,182,212,0.15)]'
            }`}
        >
            {/* Ambient Background Accent */}
            <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none ${
                isVoucher ? 'bg-purple-500/20' : 'bg-primary/15'
            }`} />
            <div className={`absolute inset-0 pointer-events-none ${
                isVoucher
                    ? 'bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/5'
                    : 'bg-gradient-to-r from-primary/10 via-transparent to-primary/5'
            }`} />

            <div className="p-5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    {/* Pulsing Signal Dot */}
                    <div className="relative flex items-center justify-center">
                        <div className={`w-4 h-4 rounded-full animate-ping absolute ${isVoucher ? 'bg-purple-500/40' : 'bg-primary/30'}`} />
                        <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                            isVoucher
                                ? 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.9)]'
                                : 'bg-primary shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                        }`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <p className={`text-[9px] font-black uppercase tracking-[0.4em] italic leading-none ${
                                isVoucher ? 'text-purple-400' : 'text-primary'
                            }`}>
                                {isVoucher ? '🎟️ Sesi Voucher Poin' : 'Meja Aktif'}
                            </p>
                            {isVoucher && (
                                <span className="text-[8px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.5 rounded border border-purple-500/30">
                                    FREE 1 JAM
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
                            {activeSession.table?.name || 'Voucher Session'}
                        </h3>
                    </div>
                </div>
                <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 ${
                    isVoucher
                        ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 group-hover:bg-purple-500 group-hover:text-black'
                        : 'bg-primary/15 border-primary/30 text-primary group-hover:bg-primary group-hover:text-black'
                }`}>
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
                        <Wallet className={`w-4 h-4 shrink-0 ${isVoucher ? 'text-purple-400' : 'text-emerald-400'}`} />
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic leading-none mb-0.5">
                                {isVoucher ? 'Billing (Voucher)' : 'Total Tagihan'}
                            </p>
                            <p className={`text-sm font-black font-mono tracking-tight ${
                                isVoucher ? 'text-purple-300' : 'text-emerald-400'
                            }`}>
                                {totalBill === 0 ? 'Rp 0 (Voucher)' : `Rp ${totalBill.toLocaleString()}`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
}
