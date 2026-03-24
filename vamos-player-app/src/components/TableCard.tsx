import { Crown, User, Swords, Flame } from 'lucide-react';

interface KingInfo {
  name: string;
  avatar?: string;
  streak: number;
}

interface SessionInfo {
  customerName: string;
  memberPhoto?: string;
  memberLevel?: number;
  memberHandicap?: string;
  startTime?: string;
}

interface TableCardProps {
  tableId: string;
  name: string;
  type: string;
  status: 'AVAILABLE' | 'PLAYING' | 'MAINTENANCE';
  isKingTable?: boolean;
  kingInfo?: KingInfo;
  session?: SessionInfo;
  onClick?: () => void;
}

export function TableCard({
  name,
  status,
  isKingTable,
  kingInfo,
  session,
  onClick
}: TableCardProps) {
  const isOccupied = status === 'PLAYING';
  
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left transition-all duration-500 active:scale-95 group rounded-[32px] overflow-hidden ${
        isKingTable ? 'glow-king' : isOccupied ? 'glow-active' : ''
      }`}
    >
      {/* Glass Surface */}
      <div className={`perfect-glass shimmer p-6 lg:p-8 flex flex-col h-full min-h-[180px] ${
        isKingTable ? 'bg-yellow-500/5' : isOccupied ? 'bg-green-500/5' : 'bg-white/5'
      }`}>
        
        {/* Status Pill */}
        <div className="flex justify-between items-start mb-6">
          <div className={`px-3 py-1 rounded-full flex items-center gap-2 border ${
            isOccupied 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-primary/10 border-primary/20'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isOccupied ? 'bg-green-500 animate-pulse' : 'bg-primary'
            }`} />
            <span className={`text-[9px] font-black uppercase tracking-widest italic ${
              isOccupied ? 'text-green-500' : 'text-primary'
            }`}>
              {isOccupied ? 'LIVE SESSION' : 'AVAILABLE'}
            </span>
          </div>

          {isKingTable && (
            <div className="w-8 h-8 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20 fiery-glow shadow-yellow-500/10">
              <Crown className="w-4 h-4 text-yellow-500" />
            </div>
          )}
        </div>

        {/* Table Identity */}
        <div className="mt-auto">
          <h4 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-1 group-hover:text-primary transition-colors">
            {name}
          </h4>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-70">
            VAMOS ARENA SECTOR: {name.split(' ')[0]}
          </p>
        </div>

        {/* King / Occupancy Detail */}
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
        ) : isOccupied ? (
          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary/10 border-2 border-primary/20 overflow-hidden relative">
                  {session?.memberPhoto ? (
                    <img src={session.memberPhoto} alt={session.customerName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                       <User className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                  {session?.memberLevel && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-[7px] font-black px-1 rounded-full text-secondary">
                      LV{session.memberLevel}
                    </div>
                  )}
               </div>
               <div>
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest italic mb-0.5">Operative Active</p>
                  <p className="text-[11px] font-black text-white uppercase italic">{session?.customerName || 'In Game'}</p>
               </div>
            </div>
            {session?.memberHandicap && (
              <div className="px-2 py-1 bg-white/5 rounded-md border border-white/5 flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-primary" />
                  <span className="text-[8px] font-black text-white italic">HC {session.memberHandicap}</span>
              </div>
            )}
          </div>
        ) : null}


      </div>
    </button>
  );
}
