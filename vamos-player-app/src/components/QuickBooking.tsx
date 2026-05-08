import { useState, useMemo, useEffect } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { api } from '../api';


export function QuickBooking() {
    const { member, setActiveTab, venueInfo, addToast } = useAppStore();
    const [selectedDate] = useState<Date>(new Date());
    const [selectedTableType] = useState('REGULAR');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [availability, setAvailability] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const timeSlots = useMemo(() => {
        if (!venueInfo?.openTime || !venueInfo?.closeTime) return ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
        const slots = [];
        let [startH] = venueInfo.openTime.split(':').map(Number);
        let [endH] = venueInfo.closeTime.split(':').map(Number);
        if (endH <= startH) endH += 24;
        for (let h = startH; h <= endH; h++) {
            slots.push(`${(h % 24).toString().padStart(2, '0')}:00`);
        }
        return slots;
    }, [venueInfo]);

    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const dateStr = selectedDate.toISOString().split('T')[0];
                const res = await api.get('/player/availability', { params: { date: dateStr } });
                setAvailability(res.data.data || []);
            } catch (err) { console.error(err); }
        };
        fetchAvailability();
    }, [selectedDate]);

    const filteredSlots = useMemo(() => {
        const typeAvailability = availability.find(a => a.type === selectedTableType);
        const now = new Date();
        return timeSlots.filter(slot => {
            const [h, m] = slot.split(':').map(Number);
            const slotTime = new Date(selectedDate);
            if (h === 0) { slotTime.setDate(slotTime.getDate() + 1); slotTime.setHours(0, m, 0, 0); }
            else { slotTime.setHours(h, m, 0, 0); }
            if (slotTime <= now) return false;
            if (typeAvailability?.slots?.[slot]?.isFull) return false;
            return true;
        });
    }, [selectedDate, availability, selectedTableType, timeSlots]);

    const handleQuickBook = async () => {
        if (!selectedSlot) return;
        setIsSubmitting(true);
        try {
            const reservedTime = new Date(selectedDate);
            const [h, m] = selectedSlot.split(':').map(Number);
            reservedTime.setHours(h, m, 0, 0);

            const res = await api.post('/player/booking', {
                memberId: member.id,
                tableType: selectedTableType,
                reservedTime: reservedTime.toISOString(),
                durationMinutes: 60, // Default 1 hour for quick book
                partySize: 2,
            });

            if (res.data.success) {
                addToast({ title: 'BOOKING SUCCESS', message: `Meja ${selectedTableType} jam ${selectedSlot} dipesan!`, type: 'success' });
                setActiveTab('active-session');
            }
        } catch (err: any) {
            addToast({ title: 'BOOKING FAILED', message: err.response?.data?.message || 'Gagal memesan.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="px-1">
                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">Booking Meja</h3>
                <p className="text-[10px] font-black text-primary uppercase italic tracking-widest mt-1">Booking Online & Dapatkan +20 Poin</p>
            </div>

            <div className="fiery-card p-6 bg-[#1a1f35]/20 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                
                {/* Slots */}
                <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
                    {filteredSlots.length > 0 ? filteredSlots.slice(0, 10).map(slot => (
                        <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`shrink-0 px-5 py-2.5 rounded-xl border font-black text-[10px] italic transition-all ${selectedSlot === slot ? 'bg-primary text-secondary border-primary shadow-[0_0_15px_rgba(255,87,34,0.3)]' : 'bg-[#101423] border-white/5 text-slate-500'}`}
                        >
                            {slot}
                        </button>
                    )) : (
                        <p className="text-[9px] font-black text-slate-600 uppercase italic py-2">Tidak ada jadwal tersisa hari ini</p>
                    )}
                </div>

                {/* Action */}
                <button
                    disabled={!selectedSlot || isSubmitting}
                    onClick={handleQuickBook}
                    className={`w-full mt-4 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all ${!selectedSlot || isSubmitting ? 'bg-white/5 text-slate-700' : 'bg-primary text-secondary shadow-lg active:scale-95'}`}
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>BOOKING SEKARANG <ArrowRight className="w-4 h-4" /></>
                    )}
                </button>
            </div>
        </div>
    );
}
