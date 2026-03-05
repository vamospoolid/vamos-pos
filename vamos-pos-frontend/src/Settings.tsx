import { useState, useEffect } from 'react';
import { Loader2, Save, MapPin, Activity, Plus, Edit2, Trash2, UserCog, Key, Shield, Table, Database, RefreshCw, Download, MessageSquare, Lightbulb, RotateCcw } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';
import { QRCodeSVG } from 'qrcode.react';

export default function Settings() {
    const [tables, setTables] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form Venue 
    const [venueForm, setVenueForm] = useState({
        id: '',
        name: '',
        address: '',
        openTime: '09:00',
        closeTime: '23:00',
        relayComPort: 'COM3',
        printerPath: 'USB001',
        taxPercent: 11,
        servicePercent: 5,
        blinkWarningMinutes: 5
    });

    // Form Table
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [tableForm, setTableForm] = useState({ id: '', venueId: '', name: '', type: 'REGULAR', relayChannel: 1 });
    const [editingTable, setEditingTable] = useState(false);

    // Form User
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userForm, setUserForm] = useState({ id: '', name: '', email: '', password: '', role: 'KASIR' });
    const [editingUser, setEditingUser] = useState(false);

    const [relayStatus, setRelayStatus] = useState({ isConnected: false, port: '', isOpen: false });

    // WhatsApp State
    const [waStatus, setWaStatus] = useState<{ isReady: boolean, qr: string | null, isInitializing: boolean }>({ isReady: false, qr: null, isInitializing: true });
    const [waTemplates, setWaTemplates] = useState<any[]>([]);
    const [isWaTemplateModalOpen, setIsWaTemplateModalOpen] = useState(false);
    const [selectedWaTemplate, setSelectedWaTemplate] = useState<any>(null);
    const [waTemplateBody, setWaTemplateBody] = useState('');

    const fetchData = async () => {
        try {
            const [vRes, tRes, uRes, waTplRes] = await Promise.all([
                api.get('/venues'),
                api.get('/tables'),
                api.get('/users'),
                api.get('/whatsapp/templates')
            ]);
            setTables(tRes.data.data);
            setUsers(uRes.data.data);
            setWaTemplates(waTplRes.data.data);

            if (vRes.data.data.length > 0) {
                // Prioritize "Serpong" or use the first one if not found
                const serpongVenue = vRes.data.data.find((v: any) => v.name.toLowerCase().includes('serpong')) || vRes.data.data[0];
                setVenueForm({
                    id: serpongVenue.id,
                    name: serpongVenue.name,
                    address: serpongVenue.address || '',
                    openTime: serpongVenue.openTime,
                    closeTime: serpongVenue.closeTime,
                    relayComPort: serpongVenue.relayComPort || 'COM3',
                    printerPath: serpongVenue.printerPath || 'USB001',
                    taxPercent: serpongVenue.taxPercent ?? 11,
                    servicePercent: serpongVenue.servicePercent ?? 5,
                    blinkWarningMinutes: serpongVenue.blinkWarningMinutes ?? 5
                });
            }
        } catch (err) {
            console.error('Error fetching settings', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const checkStatus = async () => {
            try {
                const res = await api.get('/relay/status');
                setRelayStatus(res.data.data);
            } catch (e) { }
            try {
                const waRes = await api.get('/whatsapp/status');
                const { isReady, hasQr, isInitializing } = waRes.data.data;
                if (isReady) {
                    setWaStatus({ isReady: true, qr: null, isInitializing: false });
                } else if (hasQr) {
                    const qrRes = await api.get('/whatsapp/qr');
                    setWaStatus({ isReady: false, qr: qrRes.data.data.qr, isInitializing: false });
                } else {
                    setWaStatus({ isReady: false, qr: null, isInitializing: isInitializing ?? true });
                }
            } catch (e) { }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSaveVenue = async () => {
        try {
            if (venueForm.id && venueForm.id.length > 5) { // Ensure it's not '' or some short non-uuid
                await api.put(`/venues/${venueForm.id}`, venueForm);
                vamosAlert("Venue settings saved!");
            } else {
                const { id, ...newVenueData } = venueForm;
                await api.post('/venues', newVenueData);
                vamosAlert("New venue created!");
            }
            fetchData();
        } catch (err) {
            vamosAlert('Failed to save venue settings');
        }
    };

    const handleSaveTable = async () => {
        // Validation check for duplicates
        const nameExists = tables.find(t => t.name.toLowerCase() === tableForm.name.toLowerCase() && t.id !== tableForm.id);
        const relayExists = tables.find(t => Number(t.relayChannel) === Number(tableForm.relayChannel) && t.id !== tableForm.id);

        if (nameExists) return vamosAlert('Table name already exists!');
        if (relayExists) return vamosAlert(`Relay channel ${tableForm.relayChannel} is already used by ${relayExists.name}`);

        try {
            const { id, ...tableData } = tableForm;
            const payload = {
                ...tableData,
                venueId: venueForm.id
            };

            if (!payload.venueId || payload.venueId === '') {
                return vamosAlert('Error: Venue ID is missing. Please save Venue Identity first at the left panel.');
            }

            if (editingTable) {
                await api.put(`/tables/${id}`, payload);
            } else {
                await api.post('/tables', payload);
            }
            setIsTableModalOpen(false);
            fetchData();
        } catch (err: any) {
            console.error('Save Table Error:', err);
            const serverMsg = err.response?.data?.message || err.response?.data?.error || 'Unknown server error';
            vamosAlert('Failed to save table: ' + serverMsg);
        }
    };

    const handleToggleWaTemplate = async (template: any) => {
        try {
            const nextActive = !template.isActive;
            await api.put(`/whatsapp/templates/${template.id}`, {
                body: template.body,
                imageUrl: template.imageUrl,
                isActive: nextActive
            });
            fetchData();
        } catch (err) {
            vamosAlert('Failed to update template status');
        }
    };

    const handleSaveWaTemplate = async () => {
        if (!selectedWaTemplate) return;
        try {
            await api.put(`/whatsapp/templates/${selectedWaTemplate.id}`, {
                body: waTemplateBody,
                imageUrl: selectedWaTemplate.imageUrl,
                isActive: selectedWaTemplate.isActive
            });
            setIsWaTemplateModalOpen(false);
            fetchData();
        } catch (err) {
            vamosAlert('Failed to update template body');
        }
    };

    const handleReinitWhatsApp = async () => {
        try {
            await api.post('/whatsapp/reset');
            setWaStatus({ isReady: false, qr: null, isInitializing: true });
            vamosAlert('WhatsApp reinisialisasi dimulai. QR Code akan muncul dalam beberapa detik...');
        } catch (e) {
            vamosAlert('Gagal mereinisialisasi WhatsApp');
        }
    };

    const deleteTable = async (id: string) => {
        if (!(await vamosConfirm('Warning: Deleting a table might fail if it has active sessions. Delete anyway?'))) return;
        try {
            await api.delete(`/tables/${id}`);
            fetchData();
        } catch (err) {
            vamosAlert('Failed to delete table');
        }
    }

    const testRelay = async (channel: number, command: 'on' | 'off') => {
        try {
            await api.post('/relay/' + command, { channel });
            // No alert needed, user will hear the relay click
        } catch (err) {
            vamosAlert(`Hardware Test Failed: Could not send ${command} to Channel ${channel}`);
        }
    };

    const handleSaveUser = async () => {
        try {
            const payload = { ...userForm };
            if (!payload.password && editingUser) {
                delete (payload as any).password;
            }
            if (editingUser) {
                await api.put(`/users/${userForm.id}`, payload);
            } else {
                if (!payload.password) payload.password = '12345678';
                await api.post('/users', payload);
            }
            setIsUserModalOpen(false);
            fetchData();
        } catch (err: any) {
            vamosAlert(err?.response?.data?.message || 'Failed to save user');
        }
    };

    const deleteUser = async (id: string) => {
        if (!(await vamosConfirm('Are you sure you want to revoke access for this user?'))) return;
        try {
            await api.delete(`/users/${id}`);
            fetchData();
        } catch (err) {
            vamosAlert('Failed to revoke user status');
        }
    };

    const handleExportBackup = async () => {
        try {
            const res = await api.get('/system/export');
            const data = res.data.data;
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vamos-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            vamosAlert("Database export success! Check your downloads.");
        } catch (err) {
            vamosAlert('Failed to export database');
        }
    };

    const handleResetData = async () => {
        const confirm1 = await vamosConfirm('WARNING: This will delete ALL transactions, sessions, payments, members, and expenses. Configuration (Tables/Products) will be kept. Proceed?');
        if (!confirm1) return;

        const confirm2 = await vamosConfirm('CRITICAL: This action CANNOT be undone. Are you absolutely sure you want to clear the entire operational database?');
        if (!confirm2) return;

        try {
            await api.post('/system/reset');
            vamosAlert("System data has been reset successfully!");
            window.location.reload();
        } catch (err) {
            vamosAlert('Failed to reset system data');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#00ff66]" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="max-w-[1400px]">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Venue & Hardware */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Venue Details */}
                        <div className="bg-[#141414] border border-[#222] rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center mb-6">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center mr-3 border border-blue-500/20">
                                    <MapPin className="w-5 h-5 text-blue-500" />
                                </div>
                                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Venue Identity</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Venue Name</label>
                                    <input type="text" value={venueForm.name} onChange={e => setVenueForm({ ...venueForm, name: e.target.value })} className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Address / Tagline</label>
                                    <textarea rows={2} value={venueForm.address} onChange={e => setVenueForm({ ...venueForm, address: e.target.value })} className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Open Time</label>
                                        <input type="time" value={venueForm.openTime} onChange={e => setVenueForm({ ...venueForm, openTime: e.target.value })} className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Close Time</label>
                                        <input type="time" value={venueForm.closeTime} onChange={e => setVenueForm({ ...venueForm, closeTime: e.target.value })} className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                </div>
                                <button onClick={handleSaveVenue} className="w-full py-4 mt-2 bg-blue-600/10 border border-blue-600/30 text-blue-500 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all transform active:scale-95 flex items-center justify-center">
                                    <Save className="w-4 h-4 mr-2" /> Save Identity
                                </button>
                            </div>
                        </div>

                        {/* Financial Configuration */}
                        <div className="bg-[#141414] border border-[#222] rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center mb-6">
                                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center mr-3 border border-purple-500/20">
                                    <Database className="w-5 h-5 text-purple-500" />
                                </div>
                                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Tax & Service</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-1">PPN (%)</label>
                                        <input
                                            type="number"
                                            value={venueForm.taxPercent}
                                            onChange={e => setVenueForm({ ...venueForm, taxPercent: Number(e.target.value) })}
                                            className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-purple-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Service (%)</label>
                                        <input
                                            type="number"
                                            value={venueForm.servicePercent}
                                            onChange={e => setVenueForm({ ...venueForm, servicePercent: Number(e.target.value) })}
                                            className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-purple-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-600 font-medium px-1 italic">
                                    * Pajak (PPN) akan dihitung setelah Service Charge.
                                </p>
                                <button onClick={handleSaveVenue} className="w-full py-4 bg-purple-600/10 border border-purple-600/30 text-purple-500 rounded-xl font-bold hover:bg-purple-600 hover:text-white transition-all transform active:scale-95 flex items-center justify-center">
                                    <Save className="w-4 h-4 mr-2" /> Save Finance Settings
                                </button>
                            </div>
                        </div>

                        {/* Hardware Configuration */}
                        <div className="bg-[#141414] border border-[#222] rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center mb-6">
                                <div className="w-9 h-9 rounded-xl bg-[#00ff66]/10 flex items-center justify-center mr-3 border border-[#00ff66]/20">
                                    <Activity className="w-5 h-5 text-[#00ff66]" />
                                </div>
                                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Local Hardware</h2>
                                <div className="ml-4 p-2 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                                    <Lightbulb className={`w-4 h-4 ${relayStatus.isOpen ? 'text-yellow-400 animate-pulse' : 'text-gray-700'}`} />
                                </div>
                                <div className={`ml-auto px-2 py-0.5 rounded text-[8px] font-black tracking-tighter uppercase ${relayStatus.isOpen ? 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                    {relayStatus.isOpen ? 'LIVE' : 'OFFLINE'}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Relay Master COM Port</label>
                                    <input type="text" value={venueForm.relayComPort} onChange={e => setVenueForm({ ...venueForm, relayComPort: e.target.value })} className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#00ff66] text-[#00ff66]" placeholder="e.g. COM3" />
                                    <p className="text-[10px] text-gray-600 mt-2 font-medium px-1 italic">* Changes will restart the relay engine worker.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Receipt Printer Path</label>
                                    <input type="text" value={venueForm.printerPath} onChange={e => setVenueForm({ ...venueForm, printerPath: e.target.value })} className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#00ff66]" placeholder="e.g. USB001" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Lampu Berkedip Sebelum Habis (Menit)</label>
                                    <input type="number" min="1" value={venueForm.blinkWarningMinutes} onChange={e => setVenueForm({ ...venueForm, blinkWarningMinutes: Number(e.target.value) })} className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#00ff66]" placeholder="Misal: 5" />
                                    <p className="text-[10px] text-gray-600 mt-2 font-medium px-1 italic">* Lampu meja (relay) akan mulai berkedip setiap 1 menit saat billing Package / Jam Tetap mau habis.</p>
                                </div>
                                <button onClick={handleSaveVenue} className="w-full py-4 mt-2 bg-[#00ff66] text-[#0a0a0a] rounded-xl font-black text-sm hover:opacity-90 transition-all transform active:scale-95 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.2)]">
                                    <Save className="w-4 h-4 mr-2" /> Save Hardware Config
                                </button>
                            </div>
                        </div>

                        {/* WhatsApp Integration */}
                        <div className="bg-[#141414] border border-[#222] rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center mb-6">
                                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center mr-3 border border-green-500/20">
                                    <MessageSquare className="w-5 h-5 text-green-500" />
                                </div>
                                <h2 className="text-lg font-bold text-white uppercase tracking-tight">WhatsApp Notification</h2>
                                <div className={`ml-auto px-2 py-0.5 rounded text-[8px] font-black tracking-tighter uppercase ${waStatus.isReady ? 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                    {waStatus.isReady ? 'CONNECTED' : 'WAITING'}
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center bg-[#111] border border-[#222] rounded-xl p-6 min-h-[200px]">
                                {waStatus.isReady ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-[#00ff66]/10 rounded-full flex items-center justify-center border border-[#00ff66]/30 mx-auto mb-4 relative">
                                            <div className="absolute inset-0 border border-[#00ff66] rounded-full animate-ping opacity-20"></div>
                                            <MessageSquare className="w-8 h-8 text-[#00ff66]" />
                                        </div>
                                        <h3 className="font-bold text-white text-lg mb-1">WhatsApp Web Connect Data</h3>
                                        <p className="text-xs text-gray-500 font-medium">Session is ready for sending automated transactional info.</p>
                                    </div>
                                ) : waStatus.qr ? (
                                    <div className="text-center w-full">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Scan QR untuk Login Admin</p>
                                        <div className="bg-white p-3 rounded-xl inline-block mx-auto">
                                            <QRCodeSVG value={waStatus.qr} size={150} />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-4 leading-relaxed max-w-[200px] mx-auto">
                                            Buka WhatsApp di HP Anda, buka menu "Perangkat Tertaut" dan scan kode ini.
                                        </p>
                                        <button
                                            onClick={async () => {
                                                if (await vamosConfirm("Reset WhatsApp session? You will need to scan the QR code again.")) {
                                                    try {
                                                        await api.post('/whatsapp/reset');
                                                        setWaStatus({ isReady: false, qr: null, isInitializing: true });
                                                    } catch (e) {
                                                        vamosAlert("Failed to reset WhatsApp session");
                                                    }
                                                }
                                            }}
                                            className="mt-4 text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest border border-red-500/20 hover:border-red-500/50 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            Reset Session
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center gap-4">
                                        <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            {waStatus.isInitializing ? 'Inisialisasi WhatsApp Engine...' : 'Menunggu QR Code...'}
                                        </p>
                                        <p className="text-[10px] text-gray-600 max-w-[200px] leading-relaxed">
                                            {waStatus.isInitializing
                                                ? 'Puppeteer sedang menyiapkan browser. Harap tunggu 10-30 detik.'
                                                : 'QR Code belum muncul. Klik tombol di bawah untuk reinisialisasi.'}
                                        </p>
                                        <button
                                            onClick={handleReinitWhatsApp}
                                            className="flex items-center gap-2 mt-1 text-[10px] font-black text-yellow-500/70 hover:text-yellow-500 uppercase tracking-widest border border-yellow-500/20 hover:border-yellow-500/50 px-4 py-2 rounded-lg transition-all"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            {waStatus.isInitializing ? 'Restart Inisialisasi' : 'Reinisialisasi WhatsApp'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            {waStatus.isReady && (
                                <button
                                    onClick={async () => {
                                        if (await vamosConfirm("Disconnect WhatsApp? This will stop automated notifications until you scan again.")) {
                                            try {
                                                await api.post('/whatsapp/reset');
                                                setWaStatus({ isReady: false, qr: null, isInitializing: true });
                                            } catch (e) {
                                                vamosAlert("Failed to disconnect WhatsApp");
                                            }
                                        }
                                    }}
                                    className="w-full mt-4 py-3 bg-red-500/5 border border-red-500/20 text-red-500/70 hover:bg-red-500/10 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Logout / Disconnect WhatsApp
                                </button>
                            )}

                            {/* Template Management */}
                            <div className="mt-8 border-t border-[#222] pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Reply Templates</h3>
                                    <button onClick={fetchData} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                                        <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {waTemplates.map(tpl => (
                                        <div key={tpl.id} className="bg-[#111] border border-[#222] rounded-xl p-4 group hover:border-[#00ff66]/30 transition-all">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="text-xs font-bold text-white">{tpl.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono">{tpl.id}</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedWaTemplate(tpl);
                                                        setWaTemplateBody(tpl.body);
                                                        setIsWaTemplateModalOpen(true);
                                                    }}
                                                    className="p-2 bg-[#1a1a1a] border border-[#333] hover:border-[#00ff66] rounded-lg text-gray-500 hover:text-[#00ff66] transition-all"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1e1e1e]">
                                                <p className="text-[10px] text-gray-400 leading-relaxed font-medium line-clamp-2">
                                                    {tpl.body}
                                                </p>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between">
                                                <div
                                                    onClick={() => handleToggleWaTemplate(tpl)}
                                                    className="flex items-center space-x-2 cursor-pointer group/toggle"
                                                >
                                                    <div className={`w-8 h-4 rounded-full transition-colors relative ${tpl.isActive ? 'bg-[#00ff66]' : 'bg-gray-800'}`}>
                                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-all ${tpl.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${tpl.isActive ? 'text-[#00ff66]' : 'text-gray-600'}`}>
                                                        {tpl.isActive ? 'Active' : 'Disabled'}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] text-gray-700 italic">Auto-send when triggered</p>
                                            </div>
                                        </div>
                                    ))}
                                    {waTemplates.length === 0 && (
                                        <p className="text-center py-4 text-[10px] text-gray-600 italic">No templates found in database.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Database & Maintenance */}
                        <div className="bg-[#141414] border border-[#222] rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center mb-6">
                                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center mr-3 border border-purple-500/20">
                                    <Database className="w-5 h-5 text-purple-500" />
                                </div>
                                <h2 className="text-lg font-bold text-white uppercase tracking-tight">System & Database</h2>
                            </div>
                            <div className="space-y-3">
                                <button
                                    onClick={handleExportBackup}
                                    className="w-full flex items-center justify-between px-5 py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Download className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-white">Backup Database</p>
                                            <p className="text-[10px] text-gray-600 uppercase font-black">Export as JSON file</p>
                                        </div>
                                    </div>
                                    <Edit2 className="w-3.5 h-3.5 text-gray-700" />
                                </button>

                                <button
                                    onClick={handleResetData}
                                    className="w-full flex items-center justify-between px-5 py-4 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <RefreshCw className="w-4 h-4 text-red-500/50 group-hover:text-red-500 group-hover:rotate-180 transition-transform duration-500" />
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-red-500/80">Reset System Data</p>
                                            <p className="text-[10px] text-gray-600 uppercase font-black">Clear transactions only</p>
                                        </div>
                                    </div>
                                </button>

                                <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                                    <p className="text-[10px] text-yellow-500/80 leading-relaxed italic">
                                        * Reset data tidak menghapus meja, produk, atau user admin. Selalu backup sebelum melakukan reset.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Table Mapping */}
                    <div className="lg:col-span-8">
                        <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden flex flex-col h-full shadow-xl">
                            <div className="p-6 border-b border-[#222] bg-[#0d0d0d] flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="w-9 h-9 rounded-xl bg-[#00ff66]/10 flex items-center justify-center mr-3 border border-[#00ff66]/20">
                                        <Table className="w-5 h-5 text-[#00ff66]" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white uppercase tracking-tight">Tables & Area Mapping</h2>
                                </div>
                                <button
                                    onClick={() => {
                                        const nextRelay = tables.length > 0 ? Math.max(...tables.map(t => Number(t.relayChannel))) + 1 : 1;
                                        setEditingTable(false);
                                        setTableForm({ id: '', venueId: venueForm.id, name: '', type: 'REGULAR', relayChannel: nextRelay });
                                        setIsTableModalOpen(true);
                                    }}
                                    className="bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66] px-4 py-2 rounded-xl text-xs font-black hover:bg-[#00ff66] hover:text-[#0a0a0a] transition-all flex items-center"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-2" /> ADD TABLE
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto min-h-[500px] p-6 lg:p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-[#141414] z-10">
                                        <tr className="border-b border-[#222] text-[10px] uppercase font-black tracking-[0.2em] text-gray-600">
                                            <th className="px-6 py-5">Label</th>
                                            <th className="px-6 py-5">Class</th>
                                            <th className="px-6 py-5 text-center">Relay CH</th>
                                            <th className="px-6 py-5 text-center">Live Status</th>
                                            <th className="px-6 py-5 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#222]">
                                        {tables.map(t => (
                                            <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="font-black text-white">{t.name}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono tracking-tighter">{t.id.split('-')[0]}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-[9px] px-2 py-1 bg-white/5 border border-white/10 text-gray-300 rounded-md font-black tracking-widest">{t.type}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="bg-[#00aaff]/10 border border-[#00aaff]/30 text-[#00aaff] px-4 py-1.5 rounded-full font-mono font-black text-xs">
                                                        CH {String(t.relayChannel).padStart(2, '0')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={`text-[10px] px-3 py-1.5 rounded-full border font-black tracking-wider uppercase ${t.status === 'AVAILABLE' ? 'text-[#00ff66] border-[#00ff66]/30 bg-[#00ff66]/10' : 'text-[#ff3333] border-[#ff3333]/30 bg-[#ff3333]/10'}`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <div className="flex bg-[#111] border border-[#222] rounded-xl overflow-hidden mr-2">
                                                            <button
                                                                onClick={() => testRelay(t.relayChannel, 'on')}
                                                                className="px-3 py-1.5 text-[10px] font-black text-[#00ff66] hover:bg-[#00ff66]/10 border-r border-[#222] transition-colors"
                                                            >
                                                                TEST ON
                                                            </button>
                                                            <button
                                                                onClick={() => testRelay(t.relayChannel, 'off')}
                                                                className="px-3 py-1.5 text-[10px] font-black text-gray-500 hover:bg-gray-500/10 transition-colors"
                                                            >
                                                                OFF
                                                            </button>
                                                        </div>
                                                        <button onClick={() => { setEditingTable(true); setTableForm({ id: t.id, venueId: t.venueId, name: t.name, type: t.type, relayChannel: t.relayChannel }); setIsTableModalOpen(true); }} className="p-2.5 bg-[#1a1a1a] border border-[#333] hover:border-[#00ff66] rounded-xl text-gray-400 hover:text-[#00ff66] transition-all" title="Edit Hardware Mapping">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => deleteTable(t.id)} className="p-2.5 bg-[#1a1a1a] border border-[#333] hover:border-red-500 rounded-xl text-gray-400 hover:text-red-500 transition-all" title="Delete Table">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {tables.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-20">
                                                    <div className="text-gray-600 font-black italic text-xl uppercase tracking-tighter">No Tables Configured</div>
                                                    <p className="text-gray-700 mt-2 text-sm">Add your first billiard table to start monitoring.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Section */}
                <div className="mt-8 bg-[#141414] border border-[#222] rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-[#222] bg-[#0d0d0d] flex justify-between items-center">
                        <div className="flex items-center">
                            <div className="w-9 h-9 rounded-xl bg-[#ff33a1]/10 flex items-center justify-center mr-3 border border-[#ff33a1]/20">
                                <Shield className="w-5 h-5 text-[#ff33a1]" />
                            </div>
                            <h2 className="text-lg font-bold text-white uppercase tracking-tight">User Access & Roles</h2>
                        </div>
                        <button onClick={() => { setEditingUser(false); setUserForm({ id: '', name: '', email: '', role: 'KASIR', password: '' }); setIsUserModalOpen(true); }} className="bg-[#ff33a1]/10 border border-[#ff33a1]/30 text-[#ff33a1] px-4 py-2 rounded-xl text-xs font-black hover:bg-[#ff33a1] hover:text-white transition-all flex items-center">
                            <Plus className="w-3.5 h-3.5 mr-2" /> ADD USER
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="">
                                    <tr className="border-b border-[#222] text-[10px] uppercase font-black tracking-[0.2em] text-gray-600">
                                        <th className="pb-5 pl-2">Name & Identity</th>
                                        <th className="pb-5">Login Email</th>
                                        <th className="pb-5">Access Level</th>
                                        <th className="pb-5">Joined</th>
                                        <th className="pb-5 text-right pr-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#181818]">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-white/[0.01] transition-colors group">
                                            <td className="py-5 pl-2">
                                                <div className="flex items-center">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mr-3 font-black text-xs ${u.role === 'OWNER' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                                                        u.role === 'ADMIN' ? 'bg-[#ff33a1]/20 text-[#ff33a1] border border-[#ff33a1]/30' :
                                                            u.role === 'MANAGER' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' :
                                                                'bg-gray-800 text-gray-400 border border-gray-700'
                                                        }`}>
                                                        {u.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="font-bold text-white">{u.name}</div>
                                                </div>
                                            </td>
                                            <td className="py-5 text-gray-500 text-sm font-medium">{u.email}</td>
                                            <td className="py-5">
                                                <span className={`text-[9px] px-2.5 py-1 rounded-md border font-black tracking-widest uppercase ${u.role === 'OWNER' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' :
                                                    u.role === 'ADMIN' ? 'text-[#ff33a1] border-[#ff33a1]/30 bg-[#ff33a1]/10' :
                                                        u.role === 'MANAGER' ? 'text-blue-500 border-blue-500/30 bg-blue-500/10' :
                                                            'text-gray-400 border-gray-600 bg-gray-800/10'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-5 text-[10px] font-bold text-gray-600 uppercase italic">{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td className="py-5 text-right pr-2">
                                                <div className="flex justify-end space-x-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingUser(true); setUserForm({ id: u.id, name: u.name, email: u.email, role: u.role, password: '' }); setIsUserModalOpen(true); }} className="p-2 bg-[#1a1a1a] border border-[#333] hover:border-white rounded-lg text-gray-400 hover:text-white transition-all">
                                                        <Key className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => deleteUser(u.id)} className="p-2 bg-[#1a1a1a] border border-[#333] hover:border-red-500 rounded-lg text-gray-400 hover:text-red-500 transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Mapping Modal */}
            {
                isTableModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <div className="bg-[#141414] border border-[#1e1e1e] rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            <div className="p-6 border-b border-[#1e1e1e] flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#00ff66]/10 flex items-center justify-center border border-[#00ff66]/20">
                                    <Activity className="w-6 h-6 text-[#00ff66]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black italic tracking-tighter">
                                        {editingTable ? 'EDIT TABLE' : 'NEW TABLE'}
                                    </h2>
                                    <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Hardware Mapping</p>
                                </div>
                            </div>
                            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 pl-1">Display Label</label>
                                    <input type="text" value={tableForm.name} onChange={e => setTableForm({ ...tableForm, name: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-[#00ff66] transition-all font-bold text-sm" placeholder="e.g. Table 01" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 pl-1">Category</label>
                                        <select value={tableForm.type} onChange={e => setTableForm({ ...tableForm, type: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-[#00ff66] text-sm font-bold transition-all">
                                            <option value="REGULAR">Regular</option>
                                            <option value="VIP">VIP</option>
                                            <option value="VVIP">VVIP Room</option>
                                            <option value="CAROM">Carom</option>
                                            <option value="SNOOKER">Snooker</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#00aaff] uppercase tracking-[0.2em] mb-2 pl-1">Relay CH</label>
                                        <input type="number" min="1" max="99" value={tableForm.relayChannel} onChange={e => setTableForm({ ...tableForm, relayChannel: parseInt(e.target.value) || 1 })} className="w-full bg-[#00aaff]/10 border border-[#00aaff]/30 text-[#00aaff] rounded-xl px-4 py-3 focus:outline-none focus:border-[#00aaff] font-mono font-black text-center text-lg" />
                                    </div>
                                </div>
                                <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl">
                                    <p className="text-[10px] text-orange-500 font-bold leading-relaxed">
                                        <span className="opacity-100 uppercase tracking-widest block mb-1">Warning:</span>
                                        Ensure the Relay CH matches your physical wiring to avoid powering on the wrong table lamp/TV.
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 border-t border-[#1e1e1e] flex space-x-3 bg-[#0a0a0a]">
                                <button onClick={() => setIsTableModalOpen(false)} className="flex-1 py-3 rounded-xl bg-transparent border border-[#222] text-gray-500 font-bold text-sm hover:text-white transition-colors">CANCEL</button>
                                <button onClick={handleSaveTable} disabled={!tableForm.name} className="flex-1 py-3 rounded-xl bg-[#00ff66] text-[#0a0a0a] font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(0,255,102,0.2)]">CONFIRM</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Users Modal */}
            {
                isUserModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
                        <div className="bg-[#141414] border border-[#1e1e1e] rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            <div className="p-6 border-b border-[#1e1e1e] flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#ff33a1]/10 flex items-center justify-center border border-[#ff33a1]/20">
                                    <UserCog className="w-6 h-6 text-[#ff33a1]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black italic tracking-tighter">
                                        {editingUser ? 'EDIT ACCESS' : 'NEW ACCESS'}
                                    </h2>
                                    <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">User Privilege Management</p>
                                </div>
                            </div>
                            <div className="p-8 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 pl-1">Full Name</label>
                                    <input type="text" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff33a1] transition-all font-bold text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 pl-1">Email Identity</label>
                                    <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff33a1] transition-all font-bold font-mono text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 pl-1">Security Role</label>
                                        <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full bg-[#ff33a1]/10 border border-[#ff33a1]/30 text-[#ff33a1] rounded-xl px-3 py-3 focus:outline-none focus:border-[#ff33a1] text-xs font-black transition-all">
                                            <option value="KASIR">KASIR</option>
                                            <option value="MANAGER">MANAGER</option>
                                            <option value="ADMIN">ADMIN</option>
                                            <option value="OWNER">OWNER</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 pl-1">Access Key</label>
                                        <input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff33a1] transition-all font-bold text-sm" placeholder={editingUser ? "NO CHANGE" : "PASSWORD"} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-[#1e1e1e] flex space-x-3 bg-[#0a0a0a]">
                                <button onClick={() => setIsUserModalOpen(false)} className="flex-1 py-3 rounded-xl bg-transparent border border-[#222] text-gray-500 font-bold text-sm hover:text-white transition-colors">CANCEL</button>
                                <button onClick={handleSaveUser} disabled={!userForm.name || !userForm.email} className="flex-1 py-3 rounded-xl bg-[#ff33a1] text-white font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 tracking-widest shadow-[0_0_20px_rgba(255,51,161,0.2)]">AUTHORIZE</button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* WhatsApp Template Modal */}
            {isWaTemplateModalOpen && selectedWaTemplate && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-in zoom-in duration-300">
                    <div className="bg-[#141414] border border-[#1e1e1e] rounded-[2rem] w-full max-w-lg overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                        <div className="p-8 border-b border-[#1e1e1e] flex items-center space-x-4">
                            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                <MessageSquare className="w-7 h-7 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tighter text-white">
                                    EDIT TEMPLATE
                                </h2>
                                <p className="text-xs uppercase font-black text-gray-500 tracking-[0.2em]">{selectedWaTemplate.name}</p>
                            </div>
                        </div>
                        <div className="p-10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 pl-1">Message Body Template</label>
                                <textarea
                                    value={waTemplateBody}
                                    onChange={e => setWaTemplateBody(e.target.value)}
                                    rows={8}
                                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-2xl px-5 py-5 focus:outline-none focus:border-green-500 transition-all font-medium text-sm text-gray-300 leading-relaxed resize-none custom-scrollbar"
                                    placeholder="Enter template message..."
                                />
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="text-[9px] font-bold bg-[#111] border border-[#222] text-gray-500 px-2 py-1 rounded">{"{{name}}"}</span>
                                    <span className="text-[9px] font-bold bg-[#111] border border-[#222] text-gray-500 px-2 py-1 rounded">{"{{venue}}"}</span>
                                    {selectedWaTemplate.id === 'wa_payment_receipt' && (
                                        <>
                                            <span className="text-[9px] font-bold bg-[#111] border border-[#222] text-gray-500 px-2 py-1 rounded">{"{{table}}"}</span>
                                            <span className="text-[9px] font-bold bg-[#111] border border-[#222] text-gray-500 px-2 py-1 rounded">{"{{amount}}"}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 pl-1">Image URL (Optional)</label>
                                <input
                                    type="text"
                                    value={selectedWaTemplate.imageUrl || ''}
                                    onChange={e => setSelectedWaTemplate({ ...selectedWaTemplate, imageUrl: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-2xl px-5 py-4 focus:outline-none focus:border-green-500 transition-all font-medium text-sm text-gray-300"
                                    placeholder="https://example.com/image.jpg"
                                />
                                {selectedWaTemplate.imageUrl && (
                                    <div className="mt-3 relative w-32 h-32 rounded-xl border border-[#222] overflow-hidden bg-[#111]">
                                        <img src={selectedWaTemplate.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Invalid+Image'; }} />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-3 p-4 bg-green-500/5 border border-green-500/10 rounded-2xl">
                                <input
                                    type="checkbox"
                                    checked={selectedWaTemplate.isActive}
                                    onChange={e => setSelectedWaTemplate({ ...selectedWaTemplate, isActive: e.target.checked })}
                                    className="w-5 h-5 accent-green-500"
                                />
                                <span className="text-xs font-black text-green-500/80 uppercase tracking-widest">Send this notification automatically</span>
                            </div>
                        </div>
                        <div className="p-10 border-t border-[#1e1e1e] flex space-x-4 bg-[#0a0a0a]">
                            <button onClick={() => setIsWaTemplateModalOpen(false)} className="flex-1 py-4 rounded-2xl border border-[#222] text-gray-500 font-bold hover:text-white transition-all text-sm tracking-widest">CANCEL</button>
                            <button onClick={handleSaveWaTemplate} className="flex-1 py-4 rounded-2xl bg-green-500 text-black font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] tracking-widest">SAVE TEMPLATE</button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
