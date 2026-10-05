import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Clock, Trophy, Camera, Star, MapPin, UserCheck, Navigation } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';

export default function Employees() {
    const [activeTab, setActiveTab] = useState<'list' | 'attendance' | 'shift' | 'approval' | 'location' | 'bonus'>('list');

    const [employees, setEmployees] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [workShifts, setWorkShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form Staf
    const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [empForm, setEmpForm] = useState({
        id: '',
        name: '',
        position: 'Waitress',
        phone: '',
        pinCode: '1234',
        salary: 0,
        jobdesk: '',
        shiftId: ''
    });

    // Form Shift Kerja
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [isEditingShift, setIsEditingShift] = useState(false);
    const [shiftForm, setShiftForm] = useState({
        id: '',
        name: '',
        startTime: '09:00',
        endTime: '19:00',
        graceLateMinutes: 15
    });

    // Form Venue GPS
    const [venueGpsForm, setVenueGpsForm] = useState({
        latitude: -8.6500,
        longitude: 115.2166,
        radiusMeters: 100
    });
    const [gpsSaving, setGpsSaving] = useState(false);
    const [gpsSuccess, setGpsSuccess] = useState(false);

    const getTodayIso = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const [selectedDate, setSelectedDate] = useState<string>(getTodayIso);

    const [selectedPhoto, setSelectedPhoto] = useState<{
        url: string;
        name?: string;
        position?: string;
        time?: string;
        status?: string;
        lateMinutes?: number;
    } | null>(null);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch employees');
            setEmployees([]);
        }
    };

    const fetchWorkShifts = async () => {
        try {
            const res = await api.get('/staff/work-shifts');
            setWorkShifts(res.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch work shifts');
            setWorkShifts([]);
        }
    };

    const fetchAttendance = async (dateStr?: string) => {
        try {
            const d = dateStr || selectedDate;
            const res = await api.get(`/attendance/daily?date=${d}`);
            setAttendance(res.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch daily attendance');
            setAttendance([]);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await api.get('/staff/leaderboard');
            setLeaderboard(res.data?.data?.rankings || []);
        } catch (err) {
            console.error('Failed to fetch leaderboard');
        }
    };

    const fetchVenue = async () => {
        try {
            const res = await api.get('/staff/venue');
            if (res.data?.success) {
                setVenueGpsForm({
                    latitude: res.data.data.latitude || -8.6500,
                    longitude: res.data.data.longitude || 115.2166,
                    radiusMeters: res.data.data.radiusMeters || 100
                });
            }
        } catch (err) {
            console.error('Failed to fetch venue location');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchEmployees(), fetchWorkShifts(), fetchAttendance(), fetchLeaderboard(), fetchVenue()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Save or Edit Employee
    const saveEmployee = async () => {
        if (!empForm.name || !empForm.position) {
            vamosAlert('Nama dan Posisi wajib diisi');
            return;
        }
        try {
            const { id, ...payload } = empForm;
            if (isEditing) {
                await api.put(`/employees/${id}`, payload);
            } else {
                await api.post('/employees', payload);
            }
            setIsEmpModalOpen(false);
            fetchEmployees();
            fetchWorkShifts();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal menyimpan data karyawan');
        }
    };

    // Save or Edit WorkShift
    const saveWorkShift = async () => {
        if (!shiftForm.name || !shiftForm.startTime || !shiftForm.endTime) {
            vamosAlert('Nama shift, jam mulai, dan jam selesai wajib diisi');
            return;
        }
        try {
            if (isEditingShift) {
                await api.put(`/staff/work-shifts/${shiftForm.id}`, shiftForm);
            } else {
                await api.post('/staff/work-shifts', shiftForm);
            }
            setIsShiftModalOpen(false);
            fetchWorkShifts();
            fetchEmployees();
            vamosAlert('Shift kerja berhasil disimpan');
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal menyimpan shift kerja');
        }
    };

    const deleteWorkShift = async (id: string, name: string) => {
        if (!(await vamosConfirm(`Apakah Anda yakin ingin menghapus "${name}"? Karyawan pada shift ini akan di-reset ke tanpa shift.`))) return;
        try {
            await api.delete(`/staff/work-shifts/${id}`);
            fetchWorkShifts();
            fetchEmployees();
            vamosAlert('Shift kerja berhasil dihapus');
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal menghapus shift kerja');
        }
    };

    // Approval Staf
    const handleApproval = async (employeeId: string, status: 'APPROVED' | 'REJECTED') => {
        const actionLabel = status === 'APPROVED' ? 'menyetujui' : 'menolak';
        if (!(await vamosConfirm(`Apakah Anda yakin ingin ${actionLabel} staf ini?`))) return;

        try {
            await api.put(`/staff/employee/${employeeId}/approval`, { status });
            vamosAlert(`Staf berhasil di-${status.toLowerCase()}`);
            fetchEmployees();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal mengubah status konfirmasi');
        }
    };

    // Save Venue Location GPS
    const handleSaveVenueGps = async () => {
        setGpsSaving(true);
        setGpsSuccess(false);
        try {
            await api.put('/staff/venue', venueGpsForm);
            setGpsSuccess(true);
            fetchVenue();
            setTimeout(() => setGpsSuccess(false), 3000);
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal menyimpan titik lokasi venue');
        } finally {
            setGpsSaving(false);
        }
    };

    // Get Current Location from Browser
    const handleDetectCurrentLocation = () => {
        if (!navigator.geolocation) {
            vamosAlert('Browser tidak mendukung geolokasi');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => {
                setVenueGpsForm(prev => ({
                    ...prev,
                    latitude: Number(pos.coords.latitude.toFixed(6)),
                    longitude: Number(pos.coords.longitude.toFixed(6))
                }));
                vamosAlert(`Titik GPS berhasil terdeteksi: Lat ${pos.coords.latitude.toFixed(6)}, Lng ${pos.coords.longitude.toFixed(6)}`);
            },
            () => {
                vamosAlert('Izin akses lokasi GPS ditolak oleh browser');
            },
            { enableHighAccuracy: true }
        );
    };

    const deleteEmployee = async (id: string) => {
        if (!(await vamosConfirm('Apakah Anda yakin ingin menonaktifkan karyawan ini?'))) return;
        try {
            await api.delete(`/employees/${id}`);
            fetchEmployees();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal menghapus karyawan');
        }
    };

    const clockIn = async (employeeId: string) => {
        try {
            await api.post('/attendance/checkin', { employeeId });
            fetchAttendance();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Error clock-in');
        }
    };

    const clockOut = async (attendanceId: string) => {
        try {
            await api.put(`/attendance/checkout/${attendanceId}`, {});
            fetchAttendance();
        } catch (err: any) {
            vamosAlert('Error checking out');
        }
    };

    const pendingEmployees = employees.filter(e => e.approvalStatus === 'PENDING');

    if (loading) return <div className="p-8"><div className="animate-spin text-gray-500 w-8 h-8 rounded-full border-4 border-t-[#00ff66]"></div></div>;

    return (
        <div className="fade-in">
            {/* Header Navigation Tabs */}
            <div className="flex flex-wrap gap-2.5 mb-8">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition-all ${
                        activeTab === 'list'
                            ? 'bg-[#00ff66] text-[#0a0a0a] shadow-lg shadow-[#00ff66]/20'
                            : 'bg-[#141414] text-gray-400 hover:text-white border border-[#222222]'
                    }`}
                >
                    <Users className="w-4 h-4" /> Daftar Staf ({employees.length})
                </button>

                <button
                    onClick={() => setActiveTab('shift')}
                    className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition-all ${
                        activeTab === 'shift'
                            ? 'bg-[#00ff66] text-[#0a0a0a] shadow-lg shadow-[#00ff66]/20'
                            : 'bg-[#141414] text-gray-400 hover:text-white border border-[#222222]'
                    }`}
                >
                    <Clock className="w-4 h-4" /> Pengaturan Shift & Jam Kerja ({workShifts.length})
                </button>

                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition-all ${
                        activeTab === 'attendance'
                            ? 'bg-[#00ff66] text-[#0a0a0a] shadow-lg shadow-[#00ff66]/20'
                            : 'bg-[#141414] text-gray-400 hover:text-white border border-[#222222]'
                    }`}
                >
                    <Camera className="w-4 h-4" /> Absensi Harian (Selfie & GPS)
                </button>

                <button
                    onClick={() => setActiveTab('approval')}
                    className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition-all relative ${
                        activeTab === 'approval'
                            ? 'bg-[#00e5ff] text-black shadow-lg shadow-[#00e5ff]/20'
                            : 'bg-[#141414] text-gray-400 hover:text-white border border-[#222222]'
                    }`}
                >
                    <UserCheck className="w-4 h-4" /> Konfirmasi Staf
                    {pendingEmployees.length > 0 && (
                        <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                            {pendingEmployees.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('location')}
                    className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition-all ${
                        activeTab === 'location'
                            ? 'bg-[#00e5ff] text-black shadow-lg shadow-[#00e5ff]/20'
                            : 'bg-[#141414] text-gray-400 hover:text-white border border-[#222222]'
                    }`}
                >
                    <MapPin className="w-4 h-4" /> Lokasi & Radius Maps
                </button>

                <button
                    onClick={() => setActiveTab('bonus')}
                    className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition-all ${
                        activeTab === 'bonus'
                            ? 'bg-[#ff9900] text-black shadow-lg shadow-[#ff9900]/20'
                            : 'bg-[#141414] text-gray-400 hover:text-white border border-[#222222]'
                    }`}
                >
                    <Trophy className="w-4 h-4" /> Karyawan Teladan & Bonus KPI
                </button>
            </div>

            {/* TAB 1: DAFTAR STAF */}
            {activeTab === 'list' && (
                <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#00aaff]" />
                                Manajemen Staf, PIN & Jobdesk
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">Kelola data karyawan, jam kerja shift, rincian jobdesk, dan akses login aplikasi Vamos Staff</p>
                        </div>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setEmpForm({
                                    id: '',
                                    name: '',
                                    position: 'Waitress',
                                    phone: '',
                                    pinCode: '1234',
                                    salary: 0,
                                    jobdesk: '1. Melayani customer dengan 5S (Senyum, Sapa, Salam, Sopan, Santun).\n2. Memeriksa kebersihan meja & area biliar.\n3. Menginput pesanan FnB secara cepat & teliti.',
                                    shiftId: workShifts[0]?.id || ''
                                });
                                setIsEmpModalOpen(true);
                            }}
                            className="bg-[#0a0a0a] border border-[#00ff66]/40 text-[#00ff66] px-4 py-2.5 rounded-xl flex items-center font-bold hover:bg-[#00ff66] hover:text-[#0a0a0a] transition-all text-xs shadow-lg shadow-[#00ff66]/10"
                        >
                            <Plus className="w-4 h-4 mr-1.5" /> Tambah Karyawan Baru
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs uppercase font-semibold tracking-wider text-gray-500 bg-[#0a0a0a]">
                                <tr>
                                    <th className="p-4 rounded-tl-lg">Nama Karyawan</th>
                                    <th className="p-4">Posisi</th>
                                    <th className="p-4">Jam Kerja / Shift</th>
                                    <th className="p-4">WhatsApp / HP</th>
                                    <th className="p-4">PIN Akses</th>
                                    <th className="p-4">Jobdesk & SOP</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 rounded-tr-lg text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222222]">
                                {employees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-[#0a0a0a]/50 transition-colors">
                                        <td className="p-4 font-bold text-white flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00ff66]/20 to-[#00aaff]/20 border border-[#222222] flex items-center justify-center font-bold text-xs text-[#00ff66]">
                                                {emp.name?.charAt(0)}
                                            </div>
                                            {emp.name}
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            <span className="px-2.5 py-1 rounded-lg bg-[#0a0a0a] border border-[#222222] text-xs font-semibold text-[#00e5ff]">
                                                {emp.position}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {emp.shift ? (
                                                <div>
                                                    <span className="text-xs font-extrabold text-white block">
                                                        {emp.shift.name}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        {emp.shift.startTime} - {emp.shift.endTime} (Toleransi: {emp.shift.graceLateMinutes || 15}m)
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-500 italic">Belum Ada Shift</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs font-mono text-gray-300">{emp.phone || '-'}</td>
                                        <td className="p-4 text-xs font-mono font-bold text-[#00ff66]">{emp.pinCode || '1234'}</td>
                                        <td className="p-4 text-xs text-gray-400 max-w-xs truncate">
                                            {emp.jobdesk ? emp.jobdesk.replace(/\n/g, ' • ') : 'SOP Standar'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-0.5 text-[10px] rounded-full border font-bold ${
                                                emp.approvalStatus === 'APPROVED' || !emp.approvalStatus
                                                    ? 'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/30'
                                                    : emp.approvalStatus === 'PENDING'
                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                                    : 'bg-red-500/10 text-red-500 border-red-500/30'
                                            }`}>
                                                {emp.approvalStatus || emp.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setEmpForm({
                                                            id: emp.id,
                                                            name: emp.name,
                                                            position: emp.position,
                                                            phone: emp.phone || '',
                                                            pinCode: emp.pinCode || '1234',
                                                            salary: emp.salary,
                                                            jobdesk: emp.jobdesk || '',
                                                            shiftId: emp.shiftId || ''
                                                        });
                                                        setIsEditing(true);
                                                        setIsEmpModalOpen(true);
                                                    }}
                                                    className="text-[#00aaff] bg-[#00aaff]/10 p-2 rounded-xl hover:bg-[#00aaff] hover:text-[#0a0a0a] transition-colors"
                                                    title="Edit Data, Shift & Jobdesk"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteEmployee(emp.id)}
                                                    className="text-[#ff3333] bg-[#ff3333]/10 p-2 rounded-xl hover:bg-[#ff3333] hover:text-white transition-colors"
                                                    title="Nonaktifkan Staf"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => clockIn(emp.id)}
                                                    className="text-[#00ff66] bg-[#00ff66]/10 p-2 rounded-xl hover:bg-[#00ff66] hover:text-[#0a0a0a] transition-colors"
                                                    title="Clock In Manual Kasir"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: PENGATURAN SHIFT & JAM KERJA */}
            {activeTab === 'shift' && (
                <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[#00ff66]" />
                                Master Shift & Jadwal Jam Kerja
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Tentukan jadwal shift, jam mulai & selesai kerja, serta toleransi batas telat absensi staf
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setIsEditingShift(false);
                                setShiftForm({
                                    id: '',
                                    name: '',
                                    startTime: '09:00',
                                    endTime: '19:00',
                                    graceLateMinutes: 15
                                });
                                setIsShiftModalOpen(true);
                            }}
                            className="bg-[#00ff66] text-black px-4 py-2.5 rounded-xl flex items-center font-extrabold hover:opacity-90 transition-all text-xs shadow-lg glow-neon"
                        >
                            <Plus className="w-4 h-4 mr-1.5" /> Tambah Shift Baru
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {workShifts.map(shift => (
                            <div key={shift.id} className="bg-[#0a0a0a] border border-[#222222] rounded-2xl p-4.5 space-y-3.5 hover:border-[#00ff66]/40 transition-all shadow-md">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-extrabold text-sm text-white">{shift.name}</h3>
                                        <span className="text-[11px] text-[#00e5ff] font-bold block mt-0.5">
                                            ⏰ {shift.startTime} - {shift.endTime}
                                        </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-md bg-[#141414] border border-[#222222] text-[10px] font-bold text-gray-400">
                                        Toleransi: {shift.graceLateMinutes || 15}m
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Staf yang bertugas:</span>
                                    <span className="text-xs font-black text-[#00ff66]">
                                        {shift._count?.employees || 0} Karyawan
                                    </span>
                                </div>

                                <div className="flex gap-2 pt-1 border-t border-[#1a1a1a]">
                                    <button
                                        onClick={() => {
                                            setShiftForm({
                                                id: shift.id,
                                                name: shift.name,
                                                startTime: shift.startTime,
                                                endTime: shift.endTime,
                                                graceLateMinutes: shift.graceLateMinutes || 15
                                            });
                                            setIsEditingShift(true);
                                            setIsShiftModalOpen(true);
                                        }}
                                        className="flex-1 py-2 rounded-xl bg-[#141414] hover:bg-[#222222] border border-[#333333] text-gray-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                    >
                                        <Edit2 className="w-3.5 h-3.5 text-[#00aaff]" /> Edit Shift
                                    </button>
                                    <button
                                        onClick={() => deleteWorkShift(shift.id, shift.name)}
                                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all"
                                        title="Hapus Shift"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: ABSENSI HARIAN REALTIME (SELFIE & GPS) */}
            {activeTab === 'attendance' && (
                <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
                        <div>
                            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                                <Camera className="w-5 h-5 text-[#00ff66]" />
                                Log Absensi Harian ({selectedDate === getTodayIso() ? 'Hari Ini' : selectedDate})
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Menampilkan rekap absensi per tanggal. Hari baru otomatis bersih dan siap mencatat kehadiran staf.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => {
                                    const newDate = e.target.value;
                                    setSelectedDate(newDate);
                                    fetchAttendance(newDate);
                                }}
                                className="bg-[#0a0a0a] border border-[#222222] text-xs font-bold text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#00ff66]"
                            />
                            {selectedDate !== getTodayIso() && (
                                <button
                                    onClick={() => {
                                        const today = getTodayIso();
                                        setSelectedDate(today);
                                        fetchAttendance(today);
                                    }}
                                    className="px-3 py-2 rounded-xl bg-[#222222] hover:bg-[#333333] text-[#00ff66] text-xs font-bold transition-all border border-[#333333]"
                                >
                                    Hari Ini
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs uppercase font-semibold tracking-wider text-gray-500 bg-[#0a0a0a]">
                                <tr>
                                    <th className="p-4 rounded-tl-lg">Foto Selfie</th>
                                    <th className="p-4">Nama Staf</th>
                                    <th className="p-4">Posisi</th>
                                    <th className="p-4">Shift</th>
                                    <th className="p-4">Jam Masuk</th>
                                    <th className="p-4">Jam Pulang</th>
                                    <th className="p-4">Status & Telat</th>
                                    <th className="p-4 rounded-tr-lg text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222222]">
                                {attendance.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-gray-500 text-xs font-bold">
                                            Belum ada data absensi untuk tanggal {selectedDate}.
                                        </td>
                                    </tr>
                                ) : (
                                    attendance.map(att => (
                                        <tr key={att.id} className="hover:bg-[#0a0a0a]/50 transition-colors">
                                            <td className="p-4">
                                                {att.checkInPhoto ? (
                                                    <button
                                                        onClick={() => setSelectedPhoto({
                                                            url: att.checkInPhoto,
                                                            name: att.employee?.name || att.employeeName,
                                                            position: att.employee?.position || att.position,
                                                            time: att.checkIn,
                                                            status: att.status,
                                                            lateMinutes: att.lateMinutes
                                                        })}
                                                        className="px-3 py-1.5 rounded-xl bg-[#00ff66]/10 hover:bg-[#00ff66]/20 border border-[#00ff66]/30 text-[#00ff66] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer glow-sm"
                                                    >
                                                        <Camera className="w-3.5 h-3.5" /> Lihat Selfie
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] text-gray-500 italic flex items-center gap-1">
                                                        <Camera className="w-3.5 h-3.5 opacity-30" /> Tanpa Foto
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 font-bold text-white">{att.employee?.name || att.employeeName || '-'}</td>
                                            <td className="p-4 text-xs text-gray-400">{att.employee?.position || att.position || '-'}</td>
                                            <td className="p-4 text-xs font-semibold text-gray-300">{att.shift?.name || att.employee?.shift?.name || '-'}</td>
                                            <td className="p-4 text-xs text-gray-300 font-mono">
                                                {att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : '-'}
                                            </td>
                                            <td className="p-4 text-xs text-gray-300 font-mono">
                                                {att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : <span className="text-amber-400 font-bold">Masih Bertugas</span>}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-0.5 text-[10px] rounded-full border font-bold ${
                                                    att.status === 'PRESENT'
                                                        ? 'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/30'
                                                        : att.status === 'LATE'
                                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                                        : 'bg-red-500/10 text-red-500 border-red-500/30'
                                                }`}>
                                                    {att.status === 'PRESENT' ? 'Tepat Waktu' : att.status === 'LATE' ? `Telat ${att.lateMinutes ?? 0} Menit` : att.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {!att.checkOut && (
                                                    <button
                                                        onClick={() => clockOut(att.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold transition-all"
                                                    >
                                                        Clock Out
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 4: KONFIRMASI / APPROVAL PENDAFTARAN STAF */}
            {activeTab === 'approval' && (
                <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-[#00e5ff]" />
                                Konfirmasi Pendaftaran Karyawan Baru
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">Setujui atau tolak staf yang baru mendaftar dari aplikasi Vamos Staff</p>
                        </div>
                    </div>

                    {pendingEmployees.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 bg-[#0a0a0a] rounded-2xl border border-[#222222]">
                            <UserCheck className="w-10 h-10 mx-auto text-gray-600 mb-2" />
                            <h4 className="font-bold text-sm text-gray-400">Tidak ada pengajuan staf baru yang pending.</h4>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingEmployees.map(emp => (
                                <div key={emp.id} className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#222222] space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black text-sm text-white">{emp.name}</h4>
                                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                                            Menunggu Persetujuan
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400 space-y-1">
                                        <p>Posisi: <strong className="text-white">{emp.position}</strong></p>
                                        <p>No. WA: <strong className="text-white font-mono">{emp.phone}</strong></p>
                                    </div>
                                    <div className="flex gap-2 pt-2 border-t border-[#1a1a1a]">
                                        <button
                                            onClick={() => handleApproval(emp.id, 'APPROVED')}
                                            className="flex-1 py-2 rounded-xl bg-[#00ff66] text-black font-extrabold text-xs hover:opacity-90 transition-all shadow-md"
                                        >
                                            Setujui Akun
                                        </button>
                                        <button
                                            onClick={() => handleApproval(emp.id, 'REJECTED')}
                                            className="flex-1 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 font-extrabold text-xs hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            Tolak
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 5: LOKASI & RADIUS GPS */}
            {activeTab === 'location' && (
                <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6 max-w-2xl space-y-6">
                    <div>
                        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-[#00e5ff]" />
                            Pengaturan Lokasi GPS & Geofencing Outlet
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Atur koordinat pusat outlet Vamos dan batas radius absensi agar karyawan hanya bisa absen di tempat kerja.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#222222] space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Latitude</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={venueGpsForm.latitude}
                                    onChange={e => setVenueGpsForm(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                                    className="w-full bg-[#141414] border border-[#222222] rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#00ff66]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Longitude</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={venueGpsForm.longitude}
                                    onChange={e => setVenueGpsForm(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                                    className="w-full bg-[#141414] border border-[#222222] rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#00ff66]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Batas Radius Absensi (Meter)</label>
                            <input
                                type="number"
                                value={venueGpsForm.radiusMeters}
                                onChange={e => setVenueGpsForm(prev => ({ ...prev, radiusMeters: parseInt(e.target.value) || 100 }))}
                                className="w-full bg-[#141414] border border-[#222222] rounded-xl px-4 py-2.5 text-xs font-bold text-[#00ff66] focus:outline-none focus:border-[#00ff66]"
                            />
                            <span className="text-[11px] text-gray-500 block mt-1">
                                Rekomendasi: 50 - 150 meter untuk area outlet/gedung biliar.
                            </span>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleDetectCurrentLocation}
                                className="flex-1 py-2.5 rounded-xl bg-[#222222] hover:bg-[#333333] text-gray-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                                <Navigation className="w-4 h-4 text-[#00e5ff]" /> Deteksi Lokasi Sekarang
                            </button>
                            <button
                                onClick={handleSaveVenueGps}
                                disabled={gpsSaving}
                                className="flex-1 py-2.5 rounded-xl bg-[#00ff66] text-black font-extrabold text-xs hover:opacity-90 transition-all glow-neon shadow-lg"
                            >
                                {gpsSaving ? 'Menyimpan...' : gpsSuccess ? 'Tersimpan!' : 'Simpan Koordinat GPS'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 6: KARYAWAN TELADAN & BONUS KPI */}
            {activeTab === 'bonus' && (
                <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-[#ff9900]" />
                                Peringkat Kedisiplinan & Bonus KPI Staf
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Performa dihitung otomatis dengan kebijakan resmi toleransi ketidakhadiran maksimal 2x per bulan.
                            </p>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-[#0a0a0a] border border-[#00ff66]/30 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#00ff66]" />
                            <span className="text-xs font-bold text-gray-300">
                                Kuota Toleransi Absen: <strong className="text-[#00ff66]">2x / Bulan</strong> (Bebas Potongan)
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs uppercase font-semibold tracking-wider text-gray-500 bg-[#0a0a0a]">
                                <tr>
                                    <th className="p-4 rounded-tl-lg">Peringkat</th>
                                    <th className="p-4">Nama Staf</th>
                                    <th className="p-4">Posisi</th>
                                    <th className="p-4">Toleransi Izin/Off (2x/Bln)</th>
                                    <th className="p-4">Skor Kehadiran</th>
                                    <th className="p-4">Rating Customer</th>
                                    <th className="p-4">Skor Komprehensif</th>
                                    <th className="p-4">Estimasi Bonus</th>
                                    <th className="p-4 rounded-tr-lg">Badge</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222222]">
                                {leaderboard.map((item, idx) => (
                                    <tr key={item.employeeId || idx} className="hover:bg-[#0a0a0a]/50">
                                        <td className="p-4">
                                            <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs ${
                                                idx === 0
                                                    ? 'bg-[#ffcc00] text-black shadow-lg shadow-[#ffcc00]/20'
                                                    : idx === 1
                                                    ? 'bg-gray-300 text-black'
                                                    : idx === 2
                                                    ? 'bg-[#cd7f32] text-white'
                                                    : 'bg-[#1a1a1a] text-gray-400'
                                            }`}>
                                                #{idx + 1}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-white">{item.name}</td>
                                        <td className="p-4 text-gray-300 text-xs">{item.position}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className={`text-xs font-bold ${
                                                    (item.unexcusedAbsenceDays || 0) > 0
                                                        ? 'text-red-400'
                                                        : (item.toleratedAbsenceDays || 0) > 0
                                                        ? 'text-amber-400'
                                                        : 'text-[#00ff66]'
                                                }`}>
                                                    {item.toleratedAbsenceDays || 0}/2 Kuota Terpakai
                                                </span>
                                                <span className="text-[10px] text-gray-500">
                                                    {(item.unexcusedAbsenceDays || 0) > 0
                                                        ? `Lewat ${item.unexcusedAbsenceDays} hari (Penalti)`
                                                        : 'Aman (Bebas Penalti)'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-bold text-[#00ff66]">
                                            {item.attendanceScore}% ({item.onTimeDays || 0} Hari Tepat Waktu)
                                        </td>
                                        <td className="p-4 text-xs font-bold text-yellow-400 flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 fill-yellow-400" /> {item.ratingScore}
                                        </td>
                                        <td className="p-4 font-black text-sm text-[#00e5ff]">{item.overallScore}%</td>
                                        <td className="p-4 font-mono font-bold text-xs text-[#00ff66]">
                                            Rp {item.totalBonus?.toLocaleString() || 0}
                                        </td>
                                        <td className="p-4">
                                            {item.badge === 'STAFF_OF_THE_MONTH' ? (
                                                <span className="px-2.5 py-1 rounded-full bg-[#ffcc00]/10 border border-[#ffcc00]/30 text-[#ffcc00] text-[10px] font-black">
                                                    👑 Staff of the Month
                                                </span>
                                            ) : item.badge === 'PERFECT_ATTENDANCE' ? (
                                                <span className="px-2.5 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66] text-[10px] font-black">
                                                    ✨ Perfect Attendance
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 text-xs">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Photo Modal Preview */}
            {selectedPhoto && (
                <div
                    onClick={() => setSelectedPhoto(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-[#141414] border border-[#222222] p-5 rounded-3xl max-w-sm w-full space-y-3"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                            <div>
                                <h3 className="font-extrabold text-white text-sm">{selectedPhoto.name || 'Foto Absensi Staf'}</h3>
                                <p className="text-[11px] text-gray-400">{selectedPhoto.position || '-'}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                selectedPhoto.status === 'PRESENT'
                                    ? 'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/30'
                                    : selectedPhoto.status === 'LATE'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : 'bg-gray-800 text-gray-300 border-gray-700'
                            }`}>
                                {selectedPhoto.status === 'PRESENT' ? 'Tepat Waktu' : selectedPhoto.status === 'LATE' ? `Telat ${selectedPhoto.lateMinutes ?? 0}m` : selectedPhoto.status || 'Hadir'}
                            </span>
                        </div>

                        <img
                            src={selectedPhoto.url}
                            alt="Preview Selfie"
                            className="w-full rounded-2xl object-cover aspect-[3/4] border border-[#222222] shadow-2xl"
                        />

                        {selectedPhoto.time && (
                            <p className="text-[11px] text-gray-400 text-center font-mono">
                                Jam Masuk: {new Date(selectedPhoto.time).toLocaleTimeString()}
                            </p>
                        )}

                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="w-full py-2.5 rounded-xl bg-[#222222] hover:bg-[#333333] text-xs font-bold text-white transition-all cursor-pointer"
                        >
                            Tutup Preview
                        </button>
                    </div>
                </div>
            )}

            {/* Add / Edit Employee Modal with Shift Selection & Jobdesk */}
            {isEmpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#141414] border border-[#222222] p-6 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-black text-white mb-4">
                            {isEditing ? 'Edit Data & Jobdesk Staf' : 'Tambah Karyawan Baru'}
                        </h2>
                        <div className="space-y-3.5">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Rian Pratama"
                                    value={empForm.name}
                                    onChange={e => setEmpForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#00ff66] text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Pilih Shift / Jam Kerja</label>
                                <select
                                    value={empForm.shiftId}
                                    onChange={e => setEmpForm(prev => ({ ...prev, shiftId: e.target.value }))}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#00ff66] text-[#00ff66]"
                                >
                                    <option value="">-- Pilih Shift Kerja --</option>
                                    {workShifts.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.startTime} - {s.endTime})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Posisi / Jabatan</label>
                                <select
                                    value={empForm.position}
                                    onChange={e => setEmpForm(prev => ({ ...prev, position: e.target.value }))}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#00ff66] text-white"
                                >
                                    <option value="Billiard Casteling & FnB Ambassador">Billiard Casteling & FnB Ambassador</option>
                                    <option value="Senior Waiter & Cafe Host">Senior Waiter & Cafe Host</option>
                                    <option value="Senior Barista & Closing Coordinator">Senior Barista & Closing Coordinator</option>
                                    <option value="Head Cashier & Player Onboarding Specialist">Head Cashier & Player Onboarding Specialist</option>
                                    <option value="Head of Kitchen & Food Production">Head of Kitchen & Food Production</option>
                                    <option value="Kasir Siang & General Cleaning">Kasir Siang & General Cleaning</option>
                                    <option value="Waitress">Waitress / Waiter</option>
                                    <option value="Kasir">Kasir</option>
                                    <option value="Manager">Manager Operasional</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">No. WhatsApp</label>
                                    <input
                                        type="text"
                                        placeholder="628123456789"
                                        value={empForm.phone}
                                        onChange={e => setEmpForm(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#00ff66] text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">PIN Akses (4-6 Digit)</label>
                                    <input
                                        type="text"
                                        placeholder="1234"
                                        value={empForm.pinCode}
                                        onChange={e => setEmpForm(prev => ({ ...prev, pinCode: e.target.value }))}
                                        className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#00ff66] text-[#00ff66]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Gaji Pokok (Rp)</label>
                                <input
                                    type="number"
                                    placeholder="Gaji pokok"
                                    value={empForm.salary || ''}
                                    onChange={e => setEmpForm(prev => ({ ...prev, salary: parseInt(e.target.value) || 0 }))}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#00ff66] text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                                    Jobdesk & SOP Harian (Tampil di HP Karyawan)
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Ketik rincian tugas & SOP harian yang wajib dijalankan staf ini..."
                                    value={empForm.jobdesk}
                                    onChange={e => setEmpForm(prev => ({ ...prev, jobdesk: e.target.value }))}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-[#00ff66] text-white resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setIsEmpModalOpen(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-[#222222] text-xs font-bold text-gray-300 hover:bg-[#333333]"
                            >
                                Batal
                            </button>
                            <button
                                onClick={saveEmployee}
                                className="flex-1 px-4 py-2.5 bg-[#00ff66] text-black rounded-xl text-xs font-extrabold hover:opacity-90 glow-neon"
                            >
                                Simpan Data & Shift
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create / Edit Shift Modal */}
            {isShiftModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#141414] border-2 border-[#00ff66]/40 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
                        <div>
                            <h2 className="text-lg font-black text-white">
                                {isEditingShift ? 'Edit Shift Kerja' : 'Tambah Shift Kerja Baru'}
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Jadwal ini otomatis diterapkan pada HP karyawan saat absensi
                            </p>
                        </div>

                        <div className="space-y-3.5">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Nama Shift</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Shift Pagi (09:00 - 17:00)"
                                    value={shiftForm.name}
                                    onChange={e => setShiftForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#00ff66]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Jam Mulai Kerja</label>
                                    <input
                                        type="text"
                                        placeholder="09:00"
                                        value={shiftForm.startTime}
                                        onChange={e => setShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
                                        className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-[#00ff66] focus:outline-none focus:border-[#00ff66]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Jam Selesai Kerja</label>
                                    <input
                                        type="text"
                                        placeholder="19:00"
                                        value={shiftForm.endTime}
                                        onChange={e => setShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
                                        className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-[#00e5ff] focus:outline-none focus:border-[#00ff66]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                                    Toleransi Keterlambatan (Menit)
                                </label>
                                <input
                                    type="number"
                                    placeholder="15"
                                    value={shiftForm.graceLateMinutes}
                                    onChange={e => setShiftForm(prev => ({ ...prev, graceLateMinutes: parseInt(e.target.value) || 0 }))}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#00ff66]"
                                />
                                <span className="text-[10px] text-gray-500 block mt-1">
                                    Jika toleransi 15 menit dan shift mulai 09:00, staf yang absen setelah 09:15 akan tercatat TELAT.
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsShiftModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl bg-[#222222] text-xs font-bold text-gray-300 hover:bg-[#333333]"
                            >
                                Batal
                            </button>
                            <button
                                onClick={saveWorkShift}
                                className="flex-1 py-2.5 rounded-xl bg-[#00ff66] text-black font-extrabold text-xs hover:opacity-90 transition-all glow-neon shadow-lg"
                            >
                                Simpan Shift
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
