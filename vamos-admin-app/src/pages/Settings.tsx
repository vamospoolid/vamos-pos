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
        } catch (_) {} finally {
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
            setRelayMsg({ type: 'success', text: `Ditemukan ${res.data.count} COM port.` });
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
            setRelayMsg({ type: res.data.success ? 'success' : 'error', text: res.data.message });
            if (res.data.success) fetchRelayStatus();
        } catch (e: any) {
            setRelayMsg({ type: 'error', text: e.response?.data?.message || 'Reconnect gagal.' });
        } finally {
            setReconnectLoading(false);
        }
    };

    const handleReset = async () => {
        if (!confirmReset) { setConfirmReset(true); return; }
        setResetStatus('loading'); setResult(null); setConfirmReset(false);
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
        setSeedStatus('loading'); setResult(null);
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
        setFixStatus('loading'); setResult(null);
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
            link.click(); link.remove();
            window.URL.revokeObjectURL(url);
            setExportStatus('success');
        } catch (e: any) {
            setExportStatus('error');
        }
    };

    const icon = (status: Status, size = 20) => {
        if (status === 'loading') return <Loader2 size={size} className="animate-spin" />;
        if (status === 'success') return <CheckCircle2 size={size} className="text-emerald-500" />;
        if (status === 'error') return <AlertTriangle size={size} className="text-rose-500" />;
        return null;
    };

    const pricingPreview = [
        { label: 'Siang', time: '09:00 – 17:00', rate: 'Rp 25.000/jam', color: '#f59e0b' },
        { label: 'Malam', time: '17:00 – 02:00', rate: 'Rp 35.000/jam', color: '#3b82f6' },
        { label: 'Dini Hari', time: '02:00 – 07:00', rate: 'Rp 30.000/jam', color: '#9333ea' },
    ];

    const packagePreview = [
        { label: 'Paket Siang 2 Jam', hari: 'Senin – Sabtu', time: '09:00 – 17:00', price: 'Rp 40.000', color: '#f59e0b' },
        { label: 'Paket Malam 2 Jam', hari: 'Senin – Jumat', time: '17:00 – 02:00', price: 'Rp 50.000', color: '#3b82f6' },
    ];

    return (
        <div className="space-y-6 pb-6">
            
            {/* Header Overlapping Blue Background */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-[28px] p-5 border border-white/20">
                <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                    <Shield size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-wide">System Settings</h1>
                    <p className="text-[13px] font-medium text-blue-100">Database & Hardware Management</p>
                </div>
            </div>

            {/* ── RESULT BANNER ─────────────────────────────────── */}
            {result && (
                <div className={`bg-white rounded-[24px] p-4 shadow-sm border-l-4 flex items-start gap-3 ${resetStatus === 'error' || seedStatus === 'error' || fixStatus === 'error' || exportStatus === 'error'
                    ? 'border-l-rose-500'
                    : 'border-l-emerald-500'
                    }`}>
                    <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-slate-800">{result.message}</p>
                        {result.details && (
                            <div className="mt-2 space-y-1">
                                {Object.entries(result.details).map(([k, v]) => (
                                    <p key={k} className="text-xs font-semibold text-slate-500">
                                        {k}: <span className="text-slate-800">{String(v)}</span>
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── DEFAULT PRICING PREVIEW ───────────────────────── */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-blue-600" />
                    <p className="text-base font-bold text-slate-800">Harga Default (Tabel REGULAR)</p>
                </div>
                {pricingPreview.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                            <div>
                                <p className="text-sm font-bold text-slate-800">{p.label}</p>
                                <p className="text-xs font-semibold text-slate-500">{p.time}</p>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-800">{p.rate}</p>
                    </div>
                ))}
            </div>

            {/* ── DEFAULT PACKAGES PREVIEW ──────────────────────── */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Zap size={18} className="text-blue-600" />
                    <p className="text-base font-bold text-slate-800">Paket Default</p>
                </div>
                {packagePreview.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                            <div>
                                <p className="text-sm font-bold text-slate-800">{p.label}</p>
                                <p className="text-xs font-semibold text-slate-500">{p.hari} · {p.time}</p>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-800">{p.price}</p>
                    </div>
                ))}
            </div>

            {/* ── RELAY HARDWARE ────────────────────────────────── */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Cpu size={18} className="text-blue-600" />
                        <p className="text-base font-bold text-slate-800">Hardware Relay</p>
                    </div>
                    <button
                        onClick={fetchRelayStatus}
                        disabled={relayLoading}
                        className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center transition-all active:scale-90 hover:bg-slate-200"
                    >
                        {relayLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                    </button>
                </div>

                {/* Status Badge */}
                {relayStatus ? (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            relayStatus.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800">
                                {relayStatus.isConnected ? 'Terhubung' : relayStatus.isScanning ? 'Scanning...' : 'Tidak Terhubung'}
                            </p>
                            <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                                Port: <span className="text-slate-700">{relayStatus.port ?? relayStatus.lastKnownPort ?? '—'}</span>
                                {relayStatus.isScanning && <span className="ml-2 text-amber-500">Auto-detecting...</span>}
                            </p>
                        </div>
                        {relayStatus.isConnected
                            ? <Wifi size={20} className="text-emerald-500 flex-shrink-0" />
                            : <WifiOff size={20} className="text-rose-500 flex-shrink-0" />}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <CircleDot size={16} className="text-slate-400" />
                        <p className="text-xs font-bold text-slate-500">Memuat status relay...</p>
                    </div>
                )}

                {/* Relay Message */}
                {relayMsg && (
                    <div className={`p-3 rounded-2xl text-xs font-bold ${
                        relayMsg.type === 'success'
                            ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                            : 'bg-rose-50 border border-rose-100 text-rose-600'
                    }`}>
                        {relayMsg.text}
                    </div>
                )}

                {/* Scanned Ports List */}
                {showPort && scannedPorts.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">COM Ports Ditemukan</p>
                        {scannedPorts.map((p, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{p.path}</p>
                                    {p.manufacturer && (
                                        <p className="text-xs font-semibold text-slate-500">{p.manufacturer}</p>
                                    )}
                                </div>
                                {relayStatus?.port === p.path && (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">ACTIVE</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleScanPorts}
                        disabled={scanLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50"
                    >
                        {scanLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                        Scan Port
                    </button>
                    <button
                        onClick={handleReconnect}
                        disabled={reconnectLoading || relayStatus?.isScanning}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-50 text-blue-600 font-bold text-sm transition-all hover:bg-blue-100 active:scale-95 disabled:opacity-50"
                    >
                        {reconnectLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        Auto-Detect
                    </button>
                </div>
            </div>

            {/* ── ACTIONS ───────────────────────────────────────── */}
            <div className="space-y-3">
                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider px-2">Aksi Sistem</p>

                {/* Seed Pricing Only */}
                <button
                    onClick={handleSeed}
                    disabled={seedStatus === 'loading'}
                    className="bg-white rounded-[24px] p-5 w-full flex items-center justify-between hover:shadow-md border border-slate-50 active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <Database size={22} />
                        </div>
                        <div className="text-left">
                            <p className="text-base font-bold text-slate-800">Seed Pricing</p>
                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Reset harga ke default</p>
                        </div>
                    </div>
                    {icon(seedStatus) ?? <ChevronRight size={20} className="text-slate-300" />}
                </button>

                {/* WhatsApp Auto-Reply */}
                <button
                    onClick={() => navigate('/whatsapp-settings')}
                    className="bg-white rounded-[24px] p-5 w-full flex items-center justify-between hover:shadow-md border border-slate-50 active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <MessageSquare size={22} />
                        </div>
                        <div className="text-left">
                            <p className="text-base font-bold text-slate-800">WA Auto-Reply</p>
                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Edit pesan otomatis</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                </button>

                {/* Fix Stuck Tables */}
                <button
                    onClick={handleFix}
                    disabled={fixStatus === 'loading'}
                    className="bg-white rounded-[24px] p-5 w-full flex items-center justify-between hover:shadow-md border border-slate-50 active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                            <Wrench size={22} />
                        </div>
                        <div className="text-left">
                            <p className="text-base font-bold text-slate-800">Fix Meja Stuck</p>
                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Reset meja PLAYING error</p>
                        </div>
                    </div>
                    {icon(fixStatus) ?? <ChevronRight size={20} className="text-slate-300" />}
                </button>

                {/* Export Backup */}
                <button
                    onClick={handleExport}
                    disabled={exportStatus === 'loading'}
                    className="bg-white rounded-[24px] p-5 w-full flex items-center justify-between hover:shadow-md border border-slate-50 active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Download size={22} />
                        </div>
                        <div className="text-left">
                            <p className="text-base font-bold text-slate-800">Export Backup</p>
                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Download data JSON</p>
                        </div>
                    </div>
                    {icon(exportStatus) ?? <ChevronRight size={20} className="text-slate-300" />}
                </button>

                {/* RESET — Danger Zone */}
                <div className="bg-white rounded-[24px] p-6 border border-rose-100 mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={18} className="text-rose-500" />
                        <p className="text-[13px] font-bold text-rose-500 uppercase tracking-wider">Zona Berbahaya</p>
                    </div>
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                            <RefreshCw size={22} />
                        </div>
                        <div>
                            <p className="text-base font-bold text-slate-800">Reset Database</p>
                            <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">
                                Hapus semua Session, Payment, Member, dll. Pricing & Paket akan di-seed ulang otomatis.
                            </p>
                        </div>
                    </div>

                    {confirmReset ? (
                        <div className="space-y-4">
                            <p className="text-[13px] font-bold text-rose-600 text-center bg-rose-50 p-3 rounded-xl">
                                Yakin ingin reset? Tidak bisa dibatalkan!
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmReset(false)}
                                    className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm transition-all active:scale-95 hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleReset}
                                    disabled={resetStatus === 'loading'}
                                    className="flex-1 py-3.5 rounded-2xl bg-rose-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all active:scale-95"
                                >
                                    {resetStatus === 'loading'
                                        ? <><Loader2 size={16} className="animate-spin" /> Resetting...</>
                                        : 'Ya, Reset!'
                                    }
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleReset}
                            className="w-full py-3.5 rounded-2xl border-2 border-rose-100 text-rose-600 font-bold text-sm transition-all hover:bg-rose-50 active:scale-95"
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
