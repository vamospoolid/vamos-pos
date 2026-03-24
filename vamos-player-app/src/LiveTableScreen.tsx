import { useState, useEffect } from 'react';
import { api } from './api';
import { TableCard } from './components/TableCard';
import { useAppStore } from './store/appStore';
import { Lock, Signal } from 'lucide-react';

export function LiveTableScreen({ member }: { member: any }) {
  const [tables, setTables] = useState<any[]>([]);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await api.get('/player/tables');
        if (res.data.success) setTables(res.data.data);
      } catch (err) {}
    };
    fetchTables();
    const interval = setInterval(fetchTables, 15000);
    return () => clearInterval(interval);
  }, []);

  const isRestricted = member.tier === 'BRONZE' || !member.tier;

  if (isRestricted) {
    return (
      <div className="fade-in flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-24 h-24 rounded-[40px] bg-rose-500/10 flex items-center justify-center mb-10 border-2 border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.2)]">
          <Lock className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Akses Terbatas</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-xs">
          Fitur <span className="text-primary italic">Live Table Monitoring</span> hanya tersedia untuk Member <span className="text-primary italic">Silver</span> dan di atasnya.
        </p>
        <button 
          onClick={() => useAppStore.getState().setActiveTab('rewards')}
          className="mt-12 py-5 px-10 fiery-btn-primary text-[10px] font-black uppercase tracking-widest rounded-3xl"
        >
          Upgrade Member Rank
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-10 pb-40">
      <div className="pt-8 relative">
        <div className="absolute top-0 left-0 w-32 h-16 bg-primary/10 blur-[40px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
            LIVE <span className="text-primary">ARENA</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic opacity-60">Real-time Table Status Surveillance</p>
        </div>
      </div>

      <div className="fiery-card p-8 bg-primary/5 border-2 border-primary/20 flex items-center justify-between overflow-hidden relative group">
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/10 rounded-full blur-[40px]" />
        <div className="flex items-center gap-6 relative z-10">
           <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Signal className="w-7 h-7 text-primary animate-pulse" />
           </div>
           <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1 italic">Surveillance Status</p>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Global Arena Live</h3>
           </div>
        </div>
        <div className="px-5 py-2 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
           <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">{tables.length} Nodes Online</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {tables.map(table => (
            <TableCard 
              key={table.id}
              tableId={table.id}
              name={table.name}
              type={table.type}
              status={table.status}
              isKingTable={table.isKingTable}
              kingInfo={table.kingInfo}
              session={table.session}
              onClick={() => useAppStore.getState().setActiveTab('booking')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
