import { CheckCircle2, Circle, Gift } from 'lucide-react';

interface Quest {
  id: string;
  title: string;
  desc: string;
  reward: number;
  progress: number;
  target: number;
  isClaimed: boolean;
}

interface QuestCardProps {
  quests: Quest[];
  onClaim: (id: string) => void;
}

export function QuestCard({ quests, onClaim }: QuestCardProps) {
  return (
    <div className="mx-2">
      <div className="flex justify-between items-baseline mb-4 px-1">
        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Daily Operations</h3>
        <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Rewards Ready</span>
      </div>
      
      <div className="space-y-3">
        {quests.map((quest) => (
          <div 
            key={quest.id} 
            className={`fiery-card p-4 border border-white/5 transition-all relative overflow-hidden group ${quest.isClaimed ? 'opacity-50' : 'hover:border-primary/30'}`}
          >
            {/* Shimmer for Unclaimed & Completed */}
            {!quest.isClaimed && quest.progress >= quest.target && (
                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
            )}

            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${quest.progress >= quest.target ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-600'}`}>
                {quest.progress >= quest.target ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] font-black text-white uppercase italic tracking-tight truncate">{quest.title}</p>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Gift size={10} className="text-primary" />
                    <span className="text-[9px] font-black text-primary italic">+{quest.reward} XP</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-1.5">
                   <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full bg-gradient-to-r transition-all duration-700 ${quest.progress >= quest.target ? 'from-emerald-500 to-teal-400' : 'from-primary to-orange-400'}`}
                        style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                      />
                   </div>
                   <div className="flex justify-between items-center">
                      <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{quest.desc}</p>
                      <p className="text-[8px] font-black text-white italic">{quest.progress}/{quest.target}</p>
                   </div>
                </div>
              </div>

              {!quest.isClaimed && quest.progress >= quest.target && (
                <button 
                  onClick={() => onClaim(quest.id)}
                  className="px-4 py-2 bg-primary text-white text-[9px] font-black uppercase italic rounded-lg fiery-glow active:scale-95 transition-all"
                >
                  CLAIM
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
