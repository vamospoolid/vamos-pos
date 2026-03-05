import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ArrowUp, ArrowDown, Users, Star, Gift, Loader2, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';

export default function Members() {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', phone: '', photo: '' });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [pointsModal, setPointsModal] = useState<{ id: string, name: string, points: number } | null>(null);

    const fetchMembers = async () => {
        try {
            const res = await api.get('/members');
            setMembers(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleSave = async () => {
        try {
            if (editingMember) {
                await api.put(`/members/${editingMember.id}`, formData);
            } else {
                await api.post('/members', formData);
            }
            setIsModalOpen(false);
            setEditingMember(null);
            fetchMembers();
        } catch (err: any) {
            vamosAlert(err?.response?.data?.message || 'Failed to save member');
        }
    };

    const handleDelete = async (id: string) => {
        if (!(await vamosConfirm('Are you sure you want to delete this member?'))) return;
        try {
            await api.delete(`/members/${id}`);
            fetchMembers();
            setSelectedIds(prev => prev.filter(sid => sid !== id));
        } catch (err) {
            vamosAlert('Failed to delete member');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!(await vamosConfirm(`Are you sure you want to delete ${selectedIds.length} members?`))) return;

        setLoading(true);
        try {
            await Promise.all(selectedIds.map(id => api.delete(`/members/${id}`)));
            setSelectedIds([]);
            fetchMembers();
            vamosAlert('Selected members deleted successfully');
        } catch (err) {
            vamosAlert('Some members failed to delete');
            fetchMembers();
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredMembers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredMembers.map(m => m.id));
        }
    };

    const handlePointsUpdate = async () => {
        if (!pointsModal || pointsModal.points === 0) return;
        try {
            await api.patch(`/members/${pointsModal.id}/points`, { points: pointsModal.points });
            setPointsModal(null);
            fetchMembers();
        } catch (err) {
            vamosAlert('Failed to update points');
        }
    };

    const updateVerification = async (id: string, status: string) => {
        try {
            await api.patch(`/members/${id}/verify/status`, { status });
            fetchMembers();
            vamosAlert(`Verification status updated to ${status}`);
        } catch (err) {
            vamosAlert('Failed to update verification');
        }
    };

    const verifyWaStatus = async (id: string) => {
        try {
            await api.patch(`/members/${id}/verify/wa`);
            fetchMembers();
            vamosAlert('WhatsApp verified successfully');
        } catch (err) {
            vamosAlert('Failed to verify WhatsApp');
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search)
    );

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="bg-[#ff3333] text-white px-5 py-3 rounded-xl font-bold flex items-center hover:bg-[#e62e2e] shadow-[0_0_15px_rgba(255,51,51,0.2)] transition-all animate-in fade-in slide-in-from-left-4"
                        >
                            <Trash2 className="w-5 h-5 mr-2" /> Delete Selected ({selectedIds.length})
                        </button>
                    )}
                </div>
                <button
                    onClick={() => { setEditingMember(null); setFormData({ name: '', phone: '', photo: '' }); setIsModalOpen(true); }}
                    className="bg-[#00ff66] text-[#0a0a0a] px-5 py-3 rounded-xl font-bold flex items-center hover:bg-[#00e65c] shadow-[0_0_15px_rgba(0,255,102,0.2)] transition-all"
                >
                    <Plus className="w-5 h-5 mr-2" /> Register Member
                </button>
            </div>

            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or phone number..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#00ff66] transition-colors"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-gray-600" />
                        Loading members data...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#222222] text-xs uppercase tracking-wider text-gray-500">
                                    <th className="pb-4 px-4 w-10">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-[#00ff66] focus:ring-[#00ff66]/20 transition-all cursor-pointer"
                                            checked={filteredMembers.length > 0 && selectedIds.length === filteredMembers.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="pb-4 font-semibold px-4">Member Info</th>
                                    <th className="pb-4 font-semibold text-center">Loyalty Points</th>
                                    <th className="pb-4 font-semibold text-center">Play Time</th>
                                    <th className="pb-4 font-semibold text-center">Tournament Stats</th>
                                    <th className="pb-4 font-semibold text-center">Rewards</th>
                                    <th className="pb-4 font-semibold text-right px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.map(m => (
                                    <tr key={m.id} className={`border-b border-[#222222] hover:bg-white/5 transition-colors group ${selectedIds.includes(m.id) ? 'bg-[#00ff66]/5' : ''}`}>
                                        <td className="py-4 px-4">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-[#00ff66] focus:ring-[#00ff66]/20 transition-all cursor-pointer"
                                                checked={selectedIds.includes(m.id)}
                                                onChange={() => toggleSelect(m.id)}
                                            />
                                        </td>
                                        <td className="py-4 px-4 flex items-center space-x-3">
                                            {m.photo ? (
                                                <img src={m.photo} alt={m.name} className="w-10 h-10 rounded-full object-cover border border-[#222222]" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-gray-500">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm text-white">{m.name}</p>
                                                    {m.identityStatus === 'VERIFIED' && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-xs text-gray-400 font-mono tracking-wider">{m.phone}</p>
                                                    {m.isWaVerified ? (
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                    ) : (
                                                        <Clock className="w-3 h-3 text-gray-600" />
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className="font-bold font-mono text-lg text-yellow-400 flex items-center justify-center">
                                                <Star className="w-4 h-4 mr-1 fill-yellow-400 opacity-30" />
                                                {m.loyaltyPoints.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <div className="text-xs">
                                                <p className="text-gray-300 font-bold">{Math.round(m.totalPlayHours || 0)} Hrs</p>
                                                <p className="text-gray-500 font-mono tracking-widest mt-0.5">PLAYED</p>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center">
                                            <div className="text-xs">
                                                <p className="text-gray-300 font-bold flex items-center justify-center">
                                                    <Gift className="w-3 h-3 mr-1 text-[#00ff66]" /> {m.totalWins || 0} Wins
                                                </p>
                                                <p className="text-[#00ff66] font-mono tracking-widest mt-0.5">Rp {(m.totalPrizeWon || 0).toLocaleString('id-ID')}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <button onClick={() => setPointsModal({ id: m.id, name: m.name, points: 0 })} className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-[#1a1a1a] border border-[#222222] hover:border-yellow-400 text-yellow-500 px-2 py-1 rounded font-bold flex items-center shadow-sm">
                                                    <Gift className="w-3 h-3 mr-1" /> Points
                                                </button>
                                                {m.identityStatus === 'PENDING' && (
                                                    <button onClick={() => updateVerification(m.id, 'VERIFIED')} className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-1 rounded font-bold hover:bg-blue-500/20 transition-all">
                                                        Approve Photo
                                                    </button>
                                                )}
                                                {!m.isWaVerified && (
                                                    <button onClick={() => verifyWaStatus(m.id)} className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold hover:bg-emerald-500/20 transition-all">
                                                        Verify WA
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditingMember(m); setFormData({ name: m.name, phone: m.phone, photo: m.photo || '' }); setIsModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Edit">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(m.id)} className="p-2 hover:bg-[#ff3333]/20 rounded-lg text-gray-400 hover:text-[#ff3333] transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredMembers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-gray-500 italic">No members found matching your search.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Member Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="p-6 border-b border-[#222222]">
                            <h2 className="text-xl font-bold flex items-center">
                                {editingMember ? 'Edit Profile' : 'Register Member'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-center mb-4">
                                <label className="cursor-pointer group relative">
                                    {formData.photo ? (
                                        <img src={formData.photo} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-[#222222] group-hover:border-[#00ff66] transition-colors" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-[#0a0a0a] border-2 border-dashed border-[#222222] group-hover:border-[#00ff66] flex flex-col items-center justify-center text-gray-500 transition-colors">
                                            <Plus className="w-6 h-6 mb-1" />
                                            <span className="text-[10px] uppercase font-bold tracking-widest">Photo</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#00ff66]" placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#00ff66] font-mono tracking-widest" placeholder="e.g. 08123456789" />
                            </div>

                            {editingMember && (
                                <div className="pt-2">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Verification Controls</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateVerification(editingMember.id, 'VERIFIED')}
                                            className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${editingMember.identityStatus === 'VERIFIED' ? 'bg-blue-500 text-white border-blue-500' : 'bg-[#0a0a0a] border-[#222] text-gray-500 hover:border-blue-500 hover:text-blue-500'}`}
                                        >
                                            IDENTITY_OK
                                        </button>
                                        <button
                                            onClick={() => verifyWaStatus(editingMember.id)}
                                            className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${editingMember.isWaVerified ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-[#0a0a0a] border-[#222] text-gray-500 hover:border-emerald-500 hover:text-emerald-500'}`}
                                        >
                                            WA_VERIFIED
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-[#222222] flex space-x-3">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white font-semibold">Cancel</button>
                            <button onClick={handleSave} disabled={!formData.name || !formData.phone} className="flex-1 py-3 rounded-xl bg-[#00ff66] text-[#0a0a0a] font-bold hover:bg-[#00e65c] disabled:opacity-50">Save Data</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Points Modal */}
            {pointsModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="p-6 border-b border-[#222222] text-center">
                            <h2 className="text-xl font-bold text-yellow-400">Manage Loyalty Points</h2>
                            <p className="text-sm text-gray-400 mt-1">{pointsModal.name}</p>
                        </div>
                        <div className="p-6">
                            <div className="bg-[#0a0a0a] border border-[#222222] p-4 rounded-xl flex items-center justify-between">
                                <button onClick={() => setPointsModal({ ...pointsModal, points: pointsModal.points - 10 })} className="w-12 h-12 rounded-full border border-[#ff3333]/30 bg-[#ff3333]/10 hover:bg-[#ff3333]/20 flex items-center justify-center text-[#ff3333] transition-colors">
                                    <ArrowDown className="w-5 h-5" />
                                </button>
                                <div className="text-center w-24">
                                    <span className={`text-4xl font-mono font-bold tracking-tighter ${pointsModal.points > 0 ? 'text-yellow-400' : 'text-white'}`}>{pointsModal.points > 0 ? `+${pointsModal.points}` : pointsModal.points}</span>
                                    <span className="block text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">Adjustment</span>
                                </div>
                                <button onClick={() => setPointsModal({ ...pointsModal, points: pointsModal.points + 10 })} className="w-12 h-12 rounded-full border border-[#00ff66]/30 bg-[#00ff66]/10 hover:bg-[#00ff66]/20 flex items-center justify-center text-[#00ff66] transition-colors">
                                    <ArrowUp className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="text-center mt-4">
                                <p className="text-xs text-gray-500 font-semibold mb-2">Quick Presets</p>
                                <div className="flex justify-center space-x-2">
                                    <button onClick={() => setPointsModal({ ...pointsModal, points: pointsModal.points - 100 })} className="px-3 py-1 bg-[#141414] border border-[#222222] rounded text-xs text-gray-400 hover:text-white">- 100</button>
                                    <button onClick={() => setPointsModal({ ...pointsModal, points: 0 })} className="px-3 py-1 bg-[#141414] border border-[#222222] rounded text-xs text-gray-400 hover:text-white">Reset 0</button>
                                    <button onClick={() => setPointsModal({ ...pointsModal, points: pointsModal.points + 100 })} className="px-3 py-1 bg-[#141414] border border-[#222222] rounded text-xs text-gray-400 hover:text-white">+ 100</button>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#222222] flex space-x-3">
                            <button onClick={() => setPointsModal(null)} className="flex-1 py-3 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white font-semibold">Cancel</button>
                            <button onClick={handlePointsUpdate} disabled={pointsModal.points === 0} className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 disabled:opacity-50 shadow-[0_0_15px_rgba(234,179,8,0.2)]">Apply Points</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
