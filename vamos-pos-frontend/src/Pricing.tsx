import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Package, Loader2 } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';

export default function Pricing() {
    const [activeTab, setActiveTab] = useState<'rules' | 'packages'>('rules');
    const [rules, setRules] = useState<any[]>([]);
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

    // Forms
    const [editingRule, setEditingRule] = useState<any>(null);
    const [ruleForm, setRuleForm] = useState({
        name: '', tableType: 'REGULAR', dayOfWeek: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00', ratePerHour: 0, memberRatePerHour: 0
    });

    const [editingPackage, setEditingPackage] = useState<any>(null);
    const [packageForm, setPackageForm] = useState({
        name: '', tableType: 'REGULAR', duration: 120, price: 0, memberPrice: 0,
        fnbItems: '', startTime: '00:00', endTime: '23:59', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], isActive: true
    });

    const fetchData = async () => {
        try {
            const [rRes, pRes] = await Promise.all([
                api.get('/pricing/rules'),
                api.get('/pricing/packages')
            ]);
            setRules(rRes.data.data);
            setPackages(pRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- rules methods ---
    const saveRule = async () => {
        try {
            if (editingRule) await api.put(`/pricing/rules/${editingRule.id}`, ruleForm);
            else await api.post('/pricing/rules', ruleForm);
            setIsRuleModalOpen(false);
            fetchData();
        } catch (err) {
            vamosAlert('Failed to save rule');
        }
    };

    const deleteRule = async (id: string) => {
        if (!(await vamosConfirm("Delete this pricing rule?"))) return;
        try {
            await api.delete(`/pricing/rules/${id}`);
            fetchData();
        } catch (err) {
            vamosAlert('Failed to delete rule');
        }
    };

    // --- packages methods ---
    const savePackage = async () => {
        try {
            if (editingPackage) await api.put(`/pricing/packages/${editingPackage.id}`, packageForm);
            else await api.post('/pricing/packages', packageForm);
            setIsPackageModalOpen(false);
            fetchData();
        } catch (err) {
            vamosAlert('Failed to save package');
        }
    };

    const deletePackage = async (id: string) => {
        if (!(await vamosConfirm("Delete this package?"))) return;
        try {
            await api.delete(`/pricing/packages/${id}`);
            fetchData();
        } catch (err) {
            vamosAlert('Failed to delete package');
        }
    };

    const daysLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="fade-in">
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => { setEditingRule(null); setRuleForm({ name: '', tableType: 'REGULAR', dayOfWeek: [1, 2, 3, 4, 5], startTime: '00:00', endTime: '23:59', ratePerHour: 0, memberRatePerHour: 0 }); setIsRuleModalOpen(true); }}
                    className="bg-[#bb00ff] text-white px-5 py-2.5 rounded-xl font-bold flex items-center hover:bg-[#aa00ee] shadow-[0_0_15px_rgba(187,0,255,0.2)]"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Hourly Rate
                </button>
            </div>

            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6">
                <div className="flex border-b border-[#222222] mb-6">
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`pb-4 px-6 font-bold flex items-center transition-colors ${activeTab === 'rules' ? 'text-[#bb00ff] border-b-2 border-[#bb00ff]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Clock className="w-4 h-4 mr-2" /> Default Hourly Rates
                    </button>
                    <button
                        onClick={() => setActiveTab('packages')}
                        className={`pb-4 px-6 font-bold flex items-center transition-colors ${activeTab === 'packages' ? 'text-[#00aaff] border-b-2 border-[#00aaff]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Package className="w-4 h-4 mr-2" /> Promo Packages
                    </button>
                </div>

                {activeTab === 'rules' && (
                    <div>
                        {loading && <div className="text-gray-500 mb-4 flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading rules...</div>}
                        <div className="flex justify-end mb-4">
                            <button onClick={() => { setEditingRule(null); setRuleForm({ name: '', tableType: 'REGULAR', dayOfWeek: [1, 2, 3, 4, 5], startTime: '00:00', endTime: '23:59', ratePerHour: 0, memberRatePerHour: 0 }); setIsRuleModalOpen(true); }} className="bg-[#bb00ff] text-white px-5 py-2.5 rounded-xl font-bold flex items-center hover:bg-[#aa00ee] shadow-[0_0_15px_rgba(187,0,255,0.2)]">
                                <Plus className="w-4 h-4 mr-2" /> Add Hourly Rate
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[#222222] text-[10px] uppercase tracking-widest text-gray-500">
                                        <th className="pb-4 font-black">Rule Identity</th>
                                        <th className="pb-4 font-black text-center">Table / Area</th>
                                        <th className="pb-4 font-black">Valid Schedule</th>
                                        <th className="pb-4 font-black text-right">Standard Rate</th>
                                        <th className="pb-4 font-black text-right">Member Rate</th>
                                        <th className="pb-4 font-black text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.map(r => (
                                        <tr key={r.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                            <td className="py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[#bb00ff]/10 border border-[#bb00ff]/20 flex items-center justify-center text-[#bb00ff]">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-white">{r.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 text-center">
                                                <span className="text-[10px] px-2 py-0.5 bg-[#1a1a1a] border border-[#333] text-gray-400 rounded-md font-black tracking-widest">{r.tableType}</span>
                                            </td>
                                            <td className="py-5">
                                                <div className="text-xs font-bold text-gray-300">{r.dayOfWeek.map((d: number) => daysLabels[d]).join(', ')}</div>
                                                <div className="text-[10px] text-[#bb00ff] font-mono mt-0.5">{r.startTime} — {r.endTime}</div>
                                            </td>
                                            <td className="py-5 text-right">
                                                <div className="font-mono font-black text-white text-sm">Rp {Math.round(r.ratePerHour).toLocaleString()}</div>
                                                <div className="text-[10px] text-gray-600 font-bold">Rp {Math.round(r.ratePerHour / 60).toLocaleString()}/min</div>
                                            </td>
                                            <td className="py-5 text-right">
                                                <div className="font-mono font-black text-[#bb00ff] text-sm">Rp {Math.round(r.memberRatePerHour || 0).toLocaleString()}</div>
                                                <div className="text-[10px] text-gray-600 font-bold">Rp {Math.round((r.memberRatePerHour || 0) / 60).toLocaleString()}/min</div>
                                            </td>
                                            <td className="py-5 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => { setEditingRule(r); setRuleForm({ ...r }); setIsRuleModalOpen(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-[#bb00ff]/10 hover:text-[#bb00ff] transition-all">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => deleteRule(r.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {rules.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-600 italic">No hourly rates defined yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'packages' && (
                    <div>
                        {loading && <div className="text-gray-500 mb-4 flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading packages...</div>}
                        <div className="flex justify-end mb-4">
                            <button onClick={() => { setEditingPackage(null); setPackageForm({ name: '', tableType: 'REGULAR', duration: 120, price: 0, memberPrice: 0, fnbItems: '', startTime: '00:00', endTime: '23:59', dayOfWeek: [0, 1, 2, 3, 4, 5, 6], isActive: true }); setIsPackageModalOpen(true); }} className="bg-[#00aaff] text-white px-5 py-2.5 rounded-xl font-bold flex items-center hover:bg-[#0099ee] shadow-[0_0_15px_rgba(0,170,255,0.2)]">
                                <Plus className="w-4 h-4 mr-2" /> Add Package
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[#222222] text-[10px] uppercase tracking-widest text-gray-500">
                                        <th className="pb-4 font-black">Package Name & Inclusions</th>
                                        <th className="pb-4 font-black text-center">Table Type</th>
                                        <th className="pb-4 font-black">Availability</th>
                                        <th className="pb-4 font-black">Duration</th>
                                        <th className="pb-4 font-black text-right">Package Price</th>
                                        <th className="pb-4 font-black text-right">Member Benefit</th>
                                        <th className="pb-4 font-black text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {packages.map(p => (
                                        <tr key={p.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                            <td className="py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[#00aaff]/10 border border-[#00aaff]/20 flex items-center justify-center text-[#00aaff]">
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white">{p.name}</div>
                                                        {p.fnbItems && <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">+ {p.fnbItems}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 text-center">
                                                <span className="text-[10px] px-2 py-0.5 bg-[#1a1a1a] border border-[#333] text-gray-400 rounded-md font-black italic tracking-widest">{p.tableType}</span>
                                            </td>
                                            <td className="py-5">
                                                <div className="text-[10px] text-gray-400 font-bold uppercase">{p.dayOfWeek?.length === 7 ? 'All Week' : p.dayOfWeek?.map((d: number) => daysLabels[d]).join(', ')}</div>
                                                <div className="text-[10px] text-[#00aaff] font-mono mt-0.5">{p.startTime || '00:00'} — {p.endTime || '23:59'}</div>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-white">{p.duration}</span>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Minutes</span>
                                                </div>
                                                <div className="text-[10px] text-[#00aaff] font-bold uppercase tracking-tighter">({(p.duration / 60).toFixed(1)} Hours)</div>
                                            </td>
                                            <td className="py-5 text-right">
                                                <div className="font-mono font-black text-[#00ff66] text-sm">Rp {p.price.toLocaleString()}</div>
                                            </td>
                                            <td className="py-5 text-right">
                                                <div className="font-mono font-black text-[#00aaff] text-sm">Rp {(p.memberPrice || 0).toLocaleString()}</div>
                                                {p.memberPrice < p.price && (
                                                    <div className="text-[9px] text-[#00ff66] font-black uppercase tracking-widest mt-0.5">Save Rp {(p.price - (p.memberPrice || 0)).toLocaleString()}</div>
                                                )}
                                            </td>
                                            <td className="py-5 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => { setEditingPackage(p); setPackageForm({ ...p }); setIsPackageModalOpen(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-[#00aaff]/10 hover:text-[#00aaff] transition-all">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => deletePackage(p.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {packages.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-600 italic">No promo packages defined yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {isRuleModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#222] rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="p-6 border-b border-[#222] bg-[#0d0d0d] flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-xl bg-[#bb00ff]/10 flex items-center justify-center mr-4 border border-[#bb00ff]/20">
                                    <Clock className="w-6 h-6 text-[#bb00ff]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">{editingRule ? 'Modify Hourly Rule' : 'New Hourly Strategy'}</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Set automated pricing by time and day</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Strategy Name</label>
                                    <input type="text" value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-[#bb00ff] font-bold text-sm" placeholder="e.g. Weekend Night" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Table Category</label>
                                    <select value={ruleForm.tableType} onChange={e => setRuleForm({ ...ruleForm, tableType: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-[#bb00ff] font-bold text-sm">
                                        <option value="REGULAR">Regular Table</option>
                                        <option value="VIP">VIP Table</option>
                                        <option value="VVIP">VVIP Room</option>
                                        <option value="CAROM">Carom</option>
                                        <option value="SNOOKER">Snooker</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 pl-1">Days of Operation</label>
                                <div className="flex justify-between">
                                    {[1, 2, 3, 4, 5, 6, 0].map(d => {
                                        const active = ruleForm.dayOfWeek.includes(d);
                                        return (
                                            <button key={d} onClick={() => {
                                                const newDays = active ? ruleForm.dayOfWeek.filter(x => x !== d) : [...ruleForm.dayOfWeek, d];
                                                setRuleForm({ ...ruleForm, dayOfWeek: newDays.sort() });
                                            }} className={`w-11 h-11 rounded-xl font-black text-xs border transition-all ${active ? 'bg-[#bb00ff] border-[#bb00ff] text-black shadow-[0_0_15px_rgba(187,0,255,0.3)]' : 'bg-[#0a0a0a] border-[#222] text-gray-500 hover:border-gray-700'}`}>
                                                {daysLabels[d].toUpperCase()}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 p-4 bg-[#0a0a0a] border border-[#222] rounded-xl">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Window Start</label>
                                    <input type="time" value={ruleForm.startTime} onChange={e => setRuleForm({ ...ruleForm, startTime: e.target.value })} className="w-full bg-[#141414] border border-[#222] rounded-lg px-4 py-2.5 focus:border-[#bb00ff] outline-none font-mono text-white" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Window Close</label>
                                    <input type="time" value={ruleForm.endTime} onChange={e => setRuleForm({ ...ruleForm, endTime: e.target.value })} className="w-full bg-[#141414] border border-[#222] rounded-lg px-4 py-2.5 focus:border-[#bb00ff] outline-none font-mono text-white" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 pl-1">Rate Settings (Standard & Member)</label>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#141414] p-4 rounded-xl border border-[#222]">
                                        <p className="text-[9px] font-black text-gray-500 uppercase mb-3">Normal Standard</p>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] text-gray-600 font-bold block mb-1">Price Per Hour</label>
                                                <input type="number" value={ruleForm.ratePerHour} onChange={e => setRuleForm({ ...ruleForm, ratePerHour: parseInt(e.target.value) || 0 })} className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 focus:border-[#bb00ff] outline-none font-mono font-black text-white" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-600 font-bold block mb-1">Price Per Minute</label>
                                                <input type="number" value={Math.round(ruleForm.ratePerHour / 60)} onChange={e => setRuleForm({ ...ruleForm, ratePerHour: (parseInt(e.target.value) || 0) * 60 })} className="w-full bg-[#0a0a0a]/50 border border-dashed border-[#333] rounded-lg px-3 py-1.5 focus:border-[#bb00ff] outline-none font-mono text-gray-400 text-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#bb00ff]/5 p-4 rounded-xl border border-[#bb00ff]/20">
                                        <p className="text-[9px] font-black text-[#bb00ff] uppercase mb-3 text-right">Member Benefit</p>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] text-[#bb00ff]/60 font-bold block mb-1 text-right">Price Per Hour</label>
                                                <input type="number" value={ruleForm.memberRatePerHour} onChange={e => setRuleForm({ ...ruleForm, memberRatePerHour: parseInt(e.target.value) || 0 })} className="w-full bg-[#0a0a0a] border border-[#bb00ff]/30 text-[#bb00ff] rounded-lg px-3 py-2 focus:border-[#bb00ff] outline-none font-mono font-black text-right" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-[#bb00ff]/40 font-bold block mb-1 text-right">Price Per Minute</label>
                                                <input type="number" value={Math.round(ruleForm.memberRatePerHour / 60)} onChange={e => setRuleForm({ ...ruleForm, memberRatePerHour: (parseInt(e.target.value) || 0) * 60 })} className="w-full bg-[#0a0a0a]/50 border border-dashed border-[#bb00ff]/20 rounded-lg px-3 py-1.5 focus:border-[#bb00ff] outline-none font-mono text-[#bb00ff]/60 text-sm text-right" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#222] flex space-x-3 bg-[#0a0a0a]">
                            <button onClick={() => setIsRuleModalOpen(false)} className="flex-1 py-3 rounded-xl bg-transparent border border-[#222] text-gray-500 font-bold hover:text-white transition-all">TERMINATE</button>
                            <button onClick={saveRule} className="flex-[2] py-3 rounded-xl bg-[#bb00ff] text-black font-black hover:opacity-90 shadow-[0_0_20px_rgba(187,0,255,0.3)] transition-all">ACTIVATE STRATEGY</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Package Modal */}
            {isPackageModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#222] rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="p-6 border-b border-[#222] bg-[#0d0d0d] flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-xl bg-[#00aaff]/10 flex items-center justify-center mr-4 border border-[#00aaff]/20">
                                    <Package className="w-6 h-6 text-[#00aaff]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">{editingPackage ? 'Update Package' : 'New Bundle Offer'}</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Fixed duration pre-paid deals</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Bundle Identity</label>
                                <input type="text" value={packageForm.name} onChange={e => setPackageForm({ ...packageForm, name: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-[#00aaff] font-bold text-sm" placeholder="e.g. Midnight 3h Special" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Applicable Zone</label>
                                    <select value={packageForm.tableType} onChange={e => setPackageForm({ ...packageForm, tableType: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-[#00aaff] font-bold text-sm">
                                        <option value="REGULAR">Regular Area</option>
                                        <option value="VIP">VIP Room</option>
                                        <option value="VVIP">VVIP Exclusive</option>
                                        <option value="CAROM">Carom Area</option>
                                        <option value="SNOOKER">Snooker Area</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Play Duration</label>
                                    <div className="relative">
                                        <input type="number" value={packageForm.duration} onChange={e => setPackageForm({ ...packageForm, duration: parseInt(e.target.value) || 0 })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-[#00aaff] font-mono font-black text-white" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600 uppercase">Min</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 bg-black/40 rounded-2xl border border-white/[0.03] space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">F&B Inclusions</label>
                                    <input type="text" value={packageForm.fnbItems || ''} onChange={e => setPackageForm({ ...packageForm, fnbItems: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-[#00aaff] font-bold text-emerald-400 text-sm" placeholder="e.g. Free Teh Pucuk" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Available From</label>
                                        <input type="time" value={packageForm.startTime || '00:00'} onChange={e => setPackageForm({ ...packageForm, startTime: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 focus:border-[#00aaff] outline-none font-mono text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Available Until</label>
                                        <input type="time" value={packageForm.endTime || '23:59'} onChange={e => setPackageForm({ ...packageForm, endTime: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 focus:border-[#00aaff] outline-none font-mono text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Public Price (Rp)</label>
                                        <input type="number" value={packageForm.price} onChange={e => setPackageForm({ ...packageForm, price: parseInt(e.target.value) || 0 })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#00aaff] font-mono font-black text-[#00ff66] text-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#00aaff] uppercase tracking-widest mb-2 pl-1">Member Price (Rp)</label>
                                        <input type="number" value={packageForm.memberPrice} onChange={e => setPackageForm({ ...packageForm, memberPrice: parseInt(e.target.value) || 0 })} className="w-full bg-[#00aaff]/10 border border-[#00aaff]/30 text-[#00aaff] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#00aaff] font-mono font-black text-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#222] flex space-x-3 bg-[#0a0a0a]">
                            <button onClick={() => setIsPackageModalOpen(false)} className="flex-1 py-3 rounded-xl bg-transparent border border-[#222] text-gray-500 font-bold hover:text-white transition-all">CANCEL</button>
                            <button onClick={savePackage} className="flex-[2] py-3 rounded-xl bg-[#00aaff] text-black font-black hover:opacity-90 shadow-[0_0_20px_rgba(0,170,255,0.3)] transition-all">RELEASE BUNDLE</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
