import { useState, useEffect, useRef } from 'react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';
import { io } from 'socket.io-client';
import { Users, Clock, Trash2, Phone, Plus, Loader2, LayoutGrid, Hash, Star, Search, CalendarPlus } from 'lucide-react';

interface WaitlistProps {
    tables?: any[];
    members?: any[];
}

export default function Waitlist({ tables = [], members = [] }: WaitlistProps) {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTables, setSelectedTables] = useState<{ [key: string]: string }>({});

    // Booking mode: 'walkin' or 'reservation'
    const [bookingMode, setBookingMode] = useState<'walkin' | 'reservation'>('walkin');
    const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        partySize: 2,
        tableType: 'REGULAR',
        reservedTime: '', // Format: HH:mm
        tableId: '',
        notes: ''
    });

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(formData.customerName.toLowerCase()) ||
        (m.phone && m.phone.includes(formData.customerName))
    ).slice(0, 5);

    const fetchWaitlist = async () => {
        try {
            const res = await api.get('/waitlist');
            setEntries(res.data);
        } catch (err) {
            console.error('Failed to fetch waitlist');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWaitlist();
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        const socket = io(socketUrl);

        socket.on('waitlist:updated', () => {
            fetchWaitlist();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowMemberSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAdd = async () => {
        if (!formData.customerName) return vamosAlert('Mohon isi nama tamu atau member');
        if (bookingMode === 'reservation' && !formData.reservedTime) return vamosAlert('Mohon isi target jam main');

        try {
            const payload: any = { ...formData };
            if (bookingMode === 'reservation' && formData.reservedTime) {
                const today = new Date();
                const [h, m] = formData.reservedTime.split(':');
                today.setHours(parseInt(h), parseInt(m), 0, 0);

                // If the selected time is earlier than now, assume it's for tomorrow
                if (today < new Date()) {
                    today.setDate(today.getDate() + 1);
                }
                payload.reservedTime = today.toISOString();
            } else {
                delete payload.reservedTime;
            }

            if (!payload.tableId) {
                delete payload.tableId;
            }
            if (!payload.phone) {
                delete payload.phone;
            }
            if (!payload.notes) {
                delete payload.notes;
            }

            await api.post('/waitlist', payload);

            setIsModalOpen(false);
            resetForm();
            fetchWaitlist();
        } catch (err) {
            vamosAlert('Gagal menambahkan ke antrian/booking');
        }
    };

    const resetForm = () => {
        setFormData({ customerName: '', phone: '', partySize: 2, tableType: 'REGULAR', reservedTime: '', tableId: '', notes: '' });
        setBookingMode('walkin');
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const tableId = selectedTables[id];
            await api.patch(`/waitlist/${id}/status`, { status, tableId });
            fetchWaitlist();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!(await vamosConfirm('Hapus data antrian/reservasi ini?'))) return;
        try {
            await api.delete(`/waitlist/${id}`);
            fetchWaitlist();
        } catch (err) {
            vamosAlert('Gagal menghapus data');
        }
    };

    const formatTime = (iso: string | null) => {
        if (!iso) return 'Instant';
        const d = new Date(iso);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const isReservedTimePassed = (iso: string | null) => {
        if (!iso) return false;
        return new Date(iso) < new Date();
    };

    return (
        <div className="fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141414] border border-[#222] p-6 rounded-3xl">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center">
                        <Users className="w-8 h-8 mr-4 text-[#00ff66]" />
                        Waitlist & Bookings
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Manage queuing guests and future table reservations.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="flex-1 md:flex-none px-6 py-3 bg-black/40 border border-[#222] rounded-2xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse"></div>
                        <span className="text-sm font-bold text-gray-400 font-mono uppercase tracking-widest">{entries.length} Antrian Aktif</span>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex-[2] md:flex-none bg-gradient-to-r from-[#00ff66] to-[#00cc52] text-[#0a0a0a] px-8 py-4 rounded-2xl font-black flex items-center justify-center hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(0,255,102,0.2)] transition-all"
                    >
                        <Plus className="w-5 h-5 mr-3" /> Booking Baru
                    </button>
                </div>
            </div>

            <div className="bg-[#141414] border border-[#222] rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[#222] bg-white/[0.02]">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Queue / Time</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Customer / Member</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Party Size</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Target Meja</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e1e1e]">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin text-[#00ff66] mx-auto mb-4" />
                                        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Memuat Antrian...</p>
                                    </td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <Users className="w-16 h-16 opacity-10 mx-auto mb-4" />
                                        <p className="text-gray-500 font-bold">Belum Ada Antrian/Reservasi</p>
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry, idx) => {
                                    const isPassed = isReservedTimePassed(entry.reservedTime);
                                    return (
                                        <tr key={entry.id} className={`group hover:bg-white/[0.02] transition-colors ${entry.status === 'CALLED' ? 'bg-[#ff9900]/5' : ''}`}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono border ${entry.reservedTime ? 'bg-[#ff9900]/10 text-[#ff9900] border-[#ff9900]/20' : 'bg-[#222] text-[#00ff66] border-white/5'
                                                        }`}>
                                                        {entry.reservedTime ? 'RSV' : `#${idx + 1}`}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className={`w-3.5 h-3.5 ${entry.reservedTime ? (isPassed ? 'text-red-500' : 'text-[#ff9900]') : 'text-[#00ff66]'}`} />
                                                            <span className={`text-sm font-black ${entry.reservedTime ? (isPassed ? 'text-red-500 line-through opacity-70' : 'text-[#ff9900]') : 'text-[#00ff66]'}`}>
                                                                {formatTime(entry.reservedTime)}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                                                            Entry {new Date(entry.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 font-bold text-white">
                                                <div className="flex flex-col">
                                                    <span className="text-lg tracking-tight uppercase">{entry.customerName}</span>
                                                    {entry.phone && (
                                                        <a href={`tel:${entry.phone}`} className="text-xs text-[#00aaff] font-mono mt-1 hover:underline flex items-center gap-1.5">
                                                            <Phone className="w-3 h-3" /> {entry.phone}
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#222] rounded-lg border border-white/5 text-gray-300">
                                                    <Users className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-bold font-mono">{entry.partySize} PPL</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col gap-1">
                                                    {entry.table ? (
                                                        <div className="inline-flex items-center gap-2 text-[#00ff66]">
                                                            <Hash className="w-3.5 h-3.5" />
                                                            <span className="text-xs font-black uppercase tracking-widest">{entry.table.name}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div className="inline-flex items-center gap-2 text-gray-400">
                                                                <LayoutGrid className="w-3.5 h-3.5" />
                                                                <span className="text-xs font-black uppercase tracking-widest">{entry.tableType}</span>
                                                            </div>
                                                            <select
                                                                value={selectedTables[entry.id] || ''}
                                                                onChange={(e) => setSelectedTables({ ...selectedTables, [entry.id]: e.target.value })}
                                                                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[#00ff66] outline-none"
                                                            >
                                                                <option value="">Pilih Meja...</option>
                                                                {tables.filter(t => t.type === entry.tableType && t.status === 'AVAILABLE').map(t => (
                                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                    {entry.notes && (
                                                        <p className="text-[10px] text-gray-500 italic max-w-[150px] truncate">{entry.notes}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${entry.status === 'WAITING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    entry.status === 'CALLED' ? 'bg-[#ff9900]/10 text-[#ff9900] border-[#ff9900]/20 animate-pulse' :
                                                        'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/20'
                                                    }`}>
                                                    {entry.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {entry.status === 'WAITING' ? (
                                                        <button
                                                            onClick={() => updateStatus(entry.id, 'CALLED')}
                                                            className="px-6 py-2 bg-[#ff9900] text-[#0a0a0a] font-black rounded-xl text-xs hover:scale-105 transition-all shadow-lg shadow-[#ff9900]/20"
                                                        >
                                                            Panggil
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => updateStatus(entry.id, 'SEATED')}
                                                            className="px-6 py-2 bg-[#00ff66] text-[#0a0a0a] font-black rounded-xl text-xs hover:scale-105 transition-all shadow-lg shadow-[#00ff66]/20"
                                                        >
                                                            Masuk Meja
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(entry.id)}
                                                        className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Add Guest / Booking Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-[#141414] border border-[#333] rounded-[40px] w-full max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="px-12 pt-12 pb-6 flex justify-between items-start border-b border-[#222]">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-4">
                                    <Star className="w-3 h-3 fill-current text-[#00ff66]" /> Antrian & Reservasi
                                </div>
                                <h2 className="text-4xl font-black text-white italic tracking-tighter">TAMBAH ANTRIAN</h2>
                                <p className="text-gray-500 text-sm mt-2">Daftarkan tamu yang sedang menunggu atau booking meja.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#222] text-gray-500 hover:text-white transition-all border border-white/5">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        {/* Mode Selector */}
                        <div className="px-12 py-6 bg-white/[0.01] border-b border-[#222]">
                            <div className="flex bg-[#0a0a0a] border border-[#333] p-1.5 rounded-2xl relative">
                                <button
                                    onClick={() => { setBookingMode('walkin'); setFormData(f => ({ ...f, reservedTime: '' })); }}
                                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all z-10 flex justify-center items-center gap-2 ${bookingMode === 'walkin' ? 'text-black' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <Users className="w-4 h-4" /> Antri Langsung (Sekarang)
                                </button>
                                <button
                                    onClick={() => setBookingMode('reservation')}
                                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all z-10 flex justify-center items-center gap-2 ${bookingMode === 'reservation' ? 'text-black' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <CalendarPlus className="w-4 h-4" /> Reservasi Meja (Nanti)
                                </button>
                                <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#00ff66] rounded-xl transition-all duration-300 ease-in-out ${bookingMode === 'walkin' ? 'left-1.5' : 'translate-x-full left-1.5'}`}></div>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="p-12 grid grid-cols-2 gap-8 custom-scrollbar max-h-[50vh] overflow-y-auto">
                            {/* Left Side: Identity */}
                            <div className="space-y-6">
                                <div className="space-y-2 relative" ref={suggestionRef}>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Nama Tamu / Member</label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#00ff66] transition-colors" />
                                        <input
                                            type="text"
                                            value={formData.customerName}
                                            onChange={e => {
                                                setFormData({ ...formData, customerName: e.target.value });
                                                setShowMemberSuggestions(true);
                                            }}
                                            onFocus={() => setShowMemberSuggestions(true)}
                                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-[#00ff66] transition-colors text-white font-bold placeholder:font-normal placeholder:text-gray-700"
                                            placeholder="Ketik nama atau no member..."
                                        />
                                    </div>

                                    {/* Member Suggestions Dropdown */}
                                    {showMemberSuggestions && formData.customerName && filteredMembers.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden shadow-2xl z-50">
                                            {filteredMembers.map(m => (
                                                <div
                                                    key={m.id}
                                                    onClick={() => {
                                                        setFormData(f => ({ ...f, customerName: m.name, phone: m.phone || f.phone }));
                                                        setShowMemberSuggestions(false);
                                                    }}
                                                    className="p-4 hover:bg-[#222] cursor-pointer border-b border-[#333] last:border-0 flex justify-between items-center transition-colors"
                                                >
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{m.name} {m.handicap ? `- HC: ${m.handicap}` : ''}</p>
                                                        {m.phone && <p className="text-xs text-gray-500 font-mono mt-1">{m.phone}</p>}
                                                    </div>
                                                    <div className="px-2 py-1 bg-[#00ff66]/10 text-[#00ff66] text-[10px] font-black rounded uppercase tracking-widest border border-[#00ff66]/20">
                                                        Member
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Nomor Telepon</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#00aaff] transition-colors" />
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-[#00aaff] transition-colors text-white font-mono font-bold placeholder:font-normal placeholder:text-gray-700"
                                            placeholder="0812XXXXXXXX (Wajib untuk Reservasi)"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Jumlah Orang</label>
                                    <div className="flex bg-[#0a0a0a] border border-[#222] rounded-2xl p-2 items-center">
                                        <button onClick={() => setFormData({ ...formData, partySize: Math.max(1, formData.partySize - 1) })} className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#1a1a1a] text-gray-400 hover:text-white transition-all">-</button>
                                        <span className="flex-1 text-center font-black text-2xl text-white font-mono">{formData.partySize}</span>
                                        <button onClick={() => setFormData({ ...formData, partySize: formData.partySize + 1 })} className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#1a1a1a] text-gray-400 hover:text-white transition-all">+</button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Preferences */}
                            <div className="space-y-6">
                                {bookingMode === 'reservation' && (
                                    <div className="space-y-2 animate-in slide-in-from-right-4 duration-300">
                                        <label className="text-[10px] font-black text-[#ff9900] uppercase tracking-widest pl-1">Jam Main (Reservasi)</label>
                                        <div className="relative group">
                                            <input
                                                type="time"
                                                value={formData.reservedTime}
                                                onChange={e => setFormData({ ...formData, reservedTime: e.target.value })}
                                                className="w-full bg-[#0a0a0a] border border-[#ff9900]/50 rounded-2xl px-4 py-4 focus:outline-none focus:border-[#ff9900] transition-colors text-white font-black text-center text-xl shadow-[0_0_15px_rgba(255,153,0,0.1)] outline outline-1 outline-[#ff9900]/20"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Tipe Meja</label>
                                    <select
                                        value={formData.tableType}
                                        onChange={e => {
                                            const newType = e.target.value;
                                            setFormData({ ...formData, tableType: newType, tableId: '' });
                                        }}
                                        className="w-full bg-[#0a0a0a] border border-[#222] rounded-2xl px-4 py-4 focus:outline-none focus:border-[#00ff66] transition-colors text-white font-bold appearance-none text-center"
                                    >
                                        <option value="REGULAR">REGULAR</option>
                                        <option value="VIP">VIP</option>
                                        <option value="VVIP">VVIP</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Pilih Meja Spesifik (Opsional)</label>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[140px] overflow-y-auto p-2 bg-black/20 rounded-2xl border border-[#222] custom-scrollbar">
                                        <button
                                            onClick={() => setFormData({ ...formData, tableId: '' })}
                                            className={`p-3 rounded-xl text-[10px] font-black border transition-all ${!formData.tableId ? 'bg-[#00ff66] border-[#00ff66] text-black' : 'bg-[#1a1a1a] border-[#333] text-gray-500 hover:border-gray-500'}`}
                                        >
                                            BEBAS
                                        </button>
                                        {tables.filter(t => t.type === formData.tableType).map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setFormData({ ...formData, tableId: t.id })}
                                                className={`p-3 rounded-xl text-[10px] font-black flex flex-col items-center justify-center gap-1 border transition-all ${formData.tableId === t.id ? 'bg-[#00ff66] border-[#00ff66] text-black shadow-[0_0_10px_rgba(0,255,102,0.3)]' : 'bg-[#1a1a1a] border-[#333] text-gray-500 hover:text-white'}`}
                                                title={t.name}
                                            >
                                                <span>M{t.name.split(' ')[1]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Catatan Tambahan</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-[#222] rounded-2xl px-4 py-3 h-[80px] focus:outline-none focus:border-[#00ff66] transition-colors text-white text-sm resize-none"
                                        placeholder="Pesan, permintaan khusus member..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-12 py-8 bg-[#111] border-t border-[#333] flex gap-4">
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 py-5 rounded-[20px] bg-[#222] text-gray-400 font-bold hover:text-white transition-all uppercase tracking-widest text-xs">Batalkan</button>
                            <button onClick={handleAdd} className="flex-[2] py-5 rounded-[20px] bg-gradient-to-r from-[#00ff66] to-[#00cc52] text-[#0a0a0a] font-black hover:opacity-90 shadow-[0_10px_30px_rgba(0,255,102,0.15)] transition-all uppercase tracking-widest text-sm">
                                {bookingMode === 'walkin' ? 'Masuk Antrian' : 'Simpan Reservasi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
