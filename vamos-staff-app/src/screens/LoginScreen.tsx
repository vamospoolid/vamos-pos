import { useState, useEffect } from 'react';
import { ShieldCheck, Phone, ArrowRight, Sparkles, AlertTriangle, Delete, CheckCircle2 } from 'lucide-react';
import { api, setStoredStaff } from '../api';

interface LoginScreenProps {
    onLoginSuccess: (staff: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isShaking, setIsShaking] = useState(false);

    // Auto-login saat 4 digit PIN lengkap terisi
    useEffect(() => {
        if (pin.length === 4 && phone.trim()) {
            executeLogin(phone.trim(), pin);
        }
    }, [pin]);

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            setError('');
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setError('');
        setPin(prev => prev.slice(0, -1));
    };

    const executeLogin = async (phoneVal: string, pinVal: string) => {
        if (!phoneVal.trim()) {
            setError('Silakan masukkan Nomor HP / WhatsApp Anda terlebih dahulu');
            triggerShake();
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await api.post('/staff/login', {
                phone: phoneVal.trim(),
                pinCode: pinVal.trim()
            });

            if (res.data?.success) {
                setStoredStaff(res.data.data);
                onLoginSuccess(res.data.data);
            } else {
                setError(res.data?.message || 'Nomor HP atau PIN salah');
                triggerShake();
                setPin('');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal masuk. Periksa No. HP dan PIN Anda.');
            triggerShake();
            setPin('');
        } finally {
            setLoading(false);
        }
    };

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    return (
        <div className="min-h-screen bg-[#F5F7FC] text-[#0F172A] flex flex-col justify-between items-center relative overflow-hidden pb-8">
            {/* 1. TOP CURVED ROYAL BLUE HEADER */}
            <div className="w-full bg-gradient-to-b from-[#182163] via-[#1E2875] to-[#2538D4] text-white pt-10 pb-20 px-6 rounded-b-[44px] shadow-lg text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />

                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 mb-3 shadow-inner">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white">
                        VAMOS <span className="text-amber-300">STAFF PORTAL</span>
                    </h1>
                    <p className="text-white/80 text-xs mt-1">Portal Absensi, SOP, Waiter Order & KDS Dapur</p>
                </div>
            </div>

            {/* 2. ELEVATED PURE WHITE LOGIN CARD */}
            <div className={`w-full max-w-[400px] -mt-12 px-4 z-20 transition-transform duration-200 ${isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
                <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_12px_40px_-5px_rgba(30,40,117,0.1)] border border-slate-100">
                    
                    {/* Phone Input Box */}
                    <div className="mb-5">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2 flex items-center justify-between">
                            <span>Nomor WhatsApp / HP</span>
                            <span className="text-[10px] text-emerald-600 font-bold">Wajib Aktif</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-3.5 flex items-center gap-1.5 text-slate-400 pointer-events-none">
                                <Phone className="w-4 h-4 text-[#1E2875]" />
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => {
                                    setPhone(e.target.value);
                                    setError('');
                                }}
                                placeholder="Contoh: 6281200000001"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1E2875] focus:bg-white focus:ring-2 focus:ring-[#1E2875]/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* 4-Digit PIN Security Display */}
                    <div className="mb-5 text-center">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2.5">
                            PIN Akses Staf (4 Digit)
                        </label>

                        {/* 4 Box Slots */}
                        <div className="flex justify-center items-center gap-3.5">
                            {[0, 1, 2, 3].map(idx => {
                                const isFilled = pin.length > idx;
                                const isCurrent = pin.length === idx;

                                return (
                                    <div
                                        key={idx}
                                        className={`w-13 h-15 rounded-2xl border flex items-center justify-center transition-all duration-200 ${
                                            isFilled
                                                ? 'bg-[#EEF2FF] border-[#1E2875] shadow-[0_4px_12px_rgba(30,40,117,0.15)] scale-105'
                                                : isCurrent
                                                ? 'bg-white border-[#2538D4] shadow-[0_0_10px_rgba(37,56,212,0.15)]'
                                                : 'bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        {isFilled ? (
                                            <div className="w-3.5 h-3.5 rounded-full bg-[#1E2875] animate-in zoom-in-75 duration-150" />
                                        ) : (
                                            <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-[#2538D4] animate-pulse' : 'bg-slate-300'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-bold flex items-center justify-center gap-2 animate-in fade-in duration-200">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Clean Numeric Keypad */}
                    <div className="grid grid-cols-3 gap-2.5 mb-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => handleNumberClick(num.toString())}
                                disabled={loading || pin.length >= 4}
                                className="h-13 rounded-2xl bg-slate-50 border border-slate-200/80 text-xl font-black text-slate-800 hover:bg-slate-100 hover:border-slate-300 active:bg-[#1E2875] active:text-white active:scale-95 transition-all flex items-center justify-center shadow-xs disabled:opacity-50"
                            >
                                {num}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading || pin.length === 0}
                            className="h-13 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30"
                        >
                            <Delete className="w-5 h-5 stroke-[2.2]" />
                        </button>

                        <button
                            type="button"
                            onClick={() => handleNumberClick('0')}
                            disabled={loading || pin.length >= 4}
                            className="h-13 rounded-2xl bg-slate-50 border border-slate-200/80 text-xl font-black text-slate-800 hover:bg-slate-100 hover:border-slate-300 active:bg-[#1E2875] active:text-white active:scale-95 transition-all flex items-center justify-center shadow-xs disabled:opacity-50"
                        >
                            0
                        </button>

                        <button
                            type="button"
                            onClick={() => executeLogin(phone, pin)}
                            disabled={loading || pin.length < 4 || !phone.trim()}
                            className="h-13 rounded-2xl bg-gradient-to-r from-[#1E2875] to-[#2538D4] text-white font-black hover:opacity-95 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-[0_8px_20px_rgba(30,40,117,0.3)]"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <ArrowRight className="w-6 h-6 stroke-[2.5]" />
                            )}
                        </button>
                    </div>

                    {/* Footer Security Badge */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5 text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Verifikasi Akun Resmi</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#1E2875] font-bold">
                            <Sparkles className="w-3 h-3" />
                            <span>Vamos Pool & Cafe</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Android Home Indicator */}
            <div className="w-32 h-1 bg-slate-900/20 rounded-full mx-auto mt-4 pointer-events-none" />
        </div>
    );
}
