import { motion } from 'framer-motion';
import { Swords, Trophy, X } from 'lucide-react';

interface RivalComparisonProps {
  currentUser: any;
  rival: any;
  stats: any;
  onClose: () => void;
}

export function RivalComparison({ currentUser, rival, stats, onClose }: RivalComparisonProps) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-[#0a0d18]/95 backdrop-blur-2xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-sm fiery-card rounded-[40px] p-8 border-2 border-primary/20 overflow-hidden shadow-[0_0_100px_rgba(31,34,255,0.2)]"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div className="flex justify-between items-center mb-10 relative z-10">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">H2H PROTOCOL</span>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white border border-white/5 active:scale-90 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Rivalry Header */}
        <div className="flex items-center justify-between gap-4 mb-10 relative z-10">
          <div className="flex-1 text-center">
            <div className="w-20 h-20 rounded-[28px] bg-[#1a1f35] mb-3 mx-auto overflow-hidden border-2 border-white/5 shadow-xl relative group">
                {currentUser.photo ? <img src={currentUser.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600 font-black italic">YOU</div>}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[9px] font-black text-white uppercase italic truncate">{currentUser.name.split(' ')[0]}</p>
          </div>

          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary fiery-glow z-10 backdrop-blur-md">
            <Swords size={20} />
          </div>

          <div className="flex-1 text-center">
            <div className="w-20 h-20 rounded-[28px] bg-[#1a1f35] mb-3 mx-auto overflow-hidden border-2 border-white/5 shadow-xl relative group">
                {rival.photo ? <img src={rival.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600 font-black italic">{rival.name?.[0]}</div>}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[9px] font-black text-white uppercase italic truncate">{(rival.name || '').split(' ')[0]}</p>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8 relative z-10">
          <div className="bg-[#101423] rounded-[24px] p-4 border border-white/5 text-center">
             <p className="text-[8px] font-black text-slate-600 uppercase mb-1 italic">Win/Loss Ratio</p>
             <p className="text-2xl font-black text-white italic tracking-tighter">
                <span className="text-emerald-500">{stats.playerAWins}</span>
                <span className="text-slate-700 mx-1">/</span>
                <span className="text-rose-500">{stats.playerBWins}</span>
             </p>
          </div>
          <div className="bg-[#101423] rounded-[24px] p-4 border border-white/5 text-center">
             <p className="text-[8px] font-black text-slate-600 uppercase mb-1 italic">Stakes Exchanged</p>
             <p className="text-2xl font-black text-amber-500 italic tracking-tighter">
                {stats.totalStake}<span className="text-[10px] text-slate-600 ml-1">PSS</span>
             </p>
          </div>
        </div>

        {/* Last Matches Feed */}
        <div className="space-y-3 mb-10 relative z-10">
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic mb-2">Engagements History</p>
          {stats.lastMatches && stats.lastMatches.length > 0 ? stats.lastMatches.map((m: any, idx: number) => (
            <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${m.winnerId === currentUser.id ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                     {m.winnerId === currentUser.id ? <Trophy size={12} /> : <X size={12} />}
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-white italic">{m.winnerId === currentUser.id ? 'VICTORY' : 'DEFEAT'}</p>
                     <p className="text-[8px] text-slate-600 font-bold uppercase">{new Date(m.date).toLocaleDateString()}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-white italic tracking-widest">{m.score}</p>
                  <p className="text-[8px] text-amber-600 font-black uppercase italic">+{m.stake} PSS</p>
               </div>
            </div>
          )) : (
            <div className="py-8 text-center bg-white/5 rounded-[24px] border border-dashed border-white/10 italic">
               <p className="text-[9px] font-black text-slate-700 uppercase">No prior data records.</p>
            </div>
          )}
        </div>

        <button 
          onClick={onClose} 
          className="w-full py-5 fiery-btn-secondary rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] italic relative z-10"
        >
          DISMISS PROTOCOL
        </button>
      </motion.div>
    </div>
  );
}
