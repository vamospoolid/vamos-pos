import { useState, useEffect } from 'react';
import { User, ChevronRight, Loader2, ArrowLeft, CheckCircle2, ShieldCheck, X, RefreshCw, LayoutGrid, Medal, Flame, Target, QrCode, ScanLine, Gift, Trophy, Swords, Calendar, Camera, Zap, Star, Users, Crown, Plus, ArrowRight } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from './api';
import { RewardsScreen } from './RewardsScreen';
import { BookingScreen } from './BookingScreen';
import { ActiveSessionScreen } from './ActiveSessionScreen';
import { MenuScreen } from './MenuScreen';
import { VictoryNotification } from './components/VictoryNotification';
import { LeaderboardScreen } from './LeaderboardScreen';

// ═══════════════════════════════════════════════
// FALLBACK MOCK DATA (if DB is empty)
// ═══════════════════════════════════════════════
const MOCK_PLAYERS = [
  ...Array.from({ length: 32 }).map((_, i) => ({
    id: `P${i}`, name: `Player ${i}`, phone: `08${i}`, wins: i, losses: 2, points: i * 10, prize: i * 1000
  }))
];

const MOCK_TOURNAMENT = {
  id: 'T001',
  name: 'Grand Billiard Cup 2026',
  status: 'ONGOING',
  startDate: '2026-02-15',
  endDate: '2026-03-01',
  prizePool: 10000000,
  format: '8-Ball Single Elimination',
  venue: 'Vamos Billiard Club',
  description: 'Turnamen billiard tahunan terbesar di Vamos!',
};

const MOCK_MATCHES = [
  { id: 'M001', round: 'Quarter Final', player1: 'Fajar Nugroho', player2: 'Hendra Setiawan', winner: 'Fajar Nugroho', score: '4-2', date: '2026-02-24' },
];

// ═══════════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════════

import { useAppStore } from './store/appStore';

function LoginScreen({ onLogin }: { onLogin: (member: any) => void }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isRegister ? '/player/register' : '/player/login';
      const payload = isRegister ? { phone, name } : { phone };
      const res = await api.post(endpoint, payload);

      if (res.data.success) {
        localStorage.setItem('playerToken', res.data.data.token);
        onLogin(res.data.data.member);
      } else {
        alert(res.data.message || 'Gagal login.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-secondary relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[250px] h-[250px] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="glass-card p-10 rounded-[2.5rem] w-full max-w-sm relative z-10 fade-in border border-white/5 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(31,34,255,0.4)]" style={{ transform: 'rotate(5deg)' }}>
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase italic">VAMOS<span className="text-accent underline decoration-primary decoration-4 underline-offset-4 ml-1">ELITE</span></h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-3">{isRegister ? 'Join the champion league' : 'Welcome back, legend'}</p>
        </div>

        <div className="flex bg-surface-highlight/40 p-1.5 rounded-2xl mb-8 border border-white/5">
          <button
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isRegister ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isRegister ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div className="fade-in">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="NEXUS"
                className="w-full bg-surface-highlight/30 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary text-white font-medium placeholder:text-slate-600 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">WhatsApp Access</label>
            <div className="flex gap-2">
              <div className="bg-surface-highlight/30 border border-white/10 rounded-xl px-4 py-4 text-slate-400 font-bold text-xs flex items-center">+62</div>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="812 3456 7890"
                className="flex-1 w-full bg-surface-highlight/30 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary text-white font-medium placeholder:text-slate-600 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 flex items-center justify-center active:scale-95 transition-all mt-6 text-sm uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegister ? 'Create Profile' : 'Enter Arena')}
          </button>
        </form>

        <p className="text-center text-[9px] text-slate-600 font-bold uppercase mt-8 tracking-widest">
          {isRegister ? 'By joining you agree to our elite rules' : 'Trouble accessing? Contact HQ.'}
        </p>
      </div>
    </div>
  );
}


function DashboardScreen({ member }: { member: any }) {
  const activeSession = member.sessions?.find((s: any) => s.status === 'ACTIVE');

  return (
    <div className="fade-in space-y-8 pb-32">
      {/* ─── IDENTITY BLOCK ─────────────────────────────────────────────────── */}
      <div className="fiery-card p-8 mt-4 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-primary/10 rounded-full blur-[40px]" />

        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-[32px] bg-secondary border-2 border-primary/20 p-1 flex items-center justify-center overflow-hidden shadow-2xl">
              {member.photo ? (
                <img src={member.photo} alt="P" className="w-full h-full rounded-[28px] object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-700" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#101423] shadow-lg">
              <Crown className="w-4 h-4 text-white" fill="currentColor" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter truncate leading-tight">
              {member.name?.split(' ')[0] || 'Member'}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="px-3 py-1 bg-[#252b45] rounded-full border border-white/5 flex items-center gap-1.5">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{member.tier || 'Elite'}</span>
              </div>
              <div className="px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/10 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-yellow-500" fill="currentColor" />
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">HC {member.handicap || '4'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-2.5 px-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Level {member.level || 1} Progress</p>
            <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{member.experience || 0} / {(member.level || 1) * 1000} XP</p>
          </div>
          <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 fiery-glow"
              style={{ width: `${Math.min(((member.experience || 0) / ((member.level || 1) * 1000)) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── QUICK ACTIONS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => useAppStore.getState().setActiveTab('booking')}
          className="fiery-card p-6 flex flex-col gap-4 hover:scale-[1.02] transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#a855f7]/10 flex items-center justify-center border border-[#a855f7]/20">
            <Calendar className="w-6 h-6 text-[#a855f7]" />
          </div>
          <div className="text-left">
            <p className="text-lg font-black text-white uppercase italic truncate">Book Table</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Reserve Arena</p>
          </div>
        </button>

        <button
          onClick={() => useAppStore.getState().setActiveTab('leaderboard')}
          className="fiery-card p-6 flex flex-col gap-4 hover:scale-[1.02] transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#00d084]/10 flex items-center justify-center border border-[#00d084]/20">
            <Trophy className="w-6 h-6 text-[#00d084]" />
          </div>
          <div className="text-left">
            <p className="text-lg font-black text-white uppercase italic truncate">Ranks</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Global Hall</p>
          </div>
        </button>
      </div>

      {/* ─── LIVE STATUS BANNER ────────────────────────────────────────────── */}
      {(activeSession || (member.sessions?.some((s: any) => s.status === 'PENDING' && !s.tableId))) && (
        <button
          onClick={() => useAppStore.getState().setActiveTab('active-session')}
          className="scale-in fiery-card-highlight p-6 flex items-center justify-between fiery-glow border border-primary/20"
        >
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <Flame className="w-6 h-6 text-primary animate-pulse" fill="currentColor" />
              </div>
              <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-[#101423] animate-ping" />
            </div>
            <div className="text-left">
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic">
                {activeSession ? 'LIVE SESSION' : 'ORDER STATUS'}
              </p>
              <h4 className="text-lg font-black text-white uppercase italic truncate leading-tight">
                {activeSession?.table?.name || 'Voucher Protocol'}
              </h4>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary hover:text-secondary group transition-all">
            <ChevronRight className="w-5 h-5 text-white group-hover:text-secondary" />
          </div>
        </button>
      )}

      {/* ─── LOYALTY CARD ──────────────────────────────────────────────────── */}
      <div className="fiery-card p-8 relative overflow-hidden">
        <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-accent/5 rounded-full blur-[50px] pointer-events-none" />

        <div className="flex justify-between items-start mb-6 px-1">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 italic">Loyalty Vault</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-5xl font-black text-white tracking-tighter italic">
                {(member.loyaltyPoints ?? 0).toLocaleString('id-ID')}
              </h2>
              <span className="text-primary font-black text-lg italic uppercase">PTS</span>
            </div>
          </div>
          <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Rate: 1.2x</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => useAppStore.getState().setActiveTab('rewards')}
            className="fiery-btn-primary py-4 text-[10px] font-black flex items-center justify-center gap-2"
          >
            Redeem Shop <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => alert("Exchange Protocol coming soon.")}
            className="fiery-btn-secondary py-4 text-[10px] font-black uppercase tracking-widest border border-white/5 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" /> History
          </button>
        </div>
      </div>

      <ChallengeSection member={member} />
    </div>
  );
}

function ChallengeSection({ member }: { member: any }) {
  const [showMyQR, setShowMyQR] = useState(false);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [pendingOpponentId, setPendingOpponentId] = useState<string | null>(null);
  const [showStakeSelector, setShowStakeSelector] = useState(false);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const res = await api.get(`/player/${member.id}/challenges`);
        if (res.data.success) setChallenges(res.data.data);
      } catch (err) { }
    };
    fetchChallenges();
    const interval = setInterval(fetchChallenges, 5000);
    return () => clearInterval(interval);
  }, [member.id]);

  const handleChallenge = async (opponentId: string, stake: number, isFightForTable: boolean = false) => {
    if (!opponentId) return;
    const activeSession = member?.sessions?.find((s: any) => s.status === 'ACTIVE');

    try {
      const res = await api.post('/player/challenge', {
        challengerId: member.id,
        opponentId,
        pointsStake: stake,
        isFightForTable,
        sessionId: isFightForTable ? activeSession?.id : null
      });
      if (res.data.success) {
        alert("ARENA CHALENGE DEPLOYED.");
        setShowStakeSelector(false);
        setPendingOpponentId(null);
      }
    } catch (err: any) { alert(err.response?.data?.message || "DEPLOIMENT FAILED."); }
  };

  return (
    <div className="space-y-6 mt-8">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Arena Protocol</h3>
        <button
          onClick={() => alert("CHALLENGE PROTOCOL:\n1. Show QR to Target\n2. Target scans & deploys match\n3. Points staked are locked\n4. Winner claims the harvest.")}
          className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-primary transition-colors"
        >
          Protocol Rules
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setShowMyQR(true)}
          className="fiery-card p-6 flex flex-col items-center gap-4 transition-all hover:bg-white/5 active:scale-95"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
            <QrCode className="w-7 h-7 text-primary" />
          </div>
          <p className="text-xs font-black text-white uppercase tracking-widest">My ID</p>
        </button>

        <button
          onClick={() => setIsScanning(true)}
          className="fiery-card p-6 flex flex-col items-center gap-4 transition-all hover:bg-white/5 active:scale-95"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center fiery-glow shadow-primary/20">
            <ScanLine className="w-7 h-7 text-secondary" />
          </div>
          <p className="text-xs font-black text-white uppercase tracking-widest">Scan Target</p>
        </button>
      </div>

      {challenges.length > 0 && (
        <div className="space-y-4 mt-8">
          {challenges.map(chal => (
            <div key={chal.id} className="fiery-card p-6 flex items-center justify-between border-l-4 border-l-primary relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Swords className="w-12 h-12 text-white" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic">Match Transmission</p>
                <p className="text-sm font-black text-white uppercase italic truncate max-w-[140px]">
                  {chal.challengerId === member.id ? `TARGET: ${chal.opponent.name?.split(' ')[0]}` : `VS: ${chal.challenger.name?.split(' ')[0]}`}
                </p>
                <div className="flex gap-3 items-center mt-2">
                  <p className="text-xs text-slate-400 font-bold tracking-widest">{chal.pointsStake.toLocaleString('id-ID')} PTS</p>
                  {chal.isFightForTable && (
                    <span className="text-[9px] px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 font-black uppercase border border-rose-500/20">Duel</span>
                  )}
                </div>
              </div>
              <div className="relative z-10 flex gap-2">
                {chal.opponentId === member.id && chal.status === 'PENDING' && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await api.put(`/player/challenge/${chal.id}/respond`, { status: 'ACCEPTED' });
                    }}
                    className="fiery-btn-primary px-5 py-2.5 text-[10px]"
                  >
                    Accept
                  </button>
                )}
                {chal.status === 'ACCEPTED' && (
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">Engaging</span>
                    <button
                      onClick={() => alert("REPORT OUTCOME\nPlease inform the operator to finalize this outcome.")}
                      className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[10px] font-black text-emerald-500 uppercase tracking-widest"
                    >
                      Report
                    </button>
                  </div>
                )}
                {chal.status === 'COMPLETED' && (
                  <div className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Finalized
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isScanning && <QRScannerModal onScan={(id) => {
        setPendingOpponentId(id);
        setIsScanning(false);
        setShowStakeSelector(true);
      }} onClose={() => setIsScanning(false)} />}

      {showStakeSelector && pendingOpponentId && (
        <StakeSelectorModal
          currentBalance={member.loyaltyPoints || 0}
          hasActiveSession={!!member?.sessions?.find((s: any) => s.status === 'ACTIVE')}
          onConfirm={(stake, isFight) => handleChallenge(pendingOpponentId, stake, isFight)}
          onClose={() => {
            setShowStakeSelector(false);
            setPendingOpponentId(null);
          }}
        />
      )}

      {showMyQR && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0a0f1d]/95 backdrop-blur-xl" onClick={() => setShowMyQR(false)} />
          <div className="relative w-full max-w-sm fiery-card p-10 text-center scale-in">
            <h3 className="text-xl font-black text-white mb-8 italic uppercase tracking-tighter">Identity Protocol</h3>
            <div className="bg-white p-6 rounded-[32px] inline-block mb-8 shadow-[0_0_30px_rgba(255,255,255,0.1)] border-4 border-primary/20 overflow-hidden">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${member.id}&bgcolor=ffffff&color=101423`}
                alt="QR"
                className="w-48 h-48"
              />
            </div>
            <h3 className="text-2xl font-black text-white italic truncate uppercase">{member.name}</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 mb-10">Deploy to Initiate Protocol</p>
            <button onClick={() => setShowMyQR(false)} className="w-full py-4 fiery-btn-secondary font-black uppercase text-xs tracking-widest">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QRScannerModal({ onScan, onClose }: { onScan: (id: string) => void, onClose: () => void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [0]
    }, false);

    scanner.render((result) => {
      onScan(result);
      scanner.clear();
    }, () => { });

    return () => { try { scanner.clear(); } catch (e) { } };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[#101423]/95 backdrop-blur-3xl" onClick={onClose} />
      <div className="w-full max-w-sm fiery-card p-8 border border-white/10 text-center relative z-10 scale-in shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
        <h3 className="text-xl font-black text-white mb-8 italic uppercase tracking-tighter">Scan Protocol</h3>
        <div id="reader" className="overflow-hidden rounded-[32px] bg-black/40 border border-white/5 shadow-inner"></div>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-8 italic">Find & Frame Valid Target</p>
      </div>
    </div>
  );
}

function StakeSelectorModal({ onConfirm, onClose, currentBalance, hasActiveSession }: { onConfirm: (stake: number, fight: boolean) => void, onClose: () => void, currentBalance: number, hasActiveSession: boolean }) {
  const [stake, setStake] = useState(50);
  const [isFightForTable, setIsFightForTable] = useState(false);
  const presets = [50, 100, 250, 500];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[#101423]/95 backdrop-blur-3xl" onClick={onClose} />
      <div className="relative w-full max-w-sm fiery-card p-10 text-center scale-in">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 italic">Engagement Protocol</p>
        <h3 className="text-2xl font-black text-white mb-8 italic uppercase tracking-tighter">Commit Stake</h3>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {presets.map(p => (
            <button
              key={p}
              onClick={() => setStake(p)}
              className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${stake === p ? 'bg-primary text-secondary border-primary shadow-lg shadow-primary/20' : 'bg-[#1a1f35] text-slate-500 border-white/5'}`}
              disabled={currentBalance < p}
            >
              {p.toLocaleString('id-ID')} PTS
            </button>
          ))}
        </div>

        <div className="bg-black/20 rounded-2xl p-6 mb-8 text-left border border-white/5">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 pl-1">Harvest Amount</p>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={stake}
              onChange={e => setStake(Number(e.target.value))}
              className="bg-transparent border-none text-left p-0 text-3xl font-black text-white w-full focus:outline-none italic tracking-tighter"
            />
          </div>
        </div>

        {hasActiveSession && (
          <button
            onClick={() => setIsFightForTable(!isFightForTable)}
            className={`w-full p-5 rounded-2xl mb-8 flex items-center justify-between transition-all border ${isFightForTable ? 'bg-rose-500/10 border-rose-500/40 fiery-glow' : 'bg-[#1a1f35] border-white/5'}`}
          >
            <div className="text-left">
              <p className={`text-xs font-black uppercase italic ${isFightForTable ? 'text-rose-500' : 'text-white'}`}>Duel for Table</p>
              <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isFightForTable ? 'text-rose-500/70' : 'text-slate-600'}`}>Loser Clears Session Bill</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFightForTable ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40' : 'bg-white/5 text-slate-700'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
          </button>
        )}

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 fiery-btn-secondary text-[10px] font-black uppercase tracking-widest">Abort</button>
          <button
            onClick={() => onConfirm(stake, isFightForTable)}
            disabled={stake <= 0 || stake > currentBalance}
            className="flex-1 fiery-btn-primary py-4 text-[10px]"
          >
            Deploy
          </button>
        </div>
      </div>
    </div>
  );
}


function TournamentScreen({ member, activeTournaments, leaderboard }: { member: any, activeTournaments: any[], leaderboard: any[] }) {
  const [activeView, setActiveView] = useState<'overview' | 'leaderboard' | 'bracket'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTournamentIndex, setSelectedTournamentIndex] = useState(0);
  const [loadingReg, setLoadingReg] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

  const tournament = activeTournaments[selectedTournamentIndex] || MOCK_TOURNAMENT;
  const matches = tournament?.matches || MOCK_MATCHES;

  const handleRegister = async () => {
    if (!tournament.id || tournament.id === 'T001') return;
    setLoadingReg(true);
    try {
      const res = await api.post(`/player/tournaments/${tournament.id}/register`, {
        memberId: member.id,
        handicap: member.handicap || '0',
        paymentNotes: paymentRef,
        paymentStatus: tournament.entryFee > 0 ? 'PENDING' : 'PAID'
      });
      if (res.data.success) {
        setIsRegModalOpen(false);
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Authorization failed.');
    } finally {
      setLoadingReg(false);
    }
  };

  const getPlayerName = (participantId: string) => {
    if (!participantId) return 'TBD';
    const p = tournament?.participants?.find((p: any) => p.id === participantId);
    if (p) return p.member?.name || p.name || 'Unknown';
    return 'TBD';
  };

  const myParticipantId = tournament?.participants?.find((p: any) => p.memberId === member?.id)?.id;

  const filteredLeaderboard = (leaderboard || MOCK_PLAYERS).filter((p: any) =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fade-in space-y-10 pb-32">
      <div className="pt-2 flex justify-between items-end relative">
        <div className="absolute top-0 left-0 w-32 h-16 bg-primary/10 blur-[40px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
            ELITE <span className="text-primary">EVENTS</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic opacity-60">Official Arena Bracket & Logistics</p>
        </div>
        {activeTournaments.length > 1 && (
          <div className="flex gap-2 relative z-10">
            {activeTournaments.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedTournamentIndex(i)}
                className={`w-12 h-12 rounded-2xl text-[10px] font-black transition-all border-2 italic ${selectedTournamentIndex === i ? 'bg-primary text-secondary border-primary shadow-[0_0_20px_rgba(31,34,255,0.3)]' : 'bg-[#1a1f35]/50 text-slate-500 border-white/5 hover:border-white/10'}`}
              >
                E{i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hero Tournament Card */}
      <div className="fiery-card rounded-[48px] p-10 relative overflow-hidden border-2 border-white/5 bg-[#1a1f35]/40 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-x-8 -translate-y-8 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute bottom-0 left-0 p-8 opacity-5">
          <Trophy className="w-40 h-40 text-primary" />
        </div>

        <div className="flex items-center gap-4 mb-10 relative z-10">
          <div className="w-1.5 h-10 bg-primary rounded-full" />
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-1">Status: Open Protocol</p>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{tournament.name}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-12 relative z-10">
          <div className="bg-[#101423] rounded-[32px] p-6 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest italic pt-0.5">Grand Yield</p>
            </div>
            <p className="text-white font-black text-2xl italic tracking-tighter leading-none">
              <span className="text-primary text-sm mr-1">RP</span>{(tournament.prizePool || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-[#101423] rounded-[32px] p-6 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-3.5 h-3.5 text-primary" />
              <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest italic pt-0.5">Entry Access</p>
            </div>
            <p className="text-white font-black text-2xl italic tracking-tighter leading-none">
              {tournament.entryFee > 0 ? <><span className="text-primary text-sm mr-1">RP</span>{tournament.entryFee.toLocaleString()}</> : 'OPEN'}
            </p>
          </div>
        </div>

        {!myParticipantId && tournament.id !== 'T001' && (
          <button
            onClick={() => setIsRegModalOpen(true)}
            className="w-full fiery-btn-primary py-6 flex items-center justify-center gap-4 text-xs tracking-[0.3em] font-black uppercase italic relative z-10 active:scale-[0.98]"
          >
            <span>Secure Entry Ticket</span>
            <ArrowRight className="w-5 h-5" strokeWidth={3} />
          </button>
        )}

        {myParticipantId && (
          <div className="w-full bg-emerald-500/10 border border-emerald-500/20 py-4 rounded-[24px] flex items-center justify-center gap-3 relative z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Provisioned • Entry Verified</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-[#1a1f35]/50 p-2 rounded-[32px] sticky top-2 z-50 border border-white/5 backdrop-blur-xl mx-2 shadow-2xl">
        {[
          { id: 'overview', label: 'TACTICAL BRACKET' },
          { id: 'leaderboard', label: 'HALL RANKINGS' },
          { id: 'bracket', label: 'MISSION INTEL' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`flex-1 py-4 text-[9px] font-black uppercase tracking-[0.2em] rounded-[24px] transition-all duration-300 italic ${activeView === tab.id ? 'bg-primary text-[#101423] shadow-[0_0_20px_rgba(31,34,255,0.3)] font-black' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <div className="mt-8 px-1">
        {activeView === 'overview' && (
          <div className="space-y-6">
            {matches.length > 0 ? matches.map((match: any) => {
              const isMyMatch = myParticipantId && (match.player1Id === myParticipantId || match.player2Id === myParticipantId);
              const p1Name = getPlayerName(match.player1Id);
              const p2Name = getPlayerName(match.player2Id);

              return (
                <div key={match.id} className={`fiery-card p-10 relative overflow-hidden transition-all duration-500 group border-2 ${isMyMatch ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-[#1a1f35]/30'}`}>
                  {isMyMatch && <div className="absolute top-0 left-0 w-full h-[2px] bg-primary fiery-glow z-10" />}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${match.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-primary'}`} />
                      <span className={`text-[9px] font-black uppercase tracking-[0.3em] pt-0.5 italic ${match.status === 'COMPLETED' ? 'text-emerald-500' : 'text-primary'}`}>
                        {match.status === 'COMPLETED' ? 'OPERATION FINALIZED' : 'PROTOCOL PENDING'}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">PHASE {match.round}</span>
                  </div>
                  <div className="flex items-center gap-6 relative">
                    <div className="flex-1 text-right">
                      <p className={`text-xl font-black truncate uppercase italic tracking-tighter ${match.winnerId === match.player1Id ? 'text-primary' : 'text-white'}`}>{p1Name.split(' ')[0] || 'TBD'}</p>
                      <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest mt-1">OPERATIVE A</p>
                    </div>
                    <div className="bg-[#101423] py-4 px-6 rounded-[24px] min-w-[100px] text-center font-black text-xl italic tracking-tighter border-2 border-white/5 relative group-hover:border-primary/40 transition-colors shadow-inner">
                      {match.status === 'COMPLETED' ? (
                        <span className="flex items-center justify-center gap-3">
                          <span className={match.winnerId === match.player1Id ? 'text-primary' : 'text-white'}>{match.score1}</span>
                          <span className="text-slate-800">:</span>
                          <span className={match.winnerId === match.player2Id ? 'text-primary' : 'text-white'}>{match.score2}</span>
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Swords className="w-6 h-6 text-slate-800" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-xl font-black truncate uppercase italic tracking-tighter ${match.winnerId === match.player2Id ? 'text-primary' : 'text-white'}`}>{p2Name.split(' ')[0] || 'TBD'}</p>
                      <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest mt-1">OPERATIVE B</p>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="fiery-card p-24 text-center border-2 border-white/5 bg-[#1a1f35]/20">
                <div className="w-16 h-16 rounded-[24px] bg-[#1a1f35] flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
                </div>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] italic">Deploying combat log...</p>
              </div>
            )}
          </div>
        )}

        {activeView === 'leaderboard' && (
          <div className="space-y-4">
            <div className="bg-[#1a1f35]/50 flex items-center px-6 py-4 rounded-2xl mb-6 border border-white/5">
              <input
                className="bg-transparent border-none focus:outline-none text-sm w-full font-bold placeholder:text-slate-600 text-white"
                placeholder="SEARCH PLAYER..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {filteredLeaderboard.map((p: any, i: number) => (
              <div key={p.id} className="fiery-card p-5 rounded-2xl flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors bg-[#1a1f35]/30">
                <div className="flex items-center gap-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2 ${i < 3 ? 'border-primary bg-primary/20 text-white shadow-lg shadow-primary/20' : 'border-slate-800 bg-slate-900 text-slate-500'}`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-black text-white text-base uppercase italic tracking-tight">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{p.tier || 'MEMBER'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white font-mono">{p.totalWins || 0}W</p>
                  <p className="text-[9px] text-accent font-extrabold tracking-widest uppercase">ACTIVE</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'bracket' && (
          <div className="fiery-card p-20 text-center rounded-[2.5rem] border border-white/5 bg-[#1a1f35]/20">
            <Swords className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">Visual brackets display on main club panels.<br />Consult tournament director for details.</p>
          </div>
        )}
      </div>

      {isRegModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-[#0a0d18]/95 backdrop-blur-2xl" onClick={() => setIsRegModalOpen(false)} />
          <div className="relative w-full max-w-sm fiery-card rounded-[48px] p-12 border-2 border-primary/20 fade-in overflow-hidden shadow-[0_0_100px_rgba(31,34,255,0.2)]">
            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">SECURE ENTRY</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10 italic opacity-60">Authorize Mission Participation</p>

            <div className="space-y-8">
              <div className="bg-[#101423] p-6 rounded-[32px] border border-white/5">
                <p className="text-[9px] text-slate-600 font-extrabold uppercase tracking-widest italic mb-3">Participation Cost</p>
                <p className="text-2xl font-black text-white italic tracking-tighter leading-none">
                  <span className="text-primary text-sm mr-1">RP</span>{tournament.entryFee.toLocaleString()}
                </p>
              </div>

              {tournament.entryFee > 0 && (
                <input
                  type="text"
                  placeholder="PAYMENT REF CODE"
                  className="w-full bg-[#101423] border-2 border-white/5 rounded-[24px] px-6 py-4 text-xs font-black text-white uppercase tracking-widest focus:outline-none focus:border-primary/40"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              )}

              <div className="flex gap-4">
                <button onClick={() => setIsRegModalOpen(false)} className="flex-1 py-5 rounded-[24px] bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest active:scale-95 italic">CANCEL</button>
                <button
                  onClick={handleRegister}
                  disabled={loadingReg || (tournament.entryFee > 0 && !paymentRef)}
                  className="flex-[2] fiery-btn-primary py-5 rounded-[24px] text-[10px] uppercase tracking-widest font-black italic disabled:opacity-50"
                >
                  {loadingReg ? 'AUTHORIZING...' : 'AUTHORIZE ENTRY'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function VerificationCard({ member }: { member: any }) {
  const [uploading, setUploading] = useState(false);
  const { refreshMemberData } = useAppStore();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await api.put(`/player/profile`, { memberId: member.id, photo: base64, identityStatus: 'PENDING' });
        refreshMemberData();
        alert("Biometric Protocol Uploaded. Awaiting HQ authorization.");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Synchronization failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyWa = async () => {
    const code = prompt("ENTER AUTHORIZATION CODE (MOCK: 123456)");
    if (code === '123456') {
      await api.patch(`/members/${member.id}/verify/wa`);
      refreshMemberData();
      alert("Comms Protocol Verified.");
    } else if (code !== null) {
      alert("Authorization denied. Protocol compromised.");
    }
  };

  return (
    <div className="fiery-card p-8 border-2 border-white/5 bg-[#1a1f35]/40 rounded-[40px] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-1000">
        <ShieldCheck className="w-24 h-24 text-primary" />
      </div>
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic">Security Protocol</p>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">ID VERIFICATION</h3>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic border tracking-widest transition-all ${member.identityStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
          {member.identityStatus === 'VERIFIED' ? 'SECURED' : 'BREACHED'}
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between p-5 rounded-[28px] bg-[#101423] border border-white/5 hover:border-white/10 transition-colors shadow-inner">
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border ${member.isWaVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#1a1f35] text-slate-700 border-white/5'}`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase italic tracking-tighter mb-0.5">WhatsApp Protocol</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{member.isWaVerified ? 'COMMS SECURED' : 'ACTION REQUIRED'}</p>
            </div>
          </div>
          {!member.isWaVerified && (
            <button onClick={handleVerifyWa} className="px-5 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all active:scale-95 border border-primary/20 italic">Verify</button>
          )}
        </div>

        <div className="flex items-center justify-between p-5 rounded-[28px] bg-[#101423] border border-white/5 hover:border-white/10 transition-colors shadow-inner">
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border ${member.identityStatus === 'VERIFIED' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-[#1a1f35] text-slate-700 border-white/5'}`}>
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase italic tracking-tighter mb-0.5">Biometric Identity</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{member.identityStatus === 'VERIFIED' ? 'SIGNATURE SECURED' : member.identityStatus === 'PENDING' ? 'AWAITING AUTH' : 'UPLOAD REQUIRED'}</p>
            </div>
          </div>
          {member.identityStatus === 'UNVERIFIED' && (
            <label className="cursor-pointer px-5 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all active:scale-95 border border-primary/20 italic">
              {uploading ? 'SYNCING...' : 'UPLOAD'}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ member, onLogout }: { member: any, onLogout: () => void }) {
  const [view, setView] = useState<'main' | 'history' | 'h2h'>('main');
  const [history, setHistory] = useState<any[]>([]);
  const [h2h, setH2h] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const { refreshMemberData } = useAppStore();

  useEffect(() => {
    if (view === 'history') {
      api.get(`/player/${member.id}/match-history`).then(res => setHistory(res.data.data)).catch(() => { });
    }
    if (view === 'h2h') {
      api.get(`/player/${member.id}/h2h`).then(res => setH2h(res.data.data)).catch(() => { });
    }
  }, [view, member.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await api.post(`/player/${member.id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        refreshMemberData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Biometric sync failed.');
    } finally {
      setUploading(false);
    }
  };

  if (view === 'history') {
    return (
      <div className="fade-in space-y-10 pb-32 px-1">
        <div className="flex items-center gap-6 pt-4 mb-8">
          <button onClick={() => setView('main')} className="w-14 h-14 rounded-[20px] bg-[#1a1f35] flex items-center justify-center border-2 border-white/5 active:scale-90 transition-all text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">COMBAT <span className="text-primary italic">LOGS</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 italic opacity-60">Historical Mission Records</p>
          </div>
        </div>

        <div className="space-y-6">
          {history.length > 0 ? history.map((match: any) => (
            <div key={match.id} className="fiery-card p-10 relative overflow-hidden group border-2 border-white/5 bg-[#1a1f35]/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col gap-8">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${match.winnerId === member.id ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-[0.3em] pt-0.5 italic ${match.winnerId === member.id ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {match.winnerId === member.id ? 'VICTORY LOGGED' : 'DEFEAT RECORDED'}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest">
                    {new Date(match.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center gap-6 relative px-2">
                  <div className="flex-1 text-center">
                    <p className={`text-lg font-black truncate uppercase italic tracking-tighter ${match.player1Id === member.id ? 'text-primary' : 'text-white'}`}>{match.player1Name.split(' ')[0]}</p>
                    <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-[0.2em] mt-1 shrink-0">{match.player1Id === member.id ? 'YOU' : 'OPP'}</p>
                  </div>
                  <div className="bg-[#101423] py-4 px-6 rounded-[24px] min-w-[90px] text-center font-black text-xl italic tracking-tighter border-2 border-white/5 shadow-inner">
                    {match.score1} : {match.score2}
                  </div>
                  <div className="flex-1 text-center">
                    <p className={`text-lg font-black truncate uppercase italic tracking-tighter ${match.player2Id === member.id ? 'text-primary' : 'text-white'}`}>{match.player2Name.split(' ')[0]}</p>
                    <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-[0.2em] mt-1 shrink-0">{match.player2Id === member.id ? 'YOU' : 'OPP'}</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-0 right-0 p-3">
                <span className="text-[7px] font-black px-3 py-1 bg-primary/10 text-primary rounded-bl-xl border-l border-b border-primary/20 uppercase italic tracking-widest">
                  {match.tournamentName || 'ARENA'}
                </span>
              </div>
            </div>
          )) : (
            <div className="fiery-card rounded-[48px] p-24 text-center border-2 border-white/5 bg-[#1a1f35]/20">
              <Swords className="w-16 h-16 text-slate-800 mx-auto mb-6 border-2 border-slate-900 rounded-[28px] p-4 opacity-40 shadow-inner" />
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-relaxed">No tactical match records detected in the synchronization grid.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'h2h') {
    return (
      <div className="fade-in space-y-10 pb-32 px-1">
        <div className="flex items-center gap-6 pt-4 mb-8">
          <button onClick={() => setView('main')} className="w-14 h-14 rounded-[20px] bg-[#1a1f35] flex items-center justify-center border-2 border-white/5 active:scale-90 transition-all text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">TOP <span className="text-primary italic">RIVALRIES</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 italic opacity-60">Comparative Operative Analytics</p>
          </div>
        </div>

        <div className="space-y-6">
          {h2h.length > 0 ? h2h.map((rival: any) => (
            <div key={rival.opponentId} className="fiery-card rounded-[48px] p-10 relative overflow-hidden group border-2 border-white/5 bg-[#1a1f35]/30 hover:border-primary/40 transition-all duration-300">
              <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[32px] bg-[#101423] border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                    {rival.photo ? (
                      <img src={rival.photo} alt="Rival" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-black text-slate-700 uppercase italic text-2xl">{rival.name.substring(0, 2)}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-2xl text-white leading-none uppercase italic tracking-tighter mb-3">{rival.name}</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase italic leading-none mb-1">RECORD</span>
                        <span className="text-sm font-black text-slate-400 font-mono tracking-tighter uppercase">{rival.wins}W / {rival.losses}L</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 italic">ENGAGEMENTS</p>
                  <p className="text-4xl font-black text-white italic tracking-tighter leading-none">{rival.total}</p>
                </div>
              </div>
              <div className="mt-8 h-2.5 w-full bg-[#101423] rounded-full overflow-hidden flex p-[1px] border border-white/5 shadow-inner">
                <div className="h-full bg-emerald-500 rounded-full fiery-glow" style={{ width: `${(rival.wins / rival.total) * 100}%` }} />
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(rival.losses / rival.total) * 100}%` }} />
              </div>
            </div>
          )) : (
            <div className="fiery-card rounded-[48px] p-24 text-center border-2 border-white/5 bg-[#1a1f35]/20">
              <Users className="w-16 h-16 text-slate-800 mx-auto mb-6 border-2 border-slate-900 rounded-[28px] p-4 opacity-40 shadow-inner" />
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-relaxed">No consistent rival signatures detected in the local sector.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-12 pb-32 px-1">
      <div className="flex flex-col items-center gap-8 pt-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative group z-10">
          <div className="w-36 h-36 rounded-[48px] bg-[#1a1f35] border-[6px] border-[#101423] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            {member.photo ? (
              <img src={member.photo} alt="Profile" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <User className="w-16 h-16 text-slate-700" />
            )}
          </div>
          <label className="absolute -bottom-3 -right-3 w-14 h-14 rounded-[24px] bg-primary flex items-center justify-center border-[4px] border-[#101423] shadow-2xl cursor-pointer hover:scale-105 active:scale-90 transition-all fiery-glow">
            {uploading ? <Loader2 className="w-6 h-6 animate-spin text-secondary" /> : <Camera className="w-6 h-6 text-secondary" />}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        <div className="text-center relative z-10">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-4">{member.name}</h2>
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] italic mb-1">BALANCE</p>
              <p className="text-lg font-black text-white uppercase italic tracking-tighter">{member.loyaltyPoints ?? 0} <span className="text-[10px] opacity-40">PTS</span></p>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] italic mb-1">STANDING</p>
              <p className="text-lg font-black text-white uppercase italic tracking-tighter">Level {member.level || 1} <span className="text-[10px] opacity-40">ELITE</span></p>
            </div>
          </div>
        </div>
      </div>

      <VerificationCard member={member} />

      <div className="fiery-card p-10 rounded-[48px] border-2 border-primary/20 bg-primary/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
          <Medal className="w-40 h-40 text-primary" />
        </div>
        <div className="flex justify-between items-end mb-8 relative z-10">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic">Engagement Potential</p>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">RANK STATUS {member.level || 1}</h3>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase italic">{Math.floor((member.experience / ((member.level || 1) * 1000)) * 100)}% COMPLETE</p>
        </div>
        <div className="h-4 w-full bg-[#101423] rounded-full overflow-hidden border border-white/10 p-[2px] shadow-inner mb-6 relative z-10">
          <div
            className="h-full bg-gradient-to-r from-primary to-[#1f22ff] rounded-full transition-all duration-1000 relative fiery-glow"
            style={{ width: `${Math.min(((member.experience || 0) / ((member.level || 1) * 1000)) * 100, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-600 font-black uppercase mt-2 text-center tracking-[0.3em] italic relative z-10">Deploy {((member.level || 1) * 1000) - (member.experience || 0)} more XP to override Rank {(member.level || 1) + 1}</p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Honorary Badges</p>
          <span className="text-[10px] font-black text-primary uppercase italic">{(member.badges || []).length} OBTAINED</span>
        </div>
        <div className="flex gap-4">
          {[
            { key: 'PIONEER', label: 'Pioneer', icon: Crown, color: 'text-amber-400', bg: 'bg-amber-400/10' },
            { key: 'STREAK_KING', label: 'Berserker', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { key: 'DEATHMATCH', label: 'High Roller', icon: Target, color: 'text-primary', bg: 'bg-primary/10' }
          ].map(badge => {
            const isEarned = (member.badges || []).includes(badge.key);
            return (
              <div key={badge.key} className={`flex-1 fiery-card p-6 rounded-[32px] flex flex-col items-center gap-4 transition-all duration-700 border-2 ${isEarned ? 'opacity-100 border-white/10 bg-[#1a1f35]/50' : 'opacity-20 grayscale border-white/5 bg-transparent'}`}>
                <div className={`w-14 h-14 rounded-[20px] ${isEarned ? badge.bg : 'bg-slate-800/10'} flex items-center justify-center ${isEarned ? badge.color : 'text-slate-700'} border border-white/5 shadow-inner`}>
                  <badge.icon className={`w-7 h-7 ${isEarned ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
                </div>
                <p className="text-[9px] font-black text-white uppercase tracking-widest text-center leading-none italic">{badge.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <button
          onClick={() => setView('history')}
          className="w-full fiery-card flex items-center justify-between p-8 rounded-[40px] transition-all hover:bg-[#1a1f35] border-2 border-white/5 group active:scale-[0.98]"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-[24px] bg-[#1a1f35] flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-all shadow-inner">
              <Swords className="w-6 h-6 text-primary" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="font-black text-white text-lg uppercase italic tracking-tighter">Arena History</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic opacity-60">Global match logs</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-primary transition-colors" strokeWidth={3} />
        </button>

        <button
          onClick={() => setView('h2h')}
          className="w-full fiery-card flex items-center justify-between p-8 rounded-[40px] transition-all hover:bg-[#1a1f35] border-2 border-white/5 group active:scale-[0.98]"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-[24px] bg-[#1a1f35] flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-all shadow-inner">
              <Users className="w-6 h-6 text-primary" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="font-black text-white text-lg uppercase italic tracking-tighter">Combat Analytics</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic opacity-60">Head to Head rivals</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-primary transition-colors" strokeWidth={3} />
        </button>

        <button
          onClick={() => useAppStore.getState().setActiveTab('booking')}
          className="w-full fiery-card flex items-center justify-between p-8 rounded-[40px] transition-all hover:bg-[#1a1f35] border-2 border-white/5 group active:scale-[0.98]"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-[24px] bg-[#1a1f35] flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-all shadow-inner">
              <Calendar className="w-6 h-6 text-primary" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="font-black text-white text-lg uppercase italic tracking-tighter">Tactical Booking</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic opacity-60">Reserve combat territory</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-primary transition-colors" strokeWidth={3} />
        </button>

        <button
          onClick={() => useAppStore.getState().setActiveTab('rewards')}
          className="w-full fiery-card flex items-center justify-between p-8 rounded-[40px] transition-all hover:bg-[#1a1f35] border-2 border-white/5 group active:scale-[0.98]"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-[24px] bg-[#1a1f35] flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-all shadow-inner">
              <Gift className="w-6 h-6 text-primary" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="font-black text-white text-lg uppercase italic tracking-tighter">Rewards Depot</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic opacity-60">Redeem loyalty assets</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-primary transition-colors" strokeWidth={3} />
        </button>

        <button
          onClick={onLogout}
          className="w-full py-6 rounded-[32px] mt-12 transition-all font-black text-[10px] uppercase tracking-[0.4em] bg-rose-500/10 text-rose-500 border-2 border-rose-500/20 hover:bg-rose-500/20 active:scale-95 italic"
        >
          Abort Mission Protocol
        </button>
      </div>
    </div>
  );
}

function MainApp() {
  const { member, setMember, activeTab, setActiveTab, refreshMemberData, logout } = useAppStore();
  const [tournaments, setTournaments] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeNotification, setActiveNotification] = useState<any>(null);

  useEffect(() => {
    if (!member) return;
    const allChallenges = [...(member.challengesSent || []), ...(member.challengesReceived || [])];
    const latestCompleted = allChallenges.find(c => c.status === 'COMPLETED');

    if (latestCompleted) {
      try {
        const notifiedStr = localStorage.getItem('notifiedChallenges');
        const notifiedChallenges = notifiedStr ? JSON.parse(notifiedStr) : [];

        if (!notifiedChallenges.includes(latestCompleted.id)) {
          setActiveNotification(latestCompleted);
          notifiedChallenges.push(latestCompleted.id);
          localStorage.setItem('notifiedChallenges', JSON.stringify(notifiedChallenges));
        }
      } catch (e) {
        console.error("Local storage error in notification logic", e);
      }
    }
  }, [member]);

  useEffect(() => {
    api.get('/player/tournaments').then(res => setTournaments(res.data.data)).catch(() => { });
    api.get('/player/leaderboard').then(res => setLeaderboard(res.data.data)).catch(() => { });
  }, []);

  useEffect(() => {
    if (member?.id) {
      refreshMemberData();
      const interval = setInterval(refreshMemberData, 5000);
      return () => clearInterval(interval);
    }
  }, [member?.id, refreshMemberData]);

  if (!member) return <LoginScreen onLogin={setMember} />;

  const navItems = [
    { id: 'home', icon: LayoutGrid, label: 'ARENA' },
    { id: 'leaderboard', icon: Trophy, label: 'HALL' },
    { id: 'rewards', icon: Gift, label: 'REWARDS' },
    { id: 'tournaments', icon: Medal, label: 'EVENTS' },
    { id: 'profile', icon: User, label: 'PROFILE' },
  ];

  return (
    <div className="min-h-screen bg-[#101423] text-white flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden border-x border-white/5">
      <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20 bg-primary/20" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20 bg-accent/10" />

      {activeNotification && (
        <VictoryNotification
          challenge={activeNotification}
          currentMemberId={member.id}
          onClose={() => setActiveNotification(null)}
        />
      )}

      {/* Unified Header */}
      <div className="flex justify-between items-center px-6 pt-12 pb-6 relative z-30 bg-[#101423]/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Swords className="w-5 h-5 text-primary" fill="currentColor" />
          </div>
          <h1 className="text-xl font-black tracking-tighter italic uppercase">
            VAMOS<span className="text-primary">.GG</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#1a1f35] pl-2 pr-1 py-1 rounded-full flex items-center gap-2 border border-white/5 shadow-inner">
            <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
              <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
            </div>
            <span className="text-sm font-black text-white px-1">{member.loyaltyPoints ?? 0}</span>
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all">
              <Plus className="w-4 h-4 text-white font-bold" />
            </div>
          </div>

          <button onClick={() => setActiveTab('profile')} className="w-9 h-9 rounded-full bg-[#1a1f35] overflow-hidden border-2 border-primary/30 p-0.5">
            {member.photo ? (
              <img src={member.photo} alt="P" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-[#1a1f35] flex items-center justify-center text-xs font-black text-primary">
                {member.name?.[0].toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide relative z-10">
        {activeTab === 'home' && <DashboardScreen member={member} />}
        {activeTab === 'booking' && <BookingScreen />}
        {activeTab === 'rewards' && <RewardsScreen />}
        {activeTab === 'active-session' && <ActiveSessionScreen />}
        {activeTab === 'menu' && <MenuScreen />}
        {activeTab === 'leaderboard' && <LeaderboardScreen leaderboard={leaderboard} currentUser={member} />}
        {activeTab === 'tournaments' && <TournamentScreen member={member} activeTournaments={tournaments} leaderboard={leaderboard} />}
        {activeTab === 'profile' && <ProfileScreen member={member} onLogout={logout} />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full px-6 pb-6 pt-4 z-50 pointer-events-none">
        <div className="max-w-md mx-auto px-4">
          <div className="fiery-nav flex justify-between items-center px-4 py-3 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] pointer-events-auto">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/20 blur-md rounded-full scale-125" />
                  )}
                  {isActive && (
                    <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
                  )}
                  <item.icon className={`w-6 h-6 relative z-10 ${isActive ? 'text-primary' : 'stroke-[2]'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function App() {
  return <MainApp />;
}
