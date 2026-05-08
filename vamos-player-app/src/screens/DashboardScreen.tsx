import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { api } from '../api';
import { useAppStore } from '../store/appStore';
import { DiscoveryHeader } from '../components/DiscoveryHeader';
import { FeaturedBookingCard } from '../components/FeaturedBookingCard';
import { VerificationCard } from '../components/VerificationCard';
import { QuickBooking } from '../components/QuickBooking';
import { TierCard } from '../components/TierCard';
import { QuestCard } from '../components/QuestCard';
import { DashboardSkeleton } from '../components/Skeleton';

export function DashboardScreen({ member, tournaments = [], venueInfo, loading }: { member: any, tournaments?: any[], venueInfo: any, loading?: boolean }) {
  const [quests, setQuests] = useState<any[]>([]);
  const { setActiveTab, setSelectedTournament, addToast, refreshMemberData } = useAppStore();

  useEffect(() => {
    if (member?.id) {
        api.get(`/player/${member.id}/quests`)
           .then(res => setQuests(res.data.data || []))
           .catch(err => console.error("Quest fetch error:", err));
    }
  }, [member?.id]);

  const handleClaimQuest = async (memberQuestId: string) => {
    try {
        const res = await api.post(`/player/${member.id}/quests/${memberQuestId}/claim`);
        if (res.data.success) {
            addToast({ title: 'PROTOCOL SYNC', message: `Reward claimed! +${res.data.data.xp} XP added.`, type: 'success' });
            refreshMemberData();
            // Refresh local quests
            setQuests(prev => prev.map(q => q.id === memberQuestId ? { ...q, isClaimed: true } : q));
        }
    } catch (err: any) {
        addToast({ title: 'CLAIM FAILED', message: err.response?.data?.message || "Sync error.", type: 'error' });
    }
  };

  if (loading) return <DashboardSkeleton />;

  // Transform backend MemberQuest to UI Quest format
  const formattedQuests = quests.map(mq => ({
    id: mq.id,
    title: mq.quest.title,
    desc: mq.quest.description,
    reward: mq.quest.rewardXp,
    progress: mq.currentValue,
    target: mq.quest.targetValue,
    isClaimed: mq.isClaimed
  }));

  return (
    <div className="fade-in space-y-6 pb-32">
      {/* ─── NEW DISCOVERY HEADER ─── */}
      <DiscoveryHeader member={member} />

      <TierCard member={member} />


      {/* ─── QUICK BOOKING (Visible Immediately) ─── */}
      <QuickBooking />

      {/* ─── DAILY QUESTS ─── */}
      <QuestCard 
        quests={formattedQuests} 
        onClaim={handleClaimQuest} 
      />

      {/* ─── ONGOING EVENTS ─── */}
      <div className="space-y-6">
         <div className="flex justify-between items-end px-2">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic mb-1">Live Arena</p>
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Ongoing Events</h3>
            </div>
            <button 
              onClick={() => setActiveTab('tournaments')}
              className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              See All
              <ChevronRight className="w-3 h-3" />
            </button>
         </div>

         {/* Mapping Tournaments to Premium Cards */}
         <div className="flex overflow-x-auto snap-x gap-4 hide-scrollbar pb-4 items-stretch">
         {tournaments.length > 0 ? tournaments.map((t: any, i: number) => (
            <div key={t.id || i} className="min-w-[88%] lg:min-w-[80%] snap-center shrink-0 w-full flex flex-col space-y-3">
              <FeaturedBookingCard 
                title={t.name}
                location={venueInfo?.name || "Vamos Arena"}
                prizePool={t.prizePool ? `RP ${(t.prizePool/1000).toLocaleString()}K` : undefined}
                entryFee={t.entryFee ? `RP ${(t.entryFee/1000).toLocaleString()}K` : "FREE"}
                players={`${t.participants?.length || 0}/${t.maxPlayers || 32}`}
                status={t.status === 'ONGOING' ? 'Open' : 'Private'}
                startsIn={t.status === 'ONGOING' ? "3h" : undefined}
                isPremium={i === 0}
                onJoin={() => { setSelectedTournament(t); setActiveTab('tournaments'); }}
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
         )) : (
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
                 onJoin={() => { setSelectedTournament(null); setActiveTab('tournaments'); }}
               />
            </div>
         )}
         </div>
      </div>

      <div className="pt-4">
         <VerificationCard member={member} venueInfo={venueInfo} />
      </div>
    </div>
  );
}
