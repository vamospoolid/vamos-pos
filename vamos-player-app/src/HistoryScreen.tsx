import { useState, useEffect } from 'react';
import { Receipt, Clock, CreditCard, ChevronRight, AlertCircle, CheckCircle2, DollarSign, ArrowLeft } from 'lucide-react';
import { api } from './api';

export function HistoryScreen({ member, onBack }: { member: any, onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'history' | 'debts'>('history');
  const [sessions, setSessions] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sessionRes, debtRes] = await Promise.all([
          api.get(`/player/${member.id}/transactions`),
          api.get(`/player/${member.id}/unpaid-bills`)
        ]);
        if (sessionRes.data.success) setSessions(sessionRes.data.data);
        if (debtRes.data.success) setDebts(debtRes.data.data);
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
      <div className="flex bg-[#101423] p-2 rounded-[28px] border border-white/5">
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest italic transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
        >
          SESSION HISTORY
        </button>
        <button 
          onClick={() => setActiveTab('debts')}
          className={`flex-1 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest italic transition-all relative ${activeTab === 'debts' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
        >
          UNPAID BILLS (BON)
          {debts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#101423] animate-bounce">
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
