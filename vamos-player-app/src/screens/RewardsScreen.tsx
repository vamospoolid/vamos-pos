import { useState, useEffect } from 'react';
import { ChevronLeft, Gift, Loader2, CheckCircle, Clock } from 'lucide-react';
import { api } from '../api';
import { useAppStore } from '../store/appStore';

export function RewardsScreen({ member, onBack }: { member: any, onBack: () => void }) {
  const [rewards, setRewards] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const { refreshMemberData, addToast } = useAppStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRewards, resMember] = await Promise.all([
        api.get('/loyalty/rewards'),
        api.get(`/loyalty/member/${member.id}`)
      ]);
      setRewards(resRewards.data.data);
      // Member data includes redemptions if we expand it, but let's just get them from member profile or we can rely on redemptions returned if any.
      setRedemptions(resMember.data.data.redemptions || []);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: any) => {
    if (member.loyaltyPoints < reward.pointsRequired) {
      addToast({ title: 'POIN KURANG', message: `Poin Anda tidak cukup untuk menukar ${reward.title}`, type: 'error' });
      return;
    }

    if (!confirm(`Tukar ${reward.pointsRequired} poin dengan ${reward.title}?`)) return;

    setRedeeming(reward.id);
    try {
      const res = await api.post('/loyalty/redeem', {
        memberId: member.id,
        rewardId: reward.id
      });
      if (res.data.success) {
        addToast({ title: 'BERHASIL', message: 'Reward berhasil ditukar! Silakan tunjukkan ke Kasir.', type: 'success' });
        refreshMemberData();
        fetchData();
      }
    } catch (error: any) {
      addToast({ title: 'GAGAL', message: error.response?.data?.message || 'Gagal menukar poin', type: 'error' });
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="fade-in space-y-6 pb-32">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-4 pt-8 px-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-black italic text-white uppercase">REWARDS</h1>
      </div>

      <div className="px-4">
        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-3xl p-6 text-center shadow-[0_0_30px_rgba(234,179,8,0.15)] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/20 blur-[30px] rounded-full"></div>
          <Gift className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
          <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] italic mb-1">Total Poin Anda</p>
          <h2 className="text-5xl font-black text-white italic tracking-tighter leading-none">{member.loyaltyPoints ?? 0} <span className="text-xl text-yellow-500 not-italic">PTS</span></h2>
        </div>
      </div>

      <div className="px-4 space-y-6">
        <div>
          <h3 className="text-lg font-black text-white italic uppercase mb-4">Katalog Hadiah</h3>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-10 bg-white/5 rounded-3xl border border-white/5">
              <p className="text-slate-400 font-medium">Belum ada hadiah tersedia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rewards.map((reward) => {
                const canAfford = member.loyaltyPoints >= reward.pointsRequired;
                return (
                  <div key={reward.id} className="bg-[#101423] rounded-[24px] border border-white/5 p-4 flex items-center gap-4 relative overflow-hidden group">
                    <div className="w-20 h-20 rounded-2xl bg-[#1a1f35] border border-white/5 flex flex-col items-center justify-center shrink-0">
                      <Gift className={`w-8 h-8 ${canAfford ? 'text-yellow-500' : 'text-slate-600'}`} />
                      <span className={`text-[10px] font-black mt-1 ${canAfford ? 'text-yellow-500' : 'text-slate-600'} italic`}>{reward.pointsRequired} PTS</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-white text-base leading-tight uppercase italic">{reward.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{reward.description}</p>
                      
                      <button 
                        onClick={() => handleRedeem(reward)}
                        disabled={!canAfford || redeeming === reward.id}
                        className={`mt-3 w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest italic transition-all flex items-center justify-center gap-2
                          ${canAfford 
                            ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500 hover:text-black' 
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}`}
                      >
                        {redeeming === reward.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tukar Sekarang'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {redemptions.length > 0 && (
          <div>
            <h3 className="text-lg font-black text-white italic uppercase mb-4">Riwayat Penukaran</h3>
            <div className="space-y-3">
              {redemptions.map((r: any) => (
                <div key={r.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-black text-white text-sm uppercase italic">{r.reward?.title || 'Reward'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(r.claimedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    {r.status === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-500/20">
                        <Clock className="w-3 h-3" /> Kasir
                      </span>
                    ) : r.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> Sukses
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-rose-500/20">
                        Ditolak
                      </span>
                    )}
                    <p className="text-[10px] font-black text-yellow-500 mt-1 italic">-{r.pointsUsed} PTS</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
