import { Crown, User, Swords, Flame } from 'lucide-react';

interface KingInfo {
  name: string;
  avatar?: string;
  streak: number;
}

interface TableCardProps {
  tableId?: string;
  name?: string;
  type?: string;
  status?: string;
  isKingTable?: boolean;
  kingInfo?: KingInfo;
  onClick?: () => void;
}

export function TableCard({
  name,
  type = 'REGULAR',
  isKingTable,
  kingInfo,
  onClick
}: TableCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left transition-all duration-500 active:scale-95 group rounded-[32px] overflow-hidden ${
        isKingTable ? 'glow-king' : ''
      }`}
    >
      {/* Glass Surface */}
      <div className={`perfect-glass shimmer p-6 lg:p-8 flex flex-col h-full min-h-[170px] ${
        isKingTable ? 'bg-yellow-500/5' : 'bg-white/5'
      }`}>
        
        {/* Status Pill */}
        <div className="flex justify-between items-start mb-6">
          <div className={`px-3 py-1 rounded-full flex items-center gap-2 border ${
            isKingTable 
              ? 'bg-yellow-500/10 border-yellow-500/20' 
              : 'bg-primary/10 border-primary/20'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isKingTable ? 'bg-yellow-500 animate-pulse' : 'bg-primary'
            }`} />
            <span className={`text-[9px] font-black uppercase tracking-widest italic ${
              isKingTable ? 'text-yellow-500' : 'text-primary'
            }`}>
              {isKingTable ? 'KING OF THE ARENA' : `ARENA ${type.toUpperCase()}`}
            </span>
          </div>

          {isKingTable && (
            <div className="w-8 h-8 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20 fiery-glow shadow-yellow-500/10">
              <Crown className="w-4 h-4 text-yellow-500" />
            </div>
          )}
        </div>

        {/* Arena Identity */}
        <div className="mt-auto">
          <h4 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-1 group-hover:text-primary transition-colors">
            {isKingTable ? 'King Table Arena' : (name?.toLowerCase().includes('king') ? name : `Sector ${type.toUpperCase()}`)}
          </h4>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-70">
            VAMOS BILLIARD ARENA
          </p>
        </div>

        {/* King Detail or Slot Booking Hint */}
        {isKingTable && kingInfo ? (
          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-primary/30 overflow-hidden relative">
                {kingInfo.avatar ? (
                  <img src={kingInfo.avatar} alt={kingInfo.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                )}
                {/* Streak Badge */}
                <div className="absolute -bottom-1 -right-1 bg-red-600 text-[8px] font-black px-1.5 py-0.5 rounded-full text-white border border-white/20">
                  {kingInfo.streak}X
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest italic mb-0.5">Arena King</p>
                <p className="text-[11px] font-black text-white uppercase italic">{kingInfo.name}</p>
              </div>
            </div>
            
            <div className="flex gap-1">
               <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
               <Swords className="w-4 h-4 text-primary" />
            </div>
          </div>
        ) : (
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
              Reservasi Slot Waktu
            </span>
            <span className="text-[10px] font-black text-primary uppercase italic flex items-center gap-1">
              Lihat Jam Kosong →
            </span>
          </div>
        )}

      </div>
    </button>
  );
}
