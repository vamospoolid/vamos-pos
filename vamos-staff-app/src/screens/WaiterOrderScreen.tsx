import { useState, useEffect, useRef } from 'react';
import { 
    Utensils, Search, Plus, Minus, Send, CheckCircle2, MessageSquare, 
    ArrowLeft, Trash2, Volume2, X, User, Sparkles, Receipt, 
    LayoutGrid, List, Coffee, ShieldCheck, Filter, Check
} from 'lucide-react';
import { api } from '../api';
import { getProductVisual } from '../utils/productImages';

interface WaiterOrderScreenProps {
    staff: any;
    onBack?: () => void;
}

const SPECIAL_AREAS = [
    { id: 'AREA_CAFE', name: 'Kafe & Resto (Umum)', type: 'Area F&B', status: 'DINE-IN' },
];

const isBilliardTable = (t: any) => {
    const type = (t.type || '').toUpperCase();
    const name = (t.name || '').toLowerCase();
    return type !== 'CAFE' && !name.includes('cafe') && !name.includes('bar counter');
};

// Filter operational / staff-only items (starts with Op. / OP. / Operasional)
const isOpProduct = (p: any) => {
    const name = (p?.name || '').trim().toLowerCase();
    return (
        name.startsWith('op.') ||
        name.startsWith('op ') ||
        name.startsWith('op-') ||
        name.startsWith('(op)') ||
        name.startsWith('operasional')
    );
};

// Clean display name (removes B., F., Op. prefixes for high-class guest menu presentation)
const formatDisplayName = (name: string) => {
    if (!name) return '';
    return name
        .replace(/^(Op\.\s*|Op\s+)?([BF]\.\s*)/i, '')
        .trim();
};

// Category label & aesthetic metadata
const getCategoryMeta = (cat: string) => {
    const upper = (cat || '').toUpperCase();
    if (upper === 'SEMUA') {
        return { label: 'Semua Menu', icon: '🌟', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    if (upper.includes('BEVERAGE') || upper.includes('MINUMAN')) {
        return { label: 'Minuman', icon: '🍹', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80' };
    }
    if (upper.includes('FOOD') || upper.includes('MAKANAN') || upper.includes('AYAM')) {
        return { label: 'Makanan', icon: '🍳', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200/80' };
    }
    if (upper.includes('SNACK') || upper.includes('CEMILAN')) {
        return { label: 'Snack & Cemilan', icon: '🍟', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80' };
    }
    if (upper.includes('BILLIARD') || upper.includes('SARUNG')) {
        return { label: 'Aksesoris Biliar', icon: '🎱', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80' };
    }
    return { label: cat, icon: '🍽️', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' };
};

export default function WaiterOrderScreen({ staff, onBack }: WaiterOrderScreenProps) {
    const [tables, setTables] = useState<any[]>([]);
    const billiardTables = tables.filter(isBilliardTable);
    const cafeTables = tables.filter((t: any) => !isBilliardTable(t));
    const [lastSelectedBilliardTable, setLastSelectedBilliardTable] = useState<any>(null);
    const [selectedTable, setSelectedTable] = useState<any>({ id: 'DEFAULT_BILIAR', name: 'Meja Biliar', type: 'Billiard', status: 'AVAILABLE' });
    const [customerName, setCustomerName] = useState('');
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [memberSuggestions, setMemberSuggestions] = useState<any[]>([]);
    const [isSearchingMember, setIsSearchingMember] = useState(false);
    const [activeCafeSessions, setActiveCafeSessions] = useState<any[]>([]);
    const [showActiveSessionsModal, setShowActiveSessionsModal] = useState(false);
    const [areaNote, setAreaNote] = useState('');
    
    // Products and filtering state
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<string[]>(['SEMUA']);
    const [selectedCategory, setSelectedCategory] = useState('SEMUA');
    const [searchQuery, setSearchQuery] = useState('');
    const [showOpItems, setShowOpItems] = useState(false); // DEFAULT FALSE: Hide Op. items
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // DEFAULT 'list' for high comfortable reading

    // Cart State
    const [cart, setCart] = useState<{ product: any; qty: number; notes?: string }[]>([]);
    const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedItemForNotes, setSelectedItemForNotes] = useState<any>(null);
    const [modifierNote, setModifierNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const searchTimeoutRef = useRef<any>(null);

    // Fetch Tables, Menu & Active Cafe Sessions
    const fetchData = async () => {
        try {
            const [tableRes, prodRes, activeCafeRes] = await Promise.all([
                api.get('/staff/tables').catch(() => null),
                api.get('/staff/products').catch(() => null),
                api.get('/staff/active-cafe-sessions').catch(() => null)
            ]);

            if (tableRes?.data?.data && tableRes.data.data.length > 0) {
                const fetchedTables = tableRes.data.data;
                setTables(fetchedTables);
                const bTables = fetchedTables.filter(isBilliardTable);
                if (bTables.length > 0) {
                    setSelectedTable((prev: any) => {
                        if (!prev || prev.id === 'DEFAULT_BILIAR' || !prev.id.startsWith('AREA_')) {
                            return bTables[0];
                        }
                        return prev;
                    });
                    setLastSelectedBilliardTable(bTables[0]);
                }
            }

            if (activeCafeRes?.data?.success) {
                setActiveCafeSessions(activeCafeRes.data.data || []);
            }

            if (prodRes?.data?.data) {
                const allProds = prodRes.data.data;
                setProducts(allProds);

                // Categories derived strictly from non-Op products so "Ayam lalapan" etc doesn't pollute
                const regularProds = allProds.filter((p: any) => !isOpProduct(p));
                const cats = Array.from(new Set(regularProds.map((p: any) => p.category?.toUpperCase() || 'LAINNYA'))) as string[];
                setCategories(['SEMUA', ...cats]);
            }
        } catch (err) {
            console.error('Failed to fetch waiter menu & tables', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle Customer Name input and auto-detect member by name / phone
    const handleCustomerNameChange = (val: string) => {
        setCustomerName(val);
        if (selectedMember && val.trim() !== selectedMember.name) {
            setSelectedMember(null);
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (val.trim().length >= 2) {
            setIsSearchingMember(true);
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const res = await api.get(`/staff/members?query=${encodeURIComponent(val.trim())}`);
                    if (res.data?.success) {
                        setMemberSuggestions(res.data.data || []);
                    }
                } catch {
                    setMemberSuggestions([]);
                } finally {
                    setIsSearchingMember(false);
                }
            }, 300);
        } else {
            setMemberSuggestions([]);
            setIsSearchingMember(false);
        }
    };

    const handleSelectMember = (member: any) => {
        setSelectedMember(member);
        setCustomerName(member.name);
        setMemberSuggestions([]);
    };

    const handleClearMember = () => {
        setSelectedMember(null);
        setMemberSuggestions([]);
    };

    const handleSelectExistingCafeSession = (session: any) => {
        setCustomerName(session.customerName || session.member?.name || '');
        if (session.member) {
            setSelectedMember(session.member);
        } else {
            setSelectedMember(null);
        }
        setShowActiveSessionsModal(false);
    };

    // Matched existing active session
    const matchedActiveSession = activeCafeSessions.find(s => 
        (selectedMember && s.memberId === selectedMember.id) ||
        (customerName.trim() && s.customerName && s.customerName.toLowerCase() === customerName.trim().toLowerCase())
    );

    // Cart operations
    const addToCart = (product: any) => {
        setRecentlyAddedId(product.id);
        setTimeout(() => {
            setRecentlyAddedId(prev => (prev === product.id ? null : prev));
        }, 650);

        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, { product, qty: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === productId);
            if (existing && existing.qty > 1) {
                return prev.map(item =>
                    item.product.id === productId ? { ...item, qty: item.qty - 1 } : item
                );
            }
            return prev.filter(item => item.product.id !== productId);
        });
    };

    const deleteFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const clearCart = () => {
        if (cart.length === 0) return;
        if (confirm('Kosongkan semua item di keranjang pesanan?')) {
            setCart([]);
            setIsCartOpen(false);
        }
    };

    const handleExit = () => {
        if (cart.length > 0) {
            if (confirm('Anda memiliki pesanan yang belum dikirim. Yakin ingin keluar?')) {
                setCart([]);
                if (onBack) onBack();
            }
        } else {
            if (onBack) onBack();
        }
    };

    const saveNotesToItem = () => {
        if (!selectedItemForNotes) return;
        setCart(prev =>
            prev.map(item =>
                item.product.id === selectedItemForNotes.product.id ? { ...item, notes: modifierNote.trim() } : item
            )
        );
        setSelectedItemForNotes(null);
        setModifierNote('');
    };

    // Filter products: Strictly hide Op. products unless showOpItems is explicitly checked
    const filteredProducts = products.filter(p => {
        const isOp = isOpProduct(p);
        if (!showOpItems && isOp) {
            return false;
        }

        const matchesCat = selectedCategory === 'SEMUA' || (p.category?.toUpperCase() || 'LAINNYA') === selectedCategory;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch = !q || 
            p.name.toLowerCase().includes(q) || 
            (p.category || '').toLowerCase().includes(q);

        return matchesCat && matchesSearch;
    });

    const totalCartAmount = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);

    // Submit Order to Backend
    const handleSubmitOrder = async () => {
        if (!selectedTable || selectedTable.id === 'DEFAULT_BILIAR') {
            alert('Pilih area atau meja biliar yang valid terlebih dahulu.');
            return;
        }

        const isCafeArea = selectedTable.id?.startsWith('AREA_') || cafeTables.some((t: any) => t.id === selectedTable?.id);
        if (isCafeArea && !customerName.trim()) {
            alert('Silakan masukkan Nama Pemesan Cafe (atau pilih Member) terlebih dahulu.');
            return;
        }

        if (cart.length === 0) return;

        setSubmitting(true);
        try {
            const payload = {
                cart: cart.map(item => ({
                    productId: item.product.id,
                    quantity: item.qty,
                    notes: item.notes || undefined
                })),
                waiterName: staff.name,
                customerName: customerName.trim() || undefined,
                memberId: selectedMember?.id || undefined,
                areaNote: areaNote.trim() || undefined
            };

            await api.post(`/qr/order/${selectedTable.id}`, payload);
            setOrderSuccess(true);
            setCart([]);
            setCustomerName('');
            setSelectedMember(null);
            setAreaNote('');
            setIsCartOpen(false);
            fetchData();
            setTimeout(() => setOrderSuccess(false), 3500);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Gagal mengirim pesanan');
        } finally {
            setSubmitting(false);
        }
    };

    const isCafeSelected = selectedTable?.id?.startsWith('AREA_') || cafeTables.some((t: any) => t.id === selectedTable?.id);

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-36 max-w-xl mx-auto font-sans antialiased">
            {/* Top Navigation Header: Sleek Royal Blue Modern Kiosk Banner */}
            <header className="sticky top-0 z-30 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white px-4 py-3.5 shadow-lg border-b border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleExit}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                        <span>Kembali</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FF5E14] to-amber-500 flex items-center justify-center text-white shadow-md">
                            <Utensils className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left">
                            <h1 className="text-xs font-black tracking-wide uppercase text-white leading-tight">Order Menu Tamu</h1>
                            <p className="text-[10px] text-slate-300 font-medium">Pelayan: <strong className="text-amber-300">{staff.name}</strong></p>
                        </div>
                    </div>

                    {cart.length > 0 ? (
                        <button
                            onClick={clearCart}
                            className="text-[11px] font-bold text-rose-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 active:scale-95 transition-all"
                        >
                            Reset
                        </button>
                    ) : (
                        <div className="w-16 text-right">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                Live
                            </span>
                        </div>
                    )}
                </div>
            </header>

            <div className="p-3.5 space-y-3.5">
                {/* 1. Area & Table Selection Card */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)] space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#FF5E14] animate-pulse" />
                            Pilih Lokasi & Meja Tamu
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                            {isCafeSelected ? 'Area Cafe / F&B' : 'Billiard Arena'}
                        </span>
                    </div>

                    {/* Area Segmented Buttons */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60">
                        <button
                            type="button"
                            onClick={() => {
                                if (lastSelectedBilliardTable && isBilliardTable(lastSelectedBilliardTable)) {
                                    setSelectedTable(lastSelectedBilliardTable);
                                } else if (billiardTables.length > 0) {
                                    setSelectedTable(billiardTables[0]);
                                }
                            }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                !isCafeSelected
                                    ? 'bg-[#1E293B] text-white shadow-md font-black scale-[1.02]'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center text-[9px] font-black shrink-0">8</span>
                            <span>Meja Biliar</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (!isCafeSelected) {
                                    setLastSelectedBilliardTable(selectedTable);
                                }
                                setSelectedTable(SPECIAL_AREAS[0]);
                            }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                isCafeSelected
                                    ? 'bg-[#1E293B] text-white shadow-md font-black scale-[1.02]'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Area Kafe & Resto</span>
                        </button>
                    </div>

                    {/* Billiard Table Selector */}
                    {!isCafeSelected && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Meja Biliar Aktif:
                            </label>
                            <select
                                value={selectedTable?.id || ''}
                                onChange={e => {
                                    const found = billiardTables.find(t => t.id === e.target.value);
                                    if (found) {
                                        setSelectedTable(found);
                                        setLastSelectedBilliardTable(found);
                                    }
                                }}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-xs px-3.5 py-2.5 rounded-2xl focus:outline-none focus:border-[#1E293B] focus:bg-white transition-all cursor-pointer"
                            >
                                {billiardTables.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.type || 'REGULAR'}) — Status: {t.status}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Cafe Area Table Selector */}
                    {isCafeSelected && cafeTables.length > 0 && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Meja Kafe Spesifik:
                            </label>
                            <select
                                value={selectedTable?.id || 'AREA_CAFE'}
                                onChange={e => {
                                    if (e.target.value === 'AREA_CAFE') {
                                        setSelectedTable(SPECIAL_AREAS[0]);
                                    } else {
                                        const found = cafeTables.find(t => t.id === e.target.value);
                                        if (found) setSelectedTable(found);
                                    }
                                }}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-xs px-3.5 py-2.5 rounded-2xl focus:outline-none focus:border-[#1E293B] focus:bg-white transition-all cursor-pointer"
                            >
                                <option value="AREA_CAFE">Area Kafe & Lounge (Umum)</option>
                                {cafeTables.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} — Status: {t.status}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Customer Name / Member Autodetect */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <User className="w-3 h-3 text-[#FF5E14]" />
                                <span>Nama Pemesan {isCafeSelected ? '(Wajib di Kafe)' : '(Opsional)'}</span>
                            </label>

                            {/* Active open bills button */}
                            {isCafeSelected && activeCafeSessions.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowActiveSessionsModal(true)}
                                    className="text-[10px] font-extrabold text-[#FF5E14] hover:underline flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 active:scale-95"
                                >
                                    <Receipt className="w-3 h-3" />
                                    <span>Tagihan Aktif ({activeCafeSessions.length})</span>
                                </button>
                            )}
                        </div>

                        {selectedMember ? (
                            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 animate-in fade-in">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                                        ★
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-black text-slate-800">{selectedMember.name}</span>
                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                                {selectedMember.tier || 'BRONZE'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            {selectedMember.phone} • <strong className="text-indigo-600">{selectedMember.loyaltyPoints || 0} Poin</strong>
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClearMember}
                                    className="p-1 rounded-lg hover:bg-indigo-100 text-slate-400 hover:text-slate-700 active:scale-95"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={e => handleCustomerNameChange(e.target.value)}
                                    placeholder="Ketik nama pemesan atau nomor WA member..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E293B] focus:bg-white transition-colors"
                                />
                                {customerName && (
                                    <button
                                        type="button"
                                        onClick={() => setCustomerName('')}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {isSearchingMember && (
                                    <div className="absolute right-8 top-3 w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                )}

                                {/* Member Suggestion Dropdown */}
                                {memberSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                                        <div className="p-2 bg-slate-50 text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                                            <Sparkles className="w-3 h-3 text-amber-500" /> Member Ditemukan:
                                        </div>
                                        {memberSuggestions.map(m => (
                                            <div
                                                key={m.id}
                                                onClick={() => handleSelectMember(m)}
                                                className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                                            >
                                                <div>
                                                    <span className="font-bold text-slate-800 block">{m.name}</span>
                                                    <span className="text-[10px] text-slate-400">{m.phone}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800">
                                                        {m.tier || 'BRONZE'}
                                                    </span>
                                                    <span className="text-[10px] text-indigo-600 block font-bold">{m.loyaltyPoints || 0} Poin</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Active Bill Match Banner */}
                        {matchedActiveSession && (
                            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-in fade-in">
                                <Receipt className="w-4 h-4 shrink-0 text-amber-600" />
                                <div className="flex-1">
                                    <span className="font-extrabold block text-[11px]">
                                        ⚡ Tagihan Aktif: "{matchedActiveSession.customerName}"
                                    </span>
                                    <span className="text-[10px] text-amber-700">
                                        Pesanan akan digabung ke tagihan (Rp {matchedActiveSession.totalAmount?.toLocaleString('id-ID')}).
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Search & Controls Bar */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Cari kopi, mie, snack, dll..."
                                className="w-full bg-white border border-slate-200/80 rounded-2xl pl-10 pr-8 py-2.5 text-xs font-bold focus:outline-none focus:border-[#1E293B] text-slate-800 placeholder-slate-400 shadow-xs"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* View Mode Toggle (Grid vs List) */}
                        <div className="flex items-center bg-white border border-slate-200/80 rounded-2xl p-1 shadow-xs">
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                title="Tampilan Daftar (Cepat & Nyaman)"
                                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                                    viewMode === 'list'
                                        ? 'bg-[#1E293B] text-white shadow-xs'
                                        : 'text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                title="Tampilan Kartu Kotak"
                                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                                    viewMode === 'grid'
                                        ? 'bg-[#1E293B] text-white shadow-xs'
                                        : 'text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Filter Status Badge / Op. Filter Toggle */}
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400">
                                Menampilkan <strong className="text-slate-700">{filteredProducts.length}</strong> menu
                            </span>
                            {!showOpItems && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Menu Tamu (Op. Disembunyikan)
                                </span>
                            )}
                        </div>

                        {/* Optional discreet toggle if admin wants to view Op items */}
                        <button
                            type="button"
                            onClick={() => setShowOpItems(!showOpItems)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold underline underline-offset-2"
                        >
                            {showOpItems ? 'Sembunyikan Op.' : 'Tampilkan Op.'}
                        </button>
                    </div>
                </div>

                {/* 3. Category Filter Chips (Horizontal Scroll) */}
                <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none select-none">
                    {categories.map(cat => {
                        const meta = getCategoryMeta(cat);
                        const isSelected = selectedCategory === cat;
                        // Count items in this category
                        const count = products.filter(p => {
                            if (!showOpItems && isOpProduct(p)) return false;
                            if (cat === 'SEMUA') return true;
                            return (p.category?.toUpperCase() || 'LAINNYA') === cat;
                        }).length;

                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                    isSelected
                                        ? 'bg-[#1E293B] text-white shadow-md font-extrabold scale-[1.02]'
                                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-xs'
                                }`}
                            >
                                <span>{meta.icon}</span>
                                <span>{meta.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Success Notification Banner */}
                {orderSuccess && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500 text-white text-xs font-black flex items-center gap-2.5 shadow-lg shadow-emerald-500/20 animate-in slide-in-from-top">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>Pesanan berhasil dikirim ke Barista, Dapur & Kasir!</span>
                    </div>
                )}

                {/* 4. PRODUCTS LIST / GRID DISPLAY */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                            🔍
                        </div>
                        <h4 className="font-extrabold text-slate-700 text-sm">Tidak ada menu ditemukan</h4>
                        <p className="text-xs text-slate-400">
                            Coba kata kunci lain atau pilih kategori "Semua Menu".
                        </p>
                    </div>
                ) : viewMode === 'list' ? (
                    /* ====== VIEW MODE: LIST (Horizontal Row Cards with Photo Thumbnails & Snappy Animations) ====== */
                    <div className="space-y-2">
                        {filteredProducts.map(p => {
                            const cartItem = cart.find(c => c.product.id === p.id);
                            const displayName = formatDisplayName(p.name);
                            const stockCount = p.stock ?? 99;
                            const isOutOfStock = stockCount <= 0;
                            const visual = getProductVisual(p.name, p.category, p.imageUrl);
                            const isRecentlyAdded = recentlyAddedId === p.id;

                            return (
                                <div
                                    key={p.id}
                                    onClick={(e) => {
                                        if (isOutOfStock) return;
                                        if ((e.target as HTMLElement).closest('button')) return;
                                        addToCart(p);
                                    }}
                                    className={`bg-white border rounded-2xl p-2.5 flex items-center justify-between gap-3 transition-all duration-200 group relative overflow-hidden select-none ${
                                        isOutOfStock
                                            ? 'opacity-50 grayscale border-slate-200 bg-slate-50 cursor-not-allowed'
                                            : 'cursor-pointer active:scale-[0.99] hover:border-slate-300'
                                    } ${
                                        cartItem
                                            ? 'border-[#1E2875] ring-2 ring-[#1E2875]/15 shadow-sm bg-blue-50/20'
                                            : 'border-slate-200/90 shadow-[0_2px_8px_rgba(15,23,42,0.03)]'
                                    }`}
                                >
                                    {/* Floating "+1" animation upon click */}
                                    {isRecentlyAdded && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                                            <span className="animate-float-plus text-xs font-black text-white bg-[#1E2875] px-3.5 py-1.5 rounded-full shadow-[0_8px_20px_rgba(30,40,117,0.4)] border border-white/40 flex items-center gap-1">
                                                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> +1
                                            </span>
                                        </div>
                                    )}

                                    {/* Left: Thumbnail & Details */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        {/* Square Image Thumbnail with Rounded Corners & Badge */}
                                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 shadow-xs">
                                            <img
                                                src={visual.imageUrl}
                                                alt={displayName}
                                                loading="lazy"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                    const parent = (e.target as HTMLElement).parentElement;
                                                    if (parent) {
                                                        const fallback = parent.querySelector('.img-fallback') as HTMLElement;
                                                        if (fallback) fallback.style.display = 'flex';
                                                    }
                                                }}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="img-fallback absolute inset-0 hidden items-center justify-center text-xl bg-gradient-to-br from-slate-50 to-slate-100">
                                                {visual.emoji}
                                            </div>

                                            {/* Quantity Pill Overlaid on Thumbnail */}
                                            {cartItem && (
                                                <div className="absolute -bottom-1 -right-1 bg-[#1E2875] text-white px-1.5 py-0.2 rounded-full text-[9px] font-black border border-white shadow-xs animate-pop-badge">
                                                    {cartItem.qty}x
                                                </div>
                                            )}
                                        </div>

                                        {/* Item Details */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h4 className="font-extrabold text-xs text-slate-800 leading-snug truncate">
                                                    {displayName}
                                                </h4>
                                                {isOpProduct(p) && (
                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                                        Op
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {visual.categoryLabel}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className={`text-[10px] font-bold ${
                                                    isOutOfStock ? 'text-rose-600 font-black' : stockCount <= 5 ? 'text-amber-600' : 'text-slate-500'
                                                }`}>
                                                    {isOutOfStock ? 'Habis' : `Stok: ${stockCount}`}
                                                </span>
                                            </div>

                                            <div className="text-xs font-black text-[#1E2875] mt-0.5">
                                                Rp {p.price?.toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Quantity Stepper or Add Button */}
                                    <div className="shrink-0">
                                        {isOutOfStock ? (
                                            <span className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                                Habis
                                            </span>
                                        ) : cartItem ? (
                                            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs space-x-1.5">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFromCart(p.id);
                                                    }}
                                                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-rose-600 flex items-center justify-center font-black active:scale-90 transition-transform"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="font-black text-xs text-slate-900 w-5 text-center">
                                                    {cartItem.qty}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToCart(p);
                                                    }}
                                                    className="w-7 h-7 rounded-lg bg-[#1E2875] text-white flex items-center justify-center font-black active:scale-90 transition-transform shadow-xs"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addToCart(p);
                                                }}
                                                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-[#1E2875] hover:text-white font-extrabold text-xs text-slate-700 transition-all flex items-center gap-1 active:scale-95 shadow-xs cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Tambah</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* ====== VIEW MODE: GRID (Vibrant White Cards with Food Photography & Animations) ====== */
                    <div className="grid grid-cols-2 gap-3">
                        {filteredProducts.map(p => {
                            const cartItem = cart.find(c => c.product.id === p.id);
                            const displayName = formatDisplayName(p.name);
                            const stockCount = p.stock ?? 99;
                            const isOutOfStock = stockCount <= 0;
                            const visual = getProductVisual(p.name, p.category, p.imageUrl);
                            const isRecentlyAdded = recentlyAddedId === p.id;

                            return (
                                <div
                                    key={p.id}
                                    onClick={(e) => {
                                        if (isOutOfStock) return;
                                        if ((e.target as HTMLElement).closest('button')) return;
                                        addToCart(p);
                                    }}
                                    className={`bg-white border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 group relative select-none ${
                                        isOutOfStock
                                            ? 'opacity-50 grayscale border-slate-200 bg-slate-50 cursor-not-allowed'
                                            : 'cursor-pointer active:scale-[0.98] hover:border-slate-300'
                                    } ${
                                        cartItem
                                            ? 'border-[#1E2875] ring-2 ring-[#1E2875]/15 shadow-md bg-blue-50/15'
                                            : 'border-slate-200/90 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-lg'
                                    }`}
                                >
                                    {/* Floating "+1" animation upon click */}
                                    {isRecentlyAdded && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                                            <span className="animate-float-plus text-xs font-black text-white bg-[#1E2875] px-3.5 py-1.5 rounded-full shadow-[0_8px_20px_rgba(30,40,117,0.4)] border border-white/40 flex items-center gap-1">
                                                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> +1
                                            </span>
                                        </div>
                                    )}

                                    {/* Top Image Container */}
                                    <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                                        <img
                                            src={visual.imageUrl}
                                            alt={displayName}
                                            loading="lazy"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                                const parent = (e.target as HTMLElement).parentElement;
                                                if (parent) {
                                                    const fallback = parent.querySelector('.img-fallback') as HTMLElement;
                                                    if (fallback) fallback.style.display = 'flex';
                                                }
                                            }}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="img-fallback absolute inset-0 hidden items-center justify-center text-3xl bg-gradient-to-br from-slate-50 to-slate-100">
                                            {visual.emoji}
                                        </div>

                                        {/* Top-Left Category Badge */}
                                        <span className="absolute top-2 left-2 z-10 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-slate-700 shadow-xs border border-white/60">
                                            {visual.categoryLabel}
                                        </span>

                                        {/* Top-Right Quantity Badge */}
                                        {cartItem && (
                                            <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-[#1E2875] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-md border border-white/60 animate-pop-badge">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                                <span>{cartItem.qty}x</span>
                                            </div>
                                        )}

                                        {/* Low Stock or Out of stock badge */}
                                        {isOutOfStock ? (
                                            <span className="absolute bottom-2 left-2 z-10 text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                                                Habis
                                            </span>
                                        ) : stockCount <= 5 && (
                                            <span className="absolute bottom-2 left-2 z-10 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/95 text-white shadow-xs backdrop-blur-xs">
                                                Sisa {stockCount}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-3 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-extrabold text-xs text-slate-800 line-clamp-2 leading-snug min-h-[30px]">
                                                {displayName}
                                            </h4>
                                            <div className="mt-1 flex items-baseline justify-between">
                                                <span className="text-xs font-black text-[#1E2875]">
                                                    Rp {p.price?.toLocaleString('id-ID')}
                                                </span>
                                                {isOpProduct(p) && (
                                                    <span className="text-[9px] px-1 rounded bg-rose-50 text-rose-600 font-bold border border-rose-200">
                                                        Op
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Controls */}
                                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                                            {isOutOfStock ? (
                                                <span className="w-full py-1.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center">
                                                    Stok Habis
                                                </span>
                                            ) : cartItem ? (
                                                <div className="flex items-center justify-between w-full bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-inner">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFromCart(p.id);
                                                        }}
                                                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center font-black active:scale-90 transition-transform shadow-xs"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="font-black text-xs text-slate-900">
                                                        {cartItem.qty}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToCart(p);
                                                        }}
                                                        className="w-7 h-7 rounded-lg bg-[#1E2875] hover:bg-[#182163] text-white flex items-center justify-center font-black active:scale-90 transition-transform shadow-xs"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToCart(p);
                                                    }}
                                                    className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-[#1E2875] hover:text-white font-extrabold text-xs text-slate-700 transition-all flex items-center justify-center gap-1 active:scale-95 shadow-xs cursor-pointer"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Tambah</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 5. Floating Bottom Cart Dock (Spaced above bottom navigation bar) */}
            {cart.length > 0 && !isCartOpen && (
                <div className="fixed bottom-20 left-4 right-4 max-w-xl mx-auto z-40 select-none animate-in slide-in-from-bottom duration-300">
                    <div className="p-3.5 rounded-3xl bg-[#0F172A] text-white border border-white/10 shadow-[0_12px_40px_rgba(15,23,42,0.35)] flex items-center justify-between gap-3 backdrop-blur-xl">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#FF5E14] to-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                                {totalCartCount}
                            </div>
                            <div className="truncate">
                                <span className="block text-[10px] font-bold text-slate-400 truncate">
                                    {selectedTable?.id?.startsWith('AREA_') ? selectedTable.name : `Meja ${selectedTable?.name}`}
                                    {customerName ? ` • ${customerName}` : ''}
                                </span>
                                <span className="text-sm font-black text-white">
                                    Rp {totalCartAmount.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF5E14] to-amber-500 hover:opacity-95 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-[#FF5E14]/30 active:scale-95 transition-all cursor-pointer"
                            >
                                <Volume2 className="w-4 h-4" />
                                <span>Lihat & Kirim</span>
                            </button>
                            <button
                                onClick={clearCart}
                                title="Batal / Kosongkan"
                                className="p-2.5 rounded-2xl bg-white/10 text-slate-400 hover:text-rose-400 active:scale-95 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Review & Readback Order Modal ("Bacakan Ulang Pesanan") */}
            {isCartOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col justify-end">
                    <div className="bg-white border-t border-slate-100 rounded-t-[32px] max-w-xl w-full mx-auto max-h-[90vh] flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-4 pb-3 border-b border-slate-100 flex justify-between items-start shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-700">
                                        <Volume2 className="w-4 h-4" />
                                    </span>
                                    <h4 className="font-black text-base text-slate-900">
                                        Rincian & Bacakan Pesanan
                                    </h4>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    🎯 <strong className="text-slate-800">{selectedTable?.id?.startsWith('AREA_') ? selectedTable.name : `Meja ${selectedTable?.name}`}</strong> • Pelayan: <strong className="text-indigo-700">{staff.name}</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center gap-1 active:scale-95"
                            >
                                <X className="w-4 h-4" /> Tutup
                            </button>
                        </div>

                        {/* Read Aloud Prompt Helper */}
                        <div className="mx-4 mt-3 p-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold flex items-center gap-2 shrink-0">
                            <span className="text-sm">🗣️</span>
                            <span>"Mohon izin saya bacakan ulang pesanannya ya Kak:"</span>
                        </div>

                        {/* Scrollable Order Items List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px] max-h-[50vh]">
                            {cart.map(item => (
                                <div
                                    key={item.product.id}
                                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 shadow-xs"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-2.5 flex-1 pr-2">
                                            {/* Item Thumbnail */}
                                            {(() => {
                                                const v = getProductVisual(item.product.name, item.product.category, item.product.imageUrl);
                                                return (
                                                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
                                                        <img src={v.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                                                        <span className="absolute bottom-0 right-0 bg-[#1E2875] text-white px-1 rounded-tl-md text-[9px] font-black">
                                                            {item.qty}x
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                            <div>
                                                <h6 className="font-extrabold text-sm text-slate-800 leading-snug">
                                                    {formatDisplayName(item.product.name)}
                                                </h6>
                                                <span className="text-xs font-black text-[#1E293B]">
                                                    Rp {(item.product.price * item.qty).toLocaleString('id-ID')}
                                                </span>
                                                <span className="text-[10px] text-slate-400 ml-1.5">
                                                    (@ Rp {item.product.price.toLocaleString('id-ID')})
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => deleteFromCart(item.product.id)}
                                            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-white"
                                            title="Hapus menu"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {item.notes ? (
                                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-start gap-1.5">
                                            <span className="shrink-0">📝</span>
                                            <span className="flex-1">Catatan: "{item.notes}"</span>
                                        </div>
                                    ) : null}

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                        <button
                                            onClick={() => {
                                                setSelectedItemForNotes(item);
                                                setModifierNote(item.notes || '');
                                            }}
                                            className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#1E293B] hover:border-[#1E293B] text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                                        >
                                            <MessageSquare className="w-3 h-3 text-[#FF5E14]" />
                                            {item.notes ? 'Ubah Catatan' : '+ Catatan Khusus'}
                                        </button>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => removeFromCart(item.product.id)}
                                                className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-rose-500 flex items-center justify-center font-black text-sm active:scale-90"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="font-black text-sm text-slate-800 w-5 text-center">
                                                {item.qty}
                                            </span>
                                            <button
                                                onClick={() => addToCart(item.product)}
                                                className="w-8 h-8 rounded-xl bg-[#1E293B] text-white flex items-center justify-center font-black text-sm active:scale-90 shadow-xs"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Modal Footer: Total & Submit */}
                        <div className="p-4 pb-8 bg-slate-50 border-t border-slate-100 space-y-3 shrink-0">
                            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-200">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pesanan</span>
                                    <span className="text-xs font-bold text-slate-600">{totalCartCount} Menu Makanan & Minuman</span>
                                </div>
                                <span className="text-lg font-black text-[#0F172A]">
                                    Rp {totalCartAmount.toLocaleString('id-ID')}
                                </span>
                            </div>

                            <div className="flex gap-2.5">
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="flex-1 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Tambah Menu
                                </button>
                                <button
                                    onClick={handleSubmitOrder}
                                    disabled={submitting}
                                    className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5E14] to-amber-500 hover:opacity-95 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-[#FF5E14]/30 cursor-pointer"
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" /> Kirim ke Dapur & Bar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. Modifier / Notes Modal */}
            {selectedItemForNotes && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-100 rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl">
                        <div>
                            <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                                Tambah Catatan Khusus
                            </span>
                            <h5 className="font-black text-sm text-slate-800 mt-0.5">
                                {formatDisplayName(selectedItemForNotes.product.name)}
                            </h5>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold text-slate-400 block mb-1.5">Pilihan Cepat:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {['Less Ice', 'No Sugar', 'Extra Pedas', 'Gelas Dingin', 'Pisah Sambal', 'Hangat', 'Manis Sedang'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setModifierNote(prev => (prev ? `${prev}, ${tag}` : tag))}
                                        className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 hover:border-[#1E293B] hover:text-[#1E293B] active:scale-95 cursor-pointer"
                                    >
                                        + {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            value={modifierNote}
                            onChange={e => setModifierNote(e.target.value)}
                            placeholder="Tulis catatan khusus (misal: kurangi es batu, sambal dipisah)..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E293B] focus:bg-white h-20 resize-none"
                        />

                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => setSelectedItemForNotes(null)}
                                className="flex-1 py-3 rounded-xl bg-slate-100 text-xs font-extrabold text-slate-600 active:scale-95 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={saveNotesToItem}
                                className="flex-1 py-3 rounded-xl bg-[#1E293B] text-white text-xs font-black active:scale-95 shadow-md cursor-pointer"
                            >
                                Simpan Catatan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 8. Active Cafe Sessions Modal */}
            {showActiveSessionsModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-100 rounded-3xl max-w-sm w-full p-4 space-y-3.5 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-[#FF5E14]" />
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                    Tagihan Aktif di Kafe ({activeCafeSessions.length})
                                </h4>
                            </div>
                            <button
                                onClick={() => setShowActiveSessionsModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-[11px] text-slate-500">
                            Pilih tamu di bawah untuk menambahkan pesanan baru ke bill mereka:
                        </p>

                        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                            {activeCafeSessions.length === 0 ? (
                                <div className="text-center py-6 text-slate-400 text-xs">
                                    Tidak ada tagihan aktif di kafe saat ini.
                                </div>
                            ) : (
                                activeCafeSessions.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => handleSelectExistingCafeSession(s)}
                                        className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#1E293B]/60 hover:bg-white cursor-pointer flex items-center justify-between transition-all group active:scale-[0.98]"
                                    >
                                        <div>
                                            <span className="text-xs font-bold text-slate-800 block group-hover:text-[#1E293B]">
                                                {s.customerName || 'Tamu Kafe'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {s.member ? `★ Member: ${s.member.name} (${s.member.tier})` : 'Tamu Non-Member'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-[#0F172A] block">
                                                Rp {s.totalAmount?.toLocaleString('id-ID')}
                                            </span>
                                            <span className="text-[9px] text-[#FF5E14] font-extrabold uppercase">
                                                + Tambah Menu
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
