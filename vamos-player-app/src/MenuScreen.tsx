import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, Plus, Minus, Search, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAppStore } from './store/appStore';
import { api } from './api';

export function MenuScreen() {
    const { member, setActiveTab, refreshMemberData } = useAppStore();
    const activeSession = member?.sessions?.find((s: any) => s.status === 'ACTIVE')
        || member?.sessions?.find((s: any) => s.status === 'PENDING' && !s.tableId);

    const [loading, setLoading] = useState(true);
    const [menu, setMenu] = useState<Record<string, any[]>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<Record<string, { product: any, quantity: number }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        setLoading(true);
        try {
            const res = await api.get('/player/menu');
            if (res.data.success) {
                setMenu(res.data.data);
                const categories = Object.keys(res.data.data);
                if (categories.length > 0) setActiveCategory(categories[0]);
            }
        } catch (err) {
            console.error('Failed to fetch menu', err);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product: any) => {
        setCart(prev => ({
            ...prev,
            [product.id]: {
                product,
                quantity: (prev[product.id]?.quantity || 0) + 1
            }
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => {
            const existing = prev[productId];
            if (!existing) return prev;
            if (existing.quantity <= 1) {
                const rest = { ...prev };
                delete rest[productId];
                return rest;
            }
            return {
                ...prev,
                [productId]: { ...existing, quantity: existing.quantity - 1 }
            };
        });
    };

    const cartItems = Object.values(cart);
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const filteredMenu = useMemo(() => {
        if (!searchQuery) return menu;
        const filtered: Record<string, any[]> = {};
        Object.entries(menu).forEach(([cat, products]) => {
            const matches = products.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cat.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (matches.length > 0) filtered[cat] = matches;
        });
        return filtered;
    }, [menu, searchQuery]);

    const handlePlaceOrder = async () => {
        if (!activeSession || cartItems.length === 0) return;
        setIsSubmitting(true);
        try {
            const res = await api.post('/player/order', {
                memberId: member.id,
                sessionId: activeSession.id,
                items: cartItems.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity
                }))
            });

            if (res.data.success) {
                setOrderSuccess(true);
                setCart({});
                refreshMemberData();
                setTimeout(() => {
                    setOrderSuccess(false);
                    setActiveTab('active-session');
                }, 3000);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to transmit order.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[85vh] text-center p-10 fade-in px-1">
                <div className="w-24 h-24 bg-primary/10 rounded-[40px] flex items-center justify-center mb-8 border border-primary/20 fiery-glow relative">
                    <div className="absolute inset-0 bg-primary/5 rounded-[40px] animate-ping opacity-20" />
                    <CheckCircle2 className="w-12 h-12 text-primary" strokeWidth={3} />
                </div>
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Transmission Successful</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed mb-12 italic opacity-60">Provision protocol initiated. Our tactical crew is deploying your selection.</p>

                <div className="fiery-card p-10 w-full border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px]" />
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-8 text-left italic">Provision Summary</p>
                    <div className="space-y-4">
                        {cartItems.map(item => (
                            <div key={item.product.id} className="flex justify-between items-center">
                                <span className="text-white font-black italic uppercase tracking-tighter text-base">{item.quantity}× {item.product.name}</span>
                                <span className="text-slate-500 font-black text-xs">{(item.product.price * item.quantity).toLocaleString()} <span className="text-[10px]">Rp</span></span>
                            </div>
                        ))}
                        <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                            <span className="text-primary font-black uppercase tracking-widest text-[9px] italic">Operation Total</span>
                            <span className="text-primary font-black italic tracking-tighter text-2xl">{cartTotal.toLocaleString()} <span className="text-xs">Rp</span></span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-48 text-white min-h-screen fade-in relative px-1">
            {/* Header Sticky */}
            <div className="pt-6 pb-6 flex justify-between items-center bg-[#101423]/90 backdrop-blur-xl sticky top-0 z-50 -mx-6 px-10 border-b border-white/5">
                <button onClick={() => setActiveTab('active-session')} className="w-12 h-12 rounded-2xl bg-[#1a1f35] flex items-center justify-center active:scale-90 transition-all text-white border border-white/5">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">Tactical Provisions</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                        {activeSession?.table?.name || 'FIELD SERVICE'}
                    </p>
                </div>
                <div className="relative">
                    <button className="w-12 h-12 rounded-2xl bg-[#1a1f35] flex items-center justify-center text-slate-500 hover:text-white border border-white/5">
                        <Search className="w-5 h-5" />
                    </button>
                    {cartCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[9px] font-black text-secondary fiery-glow">
                            {cartCount}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 space-y-10">
                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Supplies (Coffee, Snacks, etc...)"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1a1f35]/50 border-2 border-white/5 rounded-[32px] pl-16 pr-8 py-5 text-sm font-black text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:bg-[#1a1f35] transition-all uppercase tracking-widest italic"
                    />
                </div>

                {/* Categories Navigation */}
                {!searchQuery && (
                    <div className="flex gap-3 overflow-x-auto pb-6 -mx-2 px-2 scrollbar-hide">
                        {Object.keys(menu).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 italic ${activeCategory === cat ? 'bg-primary text-secondary border-primary shadow-[0_0_20px_rgba(31,34,255,0.3)]' : 'bg-[#1a1f35]/50 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-8">
                        <div className="relative">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" strokeWidth={3} />
                            <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Authorizing Provisions...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {Object.entries(filteredMenu).map(([category, products]) => {
                            if (!searchQuery && activeCategory && category !== activeCategory) return null;

                            return (
                                <div key={category} className="fade-in">
                                    <div className="flex items-center gap-4 mb-6 px-1">
                                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic">{category}</h3>
                                        <div className="h-[1px] flex-1 bg-white/5" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-6">
                                        {products.map(product => {
                                            const inCart = cart[product.id];
                                            return (
                                                <div key={product.id} className="group fiery-card rounded-[40px] p-6 flex items-center gap-6 border-2 border-white/5 bg-[#1a1f35]/40 hover:border-primary/40 transition-all duration-300">
                                                    <div className="w-24 h-24 rounded-[32px] bg-[#101423] border border-white/5 flex items-center justify-center shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <span className="text-slate-700 font-black text-2xl italic tracking-tighter relative z-10">{product.name.substring(0, 2).toUpperCase()}</span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-black text-lg text-white truncate leading-tight uppercase italic tracking-tighter mb-2">{product.name}</h4>
                                                        <div className="flex items-baseline gap-2 mb-4">
                                                            <span className="text-2xl font-black text-primary italic tracking-tighter leading-none">{product.price.toLocaleString()}</span>
                                                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">RP</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                            <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.1em] italic">AVL UNIT: {product.stock}</p>
                                                        </div>
                                                    </div>

                                                    {inCart ? (
                                                        <div className="flex flex-col items-center gap-3 bg-[#101423] rounded-[24px] p-2 border border-white/5 shadow-inner">
                                                            <button
                                                                onClick={() => addToCart(product)}
                                                                className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center active:scale-90 transition-all text-secondary fiery-glow"
                                                            >
                                                                <Plus className="w-5 h-5" strokeWidth={3} />
                                                            </button>
                                                            <span className="text-base font-black text-white w-6 text-center italic">{inCart.quantity}</span>
                                                            <button
                                                                onClick={() => removeFromCart(product.id)}
                                                                className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center active:scale-90 transition-all text-slate-500 border border-white/5"
                                                            >
                                                                <Minus className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => addToCart(product)}
                                                            className="w-16 h-16 rounded-[28px] bg-white/5 hover:bg-primary transition-all duration-300 flex items-center justify-center group active:scale-90 border border-white/5"
                                                        >
                                                            <Plus className="w-8 h-8 text-slate-600 group-hover:text-secondary group-hover:scale-110 transition-all" strokeWidth={3} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Float Checkout Bar */}
            {cartCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-8 z-[100] bg-gradient-to-t from-[#0a0d18] via-[#0a0d18]/95 to-transparent pt-32 max-w-lg mx-auto pointer-events-none">
                    <div className="pointer-events-auto fiery-card p-10 shadow-[0_-20px_100px_rgba(0,0,0,0.5)] border-primary/20 bg-[#1a1f35]">
                        <div className="flex justify-between items-end mb-10">
                            <div className="space-y-2">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] italic">Operation Budget</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-white italic tracking-tighter leading-none">
                                        {cartTotal.toLocaleString()}
                                    </p>
                                    <span className="text-xs font-black text-slate-500 uppercase">Rp</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2 italic">Payload</p>
                                <div className="inline-flex px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                                    <p className="text-xs font-black text-primary italic uppercase tracking-widest">{cartCount} UNITS</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={isSubmitting}
                            className="w-full fiery-btn-primary py-6 rounded-[32px] font-black text-xs transition-all flex items-center justify-center gap-6 active:scale-[0.98] text-secondary tracking-[0.3em] uppercase italic shadow-primary/30"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Transmit Provision Protocol</span>
                                    <ChevronRight className="w-6 h-6" strokeWidth={4} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
