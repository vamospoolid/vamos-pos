import { useState, useEffect, useMemo } from 'react';
import { api, getSocketURL } from './api';
import { io } from 'socket.io-client';
import { 
    Loader2, CheckCircle, Clock, ChefHat, Check, 
    MessageSquare, Flame, History, RotateCcw, Sparkles 
} from 'lucide-react';
import { vamosAlert, vamosConfirm } from './utils/dialog';

const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.1);
        gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
        gain2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.6);
    } catch(e) {
        console.error('Audio play failed', e);
    }
};

interface KDSTicket {
    sessionId: string;
    tableName?: string;
    isTable: boolean;
    customerName?: string;
    waiterName?: string;
    createdAt: string;
    updatedAt: string;
    items: any[];
}

export default function KDS() {
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
    const [activeOrders, setActiveOrders] = useState<any[]>([]);
    const [historyOrders, setHistoryOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingSessionId, setProcessingSessionId] = useState<string | null>(null);
    const [now, setNow] = useState<number>(Date.now());
    const [, setPreviousPendingCount] = useState<number>(-1);

    // Live timer ticking every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async (isBackgroundUpdate = false) => {
        try {
            const [activeRes, historyRes] = await Promise.all([
                api.get('/orders/kds?status=active'),
                api.get('/orders/kds?status=history')
            ]);

            const newActive = activeRes.data.data || [];
            const newHistory = historyRes.data.data || [];

            setActiveOrders(newActive);
            setHistoryOrders(newHistory);

            const newPending = newActive.filter((o: any) => o.kdsStatus !== 'SERVED').length;
            if (isBackgroundUpdate) {
                setPreviousPendingCount(prev => {
                    if (prev !== -1 && newPending > prev) {
                        playNotificationSound();
                        vamosAlert('🔔 Pesanan F&B Baru Masuk ke Dapur!');
                    }
                    return newPending;
                });
            } else {
                setPreviousPendingCount(newPending);
            }
        } catch (err) {
            console.error('Failed to fetch KDS orders', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(false);
        const socketUrl = getSocketURL();
        const socket = io(socketUrl);
        socket.on('kds:updated', () => fetchOrders(true));
        socket.on('orders:updated', () => fetchOrders(true));
        return () => { socket.disconnect(); };
    }, []);

    // Toggle checklist for individual item
    const toggleItemStatus = async (orderId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'READY' ? 'PENDING' : 'READY';
        try {
            await api.patch(`/orders/kds/${orderId}/status`, { status: newStatus });
            // Optimistic update
            setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, kdsStatus: newStatus } : o));
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal mengubah status item');
        }
    };

    // Serve all items in a ticket / session (1 click)
    const handleServeAllInSession = async (sessionId: string, targetName: string) => {
        setProcessingSessionId(sessionId);
        try {
            await api.patch(`/orders/kds/session/${sessionId}/serve-all`);
            // Optimistically remove from active
            setActiveOrders(prev => prev.filter(o => o.sessionId !== sessionId));
            fetchOrders(false);
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || `Gagal menyelesaikan pesanan ${targetName}`);
        } finally {
            setProcessingSessionId(null);
        }
    };

    // Revert served session back to active queue
    const handleRevertSession = async (sessionId: string, targetName: string) => {
        const ok = await vamosConfirm(`Kembalikan pesanan ${targetName} ke antrian aktif dapur?`);
        if (!ok) return;

        setProcessingSessionId(sessionId);
        try {
            await api.patch(`/orders/kds/session/${sessionId}/revert`);
            fetchOrders(false);
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal mengembalikan pesanan');
        } finally {
            setProcessingSessionId(null);
        }
    };

    // Grouping orders by sessionId into tickets
    const groupOrders = (ordersList: any[]): KDSTicket[] => {
        const map = new Map<string, KDSTicket>();

        for (const order of ordersList) {
            const sId = order.sessionId || order.id;
            if (!map.has(sId)) {
                const isTable = Boolean(order.session?.table?.name || order.session?.tableId);
                const waiter = order.waiterName || (
                    order.session?.customerName?.startsWith('Pelanggan (Waiter:')
                        ? order.session.customerName.replace('Pelanggan (Waiter: ', '').replace(')', '')
                        : null
                );

                map.set(sId, {
                    sessionId: sId,
                    tableName: order.session?.table?.name,
                    isTable,
                    customerName: order.session?.customerName,
                    waiterName: waiter,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt || order.createdAt,
                    items: []
                });
            }

            const ticket = map.get(sId)!;
            ticket.items.push(order);
            if (new Date(order.createdAt) < new Date(ticket.createdAt)) {
                ticket.createdAt = order.createdAt;
            }
            if (new Date(order.updatedAt) > new Date(ticket.updatedAt)) {
                ticket.updatedAt = order.updatedAt;
            }
        }

        return Array.from(map.values());
    };

    const activeTickets = useMemo(() => groupOrders(activeOrders), [activeOrders]);
    const historyTickets = useMemo(() => groupOrders(historyOrders), [historyOrders]);

    const formatElapsedTime = (createdAt: string) => {
        const diffMs = now - new Date(createdAt).getTime();
        const mins = Math.max(0, Math.floor(diffMs / 60000));
        if (mins < 1) return { text: '< 1 mnt lalu', level: 'normal' };
        if (mins < 10) return { text: `${mins} mnt lalu`, level: 'normal' };
        if (mins < 20) return { text: `${mins} mnt lalu`, level: 'warning' };
        return { text: `${mins} mnt lalu (LAMA!)`, level: 'urgent' };
    };

    const clearAllActive = async () => {
        const ok = await vamosConfirm('Yakin ingin menyelesaikan SEMUA antrian dapur saat ini?');
        if (!ok) return;
        try {
            for (const ticket of activeTickets) {
                await api.patch(`/orders/kds/session/${ticket.sessionId}/serve-all`);
            }
            fetchOrders(false);
            vamosAlert('Semua antrian pesanan berhasil diselesaikan!');
        } catch (err: any) {
            vamosAlert('Gagal membersihkan pesanan');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-full min-h-[400px] text-gray-500 gap-3">
                <Loader2 className="animate-spin text-[#00ff66] w-10 h-10" />
                <p className="text-xs uppercase font-bold tracking-widest text-gray-400">Memuat Antrian Dapur KDS...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a] text-gray-200 overflow-hidden">
            {/* Header & Tabs */}
            <div className="border-b border-[#222] bg-[#111] p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                            <ChefHat className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                                Kitchen Display System (KDS)
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 uppercase tracking-widest hidden sm:inline-block">
                                    Live Queue
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400">Daftar Tiket Pesanan per Meja & Kafe</p>
                        </div>
                    </div>

                    {activeTab === 'ACTIVE' && activeTickets.length > 0 && (
                        <button 
                            onClick={clearAllActive}
                            className="px-3.5 py-2 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-500/30 hover:border-red-600 flex items-center gap-2 self-start sm:self-auto"
                        >
                            <CheckCircle className="w-3.5 h-3.5" /> Selesaikan Semua Tiket
                        </button>
                    )}
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('ACTIVE')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            activeTab === 'ACTIVE'
                                ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                                : 'bg-[#181818] text-gray-400 hover:text-white border border-[#2a2a2a]'
                        }`}
                    >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Antrian Aktif</span>
                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            activeTab === 'ACTIVE' ? 'bg-black text-orange-400' : 'bg-white/10 text-gray-300'
                        }`}>
                            {activeTickets.length} Tiket ({activeOrders.length} Item)
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('HISTORY')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            activeTab === 'HISTORY'
                                ? 'bg-[#00ff66] text-black shadow-lg shadow-[#00ff66]/20'
                                : 'bg-[#181818] text-gray-400 hover:text-white border border-[#2a2a2a]'
                        }`}
                    >
                        <History className="w-3.5 h-3.5" />
                        <span>Riwayat Selesai Hari Ini</span>
                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            activeTab === 'HISTORY' ? 'bg-black text-[#00ff66]' : 'bg-white/10 text-gray-300'
                        }`}>
                            {historyTickets.length} Selesai
                        </span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-24 md:pb-8 custom-scrollbar">
                {activeTab === 'ACTIVE' ? (
                    activeTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-gray-500 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-gray-600">
                                <CheckCircle className="w-8 h-8 opacity-40" />
                            </div>
                            <p className="text-base font-bold text-gray-300">Semua Pesanan Bersih!</p>
                            <p className="text-xs text-gray-500 mt-1">Dapur sedang santai. Belum ada tiket antrian baru.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
                            {activeTickets.map(ticket => {
                                const timer = formatElapsedTime(ticket.createdAt);
                                const isAllReady = ticket.items.every(item => item.kdsStatus === 'READY');
                                const isBusy = processingSessionId === ticket.sessionId;
                                const targetName = ticket.isTable 
                                    ? `Meja ${ticket.tableName}` 
                                    : (ticket.customerName || 'Walk-in Kafe');

                                return (
                                    <div
                                        key={ticket.sessionId}
                                        className={`rounded-2xl border-2 flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-200 ${
                                            ticket.isTable
                                                ? 'bg-[#0e1612] border-emerald-500/40 hover:border-emerald-500/70 shadow-emerald-950/20'
                                                : 'bg-[#181310] border-amber-500/40 hover:border-amber-500/70 shadow-amber-950/20'
                                        }`}
                                    >
                                        {/* Card Header with Color Distinction */}
                                        <div className={`p-3.5 border-b flex justify-between items-start gap-2 ${
                                            ticket.isTable 
                                                ? 'bg-gradient-to-r from-emerald-950/60 to-transparent border-emerald-500/20' 
                                                : 'bg-gradient-to-r from-amber-950/60 to-transparent border-amber-500/20'
                                        }`}>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    {ticket.isTable ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wide">
                                                            🎱 MEJA {ticket.tableName}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase tracking-wide">
                                                            ☕ KAFE / TAKEAWAY
                                                        </span>
                                                    )}

                                                    {ticket.waiterName && (
                                                        <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-300 font-medium">
                                                            Waiter: {ticket.waiterName}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-gray-300 font-semibold line-clamp-1">
                                                    {ticket.customerName && ticket.customerName !== 'Walk-in Customer'
                                                        ? ticket.customerName
                                                        : (ticket.isTable ? 'Pelanggan Meja' : 'Pelanggan Walk-In')}
                                                </p>
                                            </div>

                                            {/* Timer Badge */}
                                            <div className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-1 rounded-lg shrink-0 ${
                                                timer.level === 'urgent'
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                                                    : timer.level === 'warning'
                                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                    : 'bg-white/5 text-gray-400 border border-white/10'
                                            }`}>
                                                <Clock className="w-3 h-3" />
                                                <span>{timer.text}</span>
                                            </div>
                                        </div>

                                        {/* Items Checklist Area */}
                                        <div className="p-3 space-y-2 flex-1">
                                            <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase font-black tracking-wider px-1">
                                                <span>Menu Dipesan ({ticket.items.length})</span>
                                                <span className="italic text-gray-600">Klik item untuk ceklis</span>
                                            </div>

                                            <div className="space-y-1.5">
                                                {ticket.items.map((item: any) => {
                                                    const isReady = item.kdsStatus === 'READY';

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => toggleItemStatus(item.id, item.kdsStatus)}
                                                            className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all duration-150 select-none group ${
                                                                isReady
                                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-gray-400 opacity-70'
                                                                    : 'bg-black/40 border-white/5 hover:border-white/20 text-gray-200'
                                                            }`}
                                                        >
                                                            {/* Checkbox */}
                                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                                                isReady
                                                                    ? 'bg-emerald-500 border-emerald-400 text-black'
                                                                    : 'border-gray-600 group-hover:border-gray-400 bg-black/40'
                                                            }`}>
                                                                {isReady && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                            </div>

                                                            {/* Item Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-baseline gap-2">
                                                                    <span className={`text-sm font-bold leading-tight ${
                                                                        isReady ? 'line-through text-gray-400' : 'text-white'
                                                                    }`}>
                                                                        {item.product?.name || 'Menu'}
                                                                    </span>
                                                                    <span className="text-xs font-mono font-black bg-white/10 px-2 py-0.5 rounded-md text-amber-300 shrink-0">
                                                                        x{item.quantity}
                                                                    </span>
                                                                </div>

                                                                {item.notes && (
                                                                    <div className="mt-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium flex items-center gap-1 inline-flex">
                                                                        <MessageSquare className="w-3 h-3 shrink-0" />
                                                                        <span>{item.notes}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Bottom Action: Selesaikan Semua 1 Klik */}
                                        <div className="p-3 pt-0">
                                            <button
                                                type="button"
                                                onClick={() => handleServeAllInSession(ticket.sessionId, targetName)}
                                                disabled={isBusy}
                                                className={`w-full py-3.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
                                                    isBusy
                                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                                        : isAllReady
                                                        ? 'bg-[#00ff66] text-black hover:bg-[#00e65c] shadow-[#00ff66]/20'
                                                        : ticket.isTable
                                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-emerald-950/40'
                                                        : 'bg-[#d48c5c] hover:bg-[#e39c6c] text-[#0c0908] shadow-amber-950/40'
                                                }`}
                                            >
                                                {isBusy ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : isAllReady ? (
                                                    <Sparkles className="w-4 h-4" />
                                                ) : (
                                                    <Check className="w-4 h-4 stroke-[3]" />
                                                )}
                                                <span>
                                                    {isAllReady ? 'Semua Siap - Selesaikan Tiket' : 'Selesaikan Semua (1 Klik)'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    /* History Tab */
                    historyTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-gray-500 text-center">
                            <History className="w-12 h-12 mb-3 opacity-30 text-gray-600" />
                            <p className="text-base font-bold text-gray-300">Belum Ada Riwayat Selesai</p>
                            <p className="text-xs text-gray-500 mt-1">Pesanan yang diselesaikan hari ini akan tercatat di sini.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
                            {historyTickets.map(ticket => {
                                const isBusy = processingSessionId === ticket.sessionId;
                                const targetName = ticket.isTable 
                                    ? `Meja ${ticket.tableName}` 
                                    : (ticket.customerName || 'Walk-in Kafe');

                                return (
                                    <div
                                        key={ticket.sessionId}
                                        className="bg-[#141414] border border-[#2a2a2a] rounded-2xl flex flex-col justify-between overflow-hidden shadow-md"
                                    >
                                        <div className="p-3.5 border-b border-[#222] bg-white/[0.02]">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                {ticket.isTable ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        🎱 MEJA {ticket.tableName}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                        ☕ KAFE / TAKEAWAY
                                                    </span>
                                                )}

                                                <span className="text-[10px] text-gray-500 font-mono">
                                                    Selesai: {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-400">
                                                {ticket.customerName || 'Pelanggan'}
                                            </p>
                                        </div>

                                        <div className="p-3 space-y-1.5 flex-1">
                                            {ticket.items.map((item: any) => (
                                                <div key={item.id} className="flex justify-between items-center text-xs text-gray-400 py-1 border-b border-white/[0.03]">
                                                    <span className="line-through">{item.product?.name || 'Menu'}</span>
                                                    <span className="font-mono font-bold text-gray-500">x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-3 pt-0">
                                            <button
                                                type="button"
                                                onClick={() => handleRevertSession(ticket.sessionId, targetName)}
                                                disabled={isBusy}
                                                className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                            >
                                                {isBusy ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                                                )}
                                                <span>Kembalikan ke Antrian</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
