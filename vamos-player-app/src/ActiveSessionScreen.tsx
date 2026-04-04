import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Info, CheckCircle2, UtensilsCrossed, X } from 'lucide-react';
import { useAppStore } from './store/appStore';

export function ActiveSessionScreen() {
    const { member, setActiveTab, refreshMemberData } = useAppStore();
    const activeSession = member?.sessions?.find((s: any) => s.status === 'ACTIVE');
    const directFnbSessions = member.sessions?.filter((s: any) => s.status === 'PENDING' && !s.tableId) || [];
    const hasAnySession = activeSession || directFnbSessions.length > 0;

    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [estimatedCost, setEstimatedCost] = useState(0);

    // Track when session completes
    const [showMissionAccomplished, setShowMissionAccomplished] = useState(false);
    const [wasActive, setWasActive] = useState(false);

    // Periodic Data Refresh
    useEffect(() => {
        refreshMemberData();
        const refreshInterval = setInterval(() => {
            refreshMemberData();
        }, 8000); // 8 seconds refresh
        return () => clearInterval(refreshInterval);
    }, [refreshMemberData]);

    // Check for session completion
    useEffect(() => {
        if (activeSession) {
            setWasActive(true);
        } else if (wasActive && !activeSession) {
            // Session was active, but is no longer (assuming it was paid/completed)
            setShowMissionAccomplished(true);
            setWasActive(false); // Reset so it doesn't trigger repeatedly
            setTimeout(() => {
                setShowMissionAccomplished(false);
                setActiveTab('dashboard');
            }, 6000); // Show for 6 seconds
        }
    }, [activeSession, wasActive, setActiveTab]);

    // Timer Logic
    useEffect(() => {
        if (!activeSession?.startTime) {
            setElapsedTime('00:00:00');
            setEstimatedCost(0);
            return;
        }

        const interval = setInterval(() => {
            const start = new Date(activeSession.startTime).getTime();
            const now = new Date().getTime();
            const passedMs = now - start;

            let displayMs = passedMs;
            let isNegative = false;

            if (activeSession.durationOpts) {
                const end = start + activeSession.durationOpts * 60000;
                displayMs = end - now;
                if (displayMs < 0) {
                    isNegative = true;
                    displayMs = Math.abs(displayMs);
                }
            }

            // Format hours, minutes, seconds
            const hrs = Math.floor(displayMs / 3600000);
            const mins = Math.floor((displayMs % 3600000) / 60000);
            const secs = Math.floor((displayMs % 60000) / 1000);

            const prefix = isNegative ? '-' : '';

            setElapsedTime(
                `${prefix}${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            );

            // Estimate Subtotal Live (Hourly Billing)
            const hourlyRate = activeSession.tableAmount > 0 && activeSession.durationOpts
                ? (activeSession.tableAmount / (activeSession.durationOpts / 60))
                : 40000;

            const hoursPassed = Math.ceil(passedMs / 3600000);
            const computedCost = activeSession.durationOpts
                ? (hoursPassed > (activeSession.durationOpts / 60)
                    ? Math.ceil(hoursPassed / (activeSession.durationOpts / 60)) * activeSession.tableAmount
                    : activeSession.tableAmount)
                : hoursPassed * hourlyRate;

            setEstimatedCost(Math.round(computedCost));
        }, 1000);

        return () => clearInterval(interval);
    }, [activeSession]);

    if (showMissionAccomplished) {
        return (
            <div className="fade-in pb-40 text-white flex flex-col items-center justify-center h-[90vh] px-10 text-center animate-in zoom-in duration-500">
                <div className="w-32 h-32 rounded-full bg-blue-500/10 flex items-center justify-center mb-8 border-2 border-blue-500 shadow-[0_0_80px_rgba(59,130,246,0.3)] animate-pulse relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-30" />
                    <CheckCircle2 className="w-16 h-16 text-blue-500" />
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4 leading-tight">
                    TRANSAKSI<br/><span className="text-blue-500">BERHASIL</span>
                </h2>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-relaxed mb-12 italic opacity-80 max-w-[250px]">
                    Pembayaran telah diverifikasi oleh Kasir. Terima kasih atas kunjungan Anda.
                </p>
                <button
                    onClick={() => {
                        setShowMissionAccomplished(false);
                        setActiveTab('dashboard');
                    }}
                    className="flex items-center gap-2 px-10 py-4 border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 transition-colors rounded-2xl text-xs font-black uppercase tracking-widest"
                >
                    <X className="w-4 h-4" /> TUTUP
                </button>
            </div>
        );
    }

    if (!hasAnySession) {
        return (
            <div className="fade-in pb-40 text-white flex flex-col items-center justify-center h-[80vh] px-10 text-center">
                <div className="w-24 h-24 rounded-[32px] bg-white/5 flex items-center justify-center mb-8 border border-white/5 fiery-glow relative">
                    <div className="absolute inset-0 bg-white/5 rounded-[32px] animate-ping opacity-20" />
                    <Clock className="w-10 h-10 text-slate-700" />
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-3">No Active Protocol</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed mb-12 italic opacity-60">Authorize a mission at any arena sector to begin live tracking.</p>
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className="fiery-btn-secondary px-10 py-4 text-xs font-black uppercase tracking-widest"
                >
                    Return to HQ
                </button>
            </div>
        );
    }

    // Combine all orders
    const tableOrders = activeSession?.orders || [];
    const directFnbOrders = directFnbSessions.flatMap((s: any) => s.orders || []);
    const allOrders = [...tableOrders, ...directFnbOrders];

    const fnbTotal = allOrders.reduce((sum: number, o: any) => sum + ((o.price || 0) * (o.quantity || 1)), 0);
    const finalEstTotal = estimatedCost + fnbTotal;

    return (
        <div className="fade-in pb-40 text-white px-1">
            {/* Header Container */}
            <header className="flex justify-between items-center pt-6 pb-6 bg-[#0a0d18]/95 backdrop-blur-xl sticky top-0 z-50 -mx-6 px-10 border-b border-white/5 shadow-2xl">
                <button onClick={() => setActiveTab('dashboard')} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:text-primary transition-all border border-white/5 active:scale-95">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-black text-white italic uppercase tracking-tighter truncate max-w-[150px]">{activeSession?.table?.name || 'F&B SAJA'}</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Pemantauan Langsung</p>
                </div>
                <div className="px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] italic">{activeSession ? 'ENGAGED' : 'F&B ACTIVE'}</span>
                </div>
            </header>

            <div className="mt-8 space-y-10">
                {/* Timer Card (Only if table session exists) */}
                {activeSession ? (
                    <div className="bg-[#1a1f35]/30 p-12 rounded-[40px] text-center relative overflow-hidden flex flex-col items-center border border-white/5 shadow-lg">
                        
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 italic">
                            {activeSession?.durationOpts ? 'Waktu Misi Tersisa' : 'Durasi Sesi Biliar'}
                        </p>

                        <h2 className={`text-7xl font-black italic tracking-tighter mt-2 mb-10 ${activeSession?.durationOpts && elapsedTime.startsWith('-')
                            ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                            : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                            }`}>
                            {elapsedTime}
                        </h2>

                        <div className="grid grid-cols-2 gap-8 w-full mt-6 pt-10 border-t border-white/5">
                            <div className="text-left border-r border-white/5 pr-8">
                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1 italic">Waktu Mulai</p>
                                <p className="text-2xl font-black text-white italic tracking-tighter">
                                    {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div className="text-right pl-8">
                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1 italic">Billing Meja</p>
                                <p className="text-2xl font-black text-[#00d084] italic tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(0,208,132,0.3)]">
                                    {estimatedCost.toLocaleString()} <span className="text-sm">Rp</span>
                                </p>
                            </div>
                        </div>

                        <div className="mt-10 bg-black/40 rounded-[40px] p-8 w-full flex items-center justify-between border border-white/5 shadow-inner">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#101423] flex items-center justify-center border border-white/5">
                                    <Info className="w-5 h-5 text-slate-500" />
                                </div>
                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic pt-1">Estimasi Total</span>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-white italic tracking-tighter drop-shadow-md">
                                    {finalEstTotal.toLocaleString()} <span className="text-xs uppercase text-slate-500">Rp</span>
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="fiery-card p-10 bg-[#1a1f35]/50 border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center fiery-glow">
                                <UtensilsCrossed className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">Standalone Provision</p>
                                <p className="text-2xl font-black text-white italic uppercase tracking-tighter">F&B Operation</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">Total Bill</p>
                            <p className="text-3xl font-black text-primary italic tracking-tighter">{fnbTotal.toLocaleString()} <span className="text-xs">Rp</span></p>
                        </div>
                    </div>
                )}

                {/* F&B List */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Provisions Detail</h3>
                        <button
                            onClick={() => setActiveTab('menu')}
                            className="fiery-btn-primary px-6 py-2.5 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all italic flex items-center gap-3"
                        >
                            <UtensilsCrossed className="w-4 h-4" />
                            Provision Hub
                        </button>
                    </div>

                    {(!allOrders || allOrders.length === 0) ? (
                        <div className="fiery-card py-24 text-center border-dashed border-white/10 opacity-60">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic leading-relaxed">No supplies deployed.<br />Combat readiness at 100%.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {allOrders.map((order: any) => (
                                <div key={order.id} className="fiery-card p-6 flex items-center gap-6 border-white/5 bg-[#1a1f35]/40 hover:bg-[#1a1f35]/60 transition-all rounded-[32px]">
                                    <div className="w-16 h-16 rounded-2xl bg-[#101423] flex-shrink-0 flex items-center justify-center border border-white/5">
                                        <span className="font-black text-xs text-slate-600 uppercase italic">{(order.product?.name || '??').substring(0, 2)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-base text-white truncate uppercase italic tracking-tighter">{order.product?.name || 'Item'}</h4>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 italic">
                                            {(order.price || 0).toLocaleString()} <span className="text-slate-700 mx-1">×</span> {order.quantity}
                                        </p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <p className="text-xl font-black text-white italic tracking-tighter mb-2">{(order.total || 0).toLocaleString()}</p>
                                        <span className="text-[8px] font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full flex items-center uppercase tracking-widest italic fiery-glow">
                                            <CheckCircle2 className="w-2.5 h-2.5 mr-2" strokeWidth={3} /> Verified
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

