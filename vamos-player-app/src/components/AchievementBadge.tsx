import { Star, Shield, Flame, Target, Zap, Crown, Swords } from 'lucide-react';

interface AchievementBadgeProps {
  type: string;
  isUnlocked: boolean;
  count?: number;
}

export function AchievementBadge({ type, isUnlocked, count }: AchievementBadgeProps) {
  const configs: Record<string, { icon: any, color: string, label: string, desc: string }> = {
    PIONEER: {
      icon: Target,
      color: 'text-cyan-400',
      label: 'Pioneer',
      desc: 'First match win'
    },
    STREAK_KING: {
      icon: Flame,
      color: 'text-orange-500',
      label: 'Streak King',
      desc: '3+ Win streak'
    },
    DEATHMATCH: {
      icon: Swords,
      color: 'text-rose-500',
      label: 'High Roller',
      desc: 'High stake victory'
    },
    LEVEL_10: {
      icon: Crown,
      color: 'text-amber-400',
      label: 'Elite Ops',
      desc: 'Reached Level 10'
    },
    LOYALTY: {
      icon: Shield,
      color: 'text-emerald-400',
      label: 'Loyalist',
      desc: '10+ Arena sessions'
    },
    NIGHT_OWL: {
      icon: Zap,
      color: 'text-purple-400',
      label: 'Night Owl',
      desc: 'Wins after 10PM'
    }
  };

  const config = configs[type] || { icon: Star, color: 'text-slate-500', label: type, desc: 'Achievement' };
  const Icon = config.icon;

  return (
    <div className={`relative group flex flex-col items-center transition-all duration-300 ${!isUnlocked ? 'opacity-20 grayscale scale-95' : 'hover:scale-110'}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 border-2 ${isUnlocked ? 'bg-white/5 border-white/10 fiery-glow' : 'bg-black/20 border-white/5'}`}>
        <Icon size={24} className={isUnlocked ? config.color : 'text-slate-700'} strokeWidth={2} />
        {count && count > 1 && (
          <div className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg border-2 border-[#070b14]">
            x{count}
          </div>
        )}
      </div>
      <p className={`text-[8px] font-black uppercase tracking-widest italic text-center leading-tight ${isUnlocked ? 'text-white' : 'text-slate-700'}`}>
        {config.label}
      </p>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-24 bg-[#1a1f35] border border-white/10 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-2xl">
         <p className="text-[7px] font-black text-primary uppercase tracking-widest mb-1">{config.label}</p>
         <p className="text-[6px] text-slate-400 font-bold uppercase">{config.desc}</p>
         <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#1a1f35]" />
      </div>
    </div>
  );
}
