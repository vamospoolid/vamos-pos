import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, Shield } from 'lucide-react';
import { authApi } from '../services/api';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('PROTOCOL_ERROR: CREDENTIALS_REQUIRED');
            return;
        }

        setLoading(true);
        try {
            const res = await authApi.login(email, password);
            const { token, user } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            navigate('/');
        } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { message?: string } } };
            setError(anyErr?.response?.data?.message ?? 'AUTHORIZATION_FAILED: ACCESS_DENIED');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 overflow-hidden relative bg-[#0a0d18] font-sans selection:bg-primary/30">
            {/* ── TACTICAL AMBIANT ────────────────────────────────────────────── */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20 bg-primary/10 animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-10 bg-accent/5" />

            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

            <div className="w-full max-w-[440px] space-y-12 relative z-10 animate-in">
                {/* ── COMMAND LOGO ── */}
                <div className="text-center space-y-6">
                    <div className="relative inline-block group">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative w-24 h-24 mx-auto rounded-[32px] bg-[#1a1f35] border-2 border-primary/20 flex items-center justify-center shadow-2xl skew-x-[-4deg] group-hover:skew-x-0 transition-transform duration-500">
                            <Swords size={44} className="text-primary" fill="currentColor" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter italic uppercase leading-none text-white">
                            VAMOS<span className="text-primary">.GG</span>
                        </h1>
                        <div className="flex items-center justify-center gap-3 mt-4">
                            <div className="h-[1px] w-8 bg-white/10" />
                            <p className="text-[10px] text-slate-500 font-black tracking-[0.4em] uppercase italic">HQ Command Authorization</p>
                            <div className="h-[1px] w-8 bg-white/10" />
                        </div>
                    </div>
                </div>

                {/* ── AUTHORIZATION PANEL ── */}
                <div className="fiery-card p-10 border-2 border-white/5 relative group overflow-hidden">
                    {/* Scanline Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent h-1/2 pointer-events-none opacity-20" />

                    {error && (
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest animate-in italic mb-8">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-8">
                        {/* OPERATIVE ID */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">Operative ID (Email)</label>
                            <div className="relative group/field">
                                <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-primary transition-colors pointer-events-none" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="DESIGNATE IDENTIFIER..."
                                    className="fiery-input w-full !pl-16 !py-5 uppercase text-xs tracking-widest placeholder:text-slate-800"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* ACCESS KEY */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">Access Key (Password)</label>
                            <div className="relative group/field">
                                <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-primary transition-colors pointer-events-none" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="DECRYPT PASS-KEY..."
                                    className="fiery-input w-full !pl-16 !py-5 uppercase text-xs tracking-widest placeholder:text-slate-800"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(p => !p)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-primary transition-colors"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* INITIALIZE BUTTON */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="fiery-btn-primary w-full !py-6 text-xs !tracking-[0.2em] relative group/btn"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            {loading ? (
                                <span className="flex items-center gap-4">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    AUTHORIZING...
                                </span>
                            ) : (
                                <span className="flex items-center gap-3 justify-center">
                                    Initiate Command <ArrowRight size={20} strokeWidth={3} />
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Security Footer */}
                    <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-center gap-4">
                        <Shield size={14} className="text-slate-700" />
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-tight">Secured Tactical Network Node v2.6</span>
                    </div>
                </div>

                <p className="text-center text-[9px] text-slate-700 font-bold uppercase tracking-[0.5em] italic">
                    © 2026 VAMOS SYSTEMS · SECTOR 7 ADMIN
                </p>
            </div>
        </div>
    );
};

export default Login;
