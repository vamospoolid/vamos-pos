import { useState, useEffect } from 'react';
import { api } from './api';
import { vamosAlert } from './utils/dialog';
import { Utensils, Search, Minus, Plus, ShoppingBag, User, DollarSign, Loader2 } from 'lucide-react';

export const getProductEmojiAndStyle = (name: string, category: string) => {
    const lowerName = name.toLowerCase();
    const lowerCat = (category || '').toLowerCase();
    
    // Default
    let emoji = '☕';
    let gradient = 'from-[#2a1a10] to-[#1a120b]';
    let border = 'border-[#4a3224]/30 hover:border-[#8b5a2b]/60';
    let badgeBg = 'bg-[#3d271d] text-[#e3a87c]';
    
    if (lowerName.includes('butterscotch') || lowerName.includes('caramel') || lowerName.includes('hazelnut') || lowerName.includes('gula aren') || lowerName.includes('susu') || lowerName.includes('latte')) {
        emoji = '☕';
        gradient = 'from-[#362215] to-[#1f130b]';
        border = 'border-[#5c3a21]/40 hover:border-[#a0522d]';
        badgeBg = 'bg-[#4a2e1b] text-[#f4a460]';
    } else if (lowerName.includes('kopi') || lowerName.includes('espresso') || lowerName.includes('americano') || lowerName.includes('black')) {
        emoji = '☕';
        gradient = 'from-[#221c17] to-[#13100e]';
        border = 'border-[#3a2e26]/40 hover:border-[#8b5a2b]';
        badgeBg = 'bg-[#30251e] text-[#d2b48c]';
    } else if (lowerName.includes('coklat') || lowerName.includes('chocolate') || lowerName.includes('milo') || lowerName.includes('cocoa')) {
        emoji = '🍫';
        gradient = 'from-[#2e1c12] to-[#1b100a]';
        border = 'border-[#4b2e1e]/40 hover:border-[#cd853f]';
        badgeBg = 'bg-[#402619] text-[#deb887]';
    } else if (lowerName.includes('tea') || lowerName.includes('greentea') || lowerName.includes('matcha') || lowerName.includes('teh')) {
        emoji = '🍵';
        gradient = 'from-[#172217] to-[#0e140e]';
        border = 'border-[#263a26]/40 hover:border-[#4caf50]';
        badgeBg = 'bg-[#203020] text-[#a5d6a7]';
    } else if (lowerName.includes('taro') || lowerName.includes('red velvet')) {
        emoji = '🥤';
        gradient = 'from-[#2a1b35] to-[#191020]';
        border = 'border-[#452b57]/40 hover:border-[#ba68c8]';
        badgeBg = 'bg-[#362144] text-[#e040fb]';
    } else if (lowerName.includes('mineral') || lowerName.includes('air') || lowerName.includes('aqua')) {
        emoji = '💧';
        gradient = 'from-[#102235] to-[#0a1520]';
        border = 'border-[#1b3757]/40 hover:border-[#2196f3]';
        badgeBg = 'bg-[#152a44] text-[#90caf9]';
    } else if (lowerName.includes('rokok') || lowerName.includes('surya') || lowerName.includes('sampoerna') || lowerName.includes('magnum') || lowerName.includes('garam') || lowerName.includes('mild')) {
        emoji = '🚬';
        gradient = 'from-[#202022] to-[#131314]';
        border = 'border-[#333336]/40 hover:border-[#9e9e9e]';
        badgeBg = 'bg-[#2a2a2d] text-[#e0e0e0]';
    } else if (lowerCat.includes('apparel') || lowerCat.includes('equipment') || lowerCat.includes('billiard') || lowerCat.includes('accessories')) {
        emoji = '🎱';
        gradient = 'from-[#141b2a] to-[#0c101a]';
        border = 'border-[#222e47]/40 hover:border-[#3f51b5]';
        badgeBg = 'bg-[#1a253a] text-[#9fa8da]';
    } else if (lowerCat.includes('food') || lowerCat.includes('snack') || lowerName.includes('indomie') || lowerName.includes('mie') || lowerName.includes('goreng') || lowerName.includes('kentang') || lowerName.includes('roti') || lowerName.includes('crispy')) {
        emoji = '🍟';
        gradient = 'from-[#2b1616] to-[#1a0d0d]';
        border = 'border-[#472525]/40 hover:border-[#f44336]';
        badgeBg = 'bg-[#3b1d1d] text-[#ef9a9a]';
    }
    
    return { emoji, gradient, border, badgeBg };
};

export default function FnBOrder() {
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<{ product: any, qty: number }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<'FNB' | 'EQUIPMENT'>('FNB');
    const [customerName, setCustomerName] = useState('');
    const [memberId, setMemberId] = useState('');
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [showMemberResults, setShowMemberResults] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [payMethod, setPayMethod] = useState<'CASH' | 'QRIS' | 'DEBIT'>('CASH');
    const [receivedAmount, setReceivedAmount] = useState(0);
    const [tempSessionId, setTempSessionId] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await api.get('/members');
            setMembers(res.data.data);
        } catch (err) {
            console.error('Failed to fetch members');
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data.data.filter((p: any) => p.stock > 0)); // Only show items with stock
        } catch (err) {
            console.error('Failed to fetch products');
        }
    };

    const handleAddToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                if (existing.qty >= product.stock) return prev; // prevent adding more than stock
                return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { product, qty: 1 }];
        });
    };

    const updateCartQty = (productId: string, dir: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = item.qty + dir;
                if (newQty <= 0) return null; // handled later
                if (newQty > item.product.stock) return item;
                return { ...item, qty: newQty };
            }
            return item;
        }).filter(Boolean) as any);
    };

    const handlePlaceOrder = async (isDirectPay: boolean) => {
        if (cart.length === 0) return vamosAlert('Cart is empty');

        let finalCustomerName = customerName;
        if (!customerName && !memberId) {
            finalCustomerName = 'Walk-in Customer';
        }

        setLoading(true);
        try {
            // 1. Create the Pending F&B Session
            const sessionRes = await api.post('/sessions/fnb-only', {
                memberId: memberId || undefined,
                customerName: finalCustomerName || undefined
            });
            const newSessionId = sessionRes.data.id;

            // 2. Add orders to that session 
            await Promise.all(cart.map(item =>
                api.post(`/orders/sessions/${newSessionId}`, {
                    productId: item.product.id,
                    quantity: item.qty
                })
            ));

            if (isDirectPay) {
                setTempSessionId(newSessionId);
                setShowPaymentModal(true);
                setReceivedAmount(totalAmount);
            } else {
                vamosAlert('Order saved to Pending Bills!');
                resetForm();
            }
        } catch (err: any) {
            console.error('Order Error:', err);
            const serverMsg = err.response?.data?.details
                ? JSON.stringify(err.response.data.details)
                : (err.response?.data?.error || err.message);
            vamosAlert('Failed to place order: ' + serverMsg);
        } finally {
            setLoading(false);
        }
    };

    const processFinalPayment = async () => {
        if (!tempSessionId) return;
        if (payMethod === 'CASH' && receivedAmount < totalAmount) {
            return vamosAlert('Received amount is less than total amount');
        }

        setLoading(true);
        try {
            await api.post(`/sessions/${tempSessionId}/pay`, {
                method: payMethod,
                receivedAmount: receivedAmount,
                discount: 0
            });
            vamosAlert(`Payment processed! Points earned: ${Math.floor(totalAmount / 1000)}`);
            setShowPaymentModal(false);
            resetForm();
        } catch (err: any) {
            vamosAlert('Payment failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCart([]);
        setCustomerName('');
        setMemberId('');
        setMemberSearchQuery('');
        setTempSessionId(null);
        fetchProducts();
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

    // Determine if a product is F&B or Equipment
    const isEquipment = (category: string) => {
        const lower = (category || '').toLowerCase();
        return lower.includes('apparel') || lower.includes('billiard') || lower.includes('equipment') || lower.includes('accessories');
    };

    const categorizedProducts = products.filter(p => activeCategory === 'EQUIPMENT' ? isEquipment(p.category) : !isEquipment(p.category));
    const filteredProducts = categorizedProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category?.toLowerCase().includes(searchTerm.toLowerCase()));

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        m.phone.includes(memberSearchQuery) ||
        m.id.toLowerCase().includes(memberSearchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row fade-in h-full bg-[#0d0a08]">
            {/* Left Catalog Area */}
            <div className="flex-[2] flex flex-col border-r border-[#221c17] bg-[#0d0a08]">
                <div className="p-8 pb-4">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-3.5 w-5 h-5 text-amber-600/60" />
                        <input
                            type="text"
                            placeholder={activeCategory === 'FNB' ? "Search coffee, drinks, croissants..." : "Search cues, chalks, apparel..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#181310] border border-[#2d221b] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#d48c5c] focus:ring-1 focus:ring-[#d48c5c]/50 transition-all"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveCategory('FNB')}
                            className={`flex-[1] py-3 rounded-xl font-bold text-sm transition-all text-center border flex items-center justify-center gap-2 ${activeCategory === 'FNB' ? 'bg-[#d48c5c] text-[#0d0a08] border-[#d48c5c] shadow-[0_4px_12px_rgba(212,140,92,0.25)]' : 'bg-[#181310] text-[#a08474] border-[#2d221b] hover:text-white hover:border-[#4a362b]'}`}
                        >
                            <Utensils className="w-4 h-4" />
                            Food & Beverage Menu
                        </button>
                        <button
                            onClick={() => setActiveCategory('EQUIPMENT')}
                            className={`flex-[1] py-3 rounded-xl font-bold text-sm transition-all text-center border flex items-center justify-center gap-2 ${activeCategory === 'EQUIPMENT' ? 'bg-[#d48c5c] text-[#0d0a08] border-[#d48c5c] shadow-[0_4px_12px_rgba(212,140,92,0.25)]' : 'bg-[#181310] text-[#a08474] border-[#2d221b] hover:text-white hover:border-[#4a362b]'}`}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Store & Equipment
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(p => {
                            const style = getProductEmojiAndStyle(p.name, p.category);
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => handleAddToCart(p)}
                                    className={`bg-gradient-to-br ${style.gradient} border ${style.border} p-4 rounded-xl text-left hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden flex flex-col justify-between min-h-[145px]`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`text-[10px] font-bold ${style.badgeBg} px-2 py-0.5 rounded-md uppercase tracking-wider`}>
                                            {p.category || 'F&B'}
                                        </span>
                                        <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{style.emoji}</span>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <h3 className="font-bold text-sm leading-snug text-gray-200 group-hover:text-white transition-colors line-clamp-2 min-h-[40px]">{p.name}</h3>
                                    </div>
                                    
                                    <div className="mt-2 flex justify-between items-end pt-2 border-t border-white/[0.03]">
                                        <p className="font-mono font-bold text-[#d48c5c] text-sm">
                                            Rp {p.price.toLocaleString('id-ID')}
                                        </p>
                                        <span className="text-[10px] text-gray-500 font-semibold">Stock: {p.stock}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-20 text-gray-600 italic border border-dashed border-[#2d221b] rounded-xl">
                            <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20 text-[#d48c5c]" />
                            No menu items found.
                        </div>
                    )}
                </div>
            </div>

            {/* Right Cart Area */}
            <div className="flex-1 flex flex-col bg-[#120e0c] border-l border-[#271d17] relative z-10 shadow-2xl">
                <div className="p-6 border-b border-[#271d17] bg-[#0c0908]">
                    <h2 className="text-lg font-black flex items-center text-white tracking-wide">
                        <ShoppingBag className="w-5 h-5 mr-3 text-[#d48c5c]" />
                        Current Order
                    </h2>
                </div>

                {/* Customer Details Form */}
                <div className="p-6 border-b border-[#271d17] space-y-4 bg-[#120e0c]">
                    <h3 className="text-xs font-bold text-[#a08474] uppercase tracking-widest mb-1">Customer Details</h3>
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1">Walk-in Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-[#a08474]/60" />
                            <input
                                type="text"
                                placeholder="E.g. Mr. John"
                                value={customerName}
                                onChange={(e) => {
                                    setCustomerName(e.target.value);
                                    if (e.target.value) setMemberId(''); // Disable member ID if walk-in used
                                }}
                                className="w-full bg-[#0c0908] border border-[#2d221b] text-white placeholder:text-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#d48c5c] focus:ring-1 focus:ring-[#d48c5c]/50 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex items-center text-[10px] text-gray-600 my-2">
                        <div className="flex-1 border-t border-[#2d221b]"></div>
                        <span className="px-2 font-bold tracking-widest">OR</span>
                        <div className="flex-1 border-t border-[#2d221b]"></div>
                    </div>
                    <div>
                        <label className="block text-[10px] text-[#d48c5c] mb-1 font-black uppercase tracking-wider">Search Member (Name/Phone)</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Type to search member..."
                                value={memberSearchQuery}
                                onChange={(e) => {
                                    setMemberSearchQuery(e.target.value);
                                    setShowMemberResults(true);
                                    if (e.target.value) setCustomerName('');
                                }}
                                onFocus={() => setShowMemberResults(true)}
                                className="w-full bg-[#0c0908] border border-[#d48c5c]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d48c5c] text-[#e3a87c] placeholder-[#a08474]/40"
                            />
                            {showMemberResults && memberSearchQuery && (
                                <div className="absolute left-0 right-0 mt-1 bg-[#181310] border border-[#2d221b] rounded-lg shadow-2xl z-20 max-h-48 overflow-y-auto">
                                    {filteredMembers.length > 0 ? (
                                        filteredMembers.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    setMemberId(m.id);
                                                    setMemberSearchQuery(m.name);
                                                    setShowMemberResults(false);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-[#d48c5c]/10 border-b border-[#2d221b] last:border-0"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-sm text-white">{m.name} {m.handicap ? `- HC: ${m.handicap}` : ''}</span>
                                                    <span className="text-[10px] bg-[#d48c5c]/20 text-[#e3a87c] px-2 py-0.5 rounded uppercase font-black">{m.tier}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-xs text-gray-500">{m.phone}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">{m.id}</span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-500 text-xs italic">No member found</div>
                                    )}
                                </div>
                            )}
                        </div>
                        {memberId && (
                            <div className="mt-2 flex items-center justify-between bg-[#d48c5c]/5 border border-[#d48c5c]/20 p-2 rounded-lg">
                                <span className="text-[10px] font-bold text-[#e3a87c] uppercase">Selected: {members.find(m => m.id === memberId)?.name}</span>
                                <button onClick={() => { setMemberId(''); setMemberSearchQuery(''); }} className="text-[10px] text-red-400 font-bold hover:underline">CLEAR</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-3 bg-[#120e0c]">
                    {cart.length === 0 ? (
                        <div className="text-center mt-10 text-gray-600 opacity-60">
                            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-[#a08474]/50" />
                            <p className="font-bold text-sm tracking-wide text-[#a08474]">Cart is currently empty</p>
                            <p className="text-xs text-gray-600 mt-1">Select items from the menu</p>
                        </div>
                    ) : (
                        cart.map(item => {
                            const style = getProductEmojiAndStyle(item.product.name, item.product.category);
                            return (
                                <div key={item.product.id} className="flex items-center justify-between border border-[#2d221b] bg-[#0c0908] p-3 rounded-xl animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex-1 pr-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{style.emoji}</span>
                                            <p className="font-bold text-xs text-gray-200 leading-tight line-clamp-1">{item.product.name}</p>
                                        </div>
                                        <p className="text-[#d48c5c] text-xs font-mono font-bold mt-1">
                                            Rp {(item.product.price * item.qty).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="flex items-center bg-[#181310] rounded-lg border border-[#2d221b]">
                                        <button onClick={() => updateCartQty(item.product.id, -1)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-l-lg transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                                        <span className="font-mono font-bold text-xs w-6 text-center text-white">{item.qty}</span>
                                        <button onClick={() => updateCartQty(item.product.id, 1)} className="p-1.5 text-gray-500 hover:text-[#d48c5c] hover:bg-white/5 rounded-r-lg transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Checkout */}
                <div className="p-6 border-t border-[#271d17] bg-[#0c0908] space-y-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-500 font-black uppercase tracking-widest text-[9px]">Grand Total Order</span>
                        <span className="text-xl font-mono font-black text-[#e3a87c] tracking-tighter">
                            Rp {totalAmount.toLocaleString('id-ID')}
                        </span>
                    </div>

                    <button
                        onClick={() => handlePlaceOrder(true)}
                        disabled={loading || cart.length === 0}
                        className={`w-full py-3.5 rounded-xl font-black text-sm flex justify-center items-center gap-3 transition-all ${(loading || cart.length === 0)
                            ? 'bg-[#1c1613] text-gray-600 cursor-not-allowed border border-[#2d221b]'
                            : 'bg-[#d48c5c] text-[#0c0908] hover:bg-[#e39c6c] shadow-[0_6px_20px_rgba(212,140,92,0.2)] active:scale-[0.98]'
                            }`}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                        BAYAR SEKARANG
                    </button>

                    <button
                        onClick={() => handlePlaceOrder(false)}
                        disabled={loading || cart.length === 0}
                        className="w-full py-2.5 rounded-xl font-bold text-[10px] bg-white/[0.02] border border-white/5 text-[#a08474] hover:text-white hover:bg-white/[0.05] transition-all uppercase tracking-widest"
                    >
                        Save to Pending Bill
                    </button>
                </div>
            </div>

            {/* --- Payment Modal --- */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-[#181310] border border-[#2d221b] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-[#2d221b] bg-white/[0.01]">
                            <h2 className="text-lg font-black flex items-center gap-2 text-white">
                                <DollarSign className="w-5 h-5 text-[#d48c5c]" />
                                PAYMENT PROCESS
                            </h2>
                            <p className="text-[9px] text-[#a08474] font-bold uppercase tracking-widest mt-1">Finalize transaction for {customerName || 'Member'}</p>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="text-center bg-[#0d0a08] py-4 rounded-xl border border-white/[0.02]">
                                <p className="text-[9px] text-[#a08474] font-bold uppercase tracking-widest mb-1">Total Bill Amount</p>
                                <p className="text-2xl font-mono font-black text-[#d48c5c]">Rp {totalAmount.toLocaleString('id-ID')}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {(['CASH', 'QRIS', 'DEBIT'] as const).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setPayMethod(m)}
                                        className={`py-2.5 rounded-lg font-black text-[10px] border transition-all ${payMethod === m ? 'bg-[#d48c5c] border-[#d48c5c] text-black shadow-[0_4px_12px_rgba(212,140,92,0.25)]' : 'bg-[#0d0a08] border-[#2d221b] text-gray-500 hover:border-[#4a362b] hover:text-[#a08474]'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>

                            {payMethod === 'CASH' && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-[#a08474] uppercase tracking-widest pl-1">Amount Received</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={receivedAmount}
                                                onChange={e => setReceivedAmount(parseInt(e.target.value) || 0)}
                                                className="w-full bg-[#0d0a08] border border-[#2d221b] rounded-xl px-4 py-3 focus:outline-none focus:border-[#d48c5c] font-mono font-black text-xl text-white"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600">RP</div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-t border-dashed border-[#2d221b]">
                                        <span className="text-[10px] font-black text-[#a08474] uppercase">Change Return</span>
                                        <span className="text-lg font-mono font-black text-[#5c9cd4]">Rp {Math.max(0, receivedAmount - totalAmount).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-[#2d221b] bg-[#0c0908] flex gap-3">
                            <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 rounded-xl border border-[#2d221b] text-gray-500 font-bold text-xs hover:text-white transition-all">TERMINATE</button>
                            <button
                                onClick={processFinalPayment}
                                disabled={loading || (payMethod === 'CASH' && receivedAmount < totalAmount)}
                                className={`flex-[2] py-3 rounded-xl font-black text-sm transition-all ${loading || (payMethod === 'CASH' && receivedAmount < totalAmount) ? 'bg-[#1c1613] text-gray-600 border border-[#2d221b] cursor-not-allowed' : 'bg-[#d48c5c] text-[#0d0a08] hover:bg-[#e39c6c] shadow-[0_4px_12px_rgba(212,140,92,0.25)]'}`}
                            >
                                {loading ? 'PROCESSING...' : 'COMPLETE TRANSACTION'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
