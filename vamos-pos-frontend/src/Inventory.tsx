import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Layers } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';

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
    const [filterType, setFilterType] = useState<'ALL' | 'FNB' | 'EQUIPMENT' | 'HISTORY' | 'RAW'>('ALL');
    const [stockLogs, setStockLogs] = useState<any[]>([]);

    const [isRawModalOpen, setIsRawModalOpen] = useState(false);
    const [editingRaw, setEditingRaw] = useState<any>(null);
    const [rawFormData, setRawFormData] = useState<any>({ name: '', unit: 'GRAM', costPerUnit: '', minStockAlert: '', currentStock: '' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pRes, vRes] = await Promise.all([
                api.get('/products'),
                api.get('/venues')
            ]);
            setProducts(pRes.data.data);
            if (vRes.data.data.length > 0) {
                setIsRecipeSystemEnabled(vRes.data.data[0].isRecipeSystemEnabled);
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

    useEffect(() => {
        if (filterType === 'HISTORY') {
            fetchStockLogs();
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
        setRawFormData({ name: r.name, unit: r.unit, costPerUnit: r.costPerUnit, minStockAlert: r.minStockAlert, currentStock: r.currentStock });
        setIsRawModalOpen(true);
    };

    const openRawCreate = () => {
        setEditingRaw(null);
        setRawFormData({ name: '', unit: 'GRAM', costPerUnit: '', minStockAlert: '', currentStock: '' });
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
        <div className="fade-in">
            <div className="flex justify-between items-center mb-8">
                <div className="flex flex-wrap bg-[#141414] border border-[#222222] p-1 rounded-xl gap-1">
                    <button onClick={() => setFilterType('ALL')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'ALL' ? 'bg-[#ff9900] text-[#0a0a0a]' : 'text-gray-400 hover:text-white'}`}>All Items</button>
                    <button onClick={() => setFilterType('FNB')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'FNB' ? 'bg-[#ff9900] text-[#0a0a0a]' : 'text-gray-400 hover:text-white'}`}>FnB & Snacks</button>
                    <button onClick={() => setFilterType('EQUIPMENT')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'EQUIPMENT' ? 'bg-[#ff9900] text-[#0a0a0a]' : 'text-gray-400 hover:text-white'}`}>Billiard & Equipment</button>
                    {isRecipeSystemEnabled && (
                        <button onClick={() => setFilterType('RAW')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'RAW' ? 'bg-[#00aaff] text-[#0a0a0a]' : 'text-[#00aaff]/60 hover:text-[#00aaff]'}`}>
                            <Layers className="w-4 h-4 inline-block mr-1 -mt-0.5"/> Master Bahan Baku
                        </button>
                    )}
                    <button onClick={() => setFilterType('HISTORY')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'HISTORY' ? 'bg-purple-500 text-[#0a0a0a]' : 'text-purple-400/60 hover:text-purple-400'}`}>Riwayat Stok</button>
                </div>
                <button
                    onClick={filterType === 'RAW' ? openRawCreate : openProductCreate}
                    className="bg-[#00ff66] text-[#0a0a0a] px-5 py-3 rounded-xl font-bold flex items-center hover:bg-[#00e65c] shadow-[0_0_15px_rgba(0,255,102,0.2)] transition-all"
                >
                    <Plus className="w-5 h-5 mr-2" /> {filterType === 'RAW' ? 'Tambah Bahan Baku' : 'Add New Item'}
                </button>
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#222222] text-xs uppercase tracking-wider text-gray-500">
                                    <th className="pb-4 font-semibold">Nama Bahan</th>
                                    <th className="pb-4 font-semibold text-center">Satuan</th>
                                    <th className="pb-4 font-semibold text-right">Modal/Satuan (Rp)</th>
                                    <th className="pb-4 font-semibold text-center">Stok Saat Ini</th>
                                    <th className="pb-4 font-semibold text-center">Quick Adjust</th>
                                    <th className="pb-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRaw.map(r => (
                                    <tr key={r.id} className="border-b border-[#222222] hover:bg-white/5 transition-colors group">
                                        <td className="py-4 font-bold text-sm text-[#00aaff]">{r.name}</td>
                                        <td className="py-4 text-center">
                                            <span className="text-[10px] px-2 py-1 rounded bg-white/5 border border-[#222222] font-semibold text-gray-400">{r.unit}</span>
                                        </td>
                                        <td className="py-4 text-right font-mono font-bold text-gray-300">{r.costPerUnit.toLocaleString()}</td>
                                        <td className="py-4 text-center">
                                            <span className={`font-bold font-mono px-3 py-1 rounded-full text-xs ${r.currentStock <= r.minStockAlert ? 'bg-[#ff3333]/20 text-[#ff3333]' : 'bg-[#00ff66]/10 text-[#00ff66]'}`}>
                                                {r.currentStock} {r.unit}
                                            </span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <button onClick={() => setStockModal({ id: r.id, name: r.name, change: 0, isRaw: true })} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-[#141414] border border-[#222222] hover:border-[#ff9900] text-[#ff9900] px-3 py-1 rounded-lg font-bold">
                                                Adjust
                                            </button>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openRawEdit(r)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteRaw(r.id)} className="p-2 hover:bg-[#ff3333]/20 rounded-lg text-gray-400 hover:text-[#ff3333] transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRaw.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-500 italic">Data bahan baku kosong.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : filterType === 'HISTORY' ? (
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
                                    <tr><td colSpan={7} className="text-center py-10 text-gray-500 italic">Belum ada riwayat stok.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
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
                                {filteredProducts.map(p => (
                                    <tr key={p.id} className="border-b border-[#222222] hover:bg-white/5 transition-colors group">
                                        <td className="py-4">
                                            <p className="font-bold text-sm text-white flex items-center">
                                                {p.name}
                                                {isRecipeSystemEnabled && p.recipes?.length > 0 && (
                                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest bg-orange-500/20 text-orange-400 uppercase">Recipe</span>
                                                )}
                                            </p>
                                        </td>
                                        <td className="py-4"><span className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-[#222222] font-semibold text-gray-400">{p.category || 'Uncategorized'}</span></td>
                                        <td className="py-4 text-right"><span className="font-mono font-bold text-[#ff9900]">{p.price.toLocaleString()}</span></td>
                                        <td className="py-4 text-center"><span className={`font-bold font-mono px-3 py-1 rounded-full text-xs ${p.stock <= 5 ? 'bg-[#ff3333]/20 text-[#ff3333]' : 'bg-[#00ff66]/10 text-[#00ff66]'}`}>{p.stock}</span></td>
                                        <td className="py-4 text-center">
                                            <button onClick={() => setStockModal({ id: p.id, name: p.name, change: 0 })} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-[#141414] border border-[#222222] hover:border-[#00aaff] text-[#00aaff] px-3 py-1 rounded-lg font-bold">Manage</button>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openProductEdit(p)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteProduct(p.id)} className="p-2 hover:bg-[#ff3333]/20 rounded-lg text-gray-400 hover:text-[#ff3333] transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-500 italic">No products found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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
                            <p className="text-[10px] text-gray-500 italic mt-2">* Modal dihitung per Satuan (Misal: per Gram). Jika 1 Kg kopi harganya 150rb, maka per gram adalah 150.</p>
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
        </div>
    );
}
