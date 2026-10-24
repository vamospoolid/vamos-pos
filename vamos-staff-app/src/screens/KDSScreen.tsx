import { useState, useEffect, useRef } from 'react';
import { ChefHat, Check, Clock, MessageSquare, ArrowLeft, RefreshCw, Volume2, VolumeX, AlertTriangle, Coffee, Utensils } from 'lucide-react';
import { io } from 'socket.io-client';
import { api, getSocketUrl } from '../api';

interface KDSScreenProps {
    staff: any;
    onBack?: () => void;
}

export default function KDSScreen({ staff, onBack }: KDSScreenProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING'>('ALL');
    const [currentTime, setCurrentTime] = useState(Date.now());
    const prevPendingCountRef = useRef<number>(-1);

    // Audio Chime (Dual-tone ding-dong)
    const playNotificationSound = () => {
        if (!soundEnabled) return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.05);
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
            gain2.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
            osc2.start(ctx.currentTime + 0.1);
            osc2.stop(ctx.currentTime + 0.6);
        } catch (e) {
            console.error('Audio play error', e);
        }
    };

    // Vibrate trigger for mobile phone
    const triggerVibrate = () => {
        if (navigator.vibrate) {
            try {
                navigator.vibrate([300, 150, 300]);
            } catch {
                // ignore
            }
        }
    };

    // Fetch KDS orders from staff endpoint
    const fetchOrders = async (isBackground = false) => {
        try {
            const res = await api.get('/staff/kds');
            if (res.data?.success) {
                const list = res.data.data || [];
                const pendingCount = list.filter((o: any) => o.kdsStatus === 'PENDING').length;

                setOrders(list);

                if (isBackground && prevPendingCountRef.current !== -1 && pendingCount > prevPendingCountRef.current) {
                    playNotificationSound();
                    triggerVibrate();
                }
                prevPendingCountRef.current = pendingCount;
            }
        } catch (err) {
            console.error('Failed to load KDS orders', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(false);

        // Timer interval to refresh minute elapsed badge
        const timerId = setInterval(() => setCurrentTime(Date.now()), 15000);

        // Unlock browser audio context on first mobile tap/click
        const unlockAudio = () => {
            try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioCtx) {
                    const ctx = new AudioCtx();
                    ctx.resume().catch(() => {});
                }
            } catch {
                // ignore
            }
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
        window.addEventListener('click', unlockAudio, { once: true });
        window.addEventListener('touchstart', unlockAudio, { once: true });

        // Socket connection
        const socketUrl = getSocketUrl();
        const socket = io(socketUrl);
        socket.on('kds:updated', () => fetchOrders(true));

        return () => {
            clearInterval(timerId);
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            socket.disconnect();
        };
    }, []);

    // Update status to PROCESSING or SERVED
    const handleUpdateStatus = async (orderId: string, status: string) => {
        try {
            // Optimistic local update
            setOrders(prev =>
                status === 'SERVED'
                    ? prev.filter(o => o.id !== orderId)
                    : prev.map(o => (o.id === orderId ? { ...o, kdsStatus: status } : o))
            );
            await api.patch(`/staff/kds/${orderId}/status`, { status });
        } catch (err: any) {
            alert(err.response?.data?.message || 'Gagal mengubah status pesanan');
            fetchOrders(false);
        }
    };

    const pendingOrders = orders.filter(o => o.kdsStatus === 'PENDING');
    const processingOrders = orders.filter(o => o.kdsStatus === 'PROCESSING');

    const filteredOrders = orders.filter(o => {
        if (activeFilter === 'PENDING') return o.kdsStatus === 'PENDING';
        if (activeFilter === 'PROCESSING') return o.kdsStatus === 'PROCESSING';
        return true;
    });

    const getElapsedMinutes = (dateStr: string) => {
        const diffMs = currentTime - new Date(dateStr).getTime();
        return Math.max(0, Math.floor(diffMs / 60000));
    };

    return (
        <div className="min-h-screen bg-[#F5F7FC] text-[#0F172A] pb-32 max-w-md mx-auto">
            {/* Top Bar Header */}
            <div className="bg-gradient-to-b from-[#182163] via-[#1E2875] to-[#2538D4] text-white pt-6 pb-6 px-5 rounded-b-[32px] shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                    {onBack ? (
                        <button
                            onClick={onBack}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4 text-amber-300" /> Beranda
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center gap-1.5">
                        <span className="p-1.5 rounded-xl bg-white/15 text-amber-300">
                            <ChefHat className="w-5 h-5 stroke-[2.2]" />
                        </span>
                        <h2 className="text-sm font-black text-white uppercase tracking-wider">KDS Dapur & Bar</h2>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => {
                                setSoundEnabled(!soundEnabled);
                                if (!soundEnabled) playNotificationSound();
                            }}
                            className={`p-2 rounded-xl transition-all active:scale-95 ${
                                soundEnabled
                                    ? 'bg-white text-[#1E2875] shadow-sm'
                                    : 'bg-white/10 text-white/60 hover:text-white'
                            }`}
                            title={soundEnabled ? 'Suara Aktif' : 'Suara Mati'}
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => fetchOrders(false)}
                            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95"
                            title="Segarkan data"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Quick Status Tabs */}
                <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/15 gap-1">
                    <button
                        onClick={() => setActiveFilter('ALL')}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${
                            activeFilter === 'ALL'
                                ? 'bg-white text-[#1E2875] shadow-md font-black'
                                : 'text-white/80 hover:text-white'
                        }`}
                    >
                        Semua ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveFilter('PENDING')}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${
                            activeFilter === 'PENDING'
                                ? 'bg-[#FF5E14] text-white shadow-md font-black'
                                : 'text-white/80 hover:text-white'
                        }`}
                    >
                        Antrean ({pendingOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveFilter('PROCESSING')}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${
                            activeFilter === 'PROCESSING'
                                ? 'bg-amber-400 text-slate-900 shadow-md font-black'
                                : 'text-white/80 hover:text-white'
                        }`}
                    >
                        Dibuat ({processingOrders.length})
                    </button>
                </div>
            </div>

            {/* Orders Feed */}
            <div className="p-4 space-y-3">
                {filteredOrders.length === 0 ? (
                    <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(30,40,117,0.05)] space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                            <Check className="w-7 h-7 stroke-[2.5]" />
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-800">Semua Pesanan Selesai!</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                            Tidak ada antrean pesanan makanan atau minuman saat ini. HP akan berbunyi & bergetar saat ada order baru masuk.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredOrders.map(order => {
                            const elapsed = getElapsedMinutes(order.createdAt);
                            const isLate = elapsed >= 10;
                            const isWarning = elapsed >= 5 && elapsed < 10;
                            const isPending = order.kdsStatus === 'PENDING';

                            const targetLocation = order.session?.table?.name
                                ? `🎱 Meja ${order.session.table.name}`
                                : `☕ ${order.session?.customerName || 'Tamu Cafe'}`;

                            const waiterName = order.waiterName || (order.session?.customerName?.startsWith('Pelanggan (Waiter:')
                                ? order.session.customerName.replace('Pelanggan (Waiter: ', '').replace(')', '')
                                : null);

                            return (
                                <div
                                    key={order.id}
                                    className={`p-4 rounded-3xl bg-white border transition-all space-y-3 shadow-[0_8px_30px_rgba(30,40,117,0.06)] ${
                                        isLate
                                            ? 'border-rose-300 ring-2 ring-rose-200'
                                            : isPending
                                            ? 'border-amber-200'
                                            : 'border-slate-100'
                                    }`}
                                >
                                    {/* Header Card: Location & Timer */}
                                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                Tujuan Antar:
                                            </span>
                                            <h4 className="text-sm font-black text-slate-900">
                                                {targetLocation}
                                            </h4>
                                        </div>

                                        {/* Timer Badge */}
                                        <div className="text-right">
                                            <span
                                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black inline-flex items-center gap-1 ${
                                                    isLate
                                                        ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                                                        : isWarning
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                }`}
                                            >
                                                <Clock className="w-3 h-3" />
                                                <span>{elapsed} mnt lalu</span>
                                            </span>
                                            <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Product Name & Qty */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-2.5 flex-1">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                                                {order.product?.category?.toLowerCase().includes('minum') ? '☕' : '🍽️'}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-800 leading-snug">
                                                    {order.product?.name}
                                                </h3>
                                                {waiterName && (
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                                        Pelayan: <strong className="text-[#1E2875]">{waiterName}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="px-3 py-1 rounded-2xl bg-[#EEF2FF] text-[#1E2875] font-black text-base shrink-0 border border-indigo-100">
                                            x{order.quantity}
                                        </div>
                                    </div>

                                    {/* Custom Modifier Notes */}
                                    {order.notes && (
                                        <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-start gap-2">
                                            <MessageSquare className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                                            <span className="flex-1">Catatan: "{order.notes}"</span>
                                        </div>
                                    )}

                                    {/* Action Buttons for Kitchen / Barista */}
                                    <div className="pt-1 flex gap-2">
                                        {isPending ? (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'PROCESSING')}
                                                    className="flex-1 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 hover:bg-slate-100"
                                                >
                                                    <Coffee className="w-4 h-4 text-[#FF5E14]" /> Buat Sekarang
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                                                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#1E2875] to-[#2538D4] text-white font-black text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-royal"
                                                >
                                                    <Check className="w-4 h-4" /> Langsung Siap
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#1E2875] to-[#2538D4] text-white font-black text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-royal"
                                            >
                                                <Check className="w-4 h-4" /> ✅ Siap Saji / Sudah Diantar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
