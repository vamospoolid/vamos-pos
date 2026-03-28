import React, { useState, useMemo, useEffect } from 'react';
import {
    RefreshCw, Download, Calendar,
    Utensils, Coffee, LayoutGrid,
    BarChart3, Table2, Users, Receipt, TrendingDown, Target, Shield, ArrowRight,
    Activity, DollarSign, Clock, ArrowDownRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { reportsApi, sessionsApi } from '../services/api';
import type { TopPlayer, TableUtilization } from '../services/api';

// ── Types ──────────────────────────────────────────
type ReportTab = 'daily' | 'tables' | 'players' | 'fnb' | 'transactions' | 'expenses' | 'shifts';

interface DailyEntry {
    date: string;
    revenue: number;
    sessions: number;
    expenses: number;
    profit: number;
}

interface TableEntry {
    id: string;
    name: string;
    totalSessions: number;
    totalHours: number;
    revenue: number;
    utilization: number; // percentage
}

interface PlayerEntry {
    id: string;
    name: string;
    sessions: number;
    totalSpend: number;
    lastSeen: string;
    favoriteTable: string;
}

interface FnbEntry {
    id: string;
    product: string;
    category: string;
    qty: number;
    revenue: number;
    date: string;
}

interface TransactionEntry {
    id: string;
    date: string;
    customer: string;
    table: string;
    duration: string;
    amount: number;
    method: string;
}

interface ShiftEntry {
    id: string;
    userName: string;
    startTime: string;
    endTime: string;
    startingCash: number;
    endingCashActual: number;
    expectedCash: number;
    expectedQris: number;
    expectedCard: number;
    notes: string;
    status: string;
}

// ── Helpers ────────────────────────────────────────
const fmtK = (num: number) => {
    return num >= 1_000_000 ? `Rp ${(num / 1_000_000).toFixed(1)}M` : `Rp ${(num / 1_000).toFixed(0)}K`;
};

// ── Report Page Component ──────────────────────────
const Reports: React.FC = () => {
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState('daily');

    // ── Live backend data ──
    const [liveTopPlayers, setLiveTopPlayers] = useState<TopPlayer[]>([]);
    const [liveTableUtil, setLiveTableUtil] = useState<TableUtilization[]>([]);
    const [liveDaily, setLiveDaily] = useState<DailyEntry[]>([]);
    const [liveFnb, setLiveFnb] = useState<FnbEntry[]>([]);
    const [liveTransactions, setLiveTransactions] = useState<TransactionEntry[]>([]);
    const [utilizationSplit, setUtilizationSplit] = useState({ dayHours: '0.0', nightHours: '0.0' });
    const [loadingLive, setLoadingLive] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [expenseList, setExpenseList] = useState<any[]>([]);
    const [shiftList, setShiftList] = useState<ShiftEntry[]>([]);
    const [todayStats, setTodayStats] = useState<any>(null);
    const [pendingBillsCount, setPendingBillsCount] = useState(0);
    const [pendingBillsAmount, setPendingBillsAmount] = useState(0);

    const fetchLive = async () => {
        setLoadingLive(true);
        setFetchError(null);
        try {
            const params = { startDate: dateFrom, endDate: dateTo };
            const [playersRes, tablesRes, dailyRes, fnbRes, utilSplitRes, todayStatsRes, pendingRes] = await Promise.all([
                reportsApi.topPlayers(params),
                reportsApi.tableUtilization(params),
                reportsApi.dailyRevenue(params),
                reportsApi.topProducts(params),
                reportsApi.todayUtilizationSplit(),
                reportsApi.getOperationalDayRevenue(),
                sessionsApi.getPending()
            ]);

            if (todayStatsRes.data.success) {
                setTodayStats(todayStatsRes.data.data);
            }

            if (pendingRes.data) {
                const pending = pendingRes.data;
                setPendingBillsCount(pending.length);
                const totalPending = pending.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
                setPendingBillsAmount(totalPending);
            }

            if (playersRes.data.success) {
                const d = playersRes.data.data;
                setLiveTopPlayers(d.map((p: any) => ({
                    memberId: p.phone,
                    memberName: p.name,
                    totalSessions: p.totalSessions,
                    totalSpend: p.totalSpent
                })));
            }

            if (tablesRes.data.success) {
                const d = tablesRes.data.data;
                setLiveTableUtil(d.map((t: any) => ({
                    tableId: t.tableName,
                    tableName: t.tableName,
                    totalSessions: t.sessionCount,
                    totalHours: Math.round(t.totalMinutes / 60),
                    revenue: t.totalRevenue
                })));
            }

            if (dailyRes.data.success) {
                const d = dailyRes.data.data;
                setLiveDaily(d.map((day: any) => ({
                    date: day.date,
                    revenue: day.totalRevenue,
                    sessions: day.sessionCount,
                    expenses: day.totalExpenses,
                    profit: day.netRevenue
                })));

                const todayStr = new Date().toISOString().split('T')[0];
                const todayData = d.find((day: any) => day.date === todayStr);
                // Silence unused warning for now as it's used for finding today's data in the array
                void todayData;
            }

            if (fnbRes.data.success) {
                const d = fnbRes.data.data;
                setLiveFnb(d.map((item: any) => ({
                    id: item.product.id,
                    product: item.product.name,
                    category: item.product.category || 'General',
                    qty: item.quantitySold,
                    revenue: item.revenue,
                    date: '-'
                })));
            }

            if (utilSplitRes.data.success) {
                setUtilizationSplit(utilSplitRes.data.data);
            }

            // Also fetch individual transactions
            const txRes = await reportsApi.transactions(params);
            if (txRes.data.success) {
                const d = txRes.data.data;
                setLiveTransactions(d.map((t: any) => ({
                    id: t.id,
                    date: t.endTime || t.createdAt,
                    customer: t.memberName || 'Walk-in',
                    table: t.tableName || '-',
                    duration: `${Math.floor((t.durationMinutes || 0) / 60)}j ${(t.durationMinutes || 0) % 60}m`,
                    amount: t.totalAmount,
                    method: t.paymentMethod
                })));
            }

            // Fetch expenses directly for breakdown
            const expensesRes = await reportsApi.getExpenses(params);
            if (expensesRes.data.success) {
                setExpenseList(expensesRes.data.data);
            }

            // Fetch shifts
            const shiftRes = await reportsApi.getShifts(params);
            if (shiftRes.data.success) {
                const sData = shiftRes.data.data;
                setShiftList(sData.map((s: any) => ({
                    id: s.id,
                    userName: s.user?.name || 'Kasir',
                    startTime: s.startTime,
                    endTime: s.endTime,
                    startingCash: s.startingCash,
                    endingCashActual: s.endingCashActual || 0,
                    expectedCash: s.expectedCash || 0,
                    expectedQris: s.expectedQris || 0,
                    expectedCard: s.expectedCard || 0,
                    notes: s.notes || '-',
                    status: s.status
                })));
            }
        } catch (err: any) {
            console.error('Failed to fetch reports:', err);
            setFetchError(err.message || 'Gagal terhubung ke Server VPS. Periksa koneksi internet atau CORS settings.');
        } finally {
            setLoadingLive(false);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const now = new Date();
        const dateRange = `Period: ${dateFrom} to ${dateTo}`;

        // Header
        doc.setFillColor(16, 20, 35); // Dark Fiery Background
        doc.rect(0, 0, 297, 40, 'F');
        doc.setTextColor(59, 130, 246); // Primary Cobalt
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('LAPORAN ANALITIK VAMOS', 20, 25);

        doc.setTextColor(148, 163, 184); // Slate 400
        doc.setFontSize(10);
        doc.text(`LOG LAPORAN: ${now.toLocaleString('id-ID').toUpperCase()}`, 20, 34);
        doc.text(dateRange.toUpperCase(), 220, 34);

        // Summary Section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text('RINGKASAN PERFORMA LAPANGAN', 20, 50);

        autoTable(doc, {
            startY: 55,
            head: [['PARAMETER', 'JUMALH / NILAI']],
            body: [
                ['PENDAPATAN OPERASIONAL BERSIH', `Rp ${totals.revenue.toLocaleString('id-ID')}`],
                ['TOTAL PENGELUARAN', `Rp ${totals.expenses.toLocaleString('id-ID')}`],
                ['KEUNTUNGAN BERSIH', `Rp ${totals.profit.toLocaleString('id-ID')}`],
                ['TOTAL SESI AKTIF', totals.sessions.toString()],
                ['MARGIN SEKTOR', `${((totals.profit / Math.max(totals.revenue, 1)) * 100).toFixed(1)}%`],
                ['RASIO PENGGUNAAN SIANG / MALAM', `${utilizationSplit.dayHours}h / ${utilizationSplit.nightHours}h`],
                ['PENDAPATAN DIGITAL (QRIS)', `Rp ${(todayStats?.qrisRevenue || 0).toLocaleString('id-ID')}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } }
        });

        // Detail Table based on active tab
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.text(`DETAIL LAPORAN: ${activeTab.toUpperCase()}`, 20, finalY);

        if (activeTab === 'daily') {
            autoTable(doc, {
                startY: finalY + 5,
                head: [['TANGGAL', 'PENDAPATAN', 'SESI', 'PENGELUARAN', 'PROFIT']],
                body: liveDaily.map(d => [d.date, `Rp ${d.revenue.toLocaleString('id-ID')}`, d.sessions, `Rp ${d.expenses.toLocaleString('id-ID')}`, `Rp ${d.profit.toLocaleString('id-ID')}`]),
                headStyles: { fillColor: [30, 41, 59] }
            });
        } else if (activeTab === 'tables') {
            autoTable(doc, {
                startY: finalY + 5,
                head: [['NAMA MEJA', 'SESI', 'JAM UTILITAS', 'PENDAPATAN', 'UTIL %']],
                body: liveTableUtil.map(t => [t.tableName, t.totalSessions, t.totalHours, `Rp ${t.revenue.toLocaleString('id-ID')}`, `${t.utilization.toFixed(1)}%`]),
                headStyles: { fillColor: [30, 41, 59] }
            });
        } else if (activeTab === 'transactions') {
            autoTable(doc, {
                startY: finalY + 5,
                head: [['WAKTU', 'MEMBER', 'MEJA', 'DURASI', 'TOTAL', 'METODE']],
                body: liveTransactions.map(tx => [
                    new Date(tx.date).toLocaleString('id-ID').toUpperCase(),
                    tx.customer,
                    tx.table,
                    tx.duration,
                    `Rp ${tx.amount.toLocaleString('id-ID')}`,
                    tx.method
                ]),
                headStyles: { fillColor: [30, 41, 59] }
            });
        } else if (activeTab === 'players') {
            autoTable(doc, {
                startY: finalY + 5,
                head: [['NAMA MEMBER', 'SESI', 'TOTAL BELANJA', 'MEJA FAVORIT']],
                body: liveTopPlayers.map(p => [p.memberName, p.totalSessions, `Rp ${p.totalSpend.toLocaleString('id-ID')}`, p.favoriteTable]),
                headStyles: { fillColor: [30, 41, 59] }
            });
        } else if (activeTab === 'fnb') {
            autoTable(doc, {
                startY: finalY + 5,
                head: [['PRODUK', 'KATEGORI', 'QTY TERJUAL', 'PENDAPATAN']],
                body: liveFnb.map(f => [f.product, f.category, f.qty, `Rp ${f.revenue.toLocaleString('id-ID')}`]),
                headStyles: { fillColor: [30, 41, 59] }
            });
        } else if (activeTab === 'expenses') {
            autoTable(doc, {
                startY: finalY + 5,
                head: [['TANGGAL', 'KATEGORI', 'KETERANGAN', 'JUMLAH']],
                body: expenseList.map(e => [
                    new Date(e.date).toLocaleDateString('id-ID'),
                    e.category,
                    e.description || '-',
                    `Rp ${e.amount.toLocaleString('id-ID')}`
                ]),
                headStyles: { fillColor: [30, 41, 59] }
            });
        } else if (activeTab === 'shifts') {
            autoTable(doc, {
                startY: finalY + 5,
                head: [['TANGGAL', 'KASIR', 'WAKTU SHIFT', 'KAS SISTEM', 'KAS AKTUAL', 'SELISIH / CATATAN']],
                body: shiftList.map(s => [
                    new Date(s.startTime).toLocaleDateString('id-ID'),
                    s.userName,
                    `${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ACTIVE'}`,
                    `Rp ${s.expectedCash.toLocaleString('id-ID')}`,
                    `Rp ${s.endingCashActual.toLocaleString('id-ID')}`,
                    `Rp ${(s.endingCashActual - s.expectedCash).toLocaleString('id-ID')} (${s.notes})`
                ]),
                headStyles: { fillColor: [30, 41, 59] }
            });
        }

        doc.save(`VAMOS_INTEL_REPORT_${activeTab.toUpperCase()}_${now.toISOString().split('T')[0]}.pdf`);
    };

    useEffect(() => {
        fetchLive();
    }, [dateFrom, dateTo]);

    const filteredDaily = liveDaily;

    const totals = useMemo(() => filteredDaily.reduce(
        (acc, d) => ({
            revenue: acc.revenue + d.revenue,
            expenses: acc.expenses + d.expenses,
            profit: acc.profit + d.profit,
            sessions: acc.sessions + d.sessions,
        }),
        { revenue: 0, expenses: 0, profit: 0, sessions: 0 }
    ), [filteredDaily]);

    // Use live table data if available
    const tablesToShow: TableEntry[] = liveTableUtil.map(t => ({
        id: t.tableId,
        name: t.tableName,
        totalSessions: t.totalSessions,
        totalHours: t.totalHours,
        revenue: t.revenue,
        utilization: Math.min(Math.round((t.totalHours / 24) * 100), 100),
    }));

    // Use live player data
    const playersToShow: PlayerEntry[] = liveTopPlayers.map((p, i) => ({
        id: p.memberId,
        name: p.memberName,
        sessions: p.totalSessions,
        totalSpend: p.totalSpend,
        lastSeen: '-',
        favoriteTable: `Arena Protocol #${i + 1}`,
    }));

    const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
        { id: 'daily', label: 'HARIAN', icon: <BarChart3 size={16} /> },
        { id: 'transactions', label: 'TRANSAKSI', icon: <Receipt size={16} /> },
        { id: 'tables', label: 'MEJA', icon: <Table2 size={16} /> },
        { id: 'players', label: 'MEMBER', icon: <Users size={16} /> },
        { id: 'fnb', label: 'PRODUK', icon: <Utensils size={16} /> },
        { id: 'expenses', label: 'PENGELUARAN', icon: <TrendingDown size={16} /> },
        { id: 'shifts', label: 'SHIFT', icon: <Users size={16} /> },
    ];

    return (
        <div className="space-y-10 pb-20 animate-in">
            {/* ── COMMAND HEADER ─────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 italic">Pusat Laporan</p>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-3xl xl:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Laporan <span className="text-primary">Sektor</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">PENGAMBILAN DATA REAL-TIME AKTIF</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={fetchLive}
                        className="p-4 rounded-2xl bg-[#1a1f35]/40 border border-white/5 text-slate-500 hover:text-primary transition-all active:scale-95 group"
                    >
                        <RefreshCw size={22} className={loadingLive ? 'animate-spin text-primary' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                    <button
                        onClick={exportPDF}
                        className="fiery-btn-primary px-8 py-4 text-[10px] flex items-center gap-3"
                    >
                        <Download size={18} strokeWidth={3} />
                        Export Laporan PDF
                    </button>
                </div>
            </div>

            {/* ── CONNECTION ERROR ALERT ────────────────────────────────────────── */}
            {fetchError && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[32px] flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center fiery-glow shadow-rose-500/20 shrink-0">
                        <Activity className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic mb-1">Data Sync Interrupted</p>
                        <p className="text-sm font-bold text-slate-300">{fetchError}</p>
                    </div>
                    <button 
                        onClick={fetchLive}
                        className="ml-auto px-6 py-3 rounded-xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                    >
                        Retry Protocol
                    </button>
                </div>
            )}

            {/* ── STATS GRID ────────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                    {
                        label: 'Pendapatan Hari Ini',
                        value: `Rp ${Math.round(todayStats?.revenue || 0).toLocaleString('id-ID')}`,
                        sub: 'Omzet operasional hari ini',
                        icon: <BarChart3 className="w-5 h-5" />,
                        accent: '#3b82f6',
                    },
                    {
                        label: 'Tagihan Pending',
                        value: `Rp ${Math.round(pendingBillsAmount || 0).toLocaleString('id-ID')}`,
                        sub: `${pendingBillsCount} sesi belum lunas`,
                        icon: <Receipt className="w-5 h-5" />,
                        accent: pendingBillsCount > 0 ? '#f43f5e' : '#10b981',
                    },
                    {
                        label: 'Total Pengeluaran',
                        value: `Rp ${Math.round(todayStats?.totalExpenses || 0).toLocaleString('id-ID')}`,
                        sub: 'Operasional hari ini',
                        icon: <ArrowDownRight className="w-5 h-5" />,
                        accent: '#f43f5e',
                    },
                    {
                        label: 'Uang Fisik (Laci)',
                        value: `Rp ${Math.round(todayStats?.cashRevenue || 0).toLocaleString('id-ID')}`,
                        sub: 'Estimasi kas di laci',
                        icon: <DollarSign className="w-5 h-5" />,
                        accent: '#10b981',
                    },
                    {
                        label: 'Total Jam Main',
                        value: `${(parseFloat(utilizationSplit.dayHours) + parseFloat(utilizationSplit.nightHours)).toFixed(1)} Jam`,
                        sub: `Siang: ${utilizationSplit.dayHours}j | Malam: ${utilizationSplit.nightHours}j`,
                        icon: <Clock className="w-5 h-5" />,
                        accent: '#0ea5e9',
                    },
                    {
                        label: 'Transaksi QRIS',
                        value: `Rp ${Math.round(todayStats?.qrisRevenue || 0).toLocaleString('id-ID')}`,
                        sub: `${todayStats?.qrisCount || 0} transaksi digital`,
                        icon: <Activity className="w-5 h-5" />,
                        accent: '#d946ef',
                    },
                ].map((card) => (
                    <div key={card.label} className="fiery-card p-4 sm:p-5 flex flex-col gap-3 transition-all hover:scale-[1.02] border-white/5 hover:border-white/10" style={{ background: '#111528' }}>
                        <div className="flex items-center justify-between">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/5">
                                <span style={{ color: card.accent }}>{card.icon}</span>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: card.accent, boxShadow: `0 0 8px ${card.accent}` }} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 italic truncate">{card.label}</p>
                            <p className="text-lg sm:text-xl font-black tracking-tight text-white italic truncate">{card.value}</p>
                            <p className="text-[8px] sm:text-[9px] text-slate-500 mt-1 italic font-medium truncate">{card.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {todayStats && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-6 sm:px-8 py-4 rounded-[24px] bg-primary/5 border border-primary/10 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_15px_var(--primary)]"></div>
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] sm:tracking-[0.2em] italic whitespace-nowrap">Live Sektor Saat Ini:</span>
                    </div>
                    <span className="text-lg sm:text-xl font-black text-white tracking-tighter italic uppercase">Rp {todayStats.revenue.toLocaleString('id-ID')}</span>
                    <div className="sm:ml-auto flex items-center gap-2">
                        <span className="text-[8px] sm:text-[9px] font-black text-slate-600 uppercase italic">Siklus: {todayStats.openHour}:00 - {todayStats.openHour}:00</span>
                    </div>
                </div>
            )}

            {/* ── SECTOR TABS ─────────────────────────────────────────────────── */}
            <div className="flex gap-2 p-2 rounded-[32px] sticky top-4 z-40 bg-[#101423]/80 backdrop-blur-2xl border border-white/5 shadow-2xl overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 sm:gap-3 flex-none lg:flex-1 justify-center px-4 sm:px-6 lg:px-0 py-3 sm:py-4 rounded-[22px] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all duration-300 italic whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-105 z-10'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ── INTELLIGENCE CONTENT AREA ──────────────────────────────────────── */}
            <div className="min-h-[600px] mb-10">
                {activeTab === 'daily' && (
                    <div className="space-y-8 animate-in">
                        {/* PERFORMANCE CHART */}
                        <div className="fiery-card p-6 md:p-10 relative overflow-hidden group">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 relative">
                                <div>
                                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Tren Pendapatan Sektor</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Grafik omzet dan statistik harian harian</p>
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total Pendapatan</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Pengeluaran</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="h-80 w-full pt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={liveDaily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="#334155" 
                                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: '900' }} 
                                            tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            stroke="#334155" 
                                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: '900' }} 
                                            tickFormatter={(val) => fmtK(val)}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                                            itemStyle={{ fontWeight: '800' }}
                                            labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                                            formatter={(val: any) => [`Rp ${Math.round(val || 0).toLocaleString('id-ID')}`, '']}
                                        />
                                        <Area type="monotone" dataKey="revenue" name="Pendapatan" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                        <Area type="monotone" dataKey="expenses" name="Pengeluaran" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* VECTOR LOGS */}
                        <div className="fiery-card overflow-hidden">
                            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center bg-white/[0.02] gap-6">
                                <div>
                                    <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">Riwayat Laporan Harian</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Ringkasan operasional kronologis</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="fiery-input !py-2 !px-4 !text-[10px] !w-auto !rounded-xl italic" />
                                    <ArrowRight size={16} className="text-slate-700" />
                                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="fiery-input !py-2 !px-4 !text-[10px] !w-auto !rounded-xl italic" />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-[#101423]">
                                            {['Tanggal', 'Total Pendapatan', 'Keuntungan Bersih', 'Margin Operasional'].map(h => (
                                                <th key={h} className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {[...filteredDaily].reverse().slice(0, 15).map((d, i) => {
                                            const isPos = d.profit > 0;
                                            return (
                                                <tr key={i} className="hover:bg-primary/5 transition-all group">
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-[#101423] flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all">
                                                                <Calendar size={18} className="text-slate-500 group-hover:text-primary transition-colors" />
                                                            </div>
                                                            <span className="text-base font-black text-white italic uppercase tracking-tighter">{new Date(d.date).toLocaleDateString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-base font-black text-white italic">{fmtK(d.revenue)}</td>
                                                    <td className={`p-6 text-base font-black italic ${isPos ? 'text-primary' : 'text-rose-500'}`}>{fmtK(d.profit)}</td>
                                                    <td className="p-6">
                                                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border italic tracking-widest ${isPos ? 'bg-primary/10 text-primary border-primary/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                            {((d.profit / Math.max(d.revenue, 1)) * 100).toFixed(1)}% MARGIN
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tables' && (
                    <div className="space-y-8 animate-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {tablesToShow.map(t => (
                                <div key={t.id} className="fiery-card p-8 flex flex-col items-center text-center group hover:border-primary/40 transition-all relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 blur-3xl pointer-events-none" />
                                    <div className="relative w-28 h-28 mb-8">
                                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                                            <circle
                                                cx="18" cy="18" r="15.9" fill="none"
                                                stroke="var(--primary)" strokeWidth="3"
                                                strokeDasharray={`${t.utilization} 100`}
                                                strokeLinecap="round"
                                                className="drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black text-white italic leading-none">{t.utilization}</span>
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">% UTIL</span>
                                        </div>
                                    </div>
                                    <h4 className="text-xl font-black text-white italic tracking-tighter uppercase group-hover:text-primary transition-colors">{t.name.split(' - ')[0]}</h4>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-3 italic">{t.totalSessions} SESI AKTIF</p>
                                    <div className="mt-6 pt-6 border-t border-white/5 w-full">
                                        <p className="text-2xl font-black text-primary italic tracking-tighter">{fmtK(t.revenue)}</p>
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1 italic">Total Pendapatan Meja</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'players' && (
                    <div className="animate-in space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            {playersToShow.map((p, i) => (
                                <div key={p.id} className="fiery-card p-6 flex items-center gap-6 group hover:bg-[#1e2540]/60 transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                                    <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center font-black text-2xl italic shadow-inner border transition-all duration-500 ${i === 0
                                        ? 'bg-primary text-white border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                                        : 'bg-[#101423] border-white/5 text-slate-500 group-hover:text-primary'
                                        }`}>
                                        #{i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase group-hover:text-primary transition-all truncate">{p.name}</h4>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-[9px] font-black px-3 py-1 rounded-full bg-[#101423] text-slate-400 border border-white/5 uppercase tracking-widest italic flex items-center gap-2">
                                                <Target size={12} className="text-primary" />
                                                FAVORITE: {p.favoriteTable}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500 italic uppercase tracking-widest">{p.sessions} TOTAL SESI</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-primary italic tracking-tighter shadow-primary/20">{fmtK(p.totalSpend)}</p>
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1 italic">TOTAL BELANJA MEMBER</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="space-y-8 animate-in">
                        <div className="fiery-card overflow-hidden">
                            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">Catatan Transaksi</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Verifikasi real-time semua transaksi lunas</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-[#101423]">
                                            {['Waktu', 'Nama Member', 'Meja', 'Durasi', 'Total', 'Metode'].map(h => (
                                                <th key={h} className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {liveTransactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-20 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <Shield size={48} className="text-slate-800 mb-6" />
                                                        <h3 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter">Tidak Ada Transaksi</h3>
                                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3 italic">CATATAN KOSONG UNTUK PERIODE INI</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            liveTransactions.map(tx => (
                                                <tr key={tx.id} className="hover:bg-white/[0.03] transition-all group">
                                                    <td className="p-6 text-[12px] font-black text-slate-500 font-mono italic">
                                                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-[#101423] border border-white/5 flex items-center justify-center text-xs font-black text-primary italic shadow-inner">
                                                                {tx.customer.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="font-black text-white text-base italic uppercase tracking-tighter group-hover:text-primary transition-colors">{tx.customer}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-sm font-black text-slate-400 italic uppercase tracking-tighter">{tx.table}</td>
                                                    <td className="p-6 text-sm font-black text-slate-400 italic uppercase tracking-tighter">{tx.duration}</td>
                                                    <td className="p-6 text-xl font-black text-primary italic tracking-tighter">{tx.amount.toLocaleString('id-ID')}</td>
                                                    <td className="p-6">
                                                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border italic tracking-widest ${tx.method === 'QRIS' ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]'}`}>
                                                            {tx.method.toUpperCase()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'fnb' && (
                    <div className="space-y-8 animate-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {['Makanan', 'Minuman', 'Snack'].map(cat => {
                                const total = liveFnb.filter(f => f.category === cat).reduce((s, f) => s + f.revenue, 0);
                                return (
                                    <div key={cat} className="fiery-card p-8 flex items-center gap-6 group hover:border-primary/20 transition-all">
                                        <div className="w-16 h-16 rounded-[24px] bg-[#1a1f35] border border-white/5 flex items-center justify-center group-hover:bg-primary transition-all duration-500">
                                            {cat === 'Makanan' ? <Utensils size={30} className="text-orange-500 group-hover:text-white" /> : cat === 'Minuman' ? <Coffee size={30} className="text-primary group-hover:text-white" /> : <LayoutGrid size={30} className="text-yellow-500 group-hover:text-white" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1 italic">Sektor {cat}</p>
                                            <p className="text-3xl font-black text-white italic tracking-tighter">{fmtK(total)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="fiery-card overflow-hidden">
                            <div className="overflow-x-auto scrollbar-hide">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead>
                                        <tr className="bg-[#101423] border-b border-white/5">
                                            {['Nama Produk', 'Jumlah Terjual', 'Total Pendapatan'].map(h => (
                                                <th key={h} className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {liveFnb.map(f => (
                                            <tr key={f.id} className="hover:bg-white/[0.03] transition-all group">
                                                <td className="p-6 font-black text-white italic text-lg uppercase tracking-tighter group-hover:text-primary transition-all">{f.product}</td>
                                                <td className="p-6 font-black text-slate-400 italic text-base uppercase">{f.qty} UNIT</td>
                                                <td className="p-6 font-black text-primary italic text-xl tracking-tighter">{fmtK(f.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'expenses' && (
                    <div className="space-y-8 animate-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {['Gaji', 'Operasional', 'Bahan Baku', 'Maintenance', 'Lainnya'].map(cat => {
                                const total = expenseList.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
                                return (
                                    <div key={cat} className="fiery-card p-8 flex items-center gap-6 group hover:border-rose-500/20 transition-all">
                                        <div className="w-16 h-16 rounded-[24px] bg-rose-500/5 border border-rose-500/10 flex items-center justify-center group-hover:bg-rose-500 transition-all duration-500">
                                            <TrendingDown size={30} className="text-rose-500 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1 italic">Pengeluaran {cat}</p>
                                            <p className="text-3xl font-black text-white italic tracking-tighter">{fmtK(total)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="fiery-card overflow-hidden">
                            <div className="overflow-x-auto scrollbar-hide">
                                <table className="w-full text-left min-w-[800px]">
                                    <thead>
                                        <tr className="bg-[#101423] border-b border-white/5">
                                            {['Tanggal', 'Kategori', 'Keterangan', 'Jumlah'].map(h => (
                                                <th key={h} className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {expenseList.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-20 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <Shield size={48} className="text-slate-800 mb-6" />
                                                        <h3 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter">Anggaran Aman</h3>
                                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3 italic">TIDAK ADA PENGELUARAN TERCATAT</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            expenseList.map(e => (
                                                <tr key={e.id} className="hover:bg-rose-500/5 transition-all group">
                                                    <td className="p-6 text-sm font-black text-slate-500 italic uppercase">{new Date(e.date).toLocaleDateString()}</td>
                                                    <td className="p-6">
                                                        <span className="text-[10px] font-black px-4 py-1.5 rounded-full bg-[#101423] text-slate-400 border border-white/5 uppercase italic tracking-widest">{e.category}</span>
                                                    </td>
                                                    <td className="p-6 font-black text-slate-200 italic uppercase tracking-tighter text-base group-hover:text-rose-500/80 transition-all">{e.description || '-'}</td>
                                                    <td className="p-6 font-black text-rose-500 italic text-2xl tracking-tighter">-{fmtK(e.amount)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'shifts' && (
                    <div className="space-y-8 animate-in">
                        <div className="fiery-card overflow-hidden">
                            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">Deployment Log (Shifts)</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Operative duty cycle registry</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#101423] border-b border-white/5">
                                            {['Sector Start', 'Deployment Operative', 'Status', 'System Magnitude', 'Actual Harvest', 'Tactical Discrepancy', 'Comms/Notes'].map(h => (
                                                <th key={h} className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1e1e1e]">
                                        {shiftList.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-20 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <Users size={48} className="text-slate-800 mb-6" />
                                                        <h3 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter">No Active Duty Cycles</h3>
                                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3 italic">ZERO OPERATIVE DEPLOYMENTS RECORDED IN SECTOR</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            shiftList.map(s => {
                                                const diff = s.endingCashActual - s.expectedCash;
                                                const isStable = diff === 0;
                                                const isUnstable = diff !== 0;

                                                return (
                                                    <tr key={s.id} className="hover:bg-primary/5 transition-all group">
                                                        <td className="p-6 whitespace-nowrap">
                                                            <div className="text-base font-black text-white italic uppercase tracking-tighter">{new Date(s.startTime).toLocaleDateString('id-ID')}</div>
                                                            <div className="text-[10px] font-black text-slate-500 mt-1 uppercase italic tracking-widest">
                                                                {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ─
                                                                {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ACTIVE OPS'}
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-2xl bg-[#101423] text-primary border border-white/5 flex items-center justify-center text-xs font-black italic shadow-inner">{s.userName.charAt(0).toUpperCase()}</div>
                                                                <span className="font-black text-white italic uppercase tracking-tighter text-base group-hover:text-primary transition-all">{s.userName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border italic tracking-widest ${s.status === 'OPEN' ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-[#101423] text-slate-500 border-white/5'}`}>
                                                                {s.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="p-6 font-black text-slate-400 italic text-base uppercase">Rp {s.expectedCash.toLocaleString('id-ID')}</td>
                                                        <td className="p-6 font-black text-white italic text-base uppercase">
                                                            {s.status === 'CLOSED' ? `Rp ${s.endingCashActual.toLocaleString('id-ID')}` : 'IN-PROGRESS'}
                                                        </td>
                                                        <td className={`p-6 font-black text-base italic uppercase ${isUnstable ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                            {s.status === 'CLOSED' ? (isStable ? 'VERIFIED' : `Rp ${diff.toLocaleString('id-ID')}`) : 'WAITING...'}
                                                        </td>
                                                        <td className="p-6 font-black text-slate-500 italic text-[11px] uppercase tracking-wider max-w-[200px] truncate">{s.notes}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
