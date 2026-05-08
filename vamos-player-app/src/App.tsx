import { useState, useEffect } from 'react';
import { LayoutGrid, Trophy, Star, User, Swords } from 'lucide-react';
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
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden border-x border-white/5">
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
      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-32 relative z-10 scrollbar-hide">
        {activeTab === 'dashboard' && <DashboardScreen member={member} tournaments={tournaments} venueInfo={venueInfo} loading={loadingTournaments} />}
        {activeTab === 'play' && <PlayScreen member={member} />}
        {activeTab === 'leaderboard' && <LeaderboardScreen leaderboard={leaderboard} currentUser={member} loading={loadingLeaderboard} />}
        {activeTab === 'tournaments' && <TournamentScreen activeTournaments={tournaments} member={member} />}
        {activeTab === 'rewards' && <RewardsScreen />}
        {activeTab === 'booking' && <BookingScreen />}
        {activeTab === 'active-session' && <ActiveSessionScreen />}
        {activeTab === 'profile' && <ProfileScreen member={member} onLogout={() => useAppStore.getState().logout()} />}
        {activeTab === 'menu' && <MenuScreen />}
        {activeTab === 'training' && <TrainingScreen />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fiery-nav">
        {[
          {id:'dashboard', icon:LayoutGrid, label:'Home'},
          {id:'play',      icon:Swords,     label:'Arena'},
          {id:'leaderboard', icon:Trophy,   label:'Ranking'},
          {id:'rewards',   icon:Star,       label:'Store'},
          {id:'profile',   icon:User,       label:'Profil'},
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
