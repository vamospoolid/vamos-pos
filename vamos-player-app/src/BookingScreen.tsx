import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, ArrowRight, Crown, Box } from 'lucide-react';
import { useAppStore } from './store/appStore';
import { api } from './api';

const TIME_SLOTS = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30", "21:00", "22:30", "00:00"];
const TABLE_TYPES = [
    { id: 'REGULAR', name: 'REGULAR', fullName: 'Elite Regular', capacity: 'Max 4', icon: <Box className="w-5 h-5" />, price: 35 },
    { id: 'VIP', name: 'VIP', fullName: 'Champions VIP', capacity: 'Max 8', icon: <Crown className="w-5 h-5" />, price: 70 },
    { id: 'VVIP', name: 'VVIP', fullName: 'Legend VVIP', capacity: 'Max 12', icon: <Crown className="w-5 h-5 text-yellow-500" />, price: 105 },
];

interface Package {
    id: string;
    name: string;
    tableType: string;
    duration: number;
    price: number;
    memberPrice?: number;
    startTime?: string;
    endTime?: string;
    dayOfWeek?: number[];
    isActive: boolean;
}

export function BookingScreen() {
    const { member, setActiveTab } = useAppStore();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTableType, setSelectedTableType] = useState('REGULAR');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [partySize, setPartySize] = useState(2);
    const [duration, setDuration] = useState(1); // Hours
    const [dynamicPrice, setDynamicPrice] = useState<number | null>(null);
    const [packages, setPackages] = useState<Package[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);
    const [success, setSuccess] = useState(false);
    const [waSentStatus, setWaSentStatus] = useState(false);
    const [availability, setAvailability] = useState<any[]>([]);

    // Fetch Availability
    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const dateStr = selectedDate.toISOString().split('T')[0];
                const res = await api.get('/player/availability', { params: { date: dateStr } });
                setAvailability(res.data.data || []);
            } catch (err) {
                console.error('Failed to fetch availability', err);
            }
        };
        fetchAvailability();
        const interval = setInterval(fetchAvailability, 15000);
        return () => clearInterval(interval);
    }, [selectedDate]);

    // Fetch Packages
    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const res = await api.get('/pricing/packages');
                setPackages(res.data.data || []);
            } catch (err) {
                console.error('Failed to fetch packages', err);
            }
        };
        fetchPackages();
    }, []);

    const now = new Date();

    // Filter packages based on real-time
    const availablePackages = useMemo(() => {
        const currentDay = now.getDay();
        return packages.filter(pkg => {
            if (!pkg.isActive) return false;

            // Filter by day of week if specified
            if (pkg.dayOfWeek && pkg.dayOfWeek.length > 0 && !pkg.dayOfWeek.includes(currentDay)) {
                return false;
            }

            // Time filtering removed to show all available packages defined in Pricing menu
            return true;
        });
    }, [packages]);

    // Filter time slots - if today, only show future slots and available tables
    const filteredSlots = useMemo(() => {
        const typeAvailability = availability.find(a => a.type === selectedTableType);
        const isToday = selectedDate.toDateString() === now.toDateString();

        return TIME_SLOTS.filter(slot => {
            const [h, m] = slot.split(':').map(Number);
            const slotTime = new Date(selectedDate);
            slotTime.setHours(h, m, 0, 0);

            // 1. Time filter (Never show past slots for today)
            if (isToday && slotTime <= now) return false;

            // 2. Granular Slot Occupancy filter
            if (typeAvailability?.slots?.[slot]) {
                const slotData = typeAvailability.slots[slot];
                if (slotData.isFull) return false;
            }

            // 3. Package Time Restriction (Siang / Malam lock)
            if (selectedPackageId) {
                const pkg = packages.find(p => p.id === selectedPackageId);
                if (pkg && pkg.startTime && pkg.endTime) {
                    const [startH, startM] = pkg.startTime.split(':').map(Number);
                    const [endH, endM] = pkg.endTime.split(':').map(Number);
                    
                    const slotMins = h * 60 + m;
                    const startMins = startH * 60 + startM;
                    let endMins = endH * 60 + endM;
                    
                    // Handle overnight package (e.g. 18:00 to 02:00)
                    if (endMins <= startMins) endMins += 24 * 60;
                    
                    let adjustedSlotMins = slotMins;
                    // If slot is early morning and package crosses midnight
                    if (slotMins < startMins && endMins > 24 * 60) {
                        adjustedSlotMins += 24 * 60;
                    }

                    if (adjustedSlotMins < startMins || adjustedSlotMins >= endMins) {
                        return false;
                    }
                }
            }

            return true;
        });
    }, [selectedDate, now, availability, selectedTableType]);

    // Generate next 7 dates
    const dates = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            return d;
        });
    }, []);

    const reservedTime = useMemo(() => {
        if (!selectedSlot) return null;
        const [hours, minutes] = selectedSlot.split(':');
        const d = new Date(selectedDate);
        d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return d;
    }, [selectedDate, selectedSlot]);

    useEffect(() => {
        const fetchPrice = async () => {
            if (!selectedSlot || !selectedTableType) {
                setDynamicPrice(null);
                return;
            }

            if (selectedPackageId) {
                const pkg = packages.find(p => p.id === selectedPackageId);
                setDynamicPrice(pkg?.memberPrice || pkg?.price || null);
                return;
            }

            setIsLoadingPrice(true);
            try {
                // Construct Date for calculation
                const calcDate = new Date(selectedDate);
                const [h, m] = selectedSlot.split(':');
                calcDate.setHours(parseInt(h), parseInt(m), 0, 0);

                const res = await api.get('/pricing/estimate', {
                    params: {
                        tableType: selectedTableType,
                        durationMinutes: duration * 60,
                        isMember: true,
                        startTime: calcDate.toISOString()
                    }
                });

                // Keep value in Rupiah for consistent display
                setDynamicPrice(res.data.data);
            } catch (err) {
                console.error('Failed to fetch estimate', err);
                // Hardcoded fallback if estimate fails
                const base = TABLE_TYPES.find(t => t.id === selectedTableType)?.price || 35;
                setDynamicPrice(base * 1000 * duration);
            } finally {
                setIsLoadingPrice(false);
            }
        };

        fetchPrice();
    }, [selectedTableType, selectedSlot, selectedDate, duration, selectedPackageId, packages]);

    const handleCreateBooking = async () => {
        if (!selectedSlot) return;
        setIsSubmitting(true);
        try {
            const res = await api.post('/player/booking', {
                memberId: member.id,
                tableType: selectedTableType,
                packageId: selectedPackageId,
                reservedTime: reservedTime?.toISOString(),
                durationMinutes: duration * 60,
                partySize,
            });

            if (res.data.member) {
                useAppStore.getState().setMember(res.data.member);
            }

            setWaSentStatus(res.data.waSent === true);

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setWaSentStatus(false);
                setActiveTab('dashboard');
            }, 4000);
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to authorize booking.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8 fade-in">
                <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mb-8 fiery-glow relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-[32px] animate-ping" />
                    <CheckCircle2 className="w-12 h-12 text-primary" strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Pemesanan Berhasil</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10">Siapkan strategi terbaik Anda di Vamos Arena.</p>

                {waSentStatus && (
                    <div className="bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66] px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 fade-in flex items-center justify-center gap-2 mx-auto w-fit">
                        <CheckCircle2 className="w-4 h-4" />
                        Konfirmasi Terkirim: WhatsApp Berhasil
                    </div>
                )}

                <div className="fiery-card p-10 w-full relative overflow-hidden">
                    <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-primary/5 rounded-full blur-[50px]" />

                    <div className="flex justify-between items-center mb-8">
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Waktu Main</p>
                            <p className="text-2xl font-black text-white italic">{selectedSlot}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Tanggal Main</p>
                            <p className="text-2xl font-black text-white italic">{selectedDate.toLocaleDateString([], { day: '2-digit', month: 'short' })}</p>
                        </div>
                    </div>

                    <div className="h-px bg-white/5 mb-8" />

                    <div className="text-left">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic">Area Bermain</p>
                        <p className="text-2xl font-black text-white italic uppercase italic truncate">
                            {TABLE_TYPES.find(t => t.id === selectedTableType)?.fullName}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setActiveTab('dashboard')}
                    className="mt-12 fiery-btn-secondary px-10 py-4 text-xs font-black uppercase tracking-widest"
                >
                    Kembali ke Beranda
                </button>
            </div>
        );
    }

    return (
        <div className="pb-[350px] text-white min-h-screen fade-in relative px-1 scrollbar-hide overflow-x-hidden">
            {/* Header Sticky - Compact */}
            <div className="pt-8 pb-3 px-8 flex justify-between items-center bg-[#070b14]/95 backdrop-blur-3xl sticky top-0 z-[100] -mx-8 border-b border-white/5">
                <button onClick={() => setActiveTab('dashboard')} className="w-10 h-10 rounded-[14px] bg-[#1a1f35] flex items-center justify-center active:scale-90 transition-all text-white border border-white/5">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="text-sm font-black text-white italic uppercase tracking-[0.2em]">Detail Pesanan</h1>
                <div className="w-10 h-10" /> {/* Spacer */}
            </div>

            <div className="mt-6 space-y-8">
                {/* Tactical Header - Date Selection as Primary Focus */}
                <div className="space-y-4">
                    <div className="flex justify-between items-baseline px-1">
                        <h3 className="text-base font-black text-white italic uppercase tracking-tighter">Pilih Tanggal</h3>
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest italic opacity-60">
                            {selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()}
                        </p>
                    </div>
                    <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                        {dates.map((d, i) => {
                            const isSelected = d.toDateString() === selectedDate.toDateString();
                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(d)}
                                    className={`flex-shrink-0 w-[58px] h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border ${isSelected
                                        ? 'bg-primary text-secondary border-primary shadow-lg shadow-primary/20 scale-105'
                                        : 'bg-[#1a1f35]/40 text-slate-500 border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <span className={`text-[8px] font-black mb-1 uppercase tracking-widest ${isSelected ? 'text-secondary/70' : 'text-slate-600'}`}>
                                        {d.toLocaleDateString('id-ID', { weekday: 'short' })}
                                    </span>
                                    <span className="text-xl font-black italic leading-none">{d.getDate()}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Combined Parameters Grid (Side by Side) */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Operative Count */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-500 italic uppercase tracking-widest px-1">Jumlah Pemain</h3>
                        <div className="flex items-center justify-between fiery-card px-4 py-2 bg-[#1a1f35]/20 border border-white/5 min-h-[64px]">
                            <button
                                onClick={() => setPartySize(Math.max(1, partySize - 1))}
                                className="w-8 h-8 rounded-lg bg-[#1a1f35] flex items-center justify-center text-slate-500 font-black text-xl border border-white/5"
                            >
                                -
                            </button>
                            <p className="text-xl font-black text-white italic leading-none">{partySize}</p>
                            <button
                                onClick={() => setPartySize(Math.min(12, partySize + 1))}
                                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-secondary font-black text-xl"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Mission Duration */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-500 italic uppercase tracking-widest px-1">Durasi (Jam)</h3>
                        <div className="flex items-center justify-between fiery-card px-4 py-2 bg-[#1a1f35]/20 border border-white/5 min-h-[64px]">
                            <button
                                onClick={() => setDuration(Math.max(1, duration - 1))}
                                className="w-8 h-8 rounded-lg bg-[#1a1f35] flex items-center justify-center text-slate-500 font-black text-xl border border-white/5"
                            >
                                -
                            </button>
                            <p className="text-xl font-black text-white italic leading-none">{duration}</p>
                            <button
                                onClick={() => setDuration(Math.min(6, duration + 1))}
                                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-secondary font-black text-xl"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Asset Selection (Table Type) - High Density Grid */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-500 italic uppercase tracking-widest px-1">Pilih Area Meja</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {TABLE_TYPES.map(type => {
                            const isSelected = selectedTableType === type.id && !selectedPackageId;
                            const isAvailable = availability.some(a => a.type === type.id);
                            
                            return (
                                <button
                                    key={type.id}
                                    disabled={!isAvailable}
                                    onClick={() => {
                                        setSelectedTableType(type.id);
                                        setSelectedPackageId(null);
                                    }}
                                    className={`p-3.5 rounded-[22px] border-2 transition-all duration-500 text-center relative overflow-hidden flex flex-col items-center gap-1 ${isSelected
                                        ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(31,34,255,0.2)]'
                                        : isAvailable 
                                            ? 'bg-[#1a1f35]/40 border-white/5 hover:border-white/10'
                                            : 'bg-black/40 border-white/5 opacity-30 grayscale cursor-not-allowed'
                                        }`}
                                >
                                    {!isAvailable && (
                                        <div className="absolute inset-0 flex items-center justify-center z-20">
                                            <div className="bg-black/60 backdrop-blur-sm rounded-full p-1 border border-white/10">
                                                <Box className="w-3 h-3 text-white/40" />
                                            </div>
                                        </div>
                                    )}
                                    <div className={`${isSelected ? 'text-primary' : isAvailable ? 'text-slate-600' : 'text-slate-800'} transition-colors`}>
                                        {type.icon}
                                    </div>
                                    <div className="mt-1">
                                        <h4 className="font-black text-[9px] text-white leading-tight uppercase tracking-widest italic">{type.name}</h4>
                                        <p className="text-[7px] text-slate-600 font-black uppercase tracking-widest italic mt-0.5">{isAvailable ? type.capacity : 'LOCKED'}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Available Bundles - High Density 2-Column Grid */}
                {availablePackages.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-500 italic uppercase tracking-widest px-1 flex items-center gap-2">
                            <Box className="w-4 h-4 text-primary" /> Paket Hemat
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {availablePackages.map(pkg => {
                                const isSelected = selectedPackageId === pkg.id;
                                return (
                                    <button
                                        key={pkg.id}
                                        onClick={() => {
                                            setSelectedPackageId(pkg.id);
                                            setSelectedTableType(pkg.tableType);
                                            setDuration(pkg.duration / 60);
                                            if (pkg.startTime) {
                                                setSelectedSlot(pkg.startTime.substring(0, 5));
                                            }
                                        }}
                                        className={`p-4 rounded-[24px] border-2 transition-all duration-300 text-left relative overflow-hidden group ${isSelected
                                            ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10'
                                            : 'bg-[#1a1f35]/40 border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <div className="relative z-10">
                                            <h4 className="font-black text-[11px] text-white italic uppercase truncate mb-1">{pkg.name}</h4>
                                            <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest italic leading-none">
                                                {pkg.duration / 60} Jam • {pkg.tableType}
                                            </p>
                                            <div className="mt-3 flex justify-between items-end">
                                                <p className="text-sm font-black text-primary italic leading-none">
                                                    {(pkg.memberPrice || pkg.price).toLocaleString('id-ID')}
                                                </p>
                                                <span className="text-[7px] text-slate-600 font-bold uppercase tracking-tighter">IDR</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Deployment Windows - Optimized Grid */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-500 italic uppercase tracking-widest px-1">Pilih Jam Mulai</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {filteredSlots.map(slot => {
                            const isSelected = selectedSlot === slot;
                            return (
                                <button
                                    key={slot}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`py-2.5 rounded-[12px] transition-all duration-300 font-black text-[10px] italic border ${isSelected
                                        ? 'bg-primary text-secondary border-primary shadow-md shadow-primary/20 scale-105'
                                        : 'bg-[#1a1f35]/40 text-slate-500 border-white/5 hover:text-white'
                                        }`}
                                >
                                    {slot}
                                </button>
                            );
                        })}
                    </div>
                    {filteredSlots.length === 0 && (
                        <div className="py-8 text-center bg-[#1a1f35]/20 rounded-[24px] border border-dashed border-white/5 opacity-50">
                            <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest italic">Tidak Ada Jadwal Tersedia</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Pricing Checkout - Ultra Slim */}
            <div className="fixed bottom-0 left-0 right-0 p-6 z-[100] pointer-events-none max-w-md mx-auto">
                <div className="pointer-events-auto bg-[#0d111d]/90 backdrop-blur-2xl p-6 rounded-[32px] border border-primary/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Total Pembayaran</p>
                            <p className="text-2xl font-black text-white italic">
                                {isLoadingPrice ? (
                                    <span className="animate-pulse">...</span>
                                ) : (
                                    (dynamicPrice || 0).toLocaleString('id-ID')
                                )}
                                <span className="text-[10px] font-black text-slate-500 uppercase ml-1.5 not-italic tracking-widest">IDR</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1 italic">Poin Didapat</p>
                            <p className="text-base font-black text-primary italic leading-none">+{Math.floor((dynamicPrice || 0) / 1000).toLocaleString()} <span className="text-[8px]">XP</span></p>
                        </div>
                    </div>

                    <button
                        onClick={handleCreateBooking}
                        disabled={!selectedSlot || isSubmitting || isLoadingPrice || dynamicPrice === null}
                        className={`w-full py-4 rounded-[18px] font-black text-xs transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${!selectedSlot || isSubmitting || isLoadingPrice || dynamicPrice === null
                            ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                            : 'bg-primary active:scale-95 text-secondary shadow-lg shadow-primary/20'
                            }`}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span className="uppercase tracking-[0.2em]">Konfirmasi Pesanan</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
