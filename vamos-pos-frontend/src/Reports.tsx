import React, { useState, useEffect, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from './api';
import {
    TrendingUp, Activity, Loader2, Utensils,
    Download, DollarSign, FileText, Calendar, ArrowUpRight, ArrowDownRight,
    Clock, Receipt, BarChart3, ChevronDown, ChevronUp, Package, User
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
    user?: any;
    todayRevenue?: number;
    todayQrisRevenue?: number;
    todayCashRevenue?: number;
    todayOtherRevenue?: number;
    pendingBillsAmount?: number;
    pendingBillsCount?: number;
    todayExpenses?: number;
    utilizationSplit?: { dayHours: string; nightHours: string };
    venue?: any;
}

export default function Reports({ 
    todayRevenue = 0, 
    todayQrisRevenue = 0, 
    todayCashRevenue = 0, 
    todayOtherRevenue = 0,
    todayExpenses = 0, 
    pendingBillsAmount = 0, 
    pendingBillsCount = 0, 
    utilizationSplit = { dayHours: '0.0', nightHours: '0.0' }, 
    venue 
}: ReportsProps) {
    const [revenue30, setRevenue30] = useState<any[]>([]);
    const [utilization, setUtilization] = useState<any[]>([]);
    const [topPlayers, setTopPlayers] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [txLoading, setTxLoading] = useState(true);
    const [txFilter, setTxFilter] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
    const [txStartDate, setTxStartDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD local
    const [txEndDate, setTxEndDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [txPaymentMethod, setTxPaymentMethod] = useState<'ALL' | 'CASH' | 'QRIS'>('ALL');
    const [loading, setLoading] = useState(true);
    const [expandedTx, setExpandedTx] = useState<string | null>(null);

    const filteredTransactions = useMemo(() => {
        if (txPaymentMethod === 'ALL') return transactions;
        return transactions.filter(t => (t.paymentMethod || 'CASH').toUpperCase().includes(txPaymentMethod));
    }, [transactions, txPaymentMethod]);
    const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
    const todayLocal = new Date().toLocaleDateString('en-CA');
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'));
    const [endDate, setEndDate] = useState(todayLocal);
    const reportRef = useRef<HTMLDivElement>(null);

    const fetchReports = async (sd = startDate, ed = endDate) => {
        try {
            setLoading(true);
            // Always use startDate/endDate for consistent operational-day boundaries
            const query = `?startDate=${sd}&endDate=${ed}`;

            const [revRes, utilRes, topRes, prodRes] = await Promise.all([
                api.get(`/reports/daily-revenue${query}`),
                api.get(`/reports/table-utilization${query}`),
                api.get(`/reports/top-players${query}`),
                api.get(`/reports/top-products${query}`)
            ]);

            const revData = revRes.data.data || [];
            const sortedRev = [...revData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setRevenue30(sortedRev);
            setUtilization(utilRes.data.data || []);
            setTopPlayers(topRes.data.data || []);
            setTopProducts(prodRes.data.data || []);
        } catch (err) {
            console.error('Failed to load reports', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const calculateOperationalDates = () => {
             const now = new Date();
             const openHour = venue?.openTime ? parseInt(venue.openTime.split(':')[0]) : 10;
             
             // Base date for "Today's" business cycle
             let todayOp = new Date();
             if (now.getHours() < openHour) {
                 todayOp.setDate(todayOp.getDate() - 1);
             }
             
             const todayStr = todayOp.toLocaleDateString('en-CA');
             const yesterdayOp = new Date(todayOp);
             yesterdayOp.setDate(yesterdayOp.getDate() - 1);
             const yesterdayStr = yesterdayOp.toLocaleDateString('en-CA');

             if (timeFilter === 'daily') {
                 setStartDate(yesterdayStr);
                 setEndDate(todayStr);
                 fetchReports(yesterdayStr, todayStr);
             } else if (timeFilter === 'weekly') {
                 const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');
                 setStartDate(start);
                 setEndDate(todayStr);
                 fetchReports(start, todayStr);
             } else if (timeFilter === 'monthly') {
                 const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');
                 setStartDate(start);
                 setEndDate(todayStr);
                 fetchReports(start, todayStr);
             }
        };

        if (timeFilter !== 'custom' && (venue || timeFilter !== 'daily')) {
            calculateOperationalDates();
        }
    }, [timeFilter, venue]);

    const handleApplyCustomFilter = () => {
        setTimeFilter('custom');
        fetchReports(startDate, endDate);
    };

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || (window.location.origin.includes('localhost') ? 'http://localhost:3000' : window.location.origin.replace(':5173', ':3000'));
        const socket = io(socketUrl);

        const handleUpdate = () => {
            // Pass dates explicitly — socket useEffect re-mounts when dates change,
            // so startDate/endDate captured here are always fresh
            fetchReports(startDate, endDate);
            fetchTransactions(txFilter, txStartDate, txEndDate);
        };

        socket.on('sessions:updated', handleUpdate);
        socket.on('orders:updated', handleUpdate);
        socket.on('expenses:updated', handleUpdate);
        socket.on('waitlist:updated', handleUpdate);
        socket.on('tables:updated', handleUpdate);
        socket.on('members:updated', handleUpdate);

        return () => {
            socket.disconnect();
        };
    }, [timeFilter, startDate, endDate, txFilter, txStartDate, txEndDate]);

    // ─── Transaction List Fetch ─────────────────────────────────────────────
    const fetchTransactions = async (filter = txFilter, sd = txStartDate, ed = txEndDate) => {
        setTxLoading(true);
        try {
            let query = '';
            const todayStr = new Date().toISOString().split('T')[0];

            if (filter === 'custom') {
                query = `?startDate=${sd}&endDate=${ed}`;
            } else {
                let startStr: string;
                if (filter === 'daily') {
                    const now = new Date();
                    const openHour = venue?.openTime ? parseInt(venue.openTime.split(':')[0]) : 10;
                    const reportDate = new Date();
                    if (now.getHours() < openHour) reportDate.setDate(reportDate.getDate() - 1);
                    startStr = reportDate.toISOString().split('T')[0];
                } else if (filter === 'weekly') {
                    startStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                } else {
                    startStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                }
                // Always include endDate so backend always sets lteDate
                query = `?startDate=${startStr}&endDate=${todayStr}`;
            }
            const res = await api.get(`/reports/transactions${query}`);
            setTransactions(res.data.data || []);
        } catch (err) {
            console.error('Failed to load transactions', err);
        } finally {
            setTxLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleTxFilterChange = (f: 'daily' | 'weekly' | 'monthly' | 'custom') => {
        const todayStr = new Date().toISOString().split('T')[0];
        let newStart = todayStr;

        if (f === 'daily') {
            const now = new Date();
            const openHour = venue?.openTime ? parseInt(venue.openTime.split(':')[0]) : 9;
            const reportDate = new Date();
            if (now.getHours() < openHour) reportDate.setDate(reportDate.getDate() - 1);
            newStart = reportDate.toISOString().split('T')[0];
        } else if (f === 'weekly') {
            newStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        } else if (f === 'monthly') {
            newStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }

        setTxFilter(f);
        setTxStartDate(newStart);
        setTxEndDate(todayStr);
        if (f !== 'custom') fetchTransactions(f, newStart, todayStr);
    };

    const exportTransactionPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        // Header
        doc.setFillColor(10, 10, 10);
        doc.rect(0, 0, 297, 40, 'F');
        doc.setTextColor(0, 255, 102);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('VAMOS POS', 15, 18);
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(11);
        doc.text('Daftar Transaksi', 15, 27);
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        const periodText = txFilter === 'custom' ? `${txStartDate} sampai ${txEndDate}` : txFilter === 'daily' ? 'Hari Ini' : txFilter === 'weekly' ? '7 Hari Terakhir' : '30 Hari Terakhir';
        doc.text(`Dicetak: ${dateStr} ${timeStr}  |  Periode: ${periodText}`, 15, 35);

        // Summary
        const totalRevenue = filteredTransactions.reduce((s, t) => s + (t.totalAmount || 0), 0);
        const totalTableRev = filteredTransactions.reduce((s, t) => s + (t.tableAmount || 0), 0);
        const totalFnbRev = filteredTransactions.reduce((s, t) => s + (t.fnbAmount || 0), 0);
        const totalHours = filteredTransactions.reduce((s, t) => s + (t.durationMinutes || 0), 0);
        doc.setTextColor(0, 255, 102);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total ${filteredTransactions.length} transaksi | Revenue: Rp ${Math.round(totalRevenue).toLocaleString('id-ID')} | Meja: Rp ${Math.round(totalTableRev).toLocaleString('id-ID')} | F&B: Rp ${Math.round(totalFnbRev).toLocaleString('id-ID')} | Total Jam: ${(totalHours / 60).toFixed(1)} Jam`, 15, 46);

        autoTable(doc, {
            startY: 52,
            head: [['#', 'Waktu', 'Member / Tamu', 'Meja', 'Lama', 'Bill Meja', 'Bill F&B', 'Detail Items (F&B)', 'Total', 'Metode']],
            body: filteredTransactions.map((t, i) => {
                const orderedItems = Object.entries(t.orderSummary || {})
                    .map(([name, qty]) => `${qty}x ${name}`)
                    .join(', ');

                return [
                    `${i + 1}`,
                    t.endTime ? new Date(t.endTime).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-',
                    t.memberName || 'Walk-in',
                    `${t.tableName}`,
                    `${Math.floor((t.durationMinutes || 0) / 60)}j ${(t.durationMinutes || 0) % 60}m`,
                    `Rp ${Math.round(t.tableAmount || 0).toLocaleString('id-ID')}`,
                    `Rp ${Math.round(t.fnbAmount || 0).toLocaleString('id-ID')}`,
                    orderedItems || '-',
                    `Rp ${Math.round(t.totalAmount || 0).toLocaleString('id-ID')}`,
                    t.paymentMethod || 'CASH',
                ];
            }),
            foot: [[
                '', '', '', '', 'TOTAL',
                `Rp ${Math.round(totalTableRev).toLocaleString('id-ID')}`,
                `Rp ${Math.round(totalFnbRev).toLocaleString('id-ID')}`,
                '',
                `Rp ${Math.round(totalRevenue).toLocaleString('id-ID')}`,
                ''
            ]],
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [20, 20, 20], textColor: [0, 255, 102], fontStyle: 'bold', fontSize: 7 },
            footStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
            alternateRowStyles: { fillColor: [248, 250, 248] },
            columnStyles: {
                0: { cellWidth: 7 },
                1: { cellWidth: 22 },
                2: { cellWidth: 30 },
                3: { cellWidth: 15 },
                4: { cellWidth: 15 },
                5: { cellWidth: 24, halign: 'right' },
                6: { cellWidth: 22, halign: 'right' },
                7: { cellWidth: 65 },
                8: { cellWidth: 25, halign: 'right' },
                9: { cellWidth: 15, halign: 'center' },
            }
        });

        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Vamos POS — Confidential | Page ${i} of ${pageCount}`, 15, 200);
        }

        doc.save(`vamos-transaksi-${txFilter}-${now.toISOString().slice(0, 10)}.pdf`);
    };

    const kpis = useMemo(() => {
        if (!revenue30.length) return { todayTotal: 0, todayNet: 0, todayTable: 0, todayFnb: 0, todayOther: 0, monthTable: 0, monthFnb: 0, monthOther: 0, monthNet: 0, monthQrisCount: 0, monthQrisRevenue: 0, growth: 0, todayExpenses: 0, todayProfit: 0, monthExpenses: 0 };

        const todayData = revenue30[revenue30.length - 1];
        const yesterdayData = revenue30.length > 1 ? revenue30[revenue30.length - 2] : null;

        let monthTable = 0, monthFnb = 0, monthOther = 0, monthNet = 0, monthExpenses = 0, monthQrisCount = 0, monthQrisRevenue = 0;
        
        const periodStartIdx = timeFilter === 'daily' && revenue30.length > 1 ? revenue30.length - 1 : 0;
        
        for (let i = periodStartIdx; i < revenue30.length; i++) {
            const r = revenue30[i];
            monthTable += Number(r.tableRevenue || 0);
            monthFnb += Number(r.fnbRevenue || 0);
            monthOther += Number(r.otherRevenue || 0);
            monthNet += Number(r.totalRevenue || 0);
            monthExpenses += Number(r.totalExpenses || 0);
            monthQrisCount += Number(r.qrisCount || 0);
            monthQrisRevenue += Number(r.qrisRevenue || 0);
        }

        const todayNet = todayData?.totalRevenue || 0;
        const todayExpenses = todayData?.totalExpenses || 0;
        const todayProfit = todayNet - todayExpenses;
        const yesterdayNet = yesterdayData?.totalRevenue || 0;
        let growth = 0;
        if (yesterdayNet > 0) growth = ((todayNet - yesterdayNet) / yesterdayNet) * 100;
        else if (yesterdayNet === 0 && todayNet > 0) growth = 100;

        return {
            todayTable: todayData?.tableRevenue || 0,
            todayFnb: todayData?.fnbRevenue || 0,
            todayOther: todayData?.otherRevenue || 0,
            todayNet,
            todayExpenses,
            todayProfit,
            monthTable,
            monthFnb,
            monthOther,
            monthNet,
            monthExpenses,
            monthQrisCount,
            monthQrisRevenue,
            growth,
        };
    }, [revenue30, timeFilter]);

    const chartData = revenue30.map(r => {
        const d = new Date(r.date);
        return {
            ...r,
            displayDate: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`
        };
    });

    // ─── PDF Export ──────────────────────────────────────────────────────────
    const exportPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        // Header
        doc.setFillColor(10, 10, 10);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(0, 255, 102);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('VAMOS POS', 15, 18);
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(11);
        doc.text('Reports & Analytics', 15, 27);
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        const periodText = timeFilter === 'custom' ? `${startDate} to ${endDate}` : timeFilter;
        doc.text(`Generated: ${dateStr} ${timeStr}  |  Period: ${periodText}`, 15, 35);

        let y = 50;

        // KPI Summary
        doc.setTextColor(0, 255, 102);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Financial Summary', 15, y);
        y += 6;

        autoTable(doc, {
            startY: y,
            head: [['Metric', 'Value']],
            body: [
                [`${timeFilter === 'custom' ? 'Custom Period' : timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Total Revenue`, `Rp ${Math.round(kpis.monthNet).toLocaleString('id-ID')}`],
                ['Table Revenue', `Rp ${Math.round(kpis.monthTable).toLocaleString('id-ID')}`],
                ['F&B Revenue', `Rp ${Math.round(kpis.monthFnb).toLocaleString('id-ID')}`],
                ['Other Income (Tournament/Misc)', `Rp ${Math.round(kpis.monthOther).toLocaleString('id-ID')}`],
                ["Today's Revenue", `Rp ${Math.round(kpis.todayNet).toLocaleString('id-ID')}`],
                ["Today's Expenses", `Rp ${Math.round(kpis.todayExpenses).toLocaleString('id-ID')}`],
                ["Today's Physical Cash (Laci)", `Rp ${Math.round(todayCashRevenue).toLocaleString('id-ID')}`],
                ['Daily Growth', `${kpis.growth >= 0 ? '+' : ''}${kpis.growth.toFixed(1)}%`],
            ],
            styles: { fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: [20, 20, 20], textColor: [0, 255, 102], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        y = (doc as any).lastAutoTable.finalY + 10;

        // Table Performance
        if (utilization.length > 0) {
            doc.setTextColor(0, 170, 255);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('Table Performance & Popularity', 15, y);
            y += 6;

            autoTable(doc, {
                startY: y,
                head: [['Table Name', 'Hours', 'Sessions', 'Revenue']],
                body: utilization.sort((a, b) => b.totalRevenue - a.totalRevenue).map(u => [
                    u.tableName || '-',
                    `${((u.totalMinutes || 0) / 60).toFixed(1)} hrs`,
                    `${u.totalSessions || 0}`,
                    `Rp ${Math.round(u.totalRevenue || 0).toLocaleString('id-ID')}`,
                ]),
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [0, 80, 150], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [240, 250, 255] },
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        }

        y = (doc as any).lastAutoTable.finalY + 10;

        // Revenue Trend Table
        if (revenue30.length > 0) {
            doc.setTextColor(0, 170, 255);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('Revenue & Profit Trend (Daily)', 15, y);
            y += 6;

            autoTable(doc, {
                startY: y,
                head: [['Date', 'Table Rev', 'F&B Rev', 'Total Rev', 'Expenses', 'Net Profit']],
                body: revenue30.slice(-15).map(r => [
                    new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                    `Rp ${Math.round(r.tableRevenue || 0).toLocaleString('id-ID')}`,
                    `Rp ${Math.round(r.fnbRevenue || 0).toLocaleString('id-ID')}`,
                    `Rp ${Math.round(r.totalRevenue || 0).toLocaleString('id-ID')}`,
                    `Rp ${Math.round(r.totalExpenses || 0).toLocaleString('id-ID')}`,
                    `Rp ${Math.round(r.netRevenue || 0).toLocaleString('id-ID')}`,
                ]),
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: [0, 60, 100], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 248, 255] },
                columnStyles: {
                    5: { fontStyle: 'bold', textColor: [0, 120, 0] } // Style for Net Profit
                }
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        }

        // Top Spenders
        if (topPlayers.length > 0) {
            if (y > 230) { doc.addPage(); y = 20; }
            doc.setTextColor(255, 153, 0);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('Top Spenders', 15, y);
            y += 6;

            autoTable(doc, {
                startY: y,
                head: [['#', 'Player Name', 'Sessions', 'Amount Spent']],
                body: topPlayers.map((p, i) => [
                    `#${i + 1}`,
                    p.name || 'Walk-in',
                    `${p.totalSessions || 0}`,
                    `Rp ${Math.round(p.totalSpent || 0).toLocaleString('id-ID')}`,
                ]),
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [80, 40, 0], textColor: [255, 153, 0] },
                alternateRowStyles: { fillColor: [255, 251, 240] },
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        }

        // Top F&B Products
        if (topProducts.length > 0) {
            if (y > 230) { doc.addPage(); y = 20; }
            doc.setTextColor(255, 80, 80);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('F&B Sales Performance', 15, y);
            y += 6;

            autoTable(doc, {
                startY: y,
                head: [['#', 'Product Name', 'Category', 'Units Sold', 'Revenue']],
                body: topProducts.map((p, i) => [
                    `#${i + 1}`,
                    p.product?.name || '-',
                    p.product?.category || '-',
                    `${p.quantitySold || 0}`,
                    `Rp ${Math.round(p.revenue || 0).toLocaleString('id-ID')}`,
                ]),
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [80, 20, 20], textColor: [255, 100, 100] },
                alternateRowStyles: { fillColor: [255, 245, 245] },
            });
        }

        // Table Utilization
        if (utilization.length > 0) {
            doc.addPage();
            y = 20;
            doc.setTextColor(0, 170, 255);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('Table Utilization', 15, y);
            y += 6;

            autoTable(doc, {
                startY: y,
                head: [['Table Name', 'Total Minutes', 'Hours', 'Sessions']],
                body: utilization.map(u => [
                    u.tableName || '-',
                    `${u.totalMinutes || 0} min`,
                    `${((u.totalMinutes || 0) / 60).toFixed(1)} hrs`,
                    `${u.totalSessions || 0}`,
                ]),
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [0, 40, 80], textColor: [0, 170, 255] },
                alternateRowStyles: { fillColor: [240, 248, 255] },
            });
        }

        // Expense Breakdown
        const allExpenses: Record<string, number> = {};
        revenue30.forEach(r => {
            if (r.expenseDistribution) {
                Object.entries(r.expenseDistribution).forEach(([cat, amt]) => {
                    allExpenses[cat] = (allExpenses[cat] || 0) + (amt as number);
                });
            }
        });

        if (Object.keys(allExpenses).length > 0) {
            doc.addPage();
            y = 20;
            doc.setTextColor(255, 50, 50);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('Expense Distribution', 15, y);
            y += 6;

            autoTable(doc, {
                startY: y,
                head: [['Category', 'Total Amount', 'Percentage']],
                body: Object.entries(allExpenses).map(([cat, amt]) => [
                    cat,
                    `Rp ${Math.round(amt).toLocaleString('id-ID')}`,
                    `${((amt / kpis.monthExpenses) * 100).toFixed(1)}%`
                ]),
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [100, 20, 20], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [255, 245, 245] },
            });
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Vamos POS — Confidential | Page ${i} of ${pageCount}`, 15, 290);
        }

        doc.save(`vamos-report-${timeFilter}-${now.toISOString().slice(0, 10)}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-white">
                <div className="text-gray-500 flex flex-col items-center">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#00ff66]" />
                    <p className="font-mono text-sm tracking-widest">GENERATING ANALYTICS...</p>
                </div>
            </div>
        );
    }

    const getRevenueTrendLabel = () => {
        if (timeFilter === 'daily') return 'Today & Yesterday';
        if (timeFilter === 'weekly') return 'Last 7 Days';
        if (timeFilter === 'monthly') return 'Last 30 Days';
        return `${startDate} to ${endDate}`;
    };

    return (
        <div ref={reportRef} className="fade-in">

            {/* ─── Private Live Stats (moved from dashboard for privacy) ──── */}
            <div className="mb-4 text-xs font-mono text-gray-500 uppercase tracking-widest pl-4 border-l-2 border-[#00ff66]/30">
                INFO: Rekap Harian dihitung per Siklus Operasional ({venue?.openTime || '10:00'})
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {[
                    {
                        label: 'Revenue Hari Ini',
                        value: `Rp ${Math.round(todayRevenue).toLocaleString('id-ID')}`,
                        sub: 'Pendapatan hari ini',
                        icon: <BarChart3 className="w-5 h-5" />,
                        accent: '#00ff66',
                    },
                    {
                        label: 'Tagihan Pending',
                        value: `Rp ${Math.round(pendingBillsAmount).toLocaleString('id-ID')}`,
                        sub: pendingBillsCount > 0 ? `${pendingBillsCount} tagihan belum lunas` : 'Semua lunas ✓',
                        icon: <Receipt className="w-5 h-5" />,
                        accent: pendingBillsCount > 0 ? '#ff3333' : '#00ff66',
                    },
                    {
                        label: 'Total Pengeluaran',
                        value: `Rp ${Math.round(todayExpenses).toLocaleString('id-ID')}`,
                        sub: 'Pengeluaran operasional hari ini',
                        icon: <ArrowDownRight className="w-5 h-5" />,
                        accent: '#ff3333',
                    },
                    {
                        label: 'Total Cash Hari Ini',
                        value: `Rp ${Math.round(todayCashRevenue).toLocaleString('id-ID')}`,
                        sub: 'Revenue – QRIS – CARD – Pengeluaran (Est. Fisik di Laci)',
                        icon: <DollarSign className="w-5 h-5" />,
                        accent: '#ff9900',
                    },
                    {
                        label: 'Total Jam Bermain',
                        value: `${(parseFloat(utilizationSplit.dayHours) + parseFloat(utilizationSplit.nightHours)).toFixed(1)} Hrs`,
                        sub: `Siang: ${utilizationSplit.dayHours}j | Malam: ${utilizationSplit.nightHours}j`,
                        icon: <Clock className="w-5 h-5" />,
                        accent: '#00aaff',
                    },
                    {
                        label: 'Pemasukan Lain (Turnamen)',
                        value: `Rp ${Math.round(todayOtherRevenue).toLocaleString('id-ID')}`,
                        sub: 'Pemasukan manual/turnamen hari ini',
                        icon: <TrendingUp className="w-5 h-5" />,
                        accent: '#ff9900',
                    },
                    {
                        label: 'Transaksi QRIS',
                        value: `Rp ${Math.round(todayQrisRevenue).toLocaleString('id-ID')}`,
                        sub: 'Pemasukan hari ini via QRIS',
                        icon: <Activity className="w-5 h-5" />,
                        accent: '#ff33ff',
                    },
                ].map((card) => (
                    <div key={card.label} className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.01]" style={{ background: '#111', border: `1px solid ${card.accent}18` }}>
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${card.accent}12`, border: `1px solid ${card.accent}20` }}>
                                <span style={{ color: card.accent }}>{card.icon}</span>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: card.accent, boxShadow: `0 0 6px ${card.accent}` }} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{card.label}</p>
                            <p className="text-[22px] font-black tracking-tight" style={{ color: card.accent }}>{card.value}</p>
                            <p className="text-[11px] text-gray-500 mt-1">{card.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── Header ──────────────────────────────────── */}
            <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
                <div className="flex items-center gap-4 bg-[#141414] border border-[#2a2a2a] p-2 rounded-2xl">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black text-gray-500 ml-2">From</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff66]"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black text-gray-500">To</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff66]"
                        />
                    </div>
                    <button
                        onClick={handleApplyCustomFilter}
                        className="bg-[#00ff66]/10 hover:bg-[#00ff66]/20 text-[#00ff66] px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-[#00ff66]/20"
                    >
                        Apply Filter
                    </button>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Time Filter */}
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-1 flex items-center">
                        {(['daily', 'weekly', 'monthly', 'custom'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setTimeFilter(f)}
                                className="px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all"
                                style={{
                                    background: timeFilter === f ? '#00ff66' : 'transparent',
                                    color: timeFilter === f ? '#0a0a0a' : '#6b7280'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Export PDF */}
                    <button
                        onClick={exportPDF}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                        style={{ background: '#00ff66', color: '#0a0a0a', boxShadow: '0 0 18px rgba(0,255,102,0.3)' }}
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* ─── KPI Cards ────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                {[
                    {
                        label: `${timeFilter === 'daily' || timeFilter === 'custom' && startDate === endDate ? 'Today' : 'Period'} Net Income`,
                        value: `Rp ${Math.round(kpis.todayProfit).toLocaleString('id-ID')}`,
                        sub: `Rev: Rp ${Math.round(kpis.todayNet).toLocaleString('id-ID')} - Exp: Rp ${Math.round(kpis.todayExpenses).toLocaleString('id-ID')}`,
                        icon: <Activity className="w-7 h-7 text-[#00ff66]" />,
                        accent: '#00ff66',
                        targetId: 'revenue-log-section'
                    },
                    {
                        label: `${timeFilter === 'daily' || timeFilter === 'custom' && startDate === endDate ? 'Today' : 'Period'} Total Revenue`,
                        value: `Rp ${Math.round(kpis.monthNet).toLocaleString('id-ID')}`,
                        sub: `Tab: Rp ${Math.round(kpis.monthTable).toLocaleString('id-ID')} · F&B: Rp ${Math.round(kpis.monthFnb).toLocaleString('id-ID')} · Other: Rp ${Math.round(kpis.monthOther).toLocaleString('id-ID')}`,
                        icon: <DollarSign className="w-7 h-7 text-[#00ff66]" />,
                        accent: '#00ff66',
                        targetId: 'revenue-trend-section'
                    },
                    {
                        label: "Trend vs Yesterday",
                        value: `Rp ${Math.round(kpis.todayNet).toLocaleString('id-ID')}`,
                        sub: (
                            <div className="flex items-center gap-1">
                                {kpis.growth >= 0 ? <ArrowUpRight className="w-4 h-4 text-[#00ff66]" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                                <span className={kpis.growth >= 0 ? 'text-[#00ff66]' : 'text-red-500'}>
                                    {kpis.growth.toFixed(1)}% growth
                                </span>
                            </div>
                        ),
                        icon: <TrendingUp className="w-7 h-7 text-[#00ff66]" />,
                        accent: '#00ff66',
                        targetId: 'revenue-log-section'
                    },
                    {
                        label: `${timeFilter === 'daily' || timeFilter === 'custom' && startDate === endDate ? 'Today' : 'Period'} Table Bill`,
                        value: `Rp ${Math.round(kpis.monthTable).toLocaleString('id-ID')}`,
                        sub: "Billiard sessions only",
                        icon: <Activity className="w-7 h-7 text-[#00aaff]" />,
                        accent: '#00aaff',
                        targetId: 'table-performance-section'
                    },
                    {
                        label: `${timeFilter === 'daily' || timeFilter === 'custom' && startDate === endDate ? 'Today' : 'Period'} F&B Bill`,
                        value: `Rp ${Math.round(kpis.monthFnb).toLocaleString('id-ID')}`,
                        sub: "Food & Beverage sales",
                        icon: <Utensils className="w-7 h-7 text-[#ff9900]" />,
                        accent: '#ff9900',
                        targetId: 'fnb-performance-section'
                    },
                    {
                        label: `${timeFilter === 'daily' || timeFilter === 'custom' && startDate === endDate ? 'Today' : 'Period'} Trx QRIS`,
                        value: `Rp ${Math.round(kpis.monthQrisRevenue).toLocaleString('id-ID')}`,
                        sub: `Total dari ${kpis.monthQrisCount} transaksi QRIS`,
                        icon: <Activity className="w-7 h-7 text-[#ff33ff]" />,
                        accent: '#ff33ff',
                        targetId: 'transaction-list-section'
                    }
                ].map((card, i) => (
                    <div key={i}
                        onClick={() => document.getElementById(card.targetId)?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-[#141414] border border-[#222] rounded-2xl p-5 relative overflow-hidden group transition-all hover:border-opacity-60 cursor-pointer active:scale-95"
                        style={{ '--accent': card.accent } as any}
                    >
                        <div className="absolute -right-3 -top-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            {card.icon}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            {card.icon}
                            <p className="text-gray-400 text-xs font-semibold">{card.label}</p>
                        </div>
                        <h3 className="text-2xl font-black font-mono" style={{ color: card.accent }}>{card.value}</h3>
                        {card.sub && <p className="text-[11px] text-gray-500 mt-2">{card.sub}</p>}
                    </div>
                ))}
            </div>

            {/* ─── Revenue Chart ────────────────────────────── */}
            <div id="revenue-trend-section" className="bg-[#141414] border border-[#222] rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-5 h-5 text-[#00ff66]" />
                    <h2 className="text-lg font-bold">Revenue Trend
                        <span className="text-gray-500 font-normal text-sm ml-2">
                            ({getRevenueTrendLabel()})
                        </span>
                    </h2>
                </div>
                <p className="text-xs text-gray-500 mb-6">Financial trajectory and growth over the selected period.</p>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00ff66" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00ff66" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorFnb" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff9900" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#ff9900" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="displayDate" stroke="#333" tick={{ fill: '#666', fontSize: 11 }} tickMargin={8} />
                            <YAxis stroke="#333" tick={{ fill: '#666', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#2a2a2a', borderRadius: '12px', fontSize: '12px' }}
                                formatter={(value: any, name: any) => {
                                    if (name === 'totalRevenue') return [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Total Revenue'];
                                    if (name === 'fnbRevenue') return [`Rp ${Number(value).toLocaleString('id-ID')}`, 'F&B Revenue'];
                                    return [value, name];
                                }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                            <Area type="monotone" dataKey="totalRevenue" name="totalRevenue" stroke="#00ff66" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNet)" dot={false} />
                            <Area type="monotone" dataKey="fnbRevenue" name="fnbRevenue" stroke="#ff9900" strokeWidth={2} fillOpacity={1} fill="url(#colorFnb)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ─── Revenue Detail Table ─────────────────────── */}
            <div id="revenue-log-section" className="bg-[#141414] border border-[#222] rounded-2xl mb-6 overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-[#222]">
                    <FileText className="w-5 h-5 text-[#00aaff]" />
                    <h2 className="font-bold text-base">Detailed Revenue Log</h2>
                    <span className="ml-auto text-xs text-gray-500 font-mono">{revenue30.length} records</span>
                </div>
                <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10" style={{ background: '#0f0f0f' }}>
                            <tr className="border-b border-[#222]">
                                {['Date', 'Table Rev', 'F&B Rev', 'Total (Omzet)', 'Expenses', 'Net Profit', 'Sessions'].map(col => (
                                    <th key={col} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-500">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[...revenue30].reverse().map((r, i) => (
                                <tr key={i}
                                    className="border-b border-[#1a1a1a] hover:bg-white/[0.04] transition-colors group"
                                >
                                    <td className="px-5 py-4 font-mono text-gray-400 text-xs">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-gray-600" />
                                            {new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 font-mono font-bold text-gray-300">
                                        Rp {Math.round(r.tableRevenue || 0).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-5 py-4 font-mono font-bold text-gray-400">
                                        Rp {Math.round(r.fnbRevenue || 0).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-5 py-4 bg-white/5">
                                        <span className="font-mono font-black text-white">
                                            Rp {Math.round(r.totalRevenue || 0).toLocaleString('id-ID')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 font-mono font-bold text-red-400">
                                        - Rp {Math.round(r.totalExpenses || 0).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className={`inline-block px-3 py-1 rounded-lg font-black font-mono text-xs ${r.netRevenue >= 0 ? 'bg-[#00ff66]/10 text-[#00ff66]' : 'bg-red-500/10 text-red-500'}`}>
                                            Rp {Math.round(r.netRevenue || 0).toLocaleString('id-ID')}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="px-2 py-0.5 rounded-md bg-[#1a1a1a] border border-[#333] text-gray-400 font-mono text-[10px] font-bold">
                                            {r.sessionCount || 0} SESS
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Bottom Grid: Utilization + Top Spenders ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Table Utilization Chart */}
                <div id="table-performance-section" className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#222]">
                        <Activity className="w-5 h-5 text-[#00aaff]" />
                        <div>
                            <h2 className="font-bold text-base">Table Performance Analysis</h2>
                            <p className="text-xs text-gray-500">Income and utilization by individual table</p>
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-[350px] custom-scrollbar">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10" style={{ background: '#0f0f0f' }}>
                                <tr className="border-b border-[#222]">
                                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 text-left">Table</th>
                                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 text-center">Hours</th>
                                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#00aaff] text-right text-xs">Income</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...utilization].sort((a, b) => b.totalRevenue - a.totalRevenue).map((u, i) => (
                                    <tr key={i} className="border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#00aaff]/10 border border-[#00aaff]/20 flex items-center justify-center text-[#00aaff] font-bold text-[10px]">
                                                    {u.tableName?.split(' ')[1] || 'T'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">{u.tableName}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black">{u.sessionCount} SESSIONS</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs font-mono text-gray-400">{((u.totalMinutes || 0) / 60).toFixed(1)}h</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <p className="font-bold font-mono text-[#00aaff]">Rp {Math.round(u.totalRevenue || 0).toLocaleString('id-ID')}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-[#0a0a0a] border-t border-[#222]">
                        <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest font-bold">Ranking based on gross table revenue</p>
                    </div>
                </div>

                {/* Top Spenders Table */}
                <div id="expense-breakdown-section" className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#222]">
                        <DollarSign className="w-5 h-5 text-red-500" />
                        <div>
                            <h2 className="font-bold text-base">Expense Breakdown</h2>
                            <p className="text-xs text-gray-500">Spending by category</p>
                        </div>
                    </div>
                    <div className="p-6 flex flex-col items-center justify-center flex-1">
                        {(() => {
                            const expenseMap: Record<string, number> = {};
                            revenue30.forEach(r => {
                                if (r.expenseDistribution) {
                                    Object.entries(r.expenseDistribution).forEach(([cat, amt]) => {
                                        expenseMap[cat] = (expenseMap[cat] || 0) + (amt as number);
                                    });
                                }
                            });
                            const pieData = Object.entries(expenseMap).map(([name, value]) => ({ name, value }));
                            const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

                            if (pieData.length === 0) return <p className="text-gray-500 text-sm italic">No expenses logged in this period.</p>;

                            return (
                                <>
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#222', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                                                    formatter={(v: any) => `Rp ${Number(v).toLocaleString('id-ID')}`}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                                        {pieData.map((d, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></div>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase truncate">{d.name}</span>
                                                <span className="text-[10px] text-gray-500 ml-auto">{((d.value / kpis.monthExpenses) * 100).toFixed(0)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* ─── F&B Products Table ───────────────────────── */}
            <div id="fnb-performance-section" className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden mb-6">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-[#222]">
                    <Utensils className="w-5 h-5 text-[#ff9900]" />
                    <div>
                        <h2 className="font-bold text-base">F&amp;B Sales Performance</h2>
                        <p className="text-xs text-gray-500">Menu items ranked by revenue generated</p>
                    </div>
                    <span className="ml-auto text-xs text-gray-600 font-mono">{topProducts.length} products</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead style={{ background: '#0f0f0f' }}>
                            <tr className="border-b border-[#222]">
                                {['Rank', 'Product Name', 'Category', 'Units Sold', 'Revenue'].map(col => (
                                    <th key={col} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.map((prod, i) => (
                                <tr key={i} className="border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-3.5">
                                        <span className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                                            style={{
                                                background: i < 3 ? 'rgba(255,153,0,0.15)' : 'rgba(255,255,255,0.05)',
                                                color: i < 3 ? '#ff9900' : '#6b7280',
                                                border: i < 3 ? '1px solid rgba(255,153,0,0.3)' : '1px solid rgba(255,255,255,0.05)'
                                            }}>
                                            #{i + 1}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 font-semibold text-white">{prod.product?.name || '-'}</td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-xs px-2 py-1 rounded-full font-bold"
                                            style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>
                                            {prod.product?.category || '-'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 font-mono text-gray-300">{prod.quantitySold || 0} units</td>
                                    <td className="px-5 py-3.5 font-black font-mono text-[#ff9900]">
                                        Rp {Math.round(prod.revenue || 0).toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                            {topProducts.length === 0 && (
                                <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-600 text-sm">No F&B sales data yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Transaction List ───────────────────────────────────────── */}
            <div id="transaction-list-section" className="mt-10 bg-[#141414] border border-[#1e1e1e] rounded-3xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1e1e1e] bg-white/[0.02]">
                    <div>
                        <h3 className="text-2xl font-black text-white flex items-center gap-3">
                            <FileText className="w-6 h-6 text-[#00ff66]" /> Daftar Transaksi
                        </h3>
                        <p className="text-gray-500 text-xs mt-1 font-mono">
                            {filteredTransactions.length} transaksi · Total Rp {Math.round(filteredTransactions.reduce((s, t) => s + (t.totalAmount || 0), 0)).toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="bg-[#0a0a0a] border border-[#333] rounded-xl p-1 flex items-center">
                            {(['daily', 'weekly', 'monthly'] as const).map(f => (
                                <button key={f} onClick={() => handleTxFilterChange(f)}
                                    className="px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
                                    style={{ background: txFilter === f ? '#00ff66' : 'transparent', color: txFilter === f ? '#0a0a0a' : '#6b7280' }}>
                                    {f === 'daily' ? 'Harian' : f === 'weekly' ? 'Mingguan' : 'Bulanan'}
                                </button>
                            ))}
                        </div>
                        <div className="bg-[#0a0a0a] border border-[#333] rounded-xl p-1 flex items-center">
                            {(['ALL', 'CASH', 'QRIS'] as const).map(m => (
                                <button key={m} onClick={() => setTxPaymentMethod(m)}
                                    className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all"
                                    style={{ background: txPaymentMethod === m ? '#00aaff' : 'transparent', color: txPaymentMethod === m ? '#0a0a0a' : '#6b7280' }}>
                                    {m}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] rounded-xl px-3 py-1.5">
                            <input type="date" value={txStartDate} onChange={e => setTxStartDate(e.target.value)} className="bg-transparent text-xs text-gray-400 focus:outline-none" />
                            <span className="text-gray-600 text-xs">→</span>
                            <input type="date" value={txEndDate} onChange={e => setTxEndDate(e.target.value)} className="bg-transparent text-xs text-gray-400 focus:outline-none" />
                            <button onClick={() => { setTxFilter('custom'); fetchTransactions('custom', txStartDate, txEndDate); }}
                                className="px-3 py-1 bg-[#00ff66]/10 text-[#00ff66] text-xs font-bold rounded-lg border border-[#00ff66]/20 hover:bg-[#00ff66]/20 transition-all">Filter</button>
                        </div>
                        <button onClick={exportTransactionPDF}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                            style={{ background: '#00ff66', color: '#0a0a0a', boxShadow: '0 0 15px rgba(0,255,102,0.2)' }}>
                            <Download className="w-4 h-4" /> Export PDF
                        </button>
                    </div>
                </div>

                {/* Summary bar */}
                {filteredTransactions.length > 0 && (
                    <div className="px-8 py-4 flex gap-8 flex-wrap border-b border-[#1a1a1a] bg-[#111]">
                        {[
                            { label: 'Total Transaksi', value: filteredTransactions.length, color: '#00aaff', mono: false },
                            { label: 'Revenue Meja', value: `Rp ${Math.round(filteredTransactions.reduce((s, t) => s + (t.tableAmount || 0), 0)).toLocaleString('id-ID')}`, color: '#7c3aed', mono: true },
                            { label: 'Revenue F&B', value: `Rp ${Math.round(filteredTransactions.reduce((s, t) => s + (t.fnbAmount || 0), 0)).toLocaleString('id-ID')}`, color: '#ff9900', mono: true },
                            { label: 'Total Revenue', value: `Rp ${Math.round(filteredTransactions.reduce((s, t) => s + (t.totalAmount || 0), 0)).toLocaleString('id-ID')}`, color: '#00ff66', mono: true },
                            { label: 'Total Jam Main', value: `${(filteredTransactions.reduce((s, t) => s + (t.durationMinutes || 0), 0) / 60).toFixed(1)} Jam`, color: '#ff3333', mono: true },
                        ].map(item => (
                            <div key={item.label}>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.label}</p>
                                <p className={`text-lg font-black mt-0.5 ${item.mono ? 'font-mono' : ''}`} style={{ color: item.color }}>{item.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-[#1a1a1a]">
                                {['#', 'Waktu', 'Member / Tamu', 'Meja', 'Lama Main', 'Paket', 'Bill Meja', 'F&B', 'Total', 'Pembayaran', ''].map(h => (
                                    <th key={h} className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.15em] whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#141414]">
                            {txLoading ? (
                                <tr><td colSpan={10} className="px-5 py-16 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#00ff66] mx-auto mb-3" />
                                    <p className="text-gray-600 text-xs font-mono uppercase tracking-widest">Memuat transaksi...</p>
                                </td></tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr><td colSpan={10} className="px-5 py-20 text-center">
                                    <FileText className="w-14 h-14 opacity-10 mx-auto mb-4" />
                                    <p className="text-gray-500 font-bold">Tidak ada transaksi untuk periode ini</p>
                                    <p className="text-gray-600 text-xs mt-1">Coba ubah filter waktu atau metode pembayaran</p>
                                </td></tr>
                            ) : (
                                filteredTransactions.map((tx, i) => {
                                    const hours = Math.floor((tx.durationMinutes || 0) / 60);
                                    const mins = (tx.durationMinutes || 0) % 60;
                                    const isWalkIn = tx.memberName === 'Walk-in Guest';
                                    const isExpanded = expandedTx === tx.id;
                                    return (
                                        <React.Fragment key={tx.id}>
                                            <tr 
                                                onClick={() => setExpandedTx(isExpanded ? null : tx.id)}
                                                className={`cursor-pointer transition-colors ${isExpanded ? 'bg-[#00ff66]/5' : 'hover:bg-white/[0.02]'}`}
                                            >
                                                <td className="px-5 py-4">
                                                    <span className="w-7 h-7 rounded-lg bg-[#222] text-gray-500 text-xs font-black flex items-center justify-center border border-white/5">{i + 1}</span>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <p className="text-white font-bold text-xs">
                                                        {tx.endTime ? new Date(tx.endTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                    </p>
                                                    <p className="text-gray-500 font-mono text-[10px] mt-0.5">
                                                        {tx.startTime ? new Date(tx.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '?'}
                                                        {' → '}
                                                        {tx.endTime ? new Date(tx.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '?'}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${isWalkIn ? 'bg-gray-800 text-gray-500' : 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20'}`}>
                                                            {isWalkIn ? '?' : tx.memberName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold text-xs ${isWalkIn ? 'text-gray-500' : 'text-white'}`}>{tx.memberName}</p>
                                                            {tx.memberPhone && tx.memberPhone !== '-' && (
                                                                <p className="text-[10px] text-gray-600 font-mono">{tx.memberPhone}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <p className="text-white font-bold text-xs">{tx.tableName}</p>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${tx.tableType === 'VVIP' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        tx.tableType === 'VIP' ? 'bg-[#ff9900]/10 text-[#ff9900] border-[#ff9900]/20' :
                                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                        }`}>{tx.tableType}</span>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-[#00aaff]" />
                                                        <span className="font-black text-[#00aaff] font-mono text-sm">
                                                            {hours}<span className="text-[10px] font-bold text-gray-500 ml-0.5">j</span> {mins}<span className="text-[10px] font-bold text-gray-500 ml-0.5">m</span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${tx.packageName ? 'bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/20' : 'bg-gray-700/20 text-gray-500 border-gray-700/20'}`}>
                                                        {tx.packageName || 'Open Bill'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 font-mono font-black text-white text-right whitespace-nowrap">
                                                    Rp {Math.round(tx.tableAmount || 0).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-5 py-4 font-mono font-bold text-[#ff9900] text-right whitespace-nowrap">
                                                    {tx.fnbAmount > 0 ? `Rp ${Math.round(tx.fnbAmount).toLocaleString('id-ID')}` : <span className="text-gray-700">–</span>}
                                                </td>
                                                <td className="px-5 py-4 font-mono font-black text-[#00ff66] text-right whitespace-nowrap">
                                                    Rp {Math.round(tx.totalAmount || 0).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest border ${(tx.paymentMethod || '').includes('TRANSFER') || (tx.paymentMethod || '').includes('QRIS')
                                                        ? 'bg-[#00aaff]/10 text-[#00aaff] border-[#00aaff]/20'
                                                        : 'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/20'
                                                        }`}>
                                                        {tx.paymentMethod || 'CASH'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#00ff66]" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-[#111]/80 border-l-2 border-[#00ff66]">
                                                    <td colSpan={11} className="px-12 py-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                            {/* F&B Details */}
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                                    <Package className="w-3 h-3 text-[#ff9900]" /> Detail Order F&B
                                                                </h4>
                                                                {Object.keys(tx.orderSummary || {}).length > 0 ? (
                                                                    <div className="space-y-2">
                                                                        {Object.entries(tx.orderSummary).map(([name, qty]: any) => (
                                                                            <div key={name} className="flex justify-between items-center py-2 px-3 bg-[#1a1a1a] rounded-lg border border-white/5">
                                                                                <span className="text-xs text-gray-200 font-bold">{name}</span>
                                                                                <span className="text-xs font-black text-[#ff9900] font-mono">x{qty}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-xs text-gray-600 italic">Tidak ada order F&B pada sesi ini</p>
                                                                )}
                                                            </div>

                                                            {/* Session Details */}
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                                    <Activity className="w-3 h-3 text-[#00aaff]" /> Informasi Sesi
                                                                </h4>
                                                                <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
                                                                    <div className="px-4 py-3 border-b border-white/5 flex justify-between">
                                                                        <span className="text-[10px] text-gray-500">ID Sesi</span>
                                                                        <span className="text-[10px] font-mono text-gray-400">{tx.sessionId || '-'}</span>
                                                                    </div>
                                                                    <div className="px-4 py-3 border-b border-white/5 flex justify-between">
                                                                        <span className="text-[10px] text-gray-500">Total Durasi</span>
                                                                        <span className="text-xs font-bold text-white">{hours} Jam {mins} Menit</span>
                                                                    </div>
                                                                    <div className="px-4 py-3 border-b border-white/5 flex justify-between">
                                                                        <span className="text-[10px] text-gray-500">Tarif Meja</span>
                                                                        <span className="text-xs font-bold text-white">Rp {Math.round(tx.tableAmount).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="px-4 py-3 flex justify-between bg-[#00ff66]/5">
                                                                        <span className="text-[10px] text-gray-500">Petugas Kasir</span>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <User className="w-3 h-3 text-[#00ff66]" />
                                                                            <span className="text-xs font-bold text-[#00ff66]">{tx.cashierName || 'Sistem'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
