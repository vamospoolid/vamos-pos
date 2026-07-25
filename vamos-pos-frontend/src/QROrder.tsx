import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ShoppingCart, Plus, Minus, CheckCircle, UtensilsCrossed } from 'lucide-react';
import { VamosLogo } from './components/VamosLogo';
import { getProductEmojiAndStyle } from './FnBOrder';

const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://pos.vamospool.id/api' 
    : 'http://localhost:3000/api';

export default function QROrder({ tableId }: { tableId: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<{product: any, qty: number}[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await axios.get(`${API_BASE}/qr/menu/${tableId}`);
                setData(res.data.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load menu');
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, [tableId]);

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id 
                    ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { product, qty: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === productId);
            if (existing && existing.qty > 1) {
                return prev.map(item => item.product.id === productId 
                    ? { ...item, qty: item.qty - 1 } : item);
            }
            return prev.filter(item => item.product.id !== productId);
        });
    };

    const submitOrder = async () => {
        if (cart.length === 0) return;
        setSubmitting(true);
        try {
            const payload = {
                cart: cart.map(item => ({ productId: item.product.id, quantity: item.qty }))
            };
            await axios.post(`${API_BASE}/qr/order/${tableId}`, payload);
            setSuccess(true);
            setCart([]);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to place order');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="bg-[#050505] min-h-screen">
            <div className="w-full max-w-md mx-auto min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-primary mt-6 animate-pulse">Loading Menu...</p>
            </div>
        </div>
    );
    
    if (error) {
        return (
            <div className="bg-[#050505] min-h-screen">
                <div className="w-full max-w-md mx-auto min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 text-center relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]"></div>
                    <div className="relative z-10">
                        <UtensilsCrossed className="w-16 h-16 text-red-500/50 mb-6 mx-auto" />
                        <h1 className="text-2xl font-black uppercase tracking-tighter mb-3 text-white">Error Loading Menu</h1>
                        <p className="text-red-400 text-sm font-bold bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="bg-[#050505] min-h-screen">
                <div className="w-full max-w-md mx-auto min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 text-center relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
                    
                    <div className="relative z-10 animate-in zoom-in-50 duration-500">
                        <div className="w-28 h-28 mx-auto bg-green-500/10 backdrop-blur-md rounded-full flex items-center justify-center mb-8 shadow-[0_0_80px_rgba(34,197,94,0.4)] border border-green-500/30">
                            <CheckCircle className="w-14 h-14 text-primary drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter mb-3 text-white">Order<br/>Placed!</h1>
                        <p className="text-gray-400 text-sm font-bold mb-10 max-w-[250px] mx-auto leading-relaxed">
                            The kitchen has received your order for Table <span className="text-white">{data.table.name}</span> and is preparing it.
                        </p>
                        <button onClick={() => setSuccess(false)} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 hover:border-white/30 transition-all w-full max-w-[200px] shadow-xl backdrop-blur-md">
                            Order More
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const totalCart = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);

    return (
        <div className="bg-[#050505] min-h-screen font-sans selection:bg-primary/30">
            <div className="w-full max-w-md mx-auto min-h-screen bg-[#0a0a0a] text-white pb-32 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col">
                
                {/* Hero / Header Section */}
                <header className="relative w-full pt-12 pb-6 px-6 overflow-hidden rounded-b-[2.5rem] shadow-2xl z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#0a0a0a] z-0"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
                    
                    <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="p-3 bg-black/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
                            <VamosLogo className="w-10 h-10" glowing />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">VAMOS POOL</h1>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] mt-1">Cafe & Resto</p>
                        </div>
                        
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-inner">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,255,102,0.8)]"></div>
                            <span className="text-xs font-bold text-gray-300">Table: <span className="text-white font-black">{data.table.name}</span></span>
                        </div>
                    </div>
                </header>

                {/* Menu List */}
                <div className="flex-1 p-5 space-y-4 mt-2">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h2 className="text-lg font-black uppercase tracking-tighter text-white">Menu List</h2>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{data.products.length} Items</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {data.products.map((p: any) => {
                            const style = getProductEmojiAndStyle(p.name, p.category);
                            const qty = cart.find(c => c.product.id === p.id)?.qty || 0;
                            const isSelected = qty > 0;
                            
                            return (
                                <div key={p.id} className={`group relative overflow-hidden rounded-3xl transition-all duration-300 ${isSelected ? 'bg-primary/5 border-primary/40 shadow-[0_10px_30px_rgba(0,255,102,0.1)]' : 'bg-[#121212] border-[#222] hover:border-gray-600 hover:shadow-xl'} border flex flex-col`}>
                                    {isSelected && <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_10px_rgba(0,255,102,0.8)] z-10"></div>}
                                    
                                    {/* Simulated Image Area */}
                                    <div className={`w-full aspect-square flex items-center justify-center text-5xl relative overflow-hidden ${style.bg} bg-opacity-30 border-b border-[#222]`}>
                                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                                        <span className="relative z-10 drop-shadow-2xl group-hover:scale-125 transition-transform duration-500">{style.emoji}</span>
                                    </div>
                                    
                                    {/* Content Area */}
                                    <div className="p-3 flex-1 flex flex-col justify-between bg-gradient-to-b from-black/20 to-transparent">
                                        <div>
                                            <h3 className="font-black text-white text-[11px] leading-snug line-clamp-2">{p.name}</h3>
                                            <p className="text-primary font-black text-sm mt-1">Rp {p.price.toLocaleString()}</p>
                                        </div>
                                        
                                        <div className="mt-3">
                                            {qty > 0 ? (
                                                <div className="flex items-center w-full justify-between bg-black/60 rounded-full border border-white/10 p-1 shadow-inner">
                                                    <button onClick={() => removeFromCart(p.id)} className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors">
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="font-black text-sm">{qty}</span>
                                                    <button onClick={() => addToCart(p)} className="w-8 h-8 rounded-full bg-primary text-black hover:bg-green-400 flex items-center justify-center transition-colors shadow-[0_0_10px_rgba(0,255,102,0.4)]">
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => addToCart(p)} className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-primary hover:border-primary hover:text-black font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 transition-all shadow-sm">
                                                    <Plus className="w-3 h-3" /> Add
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Floating Cart */}
                {cart.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto p-4 z-50 animate-in slide-in-from-bottom-10 duration-300">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-[#000]/90 to-transparent -z-10 h-32 bottom-0 top-auto"></div>
                        <div className="bg-primary/95 backdrop-blur-xl text-black p-4 rounded-3xl shadow-[0_20px_40px_rgba(0,255,102,0.3)] flex items-center justify-between border border-white/20">
                            <div className="pl-3">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total ({cart.reduce((a,b)=>a+b.qty,0)} items)</p>
                                <p className="text-xl font-black tracking-tighter">Rp {totalCart.toLocaleString()}</p>
                            </div>
                            <button 
                                disabled={submitting}
                                onClick={submitOrder} 
                                className="bg-black text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-gray-900 active:scale-95 transition-all disabled:opacity-50 shadow-lg"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <ShoppingCart className="w-4 h-4 text-primary" />}
                                Place Order
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
