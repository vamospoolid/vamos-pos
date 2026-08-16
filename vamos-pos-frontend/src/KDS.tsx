import { useState, useEffect } from 'react';
import { api, getSocketURL } from './api';
import { io } from 'socket.io-client';
import { Loader2, CheckCircle, Clock, ChefHat, Check } from 'lucide-react';
import { vamosAlert } from './utils/dialog';

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
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
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
        osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.1); // C6
        gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
        gain2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.6);
    } catch(e) {
        console.error('Audio play failed', e);
    }
};


export default function KDS() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setPreviousPendingCount] = useState<number>(-1);
    const fetchOrders = async (isBackgroundUpdate = false) => {
        try {
            const res = await api.get('/orders/kds');
            const newOrders = res.data.data;
            const newPending = newOrders.filter((o: any) => o.kdsStatus === 'PENDING').length;
            
            setOrders(newOrders);
            
            if (isBackgroundUpdate) {
                setPreviousPendingCount(prev => {
                    if (prev !== -1 && newPending > prev) {
                        playNotificationSound();
                        vamosAlert('🔔 Pesanan F&B Baru Masuk!');
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
        return () => { socket.disconnect(); };
    }, []);

    const updateStatus = async (orderId: string, status: string) => {
        try {
            await api.patch(`/orders/kds/${orderId}/status`, { status });
            // Socket will trigger refetch
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-primary w-12 h-12" />
            </div>
        );
    }

    const activeOrders = orders.filter(o => ['PENDING', 'PROCESSING', 'READY'].includes(o.kdsStatus));

    const OrderCard = ({ order }: any) => (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-gray-100 font-semibold text-lg leading-tight">{order.product?.name}</span>
                    <span className="bg-[#333] text-gray-200 px-3 py-1 rounded-md text-sm font-bold ml-2">x{order.quantity}</span>
                </div>
                <div className="text-gray-400 text-sm mb-4">
                    Meja: <span className="text-gray-200 font-medium">{order.session?.table?.name || 'Direct'}</span>
                </div>
                <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
            <button 
                onClick={() => updateStatus(order.id, 'SERVED')}
                className="w-full py-3 mt-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all bg-[#2c2c2c] hover:bg-green-600 hover:text-white text-gray-300 border border-[#444] hover:border-green-500"
            >
                <Check className="w-4 h-4" /> Selesai
            </button>
        </div>
    );

    const clearAll = async () => {
        if (!window.confirm('Yakin ingin menyelesaikan semua pesanan aktif?')) return;
        try {
            for (const order of activeOrders) {
                await api.patch(`/orders/kds/${order.id}/status`, { status: 'SERVED' });
            }
            vamosAlert('Semua pesanan berhasil diselesaikan!');
        } catch (err: any) {
            vamosAlert('Gagal membersihkan pesanan');
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0f0f0f] text-gray-200 overflow-hidden">
            <div className="flex items-center justify-between mb-6 px-2 pt-2">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#222] rounded-lg flex items-center justify-center text-gray-400">
                        <ChefHat className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Kitchen Display</h2>
                        <p className="text-xs text-gray-500">Daftar Pesanan Aktif</p>
                    </div>
                </div>
                {activeOrders.length > 0 && (
                    <button 
                        onClick={clearAll}
                        className="px-4 py-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg text-sm font-bold transition-all border border-red-500/20 hover:border-red-600 flex items-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" /> Clear All
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-6 custom-scrollbar">
                {activeOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <CheckCircle className="w-12 h-12 mb-3 opacity-20" />
                        <p>Tidak ada pesanan aktif</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-max">
                        {activeOrders.map(o => (
                            <OrderCard key={o.id} order={o} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
