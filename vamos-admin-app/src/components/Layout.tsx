import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutGrid, BarChart3, LogOut, TrendingDown,
    Activity, Settings, MessageSquare, Grid,
    Users, Menu, X, Bell
} from 'lucide-react';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as { name?: string };
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const mainNav = [
        { icon: LayoutGrid, path: '/' },
        { icon: Grid, path: '/events' },
        { icon: BarChart3, path: '/reports' }
    ];

    const extraNav = [
        { icon: Users, label: 'Player Accounts', path: '/players' },
        { icon: TrendingDown, label: 'Expenses', path: '/expenses' },
        { icon: Activity, label: 'Announcements', path: '/announcements' },
        { icon: MessageSquare, label: 'WhatsApp Bot', path: '/whatsapp-settings' },
        { icon: Settings, label: 'System Settings', path: '/settings' },
    ];

    const getPageTitle = () => {
        if (location.pathname === '/') return 'Dashboard';
        if (location.pathname.startsWith('/events')) return 'Match & Events';
        if (location.pathname.startsWith('/reports')) return 'Analytics';
        if (location.pathname.startsWith('/expenses')) return 'Expenses';
        if (location.pathname.startsWith('/players')) return 'Players';
        return 'Vamos Admin';
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-slate-800 flex flex-col font-sans overflow-x-hidden relative">
            {/* Top Blue Curved Header */}
            <div className="absolute top-0 left-0 right-0 h-[260px] bg-blue-700 rounded-b-[40px] z-0"></div>

            {/* App Bar */}
            <header className="relative z-40 px-6 pt-10 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsMenuOpen(true)} className="text-white hover:bg-white/10 p-2 rounded-xl transition-colors -ml-2">
                        <Menu size={28} strokeWidth={2} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-wide">{getPageTitle()}</h1>
                        <p className="text-xs text-blue-200 mt-1 font-medium">Last Update {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>
                
                <div className="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center overflow-hidden border-[3px] border-white shadow-sm shrink-0">
                    <img src={`https://ui-avatars.com/api/?name=${user.name || 'Admin'}&background=FEF08A&color=CA8A04`} alt="avatar" className="w-full h-full object-cover" />
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 relative z-10 pb-28 px-6 mt-4">
                <div className="w-full max-w-md mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* MOBILE BOTTOM NAVIGATION */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-4px_30px_rgba(0,0,0,0.08)] px-8 py-3 flex justify-between items-center rounded-t-[32px] pb-safe">
                {mainNav.map((item) => {
                    const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                        <Link key={item.path} to={item.path} className="relative p-3 flex flex-col items-center justify-center gap-1 transition-all">
                            <item.icon size={24} className={active ? 'text-blue-700' : 'text-slate-300'} strokeWidth={active ? 2.5 : 2} />
                            {active && <div className="absolute -bottom-1 w-1.5 h-1.5 bg-blue-700 rounded-full" />}
                        </Link>
                    );
                })}
                <button onClick={() => navigate('/settings')} className="relative p-3 flex items-center justify-center">
                    <Settings size={24} className="text-slate-300" strokeWidth={2} />
                </button>
            </nav>
            
            {/* FULL SCREEN MENU (Drawer) */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col animate-in slide-in-from-left-full duration-300">
                    <div className="bg-blue-700 px-6 pt-10 pb-6 rounded-b-[40px] flex justify-between items-center text-white">
                        <h2 className="text-2xl font-bold">Menu</h2>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="flex-1 p-6 space-y-3 overflow-y-auto mt-4">
                        {extraNav.map(item => (
                            <Link 
                                key={item.path} 
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm active:scale-95 transition-transform"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <item.icon size={22} strokeWidth={2} />
                                </div>
                                <span className="font-semibold text-slate-700 text-base">{item.label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="p-6 mb-8">
                        <button 
                            onClick={handleLogout}
                            className="w-full bg-rose-50 text-rose-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                        >
                            <LogOut size={20} /> Logout System
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;
