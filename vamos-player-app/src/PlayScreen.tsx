import { useState, useEffect, useCallback, useRef } from 'react';
import { QrCode, ScanLine, Crown, Swords, LayoutGrid, Zap, X, ShieldAlert, CheckCircle2, Copy } from 'lucide-react';
import { TableCard } from './components/TableCard';
import { BulletinCarousel } from './components/BulletinCarousel';
import { io } from 'socket.io-client';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from './api';

export function PlayScreen({ member }: { member: any }) {
  const [kings, setKings] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);
  const [pendingOpponentId, setPendingOpponentId] = useState<string | null>(null);
  const [incomingChallenge, setIncomingChallenge] = useState<any | null>(null);
  const [isChoosingStake, setIsChoosingStake] = useState(false);
  const [selectedStake, setSelectedStake] = useState(0);
  const [isFightForTable, setIsFightForTable] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualOpponentId, setManualOpponentId] = useState('');

  const activeSession = member.sessions?.find((s: any) => s.status === 'ACTIVE');
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
    
    // Listen for new challenges sent to ME
    socket.on(`challenge:new:${member.id}`, (challenge) => {
        setIncomingChallenge(challenge);
        fetchChallenges();
    });

    // Listen for updates on my active challenges
    socket.on(`challenge:update:${member.id}`, fetchChallenges);

    return () => {
      clearInterval(kingInterval);
      clearInterval(chalInterval);
      socket.disconnect();
    };
  }, [fetchKings, fetchChallenges, member.id]);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isRunning = false;

    if (isScanning) {
      setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode("reader");
          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              setPendingOpponentId(decodedText);
              setIsScanning(false);
              setIsChoosingStake(true); // Open stake selection instead of direct deploy
              if (isRunning) html5QrCode?.stop().catch(console.error);
            },
            () => { }
          ).then(() => {
            isRunning = true;
          }).catch(err => {
            console.error("Camera start failed", err);
            html5QrCode?.start(
              { facingMode: "user" },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText) => {
                setPendingOpponentId(decodedText);
                setIsScanning(false);
                setIsChoosingStake(true);
                if (isRunning) html5QrCode?.stop().catch(console.error);
              },
              () => { }
            ).then(() => {
                isRunning = true;
            }).catch(console.error);
          });
          
          scannerRef.current = html5QrCode as any;
        } catch (e) {
          console.error("Scanner init error", e);
        }
      }, 300);
    } else {
      if (scannerRef.current) {
        try {
          const scanner = scannerRef.current as any;
          if (scanner.getState && scanner.getState() === 2) { // 2 = SCANNING
             scanner.stop().catch(() => {});
          }
          scanner.clear?.();
        } catch (e) {}
        scannerRef.current = null;
      }
    }
  }, [isScanning]);

  const handleDeployChallenge = async () => {
    if (!pendingOpponentId) return;
    try {
        const res = await api.post('/player/challenge', {
          challengerId: member.id,
          opponentId: pendingOpponentId,
          pointsStake: selectedStake, 
          isFightForTable,
          sessionId: isFightForTable ? activeSession?.id : null
        });
        if (res.data.success) {
          setPendingOpponentId(null);
          setIsChoosingStake(false);
          fetchChallenges();
          alert("PROTOCOL DEPLOYED. WAITING FOR RIVAL CONFIRMATION.");
        }
      } catch (err: any) { alert(err.response?.data?.message || "DEPLOYMENT FAILED."); }
  };

  const reportVictory = async (challengeId: string) => {
    if (!window.confirm("ARE YOU SURE YOU WON THIS MATCH? Lying will result in account suspension.")) return;
    try {
        const res = await api.put(`/player/challenge/${challengeId}/claim-victory`, {
            winnerId: member.id
        });
        if (res.data.success) {
            fetchChallenges();
            alert("VICTORY REPORTED. AWAITING CASHIER VERIFICATION.");
        }
    } catch (err: any) { alert(err.response?.data?.message || "REPORT FAILED."); }
  };

  const respondToChallenge = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    if (!id) return alert("PROTOCOL ERROR: MISSING CHALLENGE ID.");
    try {
        const res = await api.put(`/player/challenge/${id}/respond`, { status });
        if (res.data.success) {
            setIncomingChallenge(null);
            // Wait slightly for DB to propagate before fetching
            setTimeout(() => {
                fetchChallenges();
                if (status === 'ACCEPTED') {
                    alert("MATCH PROTOCOL INITIATED.");
                } else {
                    alert("PROTOCOL ABORTED.");
                }
            }, 500);
        }
    } catch (err: any) { 
        alert(err.response?.data?.message || "RESPONSE FAILED."); 
        setIncomingChallenge(null);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(member.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fade-in space-y-10 pb-40">
      <div className="pt-8">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
          PLAY <span className="text-primary">ARENA</span>
        </h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic opacity-60">Deploy Combat Protocol & Verify Identity</p>
      </div>

      <BulletinCarousel />

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
              <span className="text-[10px] font-black text-primary uppercase tracking-widest italic opacity-60">{challenges.length} Engagement</span>
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {challenges.map(chal => (
              <div key={chal.id} className={`fiery-card p-6 border-2 transition-all ${chal.status === 'WAITING_VERIFICATION' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-primary/20 bg-primary/5'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Swords className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">VS {chal.opponentId === member.id ? (chal.challenger?.name || 'Rival') : (chal.opponent?.name || 'Rival')}</p>
                      <p className="text-lg font-black text-white uppercase italic">
                        {chal.isFightForTable ? 'KING FIGHT' : 'DUEL MATCH'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black uppercase tracking-widest italic ${chal.status === 'ACCEPTED' ? 'text-emerald-400' : chal.status === 'WAITING_VERIFICATION' ? 'text-yellow-400' : 'text-primary'}`}>{chal.status}</p>
                    <p className="text-[9px] text-slate-600 uppercase italic">{new Date(chal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5 mb-4">
                    <div className="flex items-center gap-2">
                        <Zap size={14} className="text-yellow-400" />
                        <span className="text-[10px] font-black text-white uppercase italic">STAKE: {chal.pointsStake || 0} PTS</span>
                    </div>
                    {chal.isFightForTable && (
                         <div className="flex items-center gap-2">
                            <Crown size={14} className="text-primary" />
                            <span className="text-[10px] font-black text-primary uppercase italic">FOR TABLE</span>
                        </div>
                    )}
                </div>

                {chal.status === 'ACCEPTED' && (
                    <button 
                        onClick={() => reportVictory(chal.id)}
                        className="w-full py-4 fiery-btn-primary flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] italic"
                    >
                        <CheckCircle2 size={16} /> LAPORKAN KEMENANGAN (CLAIM)
                    </button>
                )}

                {chal.status === 'WAITING_VERIFICATION' && (
                     <div className="w-full py-4 text-center rounded-xl bg-yellow-400/10 border border-yellow-400/20">
                        <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest italic">Wait for cashier verification...</p>
                     </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODALS ────────────────────────────────────────────────────────── */}

      {/* Incoming Challenge Modal */}
      {incomingChallenge && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8">
            <div className="absolute inset-0 bg-[#0a0d18]/98 backdrop-blur-3xl animate-pulse" />
            <div className="relative w-full max-w-sm fiery-card rounded-[48px] p-12 border-4 border-primary/40 text-center scale-in overflow-hidden shadow-[0_0_150px_rgba(31,34,255,0.4)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mx-auto mb-8 fiery-glow">
                    <ShieldAlert size={40} className="text-white" />
                </div>

                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2 leading-none">WAR PROTOCOL</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-10 italic animate-pulse">Incoming Strike Detected</p>
                
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">CHALLENGER</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{incomingChallenge.challenger?.name || 'UNIDENTIFIED RIVAL'}</p>
                </div>

                <div className="flex flex-col gap-4">
                    <button 
                        onClick={() => respondToChallenge(incomingChallenge.id, 'ACCEPTED')}
                        className="w-full fiery-btn-primary py-6 flex items-center justify-center gap-3 text-sm tracking-[0.2em] font-black italic shadow-xl shadow-primary/30"
                    >
                        <CheckCircle2 className="w-5 h-5" /> LADENI DUEL
                    </button>
                    <button 
                        onClick={() => respondToChallenge(incomingChallenge.id, 'DECLINED')}
                        className="w-full py-5 rounded-[24px] bg-white/5 text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] italic hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                    >
                        KABUR / DECLINE
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Identity QR Modal */}
      {showMyQR && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-[#0a0d18]/95 backdrop-blur-2xl" onClick={() => setShowMyQR(false)} />
          <div className="relative w-full max-w-sm fiery-card rounded-[48px] p-12 border-2 border-primary/20 text-center fade-in overflow-hidden shadow-[0_0_100px_rgba(31,34,255,0.2)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">IDENTITY PROTOCOL</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10 italic">Show to rival for fast pairing</p>
            
            <div className="bg-white p-4 rounded-[32px] mx-auto mb-10 inline-block shadow-2xl">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${member.id}`} alt="QR" className="w-48 h-48" />
            </div>

            <p className="text-sm font-black text-white mb-1 uppercase tracking-tighter italic">{member.name}</p>
            <button 
              onClick={handleCopyId}
              className="group/id flex items-center justify-center gap-2 mx-auto mb-10 transition-all active:scale-95"
            >
              <p className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest">{member.id}</p>
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover/id:bg-primary/20 transition-all">
                {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} className="text-primary" />}
              </div>
            </button>

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

            <div className="mt-8 pt-8 border-t border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic text-center">RIVAL NOT DETECTED? INPUT MANUALLY</p>
                <div className="flex gap-3">
                  <div className="flex-1 bg-black/40 border-2 border-white/10 rounded-2xl p-1 px-4 flex items-center focus-within:border-primary/40 transition-all">
                    <input 
                      type="text"
                      placeholder="ENTER RIVAL UUID..."
                      value={manualOpponentId}
                      onChange={(e) => setManualOpponentId(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-white font-mono text-xs uppercase placeholder:text-slate-700"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (manualOpponentId.trim()) {
                        setPendingOpponentId(manualOpponentId.trim());
                        setIsScanning(false);
                        setIsChoosingStake(true);
                      }
                    }}
                    disabled={!manualOpponentId.trim()}
                    className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center fiery-glow disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
                  >
                    <CheckCircle2 size={24} className="text-secondary" />
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Point Stake Selection Modal */}
      {isChoosingStake && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-8">
            <div className="absolute inset-0 bg-[#0a0d18]/98 backdrop-blur-3xl" onClick={() => setIsChoosingStake(false)} />
            <div className="relative w-full max-w-sm fiery-card rounded-[48px] p-10 border-2 border-primary/40 text-center scale-in overflow-hidden shadow-[0_0_120px_rgba(31,34,255,0.3)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">ARENA STAKE</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 italic">Pilih jumlah poin yang ditaruhkan</p>
                
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {[0, 20, 50, 100].map(pts => (
                        <button 
                            key={pts}
                            onClick={() => setSelectedStake(pts)}
                            className={`py-4 rounded-2xl border-2 transition-all font-black italic text-sm ${selectedStake === pts ? 'border-primary bg-primary/20 text-white' : 'border-white/5 bg-white/5 text-slate-500'}`}
                        >
                            {pts === 0 ? 'PERSAHABATAN' : `${pts} POIN`}
                        </button>
                    ))}
                </div>

                {activeSession && (
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5 mb-8 flex items-center justify-between">
                        <div className="text-left">
                            <p className="text-[10px] font-black text-white uppercase italic">FIGHT FOR TABLE</p>
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Winnner takes the bill!</p>
                        </div>
                        <button 
                            onClick={() => setIsFightForTable(!isFightForTable)}
                            className={`w-12 h-6 rounded-full relative transition-all ${isFightForTable ? 'bg-primary' : 'bg-slate-800'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isFightForTable ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleDeployChallenge}
                        className="w-full fiery-btn-primary py-5 font-black italic tracking-[0.2em] text-xs uppercase"
                    >
                        DEPLOY CHALLENGE
                    </button>
                    <button 
                        onClick={() => setIsChoosingStake(false)}
                        className="w-full py-4 text-slate-600 font-black text-[10px] uppercase tracking-widest italic"
                    >
                        CANCEL
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
