import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Layers, Sparkles, AlertTriangle, TrendingUp, ShoppingBag, ClipboardCheck, Package, ChevronDown, Check } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';
import StarterPackModal from './components/StarterPackModal';
import WasteLogModal from './components/WasteLogModal';
import RestockModal from './components/RestockModal';
import StockOpnameModal from './components/StockOpnameModal';
import StockOpnameDetailModal from './components/StockOpnameDetailModal';

export default function Inventory() {
    const [products, setProducts] = useState<any[]>([]);
    const [rawMaterials, setRawMaterials] = useState<any[]>([]);
    const [isRecipeSystemEnabled, setIsRecipeSystemEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [formData, setFormData] = useState<any>({ name: '', category: '', price: '', stock: '' });
    const [productTab, setProductTab] = useState<'DETAIL'|'RECIPE'>('DETAIL');
    const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);

    const [stockModal, setStockModal] = useState<{ id: string, name: string, change: number | string, isRaw?: boolean } | null>(null);
    const [filterType, setFilterType] = useState<'ALL' | 'FNB' | 'EQUIPMENT' | 'HISTORY' | 'RAW' | 'WASTE' | 'HPP' | 'OPNAME'>('ALL');
    const [stockLogs, setStockLogs] = useState<any[]>([]);
    const [historySubTab, setHistorySubTab] = useState<'RAW' | 'PRODUCT'>('RAW');
    const [rawHistoryLogs, setRawHistoryLogs] = useState<any[]>([]);
    const [wasteLogs, setWasteLogs] = useState<any[]>([]);
    const [hppSummary, setHppSummary] = useState<any[]>([]);
    const [stockOpnames, setStockOpnames] = useState<any[]>([]);

    const [isStarterPackOpen, setIsStarterPackOpen] = useState(false);
    const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
    const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
    const [selectedOpnameDetail, setSelectedOpnameDetail] = useState<any | null>(null);
    const [restockMaterial, setRestockMaterial] = useState<any | null>(null);

    const [isRawModalOpen, setIsRawModalOpen] = useState(false);
    const [editingRaw, setEditingRaw] = useState<any>(null);
    const [rawFormData, setRawFormData] = useState<any>({ name: '', unit: 'GRAM', costPerUnit: '', minStockAlert: '', currentStock: '', purchaseUnit: '', conversionRatio: 1 });

    // Recipe Detail Modal state
    const [viewRecipeModal, setViewRecipeModal] = useState<any | null>(null);
    const [isMobileCategoryModalOpen, setIsMobileCategoryModalOpen] = useState(false);

    const MODULE_OPTIONS = [
        { id: 'ALL', label: 'All Items (Semua Produk)', shortLabel: 'Semua', group: 'PRODUK', icon: '📦', color: '#ff9900', badgeClass: 'bg-[#ff9900] text-black' },
        { id: 'FNB', label: 'FnB & Snacks (Kafe)', shortLabel: 'FnB / Kafe', group: 'PRODUK', icon: '☕', color: '#ff9900', badgeClass: 'bg-[#ff9900] text-black' },
        { id: 'EQUIPMENT', label: 'Billiard & Equipment', shortLabel: 'Biliar', group: 'PRODUK', icon: '🎱', color: '#ff9900', badgeClass: 'bg-[#ff9900] text-black' },
        { id: 'RAW', label: 'Master Bahan Baku', shortLabel: 'Bahan Baku', group: 'BAHAN', icon: '🗄️', color: '#00aaff', badgeClass: 'bg-[#00aaff] text-black' },
        { id: 'WASTE', label: 'Bahan Rusak / Basi (Loss)', shortLabel: 'Bahan Rusak', group: 'BAHAN', icon: '⚠️', color: '#ff3333', badgeClass: 'bg-[#ff3333] text-white' },
        { id: 'HPP', label: 'HPP & Margin Resep', shortLabel: 'HPP & Margin', group: 'BAHAN', icon: '📈', color: '#00ff66', badgeClass: 'bg-[#00ff66] text-black' },
        { id: 'OPNAME', label: 'Stock Opname', shortLabel: 'Stock Opname', group: 'AUDIT', icon: '📋', color: '#a855f7', badgeClass: 'bg-purple-600 text-white' },
        { id: 'HISTORY', label: 'Riwayat Perubahan Stok', shortLabel: 'Riwayat', group: 'AUDIT', icon: '🕒', color: '#888888', badgeClass: 'bg-gray-700 text-white' },
    ];
    const activeModule = MODULE_OPTIONS.find(m => m.id === filterType) || MODULE_OPTIONS[0];

    // Calculate real-time available portions for a recipe product
    const calculateProductPortions = (product: any) => {
        if (!isRecipeSystemEnabled || !product.recipes || product.recipes.length === 0) {
            return {
                isRecipe: false,
                portions: product.stock || 0,
                bottleneck: null,
                ingredients: []
            };
        }

        let minPortions = Infinity;
        let bottleneckItem: any = null;
        const ingredientsList: any[] = [];

        for (const ing of product.recipes) {
            const raw = rawMaterials.find(r => r.id === ing.rawMaterialId) || ing.rawMaterial;
            const currentStock = raw ? Number(raw.currentStock) || 0 : 0;
            const requiredQty = Number(ing.quantity) || 1;
            const possible = requiredQty > 0 ? Math.floor(currentStock / requiredQty) : 0;

            const ingInfo = {
                id: raw?.id || ing.rawMaterialId,
                name: raw ? raw.name : 'Unknown Raw Material',
                unit: raw ? raw.unit : '',
                currentStock,
                requiredPerPortion: requiredQty,
                possiblePortions: possible,
                costPerUnit: raw ? raw.costPerUnit || 0 : 0
            };

            ingredientsList.push(ingInfo);

            if (possible < minPortions) {
                minPortions = possible;
                bottleneckItem = ingInfo;
            }
        }

        return {
            isRecipe: true,
            portions: minPortions === Infinity ? 0 : Math.max(0, minPortions),
            bottleneck: bottleneckItem,
            ingredients: ingredientsList
        };
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pRes, vRes] = await Promise.all([
                api.get('/products'),
                api.get('/venues')
            ]);
            setProducts(pRes.data.data);
            if (vRes.data.data.length > 0) {
                const activeVenue = vRes.data.data.find((v: any) => v.tables?.length > 0) || vRes.data.data[0];
                setIsRecipeSystemEnabled(activeVenue.isRecipeSystemEnabled ?? true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRawMaterials = async () => {
        try {
            const res = await api.get('/inventory/raw-materials');
            setRawMaterials(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
        fetchRawMaterials();
    }, []);

    const fetchStockLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/products/stock-logs');
            setStockLogs(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRawHistoryLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/inventory/history');
            setRawHistoryLogs(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWasteLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/inventory/waste');
            setWasteLogs(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHppSummary = async () => {
        try {
            setLoading(true);
            const res = await api.get('/inventory/hpp-summary');
            setHppSummary(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStockOpnames = async () => {
        try {
            setLoading(true);
            const res = await api.get('/inventory/stock-opname');
            setStockOpnames(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (filterType === 'HISTORY') {
            fetchStockLogs();
            fetchRawHistoryLogs();
        } else if (filterType === 'WASTE') {
            fetchWasteLogs();
        } else if (filterType === 'HPP') {
            fetchHppSummary();
        } else if (filterType === 'OPNAME') {
            fetchStockOpnames();
        }
    }, [filterType]);

    // Product CRUD
    const handleSaveProduct = async () => {
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, formData);
                if (isRecipeSystemEnabled) {
                    await api.post(`/inventory/products/${editingProduct.id}/recipe`, { ingredients: recipeIngredients });
                }
            } else {
                const res = await api.post('/products', formData);
                if (isRecipeSystemEnabled && res.data?.id) {
                    await api.post(`/inventory/products/${res.data.id}/recipe`, { ingredients: recipeIngredients });
                }
            }
            setIsModalOpen(false);
            setEditingProduct(null);
            fetchData();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to save product');
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!(await vamosConfirm('Are you sure you want to delete this product?'))) return;
        try {
            await api.delete(`/products/${id}`);
            fetchData();
        } catch (err) {
            vamosAlert('Failed to delete product');
        }
    };

    const openProductEdit = async (p: any) => {
        setEditingProduct(p);
        setFormData({ name: p.name, category: p.category, price: p.price, stock: p.stock });
        setProductTab('DETAIL');
        setIsModalOpen(true);
        if (isRecipeSystemEnabled) {
            try {
                const res = await api.get(`/inventory/products/${p.id}/recipe`);
                setRecipeIngredients(res.data || []);
            } catch (e) {
                setRecipeIngredients([]);
            }
        }
    };

    const openProductCreate = () => {
        setEditingProduct(null);
        setFormData({ name: '', category: '', price: '', stock: '' });
        setRecipeIngredients([]);
        setProductTab('DETAIL');
        setIsModalOpen(true);
    };

    // Raw Material CRUD
    const handleSaveRaw = async () => {
        try {
            if (editingRaw) {
                await api.put(`/inventory/raw-materials/${editingRaw.id}`, rawFormData);
            } else {
                await api.post('/inventory/raw-materials', rawFormData);
            }
            setIsRawModalOpen(false);
            setEditingRaw(null);
            fetchRawMaterials();
        } catch (err) {
            vamosAlert('Failed to save raw material');
        }
    };

    const handleDeleteRaw = async (id: string) => {
        if (!(await vamosConfirm('Hapus bahan baku ini?'))) return;
        try {
            await api.delete(`/inventory/raw-materials/${id}`);
            fetchRawMaterials();
        } catch (err) {
            vamosAlert('Failed to delete raw material');
        }
    };

    const openRawEdit = (r: any) => {
        setEditingRaw(r);
        setRawFormData({ 
            name: r.name, 
            unit: r.unit, 
            costPerUnit: r.costPerUnit, 
            minStockAlert: r.minStockAlert, 
            currentStock: r.currentStock,
            purchaseUnit: r.purchaseUnit || '',
            conversionRatio: r.conversionRatio || 1
        });
        setIsRawModalOpen(true);
    };

    const openRawCreate = () => {
        setEditingRaw(null);
        setRawFormData({ 
            name: '', 
            unit: 'GRAM', 
            costPerUnit: '', 
            minStockAlert: '', 
            currentStock: '',
            purchaseUnit: '',
            conversionRatio: 1
        });
        setIsRawModalOpen(true);
    };

    const handleStockUpdate = async () => {
        const changeNum = Number(stockModal?.change) || 0;
        if (!stockModal || changeNum === 0) return;
        try {
            if (stockModal.isRaw) {
                const material = rawMaterials.find(r => r.id === stockModal.id);
                if (!material) return;
                const newStock = material.currentStock + changeNum;
                await api.post(`/inventory/raw-materials/${stockModal.id}/adjust`, { newStock, notes: 'Manual adjustment via Quick Stock' });
                fetchRawMaterials();
            } else {
                await api.patch(`/products/${stockModal.id}/stock`, { stockChange: changeNum });
                fetchData();
            }
            setStockModal(null);
        } catch (err) {
            vamosAlert('Failed to update stock');
        }
    };

    const addRecipeIngredient = () => {
        if (rawMaterials.length === 0) return vamosAlert('Belum ada data Master Bahan Baku!');
        setRecipeIngredients([...recipeIngredients, { rawMaterialId: rawMaterials[0].id, quantity: 1, rawMaterial: rawMaterials[0] }]);
    };

    const removeRecipeIngredient = (index: number) => {
        setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
    };

    const updateRecipeIngredient = (index: number, field: string, value: any) => {
        const newIng = [...recipeIngredients];
        newIng[index][field] = value;
        if (field === 'rawMaterialId') {
            newIng[index].rawMaterial = rawMaterials.find(r => r.id === value);
        }
        setRecipeIngredients(newIng);
    };

    const calculateRecipeCost = () => {
        return recipeIngredients.reduce((total, ing) => {
            const raw = rawMaterials.find(r => r.id === ing.rawMaterialId);
            return total + (raw ? raw.costPerUnit * ing.quantity : 0);
        }, 0);
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        if (filterType === 'FNB') {
            const cat = p.category?.toLowerCase() || '';
            return cat.includes('food') || cat.includes('beverage') || cat.includes('snack') || cat.includes('cigarette');
        }

        if (filterType === 'EQUIPMENT') {
            const cat = p.category?.toLowerCase() || '';
            return cat.includes('billiard') || cat.includes('apparel') || cat.includes('accessory') || cat.includes('equipment');
        }

        return true;
    });

    const filteredRaw = rawMaterials.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="fade-in pb-28 md:pb-8">
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
                {/* Desktop View: Full horizontal filter pills */}
                <div className="hidden md:flex flex-wrap bg-[#141414] border border-[#222222] p-1.5 rounded-2xl gap-1.5 shadow-inner">
                    <button onClick={() => setFilterType('ALL')} className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${filterType === 'ALL' ? 'bg-[#ff9900] text-[#0a0a0a] shadow-[0_2px_10px_rgba(255,153,0,0.2)]' : 'text-gray-400 hover:text-white'}`}>All Items</button>
                    <button onClick={() => setFilterType('FNB')} className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${filterType === 'FNB' ? 'bg-[#ff9900] text-[#0a0a0a] shadow-[0_2px_10px_rgba(255,153,0,0.2)]' : 'text-gray-400 hover:text-white'}`}>FnB & Snacks</button>
                    <button onClick={() => setFilterType('EQUIPMENT')} className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${filterType === 'EQUIPMENT' ? 'bg-[#ff9900] text-[#0a0a0a] shadow-[0_2px_10px_rgba(255,153,0,0.2)]' : 'text-gray-400 hover:text-white'}`}>Billiard & Equipment</button>
                    <button onClick={() => setFilterType('RAW')} className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${filterType === 'RAW' ? 'bg-[#00aaff] text-[#0a0a0a] shadow-[0_2px_10px_rgba(0,170,255,0.25)]' : 'text-[#00aaff]/80 hover:text-[#00aaff]'}`}>
                        <Layers className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"/> Master Bahan Baku
                    </button>
                    <button onClick={() => setFilterType('WASTE')} className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${filterType === 'WASTE' ? 'bg-[#ff3333] text-white shadow-[0_2px_10px_rgba(255,51,51,0.25)]' : 'text-[#ff3333]/80 hover:text-[#ff3333]'}`}>
                        <AlertTriangle className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"/> Bahan Rusak
                    </button>
                    <button onClick={() => setFilterType('HPP')} className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${filterType === 'HPP' ? 'bg-[#00ff66] text-[#0a0a0a] shadow-[0_2px_10px_rgba(0,255,102,0.25)]' : 'text-[#00ff66]/80 hover:text-[#00ff66]'}`}>
                        <TrendingUp className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"/> HPP & Margin
                    </button>
                    <button onClick={() => setFilterType('OPNAME')} className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${filterType === 'OPNAME' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-purple-400/80 hover:text-purple-300'}`}>
                        <ClipboardCheck className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"/> Stock Opname
                    </button>
                    <button onClick={() => setFilterType('HISTORY')} className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${filterType === 'HISTORY' ? 'bg-[#222222] text-white' : 'text-gray-400 hover:text-white'}`}>Riwayat Stok</button>
                </div>

                {/* Mobile View: Zero-Scroll Touch Selector + 4 Quick-Action Chips */}
                <div className="md:hidden space-y-2.5 w-full">
                    {/* Active Module Switcher Card */}
                    <button
                        type="button"
                        onClick={() => setIsMobileCategoryModalOpen(true)}
                        className="w-full bg-[#161616] border-2 border-[#2b2b2b] hover:border-[#ff9900]/50 rounded-2xl p-3 flex items-center justify-between shadow-lg active:scale-[0.99] transition-all"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${activeModule.badgeClass}`}>
                                {activeModule.icon}
                            </div>
                            <div className="min-w-0 text-left">
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Modul Inventaris Aktif</p>
                                <p className="text-sm font-black text-white truncate flex items-center gap-1.5">
                                    {activeModule.label}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 bg-[#222] border border-[#333] px-3 py-1.5 rounded-xl text-xs font-black text-gray-200">
                            <span>Ganti Menu</span>
                            <ChevronDown className="w-3.5 h-3.5 text-[#ff9900]" />
                        </div>
                    </button>

                    {/* 4 Instant Quick-Chips (Zero Scroll Required) */}
                    <div className="grid grid-cols-4 gap-1.5">
                        <button 
                            type="button"
                            onClick={() => setFilterType('ALL')}
                            className={`py-2 px-1 rounded-xl text-xs font-black text-center transition-all ${filterType === 'ALL' ? 'bg-[#ff9900] text-black shadow-md' : 'bg-[#161616] text-gray-400 border border-[#262626]'}`}
                        >
                            📦 Semua
                        </button>
                        <button 
                            type="button"
                            onClick={() => setFilterType('FNB')}
                            className={`py-2 px-1 rounded-xl text-xs font-black text-center transition-all ${filterType === 'FNB' ? 'bg-[#ff9900] text-black shadow-md' : 'bg-[#161616] text-gray-400 border border-[#262626]'}`}
                        >
                            ☕ FnB
                        </button>
                        <button 
                            type="button"
                            onClick={() => setFilterType('RAW')}
                            className={`py-2 px-1 rounded-xl text-xs font-black text-center transition-all ${filterType === 'RAW' ? 'bg-[#00aaff] text-black shadow-md' : 'bg-[#161616] text-[#00aaff]/80 border border-[#262626]'}`}
                        >
                            🗄️ Bahan
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsMobileCategoryModalOpen(true)}
                            className={`py-2 px-1 rounded-xl text-xs font-black text-center transition-all ${['WASTE', 'HPP', 'OPNAME', 'HISTORY', 'EQUIPMENT'].includes(filterType) ? `${activeModule.badgeClass} shadow-md` : 'bg-[#1a1a1a] text-amber-400 border border-amber-500/30'}`}
                        >
                            {['WASTE', 'HPP', 'OPNAME', 'HISTORY', 'EQUIPMENT'].includes(filterType) ? activeModule.shortLabel : 'Lainnya ▾'}
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsStarterPackOpen(true)}
                        className="flex-1 sm:flex-initial justify-center bg-gradient-to-r from-[#00ff66]/10 to-[#00aaff]/10 border border-[#00ff66]/30 hover:border-[#00ff66] text-[#00ff66] px-4 py-3 rounded-xl font-bold flex items-center transition-all shadow-[0_0_15px_rgba(0,255,102,0.1)] text-xs active:scale-95"
                        title="Import Preset Bahan Baku & Resep Biliar-Cafe (1-Click)"
                    >
                        <Sparkles className="w-4 h-4 mr-1.5 text-[#00ff66]" /> Starter Pack Cafe
                    </button>

                    <button
                        onClick={
                            filterType === 'RAW' ? openRawCreate : 
                            filterType === 'WASTE' ? () => setIsWasteModalOpen(true) : 
                            filterType === 'OPNAME' ? () => setIsOpnameModalOpen(true) : 
                            openProductCreate
                        }
                        className={`flex-1 sm:flex-initial justify-center ${filterType === 'OPNAME' ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-[#00ff66] text-[#0a0a0a] hover:bg-[#00e65c] shadow-[0_0_15px_rgba(0,255,102,0.2)]'} px-5 py-3 rounded-xl font-black flex items-center transition-all text-xs active:scale-95`}
                    >
                        {filterType === 'OPNAME' ? <ClipboardCheck className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                        {filterType === 'RAW' ? 'Tambah Bahan' : filterType === 'WASTE' ? 'Catat Bahan Rusak' : filterType === 'OPNAME' ? 'Mulai Stock Opname' : 'Tambah Produk'}
                    </button>
                </div>
            </div>

            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or category..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#ff9900] transition-colors"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-gray-500 py-10">Loading...</div>
                ) : filterType === 'RAW' ? (
                    <>
                    {/* Desktop View (Table) */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#222222] text-xs uppercase tracking-wider text-gray-500">
                                    <th className="pb-4 font-semibold">Nama Bahan</th>
                                    <th className="pb-4 font-semibold text-center">Satuan Resep</th>
                                    <th className="pb-4 font-semibold text-center">Satuan Kulakan</th>
                                    <th className="pb-4 font-semibold text-right">Modal/Satuan (Rp)</th>
                                    <th className="pb-4 font-semibold text-center">Stok Saat Ini</th>
                                    <th className="pb-4 font-semibold text-center">Aksi Cepat</th>
                                    <th className="pb-4 font-semibold text-right">Pengaturan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRaw.map(r => (
                                    <tr key={r.id} className="border-b border-[#222222] hover:bg-white/5 transition-colors group">
                                        <td className="py-4 font-bold text-sm text-[#00aaff]">{r.name}</td>
                                        <td className="py-4 text-center">
                                            <span className="text-[10px] px-2 py-1 rounded bg-white/5 border border-[#222222] font-semibold text-gray-400">{r.unit}</span>
                                        </td>
                                        <td className="py-4 text-center">
                                            {r.purchaseUnit ? (
                                                <span className="text-[10px] px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 font-semibold text-blue-400">
                                                    {r.purchaseUnit} (x{r.conversionRatio || 1})
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-gray-600 italic">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 text-right font-mono font-bold text-gray-300">
                                            Rp {Number(r.costPerUnit || 0).toLocaleString()}
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className={`font-bold font-mono px-3 py-1 rounded-full text-xs ${r.currentStock <= r.minStockAlert ? 'bg-[#ff3333]/20 text-[#ff3333]' : 'bg-[#00ff66]/10 text-[#00ff66]'}`}>
                                                {Number(r.currentStock).toLocaleString()} {r.unit}
                                            </span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button 
                                                    onClick={() => setRestockMaterial(r)} 
                                                    className="text-xs bg-[#00aaff]/15 hover:bg-[#00aaff] text-[#00aaff] hover:text-white border border-[#00aaff]/30 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,170,255,0.15)]"
                                                    title="Kulakan dalam satuan kemasan faktur"
                                                >
                                                    <ShoppingBag className="w-3.5 h-3.5" />
                                                    Kulakan
                                                </button>
                                                <button 
                                                    onClick={() => setStockModal({ id: r.id, name: r.name, change: 0, isRaw: true })} 
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-[#141414] border border-[#222222] hover:border-[#ff9900] text-[#ff9900] px-2.5 py-1.5 rounded-lg font-bold"
                                                    title="Penyesuaian stok langsung"
                                                >
                                                    Adjust
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openRawEdit(r)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Edit Master Bahan"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteRaw(r.id)} className="p-2 hover:bg-[#ff3333]/20 rounded-lg text-gray-400 hover:text-[#ff3333] transition-colors" title="Hapus Bahan"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRaw.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-10 text-gray-500 italic">Data bahan baku kosong.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View (Touch-Friendly Bahan Baku Cards) */}
                    <div className="md:hidden space-y-3.5">
                        {filteredRaw.map(r => (
                            <div key={r.id} className="bg-[#111] border border-[#222] rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-extrabold text-base text-[#00aaff]">{r.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-[#333] font-semibold text-gray-300">
                                                Satuan: {r.unit}
                                            </span>
                                            {r.purchaseUnit && (
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 font-semibold text-blue-400">
                                                    Beli: {r.purchaseUnit} (x{r.conversionRatio || 1})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Modal Satuan</span>
                                        <span className="text-sm font-black font-mono text-gray-200">
                                            Rp {Number(r.costPerUnit || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Stock & Action Buttons */}
                                <div className="bg-[#161616] p-3 rounded-xl border border-[#222] flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Sisa Stok</span>
                                        <span className={`font-mono font-black text-base ${r.currentStock <= r.minStockAlert ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {Number(r.currentStock).toLocaleString()} {r.unit}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setRestockMaterial(r)}
                                            className="text-xs bg-[#00aaff]/15 hover:bg-[#00aaff] text-[#00aaff] hover:text-white border border-[#00aaff]/30 px-3.5 py-2 rounded-xl font-black flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,170,255,0.15)] active:scale-95"
                                        >
                                            <ShoppingBag className="w-3.5 h-3.5" /> Kulakan
                                        </button>
                                        <button
                                            onClick={() => setStockModal({ id: r.id, name: r.name, change: 0, isRaw: true })}
                                            className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black px-3.5 py-2 rounded-xl font-black transition-all active:scale-95"
                                        >
                                            Adjust
                                        </button>
                                    </div>
                                </div>

                                {/* Footer actions */}
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e1e1e]">
                                    <button onClick={() => openRawEdit(r)} className="px-3.5 py-1.5 rounded-lg border border-[#333] text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1 active:scale-95">
                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button onClick={() => handleDeleteRaw(r.id)} className="px-3.5 py-1.5 rounded-lg border border-[#333] text-red-400 hover:bg-red-500/10 text-xs font-bold flex items-center gap-1 active:scale-95">
                                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredRaw.length === 0 && (
                            <div className="text-center py-10 text-gray-500 italic bg-[#111] rounded-2xl border border-[#222]">Data bahan baku kosong.</div>
                        )}
                    </div>
                    </>
                ) : filterType === 'HISTORY' ? (
                    <div>
                        <div className="flex items-center gap-2 mb-5 bg-[#0a0a0a] p-1.5 rounded-xl border border-[#222222] w-fit">
                            <button
                                onClick={() => setHistorySubTab('RAW')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                    historySubTab === 'RAW'
                                        ? 'bg-[#00aaff] text-black shadow-[0_0_12px_rgba(0,170,255,0.3)]'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Layers className="w-3.5 h-3.5" />
                                Bahan Baku (Resep Otomatis)
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${historySubTab === 'RAW' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'}`}>
                                    {rawHistoryLogs.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setHistorySubTab('PRODUCT')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                    historySubTab === 'PRODUCT'
                                        ? 'bg-[#ff9900] text-black shadow-[0_0_12px_rgba(255,153,0,0.3)]'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Package className="w-3.5 h-3.5" />
                                Produk Jadi (Menu Langsung)
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${historySubTab === 'PRODUCT' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'}`}>
                                    {stockLogs.length}
                                </span>
                            </button>
                        </div>

                        {historySubTab === 'RAW' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-[#222222] text-xs uppercase tracking-wider text-gray-500">
                                            <th className="pb-4 font-semibold">Waktu</th>
                                            <th className="pb-4 font-semibold">Nama Bahan Baku</th>
                                            <th className="pb-4 font-semibold text-center">Tipe</th>
                                            <th className="pb-4 font-semibold text-center">Jumlah Potongan</th>
                                            <th className="pb-4 font-semibold text-center">Stok Sblm</th>
                                            <th className="pb-4 font-semibold text-center">Stok Sisa</th>
                                            <th className="pb-4 font-semibold">Keterangan / Order Terkait</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rawHistoryLogs
                                            .filter(log =>
                                                log.rawMaterial?.name?.toLowerCase().includes(search.toLowerCase()) ||
                                                log.notes?.toLowerCase().includes(search.toLowerCase())
                                            )
                                            .map(log => {
                                                const unit = log.rawMaterial?.unit || '';
                                                const isNegative = log.quantity < 0 || log.type === 'OUT' || log.type === 'SPOILAGE';
                                                const qtyDisplay = log.quantity > 0 ? `+${log.quantity}` : log.quantity;
                                                return (
                                                    <tr key={log.id} className="border-b border-[#222222] hover:bg-white/5 transition-colors">
                                                        <td className="py-4 text-xs font-mono text-gray-400">{new Date(log.createdAt).toLocaleString('id-ID')}</td>
                                                        <td className="py-4 font-bold text-sm text-[#00aaff]">{log.rawMaterial?.name || 'Bahan Baku'}</td>
                                                        <td className="py-4 text-center">
                                                            <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest border ${
                                                                log.type === 'IN' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                log.type === 'OUT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                log.type === 'SPOILAGE' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                            }`}>{log.type}</span>
                                                        </td>
                                                        <td className={`py-4 text-center font-bold font-mono ${isNegative ? 'text-[#ff3333]' : 'text-[#00ff66]'}`}>
                                                            {qtyDisplay} {unit}
                                                        </td>
                                                        <td className="py-4 text-center font-mono text-gray-500">{Number(log.previousStock).toLocaleString()} {unit}</td>
                                                        <td className="py-4 text-center font-mono font-bold text-white">{Number(log.newStock).toLocaleString()} {unit}</td>
                                                        <td className="py-4 text-xs text-gray-300 max-w-sm truncate" title={log.notes || '-'}>
                                                            {log.notes || '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        {rawHistoryLogs.length === 0 && (
                                            <tr><td colSpan={7} className="text-center py-10 text-gray-500 italic">Belum ada riwayat potongan bahan baku.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-[#222222] text-xs uppercase tracking-wider text-gray-500">
                                            <th className="pb-4 font-semibold">Waktu</th>
                                            <th className="pb-4 font-semibold">Item</th>
                                            <th className="pb-4 font-semibold text-center">Tipe</th>
                                            <th className="pb-4 font-semibold text-center">Jumlah</th>
                                            <th className="pb-4 font-semibold text-center">Stok Sblm</th>
                                            <th className="pb-4 font-semibold text-center">Stok Akhir</th>
                                            <th className="pb-4 font-semibold">Catatan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stockLogs.filter(log => log.product?.name?.toLowerCase().includes(search.toLowerCase())).map(log => (
                                            <tr key={log.id} className="border-b border-[#222222] hover:bg-white/5 transition-colors">
                                                <td className="py-4 text-xs font-mono text-gray-400">{new Date(log.createdAt).toLocaleString('id-ID')}</td>
                                                <td className="py-4 font-bold text-sm text-white">{log.product?.name}</td>
                                                <td className="py-4 text-center">
                                                    <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest border ${log.type === 'INITIAL' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : log.type === 'SALE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : log.type === 'RETURN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{log.type}</span>
                                                </td>
                                                <td className={`py-4 text-center font-bold font-mono ${log.quantity > 0 ? 'text-[#00ff66]' : 'text-[#ff3333]'}`}>{log.quantity > 0 ? `+${log.quantity}` : log.quantity}</td>
                                                <td className="py-4 text-center font-mono text-gray-500">{log.previousStock}</td>
                                                <td className="py-4 text-center font-mono font-bold text-white">{log.newStock}</td>
                                                <td className="py-4 text-xs text-gray-500 italic max-w-xs truncate">{log.notes || '-'}</td>
                                            </tr>
                                        ))}
                                        {stockLogs.length === 0 && (
                                            <tr><td colSpan={7} className="text-center py-10 text-gray-500 italic">Belum ada riwayat stok produk.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : filterType === 'WASTE' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#222222] text-xs uppercase tracking-wider text-gray-500">
                                    <th className="pb-4 font-semibold">Waktu Pencatatan</th>
                                    <th className="pb-4 font-semibold">Nama Bahan Baku</th>
                                    <th className="pb-4 font-semibold text-center">Jumlah Rusak</th>
                                    <th className="pb-4 font-semibold text-center">Alasan</th>
                                    <th className="pb-4 font-semibold text-right">Kerugian (Rp)</th>
                                    <th className="pb-4 font-semibold text-center">Dicatat Oleh</th>
                                    <th className="pb-4 font-semibold">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wasteLogs.filter(w => w.rawMaterial?.name?.toLowerCase().includes(search.toLowerCase()) || w.reason?.toLowerCase().includes(search.toLowerCase())).map(w => (
                                    <tr key={w.id} className="border-b border-[#222222] hover:bg-white/5 transition-colors">
                                        <td className="py-4 text-xs font-mono text-gray-400">{new Date(w.createdAt).toLocaleString('id-ID')}</td>
                                        <td className="py-4 font-bold text-sm text-white">{w.rawMaterial?.name}</td>
                                        <td className="py-4 text-center font-bold font-mono text-[#ff3333]">
                                            -{w.quantity} {w.rawMaterial?.unit}
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest border ${
                                                w.reason === 'EXPIRED' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                                                w.reason === 'SPOILED' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                                                w.reason === 'SPILL' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                                                'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                            }`}>
                                                {w.reason === 'EXPIRED' ? 'KADALUARSA' : w.reason === 'SPOILED' ? 'BASI / RUSAK' : w.reason === 'SPILL' ? 'TUMPAH / PECAH' : w.reason}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right font-mono font-bold text-[#ff5555]">
                                            Rp {Math.round(w.costLoss || 0).toLocaleString()}
                                        </td>
                                        <td className="py-4 text-center text-xs font-medium text-gray-300">{w.recordedBy || '-'}</td>
                                        <td className="py-4 text-xs text-gray-500 italic max-w-xs truncate">{w.notes || '-'}</td>
                                    </tr>
                                ))}
                                {wasteLogs.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-10 text-gray-500 italic">Belum ada pencatatan bahan rusak / basi.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : filterType === 'HPP' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#222222] text-xs uppercase tracking-wider text-gray-500">
                                    <th className="pb-4 font-semibold">Nama Menu</th>
                                    <th className="pb-4 font-semibold">Kategori</th>
                                    <th className="pb-4 font-semibold text-right">Harga Jual (Rp)</th>
                                    <th className="pb-4 font-semibold text-right">Estimasi HPP (Rp)</th>
                                    <th className="pb-4 font-semibold text-right">Gross Profit (Rp)</th>
                                    <th className="pb-4 font-semibold text-center">Margin (%)</th>
                                    <th className="pb-4 font-semibold">Komposisi Resep</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hppSummary.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.category?.toLowerCase().includes(search.toLowerCase())).map(h => (
                                    <tr key={h.id} className="border-b border-[#222222] hover:bg-white/5 transition-colors">
                                        <td className="py-4 font-bold text-sm text-white">{h.name}</td>
                                        <td className="py-4"><span className="text-[10px] px-2 py-1 rounded bg-white/5 border border-[#222222] text-gray-400 font-semibold">{h.category || '-'}</span></td>
                                        <td className="py-4 text-right font-mono font-bold text-gray-200">Rp {h.sellingPrice.toLocaleString()}</td>
                                        <td className="py-4 text-right font-mono font-bold text-[#ff9900]">Rp {h.hpp.toLocaleString()}</td>
                                        <td className="py-4 text-right font-mono font-bold text-[#00ff66]">Rp {h.grossProfit.toLocaleString()}</td>
                                        <td className="py-4 text-center">
                                            <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full border ${
                                                h.marginPercent >= 60 ? 'bg-[#00ff66]/15 text-[#00ff66] border-[#00ff66]/30' :
                                                h.marginPercent >= 40 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                                                'bg-red-500/15 text-red-400 border-red-500/30'
                                            }`}>
                                                {h.marginPercent}%
                                            </span>
                                        </td>
                                        <td className="py-4 text-xs text-gray-400">
                                            {h.ingredients && h.ingredients.length > 0 ? (
                                                <div className="flex flex-wrap gap-1 max-w-sm">
                                                    {h.ingredients.map((ing: any, idx: number) => (
                                                        <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e1e] border border-[#2a2a2a] text-gray-300">
                                                            {ing.name} ({ing.quantity}{ing.unit})
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-gray-600 italic">Belum ada resep</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {hppSummary.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-10 text-gray-500 italic">Data HPP belum tersedia.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : filterType === 'OPNAME' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#222222] text-xs uppercase tracking-wider text-gray-500">
                                    <th className="pb-4 font-semibold">No. Opname</th>
                                    <th className="pb-4 font-semibold">Waktu Audit</th>
                                    <th className="pb-4 font-semibold">Petugas Auditor</th>
                                    <th className="pb-4 font-semibold text-center">Bahan Diperiksa</th>
                                    <th className="pb-4 font-semibold text-right">Nilai Selisih (Rp)</th>
                                    <th className="pb-4 font-semibold text-center">Status</th>
                                    <th className="pb-4 font-semibold">Catatan</th>
                                    <th className="pb-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockOpnames.map(op => {
                                    const isMinus = op.totalVarianceCost < 0;
                                    return (
                                        <tr key={op.id} className="border-b border-[#222222] hover:bg-white/5 transition-colors">
                                            <td className="py-4 font-mono font-bold text-sm text-purple-400">#{op.opnameNumber}</td>
                                            <td className="py-4 text-xs font-mono text-gray-400">{new Date(op.date).toLocaleString('id-ID')}</td>
                                            <td className="py-4 font-medium text-sm text-white">{op.conductedBy || '-'}</td>
                                            <td className="py-4 text-center font-mono font-bold text-gray-300">{op.items?.length || 0} Item</td>
                                            <td className="py-4 text-right font-mono font-bold">
                                                {op.totalVarianceCost === 0 ? (
                                                    <span className="text-[#00ff66]">Rp 0 (Pas)</span>
                                                ) : (
                                                    <span className={isMinus ? 'text-red-400' : 'text-blue-400'}>
                                                        {isMinus ? '-' : '+'}Rp {Math.abs(Math.round(op.totalVarianceCost)).toLocaleString()}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20">
                                                    {op.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-xs text-gray-400 italic max-w-xs truncate">{op.notes || '-'}</td>
                                            <td className="py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedOpnameDetail(op)}
                                                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg font-bold transition-colors"
                                                >
                                                    Lihat Rincian
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {stockOpnames.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-gray-500 italic">
                                            Belum ada riwayat audit Stock Opname fisik. Klik "Mulai Stock Opname" untuk melakukan audit pertama.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <>
                    {/* Desktop View (Table) */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#222222] text-xs uppercase tracking-wider text-gray-500">
                                    <th className="pb-4 font-semibold">Item Name</th>
                                    <th className="pb-4 font-semibold">Category</th>
                                    <th className="pb-4 font-semibold text-right">Price (Rp)</th>
                                    <th className="pb-4 font-semibold text-center">Current Stock</th>
                                    <th className="pb-4 font-semibold text-center">Quick Stock</th>
                                    <th className="pb-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => {
                                    const portionData = calculateProductPortions(p);
                                    const isRecipeItem = portionData.isRecipe;
                                    const currentPortions = portionData.portions;
                                    const isOutOfStock = currentPortions <= 0;
                                    const isLowStock = currentPortions > 0 && currentPortions <= 5;

                                    return (
                                        <tr key={p.id} className="border-b border-[#222222] hover:bg-white/5 transition-colors group">
                                            <td className="py-4">
                                                <p className="font-bold text-sm text-white flex items-center flex-wrap gap-1.5">
                                                    {p.name}
                                                    {isRecipeItem && (
                                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase">Resep</span>
                                                    )}
                                                </p>
                                                {isRecipeItem && isOutOfStock && portionData.bottleneck && (
                                                    <p className="text-[10px] text-red-400 font-medium mt-0.5">
                                                        ⚠️ Habis: {portionData.bottleneck.name} (0 {portionData.bottleneck.unit})
                                                    </p>
                                                )}
                                                {isRecipeItem && !isOutOfStock && portionData.bottleneck && (
                                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                                        Dibatasi: {portionData.bottleneck.name} (Sisa {portionData.bottleneck.currentStock} {portionData.bottleneck.unit})
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-4"><span className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-[#222222] font-semibold text-gray-400">{p.category || 'Uncategorized'}</span></td>
                                            <td className="py-4 text-right"><span className="font-mono font-bold text-[#ff9900]">{p.price.toLocaleString()}</span></td>
                                            <td className="py-4 text-center">
                                                {isRecipeItem ? (
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className={`font-bold font-mono px-3 py-1 rounded-full text-xs ${
                                                            isOutOfStock 
                                                                ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                                                                : isLowStock 
                                                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' 
                                                                    : 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30'
                                                        }`}>
                                                            {currentPortions} Porsi
                                                        </span>
                                                        <span className="text-[8px] text-orange-400/80 font-bold uppercase tracking-tight mt-0.5">
                                                            Otomatis Resep
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className={`font-bold font-mono px-3 py-1 rounded-full text-xs ${p.stock <= 5 ? 'bg-[#ff3333]/20 text-[#ff3333]' : 'bg-[#00ff66]/10 text-[#00ff66]'}`}>
                                                        {p.stock}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 text-center">
                                                {isRecipeItem ? (
                                                    <button 
                                                        onClick={() => setViewRecipeModal({ product: p, portionData })}
                                                        className="text-xs bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500 hover:text-white text-orange-400 px-3 py-1.5 rounded-lg font-bold transition-colors"
                                                        title="Lihat rincian bahan & restock"
                                                    >
                                                        🔍 Rincian Resep
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => setStockModal({ id: p.id, name: p.name, change: 0 })} 
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-[#141414] border border-[#222222] hover:border-[#00aaff] text-[#00aaff] px-3 py-1 rounded-lg font-bold"
                                                    >
                                                        Manage
                                                    </button>
                                                )}
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openProductEdit(p)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2 hover:bg-[#ff3333]/20 rounded-lg text-gray-400 hover:text-[#ff3333] transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredProducts.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-500 italic">No products found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View (Touch-Friendly Product & Recipe Cards) */}
                    <div className="md:hidden space-y-3.5">
                        {filteredProducts.map(p => {
                            const portionData = calculateProductPortions(p);
                            const isRecipeItem = portionData.isRecipe;
                            const currentPortions = portionData.portions;
                            const isOutOfStock = currentPortions <= 0;
                            const isLowStock = currentPortions > 0 && currentPortions <= 5;

                            return (
                                <div key={p.id} className="bg-[#111] border border-[#222] rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-extrabold text-base text-white truncate">{p.name}</h4>
                                                {isRecipeItem && (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/40 uppercase">
                                                        Resep
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-[#333] font-semibold text-gray-400 inline-block mt-1">
                                                {p.category || 'Uncategorized'}
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Harga Jual</span>
                                            <span className="text-base font-black font-mono text-[#ff9900]">
                                                Rp {p.price.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stock & Touch-friendly Adjustment */}
                                    <div className="bg-[#161616] p-3 rounded-xl border border-[#222] space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">
                                                {isRecipeItem ? 'Kapasitas Porsi Sedia' : 'Sisa Stok'}
                                            </span>
                                            {isRecipeItem ? (
                                                <span className={`font-black font-mono px-3 py-1 rounded-full text-xs ${
                                                    isOutOfStock 
                                                        ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                                                        : isLowStock 
                                                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' 
                                                            : 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30'
                                                }`}>
                                                    {currentPortions} Porsi
                                                </span>
                                            ) : (
                                                <span className={`font-black font-mono px-3 py-1 rounded-full text-xs ${p.stock <= 5 ? 'bg-[#ff3333]/20 text-[#ff3333]' : 'bg-[#00ff66]/10 text-[#00ff66]'}`}>
                                                    {p.stock} Pcs
                                                </span>
                                            )}
                                        </div>

                                        {isRecipeItem && portionData.bottleneck && (
                                            <p className="text-[11px] text-orange-400/90 font-medium">
                                                {isOutOfStock ? '⚠️ Habis: ' : 'ℹ️ Dibatasi: '} {portionData.bottleneck.name} (Sisa {portionData.bottleneck.currentStock} {portionData.bottleneck.unit})
                                            </p>
                                        )}

                                        {isRecipeItem ? (
                                            <button 
                                                onClick={() => setViewRecipeModal({ product: p, portionData })}
                                                className="w-full py-2.5 rounded-xl text-xs font-black bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                                            >
                                                🔍 Lihat Rincian Bahan & Resep
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => setStockModal({ id: p.id, name: p.name, change: 0 })} 
                                                className="w-full py-2.5 rounded-xl text-xs font-black bg-[#00aaff]/10 border border-[#00aaff]/30 text-[#00aaff] hover:bg-[#00aaff] hover:text-white transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                                            >
                                                ⚡ Catat / Sesuaikan Stok Produk
                                            </button>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#1e1e1e]">
                                        <button onClick={() => openProductEdit(p)} className="px-3.5 py-1.5 rounded-lg border border-[#333] text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1 active:scale-95">
                                            <Edit2 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button onClick={() => handleDeleteProduct(p.id)} className="px-3.5 py-1.5 rounded-lg border border-[#333] text-red-400 hover:bg-red-500/10 text-xs font-bold flex items-center gap-1 active:scale-95">
                                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-10 text-gray-500 italic bg-[#111] rounded-2xl border border-[#222]">Tidak ada produk ditemukan.</div>
                        )}
                    </div>
                    </>
                )}
            </div>

            {/* Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-[#222222] flex justify-between items-center bg-[#0a0a0a]">
                            <h2 className="text-lg font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
                        </div>

                        {isRecipeSystemEnabled && (
                            <div className="flex border-b border-[#222222] bg-[#0f0f0f]">
                                <button onClick={() => setProductTab('DETAIL')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${productTab === 'DETAIL' ? 'text-[#ff9900] border-b-2 border-[#ff9900]' : 'text-gray-500 hover:text-gray-300'}`}>Detail Produk</button>
                                <button onClick={() => setProductTab('RECIPE')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${productTab === 'RECIPE' ? 'text-[#00aaff] border-b-2 border-[#00aaff]' : 'text-gray-500 hover:text-gray-300'}`}>Resep & Komposisi</button>
                            </div>
                        )}

                        <div className="p-6 overflow-y-auto flex-1">
                            {productTab === 'DETAIL' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Product Name</label>
                                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff9900]" placeholder="e.g. Mie Goreng Telur" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                                        <input type="text" list="category-options" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff9900]" placeholder="e.g. Food, Apparel, Accessory..." />
                                        <datalist id="category-options">
                                            <option value="Food (Makanan)" />
                                            <option value="Beverage (Minuman)" />
                                            <option value="Snack (Cemilan)" />
                                            <option value="Cigarette (Rokok)" />
                                            <option value="Apparel (Kaos, Jersey)" />
                                            <option value="Billiard Equipment (Sarung Tangan, dll)" />
                                        </datalist>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Price (Rp)</label>
                                            <input type="text" value={formData.price ? formData.price.toLocaleString('id-ID') : ''} onChange={e => setFormData({ ...formData, price: parseInt(e.target.value.replace(/\D/g, '')) || '' })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff9900] font-mono" placeholder="Rp 0" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Initial Stock</label>
                                            <input type="text" disabled={!!editingProduct} value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value.replace(/\D/g, '')) || '' })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff9900] font-mono disabled:opacity-50" placeholder="0" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-bold text-gray-300">Daftar Bahan Baku</h3>
                                        <button onClick={addRecipeIngredient} className="text-xs bg-[#00aaff]/10 text-[#00aaff] px-3 py-1.5 rounded hover:bg-[#00aaff] hover:text-white transition-colors font-bold">+ Tambah Bahan</button>
                                    </div>
                                    {recipeIngredients.map((ing, i) => (
                                        <div key={i} className="flex gap-2 items-center bg-[#0a0a0a] border border-[#222222] p-2 rounded-lg">
                                            <select value={ing.rawMaterialId} onChange={e => updateRecipeIngredient(i, 'rawMaterialId', e.target.value)} className="flex-1 bg-transparent text-sm focus:outline-none text-white border-r border-[#222222] pr-2">
                                                {rawMaterials.map(r => <option key={r.id} value={r.id} className="bg-[#141414]">{r.name}</option>)}
                                            </select>
                                            <input type="number" min="0" step="0.1" value={ing.quantity} onChange={e => updateRecipeIngredient(i, 'quantity', Number(e.target.value))} className="w-20 bg-transparent text-sm font-mono text-center focus:outline-none" placeholder="Qty" />
                                            <span className="text-[10px] font-bold text-gray-500 w-12">{ing.rawMaterial?.unit || ''}</span>
                                            <button onClick={() => removeRecipeIngredient(i)} className="p-1 text-red-500/50 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                    {recipeIngredients.length === 0 && (
                                        <div className="text-center py-6 text-gray-500 text-xs italic border border-dashed border-[#222222] rounded-lg">Produk ini tidak menggunakan sistem resep.</div>
                                    )}
                                    <div className="mt-6 pt-4 border-t border-[#222222] flex justify-between items-center">
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Estimasi Modal (HPP)</p>
                                        <p className="text-lg font-bold font-mono text-[#ff9900]">Rp {calculateRecipeCost().toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-[#222222] flex space-x-3 bg-[#0a0a0a]">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl bg-transparent border border-[#222222] text-white font-semibold">Cancel</button>
                            <button onClick={handleSaveProduct} disabled={!formData.name} className="flex-1 py-3 rounded-xl bg-[#ff9900] text-[#0a0a0a] font-bold hover:bg-[#ffaa33] disabled:opacity-50">Save Product</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Raw Material Modal */}
            {isRawModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="p-4 border-b border-[#222222] bg-[#0a0a0a] flex justify-between items-center">
                            <h2 className="text-lg font-bold text-[#00aaff]">{editingRaw ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</h2>
                            <button onClick={() => setIsRawModalOpen(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Bahan</label>
                                <input type="text" value={rawFormData.name} onChange={e => setRawFormData({ ...rawFormData, name: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00aaff]" placeholder="Contoh: Kopi Bubuk Arabica" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Satuan</label>
                                    <select value={rawFormData.unit} onChange={e => setRawFormData({ ...rawFormData, unit: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00aaff] text-white">
                                        <option value="GRAM">Gram (g)</option>
                                        <option value="MILLILITER">Milliliter (ml)</option>
                                        <option value="PIECES">Pieces (pcs)</option>
                                        <option value="PACK">Pack</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Stok Awal</label>
                                    <input type="number" disabled={!!editingRaw} value={rawFormData.currentStock} onChange={e => setRawFormData({ ...rawFormData, currentStock: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 text-sm font-mono disabled:opacity-50 focus:outline-none focus:border-[#00aaff]" placeholder="0" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Modal Per Satuan</label>
                                    <input type="number" value={rawFormData.costPerUnit} onChange={e => setRawFormData({ ...rawFormData, costPerUnit: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#00aaff]" placeholder="Rp 0" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Batas Min. Alert</label>
                                    <input type="number" value={rawFormData.minStockAlert} onChange={e => setRawFormData({ ...rawFormData, minStockAlert: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#00aaff]" placeholder="0" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Satuan Kulakan (Faktur)</label>
                                    <input type="text" value={rawFormData.purchaseUnit || ''} onChange={e => setRawFormData({ ...rawFormData, purchaseUnit: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00aaff]" placeholder="Contoh: Dus 12L / Pack 1Kg" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Rasio Konversi ke {rawFormData.unit}</label>
                                    <input type="number" min="1" step="any" value={rawFormData.conversionRatio || 1} onChange={e => setRawFormData({ ...rawFormData, conversionRatio: Number(e.target.value) })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#00aaff]" placeholder="1" />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-500 italic mt-2">* Modal dihitung per Satuan Resep (Misal: per Gram). Rasio konversi memudahkan kulakan dalam satuan besar (misal 1 Dus = 12000 ml).</p>
                        </div>
                        <div className="p-4 border-t border-[#222222] flex space-x-3 bg-[#0a0a0a]">
                            <button onClick={() => setIsRawModalOpen(false)} className="flex-1 py-3 rounded-xl bg-transparent border border-[#222222] text-white font-semibold">Batal</button>
                            <button onClick={handleSaveRaw} disabled={!rawFormData.name} className="flex-1 py-3 rounded-xl bg-[#00aaff] text-white font-bold hover:bg-[#0099ee] disabled:opacity-50">Simpan Bahan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stock Modal */}
            {stockModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="p-6 border-b border-[#222222] text-center">
                            <h2 className="text-xl font-bold">Manajemen Stok</h2>
                            <p className="text-sm text-gray-400 mt-1">{stockModal.name}</p>
                        </div>
                        <div className="p-6">
                            <div className="bg-[#0a0a0a] border border-[#222222] p-4 rounded-xl">
                                <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest text-center">Jumlah Penyesuaian</label>
                                <input
                                    type="number"
                                    value={stockModal.change}
                                    onChange={(e) => setStockModal({ ...stockModal, change: e.target.value })}
                                    className="w-full text-center bg-[#141414] border border-[#222222] rounded-lg px-4 py-3 text-2xl font-mono font-bold focus:outline-none focus:border-[#00aaff] transition-colors"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-400 mt-3 text-center">Positif (+): Masuk | Negatif (-): Keluar/Opname</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#222222] flex space-x-3">
                            <button onClick={() => setStockModal(null)} className="flex-1 py-3 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white font-semibold">Batal</button>
                            <button onClick={handleStockUpdate} disabled={Number(stockModal.change) === 0 || !stockModal.change} className="flex-1 py-3 rounded-xl bg-[#00aaff] text-white font-bold hover:bg-[#0099ee] disabled:opacity-50">Terapkan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recipe Breakdown & Composition Modal */}
            {viewRecipeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-orange-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_60px_rgba(249,115,22,0.25)] flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-[#222222] bg-[#0a0a0a] flex justify-between items-center">
                            <div>
                                <h2 className="text-base font-bold text-white flex items-center gap-2">
                                    <span>🧪 Rincian Resep:</span>
                                    <span className="text-orange-400">{viewRecipeModal.product.name}</span>
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Kapasitas Porsi Real-Time: <b className="text-green-400">{viewRecipeModal.portionData.portions} Porsi Tersedia</b>
                                </p>
                            </div>
                            <button onClick={() => setViewRecipeModal(null)} className="text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-3">
                            <div className="bg-black/40 border border-[#222222] rounded-xl p-3 text-xs text-gray-400">
                                💡 <b className="text-gray-200">Info Sistem Resep:</b> Stok menu ini dihitung otomatis dari sisa bahan baku terkecil. Untuk menambah porsi menu ini, silakan restock bahan baku yang bersangkutan di bawah ini.
                            </div>

                            <div className="space-y-2">
                                {viewRecipeModal.portionData.ingredients.map((ing: any, i: number) => {
                                    const isLimiting = viewRecipeModal.portionData.bottleneck?.id === ing.id;
                                    const isZero = ing.currentStock <= 0;

                                    return (
                                        <div key={i} className={`p-3 rounded-xl border flex items-center justify-between ${
                                            isZero 
                                                ? 'bg-red-500/10 border-red-500/30' 
                                                : isLimiting 
                                                    ? 'bg-yellow-500/10 border-yellow-500/30' 
                                                    : 'bg-[#181818] border-[#262626]'
                                        }`}>
                                            <div>
                                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                                    {ing.name}
                                                    {isLimiting && (
                                                        <span className="text-[8px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-1.5 py-0.5 rounded font-black uppercase">
                                                            Bahan Pembatas
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Takaran: <span className="text-orange-400 font-mono font-bold">{ing.requiredPerPortion} {ing.unit}</span> per gelas • Sisa di Gudang: <span className="text-white font-mono font-bold">{ing.currentStock} {ing.unit}</span>
                                                </p>
                                            </div>

                                            <div className="text-right flex items-center gap-3">
                                                <div>
                                                    <p className="text-xs font-mono font-bold text-green-400">{ing.possiblePortions} porsi</p>
                                                    <p className="text-[9px] text-gray-500">Kapasitas</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const rawId = ing.id;
                                                        setViewRecipeModal(null);
                                                        setStockModal({ id: rawId, name: ing.name, change: 0, isRaw: true });
                                                    }}
                                                    className="text-xs bg-[#00aaff]/10 hover:bg-[#00aaff] text-[#00aaff] hover:text-white border border-[#00aaff]/30 px-2.5 py-1.5 rounded-lg font-bold transition-colors"
                                                >
                                                    + Restock
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#222222] bg-[#0a0a0a] flex justify-end">
                            <button 
                                onClick={() => setViewRecipeModal(null)} 
                                className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Starter Pack Modal */}
            <StarterPackModal
                isOpen={isStarterPackOpen}
                onClose={() => setIsStarterPackOpen(false)}
                onSuccess={() => {
                    fetchData();
                    fetchRawMaterials();
                    if (filterType === 'HPP') fetchHppSummary();
                }}
            />

            {/* Waste Log Modal */}
            <WasteLogModal
                isOpen={isWasteModalOpen}
                onClose={() => setIsWasteModalOpen(false)}
                rawMaterials={rawMaterials}
                onSuccess={() => {
                    fetchRawMaterials();
                    fetchWasteLogs();
                }}
            />

            {/* Kulakan / Restock Modal */}
            <RestockModal
                isOpen={!!restockMaterial}
                material={restockMaterial}
                onClose={() => setRestockMaterial(null)}
                onSuccess={() => {
                    fetchRawMaterials();
                    if (filterType === 'HPP') fetchHppSummary();
                }}
            />

            {/* Stock Opname Modal */}
            <StockOpnameModal
                isOpen={isOpnameModalOpen}
                onClose={() => setIsOpnameModalOpen(false)}
                rawMaterials={rawMaterials}
                onSuccess={() => {
                    fetchRawMaterials();
                    fetchStockOpnames();
                    if (filterType === 'HPP') fetchHppSummary();
                }}
            />

            {/* Stock Opname Detail Modal */}
            <StockOpnameDetailModal
                isOpen={!!selectedOpnameDetail}
                onClose={() => setSelectedOpnameDetail(null)}
                opname={selectedOpnameDetail}
            />
            {/* Mobile Module / Category Sheet Modal */}
            {isMobileCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-[#141414] border border-[#2a2a2a] w-full max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-200 flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#181818]">
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-[#ff9900]" />
                                <h3 className="font-extrabold text-white text-base">Pilih Modul / Kategori</h3>
                            </div>
                            <button 
                                onClick={() => setIsMobileCategoryModalOpen(false)}
                                className="p-2 rounded-xl bg-[#222] text-gray-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto space-y-4 custom-scrollbar">
                            {/* Group 1: Katalog Produk */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 px-1">Katalog Produk Jadi</p>
                                <div className="space-y-1.5">
                                    {[
                                        { id: 'ALL', label: 'All Items (Semua Produk)', desc: 'Katalog lengkap F&B dan perlengkapan', icon: '📦' },
                                        { id: 'FNB', label: 'FnB & Snacks (Kafe)', desc: 'Minuman, kopi, makanan & camilan', icon: '☕' },
                                        { id: 'EQUIPMENT', label: 'Billiard & Equipment', desc: 'Stick biliar, chalk, sarung tangan, merchandise', icon: '🎱' },
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setFilterType(opt.id as any); setIsMobileCategoryModalOpen(false); }}
                                            className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all ${filterType === opt.id ? 'bg-[#ff9900]/15 border-2 border-[#ff9900] text-white shadow-md' : 'bg-[#181818] border border-[#262626] text-gray-300 hover:bg-[#202020]'}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-sm">{opt.icon}</span>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-xs truncate">{opt.label}</p>
                                                    <p className="text-[10px] text-gray-500 truncate">{opt.desc}</p>
                                                </div>
                                            </div>
                                            {filterType === opt.id && <Check className="w-4 h-4 text-[#ff9900] shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Group 2: Bahan Baku & Resep */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 px-1">Manajemen Bahan Baku & Resep</p>
                                <div className="space-y-1.5">
                                    {[
                                        { id: 'RAW', label: 'Master Bahan Baku', desc: 'Stok susu, kopi, sirup & kulakan kemasan', icon: '🗄️', color: '#00aaff' },
                                        { id: 'WASTE', label: 'Bahan Rusak / Basi (Stock Loss)', desc: 'Pencatatan food waste & bahan kedaluwarsa', icon: '⚠️', color: '#ff3333' },
                                        { id: 'HPP', label: 'HPP & Margin Resep', desc: 'Analisis modal bahan per porsi & keuntungan', icon: '📈', color: '#00ff66' },
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setFilterType(opt.id as any); setIsMobileCategoryModalOpen(false); }}
                                            className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all ${filterType === opt.id ? 'bg-white/10 border-2 border-white text-white shadow-md' : 'bg-[#181818] border border-[#262626] text-gray-300 hover:bg-[#202020]'}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-sm">{opt.icon}</span>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-xs truncate" style={{ color: filterType === opt.id ? opt.color : undefined }}>{opt.label}</p>
                                                    <p className="text-[10px] text-gray-500 truncate">{opt.desc}</p>
                                                </div>
                                            </div>
                                            {filterType === opt.id && <Check className="w-4 h-4 text-white shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Group 3: Audit & Riwayat */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 px-1">Audit & Riwayat</p>
                                <div className="space-y-1.5">
                                    {[
                                        { id: 'OPNAME', label: 'Stock Opname', desc: 'Penghitungan fisik stok berkala', icon: '📋', color: '#a855f7' },
                                        { id: 'HISTORY', label: 'Riwayat Perubahan Stok', desc: 'Log mutasi penyesuaian stok barang & bahan', icon: '🕒', color: '#aaaaaa' },
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setFilterType(opt.id as any); setIsMobileCategoryModalOpen(false); }}
                                            className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all ${filterType === opt.id ? 'bg-white/10 border-2 border-white text-white shadow-md' : 'bg-[#181818] border border-[#262626] text-gray-300 hover:bg-[#202020]'}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-sm">{opt.icon}</span>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-xs truncate" style={{ color: filterType === opt.id ? opt.color : undefined }}>{opt.label}</p>
                                                    <p className="text-[10px] text-gray-500 truncate">{opt.desc}</p>
                                                </div>
                                            </div>
                                            {filterType === opt.id && <Check className="w-4 h-4 text-white shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
