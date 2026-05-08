import { MapPin, Users, Zap, Trophy, Flame } from 'lucide-react';

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
  // Psychology: Scarcity detection (e.g. "12/16" -> 4 left)
  const [current, max] = players.split('/').map(Number);
  const isFillingUp = max && (max - current) <= 4;

  return (
    <div className={`relative w-full rounded-[40px] p-8 overflow-hidden transition-all active:scale-[0.97] group border shadow-[0_25px_60px_rgba(0,0,0,0.6)] ${
      isPremium 
        ? 'bg-gradient-to-br from-[#1a1f35] to-[#0d0f14] border-primary/30' 
        : 'bg-[#101423] border-white/5'
    }`}>
      {/* Dynamic Background Accents */}
      {isPremium ? (
        <>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-primary/50 to-transparent pointer-events-none opacity-50" />
          <div className="absolute top-4 right-8 z-20">
             <div className="bg-amber-500/20 text-amber-500 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                <Flame className="w-3 h-3" fill="currentColor" />
                <span className="text-[8px] font-black uppercase tracking-widest italic">Major</span>
             </div>
          </div>
        </>
      ) : (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      )}

      {/* Tags & Urgency Indicators */}
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic ${
          status === 'Open' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
        }`}>
          {status}
        </div>
        
        {startsIn && (
          <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
            <span className="text-[9px] font-black text-white/70 uppercase tracking-widest italic">
              {startsIn}
            </span>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 gap-6 mb-10 relative z-10">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
             <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-[0.95] group-hover:text-primary transition-colors duration-300">
               {title}
             </h3>
             {prizePool && (
               <div className="shrink-0 flex flex-col items-end">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Trophy className="w-5 h-5 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" fill="currentColor" />
                    <span className="text-2xl font-black italic tracking-tighter leading-none">{prizePool}</span>
                  </div>
                  <p className="text-[8px] font-black text-amber-500/50 uppercase tracking-[0.2em] italic mt-1">Prize Pool</p>
               </div>
             )}
          </div>
          
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
            <div className="flex items-center gap-2.5 text-white/30 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <p className="text-[9px] font-black uppercase tracking-widest italic">{location}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-white/50">
                <Users className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">{players}</span>
              </div>
              {isFillingUp && (
                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest italic animate-pulse bg-red-500/10 px-2 py-0.5 rounded-md">
                  Last Call
                </span>
              )}
            </div>
          </div>
        </div>

        {entryFee && (
          <div className="bg-[#0a0d18] p-5 rounded-3xl border border-white/5 flex items-center justify-between group-hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-slate-500" fill="currentColor" />
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] italic mb-0.5">Biaya Pendaftaran</p>
                  <p className="text-sm font-black text-white italic">{entryFee}</p>
               </div>
            </div>
            <div className="text-right">
               <p className="text-[14px] font-black text-white/20 italic uppercase tracking-tighter leading-none">Entry</p>
            </div>
          </div>
        )}
      </div>

      {/* High-Contrast Action Button */}
      <button 
        onClick={onJoin}
        className={`w-full py-6 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] italic transition-all relative overflow-hidden flex items-center justify-center gap-4 group/btn ${
          isPremium 
            ? 'bg-primary text-white shadow-[0_15px_40px_rgba(255,87,34,0.4)] hover:shadow-[0_20px_50px_rgba(255,87,34,0.6)] hover:scale-[1.02]' 
            : 'bg-white text-black hover:bg-slate-200 shadow-xl'
        }`}
      >
        <span className="relative z-10">DAFTAR SEKARANG</span>
        <ChevronRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
        
        {/* Button shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
      </button>
    </div>
  );
}

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
