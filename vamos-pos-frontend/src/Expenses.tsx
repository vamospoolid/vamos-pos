import { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { api } from './api';
import { vamosAlert, vamosConfirm, vamosPaymentMethod } from './utils/dialog';
import {
    Wallet, Plus, Trash2, Loader2, Calendar, FileText,
    ShoppingCart, Zap, DollarSign, Tag, X, Download, Filter, Users, Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Category Config ─────────────────────────────────────────────────────────
const CATEGORIES: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    OPERATIONAL: {
        label: 'Operational',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
        border: 'rgba(245,158,11,0.3)',
        icon: <Tag className="w-3 h-3" />,
    },
    FNB_SUPPLY: {
        label: 'F&B Supply',
        color: '#ff9900',
        bg: 'rgba(255,153,0,0.12)',
        border: 'rgba(255,153,0,0.3)',
        icon: <ShoppingCart className="w-3 h-3" />,
    },
    UTILITY: {
        label: 'Utility',
        color: '#00aaff',
        bg: 'rgba(0,170,255,0.12)',
        border: 'rgba(0,170,255,0.3)',
        icon: <Zap className="w-3 h-3" />,
    },
    SALARY: {
        label: 'Salary',
        color: '#a855f7',
        bg: 'rgba(168,85,247,0.12)',
        border: 'rgba(168,85,247,0.3)',
        icon: <DollarSign className="w-3 h-3" />,
    },
    OTHER: {
        label: 'Other',
        color: '#9ca3af',
        bg: 'rgba(156,163,175,0.12)',
        border: 'rgba(156,163,175,0.25)',
        icon: <FileText className="w-3 h-3" />,
    },
    DEBT: {
        label: 'Piutang Member',
        color: '#f97316',
        bg: 'rgba(249,115,22,0.12)',
        border: 'rgba(249,115,22,0.3)',
        icon: <Users className="w-3 h-3" />,
    },
};

const getDefaultDateTime = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export default function Expenses() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [venue, setVenue] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [memberSearch, setMemberSearch] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Form states
    const [category, setCategory] = useState('OPERATIONAL');
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(getDefaultDateTime());
    const [members, setMembers] = useState<any[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/expenses');
            setExpenses(res.data.data || []);
        } catch (err) {
            console.error('Failed to load expenses', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await api.get('/members');
            setMembers(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch members', error);
        }
    };

    const fetchVenue = async () => {
        try {
            const res = await api.get('/venues');
            if (res.data.data && res.data.data.length > 0) {
                setVenue(res.data.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch venue', error);
        }
    };

    useEffect(() => { 
        fetchExpenses(); 
        fetchMembers();
        fetchVenue();
    }, []);

    useEffect(() => {
        if (timeFilter === 'custom') return;

        const getLocalDateStr = (d: Date) => {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };

        const now = new Date();
        const openHour = venue?.openTime ? parseInt(venue.openTime.split(':')[0], 10) : 10;
        
        const targetDate = new Date(now);
        // Operational day pivot: if before openHour, we are still on the previous operational day
        if (now.getHours() < openHour) {
            targetDate.setDate(targetDate.getDate() - 1);
        }

        if (timeFilter === 'daily') {
            const str = getLocalDateStr(targetDate);
            setStartDate(str);
            setEndDate(str);
        } else if (timeFilter === 'weekly') {
            const endStr = getLocalDateStr(targetDate);
            const start = new Date(targetDate);
            start.setDate(start.getDate() - 7);
            setStartDate(getLocalDateStr(start));
            setEndDate(endStr);
        } else if (timeFilter === 'monthly') {
            const endStr = getLocalDateStr(targetDate);
            const start = new Date(targetDate);
            start.setDate(start.getDate() - 30);
            setStartDate(getLocalDateStr(start));
            setEndDate(endStr);
        }
    }, [timeFilter, venue?.openTime]);

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || (window.location.origin.includes('localhost') ? 'http://localhost:3000' : window.location.origin.replace(':5173', ':3000'));
        const socket = io(socketUrl);

        const handleUpdate = () => {
            fetchExpenses();
            fetchMembers();
        };

        socket.on('expenses:updated', handleUpdate);
        socket.on('sessions:updated', handleUpdate);
        socket.on('members:updated', handleUpdate);

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            vamosAlert('Masukkan jumlah pengeluaran yang valid.');
            return;
        }
        if (!description.trim()) {
            vamosAlert('Deskripsi tidak boleh kosong.');
            return;
        }
        setSaving(true);
        try {
            await api.post('/expenses', {
                category,
                amount: numAmount,
                description: description.trim(),
                date: date || new Date().toISOString(),
                memberId: category === 'DEBT' ? selectedMemberId : null
            });
            setShowModal(false);
            setAmount('');
            setDescription('');
            setDate(getDefaultDateTime());
            setCategory('OPERATIONAL');
            setSelectedMemberId('');
            fetchExpenses();
            vamosAlert('Pengeluaran berhasil disimpan');
        } catch (err: any) {
            console.error('Failed to save expense', err);
            const msg = err?.response?.data?.message || 'Gagal menyimpan pengeluaran. Coba lagi.';
            vamosAlert(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!(await vamosConfirm('Hapus catatan pengeluaran ini?'))) return;
        try {
            await api.delete(`/expenses/${id}`);
            setExpenses(prev => prev.filter(e => e.id !== id));
            setSelectedIds(prev => prev.filter(sid => sid !== id));
        } catch (err) {
            vamosAlert('Gagal menghapus pengeluaran.');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!(await vamosConfirm(`Hapus ${selectedIds.length} catatan pengeluaran yang terpilih?`))) return;
        
        try {
            await api.post('/expenses/bulk-delete', { ids: selectedIds });
            setExpenses(prev => prev.filter(e => !selectedIds.includes(e.id)));
            setSelectedIds([]);
            vamosAlert('Pengeluaran berhasil dihapus secara massal');
        } catch (err) {
            vamosAlert('Gagal menghapus pengeluaran massal.');
        }
    };

    const handlePayDebt = async (id: string) => {
        const method = await vamosPaymentMethod('Pilih metode pembayaran untuk piutang ini. Saldo kasir akan bertambah sesuai metode yang dipilih.');
        if (!method) return;

        try {
            await api.post(`/expenses/${id}/pay-debt`, { method });
            vamosAlert(`Piutang berhasil dibayar menggunakan ${method}!`);
            fetchExpenses();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal membayar piutang.');
        }
    };

    const filteredExpenses = useMemo(() => {
        let list = expenses;
        if (filterCategory !== 'ALL') {
            list = list.filter(e => e.category === filterCategory);
        }
        
        list = list.filter(e => {
            if (!e.date) return false;
            const d = new Date(e.date);
            // OPERATIONAL CYCLE: Fetch from Venue Settings (e.g. 10:00 AM)
            const OPEN_HOUR = venue?.openTime ? parseInt(venue.openTime.split(':')[0], 10) : 10;
            const opDate = new Date(d);
            if (opDate.getHours() < OPEN_HOUR) {
                opDate.setDate(opDate.getDate() - 1);
            }
            const opDateStr = `${opDate.getFullYear()}-${String(opDate.getMonth() + 1).padStart(2, '0')}-${String(opDate.getDate()).padStart(2, '0')}`;
            
            return opDateStr >= startDate && opDateStr <= endDate;
        });

        if (memberSearch.trim()) {
            const query = memberSearch.toLowerCase();
            list = list.filter(e => 
                (e.member?.name || '').toLowerCase().includes(query) ||
                (e.description || '').toLowerCase().includes(query)
            );
        }
        return list;
    }, [expenses, filterCategory, timeFilter, startDate, endDate, memberSearch]);

    const memberSummary = useMemo(() => {
        if (!memberSearch.trim()) return null;
        const query = memberSearch.toLowerCase();
        const memberExpenses = expenses.filter(e => (e.member?.name || '').toLowerCase().includes(query));
        
        const totalPending = memberExpenses
            .filter(e => e.category === 'DEBT' && e.status === 'PENDING')
            .reduce((sum, e) => sum + (e.amount || 0), 0);
            
        const totalPaid = memberExpenses
            .filter(e => e.category === 'DEBT' && e.status === 'PAID')
            .reduce((sum, e) => sum + (e.amount || 0), 0);
            
        return { totalPending, totalPaid, count: memberExpenses.length };
    }, [expenses, memberSearch]);

    const categorySummary = useMemo(() => {
        const summary: Record<string, number> = {};
        filteredExpenses.forEach(e => {
            summary[e.category] = (summary[e.category] || 0) + (e.amount || 0);
        });
        return summary;
    }, [filteredExpenses]);

    // ─── PDF Export ──────────────────────────────────────────────────────────
    const exportPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        // Header (Same as Reports)
        doc.setFillColor(10, 10, 10);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(239, 68, 68); // Red color for Expenses
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('VAMOS POS', 15, 18);
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(11);
        doc.text('Expense Management Report', 15, 27);
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);

        const periodText = timeFilter === 'custom' ? `${startDate} sampai ${endDate}` : timeFilter === 'daily' ? 'Hari Ini' : timeFilter === 'weekly' ? '7 Hari Terakhir' : '30 Hari Terakhir';
        doc.text(`Dicetak: ${dateStr} ${timeStr} | Kategori: ${filterCategory} | Periode: ${periodText}`, 15, 35);

        let y = 50;

        // Summary Table
        doc.setTextColor(239, 68, 68);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary by Category', 15, y);
        y += 6;

        autoTable(doc, {
            startY: y,
            head: [['Category', 'Total Amount']],
            body: Object.entries(CATEGORIES).map(([key, cfg]) => [
                cfg.label,
                `Rp ${Math.round(categorySummary[key] || 0).toLocaleString('id-ID')}`
            ]),
            styles: { fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: [40, 40, 40], textColor: [239, 68, 68], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        y = (doc as any).lastAutoTable.finalY + 10;

        // Details Table
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Expense Details', 15, y);
        y += 6;

        autoTable(doc, {
            startY: y,
            head: [['Date', 'Category', 'Description', 'Amount']],
            body: filteredExpenses.map(e => [
                new Date(e.date).toLocaleDateString('id-ID'),
                CATEGORIES[e.category]?.label || e.category,
                e.description,
                `Rp ${Math.round(e.amount || 0).toLocaleString('id-ID')}`
            ]),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [10, 10, 10], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [250, 250, 250] },
        });

        doc.save(`Expenses-Report-${dateStr.replace(/ /g, '-')}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a] min-h-screen text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                    <p className="text-gray-500 font-mono text-sm tracking-widest">LOADING EXPENSES...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">

            {/* ─── Header ──────────────────────────────────────────── */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight">Expenses</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Track and manage business spending</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all animate-in fade-in zoom-in-95 duration-200"
                        >
                            <Trash2 className="w-4 h-4" />
                            Hapus Terpilih ({selectedIds.length})
                        </button>
                    )}
                    <button
                        onClick={exportPDF}
                        disabled={expenses.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                        style={{ background: '#ef4444', color: '#fff', boxShadow: '0 0 18px rgba(239,68,68,0.3)' }}
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Pengeluaran
                    </button>
                </div>
            </div>

            {/* ─── Category Dashboard ───────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <button
                    onClick={() => setFilterCategory('ALL')}
                    className={`p-4 rounded-2xl border transition-all text-left ${filterCategory === 'ALL' ? 'bg-white/5 border-white/20 ring-1 ring-white/10' : 'bg-[#141414] border-[#222] hover:border-gray-700'}`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Filter className={`w-4 h-4 ${filterCategory === 'ALL' ? 'text-white' : 'text-gray-600'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">All Categories</span>
                    </div>
                    <p className="text-lg font-black font-mono">
                        Rp {Object.values(categorySummary).reduce((a, b) => a + b, 0).toLocaleString('id-ID')}
                    </p>
                </button>
                {Object.entries(CATEGORIES).map(([key, cfg]) => (
                    <button
                        key={key}
                        onClick={() => setFilterCategory(key)}
                        className={`p-4 rounded-2xl border transition-all text-left ${filterCategory === key ? 'ring-1 ring-inset shadow-lg' : 'bg-[#141414] border-[#222] hover:border-gray-700'}`}
                        style={filterCategory === key ? { backgroundColor: `${cfg.color}10`, borderColor: `${cfg.color}40` } : {}}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span style={{ color: cfg.color }}>{cfg.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{cfg.label}</span>
                        </div>
                        <p className="text-lg font-black font-mono" style={{ color: filterCategory === key ? cfg.color : '#fff' }}>
                            Rp {(categorySummary[key] || 0).toLocaleString('id-ID')}
                        </p>
                    </button>
                ))}
            </div>            {/* ─── Search & Global Stats ───────────────────────────────── */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Cari Member atau Deskripsi..."
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                        className="w-full bg-[#141414] border border-[#222] rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all"
                    />
                    {memberSearch && (
                        <button 
                            onClick={() => setMemberSearch('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-2 md:min-w-[300px]">
                    <select 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-[#141414] border border-[#222] rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-500 appearance-none flex-1 min-w-[140px]"
                    >
                        <option value="ALL">All Categories</option>
                        {Object.entries(CATEGORIES).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                        ))}
                    </select>

                    <select
                        value={timeFilter}
                        onChange={e => setTimeFilter(e.target.value as any)}
                        className="bg-[#141414] border border-[#222] rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-500 appearance-none min-w-[120px]"
                    >
                        <option value="daily">Hari Ini</option>
                        <option value="weekly">1 Minggu</option>
                        <option value="monthly">1 Bulan</option>
                        <option value="custom">Pilih Tanggal</option>
                    </select>

                    {timeFilter === 'custom' && (
                        <div className="flex items-center gap-2 bg-[#141414] border border-[#222] rounded-2xl px-2 py-1">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold text-gray-300 focus:outline-none focus:ring-0 px-2"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold text-gray-300 focus:outline-none focus:ring-0 px-2"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-4 text-xs font-mono text-gray-400 uppercase tracking-widest pl-4 border-l-2 border-[#ff3333]/30">
                INFO: Rekap di atas ({timeFilter === 'daily' ? 'Hari Ini' : 'Periode Terpilih'}) mengikuti Siklus Operasional ({venue?.openTime || '10:00'})
            </div>

            {memberSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 fade-in">
                    <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500/60 mb-1">Total Piutang (BON)</p>
                        <p className="text-2xl font-black text-orange-500 font-mono">
                            Rp {memberSummary.totalPending.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-500/60 mb-1">Total Bon Terbayar</p>
                        <p className="text-2xl font-black text-green-500 font-mono">
                            Rp {memberSummary.totalPaid.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Transaksi</p>
                        <p className="text-2xl font-black text-white font-mono">
                            {memberSummary.count} <span className="text-xs text-gray-500 font-bold uppercase ml-1">KALI</span>
                        </p>
                    </div>
                </div>
            )}
            {/* ─── Filter indicator ─────────────────────────────────── */}
            {filterCategory !== 'ALL' && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                    <span className="text-gray-400">Menampilkan:</span>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{
                            background: CATEGORIES[filterCategory]?.bg,
                            color: CATEGORIES[filterCategory]?.color,
                            border: `1px solid ${CATEGORIES[filterCategory]?.border}`
                        }}>
                        {CATEGORIES[filterCategory]?.icon} {CATEGORIES[filterCategory]?.label}
                    </span>
                    <button onClick={() => setFilterCategory('ALL')}
                        className="text-gray-600 hover:text-white text-xs flex items-center gap-1 transition-colors">
                        <X className="w-3 h-3" /> Reset
                    </button>
                </div>
            )}

            {/* ─── Expenses Table ───────────────────────────────────── */}
            <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#222]">
                    <FileText className="w-5 h-5 text-red-500" />
                    <h2 className="font-bold text-base">Daftar Pengeluaran</h2>
                    <span className="ml-auto text-xs text-gray-600 font-mono">
                        {filteredExpenses.length} / {expenses.length} records
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead style={{ background: '#0f0f0f' }}>
                            <tr className="border-b border-[#222]">
                                <th className="px-5 py-3.5 w-10">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-red-500 focus:ring-red-500/20"
                                        checked={filteredExpenses.length > 0 && selectedIds.length === filteredExpenses.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedIds(filteredExpenses.map(exp => exp.id));
                                            } else {
                                                setSelectedIds([]);
                                            }
                                        }}
                                    />
                                </th>
                                {['Tanggal & Waktu', 'Kategori', 'Deskripsi', 'Jumlah', 'Aksi'].map((col, i) => (
                                    <th key={col} className={`px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-500 ${i === 3 ? 'text-right' : i === 4 ? 'text-center' : 'text-left'}`}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map((e) => {
                                const cat = CATEGORIES[e.category] || CATEGORIES['OTHER'];
                                return (
                                    <tr key={e.id}
                                        className={`border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors group ${selectedIds.includes(e.id) ? 'bg-red-500/5' : ''}`}
                                    >
                                        <td className="px-5 py-4">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-red-500 focus:ring-red-500/20"
                                                checked={selectedIds.includes(e.id)}
                                                onChange={(ev) => {
                                                    if (ev.target.checked) {
                                                        setSelectedIds(prev => [...prev, e.id]);
                                                    } else {
                                                        setSelectedIds(prev => prev.filter(id => id !== e.id));
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-gray-400 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                                                <div>
                                                    <p>{new Date(e.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                    <p className="text-gray-600">{new Date(e.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                                style={{
                                                    background: cat.bg,
                                                    color: cat.color,
                                                    border: `1px solid ${cat.border}`
                                                }}>
                                                {cat.icon}
                                                {cat.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-200 font-medium max-w-[280px]">
                                            <p className="truncate">{e.description}</p>
                                            {e.member && (
                                                <p className="text-[10px] text-orange-400 font-bold uppercase mt-1">
                                                    Member: {e.member.name}
                                                    {e.status === 'PENDING' && <span className="ml-2 text-red-500 font-black italic">[BELUM LUNAS]</span>}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right font-black font-mono text-red-400 text-sm">
                                            Rp {Math.round(e.amount || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {e.isDebt && e.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handlePayDebt(e.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        Bayar
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(e.id)}
                                                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center">
                                        <Wallet className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                        <p className="text-gray-600 text-sm">
                                            {filterCategory !== 'ALL' ? `Tidak ada data untuk kategori ini.` : 'Belum ada pengeluaran tercatat.'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>

                        {/* Table Footer — Total visible */}
                        {filteredExpenses.length > 0 && (
                            <tfoot style={{ background: '#0f0f0f' }}>
                                <tr className="border-t border-[#222]">
                                    <td colSpan={4} className="px-5 py-3.5 text-xs text-gray-500 font-bold uppercase tracking-widest">
                                        Total {memberSearch.trim() ? `untuk "${memberSearch}"` : (filterCategory !== 'ALL' ? CATEGORIES[filterCategory]?.label : 'Semua Kategori')}
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-black font-mono text-red-500 text-base">
                                        Rp {filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString('id-ID')}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* ─── Add Expense Modal ────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Plus className="w-5 h-5 text-red-500" />
                                Tambah Pengeluaran
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Kategori</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(CATEGORIES).map(([key, cfg]) => (
                                        <button
                                            type="button"
                                            key={key}
                                            onClick={() => setCategory(key)}
                                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                                            style={category === key ? {
                                                background: cfg.bg,
                                                color: cfg.color,
                                                border: `1.5px solid ${cfg.color}`
                                            } : {
                                                background: '#0a0a0a',
                                                color: '#6b7280',
                                                border: '1px solid #2a2a2a'
                                            }}
                                        >
                                            {cfg.icon}
                                            {cfg.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Member Selection for Debt */}
                            {category === 'DEBT' && (
                                <div className="fade-in">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pilih Member (Owner/Customer)</label>
                                    <select
                                        value={selectedMemberId}
                                        onChange={(e) => setSelectedMemberId(e.target.value)}
                                        required
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors text-white text-sm"
                                    >
                                        <option value="">-- Cari Member --</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} - HC: {m.handicap || '-'} ({m.phone})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Deskripsi *</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Contoh: Beli token listrik 100kWh"
                                    required
                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors text-white text-sm placeholder:text-gray-700"
                                />
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Jumlah (Rp) *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">Rp</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0"
                                        required
                                        min="1"
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-red-500 transition-colors text-white font-mono text-sm placeholder:text-gray-700"
                                    />
                                </div>
                                {amount && Number(amount) > 0 && (
                                    <p className="text-xs text-gray-500 mt-1 font-mono">
                                        = Rp {Number(amount).toLocaleString('id-ID')}
                                    </p>
                                )}
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tanggal &amp; Waktu</label>
                                <input
                                    type="datetime-local"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors text-white text-sm"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-gray-400 font-semibold hover:bg-white/5 transition-all text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                                    style={{
                                        background: saving ? '#7f1d1d' : '#ef4444',
                                        color: '#fff',
                                        boxShadow: saving ? 'none' : '0 0 15px rgba(239,68,68,0.25)'
                                    }}
                                >
                                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
