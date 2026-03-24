import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RefreshCw, Database, Download, Wrench, Shield,
    AlertTriangle, CheckCircle2, Loader2, ChevronRight, Zap, Clock, MessageSquare,
    Cpu, Wifi, WifiOff, Search, RotateCcw, CircleDot
} from 'lucide-react';
import { systemApi, relayApi } from '../services/api';
import type { RelayStatus, RelayPort } from '../services/api';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface ActionResult {
    message: string;
    details?: Record<string, any>;
}

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [resetStatus, setResetStatus] = useState<Status>('idle');
    const [seedStatus, setSeedStatus] = useState<Status>('idle');
    const [fixStatus, setFixStatus] = useState<Status>('idle');
    const [exportStatus, setExportStatus] = useState<Status>('idle');
    const [result, setResult] = useState<ActionResult | null>(null);
    const [confirmReset, setConfirmReset] = useState(false);

    // ── Relay Hardware State ───────────────────────────────────────────
    const [relayStatus, setRelayStatus] = useState<RelayStatus | null>(null);
    const [relayLoading, setRelayLoading] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);
    const [reconnectLoading, setReconnectLoading] = useState(false);
    const [scannedPorts, setScannedPorts] = useState<RelayPort[]>([]);
    const [showPort, setShowPort] = useState(false);
    const [relayMsg, setRelayMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchRelayStatus = useCallback(async () => {
        try {
            setRelayLoading(true);
            const res = await relayApi.getStatus();
            setRelayStatus(res.data.data);
        } catch (_) {
            // gagal ambil status, mungkin backend off
        } finally {
            setRelayLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRelayStatus();
        const interval = setInterval(fetchRelayStatus, 10000);
        return () => clearInterval(interval);
    }, [fetchRelayStatus]);

    const handleScanPorts = async () => {
        setScanLoading(true);
        setRelayMsg(null);
        try {
            const res = await relayApi.scanPorts();
            setScannedPorts(res.data.ports);
            setShowPort(true);
            setRelayMsg({
                type: 'success',
                text: `Ditemukan ${res.data.count} COM port di sistem.`,
            });
        } catch (e: any) {
            setRelayMsg({ type: 'error', text: e.response?.data?.message || 'Scan gagal.' });
        } finally {
            setScanLoading(false);
        }
    };

    const handleReconnect = async () => {
        setReconnectLoading(true);
        setRelayMsg(null);
        try {
            const res = await relayApi.reconnect();
            setRelayMsg({
                type: res.data.success ? 'success' : 'error',
                text: res.data.message,
            });
            if (res.data.success) fetchRelayStatus();
        } catch (e: any) {
            setRelayMsg({ type: 'error', text: e.response?.data?.message || 'Reconnect gagal.' });
        } finally {
            setReconnectLoading(false);
        }
    };

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleReset = async () => {
        if (!confirmReset) {
            setConfirmReset(true);
            return;
        }
        setResetStatus('loading');
        setResult(null);
        setConfirmReset(false);
        try {
            const res = await systemApi.reset();
            const d = (res.data as any);
            setResult({ message: d.message, details: d.details });
            setResetStatus('success');
        } catch (e: any) {
            setResult({ message: e.response?.data?.message || 'Reset gagal.' });
            setResetStatus('error');
        }
    };

    const handleSeed = async () => {
        setSeedStatus('loading');
        setResult(null);
        try {
            const res = await systemApi.seed();
            const d = (res.data as any);
            setResult({ message: d.message });
            setSeedStatus('success');
        } catch (e: any) {
            setResult({ message: e.response?.data?.message || 'Seed gagal.' });
            setSeedStatus('error');
        }
    };

    const handleFix = async () => {
        setFixStatus('loading');
        setResult(null);
        try {
            const res = await systemApi.fixTables();
            const d = (res.data as any);
            setResult({ message: d.message });
            setFixStatus('success');
        } catch (e: any) {
            setResult({ message: e.response?.data?.message || 'Fix gagal.' });
            setFixStatus('error');
        }
    };

    const handleExport = async () => {
        setExportStatus('loading');
        try {
            const res = await systemApi.export();
            const url = window.URL.createObjectURL(new Blob([res.data as any]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `backup-vamos-${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setExportStatus('success');
        } catch (e: any) {
            setExportStatus('error');
        }
    };

    const icon = (status: Status, size = 20) => {
        if (status === 'loading') return <Loader2 size={size} className="animate-spin" />;
        if (status === 'success') return <CheckCircle2 size={size} className="text-emerald-400" />;
        if (status === 'error') return <AlertTriangle size={size} className="text-rose-400" />;
        return null;
    };

    // ── Pricing Preview ───────────────────────────────────────────────────
    const pricingPreview = [
        { label: 'Siang', time: '09:00 – 17:00', rate: 'Rp 25.000/jam', color: '#f59e0b' },
        { label: 'Malam', time: '17:00 – 02:00', rate: 'Rp 35.000/jam', color: '#3b82f6' },
        { label: 'Dini Hari', time: '02:00 – 07:00', rate: 'Rp 30.000/jam', color: '#9333ea' },
    ];

    const packagePreview = [
        { label: 'Paket Siang 2 Jam', hari: 'Senin – Sabtu', time: '09:00 – 17:00', price: 'Rp 40.000', color: '#f59e0b' },
        { label: 'Paket Malam 2 Jam', hari: 'Senin – Jumat', time: '17:00 – 02:00', price: 'Rp 50.000', color: '#3b82f6' },
    ];

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="fade-in space-y-6 pb-6">

            {/* Header */}
            <div className="flex items-center gap-3 mt-2">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Shield size={20} className="text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight italic uppercase">Settings</h1>
                    <p className="text-sm font-bold text-slate-500">Manajemen Sistem & Database</p>
                </div>
            </div>

            {/* ── RESULT BANNER ─────────────────────────────────── */}
            {result && (
                <div className={`fiery-card p-4 border-l-4 flex items-start gap-3 ${resetStatus === 'error' || seedStatus === 'error' || fixStatus === 'error' || exportStatus === 'error'
                    ? 'border-l-rose-500'
                    : 'border-l-emerald-500'
                    }`}>
                    <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-white">{result.message}</p>
                        {result.details && (
                            <div className="mt-2 space-y-1">
                                {Object.entries(result.details).map(([k, v]) => (
                                    <p key={k} className="text-xs font-semibold text-slate-400">
                                        {k}: <span className="text-white">{String(v)}</span>
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── DEFAULT PRICING PREVIEW ───────────────────────── */}
            <div className="fiery-card p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-primary" />
                    <p className="text-base font-black text-white">Harga Default (Tabel REGULAR)</p>
                </div>
                {pricingPreview.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-[#0e111a] border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                            <div>
                                <p className="text-sm font-black text-white">{p.label}</p>
                                <p className="text-xs font-bold text-slate-500">{p.time}</p>
                            </div>
                        </div>
                        <p className="text-sm font-black text-white">{p.rate}</p>
                    </div>
                ))}
            </div>

            {/* ── DEFAULT PACKAGES PREVIEW ──────────────────────── */}
            <div className="fiery-card p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Zap size={16} className="text-primary" />
                    <p className="text-base font-black text-white">Paket Default (Diluar Malam Minggu)</p>
                </div>
                {packagePreview.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-[#0e111a] border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                            <div>
                                <p className="text-sm font-black text-white">{p.label}</p>
                                <p className="text-xs font-bold text-slate-500">{p.hari} · {p.time}</p>
                            </div>
                        </div>
                        <p className="text-sm font-black text-white">{p.price}</p>
                    </div>
                ))}
            </div>

            {/* ── RELAY HARDWARE ────────────────────────────────── */}
            <div className="fiery-card p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-primary" />
                        <p className="text-base font-black text-white">Hardware Relay</p>
                    </div>
                    <button
                        onClick={fetchRelayStatus}
                        disabled={relayLoading}
                        className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90"
                        title="Refresh status"
                    >
                        {relayLoading
                            ? <Loader2 size={13} className="animate-spin text-slate-400" />
                            : <RotateCcw size={13} className="text-slate-400" />}
                    </button>
                </div>

                {/* Status Badge */}
                {relayStatus ? (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0e111a] border border-white/5">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            relayStatus.isConnected
                                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse'
                                : 'bg-rose-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white">
                                {relayStatus.isConnected ? '🟢 Terhubung' : relayStatus.isScanning ? '🔍 Scanning...' : '🔴 Tidak Terhubung'}
                            </p>
                            <p className="text-xs font-bold text-slate-500 truncate">
                                Port: <span className="text-slate-300">{relayStatus.port ?? relayStatus.lastKnownPort ?? '—'}</span>
                                {relayStatus.isScanning && <span className="ml-2 text-yellow-400">Auto-detecting...</span>}
                            </p>
                        </div>
                        {relayStatus.isConnected
                            ? <Wifi size={18} className="text-emerald-400 flex-shrink-0" />
                            : <WifiOff size={18} className="text-rose-400 flex-shrink-0" />}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0e111a] border border-white/5">
                        <CircleDot size={14} className="text-slate-600" />
                        <p className="text-xs font-bold text-slate-600">Memuat status relay...</p>
                    </div>
                )}

                {/* Relay Message */}
                {relayMsg && (
                    <div className={`p-3 rounded-2xl text-xs font-bold ${
                        relayMsg.type === 'success'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                    }`}>
                        {relayMsg.text}
                    </div>
                )}

                {/* Scanned Ports List */}
                {showPort && scannedPorts.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider">COM Ports Ditemukan</p>
                        {scannedPorts.map((p, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0e111a] border border-white/5">
                                <div>
                                    <p className="text-sm font-black text-white">{p.path}</p>
                                    {p.manufacturer && (
                                        <p className="text-xs font-bold text-slate-500">{p.manufacturer}</p>
                                    )}
                                </div>
                                {relayStatus?.port === p.path && (
                                    <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">ACTIVE</span>
                                )}
                            </div>
                        ))}
                        {scannedPorts.length === 0 && (
                            <p className="text-xs font-bold text-slate-600 text-center py-2">Tidak ada COM port ditemukan.</p>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        id="relay-scan-btn"
                        onClick={handleScanPorts}
                        disabled={scanLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
                    >
                        {scanLoading
                            ? <Loader2 size={15} className="animate-spin" />
                            : <Search size={15} />}
                        Scan Port
                    </button>
                    <button
                        id="relay-reconnect-btn"
                        onClick={handleReconnect}
                        disabled={reconnectLoading || relayStatus?.isScanning}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/20 border border-primary/30 text-primary font-black text-sm transition-all hover:bg-primary/30 active:scale-95 disabled:opacity-50"
                    >
                        {reconnectLoading
                            ? <Loader2 size={15} className="animate-spin" />
                            : <RefreshCw size={15} />}
                        Auto-Detect
                    </button>
                </div>
                <p className="text-xs font-bold text-slate-600 text-center">
                    Auto-Detect akan scan semua COM port &amp; simpan port yang berhasil ke database.
                </p>
            </div>

            {/* ── ACTIONS ───────────────────────────────────────── */}
            <div className="space-y-3">
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">Aksi Sistem</p>

                {/* Seed Pricing Only */}
                <button
                    onClick={handleSeed}
                    disabled={seedStatus === 'loading'}
                    className="fiery-card p-5 w-full flex items-center justify-between hover:bg-[#252b45] active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Database size={20} className="text-emerald-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-base font-black text-white">Seed Pricing & Paket</p>
                            <p className="text-xs font-bold text-slate-500">Reset harga & paket ke default, tanpa hapus data lain</p>
                        </div>
                    </div>
                    {icon(seedStatus) ?? <ChevronRight size={18} className="text-slate-600" />}
                </button>

                {/* WhatsApp Auto-Reply */}
                <button
                    onClick={() => navigate('/whatsapp-settings')}
                    className="fiery-card p-5 w-full flex items-center justify-between hover:bg-[#252b45] active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <MessageSquare size={20} className="text-emerald-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-base font-black text-white">WA Auto-Reply</p>
                            <p className="text-xs font-bold text-slate-500">Edit pesan otomatis WhatsApp</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-600" />
                </button>

                {/* Fix Stuck Tables */}
                <button
                    onClick={handleFix}
                    disabled={fixStatus === 'loading'}
                    className="fiery-card p-5 w-full flex items-center justify-between hover:bg-[#252b45] active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                            <Wrench size={20} className="text-yellow-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-base font-black text-white">Fix Meja Stuck</p>
                            <p className="text-xs font-bold text-slate-500">Reset meja PLAYING yang tidak punya sesi aktif</p>
                        </div>
                    </div>
                    {icon(fixStatus) ?? <ChevronRight size={18} className="text-slate-600" />}
                </button>

                {/* Export Backup */}
                <button
                    onClick={handleExport}
                    disabled={exportStatus === 'loading'}
                    className="fiery-card p-5 w-full flex items-center justify-between hover:bg-[#252b45] active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Download size={20} className="text-primary" />
                        </div>
                        <div className="text-left">
                            <p className="text-base font-black text-white">Export Backup</p>
                            <p className="text-xs font-bold text-slate-500">Download seluruh data database sebagai JSON</p>
                        </div>
                    </div>
                    {icon(exportStatus) ?? <ChevronRight size={18} className="text-slate-600" />}
                </button>

                {/* RESET — Danger Zone */}
                <div className="fiery-card p-5 border border-rose-500/20">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
                        <p className="text-sm font-black text-rose-400 uppercase tracking-wider">Zona Berbahaya</p>
                    </div>
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                            <RefreshCw size={20} className="text-rose-400" />
                        </div>
                        <div>
                            <p className="text-base font-black text-white">Reset Database</p>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">
                                Hapus semua Session, Payment, Member, dll. Pricing & Paket akan di-seed ulang otomatis.
                            </p>
                            <div className="mt-2 space-y-0.5">
                                {['Session & Payment', 'Member & Points', 'Order & Match', 'Expense & Shift', 'Waitlist & log'].map(item => (
                                    <p key={item} className="text-xs text-rose-400/70 font-bold">• {item} akan dihapus</p>
                                ))}
                            </div>
                        </div>
                    </div>

                    {confirmReset ? (
                        <div className="space-y-3">
                            <p className="text-sm font-black text-rose-300 text-center">
                                ⚠️ Yakin ingin reset? Tindakan ini tidak bisa dibatalkan!
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmReset(false)}
                                    className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm transition-all active:scale-95"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleReset}
                                    disabled={resetStatus === 'loading'}
                                    className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(239,68,68,0.4)] transition-all active:scale-95"
                                >
                                    {resetStatus === 'loading'
                                        ? <><Loader2 size={16} className="animate-spin" /> Resetting...</>
                                        : 'YA, RESET!'
                                    }
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleReset}
                            className="w-full py-3 rounded-2xl border-2 border-rose-500/30 text-rose-400 font-black text-sm uppercase tracking-wider transition-all hover:bg-rose-500/10 active:scale-95"
                        >
                            Reset Database
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Settings;
