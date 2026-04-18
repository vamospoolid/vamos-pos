import { MapPin, Users, Zap } from 'lucide-react';

interface FeaturedBookingCardProps {
  title: string;
  location: string;
  prizePool?: string;
  entryFee?: string;
  players: string;
  startsIn?: string;
  status: 'Open' | 'Booked' | 'Private';
  isPremium?: boolean;
  onJoin: () => void;
}

export function FeaturedBookingCard({ 
  title, 
  location, 
  prizePool,
  entryFee,
  players, 
  startsIn, 
  status, 
  isPremium,
  onJoin 
}: FeaturedBookingCardProps) {
  return (
    <div className={`relative w-full rounded-[32px] p-8 overflow-hidden mb-6 transition-all active:scale-[0.98] group ${
      isPremium 
        ? 'fiery-gradient-card' 
        : 'bg-[#1a1f35]/80 border border-white/5 shadow-xl'
    }`}>
      {/* Background patterns */}
      <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-black/10 rounded-full blur-[40px] pointer-events-none" />

      {/* Tags Row */}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
          isPremium ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'
        }`}>
          {status}
        </span>
        {startsIn && (
          <span className="text-[9px] font-black text-white/50 uppercase tracking-widest italic flex items-center gap-1.5">
            <Zap className={`w-3 h-3 ${isPremium ? 'text-white' : 'text-primary'}`} fill="currentColor" />
            Starts in {startsIn}
          </span>
        )}
      </div>

      {/* Main Info */}
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className="flex-1 pr-6">
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight mb-2 group-hover:translate-x-1 transition-transform">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-white/40">
            <MapPin className="w-3.5 h-3.5" />
            <p className="text-[10px] font-black uppercase tracking-widest italic truncate">{location}</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          {prizePool && (
            <p className={`text-xl font-black italic tracking-tighter leading-none mb-1.5 ${isPremium ? 'text-amber-400' : 'text-amber-500'}`}>
              🏆 {prizePool}
            </p>
          )}
          {entryFee && (
            <div className="bg-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
               <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Wildcard</span>
               <span className="text-[11px] font-black text-white italic">{entryFee}</span>
            </div>
          )}
          <div className="flex items-center justify-end gap-2 mt-3 text-white/40">
            <Users className="w-4 h-4" />
            <p className="text-[10px] font-black uppercase tracking-widest italic">{players} Players</p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button 
        onClick={onJoin}
        className={`w-full py-5 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] italic transition-all relative overflow-hidden flex items-center justify-center gap-3 ${
          isPremium 
            ? 'bg-[#0d0f14] text-white shadow-2xl hover:bg-black' 
            : 'fiery-btn-primary shadow-lg shadow-primary/20'
        }`}
      >
        <span>Join Game</span>
        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
        </div>
      </button>
    </div>
  );
}
