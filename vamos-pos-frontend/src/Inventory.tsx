import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, AlertTriangle } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';

export default function Inventory() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [formData, setFormData] = useState<any>({ name: '', category: '', price: '', stock: '' });

    const [stockModal, setStockModal] = useState<{ id: string, name: string, change: number | string } | null>(null);
    const [filterType, setFilterType] = useState<'ALL' | 'FNB' | 'EQUIPMENT' | 'HISTORY'>('ALL');
    const [stockLogs, setStockLogs] = useState<any[]>([]);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
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

    const handleSave = async () => {
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, formData);
            } else {
                await api.post('/products', formData);
            }
            setIsModalOpen(false);
            setEditingProduct(null);
            fetchProducts();
        } catch (err) {
            vamosAlert('Failed to save product');
        }
    };

    const handleDelete = async (id: string) => {
        if (!(await vamosConfirm('Are you sure you want to delete this product?'))) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (err) {
            vamosAlert('Failed to delete product');
        }
    };

    const handleStockUpdate = async () => {
        const changeNum = Number(stockModal?.change) || 0;
        if (!stockModal || changeNum === 0) return;
        try {
            await api.patch(`/products/${stockModal.id}/stock`, { stockChange: changeNum });
            setStockModal(null);
            fetchProducts();
        } catch (err) {
            vamosAlert('Failed to update stock');
        }
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

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-8">
                <div className="flex bg-[#141414] border border-[#222222] p-1 rounded-xl">
                    <button
                        onClick={() => setFilterType('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'ALL' ? 'bg-[#ff9900] text-[#0a0a0a]' : 'text-gray-400 hover:text-white'}`}
                    >
                        All Items
                    </button>
                    <button
                        onClick={() => setFilterType('FNB')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'FNB' ? 'bg-[#ff9900] text-[#0a0a0a]' : 'text-gray-400 hover:text-white'}`}
                    >
                        FnB & Snacks
                    </button>
                    <button
                        onClick={() => setFilterType('EQUIPMENT')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'EQUIPMENT' ? 'bg-[#ff9900] text-[#0a0a0a]' : 'text-gray-400 hover:text-white'}`}
                    >
                        Billiard & Equipment
                    </button>
                    <button
                        onClick={() => setFilterType('HISTORY')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'HISTORY' ? 'bg-[#ff9900] text-[#0a0a0a]' : 'text-gray-400 hover:text-white'}`}
                    >
                        Riwayat Stok
                    </button>
                </div>
                <button
                    onClick={() => { setEditingProduct(null); setFormData({ name: '', category: '', price: '', stock: '' }); setIsModalOpen(true); }}
                    className="bg-[#00ff66] text-[#0a0a0a] px-5 py-3 rounded-xl font-bold flex items-center hover:bg-[#00e65c] shadow-[0_0_15px_rgba(0,255,102,0.2)] transition-all"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add New Item
                </button>
            </div>

            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search items by name or category..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#ff9900] transition-colors"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-gray-500 py-10">Loading...</div>
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
                                {stockLogs.filter(log => 
                                    log.product?.name?.toLowerCase().includes(search.toLowerCase())
                                ).map(log => (
                                    <tr key={log.id} className="border-b border-[#222222] hover:bg-white/5 transition-colors">
                                        <td className="py-4 text-xs font-mono text-gray-400">
                                            {new Date(log.createdAt).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-4">
                                            <p className="font-bold text-sm text-white">{log.product?.name}</p>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest border ${
                                                log.type === 'INITIAL' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                                log.type === 'SALE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                log.type === 'RETURN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                            }`}>
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className={`py-4 text-center font-bold font-mono ${log.quantity > 0 ? 'text-[#00ff66]' : 'text-[#ff3333]'}`}>
                                            {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                                        </td>
                                        <td className="py-4 text-center font-mono text-gray-500">{log.previousStock}</td>
                                        <td className="py-4 text-center font-mono font-bold text-white">{log.newStock}</td>
                                        <td className="py-4 text-xs text-gray-500 italic max-w-xs truncate">{log.notes || '-'}</td>
                                    </tr>
                                ))}
                                {stockLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-gray-500 italic">Belum ada riwayat stok.</td>
                                    </tr>
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
                                            <p className="font-bold text-sm text-white">{p.name}</p>
                                        </td>
                                        <td className="py-4">
                                            <span className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-[#222222] font-semibold text-gray-400">
                                                {p.category || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className="font-mono font-bold text-[#ff9900]">{p.price.toLocaleString()}</span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className={`font-bold font-mono px-3 py-1 rounded-full text-xs ${p.stock <= 5 ? 'bg-[#ff3333]/20 text-[#ff3333]' : 'bg-[#00ff66]/10 text-[#00ff66]'}`}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <button onClick={() => setStockModal({ id: p.id, name: p.name, change: 0 })} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-[#141414] border border-[#222222] hover:border-[#00aaff] text-[#00aaff] px-3 py-1 rounded-lg font-bold">
                                                Manage
                                            </button>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditingProduct(p); setFormData({ name: p.name, category: p.category, price: p.price, stock: p.stock }); setIsModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Edit">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-[#ff3333]/20 rounded-lg text-gray-400 hover:text-[#ff3333] transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-gray-500 italic">No products found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="p-6 border-b border-[#222222]">
                            <h2 className="text-xl font-bold flex items-center">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Product Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff9900]" placeholder="e.g. Mie Goreng Telur" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                                <input type="text" list="category-options" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff9900]" placeholder="e.g. Food, Apparel, Accessory..." />
                                <datalist id="category-options">
                                    <option value="Food (Makanan)" />
                                    <option value="Beverage (Minuman)" />
                                    <option value="Snack (Cemilan)" />
                                    <option value="Cigarette (Rokok)" />
                                    <option value="Apparel (Kaos, Jersey)" />
                                    <option value="Billiard Equipment (Sarung Tangan, dll)" />
                                    <option value="Accessories" />
                                    <option value="Others" />
                                </datalist>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Price (Rp)</label>
                                    <input type="text" value={formData.price ? formData.price.toLocaleString('id-ID') : ''} onChange={e => setFormData({ ...formData, price: parseInt(e.target.value.replace(/\D/g, '')) || '' })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff9900] font-mono" placeholder="Rp 0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Initial Stock</label>
                                    <input type="text" disabled={!!editingProduct} value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value.replace(/\D/g, '')) || '' })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff9900] font-mono disabled:opacity-50" placeholder="0" />
                                    {editingProduct && <p className="text-[10px] text-gray-500 mt-1">Use "Manage Stock" from the table to adjust</p>}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#222222] flex space-x-3">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white font-semibold">Cancel</button>
                            <button onClick={handleSave} disabled={!formData.name} className="flex-1 py-3 rounded-xl bg-[#ff9900] text-[#0a0a0a] font-bold hover:bg-[#ffaa33] disabled:opacity-50">Save Product</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stock Modal */}
            {stockModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="p-6 border-b border-[#222222] text-center">
                            <h2 className="text-xl font-bold">Manage Stock</h2>
                            <p className="text-sm text-gray-400 mt-1">{stockModal.name}</p>
                        </div>
                        <div className="p-6">
                            <div className="bg-[#0a0a0a] border border-[#222222] p-4 rounded-xl">
                                <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest text-center">Adjustment Amount</label>
                                <input
                                    type="number"
                                    value={stockModal.change}
                                    onChange={(e) => setStockModal({ ...stockModal, change: e.target.value })}
                                    className="w-full text-center bg-[#141414] border border-[#222222] rounded-lg px-4 py-3 text-2xl font-mono font-bold focus:outline-none focus:border-[#00aaff] transition-colors"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-400 mt-3 text-center">Positif (+): Menambah | Negatif (-): Mengurangi</p>
                            </div>
                            {Number(stockModal.change) < 0 && (
                                <p className="text-xs text-[#ff3333] mt-4 flex items-center justify-center font-semibold"><AlertTriangle className="w-4 h-4 mr-1" /> Deducting from stock. Stock cannot go below zero.</p>
                            )}
                            {Number(stockModal.change) > 0 && (
                                <p className="text-xs text-[#00ff66] mt-4 flex items-center justify-center font-semibold"><Plus className="w-4 h-4 mr-1" /> Adding to stock.</p>
                            )}
                        </div>
                        <div className="p-6 border-t border-[#222222] flex space-x-3">
                            <button onClick={() => setStockModal(null)} className="flex-1 py-3 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white font-semibold">Cancel</button>
                            <button onClick={handleStockUpdate} disabled={Number(stockModal.change) === 0 || !stockModal.change} className="flex-1 py-3 rounded-xl bg-[#00aaff] text-white font-bold hover:bg-[#0099ee] disabled:opacity-50">Apply Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
