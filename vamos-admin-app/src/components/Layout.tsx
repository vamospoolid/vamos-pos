import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutGrid, BarChart3,
    LogOut, TrendingDown,
    User, Activity, Menu, Settings, MessageSquare, Plus, Grid
} from 'lucide-react';
import { VamosLogo } from './VamosLogo';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as { name?: string };
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    const bottomNav = [
        { icon: LayoutGrid, label: 'HOME', path: '/' },
        { icon: Grid, label: 'TABLES', path: '/events' },
        { icon: Plus, label: '', path: '/bookings', primary: true },
        { icon: BarChart3, label: 'STATS', path: '#stats', isDrawer: true },
        { icon: Settings, label: 'SYSTEM', path: '/settings' },
    ];

    const drawerLinks = [
        { icon: BarChart3, label: 'Reports', path: '/reports' },
        { icon: TrendingDown, label: 'Expenses', path: '/expenses' },
        { icon: Activity, label: 'System Log', path: '/announcements' },
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
        <div className="min-h-screen bg-[#101423] text-white flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden border-x border-white/5">
            <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20 bg-primary/20" />
            <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20 bg-accent/10" />

            {/* Unified Header matching Player App */}
            <div className="flex justify-between items-center px-6 pt-12 pb-6 relative z-30 bg-[#101423]/40 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <VamosLogo className="w-8 h-8" color="#3b82f6" glowing />
                    <h1 className="text-xl font-black tracking-tighter italic uppercase text-white">
                        VAMOS<span className="text-primary"> POOL</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-[#1a1f35] px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5 shadow-inner">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic pt-0.5">Admin Central</span>
                    </div>

                    <button onClick={() => setDrawerOpen(true)} className="w-10 h-10 rounded-full bg-[#1a1f35] overflow-hidden border-2 border-primary/30 p-1 flex items-center justify-center hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                        <Menu className="w-5 h-5 text-primary" />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide relative z-10 pb-32">
                <Outlet />
            </div>

            {/* Bottom Navigation matching Player App fiery-nav */}
            <div className="fixed bottom-0 left-0 w-full px-6 pb-6 pt-4 z-50 pointer-events-none">
                <div className="max-w-md mx-auto px-4">
                    <div className="fiery-nav flex justify-between items-center px-4 py-3 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] pointer-events-auto">
                        {bottomNav.map((item, idx) => {
                            const active = !item.isDrawer && isActive(item.path);
                            const Icon = item.icon;

                            if (item.primary) {
                                return (
                                    <React.Fragment key={idx}>
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 cursor-pointer z-[60]" onClick={() => navigate(item.path)}>
                                            <div className="w-14 h-14 rounded-full fiery-gradient flex items-center justify-center border-[4px] border-[#101423] text-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                                                <Icon className="w-6 h-6 font-bold" />
                                            </div>
                                        </div>
                                        <div className="w-8"></div> {/* Spacer for FAB */}
                                    </React.Fragment>
                                );
                            }

                            if (item.isDrawer) {
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setDrawerOpen(true)}
                                        className={`relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 text-slate-500 hover:text-slate-300`}
                                    >
                                        <Icon className="w-6 h-6 relative z-10 stroke-[2]" />
                                    </button>
                                );
                            }

                            return (
                                <Link
                                    key={idx}
                                    to={item.path}
                                    className={`relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 ${active ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {active && (
                                        <div className="absolute inset-0 bg-primary/20 blur-md rounded-full scale-125" />
                                    )}
                                    {active && (
                                        <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
                                    )}
                                    <Icon className={`w-6 h-6 relative z-10 ${active ? 'text-primary' : 'stroke-[2]'}`} />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Side Drawer */}
            {drawerOpen && (
                <>
                    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
                    <div className="fixed right-0 top-0 bottom-0 z-[90] w-72 bg-[#121212] border-l border-white/5 flex flex-col animate-in shadow-2xl">
                        <div className="p-6 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <User size={22} className="text-primary" />
                                </div>
                                <div>
                                    <p className="font-black text-white text-base leading-tight uppercase italic">{user.name || 'Admin'}</p>
                                    <p className="caption text-[10px] text-slate-500 font-bold uppercase tracking-widest">Administrator</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
                            {drawerLinks.map((item) => {
                                const active = isActive(item.path);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setDrawerOpen(false)}
                                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm uppercase tracking-wider italic ${active
                                            ? 'bg-primary/10 text-primary border border-primary/20'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t border-white/5">
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-3 w-full py-4 rounded-[16px] transition-all font-black text-[10px] uppercase tracking-[0.3em] bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95 italic"
                            >
                                <LogOut size={16} />
                                ABORT PROTOCOL
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Layout;
