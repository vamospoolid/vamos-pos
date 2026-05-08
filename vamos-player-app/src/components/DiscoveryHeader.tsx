import { Bell, Settings, Search, SlidersHorizontal } from 'lucide-react';
import { getAvatarUrl } from '../api';

interface DiscoveryHeaderProps {
  member: any;
}

export function DiscoveryHeader({ member }: DiscoveryHeaderProps) {
  return (
    <div className="flex flex-col gap-6 pt-4 pb-2 fade-in">
      {/* Top Profile Row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1a1f35] p-0.5 border border-white/10 shadow-lg overflow-hidden relative">
            {member.photo ? (
              <img 
                src={getAvatarUrl(member.photo)!} 
                alt="" 
                className="w-full h-full rounded-[14px] object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="text-primary font-black text-lg">{member.name?.[0]}</span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-sm font-black text-white italic uppercase tracking-tighter leading-none">
              VAMOS <span className="text-primary">DISCOVERY</span>
            </h2>
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1 italic">Find your next match</p>
          </div>
        </div>
        
        <div className="flex gap-2.5">
          <button className="w-11 h-11 rounded-2xl bg-[#1a1f35]/50 flex items-center justify-center border border-white/5 text-slate-400 active:scale-95 transition-all">
            <Settings className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <button className="w-11 h-11 rounded-2xl bg-[#1a1f35]/50 flex items-center justify-center border border-white/5 text-slate-400 active:scale-95 transition-all relative">
            <Bell className="w-5 h-5" strokeWidth={2.5} />
            <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full border-2 border-[#070b14] animate-pulse" />
          </button>
        </div>
      </div>

      {/* Search Discovery Bar */}
      <div className="relative group">
        <div className="fiery-search-container flex items-center px-5 py-4 rounded-[22px] gap-4">
          <Search className="w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" strokeWidth={3} />
          <input 
            type="text" 
            placeholder="Browse games near you" 
            className="bg-transparent border-none focus:outline-none w-full text-sm font-black text-white placeholder:text-slate-600 italic uppercase"
          />
          <button className="text-slate-500 hover:text-white transition-colors">
            <SlidersHorizontal className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
