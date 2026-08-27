import { ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/appStore';

import { FeaturedBookingCard } from '../components/FeaturedBookingCard';
import { VerificationCard } from '../components/VerificationCard';
import { PackagePromoCard } from '../components/PackagePromoCard';
import { ActiveSessionBanner } from '../components/ActiveSessionBanner';
import { MyMatchTrackerCard } from '../components/MyMatchTrackerCard';
import { TierCard } from '../components/TierCard';
import { DashboardSkeleton } from '../components/Skeleton';

export function DashboardScreen({ member, tournaments = [], venueInfo, loading }: { member: any, tournaments?: any[], venueInfo: any, loading?: boolean }) {
  const { setActiveTab, setSelectedTournament, setTournamentInitialView } = useAppStore();

  const handleOpenTournament = (t: any, view: 'info' | 'bracket' = 'info') => {
    setSelectedTournament(t);
    setTournamentInitialView(view);
    setActiveTab('tournaments');
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="fade-in space-y-6 pb-10">

      <TierCard member={member} />

      {/* ─── MY LIVE & NEXT TOURNAMENT MATCH TRACKER ─── */}
      <MyMatchTrackerCard 
        member={member} 
        tournaments={tournaments} 
        onOpenBracket={(t) => handleOpenTournament(t, 'bracket')} 
      />

      {/* ─── ACTIVE SESSION BANNER (Di bawah Level, muncul jika ada sesi aktif) ─── */}
      <ActiveSessionBanner />

      {/* ─── BOOKING PAKET PROMO ─── */}
      <PackagePromoCard />


      {/* ─── ONGOING EVENTS ─── */}
      <div className="space-y-4">
         <div className="flex justify-between items-end px-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">Live Arena</p>
                {tournaments.length > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[8px] font-black uppercase italic">
                    {tournaments.length} Event
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Ongoing Events</h3>
            </div>
            <button 
              onClick={() => setActiveTab('tournaments')}
              className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2"
            >
            Lihat Semua
              <ChevronRight className="w-3 h-3" />
            </button>
         </div>

         {/* Multi-Tournament Quick Selector Pills */}
         {tournaments.length > 1 && (
           <div className="flex gap-2 overflow-x-auto hide-scrollbar px-1 py-0.5">
             {tournaments.map((t: any, idx: number) => {
               const dateStr = t.startDate ? new Date(t.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '';
               return (
                 <button
                   key={t.id || idx}
                   onClick={() => {
                     const el = document.getElementById(`tourney-card-${idx}`);
                     el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                   }}
                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-[9px] font-black uppercase italic tracking-wider transition-all whitespace-nowrap active:scale-95 shrink-0"
                 >
                   <span className="text-cyan-400 font-extrabold">{idx + 1}.</span>
                   <span className="text-white truncate max-w-[140px]">{t.name}</span>
                   {dateStr && <span className="text-slate-400 text-[8px]">({dateStr})</span>}
                 </button>
               );
             })}
           </div>
         )}

         {/* Mapping Tournaments to Premium Cards */}
         <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 hide-scrollbar pb-2 items-stretch">
         {tournaments.length > 0 ? tournaments.map((t: any, i: number) => {
            const formattedDate = t.startDate 
              ? new Date(t.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) 
              : undefined;
            return (
            <div 
              key={t.id || i} 
              id={`tourney-card-${i}`}
              className="min-w-[88%] lg:min-w-[80%] snap-center shrink-0 w-full flex flex-col space-y-3"
            >
              <FeaturedBookingCard 
                title={t.name}
                location={venueInfo?.name || "Vamos Arena"}
                prizePool={t.prizePool ? `RP ${(t.prizePool/1000).toLocaleString()}K` : undefined}
                entryFee={t.entryFee ? `RP ${(t.entryFee/1000).toLocaleString()}K` : "FREE"}
                players={`${t.participants?.length || 0}/${t.maxPlayers || 32}`}
                status={t.status === 'ONGOING' ? 'Open' : 'Private'}
                startsIn={t.status === 'ONGOING' ? "3h" : undefined}
                date={formattedDate}
                isPremium={i === 0}
                onJoin={() => handleOpenTournament(t, 'info')}
                onViewBracket={() => handleOpenTournament(t, 'bracket')}
              />
              {(t.name || '').toLowerCase().includes('arisan') && t.participants?.length > 0 && (
                <div className="bg-[#1a1f35]/50 border border-white/5 p-4 rounded-3xl group animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <p className="text-[9px] font-black text-primary uppercase italic tracking-[0.2em]">Live Participants</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase italic">{t.participants.length} Active</p>
                  </div>
                  <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
                    {t.participants.slice(0, 9).map((p: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1 opacity-80 overflow-hidden">
                         <span className="text-[7px] font-black text-slate-700 w-2.5 shrink-0">{idx + 1}</span>
                         <span className="text-[9px] font-black text-slate-300 uppercase italic truncate">{(p.name || p.member?.name || '...').split(' ')[0]}</span>
                         {p.handicap && <span className="text-[7px] font-bold text-primary shrink-0">H{p.handicap}</span>}
                      </div>
                    ))}
                    {t.participants.length > 9 && (
                      <div className="flex items-center gap-1 opacity-80">
                         <span className="text-[9px] font-black text-slate-400 italic">+{t.participants.length - 9}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            );
         }) : (
            <div className="min-w-[88%] lg:min-w-[80%] snap-center shrink-0 w-full flex flex-col space-y-3">
               <FeaturedBookingCard 
                 title="Friday Night League"
                 location="Marina Green, 1.8km away"
                 prizePool="RP 5,000K"
                 entryFee="RP 150K"
                 players="12/16"
                 status="Open"
                 startsIn="3hrs"
                 isPremium={true}
                 onJoin={() => handleOpenTournament(null, 'info')}
                 onViewBracket={() => handleOpenTournament(null, 'bracket')}
               />
            </div>
         )}
         </div>

         {/* Swipe hint when there are multiple tournaments */}
         {tournaments.length > 1 && (
           <div className="flex items-center justify-center gap-1.5 pt-1">
             {tournaments.map((_: any, idx: number) => (
               <div key={idx} className={`w-2 h-1.5 rounded-full ${idx === 0 ? 'bg-cyan-400 w-4' : 'bg-white/20'}`} />
             ))}
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider italic ml-2">
               Geser ke samping ({tournaments.length} Event)
             </span>
           </div>
         )}
      </div>

      <div className="pt-4">
         <VerificationCard member={member} venueInfo={venueInfo} />
      </div>
    </div>
  );
}
