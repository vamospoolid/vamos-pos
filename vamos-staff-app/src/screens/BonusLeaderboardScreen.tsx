import { useState, useEffect } from 'react';
import { Trophy, Award, TrendingUp, CheckCircle2, Lock, Unlock, Flame, ShieldCheck, AlertTriangle, Sparkles, ChevronRight, Zap, ArrowLeft } from 'lucide-react';
import { api } from '../api';

interface BonusLeaderboardScreenProps {
    staff: any;
    onBack?: () => void;
}

export default function BonusLeaderboardScreen({ staff, onBack }: BonusLeaderboardScreenProps) {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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

    const fetchData = async () => {
        setLoading(true);
        try {
            const [leaderRes, histRes, omzetRes] = await Promise.all([
                api.get('/staff/leaderboard').catch(() => null),
                api.get(`/staff/attendance/history/${staff.id}`).catch(() => null),
                api.get('/staff/daily-omzet-milestone').catch(() => null)
            ]);

            if (leaderRes?.data?.success) {
                setLeaderboard(leaderRes.data.data?.rankings || []);
            }
            if (omzetRes?.data?.success && omzetRes.data.data) {
                setDailyOmzet(omzetRes.data.data);
            }
            if (histRes?.data?.success) {
                setHistory(histRes.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load performance data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [staff.id]);

    // Calculate Zero Late Streak & Attendance Stats
    const totalDays = history.length;
    const onTimeDays = history.filter(h => h.status === 'PRESENT').length;
    const lateDays = history.filter(h => h.status === 'LATE').length;
    const attendanceScore = totalDays > 0 ? Math.round((onTimeDays / totalDays) * 100) : 100;

    // Hitung streak hari on-time terakhir (skip hari libur / izin sah, hanya break jika telat / mangkir)
    let streakCount = 0;
    for (let i = 0; i < history.length; i++) {
        const st = history[i].status;
        if (st === 'PRESENT') {
            streakCount++;
        } else if (st === 'OFF' || st === 'LEAVE' || st === 'PERMIT') {
            continue; // Jangan putus streak untuk hari libur resmi / izin
        } else if (st === 'LATE' || st === 'ABSENT') {
            break; // Putus streak hanya jika terlambat atau alpa
        }
    }

    // Tentukan Tingkat Kedisiplinan Staf (Murni Zero Late)
    // Tingkat 1: Starter Disiplin (< 7 hari ontime)
    // Tingkat 2: Disiplin Tinggi (7 - 29 hari ontime)
    // Tingkat 3: Zero Late Master (>= 30 hari ontime + score >= 95%) -> Berhak Bonus Rp 150.000
    let currentLevel = 1;
    let levelName = 'Tingkat 1: Starter Disiplin';
    let nextLevelDays = 7;

    if (streakCount >= 30 && attendanceScore >= 95) {
        currentLevel = 3;
        levelName = 'Tingkat 3: Zero Late Master (Juara Disiplin)';
        nextLevelDays = 30;
    } else if (streakCount >= 7) {
        currentLevel = 2;
        levelName = 'Tingkat 2: Disiplin Tinggi';
        nextLevelDays = 30;
    }

    const progressToNext = currentLevel === 1 
        ? Math.min(100, Math.round((streakCount / 7) * 100))
        : currentLevel === 2 
        ? Math.min(100, Math.round((streakCount / 30) * 100)) 
        : 100;

    const myRankItem = leaderboard.find(item => item.employeeId === staff.id) || {
        attendanceScore,
        overallScore: attendanceScore,
        totalBonus: currentLevel === 3 ? 150000 : 0,
        badge: currentLevel === 3 ? 'PERFECT_ATTENDANCE' : null
    };

    const topThree = leaderboard.slice(0, 3);

    return (
        <div className="min-h-screen bg-[#F5F7FC] text-[#0F172A] pb-32 max-w-md mx-auto">
            {/* Top Royal Blue Curved Header */}
            <header className="bg-gradient-to-b from-[#182163] via-[#1E2875] to-[#2538D4] text-white pt-6 pb-7 px-5 rounded-b-[32px] shadow-lg space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                    {onBack ? (
                        <button
                            onClick={onBack}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4 text-amber-300" /> Beranda
                        </button>
                    ) : (
                        <div />
                    )}
                    <div className="flex items-center gap-1.5">
                        <span className="p-1.5 rounded-xl bg-white/15 text-amber-300">
                            <Trophy className="w-5 h-5 stroke-[2.2]" />
                        </span>
                        <h2 className="text-sm font-black text-white uppercase tracking-wider">Kinerja & Bonus</h2>
                    </div>
                    <div className="w-12" />
                </div>

                <div className="text-center pt-1 relative z-10">
                    <h3 className="text-lg font-black text-white">Bonus Kedisiplinan Zero Late</h3>
                    <p className="text-indigo-200 text-xs mt-0.5">Program Insentif Hadir Tepat Waktu Outlet Vamos</p>
                </div>
            </header>

            <div className="p-4 space-y-4">
                {/* 1. HERO DAILY OMZET BONUS CARD */}
                <div className="bg-white rounded-3xl p-5 shadow-[0_10px_32px_-4px_rgba(30,40,117,0.08)] border border-slate-100 relative overflow-hidden space-y-4">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-[#1E2875]" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#FF5E14] text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                                <Trophy className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 leading-tight">
                                    Bonus Omzet Shift Hari Ini
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                                    Target Pendapatan Tim ({dailyOmzet.onDutyStaffCount} Staf On-Duty)
                                </span>
                            </div>
                        </div>

                        <div className="px-3 py-1.5 rounded-2xl bg-gradient-to-tr from-[#FF5E14] to-[#FF8C00] text-white text-right shadow-sm shadow-orange-500/20">
                            <span className="text-[9px] font-bold text-amber-100 block uppercase">Bonus Terkunci</span>
                            <span className="text-sm font-black block">+Rp {dailyOmzet.earnedBonusPerStaff.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#F8FAFF] to-[#EEF2FF] border border-blue-100 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Realisasi Omzet Hari Ini
                            </span>
                            <span className="text-lg font-black text-[#1E2875] block mt-0.5">
                                Rp {dailyOmzet.currentOmzet.toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Total Bonus Pool Tim
                            </span>
                            <span className="text-sm font-black text-emerald-700 block mt-0.5">
                                Rp {dailyOmzet.totalBonusPool.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>

                    {/* Multi Tier Stepper */}
                    <div className="grid grid-cols-3 gap-2">
                        {dailyOmzet.tiers.map((t: any) => {
                            const isPassed = dailyOmzet.currentOmzet >= t.target;
                            const isCurrentTarget = dailyOmzet.nextTier?.level === t.level;

                            return (
                                <div
                                    key={t.level}
                                    className={`p-2.5 rounded-2xl text-center border ${
                                        isPassed
                                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                                            : isCurrentTarget
                                            ? 'bg-amber-50/80 border-amber-300 ring-2 ring-[#FF5E14]/20 text-slate-900'
                                            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                                    }`}
                                >
                                    <span className="text-[10px] font-black block">
                                        {isPassed ? '✓ ' : isCurrentTarget ? '🔥 ' : '🔒 '}
                                        Rp {(t.target / 1000000).toFixed(1)} Jt
                                    </span>
                                    <span className={`text-xs font-black block mt-0.5 ${
                                        isPassed ? 'text-emerald-700' : isCurrentTarget ? 'text-[#FF5E14]' : 'text-slate-500'
                                    }`}>
                                        +{(t.bonusPerStaff / 1000)}K
                                    </span>
                                    <span className="text-[8.5px] text-slate-400 block">/ staf</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Staf Bertugas yang Berhak Menerima Bonus */}
                    {dailyOmzet.onDutyStaffList && dailyOmzet.onDutyStaffList.length > 0 && (
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-bold">Staf Masuk Hari Ini ({dailyOmzet.onDutyStaffCount}):</span>
                            <span className="font-extrabold text-[#1E2875] truncate max-w-[210px] text-right" title={dailyOmzet.onDutyStaffList.join(', ')}>
                                {dailyOmzet.onDutyStaffList.join(', ')}
                            </span>
                        </div>
                    )}
                </div>

                {/* 2. Current Level & Streak Hero Card */}
                <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(30,40,117,0.06)] border border-slate-100 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-extrabold text-[#1E2875] uppercase tracking-wider block flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Status Tingkat Disiplin
                            </span>
                            <h3 className="text-base font-black text-slate-800 mt-0.5">
                                {levelName}
                            </h3>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black shadow-sm">
                            <Flame className="w-4 h-4 text-[#FF5E14] fill-[#FF5E14]" /> {streakCount} Hari Streak
                        </div>
                    </div>

                    {/* Progress Bar to Unlock Next Level */}
                    {currentLevel < 3 ? (
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-600">
                                    Menuju {currentLevel === 1 ? 'Tingkat 2 (Disiplin Tinggi)' : 'Tingkat 3 (Bonus Penuh Rp 150.000)'}
                                </span>
                                <span className="text-[#1E2875] font-black">{streakCount} / {nextLevelDays} Hari</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-[#1E2875] to-[#2538D4] h-full rounded-full transition-all duration-500 shadow-sm"
                                    style={{ width: `${progressToNext}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                                {currentLevel === 1 
                                    ? `🔥 Tinggal ${Math.max(0, 7 - streakCount)} hari lagi bebas telat untuk mencapai Tingkat 2!` 
                                    : `🌟 Tinggal ${Math.max(0, 30 - streakCount)} hari lagi bebas telat untuk mengklaim Bonus Penuh Rp 150.000!`}
                            </span>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                            <Trophy className="w-5 h-5 shrink-0 text-emerald-600" />
                            <span>🎉 Luar Biasa! Anda telah mencapai 30 hari Zero Late dan berhak atas bonus Rp 150.000!</span>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                            <span className="text-slate-400 text-[9px] font-bold block uppercase">Ketepatan</span>
                            <span className="text-xs font-black text-[#1E2875]">{attendanceScore}%</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                            <span className="text-slate-400 text-[9px] font-bold block uppercase">Tepat Waktu</span>
                            <span className="text-xs font-black text-slate-800">{onTimeDays} Hari</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                            <span className="text-slate-400 text-[9px] font-bold block uppercase">Terlambat</span>
                            <span className={`text-xs font-black ${lateDays > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{lateDays} Hari</span>
                        </div>
                    </div>
                </div>

                {/* 3 Tier Feature Milestone Cards */}
                <div className="space-y-2.5">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-[#1E2875]" />
                        Jenjang Kedisiplinan Karyawan:
                    </h4>

                    {/* Level 1 Card */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start space-x-3">
                        <div className="p-2 rounded-xl bg-indigo-50 text-[#1E2875] mt-0.5">
                            <Unlock className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h5 className="text-xs font-black text-slate-800">Tingkat 1: Starter Disiplin</h5>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                    Aktif
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                Rekam jejak absensi on-time (1 - 6 hari). Biasakan presensi selfie GPS sebelum shift dimulai.
                            </p>
                        </div>
                    </div>

                    {/* Level 2 Card */}
                    <div className={`p-3.5 rounded-2xl bg-white border transition-all ${
                        currentLevel >= 2 
                            ? 'border-indigo-200 shadow-sm' 
                            : 'border-slate-100 opacity-80'
                    } flex items-start space-x-3`}>
                        <div className={`p-2 rounded-xl mt-0.5 ${
                            currentLevel >= 2 ? 'bg-indigo-50 text-[#1E2875]' : 'bg-slate-100 text-slate-400'
                        }`}>
                            {currentLevel >= 2 ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h5 className="text-xs font-black text-slate-800">Tingkat 2: Disiplin Tinggi (7+ Hari)</h5>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    currentLevel >= 2 
                                        ? 'bg-emerald-50 text-emerald-700' 
                                        : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {currentLevel >= 2 ? 'Tercapai 🌟' : 'Target: 7 Hari Bebas Telat'}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                Konsistensi kehadiran terjaga tanpa terlambat. Menjadi teladan kedisiplinan bagi seluruh staf outlet.
                            </p>
                        </div>
                    </div>

                    {/* Level 3 Card */}
                    <div className={`p-3.5 rounded-2xl bg-white border transition-all ${
                        currentLevel >= 3 
                            ? 'border-amber-300 ring-2 ring-amber-100 shadow-sm' 
                            : 'border-slate-100 opacity-80'
                    } flex items-start space-x-3`}>
                        <div className={`p-2 rounded-xl mt-0.5 ${
                            currentLevel >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                        }`}>
                            {currentLevel >= 3 ? <Trophy className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h5 className="text-xs font-black text-slate-800">Tingkat 3: Zero Late Master (Bonus Rp 150.000)</h5>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    currentLevel >= 3 
                                        ? 'bg-amber-500 text-white font-black' 
                                        : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {currentLevel >= 3 ? 'Bonus Siap Cair! 💰' : 'Target: 30 Hari Zero Late'}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                Berhasil menjaga 30 hari penuh tanpa terlambat! Mendapatkan <strong className="text-[#1E2875]">Bonus Penuh Rp 150.000</strong> langsung ditambahkan ke gaji bulanan.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Aturan Zero Late Policy */}
                <div className="p-4 rounded-3xl bg-indigo-50/70 border border-indigo-100 space-y-2.5">
                    <h5 className="font-extrabold text-xs text-[#1E2875] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#1E2875]" />
                        Ketentuan Bonus Zero Late Rp 150.000:
                    </h5>
                    <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                        <li>Wajib hadir di outlet dan presensi selfie GPS tepat waktu sesuai jam shift.</li>
                        <li>Hari libur resmi (<strong className="text-slate-800">OFF</strong>) atau izin sah (<strong className="text-slate-800">LEAVE/PERMIT</strong>) <strong className="text-[#1E2875]">tidak mereset streak</strong>.</li>
                        <li>Terlambat (<strong className="text-rose-600">LATE</strong>) atau mangkir tanpa kabar akan mereset hitungan streak ke 0 hari.</li>
                        <li>Staf dengan rekor Zero Late selama 1 bulan penuh otomatis mendapatkan bonus tunai Rp 150.000.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

