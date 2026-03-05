import { useState, useEffect } from 'react';
import { api } from './api';
import { vamosAlert } from './utils/dialog';
import { Utensils, Search, Minus, Plus, ShoppingBag, User, DollarSign, Loader2 } from 'lucide-react';

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
        <div className="flex flex-col lg:flex-row fade-in">
            {/* Left Catalog Area */}
            <div className="flex-[2] flex flex-col border-r border-[#222222]">
                <div className="p-8 pb-4">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={activeCategory === 'FNB' ? "Search snacks, drinks, cigarettes..." : "Search apparel, equipment, accessories..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#141414] border border-[#222222] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#ff9900] transition-colors"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveCategory('FNB')}
                            className={`flex-[1] py-2 rounded-xl font-bold text-sm transition-all text-center border ${activeCategory === 'FNB' ? 'bg-[#ff9900] text-[#0a0a0a] border-[#ff9900]' : 'bg-[#141414] text-gray-400 border-[#222222] hover:text-white'}`}
                        >
                            <Utensils className="w-4 h-4 inline-block mr-2 -mt-1" />
                            Food & Beverage
                        </button>
                        <button
                            onClick={() => setActiveCategory('EQUIPMENT')}
                            className={`flex-[1] py-2 rounded-xl font-bold text-sm transition-all text-center border ${activeCategory === 'EQUIPMENT' ? 'bg-[#ff9900] text-[#0a0a0a] border-[#ff9900]' : 'bg-[#141414] text-gray-400 border-[#222222] hover:text-white'}`}
                        >
                            <ShoppingBag className="w-4 h-4 inline-block mr-2 -mt-1" />
                            Store & Equipment
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleAddToCart(p)}
                                className="bg-[#141414] border border-[#222222] p-4 rounded-xl text-left hover:border-[#ff9900]/50 hover:shadow-[0_0_15px_rgba(255,153,0,0.1)] transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
                            >
                                <div>
                                    <span className="text-xs font-semibold bg-[#222222] text-gray-300 px-2 py-1 rounded inline-block mb-3">
                                        {p.category || 'F&B'}
                                    </span>
                                    <h3 className="font-bold text-sm leading-tight text-gray-200 group-hover:text-white transition-colors">{p.name}</h3>
                                </div>
                                <div className="mt-4 flex justify-between items-end">
                                    <p className="font-mono font-bold text-[#ff9900]">
                                        Rp {p.price.toLocaleString('id-ID')}
                                    </p>
                                    <span className="text-xs text-gray-500 font-semibold tracking-wider">Stock: {p.stock}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-20 text-gray-500 italic border border-dashed border-[#222222] rounded-xl">
                            <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            No available products found matching your search.
                        </div>
                    )}
                </div>
            </div>

            {/* Right Cart Area */}
            <div className="flex-1 flex flex-col bg-[#141414] border-l border-[#222222] relative z-10 shadow-2xl">
                <div className="p-6 border-b border-[#222222] bg-[#0a0a0a]">
                    <h2 className="text-xl font-bold flex items-center">
                        <ShoppingBag className="w-5 h-5 mr-3 text-white" />
                        Current Order
                    </h2>
                </div>

                {/* Customer Details Form */}
                <div className="p-6 border-b border-[#222222] space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer Details</h3>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Walk-in Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="E.g. Mr. John"
                                value={customerName}
                                onChange={(e) => {
                                    setCustomerName(e.target.value);
                                    if (e.target.value) setMemberId(''); // Disable member ID if walk-in used
                                }}
                                className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#00ff66]"
                            />
                        </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-600 my-2">
                        <div className="flex-1 border-t border-[#222222]"></div>
                        <span className="px-2 font-semibold">OR</span>
                        <div className="flex-1 border-t border-[#222222]"></div>
                    </div>
                    <div>
                        <label className="block text-xs text-[#00ff66] mb-1 font-bold">Search Member (Name/Phone)</label>
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
                                className="w-full bg-[#0a0a0a] border border-[#00ff66]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00ff66] text-[#00ff66]"
                            />
                            {showMemberResults && memberSearchQuery && (
                                <div className="absolute left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                    {filteredMembers.length > 0 ? (
                                        filteredMembers.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    setMemberId(m.id);
                                                    setMemberSearchQuery(m.name);
                                                    setShowMemberResults(false);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-[#00ff66]/10 border-b border-[#222] last:border-0"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-sm text-white">{m.name}</span>
                                                    <span className="text-[10px] bg-[#00ff66]/20 text-[#00ff66] px-2 py-0.5 rounded uppercase font-black">{m.tier}</span>
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
                            <div className="mt-2 flex items-center justify-between bg-[#00ff66]/5 border border-[#00ff66]/20 p-2 rounded-lg">
                                <span className="text-[10px] font-bold text-[#00ff66] uppercase">Selected: {members.find(m => m.id === memberId)?.name}</span>
                                <button onClick={() => { setMemberId(''); setMemberSearchQuery(''); }} className="text-[10px] text-red-500 font-bold hover:underline">CLEAR</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center mt-10 text-gray-500 opacity-60">
                            <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-semibold">Cart is currently empty.</p>
                            <p className="text-sm">Click items on the left to add.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.product.id} className="flex items-center justify-between border border-[#222222] bg-[#0a0a0a] p-3 rounded-xl animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex-1 pr-3">
                                    <p className="font-bold text-sm leading-tight mb-1">{item.product.name}</p>
                                    <p className="text-[#ff9900] text-xs font-mono font-bold">
                                        Rp {(item.product.price * item.qty).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div className="flex items-center bg-[#141414] rounded-lg border border-[#222222]">
                                    <button onClick={() => updateCartQty(item.product.id, -1)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white/5 rounded-l-lg transition-colors"><Minus className="w-4 h-4" /></button>
                                    <span className="font-bold text-sm w-8 text-center bg-black/20 py-1">{item.qty}</span>
                                    <button onClick={() => updateCartQty(item.product.id, 1)} className="p-2 text-gray-400 hover:text-[#00ff66] hover:bg-white/5 rounded-r-lg transition-colors"><Plus className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Checkout */}
                <div className="p-6 border-t border-[#222222] bg-[#0a0a0a] space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Grand Total Order</span>
                        <span className="text-2xl font-mono font-black text-white tracking-tighter">
                            Rp {totalAmount.toLocaleString('id-ID')}
                        </span>
                    </div>

                    <button
                        onClick={() => handlePlaceOrder(true)}
                        disabled={loading || cart.length === 0}
                        className={`w-full py-4 rounded-xl font-black text-lg flex justify-center items-center gap-3 transition-all ${(loading || cart.length === 0)
                            ? 'bg-[#222222] text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#00ff66] to-[#00cc52] text-[#0a0a0a] hover:from-[#00e65c] hover:to-[#00b347] shadow-[0_10px_25px_rgba(0,255,102,0.2)] transform hover:-translate-y-0.5'
                            }`}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
                        BAYAR SEKARANG
                    </button>

                    <button
                        onClick={() => handlePlaceOrder(false)}
                        disabled={loading || cart.length === 0}
                        className="w-full py-3 rounded-xl font-bold text-xs bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                    >
                        Save to Pending Bill
                    </button>
                </div>
            </div>

            {/* --- Payment Modal --- */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-[#141414] border border-[#222] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-[#222] bg-white/[0.02]">
                            <h2 className="text-xl font-black flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-[#00ff66]" />
                                PAYMENT PROCESS
                            </h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Finalize transaction for {customerName || 'Member'}</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="text-center bg-black/40 py-4 rounded-2xl border border-white/[0.03]">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Bill Amount</p>
                                <p className="text-3xl font-mono font-black text-[#00ff66]">Rp {totalAmount.toLocaleString('id-ID')}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {(['CASH', 'QRIS', 'DEBIT'] as const).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setPayMethod(m)}
                                        className={`py-3 rounded-xl font-black text-[10px] border transition-all ${payMethod === m ? 'bg-[#00ff66] border-[#00ff66] text-black shadow-[0_0_15px_rgba(0,255,102,0.2)]' : 'bg-black/20 border-[#222] text-gray-500 hover:border-gray-700'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>

                            {payMethod === 'CASH' && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Amount Received</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={receivedAmount}
                                                onChange={e => setReceivedAmount(parseInt(e.target.value) || 0)}
                                                className="w-full bg-black border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-[#00ff66] font-mono font-black text-xl text-white"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600">RP</div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-t border-dashed border-[#222]">
                                        <span className="text-[10px] font-black text-gray-500 uppercase">Change Return</span>
                                        <span className="text-lg font-mono font-black text-[#00aaff]">Rp {Math.max(0, receivedAmount - totalAmount).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-[#222] bg-[#0a0a0a] flex gap-3">
                            <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 rounded-xl border border-[#222] text-gray-500 font-bold text-xs hover:text-white transition-all">TERMINATE</button>
                            <button
                                onClick={processFinalPayment}
                                disabled={loading || (payMethod === 'CASH' && receivedAmount < totalAmount)}
                                className={`flex-[2] py-3 rounded-xl font-black text-sm transition-all ${loading || (payMethod === 'CASH' && receivedAmount < totalAmount) ? 'bg-[#222] text-gray-600 cursor-not-allowed' : 'bg-[#00ff66] text-black hover:opacity-90 shadow-[0_0_20px_rgba(0,255,102,0.3)]'}`}
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
