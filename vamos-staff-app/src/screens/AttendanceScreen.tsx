import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, ArrowLeft, Check, Sparkles, X } from 'lucide-react';
import { api } from '../api';

interface AttendanceScreenProps {
    staff: any;
    onBack?: () => void;
}

export default function AttendanceScreen({ staff, onBack }: AttendanceScreenProps) {
    const [venue, setVenue] = useState<any>(null);
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
    const [isWithinRadius, setIsWithinRadius] = useState<boolean>(true);
    const [locLoading, setLocLoading] = useState(true);

    const [todayRecord, setTodayRecord] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'camera' | 'history'>('camera');

    // Camera & Photo State
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [streamActive, setStreamActive] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successModalData, setSuccessModalData] = useState<any>(null);

    // Fetch Venue & Attendance
    const fetchData = async () => {
        try {
            const [vRes, hRes] = await Promise.all([
                api.get('/staff/venue'),
                api.get(`/staff/attendance/history/${staff.id}`)
            ]);

            if (vRes.data?.success) setVenue(vRes.data.data);
            if (hRes.data?.success) {
                const list = hRes.data.data || [];
                setHistory(list);

                // 1. Prioritas 1: Sesi absensi aktif yang belum checkout (termasuk shift malam / lintas hari)
                const activeSession = list.find((item: any) => item.checkIn && !item.checkOut);
                if (activeSession) {
                    setTodayRecord(activeSession);
                } else {
                    // 2. Prioritas 2: Sesi hari ini berdasarkan zona waktu lokal (Asia/Jakarta / WIB)
                    const localTodayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
                    const found = list.find((item: any) => {
                        if (!item.date) return false;
                        const itemDateLocal = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(item.date));
                        return itemDateLocal === localTodayStr;
                    });
                    setTodayRecord(found || null);
                }
            }
        } catch (err) {
            console.error('Failed to fetch data', err);
        }
    };

    // Calculate Distance
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    };

    // GPS Geofence
    const checkLocation = () => {
        setLocLoading(true);
        setErrorMsg('');
        if (!navigator.geolocation) {
            setErrorMsg('GPS tidak didukung oleh perangkat');
            setLocLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            pos => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setUserCoords({ lat, lng });

                if (venue?.latitude && venue?.longitude) {
                    const dist = calculateDistance(lat, lng, venue.latitude, venue.longitude);
                    setDistanceMeters(dist);
                    setIsWithinRadius(dist <= (venue.radiusMeters || 100));
                } else {
                    setIsWithinRadius(true);
                }
                setLocLoading(false);
            },
            err => {
                console.warn('GPS Error or Permission Denied', err);
                if (venue?.latitude && venue?.longitude) {
                    setIsWithinRadius(false);
                    setErrorMsg('Izin GPS diperlukan untuk absensi outlet Vamos. Pastikan GPS aktif dan izin lokasi diizinkan.');
                } else {
                    setIsWithinRadius(true);
                }
                setLocLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Stop Camera Stream
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setStreamActive(false);
    };

    // Start in-app Camera Stream
    const startCamera = async () => {
        setCameraLoading(true);
        setErrorMsg('');
        try {
            stopCamera();

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Akses kamera tidak didukung di sistem ini');
            }

            let stream: MediaStream | null = null;
            const constraintsList: MediaStreamConstraints[] = [
                {
                    video: {
                        facingMode: 'user',
                        width: { ideal: 640 },
                        height: { ideal: 800 }
                    },
                    audio: false
                },
                {
                    video: {
                        facingMode: { ideal: 'user' }
                    },
                    audio: false
                },
                {
                    video: true,
                    audio: false
                }
            ];

            let lastErr: any = null;
            for (const constraints of constraintsList) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia(constraints);
                    if (stream) break;
                } catch (e: any) {
                    lastErr = e;
                    console.log('Camera constraint attempt failed:', e);
                }
            }

            if (!stream) {
                throw lastErr || new Error('Tidak dapat mengakses kamera perangkat.');
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                try {
                    await videoRef.current.play();
                } catch (playErr) {
                    console.warn('Video play delayed, will auto-play on loadedmetadata', playErr);
                }
            }

            setStreamActive(true);
        } catch (err: any) {
            console.error('Camera access error', err);
            setErrorMsg(
                err?.name === 'NotAllowedError' || err?.message?.includes('Permission')
                    ? 'Izin kamera belum aktif. Buka Pengaturan HP > Aplikasi > Vamos Staff > Izin > Kamera (Izinkan).'
                    : `Gagal membuka kamera: ${err.message || 'Periksa izin kamera di pengaturan HP'}`
            );
            setStreamActive(false);
        } finally {
            setCameraLoading(false);
        }
    };

    // Process Image & Add Watermark
    const processImageAndWatermark = (source: HTMLVideoElement | HTMLImageElement) => {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 640;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let srcW = 0;
        let srcH = 0;

        if (source instanceof HTMLVideoElement) {
            srcW = source.videoWidth || 480;
            srcH = source.videoHeight || 640;
        } else if (source instanceof HTMLImageElement) {
            srcW = source.naturalWidth || source.width || 480;
            srcH = source.naturalHeight || source.height || 640;
        }

        if (srcW === 0 || srcH === 0) {
            srcW = 480;
            srcH = 640;
        }

        const targetRatio = canvas.width / canvas.height;
        const srcRatio = srcW / srcH;

        let sx = 0;
        let sy = 0;
        let sWidth = srcW;
        let sHeight = srcH;

        if (srcRatio > targetRatio) {
            sWidth = Math.round(srcH * targetRatio);
            sx = Math.round((srcW - sWidth) / 2);
        } else {
            sHeight = Math.round(srcW / targetRatio);
            sy = Math.round((srcH - sHeight) / 2);
        }

        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Watermark bar overlay
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(0, canvas.height - 48, canvas.width, 48);
        ctx.fillStyle = '#60A5FA';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`${staff.name} (${staff.position || 'Staff'})`, 14, canvas.height - 26);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '11px sans-serif';
        ctx.fillText(`${new Date().toLocaleDateString('id-ID')} • ${new Date().toLocaleTimeString('id-ID')} WIB`, 14, canvas.height - 10);

        const compressedData = canvas.toDataURL('image/webp', 0.8);
        setCapturedPhoto(compressedData);
        stopCamera();
        setErrorMsg('');
        return compressedData;
    };

    // Submit Attendance Payload to API
    const submitAttendanceData = async (photoBase64: string) => {
        if (!photoBase64) {
            setErrorMsg('Foto selfie belum siap.');
            return;
        }

        const isClockIn = !todayRecord?.checkIn;

        // Validasi Ketat GPS untuk Absen Masuk jika venue memiliki koordinat
        if (isClockIn && venue?.latitude && venue?.longitude) {
            if (!userCoords) {
                setErrorMsg('Lokasi GPS belum terdeteksi. Silakan aktifkan GPS dan refresh lokasi.');
                return;
            }
            if (!isWithinRadius) {
                setErrorMsg(`Anda berada di luar radius outlet Vamos (${distanceMeters || '?'}m). Absen hanya diizinkan di dalam venue.`);
                return;
            }
        }

        setSubmitting(true);
        setErrorMsg('');

        try {
            let resultData: any = null;

            if (isClockIn) {
                // CLOCK IN
                const payload = {
                    employeeId: staff.id,
                    photoBase64,
                    lat: userCoords?.lat,
                    lng: userCoords?.lng
                };
                const res = await api.post('/staff/attendance/checkin', payload);
                if (res.data?.success) {
                    resultData = res.data.data;
                    await fetchData();
                }
            } else {
                // CLOCK OUT
                const payload = {
                    attendanceId: todayRecord?.id,
                    employeeId: staff.id,
                    photoBase64
                };
                const res = await api.post('/staff/attendance/checkout', payload);
                if (res.data?.success) {
                    resultData = res.data.data;
                    await fetchData();
                }
            }

            // Open Fintech Success Receipt Modal
            setSuccessModalData({
                type: isClockIn ? 'CLOCK_IN' : 'CLOCK_OUT',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                status: isClockIn ? (resultData?.status === 'PRESENT' ? 'Tepat Waktu' : `Terlambat ${resultData?.lateMinutes || 0} Menit`) : 'Selesai Shift',
                photo: photoBase64
            });

        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Gagal mengirim absensi. Silakan coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    // Capture from Live Stream & Auto-Submit
    const captureAndSubmitPhoto = async () => {
        if (!videoRef.current || !streamActive) {
            setErrorMsg('Kamera belum aktif.');
            return;
        }
        const photo = processImageAndWatermark(videoRef.current);
        if (photo) {
            await submitAttendanceData(photo);
        }
    };

    // Handle Manual Submission from Preview
    const handleSubmitAttendance = async () => {
        if (capturedPhoto) {
            await submitAttendanceData(capturedPhoto);
        }
    };

    useEffect(() => {
        fetchData();
        checkLocation();
        if (activeTab === 'camera') {
            startCamera();
        }
        return () => stopCamera();
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-[#F5F7FC] text-[#0F172A] pb-24 max-w-md mx-auto">
            {/* 1. TOP ROYAL BLUE HEADER BAR */}
            <div className="bg-gradient-to-b from-[#182163] via-[#1E2875] to-[#2538D4] text-white pt-5 pb-6 px-4 rounded-b-[32px] shadow-md">
                <div className="flex items-center justify-between mb-4">
                    {onBack ? (
                        <button
                            onClick={() => {
                                stopCamera();
                                onBack();
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-white/15 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" /> Kembali
                        </button>
                    ) : (
                        <div />
                    )}
                    <h2 className="text-sm font-extrabold text-white">Absensi Kehadiran</h2>
                    <div className="w-16" />
                </div>

                {/* Segmented Control Pill */}
                <div className="flex bg-white/15 backdrop-blur-md p-1 rounded-2xl border border-white/20">
                    <button
                        onClick={() => setActiveTab('camera')}
                        className={`flex-1 py-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            activeTab === 'camera' ? 'bg-white text-[#1E2875] shadow-sm' : 'text-white/80 hover:text-white'
                        }`}
                    >
                        <Camera className="w-4 h-4" /> Absen Sekarang
                    </button>
                    <button
                        onClick={() => {
                            stopCamera();
                            setActiveTab('history');
                        }}
                        className={`flex-1 py-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            activeTab === 'history' ? 'bg-white text-[#1E2875] shadow-sm' : 'text-white/80 hover:text-white'
                        }`}
                    >
                        <Clock className="w-4 h-4" /> Riwayat Bulan Ini
                    </button>
                </div>
            </div>

            {/* TAB CONTENT */}
            <div className="p-4 space-y-4">
                {activeTab === 'camera' ? (
                    <div className="space-y-4">
                        {/* GPS Geofence Status Card */}
                        <div className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(30,40,117,0.05)] border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                                    isWithinRadius ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                    <MapPin className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                                        {venue?.name || 'Vamos Pool and Cafe'}
                                        {isWithinRadius ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        ) : (
                                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                        )}
                                    </h4>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                        {locLoading
                                            ? 'Mendeteksi koordinat GPS...'
                                            : distanceMeters !== null
                                            ? `Jarak: ${distanceMeters}m (Radius maks: ${venue?.radiusMeters || 100}m)`
                                            : 'GPS Aktif'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={checkLocation}
                                className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-all"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${locLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {/* Camera Box */}
                        <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_-4px_rgba(30,40,117,0.06)] border border-slate-100 space-y-3.5">
                            <div className="relative aspect-[3/4] max-h-[42vh] w-full max-w-xs mx-auto rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-inner flex items-center justify-center">
                                {/* Video Element */}
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover -scale-x-100 ${streamActive && !capturedPhoto ? 'block' : 'hidden'}`}
                                />

                                {/* Face Oval Overlay */}
                                {streamActive && !capturedPhoto && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="w-48 h-64 rounded-[50%] border-2 border-dashed border-white/60 shadow-[0_0_40px_rgba(255,255,255,0.2)]" />
                                    </div>
                                )}

                                {/* Captured Photo Preview */}
                                {capturedPhoto && (
                                    <img src={capturedPhoto} alt="Captured Selfie" className="w-full h-full object-cover" />
                                )}

                                {/* Inactive Camera Placeholder */}
                                {!streamActive && !capturedPhoto && (
                                    <div className="p-6 text-center space-y-3">
                                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white mx-auto">
                                            <Camera className="w-7 h-7" />
                                        </div>
                                        <h4 className="text-sm font-bold text-white">Kamera Belum Aktif</h4>
                                        <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                                            Klik tombol di bawah untuk menyalakan kamera selfie absensi.
                                        </p>
                                        <button
                                            onClick={startCamera}
                                            disabled={cameraLoading}
                                            className="px-5 py-2.5 rounded-xl bg-[#2538D4] text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                                        >
                                            {cameraLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                            {cameraLoading ? 'Mengaktifkan...' : 'Aktifkan Kamera'}
                                        </button>
                                    </div>
                                )}

                                {/* Top Floating Badge */}
                                <div className="absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none">
                                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-extrabold text-white flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                        {todayRecord?.checkIn && !todayRecord?.checkOut ? 'Clock-Out' : 'Clock-In'}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full bg-[#1E2875] text-[10px] font-bold text-white">
                                        Live Kamera
                                    </span>
                                </div>
                            </div>

                            {/* Error Alert */}
                            {errorMsg && (
                                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {/* Attendance Controls */}
                            {todayRecord?.checkIn && todayRecord?.checkOut ? (
                                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                                    <p className="text-xs font-black text-emerald-800">
                                        🎉 Anda sudah menyelesaikan shift hari ini!
                                    </p>
                                    <p className="text-[11px] text-slate-500 font-mono">
                                        Masuk: {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Pulang: {new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ) : !capturedPhoto ? (
                                streamActive ? (
                                    <button
                                        onClick={captureAndSubmitPhoto}
                                        disabled={submitting}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#1E2875] to-[#2538D4] text-white font-black text-sm flex items-center justify-center gap-2 shadow-royal hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Mengirim Absensi...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Camera className="w-5 h-5" />
                                                <span>
                                                    {todayRecord?.checkIn && !todayRecord?.checkOut
                                                        ? 'Jepret & Kirim Absen Pulang'
                                                        : 'Jepret & Kirim Absen Masuk'}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={startCamera}
                                        disabled={cameraLoading}
                                        className="w-full py-4 rounded-2xl bg-[#1E2875] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                                    >
                                        {cameraLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                        {cameraLoading ? 'Mengaktifkan Kamera...' : 'Aktifkan Kamera Selfie'}
                                    </button>
                                )
                            ) : (
                                <div className="flex gap-2.5">
                                    <button
                                        onClick={() => {
                                            setCapturedPhoto(null);
                                            startCamera();
                                        }}
                                        disabled={submitting}
                                        className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                                    >
                                        Foto Ulang
                                    </button>
                                    <button
                                        onClick={handleSubmitAttendance}
                                        disabled={submitting}
                                        className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-[#1E2875] to-[#2538D4] text-white font-black text-xs flex items-center justify-center gap-2 shadow-royal hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Mengirim...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>
                                                    {todayRecord?.checkIn && !todayRecord?.checkOut ? 'Kirim Absen Pulang' : 'Kirim Absen Masuk'}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* History Tab */
                    <div className="space-y-3">
                        <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-1">
                            Riwayat Kehadiran Bulan Ini
                        </h4>

                        {history.length === 0 ? (
                            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs shadow-card">
                                Belum ada riwayat absensi bulan ini.
                            </div>
                        ) : (
                            history.map((rec: any) => (
                                <div
                                    key={rec.id}
                                    className="p-3.5 rounded-2xl bg-white border border-slate-100/90 shadow-card flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            rec.status === 'PRESENT'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : rec.status === 'LATE'
                                                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                                : 'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}>
                                            <Clock className="w-5 h-5 stroke-[2.2]" />
                                        </div>
                                        <div>
                                            <h5 className="font-extrabold text-xs text-slate-800">
                                                {new Date(rec.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </h5>
                                            <span className="text-[11px] text-slate-500 font-medium">
                                                {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'} s/d {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Masih Bekerja'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                            rec.status === 'PRESENT'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : rec.status === 'LATE'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                            {rec.status === 'PRESENT' ? 'Tepat Waktu' : rec.status === 'LATE' ? `Telat ${rec.lateMinutes}m` : rec.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* FINTECH SUCCESS RECEIPT MODAL (Inspired by Successful Transaction screen in mockup) */}
            {successModalData && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 relative">
                        {/* Big Centered Check / Celebratory Icon */}
                        <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                            <Check className="w-10 h-10 stroke-[3]" />
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-slate-900">
                                {successModalData.type === 'CLOCK_IN' ? 'Absensi Masuk Berhasil!' : 'Absensi Pulang Selesai!'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Data kehadiran Anda telah tersimpan resmi di sistem Vamos.
                            </p>
                        </div>

                        {/* Breakdown Receipt Card */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2.5 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Nama Staf</span>
                                <span className="font-extrabold text-slate-800">{staff.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Posisi</span>
                                <span className="font-semibold text-slate-800">{staff.position || 'Staff'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Waktu Tercatat</span>
                                <span className="font-extrabold text-[#1E2875]">{successModalData.time} WIB</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Status Kehadiran</span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px]">
                                    {successModalData.status}
                                </span>
                            </div>
                        </div>

                        {/* Primary Confirm Button */}
                        <button
                            onClick={() => {
                                setSuccessModalData(null);
                                setCapturedPhoto(null);
                                if (onBack) onBack();
                            }}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#1E2875] to-[#2538D4] text-white font-extrabold text-xs shadow-royal active:scale-95 transition-all"
                        >
                            Kembali ke Beranda
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
