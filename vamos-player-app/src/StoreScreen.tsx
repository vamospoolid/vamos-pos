import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, Plus, Minus, Search, CheckCircle2, ChevronRight, ShoppingBag, Package, Tag } from 'lucide-react';
import { useAppStore } from './store/appStore';
import { api } from './api';

// ── Emoji & style mapping for merchandise categories ──────────────────────────
function getMerchStyle(name: string, category: string) {
    const n = name.toLowerCase();
    const c = category.toLowerCase();
    if (n.includes('jersey') || c.includes('jersey')) return { emoji: '🎽', gradient: 'from-blue-900/60 to-indigo-900/40', accent: '#6366f1' };
    if (n.includes('kaos tangan') || n.includes('glove') || c.includes('glove') || c.includes('kaos tangan')) return { emoji: '🧤', gradient: 'from-slate-800/60 to-slate-900/40', accent: '#94a3b8' };
    if (n.includes('kaos') || n.includes('t-shirt') || n.includes('shirt') || c.includes('kaos') || c.includes('shirt')) return { emoji: '👕', gradient: 'from-violet-900/60 to-purple-900/40', accent: '#a855f7' };
    if (n.includes('stiker') || n.includes('sticker')) return { emoji: '🏷️', gradient: 'from-yellow-900/60 to-amber-900/40', accent: '#f59e0b' };
    if (n.includes('chalk') || n.includes('kapur')) return { emoji: '🧊', gradient: 'from-cyan-900/60 to-teal-900/40', accent: '#06b6d4' };
    if (n.includes('gantungan') || n.includes('keychain')) return { emoji: '🔑', gradient: 'from-orange-900/60 to-red-900/40', accent: '#f97316' };
    if (n.includes('topi') || n.includes('cap') || n.includes('hat')) return { emoji: '🧢', gradient: 'from-emerald-900/60 to-green-900/40', accent: '#10b981' };
    if (n.includes('tas') || n.includes('bag')) return { emoji: '🎒', gradient: 'from-rose-900/60 to-pink-900/40', accent: '#f43f5e' };
    if (n.includes('jaket') || n.includes('jacket')) return { emoji: '🧥', gradient: 'from-gray-800/60 to-zinc-900/40', accent: '#6b7280' };
    return { emoji: '🛍️', gradient: 'from-primary/20 to-secondary/10', accent: '#1f22ff' };
}

export function StoreScreen() {
    const { member, setActiveTab, refreshMemberData } = useAppStore();
    const activeSession = member?.sessions?.find((s: any) => s.status === 'ACTIVE');

    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Record<string, any[]>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<Record<string, { product: any; quantity: number }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderSnapshot, setOrderSnapshot] = useState<{ items: { product: any; quantity: number }[]; total: number } | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/player/store-products');
            if (res.data.success) {
                const data = res.data.data;
                setProducts(data);
                const cats = Object.keys(data);
                if (cats.length > 0) setActiveCategory(cats[0]);
            }
        } catch (err) {
            console.error('Failed to fetch store products', err);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product: any) => {
        setCart(prev => ({
            ...prev,
            [product.id]: { product, quantity: (prev[product.id]?.quantity || 0) + 1 }
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
            return { ...prev, [productId]: { ...existing, quantity: existing.quantity - 1 } };
        });
    };

    const cartItems = Object.values(cart);
    const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products;
        const filtered: Record<string, any[]> = {};
        Object.entries(products).forEach(([cat, items]) => {
            const matches = items.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cat.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (matches.length > 0) filtered[cat] = matches;
        });
        return filtered;
    }, [products, searchQuery]);

    const handlePlaceOrder = async () => {
        if (cartItems.length === 0) return;
        setIsSubmitting(true);
        try {
            const res = await api.post('/player/order', {
                memberId: member.id,
                sessionId: activeSession?.id || null,
                items: cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity }))
            });
            if (res.data.success) {
                // Snapshot cart BEFORE clearing so success screen can still display it
                setOrderSnapshot({ items: [...cartItems], total: cartTotal });
                setOrderSuccess(true);
                setCart({});
                refreshMemberData();
                setTimeout(() => { 
                    setOrderSuccess(false);
                    setOrderSnapshot(null);
                    setActiveTab(activeSession ? 'active-session' : 'home'); 
                }, 4000);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Gagal mengirim pesanan. Coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Success Screen ─────────────────────────────────────────────────────────
    if (orderSuccess && orderSnapshot) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[85vh] text-center p-8 fade-in">
                <div className="w-28 h-28 bg-indigo-500/10 rounded-[44px] flex items-center justify-center mb-8 border border-indigo-500/20 relative">
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-[44px] animate-ping opacity-20" />
                    <CheckCircle2 className="w-14 h-14 text-indigo-400" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-3">Order Masuk!</h2>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-10">
                    {activeSession 
                        ? 'Barang akan disiapkan & diantar ke meja kamu' 
                        : 'Selesaikan pembayaran & ambil barang di kasir'}
                </p>
                <div className="w-full bg-[#1a1f35]/80 rounded-[32px] p-8 border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-6 text-left">Ringkasan Order</p>
                    <div className="space-y-3">
                        {orderSnapshot.items.map(item => (
                            <div key={item.product.id} className="flex justify-between items-center">
                                <span className="text-white font-bold text-sm">{item.quantity}× {item.product.name}</span>
                                <span className="text-slate-400 text-xs font-bold">Rp {(item.product.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="pt-4 border-t border-white/5 flex justify-between">
                            <span className="text-indigo-400 font-black text-xs uppercase tracking-widest">Total</span>
                            <span className="text-indigo-400 font-black text-xl">Rp {orderSnapshot.total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                {!activeSession && (
                    <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-[20px] p-4 text-left w-full">
                        <p className="text-amber-300 font-black text-xs uppercase tracking-widest mb-1">📍 Langkah Selanjutnya</p>
                        <p className="text-amber-400/70 text-xs leading-relaxed">Tunjukkan halaman ini ke kasir, lakukan pembayaran, dan ambil barang Anda.</p>
                    </div>
                )}
            </div>
        );
    }

    const categories = Object.keys(products);

    return (
        <div className="pb-52 text-white min-h-screen fade-in relative">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="pt-2 pb-6 flex justify-between items-center sticky top-0 z-50 -mx-6 px-6 bg-[#070b14]/95 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">Vamos Store</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Official Merchandise</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowSearch(v => !v)}
                    className="w-10 h-10 rounded-2xl bg-[#1a1f35] flex items-center justify-center text-slate-400 hover:text-white border border-white/5 transition-colors relative"
                >
                    <Search className="w-4 h-4" />
                    {cartCount > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[9px] font-black text-white">
                            {cartCount}
                        </div>
                    )}
                </button>
            </div>

            <div className="mt-6 space-y-6">
                {/* ── Search Bar ──────────────────────────────────────────────── */}
                {showSearch && (
                    <div className="relative group fade-in">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Cari merchandise..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1a1f35]/60 border-2 border-white/5 rounded-[24px] pl-12 pr-5 py-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-all"
                        />
                    </div>
                )}

                {/* ── No Session Info ─────────────────────────────────────────── */}
                {!activeSession && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[24px] p-5 flex items-start gap-4">
                        <Package className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-indigo-300 font-black text-sm uppercase tracking-wide mb-1">Pemesanan Mandiri</p>
                            <p className="text-indigo-400/70 text-xs leading-relaxed">Anda tidak berada di sesi meja aktif. Silakan lakukan pemesanan, lalu selesaikan pembayaran dan ambil barang Anda di kasir.</p>
                        </div>
                    </div>
                )}

                {/* ── Category Tabs ────────────────────────────────────────────── */}
                {!searchQuery && categories.length > 1 && (
                    <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                        {categories.map(cat => {
                            const sample = products[cat]?.[0];
                            const style = sample ? getMerchStyle(sample.name, cat) : { emoji: '🛍️', accent: '#6366f1' };
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    style={activeCategory === cat ? { borderColor: style.accent, color: style.accent, boxShadow: `0 0 16px ${style.accent}30` } : {}}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-[20px] text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${activeCategory === cat ? 'bg-white/5' : 'bg-[#1a1f35]/50 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'}`}
                                >
                                    <span>{style.emoji}</span>
                                    <span>{cat}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── Product Grid ─────────────────────────────────────────────── */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Memuat Katalog...</p>
                    </div>
                ) : categories.length === 0 ? (
                    /* ── Empty State ────────────────────────────────────────────── */
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                        <div className="w-24 h-24 rounded-[32px] bg-[#1a1f35] border border-white/5 flex items-center justify-center">
                            <span className="text-5xl">🛍️</span>
                        </div>
                        <div>
                            <p className="text-white font-black text-xl uppercase italic tracking-tighter mb-2">Katalog Kosong</p>
                            <p className="text-slate-500 text-xs font-bold leading-relaxed max-w-[200px]">
                                Belum ada produk merchandise. Tambahkan di POS Admin dengan kategori "Merchandise", "Jersey", "Kaos", dll.
                            </p>
                        </div>
                        <div className="bg-[#1a1f35]/60 rounded-[20px] p-5 border border-white/5 text-left w-full">
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-3">Kategori yang dikenali:</p>
                            {['Jersey', 'Kaos', 'Kaos Tangan', 'Glove', 'Merchandise', 'Stiker', 'Chalk'].map(c => (
                                <div key={c} className="flex items-center gap-2 py-1">
                                    <Tag className="w-3 h-3 text-indigo-400" />
                                    <span className="text-slate-400 text-xs">{c}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {Object.entries(filteredProducts).map(([category, items]) => {
                            if (!searchQuery && activeCategory && category !== activeCategory) return null;
                            return (
                                <div key={category} className="fade-in">
                                    <div className="flex items-center gap-3 mb-5">
                                        <span className="text-xl">{items[0] ? getMerchStyle(items[0].name, category).emoji : '🛍️'}</span>
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{category}</h3>
                                        <div className="h-px flex-1 bg-white/5" />
                                        <span className="text-[10px] text-slate-600 font-bold">{items.length} item</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {items.map(product => {
                                            const { emoji, gradient, accent } = getMerchStyle(product.name, category);
                                            const inCart = cart[product.id];
                                            return (
                                                <div
                                                    key={product.id}
                                                    className={`group rounded-[28px] p-5 flex items-center gap-5 border-2 bg-gradient-to-br ${gradient} transition-all duration-300`}
                                                    style={{ borderColor: inCart ? accent + '40' : 'rgba(255,255,255,0.05)' }}
                                                >
                                                    {/* Product Icon */}
                                                    <div
                                                        className="w-20 h-20 rounded-[22px] flex items-center justify-center shrink-0 relative overflow-hidden"
                                                        style={{ background: `${accent}18`, border: `1px solid ${accent}25` }}
                                                    >
                                                        <span className="text-4xl">{emoji}</span>
                                                        {product.stock <= 5 && (
                                                            <div className="absolute bottom-0 left-0 right-0 bg-amber-500/80 text-[8px] font-black text-center py-0.5 uppercase tracking-wider">
                                                                Sisa {product.stock}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-black text-base text-white truncate leading-tight uppercase italic tracking-tight mb-1.5">{product.name}</h4>
                                                        <div className="flex items-baseline gap-1.5 mb-2">
                                                            <span className="text-xl font-black italic tracking-tighter leading-none" style={{ color: accent }}>
                                                                {product.price.toLocaleString()}
                                                            </span>
                                                            <span className="text-[9px] font-black text-slate-600 uppercase">Rp</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : product.stock > 3 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">STOK: {product.stock}</p>
                                                        </div>
                                                    </div>

                                                    {/* Cart Controls */}
                                                    {inCart ? (
                                                        <div className="flex flex-col items-center gap-2 bg-black/20 rounded-[18px] p-1.5 border border-white/5">
                                                            <button
                                                                onClick={() => addToCart(product)}
                                                                className="w-9 h-9 rounded-[14px] flex items-center justify-center active:scale-90 transition-all"
                                                                style={{ background: accent, color: '#fff' }}
                                                            >
                                                                <Plus className="w-4 h-4" strokeWidth={3} />
                                                            </button>
                                                            <span className="text-sm font-black text-white w-5 text-center">{inCart.quantity}</span>
                                                            <button
                                                                onClick={() => removeFromCart(product.id)}
                                                                className="w-9 h-9 rounded-[14px] bg-white/5 flex items-center justify-center active:scale-90 transition-all border border-white/5 text-slate-400"
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => addToCart(product)}
                                                            className="w-14 h-14 rounded-[22px] flex items-center justify-center active:scale-90 transition-all border border-white/5"
                                                            style={{ background: `${accent}20` }}
                                                        >
                                                            <Plus className="w-6 h-6" style={{ color: accent }} strokeWidth={2.5} />
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

            {/* ── Floating Checkout Bar ────────────────────────────────────────── */}
            {cartCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 z-[100] bg-gradient-to-t from-[#070b14] via-[#070b14]/95 to-transparent pt-24 max-w-lg mx-auto pointer-events-none">
                    <div className="pointer-events-auto bg-[#1a1f35] rounded-[28px] p-6 shadow-2xl border border-indigo-500/20">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Belanja</p>
                                <p className="text-3xl font-black text-white italic tracking-tighter">
                                    Rp {cartTotal.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[14px] px-4 py-2">
                                <p className="text-indigo-400 font-black text-sm">{cartCount} item</p>
                            </div>
                        </div>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={isSubmitting}
                            className="w-full py-4 rounded-[20px] font-black text-sm text-white transition-all flex items-center justify-center gap-3 active:scale-[0.98] tracking-[0.2em] uppercase italic"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 8px 32px rgba(79,70,229,0.4)' }}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <ShoppingBag className="w-5 h-5" />
                                    <span>Pesan Sekarang</span>
                                    <ChevronRight className="w-5 h-5" strokeWidth={3} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
