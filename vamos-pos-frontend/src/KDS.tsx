import { useState, useEffect } from 'react';
import { api, getSocketURL } from './api';
import { io } from 'socket.io-client';
import { Loader2, CheckCircle, Clock, ChefHat, Play, Check } from 'lucide-react';
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

    const pendingOrders = orders.filter(o => o.kdsStatus === 'PENDING');
    const processingOrders = orders.filter(o => o.kdsStatus === 'PROCESSING');
    const readyOrders = orders.filter(o => o.kdsStatus === 'READY');

    const OrderCard = ({ order, nextStatus, nextLabel, nextIcon: Icon, nextColor }: any) => (
        <div className="bg-[#141414] border border-[#222] rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-white font-bold text-lg">{order.product?.name}</span>
                    <span className="bg-[#222] text-white px-2 py-1 rounded text-sm font-bold">x{order.quantity}</span>
                </div>
                <div className="text-gray-400 text-sm mb-4">
                    Table: <span className="text-white font-bold">{order.session?.table?.name || 'Direct'}</span>
                </div>
                <div className="text-xs text-gray-500 mb-4">
                    {new Date(order.createdAt).toLocaleTimeString()}
                </div>
            </div>
            <button 
                onClick={() => updateStatus(order.id, nextStatus)}
                className={`w-full py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${nextColor} text-white`}
            >
                <Icon className="w-4 h-4" /> {nextLabel}
            </button>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a] text-white overflow-hidden animate-in fade-in duration-300">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30 text-orange-500">
                    <ChefHat className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-black italic tracking-tight uppercase">Kitchen Display</h2>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Real-time Order Management</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Column 1: Pending */}
                <div className="bg-[#111] rounded-2xl p-4 border border-[#222] flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#333]">
                        <h3 className="font-bold text-red-500 flex items-center gap-2 uppercase tracking-widest text-xs">
                            <Clock className="w-4 h-4" /> Pending
                        </h3>
                        <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-xs font-bold">{pendingOrders.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {pendingOrders.map(o => (
                            <OrderCard key={o.id} order={o} nextStatus="PROCESSING" nextLabel="Process" nextIcon={Play} nextColor="bg-orange-600 hover:bg-orange-500" />
                        ))}
                    </div>
                </div>

                {/* Column 2: Processing */}
                <div className="bg-[#111] rounded-2xl p-4 border border-[#222] flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#333]">
                        <h3 className="font-bold text-orange-500 flex items-center gap-2 uppercase tracking-widest text-xs">
                            <ChefHat className="w-4 h-4" /> Processing
                        </h3>
                        <span className="bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded text-xs font-bold">{processingOrders.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {processingOrders.map(o => (
                            <OrderCard key={o.id} order={o} nextStatus="READY" nextLabel="Ready" nextIcon={CheckCircle} nextColor="bg-green-600 hover:bg-green-500" />
                        ))}
                    </div>
                </div>

                {/* Column 3: Ready */}
                <div className="bg-[#111] rounded-2xl p-4 border border-[#222] flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#333]">
                        <h3 className="font-bold text-green-500 flex items-center gap-2 uppercase tracking-widest text-xs">
                            <Check className="w-4 h-4" /> Ready to Serve
                        </h3>
                        <span className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded text-xs font-bold">{readyOrders.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {readyOrders.map(o => (
                            <OrderCard key={o.id} order={o} nextStatus="SERVED" nextLabel="Served" nextIcon={Check} nextColor="bg-blue-600 hover:bg-blue-500" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
