import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, Info, ArrowRight, Crown, Box } from 'lucide-react';
import { useAppStore } from './store/appStore';
import { api } from './api';

const TIME_SLOTS = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30", "21:00", "22:30", "00:00"];
const TABLE_TYPES = [
    { id: 'REGULAR', name: 'Elite Regular', capacity: 'Up to 4 people', icon: <Box className="w-6 h-6" />, price: 35 },
    { id: 'VIP', name: 'VIP Champions', capacity: 'Up to 8 people', icon: <Crown className="w-6 h-6" />, price: 70 },
    { id: 'VVIP', name: 'VVIP Legend', capacity: 'Up to 12 people', icon: <Crown className="w-6 h-6 text-yellow-500" />, price: 105 },
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
                setActiveTab('home');
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
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Protocol Accepted</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10">Prepare for deployment at Vamos Arena.</p>

                {waSentStatus && (
                    <div className="bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66] px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 fade-in flex items-center justify-center gap-2 mx-auto w-fit">
                        <CheckCircle2 className="w-4 h-4" />
                        Comm link verified: WhatsApp Sent
                    </div>
                )}

                <div className="fiery-card p-10 w-full relative overflow-hidden">
                    <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-primary/5 rounded-full blur-[50px]" />

                    <div className="flex justify-between items-center mb-8">
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Departure Time</p>
                            <p className="text-2xl font-black text-white italic">{selectedSlot}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Operation Date</p>
                            <p className="text-2xl font-black text-white italic">{selectedDate.toLocaleDateString([], { day: '2-digit', month: 'short' })}</p>
                        </div>
                    </div>

                    <div className="h-px bg-white/5 mb-8" />

                    <div className="text-left">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic">Assigned Arena Sector</p>
                        <p className="text-2xl font-black text-white italic uppercase italic truncate">
                            {TABLE_TYPES.find(t => t.id === selectedTableType)?.name}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setActiveTab('home')}
                    className="mt-12 fiery-btn-secondary px-10 py-4 text-xs font-black uppercase tracking-widest"
                >
                    Return to HQ
                </button>
            </div>
        );
    }

    return (
        <div className="pb-48 text-white min-h-screen fade-in relative px-1">
            {/* Header Sticky */}
            <div className="pt-6 pb-6 flex justify-between items-center bg-[#101423]/90 backdrop-blur-xl sticky top-0 z-50 -mx-6 px-10 border-b border-white/5">
                <button onClick={() => setActiveTab('home')} className="w-12 h-12 rounded-2xl bg-[#1a1f35] flex items-center justify-center active:scale-90 transition-all text-white border border-white/5">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">Reserve Arena</h1>
                <button className="w-12 h-12 rounded-2xl bg-[#1a1f35] flex items-center justify-center text-slate-500 hover:text-white border border-white/5">
                    <Info className="w-5 h-5" />
                </button>
            </div>

            <div className="mt-8 space-y-10">
                {/* Venue Hero */}
                <div className="relative w-full h-64 rounded-[40px] overflow-hidden shadow-2xl group border border-white/5">
                    <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAYZh5174bTntP7U6hw-kNAZkwh_ugrnHhR99shHS1avC79wo6pgvWGbwe8sk9Ub6iikc0aFl4purzTFrZmwkOt99FZi26Yw4mP7pdk9XW5yIyIPyR7McbRh0PVExxt3BhAFY7S1wmXEC4ti31frTuekTUvAYCkMitkwZS0HJq475bDoDUTFVMn2aMQFkSxdKG1AA9VaST_kYtB-0FNX4h277QZpmuDRN-RVwo72m8tbu41fzAp7SOVfiwNnYOjuzJSlPNjcaMayY"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        alt="Vamos Elite Arena"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101423] via-[#101423]/30 to-transparent" />
                    <div className="absolute bottom-10 left-10 right-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="px-3 py-1 bg-primary rounded-full">
                                <span className="text-[10px] font-black text-secondary uppercase tracking-widest italic">Live Mission</span>
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Main Stage Arena</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">VAMOS ELITE HQ PROTOCOL</p>
                    </div>
                </div>

                {/* Date Selector */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end px-1">
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Mission Date</h3>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest italic">
                            {selectedDate.toLocaleDateString([], { month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                        {dates.map((d, i) => {
                            const isSelected = d.toDateString() === selectedDate.toDateString();
                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(d)}
                                    className={`flex-shrink-0 w-20 h-28 rounded-[32px] flex flex-col items-center justify-center transition-all duration-300 border ${isSelected
                                        ? 'bg-primary text-secondary border-primary shadow-xl shadow-primary/20 scale-105'
                                        : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <span className={`text-[10px] font-black mb-1 uppercase tracking-widest ${isSelected ? 'text-secondary/70' : 'text-slate-600'}`}>
                                        {d.toLocaleDateString([], { weekday: 'short' })}
                                    </span>
                                    <span className="text-2xl font-black italic">{d.getDate()}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-1 gap-8">
                    {/* Guest Count */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter px-1">Fireteam Size</h3>
                        <div className="flex items-center justify-between fiery-card px-8 py-4 border border-white/5">
                            <button
                                onClick={() => setPartySize(Math.max(1, partySize - 1))}
                                className="w-12 h-12 rounded-2xl bg-[#1a1f35] flex items-center justify-center text-slate-400 active:scale-90 transition-all font-black text-2xl border border-white/5 hover:text-white"
                            >
                                -
                            </button>
                            <div className="text-center">
                                <p className="text-3xl font-black text-white italic">{partySize} <span className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 not-italic">Players</span></p>
                            </div>
                            <button
                                onClick={() => setPartySize(Math.min(12, partySize + 1))}
                                className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-secondary active:scale-90 transition-all font-black text-2xl"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter px-1">Mission Duration</h3>
                        <div className="flex items-center justify-between fiery-card px-8 py-4 border border-white/5">
                            <button
                                onClick={() => setDuration(Math.max(1, duration - 1))}
                                className="w-12 h-12 rounded-2xl bg-[#1a1f35] flex items-center justify-center text-slate-400 active:scale-90 transition-all font-black text-2xl border border-white/5 hover:text-white"
                            >
                                -
                            </button>
                            <div className="text-center">
                                <p className="text-3xl font-black text-white italic">{duration} <span className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 not-italic">Hours</span></p>
                            </div>
                            <button
                                onClick={() => setDuration(Math.min(6, duration + 1))}
                                className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-secondary active:scale-90 transition-all font-black text-2xl"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sector Selection */}
                <div className="space-y-4">
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tighter px-1">Sector Selection</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {TABLE_TYPES.map(type => {
                            const isSelected = selectedTableType === type.id && !selectedPackageId;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => {
                                        setSelectedTableType(type.id);
                                        setSelectedPackageId(null);
                                    }}
                                    className={`p-6 rounded-[32px] border-2 transition-all duration-300 text-left relative overflow-hidden flex flex-col items-center text-center gap-3 ${isSelected
                                        ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(31,34,255,0.2)]'
                                        : 'bg-[#1a1f35] border-transparent hover:bg-white/5'
                                        }`}
                                >
                                    <div className={`${isSelected ? 'text-primary' : 'text-slate-600'}`}>
                                        {/* Adjusting icon size for the new layout */}
                                        {type.id === 'REGULAR' ? <Box className="w-8 h-8" /> : <Crown className="w-8 h-8" />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[10px] text-white leading-tight uppercase tracking-wider italic mb-1">{type.name.split(' ')[1]}</h4>
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">{(type.price * 1000).toLocaleString('id-ID')} Rp</p>
                                    </div>

                                    {isSelected && (
                                        <div className="absolute top-3 right-3">
                                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                <CheckCircle2 className="w-2.5 h-2.5 text-secondary" strokeWidth={3} />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Available Bundles */}
                {availablePackages.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter px-1 flex items-center gap-3">
                            <Box className="w-6 h-6 text-primary" /> Active Bundles
                        </h3>
                        <div className="space-y-4">
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
                                        className={`p-8 rounded-[40px] border-2 transition-all duration-300 flex justify-between items-center relative overflow-hidden group ${isSelected
                                            ? 'bg-primary/20 border-primary shadow-[0_0_30px_rgba(31,34,255,0.15)]'
                                            : 'bg-[#1a1f35] border-transparent hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="relative z-10">
                                            <h4 className="font-black text-lg text-white italic uppercase truncate">{pkg.name}</h4>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 italic">
                                                {pkg.duration / 60} Hour Operation • {pkg.tableType}
                                            </p>
                                            {pkg.startTime && (
                                                <div className="mt-3 px-3 py-1 bg-white/5 rounded-full inline-block">
                                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">Starts {pkg.startTime.substring(0, 5)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right relative z-10">
                                            <p className="text-xl font-black text-primary italic">{(pkg.memberPrice || pkg.price).toLocaleString('id-ID')} Rp</p>
                                            <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] mt-1">Special Protocol</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Deployment Windows */}
                <div className="space-y-4">
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tighter px-1">Deployment Slot</h3>
                    <div className="grid grid-cols-4 gap-4">
                        {filteredSlots.map(slot => {
                            const isSelected = selectedSlot === slot;
                            return (
                                <button
                                    key={slot}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`py-4 rounded-2xl transition-all duration-300 font-black text-xs italic ${isSelected
                                        ? 'bg-primary text-secondary border-primary shadow-lg shadow-primary/20 scale-105'
                                        : 'bg-white/5 text-slate-500 border-white/5 hover:text-white'
                                        }`}
                                >
                                    {slot}
                                </button>
                            );
                        })}
                    </div>
                    {filteredSlots.length === 0 && (
                        <div className="p-10 text-center fiery-card border-dashed border-white/10 opacity-50">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic leading-relaxed">No deployment windows available for this cycle.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Pricing Checkout */}
            <div className="fixed bottom-0 left-0 right-0 p-8 z-[100] bg-gradient-to-t from-[#101423] via-[#101423]/95 to-transparent pt-32 max-w-md mx-auto pointer-events-none">
                <div className="pointer-events-auto fiery-card p-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-primary/10">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Operation Cost</p>
                            <p className="text-4xl font-black text-white italic">
                                {isLoadingPrice ? (
                                    <span className="animate-pulse">...</span>
                                ) : (
                                    (dynamicPrice || 0).toLocaleString('id-ID')
                                )}
                                <span className="text-sm font-black text-slate-500 uppercase ml-2 not-italic">Rp</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 italic">XP Harvest</p>
                            <p className="text-xl font-black text-primary italic">+{Math.floor((dynamicPrice || 0) / 1000).toLocaleString()} <span className="text-[10px]">PTS</span></p>
                        </div>
                    </div>

                    <button
                        onClick={handleCreateBooking}
                        disabled={!selectedSlot || isSubmitting || isLoadingPrice || dynamicPrice === null}
                        className={`w-full py-5 rounded-[24px] font-black text-sm transition-all flex items-center justify-center gap-4 relative overflow-hidden group ${!selectedSlot || isSubmitting || isLoadingPrice || dynamicPrice === null
                            ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                            : 'fiery-btn-primary active:scale-95 text-secondary shadow-primary/20'
                            }`}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <span className="uppercase tracking-widest">Authorize Mission</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
