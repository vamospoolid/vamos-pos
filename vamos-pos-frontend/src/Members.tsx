import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ArrowUp, ArrowDown, Users, Star, Gift, Loader2, CheckCircle2, Clock, ShieldCheck, Printer, TrendingUp, History, Trophy } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';
import html2canvas from 'html2canvas';

export default function Members() {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', phone: '', photo: '', handicap: '3', handicapLabel: 'PROVISIONAL' });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isPrinting, setIsPrinting] = useState<string | null>(null);
    const [showOnlyDebt, setShowOnlyDebt] = useState(false);
    const [debtMemberDetail, setDebtMemberDetail] = useState<any>(null);
    const [memberDetail, setMemberDetail] = useState<any>(null);

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

    const downloadMemberCard = async (member: any) => {
        setIsPrinting(member.id);
        // Wait for next tick to ensure template is rendered
        setTimeout(async () => {
            try {
                const element = document.getElementById(`card-template-${member.id}`);
                if (!element) throw new Error("Template not found");

                const canvas = await html2canvas(element, {
                    scale: 3, // High resolution
                    backgroundColor: null,
                    useCORS: true,
                    logging: false
                });

                const link = document.createElement('a');
                link.download = `MemberCard_${member.name.replace(/\s+/g, '_')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (err) {
                console.error(err);
                vamosAlert('Gagal menghasilkan gambar kartu.');
            } finally {
                setIsPrinting(null);
            }
        }, 500);
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

    const fetchMemberDetail = async (id: string) => {
        try {
            const res = await api.get(`/members/${id}`);
            setMemberDetail(res.data.data);
        } catch (err) {
            vamosAlert('Gagal memuat detail member');
        }
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search);
        const matchesDebtFilter = showOnlyDebt ? (m.totalDebt || 0) > 0 : true;
        return matchesSearch && matchesDebtFilter;
    });

    return (
        <div className="fade-in">
            <div className="bg-[#ff3333]/10 border border-[#ff3333]/30 p-2 rounded-lg mb-4 text-[10px] text-[#ff3333] font-black text-center uppercase tracking-widest">
                DEBUG MODE: MEMBER CLICK LOGIC ACTIVE (VERSION 5)
            </div>
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
                    onClick={() => { setEditingMember(null); setFormData({ name: '', phone: '', photo: '', handicap: '3', handicapLabel: 'PROVISIONAL' }); setIsModalOpen(true); }}
                    className="bg-[#00ff66] text-[#0a0a0a] px-5 py-3 rounded-xl font-bold flex items-center hover:bg-[#00e65c] shadow-[0_0_15px_rgba(0,255,102,0.2)] transition-all"
                >
                    <Plus className="w-5 h-5 mr-2" /> Register Member
                </button>
            </div>

            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name or phone number..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#00ff66] transition-colors"
                            />
                        </div>
                        <button
                            onClick={() => setShowOnlyDebt(!showOnlyDebt)}
                            className={`px-4 py-3 rounded-xl border font-bold text-xs transition-all flex items-center ${showOnlyDebt ? 'bg-[#ff3333]/10 border-[#ff3333] text-[#ff3333] shadow-[0_0_10px_rgba(255,51,51,0.1)]' : 'bg-[#0a0a0a] border-[#222222] text-gray-400 hover:border-gray-600'}`}
                        >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            {showOnlyDebt ? 'MENAMPILKAN PIUTANG Saja' : 'FILTER PIUTANG'}
                        </button>
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
                                    <th className="pb-4 font-semibold text-center">Outstanding Debt</th>
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
                                                <img 
                                                    src={m.photo.startsWith('http') ? m.photo : `${api.defaults.baseURL}/player/avatar-view/${m.photo.split('/').pop()}`} 
                                                    alt={m.name} 
                                                    className="w-10 h-10 rounded-full object-cover border border-[#222222]" 
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-gray-500">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                            )}
                                            <div>
                                                <div 
                                                    className="inline-flex items-center gap-2 cursor-pointer select-none py-1 group/name" 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        console.log('CLICKED MEMBER:', m.id);
                                                        fetchMemberDetail(m.id); 
                                                    }}
                                                >
                                                    <p className="font-bold text-sm text-[#00ff66] underline decoration-[#00ff66]/30 transition-all flex items-center gap-2">
                                                        {m.name}
                                                        <Trophy className="w-3 h-3 text-[#00ff66]" />
                                                    </p>
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
                                                {m.handicapLabel === 'PROVISIONAL' && (
                                                    <div className="mt-1">
                                                        <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest italic animate-pulse">
                                                            NEED HC VERIFICATION
                                                        </span>
                                                    </div>
                                                )}
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
                                                {(m.totalDebt || 0) > 0 && (
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                const res = await api.get(`/expenses?memberId=${m.id}&status=PENDING&isDebt=true`);
                                                                setDebtMemberDetail({ name: m.name, debts: res.data.data });
                                                            } catch (err) {
                                                                vamosAlert('Gagal memuat detail piutang');
                                                            }
                                                        }} 
                                                        className="text-[10px] bg-[#ff3333]/10 border border-[#ff3333]/30 text-[#ff3333] px-2 py-1 rounded font-bold hover:bg-[#ff3333]/20 transition-all"
                                                    >
                                                        Detail Bon
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex justify-end items-center space-x-2">
                                                <button 
                                                    onClick={() => downloadMemberCard(m)} 
                                                    className={`p-2 rounded-lg transition-colors ${isPrinting === m.id ? 'text-[#00ff66]' : 'text-gray-400 hover:text-[#00ff66] hover:bg-white/10'}`} 
                                                    title="Print Member Card"
                                                    disabled={isPrinting === m.id}
                                                >
                                                    {isPrinting === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => { setEditingMember(m); setFormData({ name: m.name, phone: m.phone, photo: m.photo || '', handicap: m.handicap || '3', handicapLabel: m.handicapLabel || 'PROVISIONAL' }); setIsModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Edit">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(m.id)} className="p-2 hover:bg-[#ff3333]/20 rounded-lg text-gray-400 hover:text-[#ff3333] transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                {/* HIDDEN PRINT TEMPLATE (Landscape Platinum) */}
                                                <div id={`card-template-${m.id}`} style={{
                                                    width: '1011px',
                                                    height: '638px',
                                                    position: 'fixed',
                                                    left: '-9999px',
                                                    top: '-9999px',
                                                    backgroundColor: '#1a1f35',
                                                    backgroundImage: 'linear-gradient(135deg, #1e243d 0%, #1a1f35 100%)',
                                                    borderRadius: '40px',
                                                    overflow: 'hidden',
                                                    padding: '60px',
                                                    fontFamily: "'Inter', sans-serif",
                                                    color: 'white',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    border: '4px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    {/* Decorative Elements */}
                                                    <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'rgba(59,130,246,0.05)', borderRadius: '50%', filter: 'blur(80px)' }} />
                                                    <div style={{ position: 'absolute', bottom: '20px', left: '60px', width: '120px', height: '4px', background: '#ff7e33', borderRadius: '2px' }} />
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
                                                        <div>
                                                            <p style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '8px', color: '#ff7e33', marginBottom: '10px', fontStyle: 'italic' }}>Official Member</p>
                                                            <h1 style={{ fontSize: '72px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-2px', fontStyle: 'italic', margin: 0, lineHeight: 0.9 }}>
                                                                VAMOS<span style={{ color: '#ff7e33' }}>POOL</span>
                                                            </h1>
                                                        </div>
                                                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '32px', padding: '15px 30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <p style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px' }}>Tier Standing</p>
                                                            <p style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', color: 'white', fontStyle: 'italic' }}>EXECUTIVE ELITE</p>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '50px', position: 'relative', zIndex: 10 }}>
                                                        <div style={{ width: '220px', height: '220px', borderRadius: '60px', backgroundColor: '#0a0d18', border: '4px solid rgba(59,130,246,0.2)', padding: '5px', overflow: 'hidden' }}>
                                                            {m.photo ? (
                                                                <img 
                                                                    src={m.photo.startsWith('http') ? m.photo : `${api.defaults.baseURL}/player/avatar-view/${m.photo.split('/').pop()}`} 
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '55px' }} 
                                                                />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1f35' }}>
                                                                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h2 style={{ fontSize: '64px', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', color: 'white', margin: 0, letterSpacing: '-1px' }}>{m.name}</h2>
                                                            <div style={{ display: 'flex', gap: '30px', marginTop: '10px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff7e33' }} />
                                                                    <p style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px' }}>HC Level: {m.handicap || 4}</p>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }} />
                                                                    <p style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px' }}>Status: {m.identityStatus || 'ACTIVE'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 10 }}>
                                                        <div style={{ paddingBottom: '10px' }}>
                                                            <p style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', letterSpacing: '4px', marginBottom: '5px' }}>Official Comm ID</p>
                                                            <p style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: 'white', fontStyle: 'italic', letterSpacing: '2px' }}>{m.id.substring(0, 18).toUpperCase()}</p>
                                                        </div>
                                                        <div style={{ width: '160px', height: '160px', background: 'white', padding: '15px', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
                                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${m.id}`} style={{ width: '100%', height: '100%' }} />
                                                        </div>
                                                    </div>
                                                </div>
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
                                        <img 
                                            src={formData.photo.startsWith('data:') || formData.photo.startsWith('http') ? formData.photo : `${api.defaults.baseURL}/player/avatar-view/${formData.photo.split('/').pop()}`} 
                                            alt="Preview" 
                                            className="w-24 h-24 rounded-full object-cover border-2 border-[#222222] group-hover:border-[#00ff66] transition-colors" 
                                        />
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
                                <>
                                    <div className="flex gap-4">
                                        <div className="w-1/3">
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">HC</label>
                                            <input type="text" value={formData.handicap} onChange={e => setFormData({ ...formData, handicap: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#00ff66] font-mono text-center tracking-widest" placeholder="e.g. 4 or 3A" />
                                        </div>
                                        <div className="w-2/3">
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">HC Title</label>
                                            <select 
                                                value={formData.handicapLabel} 
                                                onChange={e => setFormData({ ...formData, handicapLabel: e.target.value })} 
                                                className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-[13.5px] focus:outline-none focus:border-[#00ff66] text-white cursor-pointer"
                                            >
                                                <option value="PROVISIONAL">PROVISIONAL (Unverified)</option>
                                                <option value="OFFICIAL">OFFICIAL (Verified)</option>
                                                <option value="ENTRY FRAGGER">ENTRY FRAGGER</option>
                                                <option value="AMATEUR">AMATEUR</option>
                                                <option value="PRO">PRO</option>
                                                <option value="-">- No Title -</option>
                                            </select>
                                        </div>
                                    </div>
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
                                </>
                            )}
                        </div>
                        <div className="p-6 border-t border-[#222222] flex space-x-3">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white font-semibold">Cancel</button>
                            <button onClick={handleSave} disabled={!formData.name || !formData.phone} className="flex-1 py-3 rounded-xl bg-[#00ff66] text-[#0a0a0a] font-bold hover:bg-[#00e65c] disabled:opacity-50">Save Data</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Member Detail Modal */}
            {memberDetail && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
                    <div className="bg-[#141414] border border-[#222222] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col">
                        <div className="p-8 border-b border-[#222222] flex justify-between items-start bg-gradient-to-r from-[#00ff66]/5 to-transparent">
                            <div className="flex items-center space-x-6">
                                <div className="relative">
                                    {memberDetail.photo ? (
                                        <img 
                                            src={memberDetail.photo.startsWith('http') ? memberDetail.photo : `${api.defaults.baseURL}/player/avatar-view/${memberDetail.photo.split('/').pop()}`} 
                                            className="w-24 h-24 rounded-2xl object-cover border-2 border-[#333]" 
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-2xl bg-[#1a1a1a] border-2 border-[#333] flex items-center justify-center">
                                            <Users className="w-10 h-10 text-gray-500" />
                                        </div>
                                    )}
                                    <div className="absolute -bottom-2 -right-2 bg-[#00ff66] text-black w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-lg border-2 border-[#141414]">
                                        {memberDetail.level || 1}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                        {memberDetail.name}
                                        {memberDetail.identityStatus === 'VERIFIED' && <ShieldCheck className="w-6 h-6 text-blue-400" fill="currentColor" fillOpacity={0.1} />}
                                    </h2>
                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1 bg-[#1a1a1a] rounded-lg border border-[#333] flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">HC {memberDetail.handicap || 4}</span>
                                        </div>
                                        <div className="px-3 py-1 bg-[#1a1a1a] rounded-lg border border-[#333] flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{memberDetail.phone}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setMemberDetail(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/10">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-4 gap-6 mb-10">
                                <div className="bg-[#0a0a0a] border border-[#222] p-5 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 bg-yellow-400 rounded-bl-3xl">
                                        <Star className="w-12 h-12" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Loyalty Points</p>
                                    <p className="text-3xl font-black text-yellow-500 font-mono tracking-tighter">
                                        {memberDetail.loyaltyPoints?.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-[#0a0a0a] border border-[#222] p-5 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 bg-blue-500 rounded-bl-3xl">
                                        <TrendingUp className="w-12 h-12" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Experience (XP)</p>
                                    <p className="text-3xl font-black text-blue-400 font-mono tracking-tighter">
                                        {memberDetail.experience?.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-[#0a0a0a] border border-[#222] p-5 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 bg-[#00ff66] rounded-bl-3xl">
                                        <Gift className="w-12 h-12" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Tournament Wins</p>
                                    <p className="text-3xl font-black text-[#00ff66] font-mono tracking-tighter">
                                        {memberDetail.totalWins || 0}
                                    </p>
                                </div>
                                <div className="bg-[#0a0a0a] border border-[#222] p-5 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 bg-purple-500 rounded-bl-3xl">
                                        <Clock className="w-12 h-12" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Play Hours</p>
                                    <p className="text-3xl font-black text-purple-400 font-mono tracking-tighter">
                                        {Math.round(memberDetail.totalPlayHours || 0)} <span className="text-sm">HRS</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                {/* Arena Challenge History */}
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Gift className="w-4 h-4 text-[#00ff66]" /> Arena Challenge History
                                    </h3>
                                    <div className="space-y-3">
                                        {[...(memberDetail.challengesSent || []), ...(memberDetail.challengesReceived || [])]
                                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                            .slice(0, 5).map((c: any) => {
                                                const isChallenger = c.challengerId === memberDetail.id;
                                                const opponent = isChallenger ? c.opponent : c.challenger;
                                                const isWinner = c.winnerId === memberDetail.id;
                                                return (
                                                    <div key={c.id} className="bg-[#0a0a0a] border border-[#222] p-4 rounded-2xl flex items-center justify-between group hover:border-[#00ff66]/30 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${isWinner ? 'bg-[#00ff66]/10 text-[#00ff66]' : 'bg-red-500/10 text-red-500'}`}>
                                                                {isWinner ? 'W' : 'L'}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-white">vs {opponent?.name || 'Unknown'}</p>
                                                                <p className="text-[9px] text-gray-500 font-mono tracking-tighter uppercase mt-0.5">
                                                                    {new Date(c.createdAt).toLocaleDateString()} • Stake: {c.pointsStake} pts
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {c.isFightForTable && (
                                                            <span className="bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20 px-2 py-0.5 rounded text-[8px] font-black">ARENA</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        {(!memberDetail.challengesSent?.length && !memberDetail.challengesReceived?.length) && (
                                            <p className="text-center py-6 text-gray-600 text-xs italic bg-[#0a0a0a] border border-[#222] rounded-2xl">No challenge history yet.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Points Activity */}
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <History className="w-4 h-4 text-yellow-500" /> Points Activity
                                    </h3>
                                    <div className="space-y-3">
                                        {memberDetail.pointLogs?.slice(0, 5).map((l: any) => (
                                            <div key={l.id} className="bg-[#0a0a0a] border border-[#222] p-4 rounded-2xl flex items-center justify-between group hover:border-yellow-400/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${l.points > 0 ? 'bg-yellow-400/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {l.points > 0 ? `+` : ``}{l.points}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white truncate max-w-[180px]">{l.description}</p>
                                                        <p className="text-[9px] text-gray-500 font-mono tracking-tighter uppercase mt-0.5">
                                                            {new Date(l.createdAt).toLocaleDateString()} • {l.type}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {!memberDetail.pointLogs?.length && (
                                            <p className="text-center py-6 text-gray-600 text-xs italic bg-[#0a0a0a] border border-[#222] rounded-2xl">No point activity yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-[#222222] bg-[#0a0a0a]/50 flex justify-end gap-3">
                            <button onClick={() => setMemberDetail(null)} className="px-8 py-3 rounded-2xl bg-[#141414] border border-[#333] text-white font-bold hover:bg-[#1a1a1a] transition-all">
                                CLOSE DETAILS
                            </button>
                            <button 
                                onClick={() => { setEditingMember(memberDetail); setFormData({ name: memberDetail.name, phone: memberDetail.phone, photo: memberDetail.photo || '', handicap: memberDetail.handicap || '4', handicapLabel: memberDetail.handicapLabel || 'PROVISIONAL' }); setMemberDetail(null); setIsModalOpen(true); }}
                                className="px-8 py-3 rounded-2xl bg-[#00ff66] text-black font-black hover:bg-[#00e65c] transition-all shadow-lg shadow-[#00ff66]/10"
                            >
                                EDIT PROFILE
                            </button>
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
            {/* Debt Detail Modal */}
            {debtMemberDetail && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="p-6 border-b border-[#222222] flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-white">Detail Piutang (BON)</h2>
                                <p className="text-sm text-red-500 font-bold uppercase tracking-widest mt-1">{debtMemberDetail.name}</p>
                            </div>
                            <button onClick={() => setDebtMemberDetail(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-3">
                                {debtMemberDetail.debts.map((d: any) => (
                                    <div key={d.id} className="bg-[#0a0a0a] border border-[#222222] p-4 rounded-xl flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold text-white">{d.description}</p>
                                            <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">
                                                {new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black font-mono text-red-500">Rp {d.amount.toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#222222] bg-[#0a0a0a] flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Akumulasi</p>
                                <p className="text-2xl font-black font-mono text-[#ff3333]">
                                    Rp {debtMemberDetail.debts.reduce((s: number, d: any) => s + d.amount, 0).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <button onClick={() => setDebtMemberDetail(null)} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Ensure X is available from lucide-react if needed (already in imports usually)
const X = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
