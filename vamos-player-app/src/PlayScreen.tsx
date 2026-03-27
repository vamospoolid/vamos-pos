import { useState, useEffect, useCallback, useRef } from 'react';
import { QrCode, ScanLine, Crown, Swords, LayoutGrid, Zap, X } from 'lucide-react';
import { TableCard } from './components/TableCard';
import { io } from 'socket.io-client';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from './api';

export function PlayScreen({ member }: { member: any }) {
  const [kings, setKings] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);
  const [showStakeSelector, setShowStakeSelector] = useState(false);
  const [pendingOpponentId, setPendingOpponentId] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(100);

  const activeSession = member.sessions?.find((s: any) => s.status === 'ACTIVE');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const fetchKings = useCallback(async () => {
    try {
      const res = await api.get('/player/kings');
      if (res.data.success) setKings(res.data.data);
    } catch (err) { }
  }, []);

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await api.get(`/player/${member.id}/challenges`);
      if (res.data.success) setChallenges(res.data.data);
    } catch (err) { }
  }, [member.id]);

  useEffect(() => {
    fetchKings();
    fetchChallenges();
    const kingInterval = setInterval(fetchKings, 10000);
    const chalInterval = setInterval(fetchChallenges, 5000);

    const socket = io('https://pos.vamospool.id');
    socket.on('king:updated', fetchKings);
    socket.on(`challenge:new:${member.id}`, fetchChallenges);
    socket.on(`challenge:update:${member.id}`, fetchChallenges);

    return () => {
      clearInterval(kingInterval);
      clearInterval(chalInterval);
      socket.disconnect();
    };
  }, [fetchKings, fetchChallenges, member.id]);

  // Effect for Scanner
  useEffect(() => {
    if (isScanning) {
      setTimeout(() => {
        try {
          const scanner = new Html5QrcodeScanner("reader", { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            videoConstraints: {
              facingMode: "environment"
            }
          }, false);
          scanner.render((decodedText) => {
            setPendingOpponentId(decodedText);
            setIsScanning(false);
            setShowStakeSelector(true);
            scanner.clear().catch(console.error);
          }, () => { });
          scannerRef.current = scanner;
        } catch (e) {
          console.error("Scanner init error", e);
        }
      }, 300);
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    }
  }, [isScanning]);

  const handleChallenge = async (stake: number, isFightForTable: boolean = false) => {
    if (!pendingOpponentId) return;

    if (!navigator.geolocation) {
       try {
        const res = await api.post('/player/challenge', {
          challengerId: member.id,
          opponentId: pendingOpponentId,
          pointsStake: stake,
          isFightForTable,
          sessionId: isFightForTable ? activeSession?.id : null,
          lat: 0,
          lng: 0
        });
        if (res.data.success) {
          setShowStakeSelector(false);
          setPendingOpponentId(null);
          fetchChallenges();
          alert("ARENA CHALLENGE DEPLOYED.");
        }
      } catch (err: any) { alert(err.response?.data?.message || "DEPLOYMENT FAILED."); }
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await api.post('/player/challenge', {
          challengerId: member.id,
          opponentId: pendingOpponentId,
          pointsStake: stake,
          isFightForTable,
          sessionId: isFightForTable ? activeSession?.id : null,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        if (res.data.success) {
          setShowStakeSelector(false);
          setPendingOpponentId(null);
          fetchChallenges();
          alert("ARENA CHALLENGE DEPLOYED.");
        }
      } catch (err: any) { alert(err.response?.data?.message || "DEPLOYMENT FAILED."); }
    }, async () => {
      try {
        const res = await api.post('/player/challenge', {
          challengerId: member.id,
          opponentId: pendingOpponentId,
          pointsStake: stake,
          isFightForTable,
          sessionId: isFightForTable ? activeSession?.id : null
        });
        if (res.data.success) {
          setShowStakeSelector(false);
          setPendingOpponentId(null);
          fetchChallenges();
          alert("ARENA CHALLENGE DEPLOYED.");
        }
      } catch (err: any) { alert(err.response?.data?.message || "DEPLOYMENT FAILED."); }
    }, { enableHighAccuracy: true });
  };

  return (
    <div className="fade-in space-y-10 pb-40">
      <div className="pt-8">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
          PLAY <span className="text-primary">ARENA</span>
        </h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic opacity-60">Deploy Combat Protocol & Verify Identity</p>
      </div>

      {/* ─── LIVE SCOREBOARD / SESSION BANNER ─────────────────────────────────── */}
      {activeSession ? (
        <div className="fiery-card p-8 bg-primary/5 border-2 border-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Zap className="w-16 h-16 text-primary animate-pulse" />
          </div>
          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1 italic">Engagement Active</p>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{activeSession.table?.name || 'Voucher Session'}</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Elapsed Time</p>
                <p className="text-xl font-bold font-mono text-white mt-1">
                  {Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 60000)}m
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#101423] p-4 rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Billing Class</p>
                <p className="text-xs font-black text-white uppercase italic">{activeSession.billingType || 'REGULAR'}</p>
              </div>
              <div className="bg-[#101423] p-4 rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Current Bill</p>
                <p className="text-xs font-black text-emerald-400 font-mono tracking-tight">RP {(activeSession.totalAmount || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="fiery-card p-8 border-2 border-white/5 bg-[#1a1f35]/20 text-center opacity-60">
           <LayoutGrid className="w-12 h-12 text-slate-800 mx-auto mb-4" />
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No active terminal sequence detected.</p>
        </div>
      )}

      {/* ─── SCANNER ACTIONS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setShowMyQR(true)}
          className="fiery-card p-8 flex flex-col items-center gap-4 transition-all hover:bg-white/5 active:scale-95 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/40 transition-all">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Identity QR</p>
        </button>

        <button
          onClick={() => setIsScanning(true)}
          className="fiery-card p-8 flex flex-col items-center gap-4 transition-all hover:bg-white/5 active:scale-95 group"
        >
          <div className="w-16 h-16 rounded-[28px] bg-primary flex items-center justify-center fiery-glow shadow-primary/20 group-hover:scale-110 transition-transform">
            <ScanLine className="w-8 h-8 text-secondary" />
          </div>
          <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Scan Rival</p>
        </button>
      </div>

      {/* ─── KINGS OF THE ARENA ─────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">KING OF THE TABLE</h3>
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest italic opacity-60">Surveillance Live</span>
          </span>
        </div>

        {kings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            {kings.map(king => (
              <TableCard 
                key={king.tableId}
                tableId={king.tableId}
                name={king.table.name}
                type={king.table.type}
                status={king.table.status}
                isKingTable={true}
                kingInfo={{
                  name: king.king.name,
                  avatar: king.king.photo,
                  streak: king.streak
                }}
              />
            ))}
          </div>
        ) : (
          <div className="fiery-card p-16 text-center border-2 border-white/5 bg-[#1a1f35]/10 italic">
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No Kings have ascended yet.</p>
          </div>
        )}
      </div>

      {/* ─── ACTIVE CHALLENGES ─────────────────────────────────────────────── */}
      {challenges.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">ACTIVE CHALLENGES</h3>
            <span className="flex items-center gap-2">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest italic opacity-60">{challenges.length} Pending</span>
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {challenges.map(chal => (
              <div key={chal.id} className="fiery-card p-6 border-2 border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Swords className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">VS {chal.opponentId === member.id ? 'YOU' : (chal.opponent?.name || 'Rival')}</p>
                      <p className="text-lg font-black text-white uppercase italic">{chal.pointsStake} PTS STAKE</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest italic">{chal.status}</p>
                    <p className="text-[9px] text-slate-600 uppercase italic">{new Date(chal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODALS ────────────────────────────────────────────────────────── */}

      {/* Identity QR Modal */}
      {showMyQR && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-[#0a0d18]/95 backdrop-blur-2xl" onClick={() => setShowMyQR(false)} />
          <div className="relative w-full max-w-sm fiery-card rounded-[48px] p-12 border-2 border-primary/20 text-center fade-in overflow-hidden shadow-[0_0_100px_rgba(31,34,255,0.2)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">IDENTITY PROTOCOL</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10 italic">Show to rival for fast pairing</p>
            
            <div className="bg-white p-4 rounded-[32px] mx-auto mb-10 inline-block shadow-2xl">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${member.id}`} alt="QR" className="w-48 h-48" />
            </div>

            <p className="text-sm font-black text-white mb-1 uppercase tracking-tighter italic">{member.name}</p>
            <p className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest mb-10">{member.id}</p>

            <button onClick={() => setShowMyQR(false)} className="w-full py-5 fiery-btn-secondary text-[10px] font-black uppercase tracking-widest italic border border-white/5 active:scale-95 transition-all">
              TUTUP PROTOKOL
            </button>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 lg:p-12">
          <div className="absolute inset-0 bg-[#0a0d18]/98 backdrop-blur-3xl" onClick={() => setIsScanning(false)} />
          <div className="relative w-full max-w-md fiery-card rounded-[48px] p-8 lg:p-12 border-2 border-primary/40 fade-in overflow-hidden shadow-[0_0_120px_rgba(31,34,255,0.3)]">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">SCANNING RIVAL</h3>
               <button onClick={() => setIsScanning(false)} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 active:scale-90 transition-all border border-white/10">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div id="reader" className="w-full aspect-square bg-black/40 rounded-[32px] overflow-hidden border-2 border-dashed border-primary/30 mb-8 overflow-hidden" />

            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic leading-relaxed">Posisikan QR lawan di dalam kotak bidik.<br/>Pastikan pencahayaan cukup.</p>
              <div className="flex items-center justify-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                 <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] italic">Search Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stake Selector Modal */}
      {showStakeSelector && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-[#0a0d18]/95 backdrop-blur-2xl" onClick={() => { setShowStakeSelector(false); setPendingOpponentId(null); }} />
          <div className="relative w-full max-w-sm fiery-card rounded-[48px] p-12 border-2 border-primary/20 text-center fade-in overflow-hidden shadow-[0_0_100px_rgba(31,34,255,0.2)]">
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2 leading-none">DEPLOY PROTOCOL</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10 italic">Authorize point stake for combat</p>
            
            <div className="space-y-4 mb-10">
               <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 italic text-left px-2">Select Reputation Stake</p>
               <div className="grid grid-cols-2 gap-3">
                  {[100, 250, 500, 1000].map(val => (
                    <button 
                      key={val} 
                      onClick={() => setStakeAmount(val)}
                      className={`py-4 rounded-[20px] text-sm font-black transition-all border-2 italic ${stakeAmount === val ? 'bg-primary text-secondary border-primary shadow-[0_0_20px_rgba(31,34,255,0.3)]' : 'bg-white/5 text-slate-500 border-white/5'}`}
                    >
                      {val} <span className="text-[9px]">PTS</span>
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex flex-col gap-4">
               <button 
                  onClick={() => handleChallenge(stakeAmount, false)}
                  className="w-full fiery-btn-primary py-5 flex items-center justify-center gap-3 text-[11px] tracking-[0.2em] font-black italic shadow-lg shadow-primary/20"
               >
                  <Swords className="w-4 h-4" /> BASTARD DUEL
               </button>
               {activeSession && (
                 <button 
                    onClick={() => handleChallenge(stakeAmount, true)}
                    className="w-full py-5 rounded-[20px] bg-orange-500 text-white font-black text-[11px] uppercase tracking-[0.2em] italic shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3"
                 >
                    <Crown className="w-4 h-4" /> KING OF TABLE FIGHT
                 </button>
               )}
               <button onClick={() => { setShowStakeSelector(false); setPendingOpponentId(null); }} className="text-[9px] font-black text-slate-700 uppercase tracking-widest pt-4 hover:text-slate-500 transition-colors italic">Abort Engagement</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
