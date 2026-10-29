import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Clock, Trophy, Camera, Star, MapPin, UserCheck, Navigation, Settings as SettingsIcon, FileText, Save, BookOpen, Flame, Fingerprint, Timer, Compass, Sparkles, ShieldAlert, LogIn, LogOut, Delete, X } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';

export default function Employees() {
    const [activeTab, setActiveTab] = useState<'list' | 'attendance' | 'shift' | 'approval' | 'location' | 'bonus' | 'bonus_settings'>('list');

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

    // Form Venue GPS & Hardware Validation Toggles (Standar POOOS)
    const [venueGpsForm, setVenueGpsForm] = useState({
        latitude: -8.6500,
        longitude: 115.2166,
        radiusMeters: 100,
        enableGpsValidation: true,
        enableCameraPhoto: true,
        googleMapsUrl: ''
    });
    const [gpsSaving, setGpsSaving] = useState(false);
    const [gpsSuccess, setGpsSuccess] = useState(false);
    const [resolvingMaps, setResolvingMaps] = useState(false);

    // Terminal PIN Absensi Staf (Standar POOOS ClockInModal)
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [pinStatusMsg, setPinStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Koreksi Presensi Staf & Auto Cut-Off EOD (Standar POOOS)
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [editingAttendance, setEditingAttendance] = useState<any | null>(null);
    const [adjustForm, setAdjustForm] = useState({
        checkInTime: '09:00',
        checkOutTime: '',
        status: 'PRESENT',
        lateMinutes: 0,
        notes: ''
    });
    const [savingAdjust, setSavingAdjust] = useState(false);
    const [runningAutoCutoff, setRunningAutoCutoff] = useState(false);

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

    // Pengaturan Fleksibel Sistem Bonus (Omzet Harian & Zero Late)
    const [bonusConfigForm, setBonusConfigForm] = useState({
        dailyOmzetTiers: [
            { level: 1, name: 'Tier 1 (Target Minimum)', target: 2000000, bonusPerStaff: 10000, label: 'Bronze Target' },
            { level: 2, name: 'Tier 2 (Target Reguler)', target: 3500000, bonusPerStaff: 20000, label: 'Silver Target' },
            { level: 3, name: 'Tier 3 (Target Super)', target: 5000000, bonusPerStaff: 35000, label: 'Gold Crown Target' }
        ],
        disciplineBonus: {
            targetDays: 30,
            bonusAmount: 150000,
            allowedAbsenceQuota: 2
        }
    });
    const [isSavingBonusConfig, setIsSavingBonusConfig] = useState(false);

    // Modal Fleksibel SOP & Jobdesk Staf
    const [selectedEmpForJobdesk, setSelectedEmpForJobdesk] = useState<any>(null);
    const [customJobdeskText, setCustomJobdeskText] = useState('');
    const [isSavingJobdesk, setIsSavingJobdesk] = useState(false);

    const SOP_TEMPLATES = [
        {
            title: '🍹 Waiter & Cafe Host',
            text: `1. Melayani customer dengan 5S (Senyum, Sapa, Salam, Sopan, Santun).\n2. Memeriksa kebersihan area makan, meja biliar, stick & bola.\n3. Menginput pesanan FnB secara cepat, teliti, dan bacakan ulang pesanan.\n4. Aktif melakukan up-selling menu pendamping & minuman pitcher.`
        },
        {
            title: '🎱 Billiard Casteling & Host',
            text: `1. Menata bola biliar segitiga dengan rapi & presisi.\n2. Membersihkan laken/karpet meja biliar dari debu & kapur kalsium.\n3. Memeriksa tip stick biliar & kelengkapan koin/pencatatan waktu.\n4. Ramah mendampingi pemain serta menawarkan promo paket jam biliar.`
        },
        {
            title: '☕ Barista & Minuman',
            text: `1. Meracik kopi dan minuman sesuai takaran resep standar Vamos.\n2. Menjaga kebersihan mesin espresso, grinder, dan area bar.\n3. Melakukan rotasi bahan baku dengan sistem FIFO (First-In First-Out).\n4. Memastikan es batu dan bahan baku selalu higienis dan siap saji.`
        },
        {
            title: '🍳 Kitchen & Cook',
            text: `1. Memasak menu pesanan dengan standar rasa, porsi, dan waktu penyajian cepat.\n2. Menjaga kebersihan dapur, wajan, kompor, dan area penyimpanan bahan.\n3. Melakukan pengecekan stok bahan baku segar setiap awal dan akhir shift.\n4. Memastikan sanitasi dapur selalu bersih sebelum closing.`
        },
        {
            title: '💵 Kasir & Closing',
            text: `1. Memproses transaksi pembayaran pelanggan dengan cepat, ramah, dan teliti.\n2. Mengkonfirmasi metode pembayaran (Cash/QRIS/Transfer) dan mencetak struk.\n3. Melakukan cash count uang modal dan uang hasil penjualan saat serah terima shift.\n4. Mencetak rekap settlement EDC / QRIS dan laporan closing harian.`
        }
    ];

    const fetchBonusConfig = async () => {
        try {
            const res = await api.get('/staff/bonus-config');
            if (res.data?.success && res.data.data) {
                setBonusConfigForm(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch bonus config', err);
        }
    };

    const saveBonusConfig = async () => {
        setIsSavingBonusConfig(true);
        try {
            const res = await api.put('/staff/bonus-config', bonusConfigForm);
            if (res.data?.success) {
                vamosAlert('Pengaturan target omzet dan bonus staf berhasil disimpan!');
            }
        } catch (err: any) {
            vamosAlert('Gagal menyimpan pengaturan bonus: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSavingBonusConfig(false);
        }
    };

    const saveEmployeeJobdesk = async () => {
        if (!selectedEmpForJobdesk) return;
        setIsSavingJobdesk(true);
        try {
            const res = await api.put(`/staff/employee/${selectedEmpForJobdesk.id}/jobdesk`, {
                jobdesk: customJobdeskText
            });
            if (res.data?.success) {
                vamosAlert(`SOP & Jobdesk untuk ${selectedEmpForJobdesk.name} berhasil disimpan!`);
                setSelectedEmpForJobdesk(null);
                fetchEmployees();
            }
        } catch (err: any) {
            vamosAlert('Gagal menyimpan SOP: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSavingJobdesk(false);
        }
    };

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
                    radiusMeters: res.data.data.radiusMeters || 100,
                    enableGpsValidation: res.data.data.enableGpsValidation ?? true,
                    enableCameraPhoto: res.data.data.enableCameraPhoto ?? true,
                    googleMapsUrl: res.data.data.googleMapsUrl || ''
                });
            }
        } catch (err) {
            console.error('Failed to fetch venue location');
        }
    };

    const handleResolveMaps = async () => {
        if (!venueGpsForm.googleMapsUrl.trim()) {
            vamosAlert('Masukkan tautan Google Maps terlebih dahulu');
            return;
        }
        setResolvingMaps(true);
        try {
            const res = await api.post('/staff/venue/resolve-maps', { url: venueGpsForm.googleMapsUrl });
            if (res.data?.success && res.data.data) {
                setVenueGpsForm(prev => ({
                    ...prev,
                    latitude: Number(res.data.data.latitude.toFixed(6)),
                    longitude: Number(res.data.data.longitude.toFixed(6))
                }));
                vamosAlert(`Koordinat berhasil dideteksi dari Google Maps: ${res.data.data.latitude.toFixed(6)}, ${res.data.data.longitude.toFixed(6)}`);
            }
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal mengekstrak koordinat dari tautan Google Maps');
        } finally {
            setResolvingMaps(false);
        }
    };

    const handlePinClock = async (type: 'IN' | 'OUT') => {
        if (pinInput.length < 4) {
            setPinStatusMsg({ type: 'error', text: 'PIN minimal 4 digit!' });
            return;
        }
        setPinLoading(true);
        setPinStatusMsg(null);
        try {
            const res = await api.post('/staff/attendance/clock-pin', {
                pinCode: pinInput,
                type
            });
            if (res.data?.success) {
                setPinStatusMsg({ type: 'success', text: res.data.message || 'Absensi berhasil!' });
                fetchAttendance();
                setTimeout(() => {
                    setPinInput('');
                    setPinStatusMsg(null);
                    setIsPinModalOpen(false);
                }, 1400);
            }
        } catch (err: any) {
            setPinStatusMsg({ type: 'error', text: err.response?.data?.message || 'Gagal memproses PIN absensi' });
            setPinInput('');
        } finally {
            setPinLoading(false);
        }
    };

    const handleOpenAdjustModal = (att: any) => {
        setEditingAttendance(att);
        const inTime = att.checkIn
            ? new Date(att.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')
            : '09:00';
        const outTime = att.checkOut
            ? new Date(att.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')
            : '';

        setAdjustForm({
            checkInTime: inTime,
            checkOutTime: outTime,
            status: att.status || 'PRESENT',
            lateMinutes: att.lateMinutes || 0,
            notes: att.notes || ''
        });
        setIsAdjustModalOpen(true);
    };

    const handleSaveAdjust = async () => {
        if (!editingAttendance) return;
        setSavingAdjust(true);
        try {
            const baseDate = selectedDate || getTodayIso();
            const newCheckIn = adjustForm.checkInTime
                ? new Date(`${baseDate}T${adjustForm.checkInTime}:00`).toISOString()
                : editingAttendance.checkIn;
            const newCheckOut = adjustForm.checkOutTime
                ? new Date(`${baseDate}T${adjustForm.checkOutTime}:00`).toISOString()
                : null;

            const res = await api.put(`/staff/attendance/${editingAttendance.id}/adjust`, {
                checkIn: newCheckIn,
                checkOut: newCheckOut,
                status: adjustForm.status,
                lateMinutes: Number(adjustForm.lateMinutes) || 0,
                notes: adjustForm.notes
            });

            if (res.data?.success) {
                vamosAlert('Presensi staf berhasil dikoreksi!');
                setIsAdjustModalOpen(false);
                setEditingAttendance(null);
                fetchAttendance();
            }
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal menyimpan koreksi presensi');
        } finally {
            setSavingAdjust(false);
        }
    };

    const handleRunAutoCutoff = async () => {
        setRunningAutoCutoff(true);
        try {
            const res = await api.post('/staff/attendance/auto-cutoff', {});
            if (res.data?.success) {
                vamosAlert(res.data.message || 'Auto Cut-off EOD selesai!');
                fetchAttendance();
            }
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Gagal menjalankan Auto Cut-off EOD');
        } finally {
            setRunningAutoCutoff(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchEmployees(), fetchWorkShifts(), fetchAttendance(), fetchLeaderboard(), fetchVenue(), fetchBonusConfig()]);
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

                <button
                    onClick={() => setActiveTab('bonus_settings')}
                    className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition-all ${
                        activeTab === 'bonus_settings'
                            ? 'bg-gradient-to-r from-[#ff5e14] to-[#ff8c00] text-white shadow-lg shadow-[#ff5e14]/25'
                            : 'bg-[#141414] text-gray-400 hover:text-white border border-[#222222]'
                    }`}
                >
                    <SettingsIcon className="w-4 h-4" /> Pengaturan Bonus & Target
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
                                                    onClick={() => {
                                                        setSelectedEmpForJobdesk(emp);
                                                        setCustomJobdeskText(emp.jobdesk || '');
                                                    }}
                                                    className="text-[#ff9900] bg-[#ff9900]/10 p-2 rounded-xl hover:bg-[#ff9900] hover:text-black transition-colors"
                                                    title="Atur SOP & Tugas Khusus Staf Ini"
                                                >
                                                    <FileText className="w-4 h-4" />
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

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => {
                                    setPinInput('');
                                    setPinStatusMsg(null);
                                    setIsPinModalOpen(true);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00aaff] to-[#0066ff] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:opacity-90 transition-all cursor-pointer"
                            >
                                <Fingerprint className="w-4 h-4" /> Terminal Absensi PIN
                            </button>
                            <button
                                onClick={handleRunAutoCutoff}
                                disabled={runningAutoCutoff}
                                className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Tutup otomatis presensi yang lupa clock-out kemarin"
                            >
                                <Timer className="w-4 h-4" />
                                {runningAutoCutoff ? 'Memproses...' : 'Auto Cut-off EOD'}
                            </button>
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
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenAdjustModal(att)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-[#222222] hover:bg-[#333333] border border-[#333333] text-gray-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                                        title="Koreksi Jam Masuk / Pulang / Status"
                                                    >
                                                        <Edit2 className="w-3 h-3 text-[#00e5ff]" /> Koreksi
                                                    </button>
                                                    {!att.checkOut && (
                                                        <button
                                                            onClick={() => clockOut(att.id)}
                                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold transition-all cursor-pointer"
                                                        >
                                                            Clock Out
                                                        </button>
                                                    )}
                                                </div>
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
                        {/* GOOGLE MAPS AUTO-SYNC INPUT (Standar POOOS) */}
                        <div className="p-3.5 bg-[#141414] rounded-xl border border-[#222222] space-y-2">
                            <label className="text-[10px] font-bold text-[#00e5ff] uppercase tracking-wider flex items-center gap-1.5">
                                <Compass className="w-3.5 h-3.5" /> Link Google Maps Outlet (Deteksi Otomatis)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={venueGpsForm.googleMapsUrl}
                                    onChange={e => setVenueGpsForm(prev => ({ ...prev, googleMapsUrl: e.target.value }))}
                                    placeholder="https://maps.app.goo.gl/... atau tautan Google Maps"
                                    className="flex-1 bg-[#0a0a0a] border border-[#222222] rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00e5ff]"
                                />
                                <button
                                    type="button"
                                    onClick={handleResolveMaps}
                                    disabled={resolvingMaps || !venueGpsForm.googleMapsUrl}
                                    className="px-3.5 py-2 rounded-xl bg-[#00e5ff] text-black font-extrabold text-xs flex items-center gap-1.5 disabled:opacity-40 hover:opacity-90 transition-all whitespace-nowrap cursor-pointer"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>{resolvingMaps ? 'Mengurai...' : 'Deteksi Otomatis'}</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500">
                                💡 Tempel tautan dari Google Maps (termasuk link pendek <code>maps.app.goo.gl</code>) untuk mengisi Latitude & Longitude secara otomatis.
                            </p>
                        </div>

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

                        {/* SAKELAR VALIDASI HARDWARE (Standar POOOS) */}
                        <div className="pt-2 border-t border-[#1a1a1a] space-y-2.5">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 text-[#00ff66]" /> Sakelar Validasi Hardware & Keamanan Absensi
                            </h4>
                            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#141414] border border-[#222222] cursor-pointer hover:border-[#333333] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={venueGpsForm.enableGpsValidation}
                                    onChange={e => setVenueGpsForm(prev => ({ ...prev, enableGpsValidation: e.target.checked }))}
                                    className="w-4 h-4 accent-[#00ff66] rounded mt-0.5"
                                />
                                <div>
                                    <span className="text-xs font-bold text-white block">Wajibkan Validasi Radius GPS</span>
                                    <span className="text-[11px] text-gray-400 block mt-0.5">
                                        Tolak Clock-In jika karyawan berada di luar radius meter outlet yang ditentukan.
                                    </span>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#141414] border border-[#222222] cursor-pointer hover:border-[#333333] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={venueGpsForm.enableCameraPhoto}
                                    onChange={e => setVenueGpsForm(prev => ({ ...prev, enableCameraPhoto: e.target.checked }))}
                                    className="w-4 h-4 accent-[#00ff66] rounded mt-0.5"
                                />
                                <div>
                                    <span className="text-xs font-bold text-white block">Wajibkan Foto Selfie Kamera</span>
                                    <span className="text-[11px] text-gray-400 block mt-0.5">
                                        Karyawan wajib mengambil foto selfie kamera saat melakukan absensi dari aplikasi HP.
                                    </span>
                                </div>
                            </label>
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
                                {gpsSaving ? 'Menyimpan...' : gpsSuccess ? 'Tersimpan!' : 'Simpan Pengaturan Lokasi & Hardware'}
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

            {/* TAB 7: PENGATURAN BONUS & TARGET OMZET */}
            {activeTab === 'bonus_settings' && (
                <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#222222]">
                        <div>
                            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                                <SettingsIcon className="w-5 h-5 text-[#ff5e14]" />
                                Pengaturan Sistem Bonus & Target Omzet Staf
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">
                                Konfigurasikan target omzet berjenjang shift harian dan reward kedisiplinan 30 hari zero-late untuk seluruh karyawan.
                            </p>
                        </div>
                        <button
                            onClick={saveBonusConfig}
                            disabled={isSavingBonusConfig}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5e14] to-[#ff8c00] text-white font-extrabold text-xs shadow-lg shadow-[#ff5e14]/25 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            {isSavingBonusConfig ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Simpan Pengaturan Bonus</span>
                        </button>
                    </div>

                    {/* Section 1: Target Omzet Harian (3 Tier) */}
                    <div className="bg-[#0a0a0a] border border-[#222222] p-5 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-[#ff5e14]/10 text-[#ff5e14]">
                                    <Trophy className="w-5 h-5 stroke-[2.2]" />
                                </span>
                                <div>
                                    <h3 className="font-extrabold text-white text-sm">Target Pendapatan Harian (Omzet Shift Berjenjang)</h3>
                                    <p className="text-[11px] text-gray-400">Bonus dibagikan rata ke seluruh karyawan yang sedang bertugas (on-duty) di shift tersebut.</p>
                                </div>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-[#ff5e14]/10 text-[#ff5e14] font-bold border border-[#ff5e14]/30">
                                Otomatis Realtime di HP Staf
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            {bonusConfigForm.dailyOmzetTiers.map((tier, idx) => (
                                <div key={tier.level} className="bg-[#141414] border border-[#222222] rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                            idx === 0 ? 'bg-amber-900/20 text-amber-400 border-amber-800' :
                                            idx === 1 ? 'bg-slate-700/30 text-slate-200 border-slate-600' :
                                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                        }`}>
                                            Tier {tier.level} ({tier.label || 'Target'})
                                        </span>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Target Omzet (Rp)</label>
                                        <input
                                            type="number"
                                            value={tier.target}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                setBonusConfigForm(prev => {
                                                    const newTiers = [...prev.dailyOmzetTiers];
                                                    newTiers[idx] = { ...newTiers[idx], target: val };
                                                    return { ...prev, dailyOmzetTiers: newTiers };
                                                });
                                            }}
                                            className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#00ff66] focus:outline-none focus:border-[#00ff66]"
                                        />
                                        <span className="text-[10px] text-gray-500 mt-1 block">
                                            = Rp {(tier.target || 0).toLocaleString('id-ID')}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Bonus per Staf (Rp)</label>
                                        <input
                                            type="number"
                                            value={tier.bonusPerStaff}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                setBonusConfigForm(prev => {
                                                    const newTiers = [...prev.dailyOmzetTiers];
                                                    newTiers[idx] = { ...newTiers[idx], bonusPerStaff: val };
                                                    return { ...prev, dailyOmzetTiers: newTiers };
                                                });
                                            }}
                                            className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#ff5e14] focus:outline-none focus:border-[#ff5e14]"
                                        />
                                        <span className="text-[10px] text-gray-500 mt-1 block">
                                            = Rp {(tier.bonusPerStaff || 0).toLocaleString('id-ID')} / staf
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Bonus Kedisiplinan Kehadiran (Zero Late) */}
                    <div className="bg-[#0a0a0a] border border-[#222222] p-5 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                                <Flame className="w-5 h-5 stroke-[2.2]" />
                            </span>
                            <div>
                                <h3 className="font-extrabold text-white text-sm">Bonus Kedisiplinan Kehadiran (Zero Late & Streak)</h3>
                                <p className="text-[11px] text-gray-400">Reward insentif bagi karyawan yang konsisten hadir tepat waktu sesuai shift selama 1 bulan.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-4">
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Target Hari Bebas Telat</label>
                                <input
                                    type="number"
                                    value={bonusConfigForm.disciplineBonus.targetDays}
                                    onChange={e => {
                                        const val = parseInt(e.target.value) || 30;
                                        setBonusConfigForm(prev => ({
                                            ...prev,
                                            disciplineBonus: { ...prev.disciplineBonus, targetDays: val }
                                        }));
                                    }}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#00ff66]"
                                />
                                <span className="text-[10px] text-gray-500 mt-1 block">Rekomendasi: 30 hari penuh</span>
                            </div>

                            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-4">
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Nominal Bonus Bulanan (Rp)</label>
                                <input
                                    type="number"
                                    value={bonusConfigForm.disciplineBonus.bonusAmount}
                                    onChange={e => {
                                        const val = parseInt(e.target.value) || 0;
                                        setBonusConfigForm(prev => ({
                                            ...prev,
                                            disciplineBonus: { ...prev.disciplineBonus, bonusAmount: val }
                                        }));
                                    }}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#00ff66] focus:outline-none focus:border-[#00ff66]"
                                />
                                <span className="text-[10px] text-gray-500 mt-1 block">
                                    = Rp {(bonusConfigForm.disciplineBonus.bonusAmount || 0).toLocaleString('id-ID')}
                                </span>
                            </div>

                            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-4">
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Toleransi Izin/Off Sah (Kali)</label>
                                <input
                                    type="number"
                                    value={bonusConfigForm.disciplineBonus.allowedAbsenceQuota}
                                    onChange={e => {
                                        const val = parseInt(e.target.value) || 0;
                                        setBonusConfigForm(prev => ({
                                            ...prev,
                                            disciplineBonus: { ...prev.disciplineBonus, allowedAbsenceQuota: val }
                                        }));
                                    }}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                                />
                                <span className="text-[10px] text-gray-500 mt-1 block">Maks kuota izin tanpa reset streak</span>
                            </div>
                        </div>
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

            {/* Modal Fleksibel SOP & Jobdesk Karyawan */}
            {selectedEmpForJobdesk && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#141414] border border-[#222222] p-6 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
                            <div>
                                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-[#ff9900]" />
                                    Atur SOP & Tugas Khusus Karyawan
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Staf: <strong className="text-white">{selectedEmpForJobdesk.name}</strong> ({selectedEmpForJobdesk.position})
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedEmpForJobdesk(null)}
                                className="w-8 h-8 rounded-full bg-[#222222] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Pilihan Cepat Template SOP */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                Template Standar Cepat (Klik untuk Pasang):
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {SOP_TEMPLATES.map(tpl => (
                                    <button
                                        key={tpl.title}
                                        type="button"
                                        onClick={() => setCustomJobdeskText(tpl.text)}
                                        className="px-3 py-1.5 rounded-xl bg-[#0a0a0a] border border-[#333333] hover:border-[#ff9900] hover:text-[#ff9900] text-gray-300 text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
                                    >
                                        {tpl.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                Rincian Tugas & SOP Kustom (Tampil Langsung di HP Staf):
                            </label>
                            <textarea
                                rows={8}
                                value={customJobdeskText}
                                onChange={e => setCustomJobdeskText(e.target.value)}
                                placeholder="Ketik rincian tugas spesifik, standar operasional, atau instruksi khusus untuk staf ini..."
                                className="w-full bg-[#0a0a0a] border border-[#222222] rounded-2xl p-4 text-xs font-medium text-white focus:outline-none focus:border-[#ff9900] leading-relaxed resize-y"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                                💡 Format: Ketik per nomor (1, 2, 3...) agar rapi saat dibaca di aplikasi Vamos Staff karyawan.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setSelectedEmpForJobdesk(null)}
                                className="flex-1 py-3 rounded-xl bg-[#222222] text-xs font-bold text-gray-300 hover:bg-[#333333] transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={saveEmployeeJobdesk}
                                disabled={isSavingJobdesk}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#ff9900] to-[#ff6600] text-black font-black text-xs hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
                            >
                                {isSavingJobdesk ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>Simpan SOP Staf</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Terminal PIN Absensi Kasir (Standar POOOS ClockInModal) */}
            {isPinModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#141414] border border-[#222222] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-br from-[#0066ff] to-[#003399] text-white p-5 relative flex flex-col items-center text-center">
                            <button
                                type="button"
                                onClick={() => setIsPinModalOpen(false)}
                                disabled={pinLoading}
                                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-2">
                                <Fingerprint className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-base font-extrabold">Terminal Absensi Staf</h3>
                            <p className="text-[11px] text-blue-100 mt-0.5">Masukkan PIN Akses Anda untuk Masuk / Pulang</p>
                        </div>

                        <div className="p-5 space-y-4 flex flex-col items-center">
                            <div className="flex gap-2.5 justify-center py-1">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-3.5 h-3.5 rounded-full transition-all ${
                                            i < pinInput.length ? 'bg-[#00ff66] scale-110 shadow-md shadow-[#00ff66]/40' : 'bg-[#2a2a2a]'
                                        }`}
                                    />
                                ))}
                            </div>

                            {pinStatusMsg && (
                                <div className={`w-full p-2.5 rounded-xl text-xs font-bold text-center border ${
                                    pinStatusMsg.type === 'success'
                                        ? 'bg-[#00ff66]/10 border-[#00ff66]/30 text-[#00ff66]'
                                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}>
                                    {pinStatusMsg.text}
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        disabled={pinLoading}
                                        onClick={() => {
                                            if (pinInput.length < 6) {
                                                setPinInput(prev => prev + String(num));
                                                setPinStatusMsg(null);
                                            }
                                        }}
                                        className="h-12 rounded-2xl bg-[#0a0a0a] border border-[#222222] hover:border-[#00e5ff] text-white font-black text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    disabled={pinLoading}
                                    onClick={() => {
                                        setPinInput(prev => prev.slice(0, -1));
                                        setPinStatusMsg(null);
                                    }}
                                    className="h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                                >
                                    <Delete className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    disabled={pinLoading}
                                    onClick={() => {
                                        if (pinInput.length < 6) {
                                            setPinInput(prev => prev + '0');
                                            setPinStatusMsg(null);
                                        }
                                    }}
                                    className="h-12 rounded-2xl bg-[#0a0a0a] border border-[#222222] hover:border-[#00e5ff] text-white font-black text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                                >
                                    0
                                </button>
                                <button
                                    type="button"
                                    disabled={pinLoading}
                                    onClick={() => setPinInput('')}
                                    className="h-12 rounded-2xl bg-[#222222] text-gray-400 font-bold text-xs uppercase flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                                >
                                    C
                                </button>
                            </div>

                            <div className="flex w-full gap-2.5 pt-1">
                                <button
                                    type="button"
                                    disabled={pinInput.length < 4 || pinLoading}
                                    onClick={() => handlePinClock('IN')}
                                    className="flex-1 py-3 rounded-xl bg-[#00ff66] text-black font-black text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition-all cursor-pointer"
                                >
                                    <LogIn className="w-4 h-4" /> MASUK (IN)
                                </button>
                                <button
                                    type="button"
                                    disabled={pinInput.length < 4 || pinLoading}
                                    onClick={() => handlePinClock('OUT')}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-black text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition-all cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" /> PULANG (OUT)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Koreksi Presensi Staf oleh Admin (Standar POOOS) */}
            {isAdjustModalOpen && editingAttendance && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#141414] border border-[#222222] p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
                            <div>
                                <h3 className="font-extrabold text-white text-base">Koreksi Presensi Staf</h3>
                                <p className="text-xs text-gray-400">
                                    {editingAttendance.employee?.name || editingAttendance.employeeName} • {selectedDate}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAdjustModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-[#222222] text-gray-400 hover:text-white flex items-center justify-center"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Jam Masuk (IN)</label>
                                <input
                                    type="time"
                                    value={adjustForm.checkInTime}
                                    onChange={e => setAdjustForm(prev => ({ ...prev, checkInTime: e.target.value }))}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Jam Pulang (OUT)</label>
                                <input
                                    type="time"
                                    value={adjustForm.checkOutTime}
                                    onChange={e => setAdjustForm(prev => ({ ...prev, checkOutTime: e.target.value }))}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Status Kehadiran</label>
                                <select
                                    value={adjustForm.status}
                                    onChange={e => setAdjustForm(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-3.5 py-2.5 text-xs font-bold text-white"
                                >
                                    <option value="PRESENT">Tepat Waktu (PRESENT)</option>
                                    <option value="LATE">Terlambat (LATE)</option>
                                    <option value="SICK">Sakit (SICK)</option>
                                    <option value="LEAVE">Izin / Cuti (LEAVE)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Menit Terlambat</label>
                                <input
                                    type="number"
                                    value={adjustForm.lateMinutes}
                                    onChange={e => setAdjustForm(prev => ({ ...prev, lateMinutes: parseInt(e.target.value) || 0 }))}
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Catatan Koreksi</label>
                            <input
                                type="text"
                                value={adjustForm.notes}
                                onChange={e => setAdjustForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Alasan koreksi jam/status..."
                                className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-3.5 py-2.5 text-xs text-white"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsAdjustModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl bg-[#222222] text-xs font-bold text-gray-300 hover:bg-[#333333]"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveAdjust}
                                disabled={savingAdjust}
                                className="flex-1 py-2.5 rounded-xl bg-[#00ff66] text-black font-extrabold text-xs hover:opacity-90 transition-all"
                            >
                                {savingAdjust ? 'Menyimpan...' : 'Simpan Koreksi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
