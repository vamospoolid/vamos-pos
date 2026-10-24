import { useState, useEffect } from 'react';
import { Camera, Utensils, ShieldCheck, Award, Clock, MapPin, CheckCircle2, ChevronRight, TrendingUp, Flame, Sparkles, ChefHat, Users, FileText, Bell, LayoutGrid, User, AlertCircle, X, BadgeCheck, Wifi, Trophy, Zap, Coins } from 'lucide-react';
import { api } from '../api';

interface HomeScreenProps {
    staff: any;
    onNavigate: (tab: string) => void;
}

export default function HomeScreen({ staff, onNavigate }: HomeScreenProps) {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [venue, setVenue] = useState<any>(null);
    const [todayAttendance, setTodayAttendance] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [showSopModal, setShowSopModal] = useState(false);
    const [dailyOmzet, setDailyOmzet] = useState<any>({
        currentOmzet: 2350000,
        onDutyStaffCount: 4,
        unlockedTier: 1,
        earnedBonusPerStaff: 10000,
        totalBonusPool: 40000,
        nextTier: { level: 2, name: 'Tier 2 (Target Reguler)', target: 3500000, bonusPerStaff: 20000, label: 'Silver Target' },
        gapToNext: 1150000,
        progressToNext: 67,
        tiers: [
            { level: 1, name: 'Tier 1 (Target Minimum)', target: 2000000, bonusPerStaff: 10000, label: 'Bronze' },
            { level: 2, name: 'Tier 2 (Target Reguler)', target: 3500000, bonusPerStaff: 20000, label: 'Silver' },
            { level: 3, name: 'Tier 3 (Target Super)', target: 5000000, bonusPerStaff: 35000, label: 'Gold Crown' },
        ]
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [venueRes, leaderRes, historyRes, omzetRes] = await Promise.all([
                    api.get('/staff/venue').catch(() => null),
                    api.get('/staff/leaderboard').catch(() => null),
                    api.get(`/staff/attendance/history/${staff.id}`).catch(() => null),
                    api.get('/staff/daily-omzet-milestone').catch(() => null)
                ]);

                if (venueRes?.data?.success) setVenue(venueRes.data.data);
                if (leaderRes?.data?.success) setLeaderboard(leaderRes.data.data?.rankings || []);
                if (omzetRes?.data?.success && omzetRes.data.data) setDailyOmzet(omzetRes.data.data);
                if (historyRes?.data?.success && historyRes.data.data?.length > 0) {
                    const list = historyRes.data.data;
                    setHistory(list);

                    // 1. Prioritas 1: Sesi absensi aktif yang belum checkout (termasuk shift malam / lintas hari)
                    const activeSession = list.find((item: any) => item.checkIn && !item.checkOut);
                    if (activeSession) {
                        setTodayAttendance(activeSession);
                    } else {
                        // 2. Prioritas 2: Sesi hari ini berdasarkan zona waktu lokal (Asia/Jakarta / WIB)
                        const localTodayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
                        const found = list.find((item: any) => {
                            if (!item.date) return false;
                            const itemDateLocal = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(item.date));
                            return itemDateLocal === localTodayStr;
                        });
                        setTodayAttendance(found || null);
                    }
                }
            } catch (err) {
                console.error('Failed to load dashboard data', err);
            }
        };

        fetchInitialData();
    }, [staff.id]);

    const topStaff = leaderboard.slice(0, 3);

    // Hitung streak bebas telat (skip hari libur / izin sah, hanya break jika telat / mangkir)
    let streakCount = 0;
    for (let i = 0; i < history.length; i++) {
        const st = history[i].status;
        if (st === 'PRESENT') {
            streakCount++;
        } else if (st === 'OFF' || st === 'LEAVE' || st === 'PERMIT') {
            continue;
        } else if (st === 'LATE' || st === 'ABSENT') {
            break;
        }
    }

    const currentLevel = streakCount >= 30 ? 3 : streakCount >= 7 ? 2 : 1;
    const levelLabel = currentLevel === 3 ? 'Tingkat 3: Zero Late Master' : currentLevel === 2 ? 'Tingkat 2: Disiplin Tinggi' : 'Tingkat 1: Starter Disiplin';

    const isKitchenStaff = /barista|kitchen|koki|dapur|cook/i.test(staff?.position || '');

    return (
        <div className="min-h-screen bg-[#F5F7FC] text-[#0F172A] pb-28 max-w-md mx-auto">
            {/* 1. TOP CURVED ROYAL BLUE HEADER */}
            <header className="bg-gradient-to-b from-[#182163] via-[#1E2875] to-[#2538D4] text-white pt-6 pb-12 px-5 rounded-b-[32px] shadow-lg relative overflow-hidden">
                {/* Background decorative soft glowing circles */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#2538D4]/30 rounded-full blur-xl pointer-events-none" />

                <div className="relative z-10">
                    {/* Top Branding & Venue Bar */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-sm text-amber-300 shadow-inner">
                                🎱
                            </div>
                            <div>
                                <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider block">Vamos Staff Portal</span>
                                <h1 className="text-sm font-black text-white flex items-center gap-1.5 leading-tight">
                                    {venue?.name || 'Vamos Pool & Cafe'}
                                </h1>
                            </div>
                        </div>

                        {/* Right: Quick SOP Notification Bell */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setShowSopModal(true)}
                                className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-sm"
                                title="SOP & Pengumuman"
                            >
                                <Bell className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. HERO GOLDEN AMBER STAFF PROFILE PASS CARD (Overlapping Header) */}
            <div className="-mt-5 mx-4 relative z-20">
                <div className="rounded-[32px] p-5 bg-gradient-to-br from-[#FF8C00] via-[#FF5E14] to-[#DD2A00] text-white shadow-[0_18px_38px_-6px_rgba(255,94,20,0.48)] border border-white/35 relative overflow-hidden transition-all">
                    {/* Futuristic Holographic & Glass Accents */}
                    <div className="absolute -top-16 -right-16 w-52 h-52 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-black/20 rounded-full blur-xl pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

                    {/* Subtle Card Header Watermark */}
                    <div className="absolute top-4 right-5 text-[8.5px] font-black tracking-[0.22em] text-white/30 uppercase pointer-events-none select-none">
                        VAMOS OFFICIAL STAFF PASS
                    </div>

                    <div className="relative z-10 space-y-3.5">
                        {/* Row 1: Profile Avatar + Name + Verified Badge + Smartcard Chip */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3.5">
                                {/* Profile Avatar with Status Ring */}
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/70 flex items-center justify-center font-black text-2xl text-white shadow-xl ring-4 ring-black/10">
                                        {staff.name?.charAt(0) || 'S'}
                                    </div>
                                    {/* On-Duty Green Beacon */}
                                    <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
                                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    </span>
                                </div>

                                {/* Staff Name & Identification */}
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h2 className="text-xl font-black text-white tracking-tight leading-none drop-shadow-xs">
                                            {staff.name}
                                        </h2>
                                        <span className="p-0.5 rounded-full bg-white/25 text-white" title="Terverifikasi">
                                            <BadgeCheck className="w-4 h-4 fill-white text-[#FF5E14]" />
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[11px] font-mono font-bold tracking-wider text-amber-100/90">
                                            ID: #{staff.phone ? staff.phone.slice(-4) : '6666'}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-white/40" />
                                        <span className="text-[10px] font-bold text-emerald-200 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            {todayAttendance?.checkIn && !todayAttendance?.checkOut ? 'Aktif Bekerja' : 'Staf Aktif'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Metallic Smartcard EMV Chip & NFC Wave */}
                            <div className="flex flex-col items-end space-y-1">
                                <div className="w-9 h-7 rounded-lg bg-gradient-to-tr from-amber-200 via-amber-100 to-amber-300 border border-white/60 shadow-inner flex items-center justify-center relative overflow-hidden">
                                    <div className="w-5 h-4 border border-amber-900/30 rounded-xs flex items-center justify-center">
                                        <div className="w-2.5 h-full border-r border-amber-900/20" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5 text-white/50 pr-0.5">
                                    <Wifi className="w-3.5 h-3.5 rotate-90" />
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Role Pill & WhatsApp Badge */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-black text-xs shadow-xs flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                                {staff.position || 'Staff Operasional'}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-black/15 backdrop-blur-md border border-white/15 text-white/90 font-mono text-[11px] font-bold">
                                📱 {staff.phone ? `${staff.phone.substring(0, 4)} •••• ${staff.phone.substring(staff.phone.length - 4)}` : '-'}
                            </span>
                        </div>

                        {/* Row 3: Glassmorphic Shift & Realtime Attendance Box */}
                        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/15 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-amber-200 block tracking-wider">
                                        Jadwal Shift Hari Ini
                                    </span>
                                    <span className="font-extrabold text-white text-xs block">
                                        {staff.shift?.name ? staff.shift.name.split('(')[0] : 'Shift Barista & Closing'}
                                    </span>
                                    <span className="text-[11px] text-white/80 font-medium font-mono">
                                        {staff.shift?.startTime || '18:00'} - {staff.shift?.endTime || '02:00'} WIB
                                    </span>
                                </div>

                                <div className="text-right">
                                    <span className="text-[10px] uppercase font-bold text-amber-200 block tracking-wider">
                                        Status Kehadiran
                                    </span>
                                    {todayAttendance?.checkIn ? (
                                        <div>
                                            <span className="text-xs font-black text-emerald-300 block">
                                                Sudah Masuk ({new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WIB)
                                            </span>
                                            <span className="text-[10px] text-emerald-200/90 font-medium">
                                                {todayAttendance.status === 'PRESENT' ? '✓ Tepat Waktu' : `Terlambat ${todayAttendance.lateMinutes}m`}
                                            </span>
                                        </div>
                                    ) : (
                                        <div>
                                            <span className="text-xs font-black text-amber-300 block">
                                                Belum Presensi
                                            </span>
                                            <span className="text-[10px] text-white/70">
                                                Siap Clock-In
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Row 4: Biometric Trigger Action Button */}
                        <div className="flex items-center justify-between pt-0.5">
                            <div className="flex items-center gap-1.5 text-white/85 text-[11px] font-bold">
                                <MapPin className="w-3.5 h-3.5 text-amber-200" />
                                <span>{venue?.name || 'Vamos Pool & Cafe'}</span>
                            </div>

                            <button
                                onClick={() => onNavigate('attendance')}
                                className="px-5 py-2.5 rounded-2xl bg-white text-[#DD2A00] font-black text-xs shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:bg-amber-50 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <Camera className="w-4 h-4 stroke-[2.5]" />
                                <span>
                                    {todayAttendance?.checkIn && !todayAttendance?.checkOut
                                        ? 'Clock-Out Pulang'
                                        : 'Clock-In Masuk'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. 8 PASTEL SQUIRCLE QUICK ACTIONS GRID (Fintech Pattern) */}
            <div className="mx-5 mt-5">
                <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_-4px_rgba(30,40,117,0.06)] border border-slate-100">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Menu & Fitur Kerja</h2>
                        <span className="text-[10px] font-bold text-[#1E2875]">Operasional Harian</span>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-center">
                        {/* 1. Absen */}
                        <button
                            onClick={() => onNavigate('attendance')}
                            className="flex flex-col items-center group active:scale-95 transition-transform"
                        >
                            <div className="w-13 h-13 rounded-2xl bg-[#EBF2FF] text-[#2538D4] flex items-center justify-center shadow-xs group-hover:bg-[#2538D4] group-hover:text-white transition-all">
                                <Camera className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 mt-1.5 leading-tight">Absen</span>
                        </button>

                        {/* 2. Order Waiter */}
                        <button
                            onClick={() => onNavigate('waiter')}
                            className="flex flex-col items-center group active:scale-95 transition-transform"
                        >
                            <div className="w-13 h-13 rounded-2xl bg-[#FFF7E6] text-[#FF9F2E] flex items-center justify-center shadow-xs group-hover:bg-[#FF9F2E] group-hover:text-white transition-all">
                                <Utensils className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 mt-1.5 leading-tight">Order Meja</span>
                        </button>

                        {/* 3. Dapur & KDS */}
                        <button
                            onClick={() => onNavigate('kds')}
                            className="flex flex-col items-center group active:scale-95 transition-transform"
                        >
                            <div className="w-13 h-13 rounded-2xl bg-[#F5EDFF] text-[#8B5CF6] flex items-center justify-center shadow-xs group-hover:bg-[#8B5CF6] group-hover:text-white transition-all">
                                <ChefHat className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 mt-1.5 leading-tight">Dapur KDS</span>
                        </button>

                        {/* 4. Kinerja & Bonus */}
                        <button
                            onClick={() => onNavigate('bonus')}
                            className="flex flex-col items-center group active:scale-95 transition-transform"
                        >
                            <div className="w-13 h-13 rounded-2xl bg-[#E9F9F0] text-[#10B981] flex items-center justify-center shadow-xs group-hover:bg-[#10B981] group-hover:text-white transition-all">
                                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 mt-1.5 leading-tight">Kinerja</span>
                        </button>

                        {/* 5. Cari Member */}
                        <button
                            onClick={() => onNavigate('waiter')}
                            className="flex flex-col items-center group active:scale-95 transition-transform"
                        >
                            <div className="w-13 h-13 rounded-2xl bg-[#E3FAFC] text-[#06B6D4] flex items-center justify-center shadow-xs group-hover:bg-[#06B6D4] group-hover:text-white transition-all">
                                <Users className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 mt-1.5 leading-tight">Member</span>
                        </button>

                        {/* 6. Meja Biliar */}
                        <button
                            onClick={() => onNavigate('waiter')}
                            className="flex flex-col items-center group active:scale-95 transition-transform"
                        >
                            <div className="w-13 h-13 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shadow-xs group-hover:bg-[#4F46E5] group-hover:text-white transition-all">
                                <LayoutGrid className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 mt-1.5 leading-tight">Meja Biliar</span>
                        </button>

                        {/* 7. SOP Jobdesk */}
                        <button
                            onClick={() => setShowSopModal(true)}
                            className="flex flex-col items-center group active:scale-95 transition-transform"
                        >
                            <div className="w-13 h-13 rounded-2xl bg-[#FFEBF0] text-[#F43F5E] flex items-center justify-center shadow-xs group-hover:bg-[#F43F5E] group-hover:text-white transition-all">
                                <FileText className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 mt-1.5 leading-tight">SOP & Tugas</span>
                        </button>

                        {/* 8. Akun Staf */}
                        <button
                            onClick={() => onNavigate('profile')}
                            className="flex flex-col items-center group active:scale-95 transition-transform"
                        >
                            <div className="w-13 h-13 rounded-2xl bg-[#F1F5F9] text-[#475569] flex items-center justify-center shadow-xs group-hover:bg-[#475569] group-hover:text-white transition-all">
                                <User className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 mt-1.5 leading-tight">Akun Staf</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. WIDGET TARGET PENDAPATAN & BONUS OMZET HARIAN (GAMIFICATION BOOST) */}
            <div className="mx-4 mt-5">
                <div className="bg-white rounded-3xl p-5 shadow-[0_10px_32px_-4px_rgba(30,40,117,0.08)] border border-slate-100 relative overflow-hidden space-y-4">
                    {/* Top Energetic Multi-Tone Gradient Stripe */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-[#1E2875]" />

                    {/* Header: Title + Live Shift Pulsing Beacon */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#FF5E14] text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                                <Trophy className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="text-sm font-black text-slate-800 leading-tight">
                                        Target Omzet & Bonus Shift
                                    </h3>
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                                    Gotong royong capai omzet hari ini
                                </span>
                            </div>
                        </div>

                        {/* Shift Team Counter */}
                        <div className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] font-extrabold text-slate-600 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-[#1E2875]" />
                            <span>{dailyOmzet.onDutyStaffCount} Staf On-Duty</span>
                        </div>
                    </div>

                    {/* Middle Section: Omzet Counter & Personal Bonus Locked */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#F8FAFF] to-[#EEF2FF] border border-blue-100 flex items-center justify-between gap-3">
                        <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Omzet Shift Tercatat
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-xl font-black text-[#1E2875] tracking-tight">
                                    Rp {dailyOmzet.currentOmzet.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Tier 1 Tercapai
                            </span>
                        </div>

                        {/* Personal Bonus Locked Badge */}
                        <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#FF5E14] to-[#FF8C00] text-white text-right shadow-sm shadow-orange-500/25 shrink-0">
                            <span className="text-[9px] font-bold text-amber-100 uppercase tracking-wider block">
                                Bonus Kamu Terkunci
                            </span>
                            <span className="text-base font-black tracking-tight block">
                                +Rp {dailyOmzet.earnedBonusPerStaff.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9px] font-medium text-white/90">
                                / staf shift hari ini
                            </span>
                        </div>
                    </div>

                    {/* Multi-Tier Interactive Stepper Ladder */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs px-0.5">
                            <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 text-[#FF5E14] fill-[#FF5E14]" />
                                Jenjang Bonus Berjenjang:
                            </span>
                            <span className="text-[10px] font-bold text-[#1E2875]">
                                {dailyOmzet.nextTier ? `Progres: ${dailyOmzet.progressToNext}%` : '🎉 Semua Target Lunas!'}
                            </span>
                        </div>

                        {/* 3 Interactive Tier Cards */}
                        <div className="grid grid-cols-3 gap-2">
                            {dailyOmzet.tiers.map((t: any) => {
                                const isPassed = dailyOmzet.currentOmzet >= t.target;
                                const isCurrentTarget = dailyOmzet.nextTier?.level === t.level;

                                return (
                                    <div
                                        key={t.level}
                                        className={`p-2.5 rounded-2xl text-center border transition-all ${
                                            isPassed
                                                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 shadow-xs'
                                                : isCurrentTarget
                                                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-[#FF5E14]/20 text-slate-900 shadow-sm'
                                                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center mb-1">
                                            {isPassed ? (
                                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                                                    ✓
                                                </span>
                                            ) : isCurrentTarget ? (
                                                <span className="w-5 h-5 rounded-full bg-[#FF5E14] text-white flex items-center justify-center text-[10px] font-black animate-pulse shadow-xs">
                                                    🔥
                                                </span>
                                            ) : (
                                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-black">
                                                    🔒
                                                </span>
                                            )}
                                        </div>

                                        <span className="text-[9.5px] font-bold block truncate">
                                            Rp {(t.target / 1000000).toFixed(1)} Jt
                                        </span>
                                        <span className={`text-[11px] font-black block mt-0.5 ${
                                            isPassed ? 'text-emerald-700' : isCurrentTarget ? 'text-[#FF5E14]' : 'text-slate-500'
                                        }`}>
                                            +{(t.bonusPerStaff / 1000)}K
                                        </span>
                                        <span className="text-[8.5px] font-semibold text-slate-400 block">
                                            / orang
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Segmented Progress Bar */}
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60 mt-1">
                            <div
                                className="bg-gradient-to-r from-emerald-500 via-[#FF5E14] to-[#1E2875] h-full rounded-full transition-all duration-500 shadow-xs"
                                style={{ width: `${Math.min(100, Math.round((dailyOmzet.currentOmzet / 5000000) * 100))}%` }}
                            />
                        </div>
                    </div>

                    {/* Bottom Encouragement Callout & Action Link */}
                    {dailyOmzet.nextTier ? (
                        <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-base shrink-0">⚡</span>
                                <p className="text-[11px] font-extrabold text-amber-900 leading-tight">
                                    Hanya butuh <strong className="text-[#FF5E14]">Rp {dailyOmzet.gapToNext.toLocaleString('id-ID')}</strong> lagi untuk unlock bonus <strong className="text-emerald-700">+Rp {dailyOmzet.nextTier.bonusPerStaff.toLocaleString('id-ID')} / staf!</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => onNavigate('waiter')}
                                className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-[#FF5E14] font-black text-[10px] shrink-0 hover:bg-[#FF5E14] hover:text-white active:scale-95 transition-all shadow-xs cursor-pointer"
                            >
                                Tambah Order →
                            </button>
                        </div>
                    ) : (
                        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-extrabold">
                            <span>👑</span>
                            <span>Luar biasa! Seluruh target omzet hari ini telah tercapai dengan bonus maksimal!</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 5. TARGET KEDISIPLINAN STAF (Clean & Spacious Fintech Card) */}
            <div className="mx-4 mt-4">
                <div 
                    onClick={() => onNavigate('bonus')}
                    className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_-4px_rgba(30,40,117,0.06)] border border-slate-100 hover:border-indigo-100 cursor-pointer transition-all space-y-3.5 group active:scale-[0.99]"
                >
                    {/* Top Row: Category Pill & Bonus Reward Badge */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#FF5E14] flex items-center justify-center shrink-0">
                                <Sparkles className="w-4.5 h-4.5 text-[#FF5E14]" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Target Disiplin Bulan Ini
                                </span>
                                <h3 className="text-sm font-black text-slate-800 leading-tight">
                                    {levelLabel}
                                </h3>
                            </div>
                        </div>

                        {/* Reward Badge */}
                        <div className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#FF5E14] to-[#FF8C00] text-white font-black text-xs shadow-xs flex items-center gap-1 shrink-0">
                            <span>+150K</span>
                            <span className="text-[10px] font-medium opacity-90">Bonus</span>
                        </div>
                    </div>

                    {/* Middle: Clear Progress Bar with Generous Breathing Room */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-bold text-[11px] flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5 text-[#FF5E14] fill-[#FF5E14]" />
                                Progres Bebas Telat:
                            </span>
                            <span className="font-black text-[#1E2875] text-xs">
                                {streakCount} / 30 Hari
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-[#1E2875] to-[#2538D4] h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.round((streakCount / 30) * 100))}%` }}
                            />
                        </div>
                    </div>

                    {/* Bottom Row: Informative Note + Arrow link */}
                    <div className="flex items-center justify-between pt-0.5 text-xs">
                        <p className="text-[11px] text-slate-500 font-medium">
                            {currentLevel === 3
                                ? '🎉 Rekor 30 hari tercapai! Bonus Rp 150.000 siap cair.'
                                : `🌟 Tinggal ${Math.max(0, 30 - streakCount)} hari lagi bebas telat menuju bonus.`}
                        </p>
                        <span className="text-xs font-bold text-[#1E2875] flex items-center gap-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform">
                            Lihat <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                    </div>
                </div>
            </div>

            {/* 5. AKTIVITAS & RIWAYAT KERJA (Matching History List Pattern) */}
            <div className="mx-5 mt-4">
                <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_-4px_rgba(30,40,117,0.06)] border border-slate-100">
                    <div className="flex items-center justify-between mb-3.5">
                        <div>
                            <h3 className="text-sm font-extrabold text-slate-800">Status & Aktivitas Hari Ini</h3>
                            <span className="text-[11px] text-slate-400">Pencatatan absensi & kehadiran</span>
                        </div>
                        <button
                            onClick={() => onNavigate('attendance')}
                            className="text-xs font-bold text-[#1E2875] hover:underline flex items-center gap-0.5"
                        >
                            Detail <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Row 1: Check-In */}
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100/80">
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    todayAttendance?.checkIn ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                    <Clock className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-extrabold text-slate-800">Absen Masuk (Clock-In)</h4>
                                    <span className="text-[10px] text-slate-500">
                                        {todayAttendance?.checkIn
                                            ? `${todayAttendance.status === 'PRESENT' ? 'Tepat Waktu' : 'Terlambat ' + todayAttendance.lateMinutes + ' mnt'}`
                                            : 'Belum melakukan absensi masuk'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-black text-slate-800 block">
                                    {todayAttendance?.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                    todayAttendance?.checkIn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {todayAttendance?.checkIn ? 'SUDAH MASUK' : 'MENUNGGU'}
                                </span>
                            </div>
                        </div>

                        {/* Row 2: Check-Out */}
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100/80">
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    todayAttendance?.checkOut ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'
                                }`}>
                                    <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-extrabold text-slate-800">Absen Pulang (Clock-Out)</h4>
                                    <span className="text-[10px] text-slate-500">
                                        {todayAttendance?.checkOut ? 'Shift selesai tuntas' : 'Dilakukan saat akhir jam kerja shift'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-black text-slate-800 block">
                                    {todayAttendance?.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                    todayAttendance?.checkOut ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {todayAttendance?.checkOut ? 'SELESAI' : 'BELUM'}
                                </span>
                            </div>
                        </div>

                        {/* Row 3: Peringkat Staf */}
                        {topStaff.length > 0 && (
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE]/60">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#2538D4] text-white flex items-center justify-center font-black text-sm shadow-xs">
                                        🏆
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-extrabold text-[#1E2875]">Top Performer Hari Ini</h4>
                                        <span className="text-[10px] text-slate-600">
                                            {topStaff[0]?.name} • {topStaff[0]?.position}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black text-[#2538D4] block">
                                        {topStaff[0]?.attendanceScore || 100}%
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-500 block">Skor Disiplin</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL SOP POPUP */}
            {showSopModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center space-x-2">
                                <div className="p-2 rounded-xl bg-blue-50 text-[#1E2875]">
                                    <FileText className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm text-slate-800">SOP & Jobdesk Resmi</h3>
                                    <span className="text-[10px] text-slate-400 font-semibold">{staff.position || 'Staff'} Vamos</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSopModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-72 overflow-y-auto text-xs text-slate-700 leading-relaxed space-y-2 whitespace-pre-line p-1">
                            {staff.jobdesk || '1. Melayani customer dengan 5S (Senyum, Sapa, Salam, Sopan, Santun).\n2. Memeriksa kebersihan meja biliar, stick & bola.\n3. Menginput pesanan FnB meja secara cepat & teliti.\n4. Siap siaga di area kerja selama jam shift berlangsung.'}
                        </div>

                        <button
                            onClick={() => setShowSopModal(false)}
                            className="w-full py-3 rounded-2xl bg-[#1E2875] text-white font-extrabold text-xs shadow-md active:scale-95 transition-all"
                        >
                            Saya Paham & Siap Bertugas
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

