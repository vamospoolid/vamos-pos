import { useState, useEffect } from 'react';
import { User, Camera, Loader2, Trophy, Swords, Download, ChevronRight } from 'lucide-react';
import { api, getAvatarUrl } from '../api';
import { useAppStore } from '../store/appStore';
import { HistoryScreen } from '../HistoryScreen';
import { AchievementBadge } from '../components/AchievementBadge';

export function ProfileScreen({ member, onLogout }: { member: any, onLogout: () => void }) {
  const [view, setView] = useState<'main' | 'history'>('main');
  const [uploading, setUploading] = useState(false);
  const [rankData, setRankData] = useState<{ globalRank: number | null; totalWins: number; monthlyScore: number; tier: string } | null>(null);
  const [loadingRank, setLoadingRank] = useState(true);
  const { refreshMemberData, setActiveTab, addToast } = useAppStore();

  useEffect(() => {
    const fetchRank = async () => {
      setLoadingRank(true);
      try {
        const res = await api.get('/player/leaderboard');
        const lb = res.data.data;
        const allTime: any[] = lb.allTime || [];
        const monthly: any[] = lb.monthly || [];
        const idx = allTime.findIndex((p: any) => p.id === member.id);
        const monthlyEntry = monthly.find((p: any) => p.id === member.id);
        const entry = allTime[idx] || {};
        setRankData({
          globalRank: idx >= 0 ? idx + 1 : null,
          totalWins: entry.totalWins ?? member.totalWins ?? 0,
          monthlyScore: monthlyEntry?.monthlyScore ?? 0,
          tier: entry.tier ?? member.tier ?? 'OPERATIVE',
        });
      } catch {
        setRankData({
          globalRank: null,
          totalWins: member.totalWins ?? 0,
          monthlyScore: 0,
          tier: member.tier ?? 'OPERATIVE',
        });
      } finally {
        setLoadingRank(false);
      }
    };
    fetchRank();
  }, [member.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await api.post(`/player/${member.id}/avatar`, formData);
      if (res.data.success) {
        refreshMemberData();
        addToast({ title: 'SYNC COMPLETE', message: 'Foto profil diperbarui.', type: 'success' });
      }
    } catch (err: any) { 
        addToast({ title: 'UPLOAD FAILED', message: err.response?.data?.message || 'Gagal mengunggah foto.', type: 'error' });
    } finally { 
        setUploading(false); 
    }
  };

  if (view === 'history') return <HistoryScreen member={member} onBack={() => setView('main')} />;

  const tierColors: Record<string, string> = {
    CHAMPION: '#ff5722', ELITE: '#a855f7', VETERAN: '#3b82f6',
    OPERATIVE: '#10b981', ROOKIE: '#94a3b8',
  };
  const tierColor = tierColors[rankData?.tier?.toUpperCase() ?? ''] ?? '#94a3b8';

  return (
    <div className="fade-in space-y-6 pb-32">
      {/* ─── Header ─── */}
      <div className="text-center pt-8">
        <h1 className="text-2xl font-black italic text-white uppercase">PROFIL</h1>
      </div>

      {/* ─── Avatar & Name ─── */}
      <div className="flex flex-col items-center">
        <div className="relative mb-5">
          <div className="w-36 h-36 rounded-[44px] bg-[#1a1f35] p-1 border-4 border-white/5 shadow-2xl overflow-hidden">
            {member.photo
              ? <img src={getAvatarUrl(member.photo)!} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><User className="w-14 h-14 text-slate-700" /></div>}
          </div>
          <label className={`absolute -bottom-2 -right-2 p-3 rounded-2xl border-4 border-[#070b14] cursor-pointer transition-all ${uploading ? 'bg-slate-600 animate-pulse' : 'bg-primary'}`}>
            {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
          </label>
        </div>
        <h2 className="text-2xl font-black text-white italic uppercase leading-none">{member.name}</h2>
        <div className="flex items-center gap-2 mt-2">
          {member.isWaVerified && (
            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase italic tracking-widest">
              ✓ Verified
            </span>
          )}
          <span className="text-[9px] font-black uppercase italic tracking-widest px-3 py-1 rounded-full border" style={{ color: tierColor, borderColor: `${tierColor}33`, backgroundColor: `${tierColor}15` }}>
            {rankData?.tier ?? '...'}
          </span>
        </div>

        {/* ─── BADGE COLLECTION ─── */}
        <div className="mt-8 px-4 w-full">
            <div className="flex justify-between items-baseline mb-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Achievement Medals</p>
                <p className="text-[8px] font-black text-primary uppercase italic">{(member.badges || []).length}/6 Unlocked</p>
            </div>
            <div className="bg-[#1a1f35]/30 border border-white/5 rounded-[32px] p-6 grid grid-cols-4 gap-4">
                {['PIONEER', 'STREAK_KING', 'DEATHMATCH', 'LEVEL_10', 'LOYALTY', 'NIGHT_OWL'].map(badge => (
                    <AchievementBadge 
                        key={badge} 
                        type={badge} 
                        isUnlocked={(member.badges || []).includes(badge)} 
                    />
                ))}
            </div>
        </div>
      </div>

      {/* ─── RANKING STATS CARD ─── */}
      <div className="fiery-card p-6 rounded-[32px] border-2 border-amber-500/15 bg-amber-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none" />
        <div className="flex justify-between items-center mb-5 relative z-10">
          <div>
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] italic mb-1">Ranking Stats</p>
            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">Statistik Peringkat</h3>
          </div>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl text-amber-500 text-[10px] font-black uppercase italic tracking-widest hover:bg-amber-500/20 transition-all"
          >
            <Trophy className="w-4 h-4" />
            Lihat
          </button>
        </div>

        {loadingRank ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500/50" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 relative z-10">
            {/* Global Rank */}
            <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5 col-span-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-1">Posisi Global</p>
              <div className="flex items-end gap-2">
                {rankData?.globalRank ? (
                  <>
                    <span className="text-4xl font-black text-amber-400 italic tracking-tighter leading-none">#{rankData.globalRank}</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase italic mb-1">di Leaderboard</span>
                  </>
                ) : (
                  <span className="text-lg font-black text-slate-600 italic uppercase">Belum Terdaftar</span>
                )}
              </div>
            </div>

            {/* Total Wins */}
            <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2">Kemenangan</p>
              <p className="text-3xl font-black text-emerald-400 italic tracking-tighter leading-none">{rankData?.totalWins ?? 0}<span className="text-[11px] text-slate-500 ml-1 not-italic">W</span></p>
            </div>

            <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2">XP</p>
              <p className="text-3xl font-black text-blue-400 italic tracking-tighter leading-none">{rankData?.monthlyScore ?? 0}<span className="text-[11px] text-slate-500 ml-1 not-italic">XP</span></p>
            </div>

            {/* Level */}
            <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2">Level</p>
              <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{member.level ?? 1}</p>
            </div>

            {/* Loyalty Points */}
            <div className="bg-[#101423] rounded-[24px] p-5 border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2">Loyalty</p>
              <p className="text-3xl font-black text-yellow-400 italic tracking-tighter leading-none">{member.loyaltyPoints ?? 0}<span className="text-[11px] text-slate-500 ml-1 not-italic">PTS</span></p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Handicap Card ─── */}
      {member.handicapLabel && (
        <div className="fiery-card p-6 rounded-[28px] border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] italic mb-1">Official Handicap</p>
            <p className="text-xl font-black text-white italic uppercase tracking-tighter">{member.handicapLabel}</p>
          </div>
          <TrendingUpIcon className="w-6 h-6 text-amber-500" />
        </div>
      )}

      {/* ─── Menu Items ─── */}
      <div className="space-y-3">
        <button onClick={() => setView('history')} className="w-full fiery-card flex items-center justify-between p-6 rounded-[28px] border-2 border-white/5 group">
          <div className="flex items-center gap-5">
            <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center"><Swords className="w-5 h-5 text-primary" /></div>
            <span className="font-black text-white text-sm uppercase italic">Riwayat Arena</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>

        <a href="/VamosPlayer.apk" download="VamosPlayer_Latest.apk" className="w-full fiery-card flex items-center justify-between p-6 rounded-[28px] border-2 border-primary/20 group hover:bg-primary/5 transition-all">
          <div className="flex items-center gap-5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <span className="font-black text-white text-sm uppercase italic block leading-none">Aplikasi Android</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 block">Pasang di Layar Utama HP Anda</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary/50 group-hover:text-primary transition-all" />
        </a>

        <button onClick={onLogout} className="w-full py-5 rounded-[24px] mt-6 font-black text-[10px] uppercase bg-rose-500/10 text-rose-500 border-2 border-rose-500/20 italic tracking-widest">
          Keluar Profil
        </button>
      </div>
    </div>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
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
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    );
}
