import { Shield, Zap, TrendingUp, Crown } from 'lucide-react';

interface TierCardProps {
  member: any;
}

export function TierCard({ member }: TierCardProps) {
  const level = member.level || 1;
  const xp = member.experience || 0;
  const tier = member.tier || 'BRONZE';
  
  // Calculate XP Progress
  const currentLevelMinXP = (level * (level - 1) * 1000) / 2;
  const nextLevelTargetXP = (level * (level + 1) * 1000) / 2;
  const progress = Math.min(100, Math.max(0, ((xp - currentLevelMinXP) / (nextLevelTargetXP - currentLevelMinXP)) * 100));

  const tierConfigs: Record<string, { color: string, gradient: string, glow: string, icon: any, label: string }> = {
    BRONZE: {
      color: 'text-slate-400',
      gradient: 'from-slate-800 to-slate-900',
      glow: 'shadow-slate-900/20',
      icon: Shield,
      label: 'Bronze Division'
    },
    SILVER: {
      color: 'text-cyan-400',
      gradient: 'from-slate-800 via-cyan-950 to-slate-900',
      glow: 'shadow-cyan-500/10',
      icon: Zap,
      label: 'Silver Elite'
    },
    GOLD: {
      color: 'text-amber-400',
      gradient: 'from-slate-900 via-amber-950 to-amber-900',
      glow: 'shadow-amber-500/20',
      icon: TrendingUp,
      label: 'Gold Pro'
    },
    PLATINUM: {
      color: 'text-purple-400',
      gradient: 'from-indigo-950 via-purple-900 to-slate-900',
      glow: 'shadow-purple-500/30',
      icon: Crown,
      label: 'Platinum Legend'
    }
  };

  const config = tierConfigs[tier] || tierConfigs.BRONZE;
  const Icon = config.icon;

  return (
    <div className={`relative overflow-hidden rounded-[32px] p-6 bg-gradient-to-br ${config.gradient} border border-white/10 shadow-2xl ${config.glow} transition-all duration-500 group`}>
      {/* Animated Background Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -ml-12 -mb-12 group-hover:bg-primary/20 transition-all duration-700" />
      
      {/* Shimmer Effect for Platinum/Gold */}
      {(tier === 'PLATINUM' || tier === 'GOLD') && <div className="animate-shimmer" />}

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${config.color}`}>
                <Icon size={14} strokeWidth={3} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] italic ${config.color}`}>
                {config.label}
              </span>
            </div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
              LEVEL <span className="text-primary">{level}</span>
            </h3>
          </div>
          
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-1">Total Power</p>
            <p className="text-lg font-black text-white italic leading-none">{xp.toLocaleString()}<span className="text-[10px] text-slate-600 ml-1">XP</span></p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Progress to Level {level + 1}</p>
            <p className="text-[9px] font-black text-white italic">
               {Math.floor(xp - currentLevelMinXP)} / {Math.floor(nextLevelTargetXP - currentLevelMinXP)}
            </p>
          </div>
          <div className="h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30" />
            </div>
          </div>
        </div>

        {/* Stats Summary Row */}
        <div className="grid grid-cols-3 gap-2 mt-6">
            <div className="bg-white/5 border border-white/5 rounded-xl py-2 px-3">
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Wins</p>
                <p className="text-xs font-black text-white italic">{member.totalWins || 0}</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl py-2 px-3">
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Streak</p>
                <p className="text-xs font-black text-emerald-400 italic">🔥 {member.streakCount || 0}</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl py-2 px-3">
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Rank</p>
                <p className="text-xs font-black text-primary italic">#{member.rank || '??'}</p>
            </div>
        </div>
      </div>
    </div>
  );
}
