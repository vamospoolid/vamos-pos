import { useState, useEffect, useMemo } from 'react';
import { 
    Loader2, Plus, Minus, Search, CheckCircle2, ChevronRight, 
    ShoppingBag, Package, Gift, Lock, ArrowRight, 
    Sparkles, Ticket, RefreshCw, X
} from 'lucide-react';
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
    return { emoji: '🛍️', gradient: 'from-cyan-950/40 to-blue-950/30', accent: '#06b6d4' };
}

export function StoreScreen() {
    const { member, setActiveTab, refreshMemberData } = useAppStore();
    const activeSession = member?.sessions?.find((s: any) => s.status === 'ACTIVE');

    // Tab state: 'merch' (Store Merchandise) | 'redeem' (Tukar Poin) | 'vault' (Voucher Saya)
    const [storeMode, setStoreMode] = useState<'redeem' | 'merch' | 'vault'>('redeem');

    // Merchandise states
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [products, setProducts] = useState<Record<string, any[]>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<Record<string, { product: any; quantity: number }>>({});
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderSnapshot, setOrderSnapshot] = useState<{ items: { product: any; quantity: number }[]; total: number } | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [showSearch, setShowSearch] = useState(false);

    // Rewards / Point Redeem states
    const [rewards, setRewards] = useState<any[]>([]);
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [loadingRewards, setLoadingRewards] = useState(true);
    const [redeemingId, setRedeemingId] = useState<string | null>(null);
    const [confirmReward, setConfirmReward] = useState<any>(null);
    const [redeemSuccessMsg, setRedeemSuccessMsg] = useState<string | null>(null);

    const points = member?.loyaltyPoints || 0;

    useEffect(() => {
        fetchProducts();
        fetchRewardsAndRedemptions();
    }, []);

    const fetchProducts = async () => {
        setLoadingProducts(true);
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
            setLoadingProducts(false);
        }
    };

    const fetchRewardsAndRedemptions = async () => {
        setLoadingRewards(true);
        try {
            const [rewardsRes, redemptionsRes] = await Promise.all([
                api.get('/player/rewards'),
                member?.id ? api.get(`/player/rewards/redemptions/member/${member.id}`) : Promise.resolve({ data: { data: [] } }),
            ]);
            setRewards(rewardsRes.data.data || []);
            setRedemptions(redemptionsRes.data.data || []);
        } catch (err) {
            console.error('Failed to fetch rewards', err);
        } finally {
            setLoadingRewards(false);
        }
    };

    const handleRedeem = async (reward: any) => {
        setRedeemingId(reward.id);
        try {
            const res = await api.post('/player/rewards/redeem', {
                memberId: member.id,
                rewardId: reward.id
            });
            if (res.data.success) {
                setConfirmReward(null);
                setRedeemSuccessMsg(`Berhasil menukar ${reward.pointsRequired} poin untuk "${reward.title}"!`);
                refreshMemberData();
                await fetchRewardsAndRedemptions();
                setTimeout(() => setRedeemSuccessMsg(null), 4000);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Gagal menukar poin. Pastikan poin Anda mencukupi.');
        } finally {
            setRedeemingId(null);
        }
    };

    // Cart operations
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
        setIsSubmittingOrder(true);
        try {
            const res = await api.post('/player/order', {
                memberId: member.id,
                sessionId: activeSession?.id || null,
                items: cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity }))
            });
            if (res.data.success) {
                setOrderSnapshot({ items: [...cartItems], total: cartTotal });
                setOrderSuccess(true);
                setCart({});
                refreshMemberData();
                setTimeout(() => { 
                    setOrderSuccess(false);
                    setOrderSnapshot(null);
                    setActiveTab(activeSession ? 'active-session' : 'dashboard'); 
                }, 4000);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Gagal mengirim pesanan. Coba lagi.');
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    // ── Success Order Screen ───────────────────────────────────────────────────
    if (orderSuccess && orderSnapshot) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[85vh] text-center p-8 fade-in text-white">
                <div className="w-28 h-28 bg-cyan-500/10 rounded-[44px] flex items-center justify-center mb-8 border border-cyan-500/20 relative">
                    <div className="absolute inset-0 bg-cyan-500/5 rounded-[44px] animate-ping opacity-20" />
                    <CheckCircle2 className="w-14 h-14 text-cyan-400" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-3">Pesanan Masuk!</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-10">
                    {activeSession 
                        ? 'Barang akan disiapkan & diantar ke meja kamu' 
                        : 'Selesaikan pembayaran & ambil barang di kasir'}
                </p>
                <div className="w-full bg-[#1a1f35]/80 rounded-[32px] p-8 border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-6 text-left">Ringkasan Pesanan</p>
                    <div className="space-y-3">
                        {orderSnapshot.items.map(item => (
                            <div key={item.product.id} className="flex justify-between items-center">
                                <span className="text-white font-bold text-sm">{item.quantity}× {item.product.name}</span>
                                <span className="text-slate-400 text-xs font-bold">Rp {(item.product.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="pt-4 border-t border-white/5 flex justify-between">
                            <span className="text-cyan-400 font-black text-xs uppercase tracking-widest">Total</span>
                            <span className="text-cyan-400 font-black text-xl">Rp {orderSnapshot.total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const categories = Object.keys(products);
    const activeVouchers = redemptions.filter(r => r.status === 'PENDING');

    return (
        <div className="pb-52 text-white min-h-screen fade-in relative px-1">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="pt-4 pb-4 flex justify-between items-center sticky top-0 z-50 -mx-6 px-6 bg-[#070b14]/95 backdrop-blur-xl border-b border-cyan-500/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                        <ShoppingBag className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">Vamos Store</h1>
                        <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em] italic">Merchandise & Tukar Poin</p>
                    </div>
                </div>
                {storeMode === 'merch' && (
                    <button
                        onClick={() => setShowSearch(v => !v)}
                        className="w-10 h-10 rounded-2xl bg-[#0e1626] flex items-center justify-center text-slate-400 hover:text-white border border-white/5 transition-colors relative"
                    >
                        <Search className="w-4 h-4" />
                        {cartCount > 0 && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-[9px] font-black text-black">
                                {cartCount}
                            </div>
                        )}
                    </button>
                )}
            </div>

            {/* ── Toast Pesan Sukses Redeem ──────────────────────────────────── */}
            {redeemSuccessMsg && (
                <div className="mt-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-400 text-xs font-black uppercase tracking-wide animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{redeemSuccessMsg}</span>
                </div>
            )}

            {/* ── Hero Poin Member Card ───────────────────────────────────────── */}
            <div className="mt-4 relative rounded-[28px] p-6 overflow-hidden border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.08)]"
                style={{ background: 'linear-gradient(135deg, #0d1a2e 0%, #0a1628 50%, #0d1535 100%)' }}>
                <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-cyan-500/10 blur-[60px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-indigo-500/10 blur-[50px] pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] italic mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            Saldo Poin Saya
                        </p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-4xl font-black text-white italic tracking-tighter leading-none">
                                {points.toLocaleString('id-ID')}
                            </h2>
                            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest italic">Poin</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                            Tingkat: <span className="text-amber-400 font-black">{member?.tier || 'BRONZE'}</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <button
                            onClick={() => setStoreMode('vault')}
                            className="px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest italic flex items-center gap-1.5 active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        >
                            <Ticket className="w-3.5 h-3.5" />
                            Voucher ({activeVouchers.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Mode Selector Tabs (Tukar Poin / Merchandise / Voucher) ─────── */}
            <div className="mt-5 grid grid-cols-3 gap-2 bg-[#09101f] p-1.5 rounded-[22px] border border-cyan-500/15">
                <button
                    onClick={() => setStoreMode('redeem')}
                    className={`py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest italic transition-all flex items-center justify-center gap-1.5 ${
                        storeMode === 'redeem'
                            ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Gift className="w-3.5 h-3.5" />
                    Tukar Poin
                </button>
                <button
                    onClick={() => setStoreMode('merch')}
                    className={`py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest italic transition-all flex items-center justify-center gap-1.5 ${
                        storeMode === 'merch'
                            ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Beli Barang
                </button>
                <button
                    onClick={() => setStoreMode('vault')}
                    className={`py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest italic transition-all flex items-center justify-center gap-1.5 ${
                        storeMode === 'vault'
                            ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Ticket className="w-3.5 h-3.5" />
                    Voucher ({activeVouchers.length})
                </button>
            </div>

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* ── TAB 1: TUKAR POIN (REWARDS REDEEM) ──────────────────────────── */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            {storeMode === 'redeem' && (
                <div className="mt-6 space-y-4 fade-in">
                    <div className="flex justify-between items-center px-1">
                        <div>
                            <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.25em] italic">Katalog Hadiah</p>
                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Tukarkan Poin Kamu</h3>
                        </div>
                        <button 
                            onClick={fetchRewardsAndRedemptions}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 active:scale-95 transition-all"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingRewards ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {loadingRewards ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Memuat Katalog Hadiah...</p>
                        </div>
                    ) : rewards.length === 0 ? (
                        <div className="py-20 text-center rounded-[28px] border border-dashed border-white/10 p-8 space-y-3 bg-[#0d1628]/40">
                            <Gift className="w-12 h-12 text-slate-600 mx-auto" />
                            <p className="text-white font-black text-sm uppercase italic">Belum Ada Hadiah Aktif</p>
                            <p className="text-slate-500 text-xs max-w-xs mx-auto">Nantikan hadiah menarik seperti free main biliar, voucher F&B, dan merchandise eksklusif!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3.5">
                            {rewards.map(reward => {
                                const isLocked = points < reward.pointsRequired;
                                const isRedeeming = redeemingId === reward.id;

                                return (
                                    <div
                                        key={reward.id}
                                        className={`rounded-[24px] p-4.5 border transition-all relative overflow-hidden ${
                                            isLocked 
                                                ? 'bg-[#0a1120]/60 border-white/5 opacity-80' 
                                                : 'bg-[#0d1a2e]/80 border-cyan-500/25 hover:border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.06)]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Image / Icon */}
                                            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 relative bg-[#09101f] border border-white/10 flex items-center justify-center">
                                                {reward.imageUrl ? (
                                                    <img src={reward.imageUrl} alt={reward.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Gift className="w-8 h-8 text-cyan-400/50" />
                                                )}
                                                {isLocked && (
                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                                                        <Lock className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-sm text-white italic uppercase tracking-tight truncate mb-1">
                                                    {reward.title}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-2 font-medium">
                                                    {reward.description || 'Voucher hadiah eksklusif member'}
                                                </p>

                                                <div className="flex items-center justify-between pt-1">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-black text-amber-400 italic tracking-tight">
                                                            {reward.pointsRequired}
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-500 uppercase">Poin</span>
                                                    </div>

                                                    <button
                                                        onClick={() => !isLocked && setConfirmReward(reward)}
                                                        disabled={isLocked || isRedeeming}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all ${
                                                            isLocked
                                                                ? 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                                                                : 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95'
                                                        }`}
                                                    >
                                                        {isRedeeming ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : isLocked ? (
                                                            'Poin Kurang'
                                                        ) : (
                                                            'Tukar Sekarang'
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* ── TAB 2: MERCHANDISE STORE (BELI DENGAN RP) ──────────────────── */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            {storeMode === 'merch' && (
                <div className="mt-6 space-y-6 fade-in">
                    {/* Search Bar */}
                    {showSearch && (
                        <div className="relative group fade-in">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Cari merchandise..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-[#0d1628]/80 border-2 border-white/5 rounded-[24px] pl-12 pr-5 py-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 transition-all"
                            />
                        </div>
                    )}

                    {/* No Session Info */}
                    {!activeSession && (
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-[24px] p-4 flex items-start gap-3.5">
                            <Package className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-cyan-300 font-black text-xs uppercase tracking-wide mb-0.5">Pemesanan Mandiri</p>
                                <p className="text-slate-400 text-[11px] leading-relaxed">Pesan barang favorit Anda di sini, lalu selesaikan pembayaran & ambil barang di kasir.</p>
                            </div>
                        </div>
                    )}

                    {/* Category Tabs */}
                    {!searchQuery && categories.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {categories.map(cat => {
                                const sample = products[cat]?.[0];
                                const style = sample ? getMerchStyle(sample.name, cat) : { emoji: '🛍️', accent: '#06b6d4' };
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                                            activeCategory === cat 
                                                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                                                : 'bg-[#0d1628]/60 text-slate-500 border-white/5 hover:text-slate-300'
                                        }`}
                                    >
                                        <span>{style.emoji}</span>
                                        <span>{cat}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Product List */}
                    {loadingProducts ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Memuat Produk...</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-[#0d1628]/40 rounded-[28px] border border-dashed border-white/10 p-8">
                            <div className="w-20 h-20 rounded-[28px] bg-[#09101f] border border-white/5 flex items-center justify-center">
                                <span className="text-4xl">🛍️</span>
                            </div>
                            <div>
                                <p className="text-white font-black text-lg uppercase italic tracking-tight mb-1">Katalog Kosong</p>
                                <p className="text-slate-500 text-xs max-w-[240px] mx-auto">
                                    Belum ada produk merchandise yang ditambahkan di POS Admin.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(filteredProducts).map(([category, items]) => {
                                if (!searchQuery && activeCategory && category !== activeCategory) return null;
                                return (
                                    <div key={category} className="fade-in space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="text-sm">{items[0] ? getMerchStyle(items[0].name, category).emoji : '🛍️'}</span>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{category}</h3>
                                            <div className="h-px flex-1 bg-white/5" />
                                            <span className="text-[9px] text-slate-600 font-bold">{items.length} item</span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {items.map(product => {
                                                const { emoji, gradient, accent } = getMerchStyle(product.name, category);
                                                const inCart = cart[product.id];
                                                return (
                                                    <div
                                                        key={product.id}
                                                        className={`rounded-[24px] p-4 flex items-center gap-4 border bg-gradient-to-br ${gradient} transition-all`}
                                                        style={{ borderColor: inCart ? accent + '60' : 'rgba(255,255,255,0.06)' }}
                                                    >
                                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                                                            style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
                                                            <span className="text-3xl">{emoji}</span>
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-black text-sm text-white truncate uppercase italic tracking-tight mb-1">{product.name}</h4>
                                                            <p className="text-lg font-black text-white italic tracking-tight mb-1">
                                                                Rp {product.price.toLocaleString()}
                                                            </p>
                                                            <p className="text-[9px] text-slate-500 uppercase font-bold">Stok: {product.stock}</p>
                                                        </div>

                                                        {inCart ? (
                                                            <div className="flex items-center gap-2 bg-black/40 rounded-xl p-1 border border-white/10">
                                                                <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                                                                    <Minus className="w-3.5 h-3.5" />
                                                                </button>
                                                                <span className="text-xs font-black text-white w-4 text-center">{inCart.quantity}</span>
                                                                <button onClick={() => addToCart(product)} className="w-7 h-7 rounded-lg bg-cyan-500 text-black flex items-center justify-center">
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => addToCart(product)}
                                                                className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center active:scale-90 transition-all"
                                                            >
                                                                <Plus className="w-5 h-5" />
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
            )}

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* ── TAB 3: VOUCHER SAYA (VAULT) ─────────────────────────────────── */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            {storeMode === 'vault' && (
                <div className="mt-6 space-y-4 fade-in">
                    <div className="flex justify-between items-center px-1">
                        <div>
                            <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.25em] italic">Voucher Kupon</p>
                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Koleksi Voucher Saya</h3>
                        </div>
                        <button 
                            onClick={fetchRewardsAndRedemptions}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 active:scale-95 transition-all"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingRewards ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {activeVouchers.length === 0 ? (
                        <div className="py-20 text-center rounded-[28px] border border-dashed border-white/10 p-8 space-y-3 bg-[#0d1628]/40">
                            <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
                            <p className="text-white font-black text-sm uppercase italic">Belum Ada Voucher</p>
                            <p className="text-slate-500 text-xs max-w-xs mx-auto">Tukarkan poin loyalty kamu di tab "Tukar Poin" untuk mendapatkan voucher diskon dan free main!</p>
                            <button
                                onClick={() => setStoreMode('redeem')}
                                className="mt-3 px-5 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-widest italic"
                            >
                                Lihat Katalog Hadiah →
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {activeVouchers.map((r: any) => (
                                <div key={r.id} className="rounded-[24px] p-5 border border-cyan-500/25 bg-[#0d1a2e] relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex flex-col items-center justify-center shrink-0">
                                            <Gift className="w-7 h-7 text-cyan-400 mb-1" />
                                            <span className="text-[7px] font-black text-cyan-400 uppercase tracking-widest">Kupon</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-white text-base italic uppercase tracking-tight truncate">{r.reward?.title}</h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="px-3 py-1 rounded-lg bg-black/40 border border-white/10">
                                                    <span className="text-[10px] font-mono font-black text-cyan-400 tracking-wider">KODE: {r.id.substring(0, 8).toUpperCase()}</span>
                                                </div>
                                                <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                                                    Siap Dipakai
                                                </span>
                                            </div>
                                            <p className="text-[9px] text-slate-500 font-bold mt-2 uppercase tracking-widest italic">Tunjukkan ke Kasir saat bayar</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Modal Konfirmasi Tukar Poin ─────────────────────────────────── */}
            {confirmReward && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6" onClick={() => setConfirmReward(null)}>
                    <div className="absolute inset-0 bg-[#070b14]/95 backdrop-blur-2xl" />
                    <div className="relative w-full max-w-sm rounded-[32px] p-8 overflow-hidden border-2 border-cyan-500/30 shadow-[0_0_100px_rgba(6,182,212,0.25)] bg-[#0d1628]"
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => setConfirmReward(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-6">
                            <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.25em] italic mb-1">Konfirmasi Penukaran</p>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Tukarkan Poin?</h3>
                        </div>

                        <div className="bg-[#09101f] rounded-[24px] p-5 mb-6 flex items-center gap-4 border border-white/10">
                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10 flex items-center justify-center">
                                {confirmReward.imageUrl ? (
                                    <img src={confirmReward.imageUrl} alt={confirmReward.title} className="w-full h-full object-cover" />
                                ) : (
                                    <Gift className="w-8 h-8 text-cyan-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-sm text-white uppercase italic tracking-tight truncate">{confirmReward.title}</p>
                                <p className="text-2xl font-black text-amber-400 italic tracking-tight">{confirmReward.pointsRequired} <span className="text-xs uppercase text-slate-500">Poin</span></p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-2 mb-6">
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sisa Poin Anda</p>
                                <p className="text-lg font-black text-white italic">{(points - confirmReward.pointsRequired).toLocaleString('id-ID')} Poin</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-600" />
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={() => handleRedeem(confirmReward)}
                                disabled={!!redeemingId}
                                className="w-full py-4 rounded-[18px] font-black text-xs uppercase tracking-[0.2em] text-black italic transition-all active:scale-95 flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #06b6d4, #6366f1)', boxShadow: '0 0 25px rgba(6,182,212,0.3)' }}
                            >
                                {redeemingId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Tukar Sekarang'}
                            </button>
                            <button
                                onClick={() => setConfirmReward(null)}
                                className="w-full py-3 rounded-xl font-black text-[10px] text-slate-500 uppercase tracking-widest hover:text-white transition-all"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Floating Checkout Bar (Hanya saat di Tab Beli Barang) ──────── */}
            {storeMode === 'merch' && cartCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 z-[100] bg-gradient-to-t from-[#070b14] via-[#070b14]/95 to-transparent pt-24 max-w-lg mx-auto pointer-events-none">
                    <div className="pointer-events-auto bg-[#0d1628] rounded-[28px] p-5 shadow-2xl border border-cyan-500/25">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Total Belanja</p>
                                <p className="text-2xl font-black text-white italic tracking-tight">
                                    Rp {cartTotal.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-cyan-500/15 border border-cyan-500/30 rounded-xl px-3 py-1.5">
                                <p className="text-cyan-400 font-black text-xs">{cartCount} item</p>
                            </div>
                        </div>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={isSubmittingOrder}
                            className="w-full py-3.5 rounded-[18px] font-black text-xs text-black transition-all flex items-center justify-center gap-2 active:scale-[0.98] tracking-[0.2em] uppercase italic"
                            style={{ background: 'linear-gradient(135deg, #06b6d4, #6366f1)', boxShadow: '0 8px 30px rgba(6,182,212,0.3)' }}
                        >
                            {isSubmittingOrder ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <ShoppingBag className="w-4 h-4" />
                                    <span>Pesan Sekarang</span>
                                    <ChevronRight className="w-4 h-4" strokeWidth={3} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
