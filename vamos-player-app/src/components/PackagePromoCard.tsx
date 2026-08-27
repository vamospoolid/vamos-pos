import { useState, useEffect } from 'react';
import { ChevronRight, Clock, Tag, Zap, ArrowRight, Flame, Star } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { api } from '../api';

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

function getPackageLabel(pkg: Package): { label: string; color: string } {
    const name = pkg.name.toUpperCase();
    if (name.includes('MALAM')) return { label: '🌙 MALAM', color: 'text-indigo-400' };
    if (name.includes('SIANG')) return { label: '☀️ SIANG', color: 'text-amber-400' };
    if (name.includes('VIP'))   return { label: '👑 VIP', color: 'text-yellow-400' };
    return { label: '🎯 REGULER', color: 'text-cyan-400' };
}

function getDiscount(pkg: Package): number | null {
    if (!pkg.memberPrice || pkg.memberPrice >= pkg.price) return null;
    return Math.round((1 - pkg.memberPrice / pkg.price) * 100);
}

export function PackagePromoCard() {
    const { setActiveTab } = useAppStore();
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const res = await api.get('/pricing/packages');
                const nowHour = new Date().getHours();
                const active = (res.data.data || []).filter((p: Package) => {
                    if (!p.isActive) return false;
                    // Filter Paket Siang jika sudah lewat jam 17:00
                    const name = p.name.toUpperCase();
                    if (name.includes('SIANG') && nowHour >= 17) return false;
                    return true;
                });
                setPackages(active);
            } catch (err) {
                console.error('Failed to fetch packages for promo', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, []);

    // Don't render anything if no packages available after loading
    if (!loading && packages.length === 0) return null;

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex justify-between items-end px-1">
                <div>
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] italic mb-1 flex items-center gap-2">
                        <Flame className="w-3 h-3" />
                        Promo Eksklusif
                    </p>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
                        Booking <span className="text-cyan-400">Paket</span>
                    </h3>
                </div>
                <button
                    onClick={() => setActiveTab('booking-paket')}
                    className="text-[10px] font-black text-slate-500 hover:text-cyan-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                    Lihat Semua <ChevronRight className="w-3 h-3" />
                </button>
            </div>

            {/* Hero CTA + Package Cards Container */}
            <div className="relative rounded-[28px] overflow-hidden border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.08)]"
                style={{ background: 'linear-gradient(135deg, #0d1a2e 0%, #0a1628 50%, #0d1535 100%)' }}>

                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-cyan-500/5 blur-[60px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-indigo-500/8 blur-[50px] pointer-events-none" />

                {/* Top badge row */}
                <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                            <Tag className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Reserve Protocol</p>
                            <p className="text-sm font-black text-white italic uppercase tracking-tight leading-none">Paket Hemat Member</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-full">
                        <Star className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest italic">Khusus App</span>
                    </div>
                </div>

                {/* Package Cards Scroll */}
                <div className="relative z-10 px-4 py-4">
                    {loading ? (
                        /* Skeleton */
                        <div className="flex gap-3 overflow-x-hidden">
                            {[1, 2].map(i => (
                                <div key={i} className="min-w-[160px] h-[110px] rounded-2xl bg-white/5 animate-pulse shrink-0" />
                            ))}
                        </div>
                    ) : (
                        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                            {packages.slice(0, 4).map((pkg) => {
                                const { label, color } = getPackageLabel(pkg);
                                const discount = getDiscount(pkg);
                                const displayPrice = pkg.memberPrice || pkg.price;

                                return (
                                    <button
                                        key={pkg.id}
                                        onClick={() => setActiveTab('booking-paket')}
                                        className="min-w-[155px] shrink-0 bg-[#0a1628]/80 border border-cyan-500/15 hover:border-cyan-500/40 rounded-[20px] p-4 text-left transition-all active:scale-95 group relative overflow-hidden"
                                    >
                                        {/* Discount badge */}
                                        {discount && (
                                            <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-secondary text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                -{discount}%
                                            </div>
                                        )}

                                        {/* Time label */}
                                        <p className={`text-[9px] font-black uppercase tracking-widest italic mb-1.5 ${color}`}>
                                            {label}
                                        </p>

                                        {/* Package name */}
                                        <p className="text-[11px] font-black text-white italic uppercase tracking-tight leading-tight line-clamp-2 mb-3">
                                            {pkg.name}
                                        </p>

                                        {/* Duration & Type */}
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <Clock className="w-3 h-3 text-slate-600 shrink-0" />
                                            <span className="text-[9px] text-slate-500 font-black uppercase italic">
                                                {pkg.duration}j · {pkg.tableType}
                                            </span>
                                        </div>

                                        {/* Price */}
                                        <div>
                                            {pkg.memberPrice && pkg.memberPrice < pkg.price && (
                                                <p className="text-[9px] text-slate-600 line-through font-bold">
                                                    {pkg.price.toLocaleString()}
                                                </p>
                                            )}
                                            <p className="text-base font-black text-white italic tracking-tight">
                                                {displayPrice.toLocaleString()}
                                                <span className="text-[10px] text-slate-500 ml-0.5">Rp</span>
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* CTA Button */}
                <div className="relative z-10 px-4 pb-4">
                    <button
                        onClick={() => setActiveTab('booking-paket')}
                        className="w-full py-3.5 rounded-[18px] font-black text-[11px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                        style={{
                            background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)',
                            boxShadow: '0 0 30px rgba(6,182,212,0.2)'
                        }}
                    >
                        <Zap className="w-4 h-4 text-white group-hover:animate-pulse" />
                        <span className="text-white">Booking Paket Sekarang</span>
                        <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-center text-[8px] font-black text-slate-600 uppercase tracking-widest italic mt-2.5">
                        +20 Poin · Booking Eksklusif Lewat Aplikasi
                    </p>
                </div>
            </div>
        </div>
    );
}
