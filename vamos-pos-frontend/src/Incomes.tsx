import { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';
import {
    TrendingUp, Plus, Trash2, Loader2, Calendar, FileText,
    DollarSign, X, Download, ArrowRightLeft, CreditCard, Banknote, Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const INCOME_CATEGORIES: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    SEWA_TEMPAT: {
        label: 'Sewa Tempat',
        color: '#00ff66',
        bg: 'rgba(0,255,102,0.08)',
        border: 'rgba(0,255,102,0.2)',
        icon: <FileText className="w-3 h-3" />,
    },
    TOURNAMENT: {
        label: 'Tournament',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.2)',
        icon: <TrendingUp className="w-3 h-3" />,
    },
    SPONSORSHIP: {
        label: 'Sponsorship',
        color: '#a855f7',
        bg: 'rgba(168,85,247,0.08)',
        border: 'rgba(168,85,247,0.2)',
        icon: <DollarSign className="w-3 h-3" />,
    },
    OTHER: {
        label: 'Lain-Lain',
        color: '#9ca3af',
        bg: 'rgba(156,163,175,0.08)',
        border: 'rgba(156,163,175,0.2)',
        icon: <ArrowRightLeft className="w-3 h-3" />,
    },
};

const PAYMENT_METHODS = ['CASH', 'QRIS', 'TRANSFER', 'CARD'];

export default function Incomes() {
    const [incomes, setIncomes] = useState<any[]>([]);
    const [venue, setVenue] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Form states
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('CASH');
    const [notes, setNotes] = useState('');
    const [category, setCategory] = useState('OTHER');

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

    const fetchIncomes = async () => {
        try {
            setLoading(true);
            // Fetch manual incomes (payments with no sessionId)
            const res = await api.get('/payments/manual-income');
            setIncomes(res.data.data || []);
        } catch (err) {
            console.error('Failed to load incomes', err);
        } finally {
            setLoading(false);
        }
    };

    // Compute operational day start / end dates
    useEffect(() => {
        if (timeFilter === 'custom') return;
        const getLocalDateStr = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
        fetchVenue();
        fetchIncomes();
    }, []);

    // Real-time socket
    useEffect(() => {
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '')
            || (window.location.origin.includes('localhost') ? 'http://localhost:3000' : window.location.origin.replace(':5173', ':3000'));
        const socket = io(socketUrl);
        socket.on('sessions:updated', fetchIncomes);
        return () => { socket.disconnect(); };
    }, []);

    const filteredIncomes = useMemo(() => {
        const OPEN_HOUR = venue?.openTime ? parseInt(venue.openTime.split(':')[0], 10) : 10;
        let list = incomes.filter(p => {
            const d = new Date(p.createdAt);
            const opDate = new Date(d);
            
            // Shift to operational day: if before OPEN_HOUR, it belongs to previous calendar day
            if (opDate.getHours() < OPEN_HOUR) {
                opDate.setDate(opDate.getDate() - 1);
            }
            
            const ds = `${opDate.getFullYear()}-${String(opDate.getMonth() + 1).padStart(2, '0')}-${String(opDate.getDate()).padStart(2, '0')}`;
            return ds >= startDate && ds <= endDate;
        });
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p => (p.notes || '').toLowerCase().includes(q));
        }
        return list;
    }, [incomes, startDate, endDate, search]);

    const totalIncome = useMemo(() => filteredIncomes.reduce((s, p) => s + (p.amount || 0), 0), [filteredIncomes]);

    const methodSummary = useMemo(() => {
        const map: Record<string, number> = {};
        filteredIncomes.forEach(p => {
            map[p.method] = (map[p.method] || 0) + (p.amount || 0);
        });
        return map;
    }, [filteredIncomes]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const num = parseFloat(amount);
        if (!num || num <= 0) { vamosAlert('Masukkan jumlah yang valid.'); return; }
        if (!notes.trim()) { vamosAlert('Keterangan tidak boleh kosong.'); return; }
        setSaving(true);
        try {
            const label = INCOME_CATEGORIES[category]?.label || 'Pemasukan';
            await api.post('/payments/manual-income', {
                amount: num,
                method,
                notes: `[${label}] ${notes.trim()}`,
            });
            setShowModal(false);
            setAmount('');
            setNotes('');
            setCategory('OTHER');
            setMethod('CASH');
            fetchIncomes();
            vamosAlert('Pemasukan berhasil dicatat!');
        } catch (err: any) {
            vamosAlert(err?.response?.data?.message || 'Gagal menyimpan pemasukan.');
        } finally {
            setSaving(false);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        doc.setFillColor(10, 10, 10);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(0, 255, 102);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('VAMOS POS', 15, 18);
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(11);
        doc.text('Other Incomes Report', 15, 27);
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        doc.text(`Dicetak: ${dateStr} ${timeStr} | Periode: ${startDate} - ${endDate}`, 15, 35);

        autoTable(doc, {
            startY: 50,
            head: [['Tanggal', 'Keterangan', 'Metode', 'Jumlah']],
            body: filteredIncomes.map(p => [
                new Date(p.createdAt).toLocaleDateString('id-ID'),
                p.notes || '-',
                p.method,
                `Rp ${Math.round(p.amount || 0).toLocaleString('id-ID')}`,
            ]),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [10, 10, 10], textColor: [0, 255, 102], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 250, 250] },
        });

        doc.save(`Incomes-Report-${dateStr.replace(/ /g, '-')}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a] min-h-screen text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-green-400" />
                    <p className="text-gray-500 font-mono text-sm tracking-widest">LOADING INCOMES...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                        <ArrowRightLeft className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight">Other Incomes</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Pendapatan dari luar sesi meja</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportPDF}
                        disabled={filteredIncomes.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #00ff66, #00cc55)', color: '#0a0a0a', boxShadow: '0 0 20px rgba(0,255,102,0.25)' }}
                    >
                        <Plus className="w-4 h-4" />
                        Catat Pemasukan
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-5 rounded-2xl border bg-green-500/5 border-green-500/20" style={{ gridColumn: 'span 1' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-500/60 mb-1">Total Pemasukan</p>
                    <p className="text-2xl font-black text-green-400 font-mono">Rp {totalIncome.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{filteredIncomes.length} transaksi</p>
                </div>
                {PAYMENT_METHODS.filter(m => methodSummary[m] > 0).map(m => (
                    <div key={m} className="p-5 rounded-2xl border bg-[#141414] border-[#222]">
                        <div className="flex items-center gap-2 mb-1">
                            {m === 'CASH' ? <Banknote className="w-3.5 h-3.5 text-yellow-500" /> : <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{m}</p>
                        </div>
                        <p className="text-lg font-black font-mono text-white">Rp {(methodSummary[m] || 0).toLocaleString('id-ID')}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-green-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Cari keterangan pemasukan..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-[#141414] border border-[#222] rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        value={timeFilter}
                        onChange={e => setTimeFilter(e.target.value as any)}
                        className="bg-[#141414] border border-[#222] rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-green-500 appearance-none min-w-[130px]"
                    >
                        <option value="daily">Hari Ini</option>
                        <option value="weekly">1 Minggu</option>
                        <option value="monthly">1 Bulan</option>
                        <option value="custom">Custom</option>
                    </select>
                    {timeFilter === 'custom' && (
                        <div className="flex items-center gap-2 bg-[#141414] border border-[#222] rounded-2xl px-3 py-1.5">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold text-gray-300 focus:outline-none" />
                            <span className="text-gray-500">-</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold text-gray-300 focus:outline-none" />
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-4 text-xs font-mono text-gray-400 uppercase tracking-widest pl-4 border-l-2 border-[#00ff66]/30">
                INFO: Rekap di atas ({timeFilter === 'daily' ? 'Hari Ini' : 'Periode Terpilih'}) mengikuti Siklus Operasional ({venue?.openTime || '10:00'})
            </div>

            {/* Table */}
            <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#222]">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <h2 className="font-bold text-base">Daftar Pemasukan Tambahan</h2>
                    <span className="ml-auto text-xs text-gray-600 font-mono">{filteredIncomes.length} records</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead style={{ background: '#0f0f0f' }}>
                            <tr className="border-b border-[#222]">
                                {['Tanggal & Waktu', 'Keterangan', 'Metode', 'Jumlah'].map((col, i) => (
                                    <th key={col} className={`px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-500 ${i === 3 ? 'text-right' : 'text-left'}`}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIncomes.map(p => (
                                <tr key={p.id} className="border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-5 py-4 text-gray-400 font-mono text-xs">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                                            <div>
                                                <p>{new Date(p.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                <p className="text-gray-600">{new Date(p.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-gray-200 font-medium max-w-[320px]">
                                        <p className="truncate">{p.notes || '-'}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                            p.method === 'CASH' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                            p.method === 'QRIS' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                            p.method === 'TRANSFER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                            'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                        }`}>
                                            {p.method === 'CASH' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                                            {p.method}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right font-black font-mono text-green-400 text-sm">
                                        Rp {Math.round(p.amount || 0).toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                            {filteredIncomes.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-16 text-center">
                                        <ArrowRightLeft className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                        <p className="text-gray-600 text-sm">Belum ada pemasukan tercatat untuk periode ini.</p>
                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all"
                                        >
                                            + Catat Pemasukan Pertama
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {filteredIncomes.length > 0 && (
                            <tfoot style={{ background: '#0f0f0f' }}>
                                <tr className="border-t border-[#222]">
                                    <td colSpan={3} className="px-5 py-3.5 text-xs text-gray-500 font-bold uppercase tracking-widest">
                                        Total Pemasukan
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-black font-mono text-green-400 text-base">
                                        Rp {totalIncome.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Plus className="w-5 h-5 text-green-400" />
                                Catat Pemasukan Tambahan
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Kategori</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(INCOME_CATEGORIES).map(([key, cfg]) => (
                                        <button
                                            type="button"
                                            key={key}
                                            onClick={() => setCategory(key)}
                                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                                            style={category === key ? {
                                                background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}`
                                            } : {
                                                background: '#0a0a0a', color: '#6b7280', border: '1px solid #2a2a2a'
                                            }}
                                        >
                                            {cfg.icon}{cfg.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes / Keterangan */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Keterangan *</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Contoh: Sewa tempat untuk acara ulang tahun"
                                    required
                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-colors text-white text-sm placeholder:text-gray-700"
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
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-green-500 transition-colors text-white font-mono text-sm placeholder:text-gray-700"
                                    />
                                </div>
                                {amount && Number(amount) > 0 && (
                                    <p className="text-xs text-gray-500 mt-1 font-mono">= Rp {Number(amount).toLocaleString('id-ID')}</p>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Metode Diterima</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {PAYMENT_METHODS.map(m => (
                                        <button
                                            type="button"
                                            key={m}
                                            onClick={() => setMethod(m)}
                                            className="py-2 rounded-xl text-xs font-bold transition-all"
                                            style={method === m ? {
                                                background: 'rgba(0,255,102,0.15)', color: '#00ff66', border: '1.5px solid #00ff66'
                                            } : {
                                                background: '#0a0a0a', color: '#6b7280', border: '1px solid #2a2a2a'
                                            }}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #00ff66, #00cc55)', color: '#0a0a0a', boxShadow: '0 0 20px rgba(0,255,102,0.2)' }}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Simpan Pemasukan</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
