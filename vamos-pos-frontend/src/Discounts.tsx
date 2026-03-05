import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Percent, Banknote, Loader2 } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';

export default function Discounts() {
    const [discounts, setDiscounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<any>(null);
    const [form, setForm] = useState({
        name: '',
        type: 'PERCENTAGE',
        value: 0,
        description: '',
        isActive: true
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/discounts');
            setDiscounts(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const saveDiscount = async () => {
        if (!form.name || form.value < 0) {
            vamosAlert('Please enter valid name and value');
            return;
        }

        try {
            if (editingDiscount) {
                await api.put(`/discounts/${editingDiscount.id}`, form);
            } else {
                await api.post('/discounts', form);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            vamosAlert('Failed to save discount');
        }
    };

    const deleteDiscount = async (id: string) => {
        if (!(await vamosConfirm("Delete this discount category?"))) return;
        try {
            await api.delete(`/discounts/${id}`);
            fetchData();
        } catch (err) {
            vamosAlert('Failed to delete discount');
        }
    };

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                        <Tag className="w-6 h-6 text-yellow-500" />
                        Discount Categories
                    </h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Manage global price reductions</p>
                </div>
                <button
                    onClick={() => { setEditingDiscount(null); setForm({ name: '', type: 'PERCENTAGE', value: 0, description: '', isActive: true }); setIsModalOpen(true); }}
                    className="bg-yellow-500 text-[#0a0a0a] px-5 py-2.5 rounded-xl font-black flex items-center hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Category
                </button>
            </div>

            <div className="bg-[#141414] border border-[#222222] rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-20 flex justify-center items-center text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#222222] text-[10px] uppercase tracking-widest text-gray-500 bg-[#0d0d0d]">
                                <th className="px-6 py-4 font-black">Category Name</th>
                                <th className="px-6 py-4 font-black">Type</th>
                                <th className="px-6 py-4 font-black text-right">Benefit Value</th>
                                <th className="px-6 py-4 font-black">Status</th>
                                <th className="px-6 py-4 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discounts.map(d => (
                                <tr key={d.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white text-sm">{d.name}</div>
                                        <div className="text-[10px] text-gray-500 font-bold">{d.description || 'No description'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {d.type === 'PERCENTAGE' ? (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black italic">
                                                    <Percent className="w-3 h-3" /> PERCENTAGE
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black italic">
                                                    <Banknote className="w-3 h-3" /> FIXED NOMINAL
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-mono font-black text-white">
                                            {d.type === 'PERCENTAGE' ? `${d.value}%` : `Rp ${d.value.toLocaleString()}`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${d.isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'}`}>
                                            {d.isActive ? 'ACTIVE_READY' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => { setEditingDiscount(d); setForm({ ...d }); setIsModalOpen(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-yellow-500/10 hover:text-yellow-500 transition-all">
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => deleteDiscount(d.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {discounts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-20 text-gray-600 italic">No discount categories defined yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-[#141414] border border-[#222] rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.1)]">
                        <div className="p-6 border-b border-[#222] bg-[#0d0d0d] flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mr-4 border border-yellow-500/20">
                                    <Tag className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">{editingDiscount ? 'Update Privilege' : 'New Discount Strategy'}</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Define benefit value and rules</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Protocol Name</label>
                                <input
                                    type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 font-bold text-sm text-white"
                                    placeholder="e.g. Member VIP 15%"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Calculation Type</label>
                                    <select
                                        value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 font-bold text-sm text-white"
                                    >
                                        <option value="PERCENTAGE">PERCENTAGE (%)</option>
                                        <option value="FIXED">FIXED NOMINAL (RP)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Protocol Value</label>
                                    <div className="relative">
                                        <input
                                            type="number" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 font-mono font-black text-white text-lg"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600 uppercase">
                                            {form.type === 'PERCENTAGE' ? '%' : 'RP'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Description (Optional)</label>
                                <textarea
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 font-bold text-xs text-gray-400 h-20 resize-none"
                                    placeholder="Detailed rules for this discount..."
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-[#0a0a0a] p-4 rounded-xl border border-[#222]">
                                <input
                                    type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                    className="w-5 h-5 accent-yellow-500"
                                    id="is_active_check"
                                />
                                <label htmlFor="is_active_check" className="text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer">Strategy is Active & Ready to Apply</label>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[#222] flex space-x-3 bg-[#0a0a0a]">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl bg-transparent border border-[#222] text-gray-500 font-bold hover:text-white transition-all">TERMINATE</button>
                            <button onClick={saveDiscount} className="flex-[2] py-3 rounded-xl bg-yellow-500 text-[#0a0a0a] font-black hover:opacity-90 shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all">RELEASE STRATEGY</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
