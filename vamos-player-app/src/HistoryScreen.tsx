import { useState, useEffect } from 'react';
import { Receipt, Clock, CreditCard, ChevronRight, AlertCircle, CheckCircle2, DollarSign, ArrowLeft, Swords, Trophy } from 'lucide-react';
import { api } from './api';

export function HistoryScreen({ member, onBack }: { member: any, onBack: () => void }) {
   const [activeTab, setActiveTab] = useState<'history' | 'debts' | 'matches'>('history');
   const [sessions, setSessions] = useState<any[]>([]);
   const [debts, setDebts] = useState<any[]>([]);
   const [matches, setMatches] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sessionRes, debtRes, matchRes] = await Promise.all([
          api.get(`/player/${member.id}/transactions`),
          api.get(`/player/${member.id}/unpaid-bills`),
          api.get(`/player/${member.id}/history`)
        ]);
        if (sessionRes.data.success) setSessions(sessionRes.data.data);
        if (debtRes.data.success) setDebts(debtRes.data.data);
        if (matchRes.data.success) setMatches(matchRes.data.data);
      } catch (err) {}
      setLoading(false);
    };
    fetchData();
  }, [member.id]);

  return (
    <div className="fade-in space-y-8 pb-40">
      <div className="pt-8 flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
            <ArrowLeft size={20} className="text-white" />
        </button>
        <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
            LEDGER <span className="text-primary">&</span> HISTORY
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1 italic opacity-60">Financial Protocol & Session Records</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#101423] p-1.5 rounded-[28px] border border-white/5 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 min-w-[100px] py-3.5 rounded-[22px] text-[9px] font-black uppercase tracking-widest italic transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
        >
          SESSIONS
        </button>
        <button 
          onClick={() => setActiveTab('matches')}
          className={`flex-1 min-w-[100px] py-3.5 rounded-[22px] text-[9px] font-black uppercase tracking-widest italic transition-all ${activeTab === 'matches' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
        >
          ARENA MATCH
        </button>
        <button 
          onClick={() => setActiveTab('debts')}
          className={`flex-1 min-w-[100px] py-3.5 rounded-[22px] text-[9px] font-black uppercase tracking-widest italic transition-all relative ${activeTab === 'debts' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
        >
          UNPAID
          {debts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-[#101423]">
                {debts.length}
              </span>
          )}
        </button>
      </div>

      {loading ? (
          <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Syncing with server...</p>
          </div>
      ) : activeTab === 'history' ? (
        <div className="space-y-4">
            {sessions.length > 0 ? (
                sessions.map(session => (
                    <div key={session.id} className="fiery-card p-6 bg-white/5 border border-white/5 hover:border-primary/20 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#0a0d18] flex items-center justify-center border border-white/5 group-hover:border-primary/20">
                                    <Receipt size={24} className="text-slate-500 group-hover:text-primary transition-all" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{new Date(session.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">{session.table?.name || 'FNB ONLY'}</h4>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-emerald-400 font-mono tracking-tighter">RP {session.totalAmount.toLocaleString()}</p>
                                <div className="flex items-center gap-1 justify-end mt-1">
                                    <CheckCircle2 size={10} className="text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-500/60 uppercase italic">PAID</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <Clock size={12} className="text-slate-600" />
                                <span className="text-[10px] font-black text-slate-500 uppercase italic">
                                    {session.durationOpts ? `${session.durationOpts}m` : 'OPEN TIME'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                                <CreditCard size={12} className="text-slate-600" />
                                <span className="text-[10px] font-black text-slate-500 uppercase italic">
                                    {session.paymentMethod || 'CASH'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="fiery-card p-20 text-center border-2 border-dashed border-white/5 bg-[#1a1f35]/10 italic">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No transaction history found.</p>
                </div>
            )}
        </div>
      ) : activeTab === 'matches' ? (
        <div className="space-y-4">
            {matches.length > 0 ? (
                matches.map(match => (
                    <div key={match.id} className={`glass-card-deep p-6 border-2 transition-all relative overflow-hidden group ${match.isWinner ? 'border-primary/30 bg-gradient-to-br from-primary/10 to-transparent' : 'border-white/5 bg-white/[0.01]'}`}>
                        
                        {/* Elite Shimmer & Breathing Light Indicator */}
                        {match.isWinner && <div className="elite-shimmer opacity-40" />}
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${match.isWinner ? 'bg-primary animate-breathing shadow-[0_0_15px_rgba(255,87,34,0.5)]' : 'bg-slate-800'} z-20`} />
                        
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${match.isWinner ? 'bg-primary/10 border-primary/40 shadow-[0_0_40px_rgba(255,87,34,0.2)]' : 'bg-slate-800/40 border-white/5'}`}>
                                    <Swords size={26} className={match.isWinner ? 'text-primary drop-shadow-[0_0_10px_rgba(255,87,34,0.5)]' : 'text-slate-600'} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic mb-1.5 opacity-60">
                                        {new Date(match.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} • {match.tournamentName || 'ARENA PROTOCOL'}
                                    </p>
                                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none group-hover:text-primary transition-colors">
                                        VS {match.opponentName}
                                    </h4>
                                </div>
                            </div>
                            <div className="text-right">
                                {match.isWinner ? (
                                    <div className="relative group/badge">
                                        {/* Premium Championship Emblem Style */}
                                        <div className="absolute -inset-1 bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative bg-gradient-to-b from-[#00d184] via-[#00a368] to-[#00704a] text-[#070b14] px-6 py-2.5 rounded-xl text-[11px] font-black uppercase italic tracking-[0.25em] shadow-[0_15px_35px_rgba(0,209,132,0.3)] border-x border-t border-white/20 border-b-4 border-emerald-950 flex items-center gap-3">
                                            <Trophy className="w-4 h-4 text-emerald-950" fill="currentColor" />
                                            VICTORY
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-[#0a0d18] border border-white/5 text-slate-700 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase italic tracking-widest opacity-40">
                                        DEFEAT
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-5 border-t border-white/5 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${match.isWinner ? 'bg-primary' : 'bg-slate-800'}`} />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{match.type || 'RANKED PIT'}</p>
                            </div>
                            
                            {/* Technical Result Box */}
                            <div className="bg-[#0a0f1d] border border-white/5 rounded-2xl px-6 py-3 flex items-center gap-6 shadow-inner">
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">SCORES</p>
                                    <div className="flex items-center font-black italic tracking-tighter leading-none">
                                        <span className={match.isWinner ? 'text-emerald-400 text-3xl' : 'text-white text-2xl'}>{match.myScore}</span>
                                        <span className="text-slate-800 mx-3 text-xl">—</span>
                                        <span className="text-slate-500 text-2xl">{match.opponentScore}</span>
                                    </div>
                                </div>
                                {match.isWinner && (
                                    <div className="w-px h-8 bg-white/5 mx-1" />
                                )}
                                {match.isWinner && (
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1 italic">STATUS</p>
                                        <div className="text-[10px] font-black text-emerald-500 italic uppercase">WINNER</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="fiery-card p-20 text-center border-2 border-dashed border-white/5 bg-[#1a1f35]/10 italic">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No match records found.</p>
                </div>
            )}
        </div>
      ) : (
        <div className="space-y-4">
            {debts.length > 0 ? (
                debts.map(debt => (
                    <div key={debt.id} className="fiery-card p-8 bg-red-500/5 border-2 border-red-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <AlertCircle size={80} className="text-red-500" />
                        </div>
                        
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <div className="px-2 py-1 rounded bg-red-500/20 border border-red-500/30 inline-flex items-center gap-1.5 mb-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest italic">AWAITING PAYMENT</span>
                                </div>
                                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                    {debt.session?.table?.name || 'FNB ORDER'}
                                </h4>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">
                                    {new Date(debt.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 italic">DUE AMOUNT</p>
                                <p className="text-2xl font-black text-white font-mono tracking-tighter">RP {debt.amount.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-[#0a0d18] p-4 rounded-2xl border border-white/5 relative z-10">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-2 italic">DESCRIPTION</p>
                            <p className="text-xs font-medium text-white/80 leading-relaxed italic">{debt.description}</p>
                        </div>

                        <div className="mt-6 flex items-center justify-between relative z-10">
                             <div className="flex items-center gap-2">
                                 <DollarSign size={14} className="text-red-500" />
                                 <span className="text-[10px] font-black text-white/40 uppercase italic tracking-widest">Pay at Cashier</span>
                             </div>
                             <ChevronRight className="text-white/20" />
                        </div>
                    </div>
                ))
            ) : (
                <div className="fiery-card p-20 text-center border-2 border-emerald-500/10 bg-emerald-500/5 italic">
                    <CheckCircle2 size={40} className="text-emerald-500/20 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">ALL CLEAR. NO OUTSTANDING DEBTS.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
