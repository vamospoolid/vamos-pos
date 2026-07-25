import { useState, useEffect } from 'react';
import { LayoutGrid, Trophy, Star, User, Swords, ShoppingBag, Zap } from 'lucide-react';
import { api, getAvatarUrl, getSocket } from './api';
import { useAppStore } from './store/appStore';

// Screens
import { DashboardScreen } from './screens/DashboardScreen';
import { PlayScreen } from './PlayScreen';
import { LeaderboardScreen } from './LeaderboardScreen';
import { TournamentScreen } from './screens/TournamentScreen';
import { RewardsScreen } from './RewardsScreen';
import { BookingScreen } from './BookingScreen';
import { ActiveSessionScreen } from './ActiveSessionScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { MenuScreen } from './MenuScreen';
import { StoreScreen } from './StoreScreen';
import { LoginScreen } from './screens/LoginScreen';
import { TrainingScreen } from './screens/TrainingScreen';

// Components
import { VictoryNotification } from './components/VictoryNotification';
import { LevelUpModal } from './components/LevelUpModal';
import { VamosLogo } from './components/VamosLogo';
import { SplashScreen } from './components/SplashScreen';
import { ToastContainer } from './components/Toast';

// Utils
import { haptics } from './utils/haptics';

function MainApp() {
  const { 
    member, setMember, activeTab, setActiveTab, 
    refreshMemberData, toasts, addToast, removeToast,
    venueInfo
  } = useAppStore();
  
  const [tournaments, setTournaments] = useState([]);
  const [leaderboard, setLeaderboard] = useState<{allTime: any[], monthly: any[], activeKings: any[], hallOfFame: any[]}>({allTime: [], monthly: [], activeKings: [], hallOfFame: []});
  const [activeVictory, setActiveVictory] = useState<any>(null);
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const [incomingChallenge, setIncomingChallenge] = useState<any>(null);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  // --- Level Up Detection ---
  useEffect(() => {
    if (!member?.id || !member.level) return;
    
    const lastLevel = parseInt(localStorage.getItem(`lastLevel_${member.id}`) || '0');
    if (lastLevel > 0 && member.level > lastLevel) {
        setShowLevelUp(member.level);
        haptics.victory(); // Physical feedback for promotion
    }
    localStorage.setItem(`lastLevel_${member.id}`, member.level.toString());
  }, [member?.level, member?.id]);

  // --- Check for existing pending challenges on load or data updates ---
  useEffect(() => {
    if (!member) return;
    const pending = member.challengesReceived?.find((c: any) => c.status === 'PENDING');
    if (pending) {
        setIncomingChallenge(pending);
    } else {
        setIncomingChallenge(null);
    }
  }, [member]);

  // --- Real-time Socket Connection ---
  useEffect(() => {
    if (!member?.id) return;

    const socket = getSocket();

    // Global Match Notification (When match is COMPLETED)
    const handleMatchUpdate = (data: any) => {
        refreshMemberData();
        
        // If challenge accepted or victory confirmed
        if (data?.status === 'ACCEPTED' || data?.status === 'COMPLETED') {
            haptics.heavy();
        }
    };

    socket.on(`challenge:update:${member.id}`, handleMatchUpdate);
    socket.on(`challenge:new:${member.id}`, (challenge) => {
        setIncomingChallenge(challenge);
        addToast({
            title: 'WAR PROTOCOL',
            message: `Tantangan Duel Baru dari ${challenge.challenger?.name || 'Rival'}!`,
            type: 'match',
            duration: 15000,
            actionLabel: 'MENU ARENA',
            onAction: () => setActiveTab('play')
        });
        haptics.heavy();
    });

    return () => {
      socket.disconnect();
    };
  }, [member?.id, refreshMemberData, addToast, setActiveTab]);

  const handleRespondToIncoming = async (challengeId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
        const res = await api.put(`/player/challenge/${challengeId}/respond`, { status });
        if (res.data.success) {
            setIncomingChallenge(null);
            refreshMemberData();
            addToast({
                title: status === 'ACCEPTED' ? 'CHALLENGE ACCEPTED' : 'CHALLENGE DECLINED',
                message: status === 'ACCEPTED' ? 'LET THE DUEL BEGIN!' : 'TANTANGAN DITOLAK.',
                type: 'success'
            });
            if (status === 'ACCEPTED') {
                setActiveTab('play');
            }
        }
    } catch (err: any) {
        addToast({
            title: 'RESPONSE FAILED',
            message: err.response?.data?.message || "SYSTEM ERROR",
            type: 'error'
        });
    }
  };

  // --- Victory Notification Logic ---
  useEffect(() => {
    if (!member) return;
    const allMatches = [...(member.challengesSent || []), ...(member.challengesReceived || [])];
    const latestCompleted = allMatches.find(c => c.status === 'COMPLETED');
    
    if (latestCompleted) {
        const notified = JSON.parse(localStorage.getItem('notifiedChallenges') || '[]');
        if (!notified.includes(latestCompleted.id)) {
            setActiveVictory(latestCompleted);
            localStorage.setItem('notifiedChallenges', JSON.stringify([...notified, latestCompleted.id]));
        }
    }
  }, [member]);

  // --- Initial Data Fetch ---
  useEffect(() => {
    setLoadingTournaments(true);
    setLoadingLeaderboard(true);
    
    api.get('/player/tournaments')
      .then(res => setTournaments(res.data.data))
      .catch(() => {})
      .finally(() => setLoadingTournaments(false));
      
    api.get('/player/leaderboard')
      .then(res => setLeaderboard(res.data.data))
      .catch(() => {})
      .finally(() => setLoadingLeaderboard(false));
  }, []);

  // --- Auto Refresh Profile ---
  useEffect(() => {
    if (member?.id) {
      refreshMemberData();
      const interval = setInterval(refreshMemberData, 8000);
      return () => clearInterval(interval);
    }
  }, [member?.id, refreshMemberData]);

  if (!member) return <LoginScreen onLogin={setMember} />;

  return (
    <div className="h-screen bg-[#070b14] text-white flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden border-x border-white/5">
      {/* Global Notifications */}
      {activeVictory && (
        <VictoryNotification 
            challenge={activeVictory} 
            currentMemberId={member.id} 
            onClose={() => setActiveVictory(null)} 
        />
      )}

      {showLevelUp && (
        <LevelUpModal 
            level={showLevelUp} 
            onClose={() => setShowLevelUp(null)} 
        />
      )}
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Global Duel Invitation Modal */}
      {incomingChallenge && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-[#0a0d18]/95 backdrop-blur-2xl" />
          <div className="relative w-full max-w-sm fiery-card rounded-[48px] p-8 border-2 border-primary/40 text-center scale-in overflow-hidden shadow-[0_0_80px_rgba(255,87,34,0.25)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="w-20 h-20 rounded-[28px] bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,87,34,0.15)]">
              <Swords className="w-10 h-10 text-primary animate-pulse" />
            </div>

            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">TANTANGAN DUEL!</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 italic text-center">Protocol pairing detected</p>
            
            <div className="bg-[#101423] border border-white/5 p-5 rounded-[32px] mb-8">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 italic text-center">CHALLENGER</p>
              <h4 className="text-lg font-black text-white uppercase italic truncate">{incomingChallenge.challenger?.name || 'RIVAL PLAYER'}</h4>
              
              <div className="h-px bg-white/5 my-3" />
              
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-slate-500 uppercase italic">STAKE:</span>
                <span className="text-sm font-black text-yellow-400 font-mono italic flex items-center gap-1">
                  <Zap size={14} className="text-yellow-400" />
                  {incomingChallenge.pointsStake || 0} PTS
                </span>
              </div>
              {incomingChallenge.isFightForTable && (
                <div className="flex justify-between items-center px-2 mt-2">
                  <span className="text-[10px] font-black text-primary uppercase italic">FIGHT FOR TABLE:</span>
                  <span className="text-[10px] font-black text-primary uppercase italic">YES</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleRespondToIncoming(incomingChallenge.id, 'ACCEPTED')}
                className="w-full py-4 bg-emerald-500 rounded-2xl text-[11px] font-black uppercase tracking-widest italic text-secondary hover:bg-emerald-400 active:scale-95 transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)]"
              >
                TERIMA TANTANGAN (LAWANKAN)
              </button>
              <button 
                onClick={() => handleRespondToIncoming(incomingChallenge.id, 'DECLINED')}
                className="w-full py-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-[11px] font-black uppercase tracking-widest italic text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all"
              >
                TOLAK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center px-6 pt-10 pb-4 relative z-30">
        <div className="flex items-center gap-3">
            <VamosLogo className="w-10 h-10" glowing />
            <h1 onClick={() => setActiveTab('dashboard')} className="text-xl font-black italic uppercase cursor-pointer leading-none">
                {venueInfo?.name?.split(' ')[0] || "VAMOS"}
                <span className="text-primary italic">{venueInfo?.name?.split(' ')[1] || "POOL"}</span>
            </h1>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-[#101423] p-1.5 rounded-[12px] flex items-center gap-2 border border-white/10">
                <Star className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
                <span className="text-xs font-black text-white">{member.loyaltyPoints ?? 0}</span>
            </div>
            <button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-[14px] bg-[#101423] overflow-hidden border border-white/10">
                {getAvatarUrl(member.photo) ? (
                    <img src={getAvatarUrl(member.photo)!} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-[#1a1f35] flex items-center justify-center text-primary font-black">
                        {member.name?.[0]}
                    </div>
                )}
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-10 relative z-10 scrollbar-hide">
        {activeTab === 'dashboard' && <DashboardScreen member={member} tournaments={tournaments} venueInfo={venueInfo} loading={loadingTournaments} />}
        {activeTab === 'play' && <PlayScreen member={member} />}
        {activeTab === 'leaderboard' && <LeaderboardScreen leaderboard={leaderboard} currentUser={member} loading={loadingLeaderboard} />}
        {activeTab === 'tournaments' && <TournamentScreen activeTournaments={tournaments} member={member} />}
        {activeTab === 'rewards' && <RewardsScreen />}
        {activeTab === 'booking' && <BookingScreen />}
        {activeTab === 'active-session' && <ActiveSessionScreen />}
        {activeTab === 'profile' && <ProfileScreen member={member} onLogout={() => useAppStore.getState().logout()} />}
        {activeTab === 'menu' && <MenuScreen />}
        {activeTab === 'store' && <StoreScreen />}
        {activeTab === 'training' && <TrainingScreen />}
        {activeTab === 'rewards' && <RewardsScreen />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fiery-nav">
        {[
          {id:'dashboard',   icon:LayoutGrid,  label:'Home'},
          {id:'play',        icon:Swords,      label:'Arena'},
          {id:'store',       icon:ShoppingBag, label:'Store'},
          {id:'leaderboard', icon:Trophy,      label:'Ranking'},
          {id:'profile',     icon:User,        label:'Profil'},
        ].map(item => {
          const isActive = activeTab === item.id;
          return (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as any)} 
              className={`nav-item flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'active translate-y-[-6px]' : 'opacity-40'}`}
            >
              <div className={`icon-container p-2.5 rounded-2xl transition-all duration-500 ${isActive ? 'bg-primary shadow-[0_5px_15px_rgba(255,87,34,0.4)] text-white' : 'text-slate-400'}`}>
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 3 : 2} />
              </div>
              {isActive && (
                <div className="w-1 h-1 bg-primary rounded-full mt-1 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function App() { 
  const [showSplash, setShowSplash] = useState(true);
  const { setVenueInfo } = useAppStore();

  useEffect(() => {
    api.get('/player/venues').then(res => {
      if (res.data.success && res.data.data.length > 0) {
        setVenueInfo(res.data.data[0]);
      }
    }).catch(() => {});
  }, [setVenueInfo]);

  return (
    <>
      {showSplash && (
        <SplashScreen 
          duration={3000} 
          logoUrl={useAppStore.getState().venueInfo?.splashImageUrl}
          title={useAppStore.getState().venueInfo?.name || "ARENA FIGHT"}
          onComplete={() => setShowSplash(false)} 
        />
      )}
      <MainApp />
    </>
  );
}
