import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Clock, CheckCircle2, Loader2, Tag, Sun, Moon, Crown, Zap, Calendar, Users, ChevronRight } from 'lucide-react';
import { useAppStore } from './store/appStore';
import { api } from './api';

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

const TABS = [
    { id: 'semua',  label: 'Semua',  icon: Tag },
    { id: 'siang',  label: 'Siang',  icon: Sun },
    { id: 'malam',  label: 'Malam',  icon: Moon },
    { id: 'vip',    label: 'VIP',    icon: Crown },
] as const;

type TabId = typeof TABS[number]['id'];

const DEFAULT_SLOTS = [
    '10:00','11:00','12:00','13:00','14:00','15:00',
    '16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00','00:00'
];

function formatDuration(h: number) {
    return h === 1 ? '1 Jam' : `${h} Jam`;
}

function getPackageTag(pkg: Package): { label: string; color: string; bg: string } {
    const name = pkg.name.toUpperCase();
    if (name.includes('MALAM')) return { label: 'MALAM', color: 'text-indigo-300', bg: 'bg-indigo-500/15 border-indigo-500/25' };
    if (name.includes('SIANG')) return { label: 'SIANG', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-400/25' };
    if (name.includes('VIP'))   return { label: 'VIP',   color: 'text-yellow-300', bg: 'bg-yellow-500/15 border-yellow-400/25' };
    return { label: 'REGULER', color: 'text-cyan-300', bg: 'bg-cyan-500/15 border-cyan-400/25' };
}

function matchesTab(pkg: Package, tab: TabId): boolean {
    const name = pkg.name.toUpperCase();
    if (tab === 'semua') return true;
    if (tab === 'siang') return name.includes('SIANG');
    if (tab === 'malam') return name.includes('MALAM');
    if (tab === 'vip')   return name.includes('VIP') || pkg.tableType === 'VIP' || pkg.tableType === 'VVIP';
    return true;
}

export function BookingPaketScreen() {
    const { member, setActiveTab } = useAppStore();
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setTab] = useState<TabId>('semua');
    const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [partySize, setPartySize] = useState(2);
    const [availability, setAvailability] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const nowHour = new Date().getHours();
    const today = new Date();

    // Fetch packages with time filter
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/pricing/packages');
                const filtered = (res.data.data || []).filter((p: Package) => {
                    if (!p.isActive) return false;
                    const name = p.name.toUpperCase();
                    // Sembunyikan Paket Siang jika sudah >= 17:00
                    if (name.includes('SIANG') && nowHour >= 17) return false;
                    return true;
                });
                setPackages(filtered);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, [nowHour]);

    // Fetch availability
    useEffect(() => {
        const fetch = async () => {
            try {
                const dateStr = today.toISOString().split('T')[0];
                const res = await api.get('/player/availability', { params: { date: dateStr } });
                setAvailability(res.data.data || []);
            } catch (e) { console.error(e); }
        };
        fetch();
    }, []);

    // Build time slots (default)
    const timeSlots = DEFAULT_SLOTS;

    // Filter slots for selected package
    const filteredSlots = useMemo(() => {
        const typeAvailability = availability.find(a => a.type === (selectedPkg?.tableType || 'REGULAR'));
        return timeSlots.filter(slot => {
            const [h, m] = slot.split(':').map(Number);
            const slotTime = new Date(today);
            if (h === 0) { slotTime.setDate(slotTime.getDate() + 1); slotTime.setHours(0, m, 0, 0); }
            else { slotTime.setHours(h, m, 0, 0); }
            if (slotTime <= new Date()) return false;
            if (typeAvailability?.slots?.[slot]?.isFull) return false;

            // Package time restriction
            if (selectedPkg) {
                const name = selectedPkg.name.toUpperCase();
                if (name.includes('SIANG') && (h >= 18 || h < 9)) return false;
                if (name.includes('MALAM') && (h < 18 && h !== 0)) return false;
            }
            return true;
        });
    }, [timeSlots, availability, selectedPkg, today]);

    const visiblePackages = packages.filter(p => matchesTab(p, activeTab));

    const handleBook = async () => {
        if (!selectedPkg || !selectedSlot) return;
        setIsSubmitting(true);
        setErrorMsg('');
        try {
            const reservedTime = new Date(today);
            const [h, m] = selectedSlot.split(':').map(Number);
            if (h === 0) { reservedTime.setDate(reservedTime.getDate() + 1); reservedTime.setHours(0, m, 0, 0); }
            else { reservedTime.setHours(h, m, 0, 0); }

            const res = await api.post('/player/booking', {
                memberId: member.id,
                tableType: selectedPkg.tableType,
                packageId: selectedPkg.id,
                reservedTime: reservedTime.toISOString(),
                durationMinutes: selectedPkg.duration * 60,
                partySize,
            });
            if (res.data.success) {
                setSuccess(true);
                setTimeout(() => setActiveTab('dashboard'), 3500);
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Terjadi kesalahan, coba lagi.');
        } finally { setIsSubmitting(false); }
    };

    // ─── SUCCESS STATE ───────────────────────────────────────────────────────
    if (success) {
        return (
            <div className="fade-in pb-40 text-white flex flex-col items-center justify-center h-[90vh] px-10 text-center">
                <div className="w-32 h-32 rounded-full flex items-center justify-center mb-8 border-2 border-cyan-400 shadow-[0_0_80px_rgba(6,182,212,0.4)] animate-pulse relative"
                    style={{ background: 'rgba(6,182,212,0.1)' }}>
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'rgba(6,182,212,0.3)' }} />
                    <CheckCircle2 className="w-16 h-16 text-cyan-400" />
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4 leading-tight">
                    BOOKING<br /><span className="text-cyan-400">BERHASIL!</span>
                </h2>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-relaxed italic opacity-80 max-w-[260px]">
                    Paket Anda sudah dipesan. Kasir akan konfirmasi kedatangan Anda.
                </p>
            </div>
        );
    }

    return (
        <div className="fade-in pb-40 text-white">

            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <header className="flex justify-between items-center pt-6 pb-5 bg-[#070b14]/95 backdrop-blur-xl sticky top-0 z-50 -mx-6 px-6 border-b border-cyan-500/10 shadow-[0_4px_30px_rgba(6,182,212,0.05)]">
                <button onClick={() => setActiveTab('dashboard')}
                    className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 active:scale-95 transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em] italic">Reserve Protocol</p>
                    <h1 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">Booking Paket</h1>
                </div>
                <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-full">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">+20 Poin</span>
                </div>
            </header>

            <div className="mt-6 space-y-6">

                {/* ── TAB BAR ──────────────────────────────────────────── */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setTab(tab.id); setSelectedPkg(null); setSelectedSlot(''); }}
                                className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-widest italic transition-all ${
                                    isActive
                                        ? 'border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                                        : 'bg-[#0d1628]/60 border-white/5 text-slate-500 hover:border-cyan-500/20'
                                }`}
                                style={isActive ? { background: 'rgba(6,182,212,0.12)' } : {}}>
                                <Icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── PACKAGE CARDS ─────────────────────────────────────── */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-[110px] rounded-[24px] bg-white/5 animate-pulse" />)}
                    </div>
                ) : visiblePackages.length === 0 ? (
                    <div className="py-16 text-center rounded-[24px] border border-dashed border-white/10">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">
                            {activeTab === 'siang' && nowHour >= 17
                                ? 'Paket Siang tidak tersedia setelah jam 17:00'
                                : 'Tidak ada paket tersedia'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visiblePackages.map(pkg => {
                            const tag = getPackageTag(pkg);
                            const isSelected = selectedPkg?.id === pkg.id;
                            const displayPrice = pkg.memberPrice || pkg.price;
                            const discount = pkg.memberPrice && pkg.memberPrice < pkg.price
                                ? Math.round((1 - pkg.memberPrice / pkg.price) * 100) : null;

                            return (
                                <button
                                    key={pkg.id}
                                    onClick={() => { setSelectedPkg(pkg); setSelectedSlot(''); }}
                                    className={`w-full text-left rounded-[24px] p-5 border transition-all active:scale-[0.98] relative overflow-hidden ${
                                        isSelected
                                            ? 'border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                                            : 'border-white/8 bg-[#0d1628]/60 hover:border-cyan-500/20'
                                    }`}
                                    style={isSelected ? { background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(99,102,241,0.08) 100%)' } : {}}>

                                    {/* Selected indicator */}
                                    {isSelected && (
                                        <div className="absolute top-4 right-4">
                                            <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4 text-[#070b14]" strokeWidth={3} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4 pr-8">
                                        <div className="flex-1 min-w-0">
                                            {/* Tag + Discount */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[8px] font-black uppercase tracking-widest italic px-2 py-0.5 rounded-full border ${tag.bg} ${tag.color}`}>
                                                    {tag.label}
                                                </span>
                                                {discount && (
                                                    <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                                                        Hemat {discount}%
                                                    </span>
                                                )}
                                            </div>

                                            {/* Name */}
                                            <h3 className="text-base font-black text-white italic uppercase tracking-tight leading-tight mb-2 truncate">
                                                {pkg.name}
                                            </h3>

                                            {/* Meta */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3 text-slate-500" />
                                                    <span className="text-[9px] font-black text-slate-500 uppercase italic">{formatDuration(pkg.duration)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Tag className="w-3 h-3 text-slate-500" />
                                                    <span className="text-[9px] font-black text-slate-500 uppercase italic">{pkg.tableType}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="text-right shrink-0">
                                            {pkg.memberPrice && pkg.memberPrice < pkg.price && (
                                                <p className="text-[9px] text-slate-600 line-through font-bold">{pkg.price.toLocaleString()}</p>
                                            )}
                                            <p className="text-xl font-black text-white italic tracking-tight">
                                                {displayPrice.toLocaleString()}
                                            </p>
                                            <p className="text-[9px] text-slate-500 uppercase">Rp</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── SLOT PICKER (muncul jika paket sudah dipilih) ─────── */}
                {selectedPkg && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-cyan-500/15" />
                            <span className="text-[9px] font-black text-cyan-400/60 uppercase tracking-widest italic flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> Pilih Jam Main
                            </span>
                            <div className="flex-1 h-px bg-cyan-500/15" />
                        </div>

                        {/* Jumlah Pemain */}
                        <div className="flex items-center justify-between rounded-[20px] border border-cyan-500/15 px-5 py-4"
                            style={{ background: 'rgba(6,182,212,0.05)' }}>
                            <div className="flex items-center gap-3">
                                <Users className="w-4 h-4 text-cyan-400/60" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Jumlah Pemain</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setPartySize(p => Math.max(1, p - 1))}
                                    className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-black text-lg active:scale-90 transition-all">
                                    -
                                </button>
                                <span className="text-lg font-black text-white w-4 text-center">{partySize}</span>
                                <button onClick={() => setPartySize(p => Math.min(12, p + 1))}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[#070b14] font-black text-lg active:scale-90 transition-all"
                                    style={{ background: 'linear-gradient(135deg, #06b6d4, #6366f1)' }}>
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Time Slots */}
                        {filteredSlots.length === 0 ? (
                            <p className="text-center text-[9px] font-black text-slate-600 uppercase italic tracking-widest py-4">
                                Tidak ada jadwal tersedia untuk paket ini
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {filteredSlots.map(slot => (
                                    <button
                                        key={slot}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`px-4 py-2.5 rounded-xl border font-black text-[10px] italic tracking-widest transition-all active:scale-95 ${
                                            selectedSlot === slot
                                                ? 'border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                                                : 'bg-[#0d1628]/60 border-white/8 text-slate-500 hover:border-cyan-500/20'
                                        }`}
                                        style={selectedSlot === slot ? { background: 'rgba(6,182,212,0.12)' } : {}}>
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Summary + CTA */}
                        {selectedSlot && (
                            <div className="space-y-3 animate-in fade-in duration-200">
                                {/* Summary card */}
                                <div className="rounded-[20px] border border-cyan-500/20 p-4 space-y-2"
                                    style={{ background: 'rgba(6,182,212,0.05)' }}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-500 uppercase italic">Paket</span>
                                        <span className="text-[10px] font-black text-white italic">{selectedPkg.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-500 uppercase italic">Jam Mulai</span>
                                        <span className="text-[10px] font-black text-cyan-400 italic">{selectedSlot}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-500 uppercase italic">Durasi</span>
                                        <span className="text-[10px] font-black text-white italic">{formatDuration(selectedPkg.duration)}</span>
                                    </div>
                                    <div className="h-px bg-white/5 my-1" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-500 uppercase italic">Total</span>
                                        <span className="text-base font-black text-cyan-400 italic">
                                            Rp {(selectedPkg.memberPrice || selectedPkg.price).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Book button */}
                                <button
                                    onClick={handleBook}
                                    disabled={isSubmitting}
                                    className="w-full py-4 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)', boxShadow: '0 0 30px rgba(6,182,212,0.25)' }}>
                                    {isSubmitting
                                        ? <Loader2 className="w-5 h-5 animate-spin text-white" />
                                        : <><Zap className="w-4 h-4 text-white" /><span className="text-white">Konfirmasi Booking</span><ChevronRight className="w-4 h-4 text-white/70" /></>
                                    }
                                </button>
                                <p className="text-center text-[8px] font-black text-slate-600 uppercase tracking-widest italic">
                                    +20 Poin · Pembayaran di kasir saat kedatangan
                                </p>
                                {errorMsg && (
                                    <p className="text-center text-[9px] font-black text-rose-400 uppercase tracking-widest italic">{errorMsg}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
