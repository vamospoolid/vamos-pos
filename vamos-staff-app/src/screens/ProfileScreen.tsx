import { useState } from 'react';
import { User, Phone, Briefcase, Clock, LogOut, ShieldCheck, Calendar, ArrowLeft, AlertTriangle } from 'lucide-react';
import { clearStoredStaff } from '../api';

interface ProfileScreenProps {
    staff: any;
    onBack?: () => void;
    onLogout: () => void;
}

export default function ProfileScreen({ staff, onBack, onLogout }: ProfileScreenProps) {
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const executeLogout = () => {
        try {
            clearStoredStaff();
            localStorage.removeItem('vamos_staff_user');
            sessionStorage.clear();
        } catch (e) {
            console.error('Error clearing storage', e);
        }
        setShowLogoutModal(false);
        onLogout();
    };

    return (
        <div className="min-h-screen bg-[#F5F7FC] text-[#0F172A] pb-32 max-w-md mx-auto">
            {/* Top Royal Blue Curved Header */}
            <header className="bg-gradient-to-b from-[#182163] via-[#1E2875] to-[#2538D4] text-white pt-6 pb-12 px-5 rounded-b-[32px] shadow-lg relative overflow-hidden">
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
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">Profil Staf</h2>
                    <div className="w-12" />
                </div>

                {/* Header Profile Avatar */}
                <div className="text-center pt-4 relative z-10">
                    <div className="relative inline-block">
                        <div className="w-20 h-20 rounded-3xl bg-white text-[#1E2875] flex items-center justify-center text-3xl font-black mx-auto shadow-xl ring-4 ring-white/20">
                            {staff.name?.charAt(0) || 'S'}
                        </div>
                        <span className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-[#FF9F2E] text-white shadow-md">
                            <ShieldCheck className="w-4 h-4" />
                        </span>
                    </div>
                    <h2 className="text-lg font-black text-white mt-3">{staff.name}</h2>
                    <span className="inline-block px-3 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-extrabold text-amber-300 mt-1">
                        {staff.position || 'Staff Operasional'}
                    </span>
                </div>
            </header>

            <div className="p-4 -mt-4 space-y-4">
                {/* Profile Info Card */}
                <div className="rounded-3xl bg-white border border-slate-100 p-4 shadow-[0_8px_30px_rgba(30,40,117,0.06)] space-y-3">
                    <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider px-1">
                        Informasi Karyawan
                    </h4>

                    <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Phone className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Nomor WhatsApp</span>
                            <span className="text-xs font-black text-slate-800">{staff.phone || '-'}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#1E2875] flex items-center justify-center shrink-0">
                            <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Posisi / Jabatan</span>
                            <span className="text-xs font-black text-slate-800">{staff.position || 'Staff'}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Jadwal Shift Kerja</span>
                            <span className="text-xs font-black text-slate-800">
                                {staff.shift?.name || 'Shift Standar'} ({staff.shift?.startTime || '09:00'} - {staff.shift?.endTime || '17:00'})
                            </span>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs">📋</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jobdesk & SOP Resmi</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium whitespace-pre-line leading-relaxed">
                            {staff.jobdesk || '1. Melayani pelanggan dengan ramah & 5S.\n2. Memeriksa kebersihan area biliar.\n3. Menginput pesanan FnB cepat & teliti.\n4. Mematuhi SOP operasional & jam kerja shift.'}
                        </p>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Status Akun</span>
                            <span className="text-xs font-black text-emerald-600">Aktif & Terverifikasi KYC</span>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full py-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-100 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                >
                    <LogOut className="w-4 h-4" /> Keluar dari Akun Staf
                </button>
            </div>

            {/* Custom Modal Konfirmasi Keluar (Tanpa browser confirm) */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                            <AlertTriangle className="w-8 h-8" />
                        </div>

                        <div>
                            <h3 className="text-base font-black text-slate-900">Keluar Akun Staf?</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Apakah Anda yakin ingin keluar dari akun <strong className="text-slate-800">{staff?.name}</strong>? Anda harus memasukkan PIN lagi untuk masuk.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeLogout}
                                className="py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Ya, Keluar</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
