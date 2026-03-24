import { useEffect } from 'react';
import { Trophy, X, ArrowRight, Flame } from 'lucide-react';

interface VictoryNotificationProps {
    challenge: any;
    currentMemberId: string;
    onClose: () => void;
}

export function VictoryNotification({ challenge, currentMemberId, onClose }: VictoryNotificationProps) {
    const isWinner = challenge.winnerId === currentMemberId;
    const opponent = challenge.challengerId === currentMemberId ? challenge.opponent : challenge.challenger;
    
    // XP Rewards as defined in backend: Win 100, Loss 20
    const xpReward = isWinner ? 100 : 20;

    // Auto-close after 10 seconds
    useEffect(() => {
        const timer = setTimeout(onClose, 12000);
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
                        {isWinner ? <Trophy className="w-10 h-10" strokeWidth={2.5} /> : <SkullIcon className="w-10 h-10" />}
                        <div className={`absolute inset-0 rounded-[28px] animate-pulse ${isWinner ? 'bg-emerald-500/5' : 'bg-rose-500/5'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 italic ${isWinner ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isWinner ? 'Protocol: Victory' : 'Protocol: Defeat'}
                        </p>
                        <h3 className="text-3xl font-black text-white leading-none uppercase italic tracking-tighter mb-2">
                            {isWinner ? 'WON' : 'LOST'}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase italic opacity-60">OPPONENT:</span>
                            <span className="text-xs font-black text-white uppercase italic tracking-widest">{opponent?.name || 'UNKNOWN OPERATIVE'}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-between bg-[#101423]/60 rounded-[32px] p-6 border border-white/5 relative z-10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                    <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <Flame className="w-5 h-5 text-orange-500" fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mb-1 italic">XP GAINED</p>
                            <p className={`text-xl font-black italic tracking-tighter text-white`}>
                                +{xpReward} <span className="text-[10px] text-slate-500">XP</span>
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mb-1 italic">BILLING STATUS</p>
                        <p className="text-sm font-black text-slate-400 italic tracking-tighter">
                            {challenge.isFightForTable ? (isWinner ? 'CLEARED' : 'TRANSFERRED') : 'UNCHANGED'}
                        </p>
                    </div>
                </div>

                <div className="mt-4 px-4">
                    <p className="text-[8px] text-center text-slate-600 font-bold uppercase tracking-[0.2em] leading-relaxed">
                        Match verification complete. Combat records updated in central server.
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full py-4 rounded-[24px] bg-white/5 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:text-white transition-all border border-white/5 active:scale-95 italic"
                >
                    Dismiss Report <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function SkullIcon({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M9 10L9.01 10" />
            <path d="M15 10L15.01 10" />
            <path d="M10 20C8.89543 20 8 19.1046 8 18V17C8 15.8954 8.89543 15 10 15H14C15.1046 15 16 15.8954 16 17V18C16 19.1046 15.1046 20 14 20H10Z" />
            <path d="M12 2C7.02944 2 3 6.02944 3 11V14C3 15.6569 4.34315 17 6 17V17C7.65685 17 9 15.6569 9 14V11C9 9.34315 10.3431 8 12 8V8C13.6569 8 15 9.34315 15 11V14C15 15.6569 16.3431 17 18 17V17C19.6569 17 21 15.6569 21 14V11C21 6.02944 16.9706 2 12 2Z" />
        </svg>
    )
}
