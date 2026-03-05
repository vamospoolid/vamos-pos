import { useEffect } from 'react';
import { Trophy, X, Zap, ArrowRight, Swords } from 'lucide-react';

interface VictoryNotificationProps {
    challenge: any;
    currentMemberId: string;
    onClose: () => void;
}

export function VictoryNotification({ challenge, currentMemberId, onClose }: VictoryNotificationProps) {
    const isWinner = challenge.winnerId === currentMemberId;
    const opponent = challenge.challengerId === currentMemberId ? challenge.opponent : challenge.challenger;
    const stake = challenge.pointsStake || 0;

    // Auto-close after 10 seconds
    useEffect(() => {
        const timer = setTimeout(onClose, 10000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-x-6 top-10 z-[10000] animate-bounce-in max-w-lg mx-auto">
            <div className={`relative overflow-hidden rounded-[40px] border-2 p-8 shadow-[0_0_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl ${isWinner ? 'border-emerald-500/40 bg-[#0a0d18]/95' : 'border-rose-500/40 bg-[#0a0d18]/95'
                }`}>
                {/* Background Tactical Glows */}
                <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-30 ${isWinner ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] opacity-20" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2.5 rounded-2xl bg-white/5 text-slate-500 hover:text-white transition-all active:scale-90 border border-white/5"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-8 relative z-10">
                    <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center shrink-0 border-2 relative ${isWinner ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
                        }`}>
                        {isWinner ? <Trophy className="w-10 h-10" strokeWidth={2.5} /> : <Swords className="w-10 h-10" strokeWidth={2.5} />}
                        <div className={`absolute inset-0 rounded-[28px] animate-pulse ${isWinner ? 'bg-emerald-500/5' : 'bg-rose-500/5'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 italic ${isWinner ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isWinner ? 'Tactical Supremacy' : 'Combat Deficiency'}
                        </p>
                        <h3 className="text-3xl font-black text-white leading-none uppercase italic tracking-tighter mb-2">
                            {isWinner ? 'VICTORY' : 'DEFEATED'}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase italic opacity-60">TARGET:</span>
                            <span className="text-xs font-black text-white uppercase italic tracking-widest">{opponent?.name || 'UNKNOWN OPERATIVE'}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-between bg-[#101423]/60 rounded-[32px] p-6 border border-white/5 relative z-10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                    <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Zap className="w-5 h-5 text-primary" fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mb-1 italic">CURRENCY YIELD</p>
                            <p className={`text-xl font-black italic tracking-tighter ${isWinner ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isWinner ? `+${stake}` : `-${stake}`} <span className="text-[10px] text-slate-500">PTS</span>
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mb-1 italic">XP REWARD</p>
                        <p className="text-xl font-black text-white italic tracking-tighter">
                            +{isWinner ? 100 + stake : 20} <span className="text-[10px] text-slate-500">XP</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full py-4 rounded-[24px] bg-white/5 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:text-white transition-all border border-white/5 active:scale-95 italic"
                >
                    Dismiss Intelligence <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
