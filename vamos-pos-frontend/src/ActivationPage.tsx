import { useState, useEffect } from 'react';
import { ShieldAlert, Key, Cpu, Lock, CheckCircle2, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import { api } from './api';

export default function ActivationPage() {
    const [licenseKey, setLicenseKey] = useState('');
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/license/status');
            setStatus(res.data.data);
            if (res.data.data.isActivated) {
                // If activated, we should probably redirect or show a success message
                // For now just show status
            }
        } catch (err) {
            console.error('Failed to fetch license status', err);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await api.post('/license/activate', { licenseKey });
            window.location.reload(); // Reload to trigger the app-wide license check
        } catch (err: any) {
            setError(err.response?.data?.message || 'Activation failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestDemo = async () => {
        setError('');
        setSubmitting(true);
        try {
            await api.post('/license/demo');
            window.location.reload();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Trial request failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const copyMachineId = () => {
        if (status?.machineId) {
            navigator.clipboard.writeText(status.machineId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0d18] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0d18] text-white flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

            <div className="w-full max-w-xl relative z-10">
                <div className="text-center mb-12">
                    <div className="w-24 h-24 bg-primary/10 rounded-[40px] flex items-center justify-center border border-primary/20 mx-auto mb-8 relative">
                        <Lock className="w-10 h-10 text-primary" strokeWidth={2.5} />
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-4 border-[#0a0d18]">
                            <ShieldAlert className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-4">Security Protocol</h1>
                    <p className="text-slate-500 text-sm font-black uppercase tracking-[0.2em] italic">Electronic POS Licensing System</p>
                </div>

                <div className="fiery-card p-10 lg:p-14 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                       <Cpu className="w-32 h-32" />
                    </div>

                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Hardware Signature (Machine ID)</label>
                            {status?.machineId && (
                                <button 
                                    onClick={copyMachineId}
                                    className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest italic hover:text-white transition-colors"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            )}
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-sm text-primary flex items-center justify-between group-hover:border-primary/30 transition-all">
                            <span className="truncate">{status?.machineId || 'GENERATING...'}</span>
                        </div>
                        <p className="text-[9px] text-slate-600 mt-4 italic leading-relaxed uppercase tracking-wider">Berikan ID di atas kepada administrator untuk mendapatkan Lisensi yang valid.</p>
                    </div>

                    <form onSubmit={handleActivate} className="space-y-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block italic">Activation Key</label>
                            <div className="relative">
                                <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input 
                                    type="text" 
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value)}
                                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 font-bold text-white focus:outline-none focus:border-primary/50 transition-all uppercase placeholder:text-slate-700"
                                    required
                                />
                            </div>
                            {error && (
                                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-4 flex items-center gap-2 italic">
                                    <ShieldAlert className="w-3 h-3" /> {error}
                                </p>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full fiery-btn-primary py-6 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] italic flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl shadow-primary/20"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Verify & Authorize</span>
                                    <CheckCircle2 className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <div className="relative py-4 flex items-center gap-4">
                            <div className="flex-grow h-px bg-white/5" />
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">Optional</span>
                            <div className="flex-grow h-px bg-white/5" />
                        </div>

                        <button 
                            type="button"
                            onClick={handleRequestDemo}
                            disabled={submitting}
                            className="w-full py-5 rounded-[24px] border border-white/10 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] italic hover:bg-white/5 transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" /> Request 24h Demo Trial
                        </button>
                    </form>
                </div>

                <div className="mt-12 text-center">
                   <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic">VAMOS ELITE MANAGEMENT SYSTEM v2.0</p>
                </div>
            </div>
        </div>
    );
}
