import { useState, useEffect } from 'react';
import { Home, Camera, Utensils, Award, User, ChefHat } from 'lucide-react';
import { getStoredStaff } from './api';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import WaiterOrderScreen from './screens/WaiterOrderScreen';
import KDSScreen from './screens/KDSScreen';
import BonusLeaderboardScreen from './screens/BonusLeaderboardScreen';
import ProfileScreen from './screens/ProfileScreen';

export default function App() {
    const [staff, setStaff] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'home' | 'attendance' | 'waiter' | 'kds' | 'bonus' | 'profile'>('home');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = getStoredStaff();
        if (stored) {
            setStaff(stored);
        }
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F7FC] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#2538D4] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!staff) {
        return <LoginScreen onLoginSuccess={data => setStaff(data)} />;
    }

    const isKitchenStaff = /barista|kitchen|koki|dapur|cook/i.test(staff?.position || '');

    return (
        <div className="min-h-screen bg-[#F5F7FC] text-[#0F172A] flex flex-col justify-between antialiased selection:bg-[#EEF2FF]">
            {/* Main Content View */}
            <main className="flex-1 overflow-y-auto">
                {activeTab === 'home' && <HomeScreen staff={staff} onNavigate={(tab: any) => setActiveTab(tab)} />}
                {activeTab === 'attendance' && <AttendanceScreen staff={staff} onBack={() => setActiveTab('home')} />}
                {activeTab === 'waiter' && <WaiterOrderScreen staff={staff} onBack={() => setActiveTab('home')} />}
                {activeTab === 'kds' && <KDSScreen staff={staff} onBack={() => setActiveTab('home')} />}
                {activeTab === 'bonus' && <BonusLeaderboardScreen staff={staff} onBack={() => setActiveTab('home')} />}
                {activeTab === 'profile' && <ProfileScreen staff={staff} onBack={() => setActiveTab('home')} onLogout={() => setStaff(null)} />}
            </main>

            {/* Authentic Android Docked Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 select-none">
                <nav className="bg-white/95 backdrop-blur-2xl border-t border-slate-100 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] rounded-t-[28px] px-2 pt-2 pb-1">
                    <div className="flex items-center justify-around">
                        {/* 1. Tab Home */}
                        <button
                            onClick={() => setActiveTab('home')}
                            className="flex flex-col items-center justify-center flex-1 py-1 active:scale-90 transition-transform"
                        >
                            <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                                activeTab === 'home'
                                    ? 'bg-[#EEF2FF] text-[#1E2875]'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}>
                                <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                            </div>
                            <span className={`text-[10px] mt-0.5 tracking-tight ${
                                activeTab === 'home' ? 'font-bold text-[#1E2875]' : 'font-medium text-slate-500'
                            }`}>
                                Home
                            </span>
                        </button>

                        {/* 2. Tab Absen */}
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className="flex flex-col items-center justify-center flex-1 py-1 active:scale-90 transition-transform"
                        >
                            <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                                activeTab === 'attendance'
                                    ? 'bg-[#EEF2FF] text-[#1E2875]'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}>
                                <Camera className={`w-5 h-5 ${activeTab === 'attendance' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                            </div>
                            <span className={`text-[10px] mt-0.5 tracking-tight ${
                                activeTab === 'attendance' ? 'font-bold text-[#1E2875]' : 'font-medium text-slate-500'
                            }`}>
                                Absen
                            </span>
                        </button>

                        {/* 3. Center Elevated Android Action Button (Order / Dapur) */}
                        <div className="flex-1 flex flex-col items-center justify-center relative -mt-7">
                            <button
                                onClick={() => setActiveTab(isKitchenStaff ? 'kds' : 'waiter')}
                                className={`w-14 h-14 rounded-full bg-gradient-to-tr from-[#1E2875] via-[#2435BF] to-[#2538D4] text-white flex flex-col items-center justify-center shadow-[0_10px_22px_rgba(37,56,212,0.4)] ring-[5px] ring-[#F5F7FC] active:scale-90 transition-all duration-200 ${
                                    (activeTab === 'waiter' || activeTab === 'kds') ? 'ring-[#2538D4]/40 scale-105' : ''
                                }`}
                            >
                                {isKitchenStaff ? <ChefHat className="w-6 h-6 stroke-[2.2]" /> : <Utensils className="w-6 h-6 stroke-[2.2]" />}
                                <span className="text-[8.5px] font-extrabold mt-0.5 tracking-tight uppercase">
                                    {isKitchenStaff ? 'Dapur' : 'Order'}
                                </span>
                            </button>
                        </div>

                        {/* 4. Tab Kinerja / Bonus */}
                        <button
                            onClick={() => setActiveTab('bonus')}
                            className="flex flex-col items-center justify-center flex-1 py-1 active:scale-90 transition-transform"
                        >
                            <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                                activeTab === 'bonus'
                                    ? 'bg-[#EEF2FF] text-[#1E2875]'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}>
                                <Award className={`w-5 h-5 ${activeTab === 'bonus' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                            </div>
                            <span className={`text-[10px] mt-0.5 tracking-tight ${
                                activeTab === 'bonus' ? 'font-bold text-[#1E2875]' : 'font-medium text-slate-500'
                            }`}>
                                Kinerja
                            </span>
                        </button>

                        {/* 5. Tab Akun / Profil */}
                        <button
                            onClick={() => setActiveTab('profile')}
                            className="flex flex-col items-center justify-center flex-1 py-1 active:scale-90 transition-transform"
                        >
                            <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                                activeTab === 'profile'
                                    ? 'bg-[#EEF2FF] text-[#1E2875]'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}>
                                <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                            </div>
                            <span className={`text-[10px] mt-0.5 tracking-tight ${
                                activeTab === 'profile' ? 'font-bold text-[#1E2875]' : 'font-medium text-slate-500'
                            }`}>
                                Akun
                            </span>
                        </button>
                    </div>

                    {/* Authentic Android Gesture Navigation Handle */}
                    <div className="w-full flex justify-center pt-2 pb-1">
                        <div className="w-32 h-1 bg-slate-400/40 rounded-full" />
                    </div>
                </nav>
            </div>
        </div>
    );
}
