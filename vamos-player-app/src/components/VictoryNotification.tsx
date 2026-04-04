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
        <div className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-[10000] animate-bounce-in max-w-lg mx-auto">
            <div className={`relative overflow-hidden rounded-[40px] border-y-2 p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl ${isWinner ? 'border-emerald-500/40 bg-[#06100d]/95' : 'border-rose-900/40 bg-[#0a0d18]/95'
                }`}>
                {/* Background Tactical Glows */}
                <div className={`absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[120px] opacity-40 ${isWinner ? 'bg-emerald-500' : 'bg-rose-700'
                    }`} />
                <div className={`absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[100px] opacity-30 ${isWinner ? 'bg-[#00d184]' : 'bg-[#0a0d18]'}`} />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute top-6 right-6 p-2.5 rounded-2xl bg-white/5 text-slate-500 hover:text-white transition-all active:scale-95 border border-white/10 z-[10001] cursor-pointer"
                    aria-label="Close"
                >
                    <X className="w-5 h-5 pointer-events-none" />
                </button>

                <div className="text-center relative z-10 mt-6">
                    <div className={`mx-auto w-32 h-32 rounded-[2.5rem] flex items-center justify-center shrink-0 border-2 relative mb-8 transition-transform duration-700 hover:scale-110 ${isWinner ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.3)]' : 'bg-rose-500/10 text-rose-500 border-rose-500/30 shadow-[0_0_60px_rgba(244,63,94,0.15)]'
                        }`}>
                        {isWinner ? <Trophy className="w-16 h-16 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" strokeWidth={2.5} /> : <SkullIcon className="w-16 h-16 opacity-80 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />}
                        <div className={`absolute inset-0 rounded-[2.5rem] animate-ping opacity-20 ${isWinner ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </div>

                    <p className={`text-[11px] font-black uppercase tracking-[0.5em] mb-2 italic ${isWinner ? 'text-emerald-400' : 'text-rose-500/80'}`}>
                        {isWinner ? 'CHAMPION PROTOCOL' : 'STEALTH DEFEAT PROTOCOL'}
                    </p>
                    <h3 className={`text-6xl font-black leading-none uppercase italic tracking-tighter mb-6 ${isWinner ? 'text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-200 to-emerald-600 filter drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-rose-100 opacity-90'}`}>
                        {isWinner ? 'VICTORY' : 'DEFEAT'}
                    </h3>
                    
                    <div className="inline-flex items-center gap-5 bg-black/40 px-6 py-3 rounded-2xl border border-white/5 mb-10 shadow-inner">
                        <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-widest">VS</span>
                        <span className="text-base font-black text-white uppercase italic tracking-widest">{opponent?.name || 'UNKNOWN OPERATIVE'}</span>
                    </div>
                </div>

                <div className={`flex items-center justify-between rounded-[32px] p-6 border relative z-10 overflow-hidden ${isWinner ? 'bg-[#0a0f1d] border-emerald-500/20 shadow-[inset_0_0_30px_rgba(16,185,129,0.1)]' : 'bg-[#101423]/60 border-white/5'}`}>
                    <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isWinner ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/10'}`}>
                            <Flame className={`w-6 h-6 ${isWinner ? 'text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'text-slate-500'}`} fill="currentColor" />
                        </div>
                        <div className="text-left">
                            <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-[0.3em] mb-1 italic">XP GAINED</p>
                            <p className={`text-3xl font-black italic tracking-tighter leading-none ${isWinner ? 'text-white' : 'text-slate-400'}`}>
                                +{xpReward} <span className="text-xs text-slate-600">XP</span>
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-[0.3em] mb-2 italic">BILLING STATUS</p>
                        <span className={`text-[10px] px-4 py-2 rounded-xl font-black italic tracking-widest uppercase ${challenge.isFightForTable ? (isWinner ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/20 text-rose-400 border border-rose-500/20') : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                            {challenge.isFightForTable ? (isWinner ? 'CLEARED' : 'TRANSFERRED') : 'UNCHANGED'}
                        </span>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={onClose}
                        className="w-full py-5 rounded-[28px] bg-white/5 hover:bg-white/10 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all border border-white/10 active:scale-95 italic"
                    >
                        Dismiss Report <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
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
