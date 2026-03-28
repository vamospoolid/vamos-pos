import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutGrid, BarChart3,
    LogOut, TrendingDown,
    Activity, Settings, MessageSquare, Grid,
    ChevronRight
} from 'lucide-react';
import { VamosLogo } from './VamosLogo';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as { name?: string };

    const navLinks = [
        { icon: LayoutGrid, label: 'COMMAND CENTER', path: '/' },
        { icon: Grid, label: 'LIVE TABLES', path: '/events' },
        { icon: BarChart3, label: 'MASTER REPORTS', path: '/reports' },
        { icon: TrendingDown, label: 'EXPENSES LOG', path: '/expenses' },
        { icon: Activity, label: 'SYSTEM LOG', path: '/announcements' },
        { icon: MessageSquare, label: 'WHATSAPP BOT', path: '/whatsapp-settings' },
        { icon: Settings, label: 'SETTINGS', path: '/settings' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path: string) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    return (
        <div className="min-h-screen bg-[#0a0d18] text-white flex overflow-hidden font-display">
            {/* Background Glows */}
            <div className="fixed top-[-10%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[160px] pointer-events-none opacity-20 bg-primary/20 z-0" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[160px] pointer-events-none opacity-20 bg-accent/10 z-0" />

            {/* PERSISTENT SIDEBAR (Desktop Optimized) */}
            <aside className="w-80 bg-[#0d111d]/60 backdrop-blur-2xl border-r border-white/5 flex flex-col relative z-50 shrink-0">
                {/* Branding */}
                <div className="p-8 pb-12">
                    <div className="flex items-center gap-3">
                        <VamosLogo className="w-10 h-10 glow-logo" color="#3b82f6" glowing />
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter italic uppercase text-white leading-none">
                                VAMOS<span className="text-primary italic">POOL</span>
                            </h1>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Admin Terminal</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
                    <p className="px-4 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Operational Protocol</p>
                    {navLinks.map((item) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`group flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest italic relative overflow-hidden ${active
                                    ? 'bg-primary text-white shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <Icon size={18} className={active ? 'text-white' : 'text-slate-500 group-hover:text-primary transition-colors'} />
                                    <span>{item.label}</span>
                                </div>
                                {active && <ChevronRight size={14} className="relative z-10" />}
                                {active && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-20" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Module */}
                <div className="p-6 border-t border-white/5 bg-black/20">
                    <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20 text-primary font-black text-xl">
                            {user.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="min-w-0">
                            <p className="font-black text-white text-sm leading-tight uppercase italic truncate">{user.name || 'Administrator'}</p>
                            <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-0.5">AUTH LEVEL 01</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.3em] bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95 italic group"
                    >
                        <LogOut size={16} className="group-hover:rotate-12 transition-transform" />
                        ABORT TERMINAL
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto relative z-10 scrollbar-hide">
                {/* Global Header */}
                <header className="sticky top-0 z-40 bg-[#0a0d18]/40 backdrop-blur-xl border-b border-white/5 px-10 py-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] italic mb-1">
                            {isActive('/') ? 'System Overview' : location.pathname.split('/')[1]?.toUpperCase().replace('-', ' ')}
                        </h2>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest italic">Node-01-VPS-PROD | Status: OPTIMAL</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Live Sync</span>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="text-right">
                            <p className="text-[10px] font-black text-white uppercase italic">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{new Date().toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-10 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
