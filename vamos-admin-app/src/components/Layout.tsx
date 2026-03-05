import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Trophy, Users, BarChart3,
    LogOut, TrendingDown, Calendar, Swords,
    Shield, User, Activity, X, Menu, Settings, MessageSquare
} from 'lucide-react';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as { name?: string };
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    const bottomNav = [
        { icon: LayoutDashboard, label: 'Home', path: '/' },
        { icon: Trophy, label: 'Events', path: '/events' },
        { icon: Activity, label: 'Sessions', path: '/bookings' },
        { icon: Users, label: 'Players', path: '/players' },
        { icon: Menu, label: 'More', path: '#more', isDrawer: true },
    ];

    const drawerLinks = [
        { icon: TrendingDown, label: 'Expenses', path: '/expenses' },
        { icon: BarChart3, label: 'Reports', path: '/reports' },
        { icon: Shield, label: 'Announcement', path: '/announcements' },
        { icon: Calendar, label: 'Bookings', path: '/bookings' },
        { icon: MessageSquare, label: 'WhatsApp', path: '/whatsapp-settings' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path: string) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    return (
        <div className="min-h-screen bg-[#101423] text-white font-sans overflow-x-hidden">

            {/* ── STICKY MOBILE HEADER ─────────────────────── */}
            <header className="sticky top-0 z-50 w-full bg-[#101423]/90 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between px-5 py-4 max-w-2xl mx-auto">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                            <Swords size={20} className="text-primary" fill="currentColor" />
                        </div>
                        <span className="text-xl font-black tracking-tight italic uppercase leading-none flex items-center">
                            VAMOS<span className="text-primary">.GG</span>
                        </span>
                    </Link>

                    {/* Right: Avatar */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="w-10 h-10 rounded-full border-2 border-primary/50 flex items-center justify-center bg-[#1a1f35] shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-95 transition-all"
                    >
                        <User size={18} className="text-primary" />
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pt-4 pb-[80px]">
                <Outlet />
            </main>

            {/* ── BOTTOM NAV BAR ────────────────────────────── */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1f35]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]" style={{ height: '72px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '100%', maxWidth: '640px', margin: '0 auto', padding: '0 16px', gap: '8px' }}>
                    {bottomNav.map((item, idx) => {
                        const active = !item.isDrawer && isActive(item.path);
                        const Icon = item.icon;

                        if (item.isDrawer) {
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setDrawerOpen(true)}
                                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '16px', background: '#252b45', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, transition: 'all 0.2s', cursor: 'pointer' }}
                                >
                                    <Icon size={20} color="#64748b" />
                                </button>
                            );
                        }

                        return active ? (
                            <Link
                                key={idx}
                                to={item.path}
                                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '48px', borderRadius: '16px', background: '#3b82f6', padding: '0 20px', flexShrink: 0, boxShadow: '0 6px 20px rgba(59,130,246,0.45)', transition: 'all 0.3s', textDecoration: 'none', minWidth: '110px' }}
                            >
                                <Icon size={18} color="white" style={{ display: 'block', flexShrink: 0 }} />
                                <span style={{ fontSize: '14px', fontWeight: 800, color: 'white', lineHeight: 1, whiteSpace: 'nowrap', display: 'block' }}>
                                    {item.label}
                                </span>
                            </Link>
                        ) : (
                            <Link
                                key={idx}
                                to={item.path}
                                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '16px', background: '#252b45', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, transition: 'all 0.3s', textDecoration: 'none' }}
                            >
                                <Icon size={20} color="#64748b" style={{ display: 'block' }} />
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* ── SIDE DRAWER (More Menu) ───────────────────── */}
            {drawerOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
                        onClick={() => setDrawerOpen(false)}
                    />
                    {/* Drawer Panel */}
                    <div className="fixed right-0 top-0 bottom-0 z-[90] w-80 bg-[#1a1f35] shadow-[-20px_0_60px_rgba(0,0,0,0.7)] flex flex-col animate-in">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <User size={22} className="text-primary" />
                                </div>
                                <div>
                                    <p className="font-black text-white text-base leading-tight">{user.name || 'Admin'}</p>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Administrator</p>
                                </div>
                            </div>
                            <button onClick={() => setDrawerOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drawer Links */}
                        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
                            {drawerLinks.map((item) => {
                                const active = isActive(item.path);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setDrawerOpen(false)}
                                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-base ${active
                                            ? 'bg-primary/10 text-primary border border-primary/20'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-600'}`}>
                                            <Icon size={20} />
                                        </div>
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Logout */}
                        <div className="px-4 py-6 border-t border-white/5">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-4 px-5 py-4 w-full rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-base active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                    <LogOut size={20} className="text-rose-400" />
                                </div>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Layout;
