import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Clock, Receipt, Utensils, Activity, LogOut, Search, AlertCircle, Loader2, Plus, Minus, ShoppingBag, ArrowRightLeft, TimerReset, Package2, BarChart3, Settings as SettingsIcon, Printer, X, Trophy, Wallet, Trash2, Gift, RefreshCw, Check, Swords, Tag, ShieldCheck, ShieldAlert, Key, Copy } from 'lucide-react';
import { io } from 'socket.io-client';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';
import Inventory from './Inventory';
import Pricing from './Pricing';
import Members from './Members';
import Reports from './Reports';
import Settings from './Settings';
import Competitions from './Competitions';
import Challenges from './Challenges';
import Expenses from './Expenses';
import Incomes from './Incomes';
import FnBOrder from './FnBOrder';
import Employees from './Employees';
import Rewards from './Rewards';
import Waitlist from './Waitlist';
import Discounts from './Discounts';
import { VamosLogo } from './components/VamosLogo';
import ActivationPage from './ActivationPage';

// --- LICENSE MANAGEMENT COMPONENT (OWNER ONLY) ---
function LicenseManagement() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [licenseKey, setLicenseKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/license/status');
      setStatus(res.data.data);
    } catch (err: any) {
      setError('Gagal memuat status lisensi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/license/activate', { licenseKey });
      vamosAlert('Lisensi berhasil diperbarui!');
      fetchStatus();
      setLicenseKey('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal aktivasi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#00ff66]" /></div>;

  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#141414] border border-[#222] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck className="w-40 h-40" /></div>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 shadow-lg shadow-orange-500/5">
            <Key className="w-7 h-7 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">License & Security</h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Cashier Machine Hardware Identity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl p-6 relative group overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Hardware ID (Laptop Kasir)</label>
              <button 
                onClick={() => { navigator.clipboard.writeText(status?.machineId); setCopied(true); setTimeout(()=>setCopied(false), 2000); }}
                className="text-[10px] font-black text-[#00ff66] hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest"
              >
                {copied ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
                {copied ? 'Copied' : 'Copy ID'}
              </button>
            </div>
            <div className="font-mono text-lg font-black text-white bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
               <span className="truncate">{status?.machineId}</span>
               {status?.isActivated ? (
                 <span className="bg-[#00ff66]/10 text-[#00ff66] text-[10px] px-3 py-1 rounded-full border border-[#00ff66]/20 font-black tracking-widest">LICENSED</span>
               ) : (
                 <span className="bg-red-500/10 text-red-500 text-[10px] px-3 py-1 rounded-full border border-red-500/20 font-black tracking-widest">UNLICENSED</span>
               )}
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl p-6">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Update Activation Key</h3>
             <form onSubmit={handleActivate} className="space-y-6">
                <input 
                  type="text" 
                  value={licenseKey} 
                  onChange={e => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="VAMOS-XXXX-XXXX"
                  className="w-full bg-[#111] border border-[#222] rounded-xl px-5 py-4 text-center font-black text-xl tracking-[0.2em] focus:outline-none focus:border-orange-500 focus:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition-all uppercase placeholder:text-gray-800"
                  required
                />
                {error && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest">{error}</p>}
                <button 
                  disabled={submitting}
                  className="w-full py-5 bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.3em] hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/10 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : 'Apply New License'}
                </button>
             </form>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[#1e1e1e] flex items-center justify-between">
           <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-gray-700" />
              <p className="text-[10px] text-gray-600 font-bold uppercase italic">Lisensi terikat pada hardware laptop ini.</p>
           </div>
           <p className="text-[10px] font-black text-gray-800 tracking-[0.3em]">SECURE CORE v3.0</p>
        </div>
      </div>
    </div>
  );
}

interface AuthUser {
  id: string;
  name: string;
  role: 'ADMIN' | 'KASIR' | 'OWNER' | 'MANAGER';
  email: string;
}

interface Table {
  id: string;
  name: string;
  type: string;
  status: 'AVAILABLE' | 'PLAYING' | 'MAINTENANCE';
  relayChannel?: number;
  activeSession?: Session;
  venue?: {
    id: string;
    name: string;
    taxPercent: number;
    servicePercent: number;
  };
}

interface Session {
  id: string;
  tableId: string;
  status: 'ACTIVE' | 'PENDING' | 'CLOSED' | 'FINISHED';
  startTime: string;
  endTime?: string;
  pausedAt?: string | null;
  table?: Table;
  member?: {
    id: string;
    name: string;
    loyaltyPoints: number;
  };
  tableAmount?: number;
  fnbAmount?: number;
  totalAmount?: number;
  memberId?: string | null;
  customerName?: string;
  createdAt?: string;
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('vamos_token'));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLicensed, setIsLicensed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkLicense = async () => {
      try {
        const res = await api.get('/license/status');
        setIsLicensed(res.data.data.isActivated);
      } catch (err) {
        console.error('License check failed', err);
        setIsLicensed(false);
      }
    };
    checkLicense();
  }, []);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('vamos_user');
      if (rawUser) setUser(JSON.parse(rawUser));
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      localStorage.removeItem('vamos_user');
      localStorage.removeItem('vamos_token');
    }
  }, []);

  const handleLogin = (t: string, u: AuthUser) => {
    localStorage.setItem('vamos_token', t);
    localStorage.setItem('vamos_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('vamos_token');
    localStorage.removeItem('vamos_user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  if (isLicensed === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (isLicensed === false) {
    return <ActivationPage />;
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

// --- LOGIN COMPONENT ---
function Login({ onLogin }: { onLogin: (token: string, user: AuthUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      onLogin(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] items-center justify-center text-white">
      <div className="w-full max-w-md bg-[#141414] p-8 rounded-2xl border border-[#222222] shadow-[0_0_50px_rgba(0,255,102,0.05)]">
        <div className="flex items-center space-x-3 mb-8 justify-center">
          <VamosLogo className="w-12 h-12" glowing />
          <span className="text-3xl font-bold tracking-wider">VAMOS POOL</span>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="bg-[#ff3333]/10 border border-[#ff3333]/50 text-[#ff3333] px-4 py-3 rounded-lg flex items-center text-sm">
              <AlertCircle className="w-4 h-4 mr-2" /> {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#00ff66] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#00ff66] transition-colors"
              required
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-[#00ff66] text-[#0a0a0a] font-bold py-3 rounded-lg hover:bg-[#00e65c] transition-all flex justify-center mt-6 shadow-[0_0_15px_rgba(0,255,102,0.2)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log.in()'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- DASHBOARD COMPONENT ---
function Dashboard({ user, onLogout }: { user: AuthUser | null, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tables, setTables] = useState<Table[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pendingBills, setPendingBills] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string>('');
  const [todayRevenue, setTodayRevenue] = useState<number>(0);
  const [todayQrisRevenue, setTodayQrisRevenue] = useState<number>(0);
  const [todayCashRevenue, setTodayCashRevenue] = useState<number>(0);
  const [todayExpenses, setTodayExpenses] = useState<number>(0);
  const [utilizationSplit, setUtilizationSplit] = useState<{ dayHours: string, nightHours: string }>({ dayHours: '0.0', nightHours: '0.0' });
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [arenaPendingCount, setArenaPendingCount] = useState(0);
  const [syncCount, setSyncCount] = useState(0);
  const [unpaidDebtCount, setUnpaidDebtCount] = useState(0);
  const [redemptionPendingCount, setRedemptionPendingCount] = useState(0);

  // Hardware Init States
  const [waStatus, setWaStatus] = useState<{ isReady: boolean; isInitializing: boolean; hasQr: boolean } | null>(null);
  const [hwStatus, setHwStatus] = useState<'IDLE' | 'CHECKING' | 'ERROR' | 'READY'>('IDLE');
  const [hwProgress, setHwProgress] = useState(0);
  const [hwMessage, setHwMessage] = useState('');
  const [showHwProgress, setShowHwProgress] = useState(false);
  const [bridgeHwStatus, setBridgeHwStatus] = useState<any>(null);

  // Shift States
  const [activeShift, setActiveShift] = useState<any>(null);
  const [showStartShiftModal, setShowStartShiftModal] = useState(false);
  const [startShiftCash, setStartShiftCash] = useState<number>(0);
  const [startShiftNotes, setStartShiftNotes] = useState('');

  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [closeShiftCash, setCloseShiftCash] = useState<number>(0);
  const [closeShiftNotes, setCloseShiftNotes] = useState('');

  // Modal States
  const [checkoutBill, setCheckoutBill] = useState<any>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<string>('CASH');
  const [checkoutDiscount, setCheckoutDiscount] = useState<number>(0);
  const [checkoutReceived, setCheckoutReceived] = useState<number>(0);
  const [applyTax, setApplyTax] = useState(false);
  const [applyService, setApplyService] = useState(false);

  const [startTableId, setStartTableId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string>('');
  const [memberQuery, setMemberQuery] = useState<string>(''); // separate display value from ID
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [billingMode, setBillingMode] = useState<'OPEN' | 'PACKAGE' | 'CUSTOM'>('CUSTOM');
  const [billingClass, setBillingClass] = useState<string>('');
  const [customMinutes, setCustomMinutes] = useState<number>(60);
  const [packages, setPackages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [venueConfig, setVenueConfig] = useState<any>(null);
  const [discountCategories, setDiscountCategories] = useState<any[]>([]);
  const [pricingEstimate, setPricingEstimate] = useState<number | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [orderSessionId, setOrderSessionId] = useState<string | null>(null);
  const [cart, setCart] = useState<{ product: any, qty: number }[]>([]);

  const [moveSessionId, setMoveSessionId] = useState<string | null>(null);
  const [moveToTableId, setMoveToTableId] = useState<string>('');

  const [addDurationSessionId, setAddDurationSessionId] = useState<string | null>(null);

  const [showFnbSessionModal, setShowFnbSessionModal] = useState(false);
  const [fnbMemberId, setFnbMemberId] = useState('');
  const [memberSearchCheckout, setMemberSearchCheckout] = useState('');
  const [confirmEndSessionId, setConfirmEndSessionId] = useState<string | null>(null);

  // Active Session Detail State
  const [detailSession, setDetailSession] = useState<any>(null);

  const fixTablesStatus = async () => {
    try {
      setLoading(true);
      const res = await api.post('/system/fix-tables');
      vamosAlert(res.data.message || 'Fixed stuck tables!');
      await fetchData();
    } catch (err) {
      vamosAlert('Failed to fix tables');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/tables'),
        api.get('/sessions/active'),
        api.get('/sessions/pending'),
        api.get('/pricing/packages'),
        api.get('/products'),
        api.get('/venues'),
        api.get('/reports/daily-revenue?days=1'),
        api.get('/reports/today-utilization-split'),
        api.get('/members'),
        api.get('/discounts'),
        api.get('/waitlist'),
        api.get('/shifts/active'),
        api.get('/player/challenges/pending-verification'),
        api.get('/expenses/pending-count'),
        api.get('/loyalty/admin/redemptions/pending-count'),
        api.get('/system/unsynced-count'),
      ]);

      const [tRes, sRes, pRes, pkgRes, prodRes, vRes, revRes, utilRes, memRes, discRes, waitRes, shiftRes, arenaRes, debtRes, redRes, syncRes] = results;

      if (tRes.status === 'fulfilled') setTables(tRes.value.data.data);
      if (sRes.status === 'fulfilled') setSessions(sRes.value.data);
      if (pRes.status === 'fulfilled') {
        const pData = pRes.value.data;
        setPendingBills(Array.isArray(pData) ? pData : pData.data || []);
      }
      if (pkgRes.status === 'fulfilled') setPackages(pkgRes.value.data.data);
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data.data);
      if (vRes.status === 'fulfilled') setVenueConfig(vRes.value.data.data?.[0]);
      if (memRes.status === 'fulfilled') setMembers(memRes.value.data.data);
      if (discRes.status === 'fulfilled') setDiscountCategories(discRes.value.data.data);
      if (revRes.status === 'fulfilled' && revRes.value.data.data?.[0]) {
        const revData = revRes.value.data.data[0];
        setTodayRevenue(revData.totalRevenue);
        setTodayQrisRevenue(revData.qrisRevenue || 0);
        // Gunakan cashRevenue dari backend yang sudah dipotong Expense
        setTodayCashRevenue(revData.cashRevenue ?? (revData.totalRevenue - (revData.qrisRevenue || 0)));
        setTodayExpenses(revData.totalExpenses || 0);
      }
      if (utilRes.status === 'fulfilled') setUtilizationSplit(utilRes.value.data.data);
      if (waitRes.status === 'fulfilled') setWaitlistCount(Array.isArray(waitRes.value.data) ? waitRes.value.data.length : 0);
      if (arenaRes.status === 'fulfilled') setArenaPendingCount(arenaRes.value.data.data?.length || 0);
      if (debtRes.status === 'fulfilled') setUnpaidDebtCount((debtRes as any).value.data.count || 0);
      if (redRes.status === 'fulfilled') setRedemptionPendingCount((redRes as any).value.data.count || 0);
      if (syncRes.status === 'fulfilled') setSyncCount((syncRes as any).value.data.count || 0);

      if (shiftRes.status === 'fulfilled') {
        const shiftData = shiftRes.value.data.data;
        setActiveShift(shiftData);
        if (!shiftData) setShowStartShiftModal(true);
      }

      setFetchError('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Failed to fetch data', error);
      setFetchError(error.response?.data?.message || 'Unknown network error');
    } finally {
      setLoading(false);
    }
  };

  const checkHardware = async (silent = false) => {
    if (!silent) {
      setShowHwProgress(true);
      setHwStatus('CHECKING');
      setHwProgress(10);
      setHwMessage('Initializing Hardware Interface...');
    }

    try {
      if (!silent) {
        await new Promise(r => setTimeout(r, 600)); setHwProgress(30); setHwMessage('Opening Serial Port...');
        await new Promise(r => setTimeout(r, 800)); setHwProgress(60); setHwMessage('Detecting USB Relay Controller...');
      }

      const res = await api.get('/relay/status');
      const { data } = res.data;

      if (data.isConnected) {
        setHwStatus('READY');
        if (!silent) {
          setHwProgress(100);
          setHwMessage(`Hardware Connected on ${data.port}`);
          setTimeout(() => setShowHwProgress(false), 2000);
        }
      } else {
        setHwStatus('ERROR');
        if (!silent) {
          setHwMessage('Hardware Not Found or Offline');
          setTimeout(() => setShowHwProgress(false), 5000);
        }
      }
    } catch (err) {
      setHwStatus('ERROR');
      if (!silent) {
        setHwMessage('Could not communicate with Backend');
        setTimeout(() => setShowHwProgress(false), 5000);
      }
    }
  };

  useEffect(() => {
    fetchData();
    checkHardware(true); // Run hardware sequence silently on startup

    const socketUrl = (window.location.protocol === 'file:' || window.location.origin.includes('localhost'))
      ? 'http://localhost:3000' 
      : window.location.origin;
    const socket = io(socketUrl);

    socket.on('sessions:updated', () => fetchData());
    socket.on('orders:updated', () => fetchData());
    socket.on('waitlist:updated', () => fetchData());
    socket.on('redemptions:updated', () => fetchData());
    socket.on('notification:new', (notif: any) => {
      if (notif.type === 'REDEMPTION') {
        vamosAlert(`🆕 ${notif.title}\n${notif.message}`);
      }
    });
    socket.on('tables:updated', () => fetchData());
    socket.on('members:updated', () => {
      console.log('[Socket] Received members:updated');
      fetchData();
    });

    socket.on('bridge:hardware:status', (data: any) => {
      console.log('📡 [BRIDGE] New Hardware Status:', data);
      
      // Tampilkan notifikasi jika baru pertama kali konek
      setBridgeHwStatus((prev: any) => {
        if (!prev) {
          vamosAlert('📡 Jembatan Hardware Kasir TERDETEKSI!');
        }
        return data;
      });

      if (data.isConnected) {
        setHwStatus('READY');
      } else {
        setHwStatus('ERROR');
      }
    });



    socket.on('whatsapp:status', (status: any) => {
      setWaStatus(status);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const inter = setInterval(() => setTick(t => t + 1), 1000); // 1s visual update for timer
    return () => clearInterval(inter);
  }, []);

  // Tambahkan background sync setiap 30 detik (fallback)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update dynamic price estimate
  useEffect(() => {
    const fetchEstimate = async () => {
      if (!startTableId) {
        setPricingEstimate(null);
        return;
      }
      const table = tables.find(t => t.id === startTableId);
      if (!table) return;

      if (billingMode === 'PACKAGE' && selectedPackage) {
        const pkg = packages.find(p => p.id === selectedPackage);
        if (pkg) {
          setPricingEstimate(memberId && pkg.memberPrice ? pkg.memberPrice : pkg.price);
        }
      } else if (billingMode === 'CUSTOM') {
        try {
          const res = await api.get('/pricing/estimate', {
            params: {
              tableType: billingClass || table.type,
              durationMinutes: customMinutes,
              isMember: !!memberId
            }
          });
          setPricingEstimate(res.data.data);
        } catch (err) {
          console.error('Failed to fetch estimate', err);
          setPricingEstimate(null);
        }
      } else {
        setPricingEstimate(null);
      }
    };
    fetchEstimate();
  }, [billingMode, selectedPackage, customMinutes, memberId, startTableId, tables, packages, billingClass]);

  const startSession = async () => {
    if (!startTableId) return;
    try {
      let payload: any = { tableId: startTableId };
      if (memberId) payload.memberId = memberId;

      if (billingMode === 'PACKAGE' && selectedPackage) {
        payload.packageId = selectedPackage;
      } else if (billingMode === 'CUSTOM') {
        payload.durationOpts = customMinutes; // send in minutes
        if (billingClass) payload.billingType = billingClass;
      } else if (billingMode === 'OPEN') {
        if (billingClass) payload.billingType = billingClass;
      }

      await api.post('/sessions/start', payload);

      setStartTableId(null);
      setMemberId('');
      setMemberQuery('');
      setSelectedPackage('');
      setBillingMode('CUSTOM');
      setCustomMinutes(60);
      fetchData();
    } catch (err: any) {
      vamosAlert(err.response?.data?.message || 'Failed to start session');
    }
  };

  const moveTable = async () => {
    if (!moveSessionId || !moveToTableId) return;
    try {
      await api.post(`/sessions/move/${moveSessionId}`, { newTableId: moveToTableId });
      setMoveSessionId(null);
      setMoveToTableId('');
      fetchData();
    } catch (err: any) {
      vamosAlert(err.response?.data?.message || 'Failed to move table');
    }
  };

  const addDurationFn = async () => {
    if (!addDurationSessionId) return;
    try {
      let payload: any = {};
      if (billingMode === 'PACKAGE' && selectedPackage) {
        payload.packageId = selectedPackage;
      } else if (billingMode === 'CUSTOM') {
        payload.durationOpts = customMinutes;
      }
      if (!payload.packageId && !payload.durationOpts) {
        vamosAlert('Select package or custom duration'); return;
      }

      await api.post(`/sessions/add-duration/${addDurationSessionId}`, payload);
      setAddDurationSessionId(null);
      setSelectedPackage('');
      setBillingMode('CUSTOM');
      setCustomMinutes(60);
      fetchData();
    } catch (err: any) {
      vamosAlert(err.response?.data?.message || 'Failed to add duration');
    }
  };


  const endSession = async (sessionId: string) => {
    try {
      await api.post(`/sessions/end/${sessionId}`);

      // Fetch latest pending bills immediately
      const pendingRes = await api.get('/sessions/pending');
      const newlyEnded = pendingRes.data.data?.find((s: any) => s.id === sessionId) || pendingRes.data.find((s: any) => s.id === sessionId);

      if (newlyEnded) {
        setApplyTax(false);
        setApplyService(false);
        setCheckoutBill(newlyEnded);
      }

      fetchData();
    } catch (err: any) {
      vamosAlert(err.response?.data?.message || 'Failed to end session');
    }
  };

  const createFnbOnlySession = async () => {
    try {
      await api.post('/sessions/fnb-only', { memberId: fnbMemberId || undefined });
      setShowFnbSessionModal(false);
      setFnbMemberId('');
      fetchData();
    } catch (err: any) {
      vamosAlert(err.response?.data?.message || 'Failed to create direct F&B bill');
    }
  };

  const payBill = async () => {
    if (!checkoutBill) return;

    const subtotal = (checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0);
    const servicePercent = checkoutBill.table?.venue?.servicePercent ?? venueConfig?.servicePercent ?? 0;
    const taxPercent = checkoutBill.table?.venue?.taxPercent ?? venueConfig?.taxPercent ?? 0;

    const serviceCharge = applyService ? Math.round(subtotal * (servicePercent / 100)) : 0;
    const taxValue = applyTax ? Math.round((subtotal + serviceCharge) * (taxPercent / 100)) : 0;
    const totalWithCharges = subtotal + serviceCharge + taxValue;
    const finalAmount = Math.max(0, totalWithCharges - checkoutDiscount);

    if (checkoutMethod === 'BON') {
      try {
        await api.post(`/sessions/${checkoutBill.id}/pay-debt`, {
          discount: checkoutDiscount || 0,
          taxAmount: taxValue,
          serviceAmount: serviceCharge
        });
        setCheckoutBill(null);
        setCheckoutDiscount(0);
        setCheckoutReceived(0);
        setApplyTax(false);
        setApplyService(false);
        fetchData();
        vamosAlert('Bill berhasil dicatat sebagai BON (Piutang)');
      } catch (err: any) {
        vamosAlert(err.response?.data?.message || 'Gagal menyimpan sebagai BON');
      }
      return;
    }

    try {
      await api.post(`/sessions/${checkoutBill.id}/pay`, {
        method: checkoutMethod,
        discount: checkoutDiscount || 0,
        receivedAmount: checkoutReceived || 0,
        taxAmount: taxValue,
        serviceAmount: serviceCharge
      });
      // Show Receipt before fully closing session
      setReceiptData({
        ...checkoutBill,
        method: checkoutMethod,
        venue: venueConfig,
        paidAt: new Date(),
        discount: checkoutDiscount || 0,
        receivedAmount: checkoutReceived || 0,
        taxAmount: taxValue,
        serviceAmount: serviceCharge,
        totalAmount: totalWithCharges,
        finalAmount: finalAmount
      });
      setCheckoutBill(null);
      setCheckoutDiscount(0);
      setCheckoutReceived(0);
      setApplyTax(false);
      setApplyService(false);
      fetchData();
    } catch (err) {
      vamosAlert('Failed to process payment');
    }
  };

  const saveToPending = async () => {
    if (!checkoutBill) return;
    try {
      if (checkoutBill.status === 'FINISHED') {
        await api.post('/sessions/pending', { id: checkoutBill.id });
      }
      setCheckoutBill(null);
      setCheckoutDiscount(0);
      setCheckoutReceived(0);
      fetchData();
      vamosAlert('Session saved to pending bills');
    } catch (err) {
      vamosAlert('Failed to save as pending');
    }
  };

  const handleAddToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateCartQty = (productId: string, dir: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.qty + dir;
        return { ...item, qty: newQty > 0 ? newQty : 0 };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const submitOrder = async () => {
    if (!orderSessionId || cart.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(cart.map(item =>
        api.post(`/orders/sessions/${orderSessionId}`, {
          productId: item.product.id,
          quantity: item.qty
        })
      ));
      setOrderSessionId(null);
      setCart([]);
      fetchData();
    } catch (err) {
      vamosAlert('Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!(await vamosConfirm("Yakin ingin membatalkan pesanan ini?"))) return;
    try {
      await api.delete(`/orders/${orderId}`);
      vamosAlert('Pesanan berhasil dibatalkan!');
      setDetailSession(null); // Tutup sementara modal untuk refresh data
      fetchData();
    } catch (err: any) {
      vamosAlert(err.response?.data?.message || 'Gagal membatalkan pesanan');
    }
  };

  const handleStartShift = async () => {
    try {
      setLoading(true);
      const res = await api.post('/shifts/start', { startingCash: startShiftCash, notes: startShiftNotes });
      setActiveShift(res.data.data);
      setShowStartShiftModal(false);
      vamosAlert('Shift berhasil dibuka! Selamat bertugas.');
    } catch (err: any) {
      vamosAlert(err.response?.data?.message || 'Gagal membuka shift');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    try {
      setLoading(true);
      const res = await api.post('/shifts/close', { endingCashActual: closeShiftCash, notes: closeShiftNotes });
      setActiveShift(null);
      setShowCloseShiftModal(false);

      const { expectedCash, endingCashActual } = res.data.data;
      const diff = endingCashActual - expectedCash;

      vamosAlert(`Shift Ditutup.\n\nSistem: Rp ${expectedCash.toLocaleString()}\nAktual: Rp ${endingCashActual.toLocaleString()}\nSelisih: Rp ${diff.toLocaleString()}`);

      // Minta kasir login lagi / shift baru
      setShowStartShiftModal(true);
      setStartShiftCash(0);
      setStartShiftNotes('');
    } catch (err: any) {
      vamosAlert(err.response?.data?.message || 'Gagal menutup shift');
    } finally {
      setLoading(false);
    }
  };

  const mergedTables = tables.map(t => {
    const activeSession = sessions.find(s => s.tableId === t.id && s.status === 'ACTIVE');
    return { ...t, activeSession };
  });

  const activeCount = mergedTables.filter(t => t.status === 'PLAYING').length;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      {/* ─── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-56 lg:w-64 bg-[#111] border-r border-[#1e1e1e] flex flex-col hidden md:flex shrink-0 relative">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-[#1e1e1e]">
          <VamosLogo className="w-10 h-10" glowing />
          <div>
            <span className="text-lg font-black tracking-widest text-white">VAMOS POOL</span>
            <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">Billiard Management</p>
          </div>
        </div>

        {/* Live status badge */}
        <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: '#0d1a0d', border: '1px solid rgba(0,255,102,0.15)' }}>
          <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />
          <span className="text-[10px] font-bold text-[#00ff66] uppercase tracking-widest">Live · {activeCount} meja aktif</span>
        </div>

        {/* Cloud Sync Status */}
        <div className="mx-4 mb-4 px-3 py-2 rounded-xl flex items-center justify-between gap-2" 
          style={syncCount > 0 
            ? { background: 'rgba(255, 153, 0, 0.08)', border: '1px solid rgba(255, 153, 0, 0.2)' }
            : { background: 'rgba(0, 170, 255, 0.08)', border: '1px solid rgba(0, 170, 255, 0.2)' }
          }>
          <div className="flex items-center gap-2">
            {syncCount > 0 ? <ShieldAlert className="w-3.5 h-3.5 text-orange-400 animate-pulse" /> : <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />}
            <span className={`text-[9px] font-black uppercase tracking-widest ${syncCount > 0 ? 'text-orange-400' : 'text-sky-400'}`}>
              {syncCount > 0 ? 'Pending Sync' : 'Cloud Synced'}
            </span>
          </div>
          {syncCount > 0 && (
            <span className="bg-orange-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-lg min-w-[20px] text-center">
              {syncCount}
            </span>
          )}
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {/* Operations */}
          <p className="px-3 py-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">Operations</p>
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
          <NavItem active={activeTab === 'challenges'} onClick={() => setActiveTab('challenges')} icon={<Swords />} label="Arena Challenges" accent="gold" badge={arenaPendingCount > 0 ? arenaPendingCount : null} badgeColor="red" />
          <NavItem active={activeTab === 'bills'} onClick={() => setActiveTab('bills')} icon={<Receipt />} label="Pending Bills" badge={pendingBills.length > 0 ? pendingBills.length : null} badgeColor="red" />
          <NavItem active={activeTab === 'waitlist'} onClick={() => setActiveTab('waitlist')} icon={<Clock />} label="Waiting List" badge={waitlistCount > 0 ? waitlistCount : null} badgeColor="blue" />
          <NavItem active={activeTab === 'fnb-order'} onClick={() => setActiveTab('fnb-order')} icon={<Utensils />} label="New F&B Order" />
          <NavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package2 />} label="Store Inventory" />

          {/* Analytics */}
          <p className="px-3 pt-4 pb-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">Analytics</p>
          <NavItem active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<BarChart3 />} label="Reports" />
          <NavItem active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} icon={<Wallet />} label="Expenses" badge={unpaidDebtCount > 0 ? unpaidDebtCount : null} badgeColor="orange" />
          <NavItem active={activeTab === 'incomes'} onClick={() => setActiveTab('incomes')} icon={<ArrowRightLeft />} label="Other Incomes" accent="gold" />
          {user?.role !== 'KASIR' && (
            <NavItem active={activeTab === 'competitions'} onClick={() => setActiveTab('competitions')} icon={<Trophy />} label="Competitions" />
          )}

          {/* Management */}
          <p className="px-3 pt-4 pb-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">Management</p>
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon />} label="🚀 SYSTEM SETTINGS" accent="gold" />
          <NavItem active={activeTab === 'license'} onClick={() => setActiveTab('license')} icon={<ShieldAlert />} label="🔑 LICENSE MANAGEMENT" accent="orange" />
          <NavItem active={activeTab === 'pricing'} onClick={() => setActiveTab('pricing')} icon={<span className="font-black text-sm w-5 text-center block">$</span>} label="Pricing" />
          <NavItem active={activeTab === 'discounts'} onClick={() => setActiveTab('discounts')} icon={<Tag />} label="Discounts" />
          <NavItem active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon={<Users />} label="Members" />
          <NavItem active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} icon={<Gift />} label="Rewards & Loyalty" accent="gold" badge={redemptionPendingCount > 0 ? redemptionPendingCount : null} badgeColor="red" />
          <NavItem active={activeTab === 'employees'} onClick={() => setActiveTab('employees')} icon={<Users />} label="Employees" />
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-[#1e1e1e]">
          <div className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00ff66] to-blue-500 flex items-center justify-center font-black text-sm text-[#0a0a0a] shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: (user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'OWNER') ? '#00ff66' : '#9ca3af' }}>{user?.role || 'ADMIN'}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-3 text-gray-600 hover:text-red-400 hover:bg-red-500/5 w-full px-3 py-2 rounded-xl transition-all text-sm font-semibold">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Hardware Init Progress Overlay */}
      {showHwProgress && (
        <div className="fixed inset-0 z-[9999] bg-[#0a0a0a]/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hwStatus === 'ERROR' ? 'bg-red-500/20 text-red-500' : 'bg-[#00ff66]/20 text-[#00ff66]'}`}>
                  <Activity className={`w-6 h-6 ${hwStatus === 'CHECKING' ? 'animate-bounce' : ''}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white leading-tight">Hardware Sync</h3>
                  <p className={`text-xs font-medium uppercase tracking-widest ${hwStatus === 'ERROR' ? 'text-red-400' : 'text-[#00ff66]'}`}>
                    {hwStatus === 'CHECKING' ? 'Scanning Ports...' : hwStatus === 'READY' ? 'Connection Established' : 'System Error'}
                  </p>
                </div>
              </div>
              <span className="text-xl font-mono font-bold text-white">{hwProgress}%</span>
            </div>

            <div className="h-4 bg-[#141414] rounded-full overflow-hidden border border-[#222222] p-1">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(0,255,102,0.3)] ${hwStatus === 'ERROR' ? 'bg-red-500' : 'bg-gradient-to-r from-[#00ff66] to-[#00ffaa]'
                  }`}
                style={{ width: `${hwProgress}%` }}
              />
            </div>

            <p className="mt-6 text-center text-gray-500 text-sm font-medium animate-pulse">
              {hwMessage}
            </p>

            {hwStatus === 'ERROR' && (
              <button
                onClick={() => checkHardware()}
                className="w-full mt-8 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-bold py-3 rounded-xl transition-all uppercase tracking-widest text-xs"
              >
                Retry Configuration
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full bg-[#0a0a0a] overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-[#1e1e1e] flex items-center justify-between px-6 shrink-0" style={{ background: '#0d0d0d' }}>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-black tracking-wide text-white">
                {activeTab === 'dashboard' ? 'Live Dashboard'
                  : activeTab === 'bills' ? 'Pending Bills'
                    : activeTab === 'reports' ? 'Reports'
                      : activeTab === 'expenses' ? 'Expenses'
                        : activeTab === 'fnb-order' ? 'New F&B Order'
                          : activeTab === 'waitlist' ? 'Waiting List'
                            : activeTab === 'inventory' ? 'Store Inventory'
                              : activeTab === 'pricing' ? 'Pricing'
                                : activeTab === 'members' ? 'Members'
                                  : activeTab === 'employees' ? 'Employees'
                                    : activeTab === 'rewards' ? 'Rewards & Loyalty'
                                      : activeTab === 'competitions' ? 'Competitions'
                                        : activeTab === 'incomes' ? 'Other Incomes'
                                          : activeTab === 'settings' ? 'System Settings'
                                            : 'Vamos POS'}
              </h1>
              <p className="text-[10px] text-gray-600 font-mono">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">

            {/* Hardware Status Indicator (Mini) */}
            {!showHwProgress && (
              <div
                onClick={async () => {
                  if (hwStatus === 'ERROR' && venueConfig) {
                    try {
                      await api.put(`/venues/${venueConfig.id}`, { 
                        ...venueConfig, 
                        relayComPort: 'COM3' 
                      });
                      setVenueConfig({ ...venueConfig, relayComPort: 'COM3' });
                    } catch (err) {
                      console.error('Failed to auto-set COM3', err);
                    }
                  }
                  checkHardware();
                }}
                className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#1e1e1e] border border-[#222222] hover:bg-[#252525] cursor-pointer transition-colors"
                title="Click to re-sync hardware"
              >
                <div className={`w-2 h-2 rounded-full ${hwStatus === 'READY' ? 'bg-[#00ff66] animate-pulse shadow-[0_0_5px_#00ff66]' : 'bg-red-500 shadow-[0_0_5px_#ff0000]'}`} />
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                  HW: {bridgeHwStatus?.port || (hwStatus === 'READY' ? 'SYNC' : 'COM 3')}
                </span>
                {(user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'OWNER') && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      vamosConfirm("Tes lampu berkedip (Blink) pada Meja 1?").then(ok => {
                        if (ok) api.post('/relay/blink/1').catch(() => vamosAlert("Gagal mengirim perintah blink"));
                      });
                    }}
                    className="ml-2 px-2 py-0.5 bg-orange-500/20 hover:bg-orange-500/40 text-orange-500 text-[8px] font-black rounded border border-orange-500/30 transition-all uppercase"
                  >
                    Test Blink
                  </button>
                )}
                {bridgeHwStatus?.lastError && (
                  <span className="text-[8px] text-red-500 font-bold truncate max-w-[80px]">ERR: {bridgeHwStatus.lastError}</span>
                )}
              </div>
            )}

            {/* WhatsApp Status Indicator (VPS ONLY) */}
            {(user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'OWNER') && (
              <div 
                className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#1e1e1e] border border-[#222222] hover:bg-[#252525] cursor-pointer transition-colors"
                title={waStatus?.isReady ? "WhatsApp Connected" : waStatus?.hasQr ? "WhatsApp QR Pending" : "WhatsApp Initializing..."}
                onClick={() => setActiveTab('settings')}
              >
                <div className={`w-2 h-2 rounded-full ${waStatus?.isReady ? 'bg-[#00ff66] shadow-[0_0_5px_#00ff66]' : waStatus?.hasQr ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                  WA: {waStatus?.isReady ? 'READY' : waStatus?.hasQr ? 'SCAN QR' : 'OFFLINE'}
                </span>
              </div>
            )}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                placeholder="Cari meja..."
                className="text-sm py-2 pl-9 pr-4 w-52 rounded-xl focus:outline-none focus:border-[#00ff66] transition-colors"
                style={{ background: '#141414', border: '1px solid #1e1e1e', color: '#fff' }}
              />
            </div>
            <div className="w-px h-6 bg-[#1e1e1e]" />
            <div className="flex items-center gap-2">
              <div className="text-right flex items-center gap-3">
                {activeShift && (
                  <button
                    onClick={() => setShowCloseShiftModal(true)}
                    className="text-[10px] font-bold bg-[#ff3333]/10 text-[#ff3333] border border-[#ff3333]/30 px-2 py-1 rounded hover:bg-[#ff3333]/20 transition-colors"
                  >
                    Tutup Shift
                  </button>
                )}
                <div>
                  <p className="text-xs font-bold text-white">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: (user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'OWNER') ? '#00ff66' : '#9ca3af' }}>{user?.role || 'ADMIN'}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00ff66] to-blue-500 flex items-center justify-center font-black text-sm text-[#0a0a0a]">
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">

            {fetchError && (
              <div className="bg-[#ff3333]/10 border border-[#ff3333]/40 text-[#ff3333] px-4 py-3 rounded-xl mb-5 text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {fetchError}
              </div>
            )}

            {activeTab === 'dashboard' && (
              <>
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <LayoutDashboard className="w-5 h-5 mr-2 text-[#00ff66]" />
                    Live Table View
                  </h2>
                  <button
                    onClick={fixTablesStatus}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-all transition-all"
                    title="Fix tables stuck in PLAYING status with no active session"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Fix Stuck Tables
                  </button>
                </div>

                {loading ? (
                  <div className="flex h-64 items-center justify-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-10">
                    {mergedTables.map((table) => (
                      <TableCard
                        key={table.id}
                        table={table}
                        venue={venueConfig}
                        tick={tick}
                        onStart={() => {
                          setBillingMode('OPEN');
                          setSelectedPackage('');
                          setMemberId('');
                          setMemberQuery('');
                          setCustomMinutes(60);
                          setStartTableId(table.id);
                        }}
                        onEnd={() => table.activeSession && setConfirmEndSessionId(table.activeSession.id)}
                        onOrderFnB={() => setOrderSessionId(table.activeSession?.id || null)}
                        onMove={() => setMoveSessionId(table.activeSession?.id || null)}
                        onAddDuration={() => {
                          setBillingMode('PACKAGE');
                          setSelectedPackage('');
                          setCustomMinutes(60);
                          if (table.activeSession) setAddDurationSessionId(table.activeSession.id);
                        }}
                        onViewDetail={() => setDetailSession(table.activeSession)}
                        onToggleRelay={async (tableId: string, command: 'on' | 'off') => {
                          const t = tables.find(t => t.id === tableId);
                          if (!t) return;
                          try {
                            const channel = (t as any).relayChannel;
                            const res = await api.post(`/relay/${command}`, { channel });
                            if (res.data.success) {
                              vamosAlert(`Relay ${command.toUpperCase()} signal sent to Table ${t.name} (Channel ${channel})`);
                            } else {
                              vamosAlert(`Failed to send Relay ${command.toUpperCase()} signal.`);
                            }
                          } catch (err: any) {
                            vamosAlert(err.response?.data?.message || `Failed to trigger relay ${command}`);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'challenges' && <Challenges />}

            {activeTab === 'bills' && (
              <div className="pb-10">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex space-x-3 items-center">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <Receipt className="w-5 h-5 mr-2 text-[#ff3333]" />
                      Pending Bills
                    </h2>
                    <span className="bg-[#ff3333]/10 text-[#ff3333] px-3 py-1 rounded-full text-xs font-bold border border-[#ff3333]/30">
                      {pendingBills.length} TO PAY
                    </span>
                  </div>
                  <button
                    onClick={() => setShowFnbSessionModal(true)}
                    className="bg-[#00ff66] text-[#0a0a0a] px-4 py-2 rounded-xl font-bold flex items-center hover:bg-[#00e65c] shadow-[0_0_15px_rgba(0,255,102,0.2)] transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Direct F&B Bill
                  </button>
                </div>

                {pendingBills.length === 0 ? (
                  <div className="bg-[#141414] border border-[#222222] rounded-2xl p-12 text-center text-gray-500">
                    <Receipt className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-semibold">No pending bills at the moment.</p>
                    <p className="text-sm">All cleared or no tables have finished yet.</p>
                  </div>
                ) : (
                  <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
                        <tr>
                          {['Session', 'Tagihan', 'Biaya Meja', 'F&B', 'Total', 'Aksi'].map((col, i) => (
                            <th key={col} className={`px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-500 ${i > 2 ? 'text-right' : ''}`}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pendingBills.map(bill => (
                          <tr key={bill.id} 
                            onClick={() => setCheckoutBill(bill)}
                            className="group border-t border-[#1a1a1a] hover:bg-white/[0.05] cursor-pointer transition-colors"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-black text-sm"
                                  style={{ background: 'rgba(0,255,102,0.08)', color: '#00ff66', border: '1px solid rgba(0,255,102,0.15)' }}>
                                  {(bill.member?.name || bill.table?.name || bill.customerName || 'F').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-white">
                                    {bill.table?.name || bill.customerName || 'Direct F&B'}
                                  </p>
                                  {bill.member ? (
                                    <p className="text-[10px] font-bold mt-0.5 flex items-center gap-1" style={{ color: '#00ff66' }}>
                                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#00ff66' }} />
                                      {bill.member.name}
                                    </p>
                                  ) : bill.customerName ? (
                                    <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                                      {bill.customerName}
                                    </p>
                                  ) : (
                                    <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest mt-0.5">
                                      Walk-in
                                    </p>
                                  )}
                                  <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                                    {new Date(bill.endTime || bill.createdAt || 0).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest"
                                style={{ background: 'rgba(255,51,51,0.1)', color: '#ff5555', border: '1px solid rgba(255,51,51,0.2)' }}>
                                PENDING
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm font-mono text-gray-400 text-right">
                              Rp {(bill.tableAmount || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="px-5 py-4 text-sm font-mono text-gray-400 text-right">
                              Rp {(bill.fnbAmount || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="font-black font-mono text-base" style={{ color: '#00ff66' }}>
                                Rp {(bill.totalAmount || 0).toLocaleString('id-ID')}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex gap-2 justify-end">
                                {bill.id && (
                                  <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!bill.memberId) {
                                          setCheckoutBill(bill);
                                          vamosAlert('Pilih member terlebih dahulu di modal checkout untuk melakukan BON');
                                          return;
                                        }
                                        if (!(await vamosConfirm(`Catat tagihan ${bill.table?.name || 'FNB'} sebesar Rp ${(bill.totalAmount || 0).toLocaleString('id-ID')} sebagai BON?`))) return;
                                        try {
                                          await api.post(`/sessions/${bill.id}/pay-debt`, {
                                            discount: 0,
                                            taxAmount: 0,
                                            serviceAmount: 0
                                          });
                                          fetchData();
                                          vamosAlert('Bill berhasil dicatat sebagai BON');
                                        } catch (err: any) {
                                          vamosAlert(err.response?.data?.message || 'Gagal menyimpan sebagai BON');
                                        }
                                      }}
                                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                                    style={{ background: 'rgba(255, 153, 0, 0.1)', color: '#ff9900', border: '1px solid rgba(255, 153, 0, 0.25)' }}
                                  >
                                    BON
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); setOrderSessionId(bill.id); }}
                                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                                  style={{ background: 'rgba(255,153,0,0.1)', color: '#ff9900', border: '1px solid rgba(255,153,0,0.25)' }}
                                >
                                  + F&B
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setApplyTax(false);
                                    setApplyService(false);
                                    setCheckoutBill(bill);
                                  }}
                                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                                  style={{ background: '#ff3333', color: '#fff', boxShadow: '0 0 12px rgba(255,51,51,0.25)' }}
                                >
                                  Bayar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'fnb-order' && <FnBOrder />}
            {activeTab === 'waitlist' && <Waitlist tables={tables} members={members} />}
            {activeTab === 'pricing' && <Pricing />}
            {activeTab === 'discounts' && <Discounts />}
            {activeTab === 'members' && <Members />}
            {activeTab === 'reports' && (
              <Reports
                user={user}
                venue={venueConfig}
                todayRevenue={todayRevenue}
                todayQrisRevenue={todayQrisRevenue}
                todayCashRevenue={todayCashRevenue}
                todayExpenses={todayExpenses}
                pendingBillsCount={pendingBills.length}
                pendingBillsAmount={pendingBills.reduce((acc, b) => acc + (b.totalAmount || (b.tableAmount || 0) + (b.fnbAmount || 0) || 0), 0)}
                utilizationSplit={utilizationSplit}
              />
            )}
            {activeTab === 'expenses' && <Expenses />}
            {activeTab === 'incomes' && <Incomes />}
            {activeTab === 'employees' && <Employees />}
            {activeTab === 'competitions' && <Competitions />}
            {activeTab === 'rewards' && <Rewards />}
            {activeTab === 'settings' && <Settings />}
            {activeTab === 'license' && <LicenseManagement />}
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      {checkoutBill && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 md:p-5 border-b border-[#222222] bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black flex items-center text-white italic tracking-tight">
                <Receipt className="w-5 h-5 mr-3 text-[#00ff66]" />
                Checkout Detail
              </h2>
              <button onClick={() => setCheckoutBill(null)} className="text-gray-500 hover:text-white transition-colors bg-[#1a1a1a] hover:bg-[#222] p-2 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
              {/* Left Column: Details */}
              <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar md:border-r border-[#222222]">
                <div className="bg-[#0a0a0a] rounded-2xl border border-[#222222] overflow-hidden">
                  {/* Table & Play Time Info */}
                  <div className="p-4 md:p-5 border-b border-[#222222] bg-[#111]">
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Table Session</span>
                      <span className="font-bold text-[#00ff66] bg-[#00ff66]/10 border border-[#00ff66]/20 px-3 py-1 rounded-lg text-xs uppercase tracking-wider">{checkoutBill.table?.name || 'Walk-in F&B'}</span>
                    </div>
                    {checkoutBill.table && (
                      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                        <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-3 text-center transition-all hover:bg-[#222]">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Play Time</p>
                          <p className="text-sm font-bold text-[#00aaff] font-mono bg-[#00aaff]/10 rounded-lg py-1 inline-block px-3">
                            {checkoutBill.startTime && checkoutBill.endTime ? (
                              (() => {
                                const diff = new Date(checkoutBill.endTime).getTime() - new Date(checkoutBill.startTime).getTime();
                                const h = Math.floor(diff / 3600000);
                                const m = Math.floor((diff % 3600000) / 60000);
                                return `${h}h ${m}m`;
                              })()
                            ) : '-'}
                          </p>
                        </div>
                        <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-3 text-center transition-all hover:bg-[#222]">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Billing Type</p>
                          <p className="text-xs mt-1 font-bold text-orange-400 bg-orange-400/10 rounded-lg py-1 inline-block px-3 uppercase tracking-wider">
                            {checkoutBill.durationOpts ? 'Package' : 'Open Time'}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#222] text-sm">
                      <span className="text-gray-400 font-semibold uppercase tracking-widest text-[10px]">Pelanggan / Member</span>
                      {checkoutBill.memberId ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#ff9900] bg-[#ff9900]/10 border border-[#ff9900]/20 px-3 py-1 rounded-lg text-xs uppercase tracking-wider">
                            {checkoutBill.member?.name || members.find(m => m.id === checkoutBill.memberId)?.name || 'Member'}
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                await api.post(`/sessions/update/${checkoutBill.id}`, { memberId: null });
                                setCheckoutBill({ ...checkoutBill, memberId: null, member: null });
                                fetchData();
                              } catch (err) {
                                vamosAlert('Gagal melepas member');
                              }
                            }}
                            className="p-1 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative w-48">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Cari member..."
                            value={memberSearchCheckout}
                            onChange={(e) => setMemberSearchCheckout(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#00ff66]"
                          />
                          {memberSearchCheckout && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
                              {members
                                .filter(m => m.name.toLowerCase().includes(memberSearchCheckout.toLowerCase()) || m.phone.includes(memberSearchCheckout))
                                .map(m => (
                                  <div
                                    key={m.id}
                                    onClick={async () => {
                                      try {
                                        await api.post(`/sessions/update/${checkoutBill.id}`, { memberId: m.id });
                                        setCheckoutBill({ ...checkoutBill, memberId: m.id, member: m });
                                        setMemberSearchCheckout('');
                                        fetchData();
                                      } catch (err) {
                                        vamosAlert('Gagal memasang member');
                                      }
                                    }}
                                    className="px-3 py-2 hover:bg-white/5 cursor-pointer text-[10px] border-b border-[#222] flex justify-between items-center"
                                  >
                                    <span className="font-bold">{m.name} {m.handicap ? `- HC: ${m.handicap}` : ''}</span>
                                    <span className="text-gray-500 font-mono">{m.phone}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {checkoutBill.tableId && (
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#222] text-sm">
                        <span className="text-gray-400 font-semibold uppercase tracking-widest text-[10px]">Table Bill</span>
                        <span className="font-bold font-mono text-white text-base bg-[#1a1a1a] px-3 py-1 rounded-lg border border-[#333]">Rp {(checkoutBill.tableAmount || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* F&B Detail */}
                  <div className="p-4 md:p-5 border-b border-[#222]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Food & Beverage</span>
                      <span className="font-bold font-mono text-sm text-[#ff9900] bg-[#ff9900]/10 px-3 py-1 rounded-lg border border-[#ff9900]/20">Rp {(checkoutBill.fnbAmount || 0).toLocaleString('id-ID')}</span>
                    </div>
                    {checkoutBill.orders && checkoutBill.orders.length > 0 ? (
                      <div className="space-y-2 mt-3 bg-[#141414] p-3 rounded-xl border border-[#222]">
                        {checkoutBill.orders.map((o: any) => (
                          <div key={o.id} className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-[#222] flex items-center justify-center text-[10px] text-gray-400 font-mono font-bold">x{o.quantity}</span>
                              <span className="text-gray-300 font-semibold text-xs">{o.product?.name || 'Item'}</span>
                            </div>
                            <span className="font-mono text-gray-400 font-semibold text-xs min-w-[70px] text-right">Rp {o.total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-600 mt-2 italic text-center py-3 border border-dashed border-[#222] rounded-xl">No F&B orders in this session.</p>
                    )}
                  </div>

                  {/* Subtotals & Discounts */}
                  <div className="p-4 md:p-5 bg-[#111]">
                    <div className="flex justify-between items-center text-xs mb-4 pb-4 border-b border-[#222]">
                      <div className="flex gap-4 w-full">
                        <label className="flex-1 flex items-center justify-center p-2 rounded-xl border border-[#222] cursor-pointer group bg-[#1a1a1a] hover:bg-[#222] transition-colors relative">
                          <input type="checkbox" checked={applyService} onChange={e => setApplyService(e.target.checked)} className="peer hidden" />
                          <div className={`mr-2 w-4 h-4 rounded border flex items-center justify-center transition-all ${applyService ? 'bg-[#00ff66] border-[#00ff66]' : 'border-gray-600'}`}>
                            {applyService && <Check className="w-3 h-3 text-[#0a0a0a]" />}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${applyService ? 'text-[#00ff66]' : 'text-gray-500 group-hover:text-gray-300'}`}>Add Service</span>
                          {applyService && <div className="absolute inset-0 bg-[#00ff66]/5 rounded-xl pointer-events-none" />}
                        </label>
                        <label className="flex-1 flex items-center justify-center p-2 rounded-xl border border-[#222] cursor-pointer group bg-[#1a1a1a] hover:bg-[#222] transition-colors relative">
                          <input type="checkbox" checked={applyTax} onChange={e => setApplyTax(e.target.checked)} className="peer hidden" />
                          <div className={`mr-2 w-4 h-4 rounded border flex items-center justify-center transition-all ${applyTax ? 'bg-[#00aaff] border-[#00aaff]' : 'border-gray-600'}`}>
                            {applyTax && <Check className="w-3 h-3 text-[#0a0a0a]" />}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${applyTax ? 'text-[#00aaff]' : 'text-gray-500 group-hover:text-gray-300'}`}>Add PPN</span>
                          {applyTax && <div className="absolute inset-0 bg-[#00aaff]/5 rounded-xl pointer-events-none" />}
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-500 font-semibold uppercase tracking-widest text-[9px]">Subtotal Order</span>
                        <span className="font-bold text-gray-300 font-mono">Rp {((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)).toLocaleString('id-ID')}</span>
                      </div>
                      {applyService && (
                        <div className="flex justify-between items-center text-[11px] animate-in fade-in slide-in-from-top-1">
                          <span className="text-gray-500 font-semibold uppercase tracking-widest text-[9px]">Service Charge ({checkoutBill.table?.venue?.servicePercent || 5}%)</span>
                          <span className="font-bold text-gray-400 font-mono">Rp {Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {applyTax && (
                        <div className="flex justify-between items-center text-[11px] animate-in fade-in slide-in-from-top-1">
                          <span className="text-gray-500 font-semibold uppercase tracking-widest text-[9px]">PPN ({checkoutBill.table?.venue?.taxPercent || 11}%)</span>
                          <span className="font-bold text-gray-400 font-mono">Rp {Math.round((((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) + (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0)) * ((checkoutBill.table?.venue?.taxPercent || 11) / 100)).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t border-[#222] pt-3 mt-3">
                        <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Total Bill</span>
                        <span className="font-bold text-white font-mono text-base bg-[#1a1a1a] px-3 py-1 rounded-lg border border-[#333]">
                          Rp {(
                            ((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) +
                            (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0) +
                            (applyTax ? Math.round((((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) + (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0)) * ((checkoutBill.table?.venue?.taxPercent || 11) / 100)) : 0)
                          ).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-5 pt-5 border-t border-[#222]">
                      <div className="flex flex-col flex-[2]">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-2">Discount Category</span>
                        <select
                          className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-3 py-2.5 text-xs text-yellow-500 font-bold uppercase outline-none focus:border-yellow-500 transition-colors cursor-pointer appearance-none"
                          onChange={(e) => {
                            const catId = e.target.value;
                            if (!catId) {
                              setCheckoutDiscount(0);
                              return;
                            }
                            const cat = discountCategories.find(c => c.id === catId);
                            if (cat) {
                              if (cat.type === 'PERCENTAGE') {
                                const subtotal = (checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0);
                                const serviceCharge = applyService ? Math.round(subtotal * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0;
                                const taxValue = applyTax ? Math.round((subtotal + serviceCharge) * ((checkoutBill.table?.venue?.taxPercent || 11) / 100)) : 0;
                                const totalWithCharges = subtotal + serviceCharge + taxValue;
                                setCheckoutDiscount(Math.round((totalWithCharges * cat.value) / 100));
                              } else {
                                setCheckoutDiscount(cat.value);
                              }
                            }
                          }}
                        >
                          <option value="">NO DISCOUNT APPLIED</option>
                          {discountCategories.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.type === 'PERCENTAGE' ? `${c.value}%` : `Rp ${c.value.toLocaleString()}`})</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col flex-[1.5]">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-right mb-2">Manual Val (Rp)</span>
                        <input
                          type="text"
                          value={checkoutDiscount ? checkoutDiscount.toLocaleString('id-ID') : ''}
                          onChange={e => setCheckoutDiscount(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                          placeholder="0"
                          className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-right font-mono text-yellow-500 font-bold focus:outline-none focus:border-yellow-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment & Checkout */}
              <div className="w-full md:w-[360px] lg:w-[400px] flex flex-col bg-[#0d0d0d] shrink-0 overflow-y-auto custom-scrollbar shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10">
                <div className="p-5 md:p-6 flex-1 space-y-6 flex flex-col justify-center">

                  {/* Grand Total Highlight Box */}
                  <div className="p-6 pb-8 border border-[#00ff66]/30 rounded-3xl bg-gradient-to-br from-[#0a0a0a] to-[#001a0a] flex flex-col items-center justify-center shadow-[0_0_40px_rgba(0,255,102,0.1)] relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00ff66]/10 blur-[50px] pointer-events-none rounded-full group-hover:bg-[#00ff66]/20 transition-all duration-700" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 blur-[50px] pointer-events-none rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
                    <span className="font-black text-[#00ff66]/60 uppercase tracking-[0.3em] text-[10px] mb-3 relative z-10">Total Pembayaran</span>
                    <span className="font-black text-[#00ff66] text-3xl lg:text-4xl font-mono drop-shadow-[0_0_15px_rgba(0,255,102,0.5)] text-center relative z-10 tracking-tighter">
                      Rp {(
                        (((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) +
                          (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0) +
                          (applyTax ? Math.round((((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) + (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0)) * ((checkoutBill.table?.venue?.taxPercent || 11) / 100)) : 0)) -
                        checkoutDiscount
                      ).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <div className="flex items-center gap-3 mb-4 justify-center">
                      <div className="h-px bg-gradient-to-r from-transparent to-[#333] flex-1" />
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Metode Pembayaran</label>
                      <div className="h-px bg-gradient-to-l from-transparent to-[#333] flex-1" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                      {['CASH', 'QRIS', 'CARD', ...(checkoutBill.memberId ? ['BON'] : [])].map(method => (
                        <button
                          key={method}
                          onClick={() => setCheckoutMethod(method)}
                          className={`py-4 rounded-2xl text-xs font-black tracking-[0.1em] transition-all border ${checkoutMethod === method
                            ? 'bg-[#00ff66] text-[#0a0a0a] border-[#00ff66] shadow-[0_8px_20px_rgba(0,255,102,0.3)] scale-105 z-10'
                            : (method === 'BON' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-[#141414] text-gray-500 border-[#222222] hover:border-gray-400 hover:text-white hover:bg-[#1a1a1a]')
                            }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>

                    {/* Cash Input Drawer */}
                    <div className={`transition-all duration-500 overflow-hidden ${checkoutMethod === 'CASH' ? 'max-h-[400px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                      <div className="bg-[#111] p-5 rounded-3xl border border-[#222222] relative shadow-inner">
                        <div className="flex justify-between items-center mb-5">
                          <span className="text-gray-400 font-bold text-[11px] uppercase tracking-widest">Cash Received</span>
                          <input
                            type="text"
                            value={checkoutReceived ? checkoutReceived.toLocaleString('id-ID') : ''}
                            onChange={e => setCheckoutReceived(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                            placeholder="0"
                            className="w-[160px] bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-right focus:border-[#00ff66] font-mono text-white text-xl font-black focus:outline-none transition-all focus:shadow-[0_0_15px_rgba(0,255,102,0.1)]"
                          />
                        </div>

                        {/* Quick Cash Buttons */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                          {[50000, 100000, 150000, 'PAS'].map((amt) => {
                            const grandTotal = Math.max(0, (
                              (((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) +
                                (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0) +
                                (applyTax ? Math.round((((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) + (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0)) * ((checkoutBill.table?.venue?.taxPercent || 11) / 100)) : 0)) -
                              checkoutDiscount
                            ));
                            return (
                              <button
                                key={amt}
                                onClick={() => setCheckoutReceived(amt === 'PAS' ? grandTotal : (amt as number))}
                                className="bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-xl text-[10px] font-black tracking-wider text-gray-400 py-2 hover:text-[#00ff66] hover:border-[#00ff66]/30 transition-all active:scale-95"
                              >
                                {amt === 'PAS' ? 'UANG PAS' : `${(amt as number) / 1000}K`}
                              </button>
                            );
                          })}
                        </div>

                        {/* Insufficient Cash Warning */}
                        {checkoutReceived > 0 && checkoutReceived < Math.max(0, (
                          (((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) +
                            (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0) +
                            (applyTax ? Math.round((((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) + (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0)) * ((checkoutBill.table?.venue?.taxPercent || 11) / 100)) : 0)) -
                          checkoutDiscount
                        )) && (
                            <div className="text-[#ff3333] text-[10px] font-black text-center mb-4 bg-[#ff3333]/10 px-4 py-2.5 rounded-xl border border-[#ff3333]/20 uppercase tracking-[0.2em] animate-pulse">
                              ⚠️ Uang yang diterima kurang!
                            </div>
                          )}

                        <div className="flex justify-between items-center pt-5 border-t border-[#222]">
                          <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Kembalian Cash</span>
                          <span className={`font-mono font-black text-2xl px-4 py-1.5 rounded-xl bg-[#1a1a1a] border ${checkoutReceived < Math.max(0, (
                            (((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) +
                              (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0) +
                              (applyTax ? Math.round((((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) + (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0)) * ((checkoutBill.table?.venue?.taxPercent || 11) / 100)) : 0)) -
                            checkoutDiscount
                          )) ? 'text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(255,51,51,0.2)]' : 'text-[#00aaff] border-[#00aaff]/30 drop-shadow-[0_0_15px_rgba(0,170,255,0.3)]'}`}>
                            Rp {Math.max(0, checkoutReceived - Math.max(0, (
                              (((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) +
                                (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0) +
                                (applyTax ? Math.round((((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) + (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0)) * ((checkoutBill.table?.venue?.taxPercent || 11) / 100)) : 0)) -
                              checkoutDiscount
                            ))).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-[#222222] bg-[#0d0d0d] flex space-x-4 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20">
                  <button
                    onClick={saveToPending}
                    className="flex-[0.5] py-4 rounded-xl bg-transparent border-2 border-[#333] text-gray-400 font-bold hover:bg-[#1a1a1a] hover:text-white hover:border-gray-500 transition-all text-[10px] tracking-wider"
                  >
                    Hold
                  </button>
                  {(checkoutBill.memberId) && (
                    <button
                      onClick={async () => {
                        const subtotal = (checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0);
                        const serviceCharge = applyService ? Math.round(subtotal * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0;
                        const taxValue = applyTax ? Math.round((subtotal + serviceCharge) * ((checkoutBill.table?.venue?.taxPercent || 11) / 100)) : 0;
                        
                        try {
                          await api.post(`/sessions/${checkoutBill.id}/pay-debt`, {
                            discount: checkoutDiscount || 0,
                            taxAmount: taxValue,
                            serviceAmount: serviceCharge
                          });
                          setCheckoutBill(null);
                          setCheckoutDiscount(0);
                          setCheckoutReceived(0);
                          fetchData();
                          vamosAlert('Bill berhasil dicatat sebagai BON (Piutang)');
                        } catch (err: any) {
                          vamosAlert(err.response?.data?.message || 'Gagal menyimpan sebagai BON');
                        }
                      }}
                      className="flex-1 py-4 rounded-xl bg-orange-500/10 border-2 border-orange-500/30 text-orange-500 font-black uppercase tracking-[0.1em] text-xs hover:bg-orange-500/20 transition-all"
                    >
                      BAYAR BON
                    </button>
                  )}
                  <button
                    onClick={payBill}
                    disabled={checkoutMethod === 'CASH' && checkoutReceived < Math.max(0, (
                      (((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) +
                        (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0) +
                        (applyTax ? Math.round((((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) + (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0)) * ((checkoutBill.table?.venue?.taxPercent || 11) / 100)) : 0)) -
                      checkoutDiscount
                    ))}
                    className="flex-[1.5] py-4 rounded-xl bg-[#00ff66] text-[#0a0a0a] font-black uppercase tracking-[0.1em] text-sm hover:bg-[#00e65c] hover:shadow-[0_0_25px_rgba(0,255,102,0.5)] hover:-translate-y-1 transition-all duration-300 disabled:shadow-none disabled:bg-[#333] disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {checkoutMethod === 'CASH' && checkoutReceived < Math.max(0, (
                      (((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) +
                        (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0) +
                        (applyTax ? Math.round((((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) + (applyService ? Math.round(((checkoutBill.tableAmount || 0) + (checkoutBill.fnbAmount || 0)) * ((checkoutBill.table?.venue?.servicePercent || 5) / 100)) : 0)) * ((checkoutBill.table?.venue?.taxPercent || 11) / 100)) : 0)) -
                      checkoutDiscount
                    )) ? 'UANG KURANG' : 'PROCESS PAYMENT'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* F&B Session Modal */}
      {showFnbSessionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-6 border-b border-[#222222]">
              <h2 className="text-xl font-bold flex items-center">
                <Utensils className="w-5 h-5 mr-3 text-[#00ff66]" />
                Direct F&B Bill
              </h2>
              <p className="text-sm text-gray-400 mt-2">Create a bill for walk-in or member F&B orders without a table.</p>
            </div>
            <div className="p-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Search Member (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={fnbMemberId}
                  onChange={e => setFnbMemberId(e.target.value)}
                  placeholder="Name or Phone..."
                  className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#00ff66] transition-colors"
                />
                {fnbMemberId && fnbMemberId.length > 1 && !members.find((m: any) => m.id === fnbMemberId) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#141414] border border-[#222222] rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
                    {members.filter((m: any) => m.name.toLowerCase().includes(fnbMemberId.toLowerCase()) || m.phone.includes(fnbMemberId)).map((m: any) => (
                      <div key={m.id} onClick={() => setFnbMemberId(m.id)}
                        className="px-4 py-3 hover:bg-white/5 cursor-pointer text-sm border-b border-[#222222] flex justify-between items-center">
                        <span className="font-bold">{m.name} {m.handicap ? `- HC: ${m.handicap}` : ''}</span>
                        <span className="text-gray-500 font-mono text-xs">{m.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {members.find((m: any) => m.id === fnbMemberId) && (
                <p className="text-xs text-[#00ff66] mt-2 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-[#00ff66] mr-2"></span>
                  Selected Member: {members.find((m: any) => m.id === fnbMemberId)?.name}
                </p>
              )}
            </div>
            <div className="p-6 border-t border-[#222222] flex space-x-3">
              <button onClick={() => setShowFnbSessionModal(false)} className="flex-1 py-3 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white font-semibold">Cancel</button>
              <button onClick={createFnbOnlySession} className="flex-1 py-3 rounded-xl bg-[#00ff66] text-[#0a0a0a] font-bold hover:bg-[#00e65c]">Create Bill</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Start Session Modal ────────────────────────────────── */}
      {startTableId && (() => {
        const startTable = tables.find(t => t.id === startTableId);
        const selectedMember = members.find((m: any) => m.id === memberId);
        // Pricing estimate is now handled by useEffect state

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-[2rem] w-full max-w-4xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-500">
              
              {/* Premium Header */}
              <div className="px-8 py-3.5 border-b border-[#1e1e1e] bg-gradient-to-r from-[#111] via-[#0a0a0a] to-[#111] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00ff66]/20 to-blue-500/20 border border-[#00ff66]/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.1)]">
                    <Activity className="w-6 h-6 text-[#00ff66]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Start New Session</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Initialize play time and billing mode</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Assigned Table</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-[#00ff66] font-mono tracking-tighter">
                        {startTable?.name || 'MEJA 00'}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {startTable?.type || 'REGULAR'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  
                  {/* Left Column: Member & Modes */}
                  <div className="space-y-4">
                    {/* Member Selection Section */}
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff66]/20 to-blue-500/20 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
                      <div className="relative bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-center mb-0.5">
                          <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                            <Users className="w-3.5 h-3.5 text-[#00ff66]" />
                            Customer / Member (Optional)
                          </label>
                          <button 
                            onClick={(e) => { e.preventDefault(); fetchData(); }}
                            className="p-1 hover:bg-white/5 rounded-lg text-gray-600 hover:text-[#00ff66] transition-all"
                            title="Refresh Member Data"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            type="text"
                            value={selectedMember ? selectedMember.name : memberQuery}
                            onChange={e => {
                              if (selectedMember) setMemberId('');
                              setMemberQuery(e.target.value);
                            }}
                            placeholder="Cari nama atau nomor HP..."
                            className="w-full bg-[#050505] border border-[#222] rounded-xl pl-10 pr-10 py-3.5 focus:outline-none focus:border-[#00ff66] transition-all text-sm font-bold placeholder:text-gray-700"
                            style={selectedMember ? { borderColor: '#00ff66', color: '#00ff66' } : {}}
                          />
                          {selectedMember && (
                            <button
                              onClick={() => { setMemberId(''); setMemberQuery(''); }}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Search Results Dropdown */}
                        {!selectedMember && memberQuery.length > 1 && (() => {
                          const filtered = members.filter((m: any) =>
                            m.name?.toLowerCase().includes(memberQuery.toLowerCase()) ||
                            m.phone?.includes(memberQuery)
                          );
                          return (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-[#222] rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                              {filtered.length > 0 ? filtered.map((m: any) => (
                                <div key={m.id} onClick={() => { setMemberId(m.id); setMemberQuery(''); }}
                                  className="px-5 py-4 hover:bg-[#00ff66]/5 cursor-pointer flex justify-between items-center border-b border-[#1a1a1a] last:border-0 group">
                                  <div>
                                    <p className="font-black text-sm text-white group-hover:text-[#00ff66] transition-colors">{m.name}</p>
                                    <p className="text-[10px] text-gray-500 font-mono mt-0.5 tracking-wider">{m.phone}</p>
                                  </div>
                                  <div className="bg-[#00ff66]/10 px-3 py-1 rounded-lg border border-[#00ff66]/20">
                                    <p className="text-[10px] font-black text-[#00ff66] uppercase">{m.loyaltyPoints || 0} PTS</p>
                                  </div>
                                </div>
                              )) : (
                                <div className="px-5 py-8 text-center"><p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No matching members</p></div>
                              )}
                            </div>
                          );
                        })()}

                        {selectedMember && (
                          <div className="bg-[#00ff66]/5 border border-[#00ff66]/20 rounded-xl p-4 flex items-center gap-4 animate-in slide-in-from-left-2 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ff66] to-blue-500 flex items-center justify-center font-black text-white text-lg shadow-[0_4px_12px_rgba(0,255,102,0.3)]">
                              {selectedMember.name?.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-black text-white tracking-tight leading-none mb-1">{selectedMember.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-[#00ff66] uppercase tracking-widest">{selectedMember.memberType || 'VAMOS MEMBER'}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                <span className="text-[9px] text-gray-500 font-mono">{selectedMember.phone}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Billing Class (Rate Selection) */}
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Pilih Kelas Harga</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['REGULAR', 'EXEBITION'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setBillingClass(type)}
                            className={`p-3 rounded-xl border font-black text-[10px] tracking-widest uppercase transition-all ${
                              (billingClass || startTable?.type || 'REGULAR') === type
                                ? 'bg-white/10 border-[#00ff66] text-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.1)]'
                                : 'bg-[#0d0d0d] border-[#1e1e1e] text-gray-600 hover:border-gray-500'
                            }`}
                          >
                            {type === 'EXEBITION' ? 'Exhibition (500/Min)' : type}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-gray-700 italic px-1">
                        * Pilih "Exhibition" untuk tarif per menit Rp 500. Pilih "Regular" untuk tarif per jam normal.
                      </p>
                    </div>

                    {/* Billing Mode Grid */}
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Select Billing Mode</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { key: 'OPEN', label: 'Open Time', icon: <Clock className="w-4 h-4" />, color: '#00aaff' },
                          { key: 'PACKAGE', label: 'Paket Promo', icon: <Package2 className="w-4 h-4" />, color: '#ff9900' },
                          { key: 'CUSTOM', label: 'Jam Tetap', icon: <TimerReset className="w-4 h-4" />, color: '#00ff66' },
                        ].map(({ key, label, icon, color }) => (
                          <button
                            key={key}
                            onClick={() => setBillingMode(key as any)}
                            className="relative group transition-all duration-300 transform active:scale-95"
                          >
                            <div className={`absolute -inset-[1px] rounded-2xl blur-sm transition-opacity duration-300 ${billingMode === key ? 'opacity-30' : 'opacity-0'}`} style={{ backgroundColor: color }}></div>
                            <div className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-300 ${
                              billingMode === key ? 'bg-[#0d0d0d] border-opacity-100 shadow-xl' : 'bg-[#0d0d0d] border-[#1e1e1e] border-opacity-50 hover:border-gray-600 grayscale opacity-60'
                            }`} style={billingMode === key ? { borderColor: color } : {}}>
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-colors" style={billingMode === key ? { backgroundColor: `${color}15`, color: color } : { color: '#666' }}>
                                {icon}
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-wider ${billingMode === key ? 'text-white' : 'text-gray-500'}`}>{label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Controller Area */}
                  <div className="space-y-4">
                    <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-[1.5rem] p-6 min-h-[300px] flex flex-col justify-start items-center relative overflow-hidden group">
                      {/* Animated Background Decor */}
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-all duration-1000" />
                      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#00ff66]/5 blur-[80px] rounded-full group-hover:bg-[#00ff66]/10 transition-all duration-1000" />

                      {billingMode === 'CUSTOM' && (
                        <div className="w-full space-y-5 animate-in zoom-in-95 duration-500 pt-4">
                          <div className="text-center">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 block">Set Target Duration</span>
                            <div className="flex items-center justify-center gap-8">
                              <button onClick={() => setCustomMinutes(Math.max(30, customMinutes - 30))}
                                className="w-12 h-12 rounded-2xl border border-[#222] bg-[#1a1a1a] hover:bg-[#222] flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-lg active:scale-90">
                                <Minus className="w-5 h-5" />
                              </button>
                              <div className="text-center relative">
                                <div className="flex items-baseline justify-center">
                                  <span className="text-6xl font-black font-mono text-white tracking-tighter shadow-sm">{Math.floor(customMinutes / 60)}</span>
                                  <span className="text-2xl font-black text-[#00ff66] ml-2 italic">H</span>
                                  {customMinutes % 60 > 0 && (
                                    <><span className="text-3xl font-black font-mono text-gray-400 ml-4">{customMinutes % 60}</span><span className="text-xl font-black text-gray-400 italic">M</span></>
                                  )}
                                </div>
                                <div className="mt-1 text-[10px] font-black text-gray-600 uppercase tracking-widest">{customMinutes} Total Minutes</div>
                              </div>
                              <button onClick={() => setCustomMinutes(customMinutes + 30)}
                                className="w-12 h-12 rounded-2xl border border-[#00ff66]/30 bg-[#00ff66]/10 hover:bg-[#00ff66]/20 flex items-center justify-center text-[#00ff66] transition-all shadow-[0_0_20px_rgba(0,255,102,0.1)] active:scale-90">
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex justify-center flex-wrap gap-2">
                            {[60, 120, 180].map(m => (
                              <button key={m} onClick={() => setCustomMinutes(m)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                                  customMinutes === m ? 'bg-[#00ff66] text-[#0a0a0a] border-[#00ff66] shadow-lg' : 'bg-[#141414] text-gray-500 border-[#222] hover:border-gray-500'
                                }`}>
                                {m >= 60 ? `${m/60} JAM` : `${m} MIN`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {billingMode === 'OPEN' && (
                        <div className="text-center animate-in fade-in zoom-in-95 duration-500 py-10">
                          <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-10 h-10 text-blue-500" />
                          </div>
                          <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Manual Track Mode</h3>
                          <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">Timer akan mulai berjalan tanpa batasan waktu. Tagihan dihitung per menit saat sesi berakhir.</p>
                        </div>
                      )}

                      {billingMode === 'PACKAGE' && (
                        <div className="text-center animate-in fade-in zoom-in-95 duration-500 py-10 w-full">
                           {!selectedPackage ? (
                            <div className="space-y-4">
                              <div className="w-20 h-20 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
                                <Package2 className="w-10 h-10 text-orange-500" />
                              </div>
                              <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Select Table Package</h3>
                              <p className="text-sm text-gray-500 max-w-xs mx-auto">Pilih salah satu paket promo yang tersedia di bagian bawah untuk melanjutkan.</p>
                            </div>
                           ) : (() => {
                             const pkg = packages.find(p => p.id === selectedPackage);
                             return (
                               <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#ff9900]/30 rounded-[1.5rem] p-5 w-full shadow-2xl relative overflow-hidden">
                                 <div className="absolute top-3 right-3 bg-[#ff9900] text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase italic tracking-widest">Active Package</div>
                                 <h4 className="text-[9px] font-black text-[#ff9900] uppercase tracking-[0.4em] mb-1">Package Confirmation</h4>
                                 <h3 className="text-xl font-black text-white mb-2 tracking-tighter truncate">{pkg?.name}</h3>
                                 <div className="flex justify-center items-center gap-8 border-y border-white/5 py-3 mb-3">
                                   <div className="text-center">
                                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Duration</p>
                                      <p className="text-xl font-black text-white font-mono">{pkg?.duration / 60}H</p>
                                   </div>
                                   <div className="w-px h-8 bg-white/10" />
                                   <div className="text-center">
                                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Base Price</p>
                                      <p className="text-xl font-black text-[#00ff66] font-mono">Rp {pkg?.price.toLocaleString()}</p>
                                   </div>
                                 </div>
                                 
                                 <button onClick={() => setSelectedPackage('')} className="text-[9px] font-black text-gray-500 hover:text-red-500 uppercase tracking-[0.2em] transition-colors">Clear Selection</button>
                               </div>
                             );
                           })()}
                        </div>
                      )}

                      {/* Estimate Preview */}
                      {pricingEstimate !== null && (
                        <div className="mt-auto w-full flex items-center justify-between px-6 py-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl backdrop-blur-sm animate-in slide-in-from-bottom-2">
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Estimated Bill</span>
                          <span className="text-lg font-black text-[#00ff66] font-mono tracking-tighter">Rp {Math.round(pricingEstimate).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Wide Bottom Section for Packages ── */}
                {billingMode === 'PACKAGE' && (
                  <div className="mt-2 space-y-2 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-4">
                      <h4 className="flex-none text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">Available Packages</h4>
                      <div className="flex-1 h-px bg-gradient-to-r from-[#222] to-transparent" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {packages.map((p: any) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPackage(p.id)}
                          className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-300 group overflow-hidden ${
                            selectedPackage === p.id 
                            ? 'bg-[#1a1a1a] border-[#ff9900] shadow-[0_5px_20px_rgba(255,153,0,0.15)] scale-[1.02] z-10' 
                            : 'bg-[#0d0d0d] border-[#1e1e1e] hover:border-gray-500 hover:bg-[#111]'
                          }`}
                        >
                          {selectedPackage === p.id && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#ff9900] flex items-center justify-center text-black">
                              <Check className="w-3 h-3" strokeWidth={4} />
                            </div>
                          )}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors ${
                            selectedPackage === p.id ? 'bg-[#ff9900] text-black' : 'bg-white/5 text-gray-500 group-hover:text-white'
                          }`}>
                            <Activity className="w-4 h-4" />
                          </div>
                          <h5 className={`font-black text-xs tracking-tight mb-0.5 truncate ${selectedPackage === p.id ? 'text-white' : 'text-gray-300'}`}>{p.name}</h5>
                          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-2">⏱ {p.duration / 60}H Play</p>
                          <div className="mt-auto pt-2 border-t border-white/5 flex justify-between items-baseline">
                            <span className="text-[8px] font-black text-gray-600 uppercase">Rate</span>
                            <span className={`font-black font-mono text-sm ${selectedPackage === p.id ? 'text-[#ff9900]' : 'text-gray-400'}`}>
                              Rp {(selectedMember && p.memberPrice ? p.memberPrice : p.price).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {packages.length === 0 && (
                      <div className="py-12 bg-white/5 border border-dashed border-[#222] rounded-3xl text-center">
                        <Package2 className="w-10 h-10 text-gray-700 mx-auto mb-4 opacity-30" />
                        <p className="text-xs text-gray-600 font-black uppercase tracking-widest">No promo packages active</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="px-6 py-2.5 border-t border-[#1e1e1e] bg-[#0d0d0d] flex gap-4 shrink-0">
                <button
                  onClick={() => { setStartTableId(null); setMemberId(''); setMemberQuery(''); }}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border border-[#1e1e1e] text-gray-500 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all active:scale-95"
                >
                  Terminate
                </button>
                <button
                  onClick={startSession}
                  disabled={billingMode === 'PACKAGE' && !selectedPackage}
                  className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-[0_10px_40px_rgba(0,255,102,0.2)]"
                  style={{ background: '#00ff66', color: '#0a0a0a' }}
                >
                  <Activity className="w-5 h-5" />
                  Initialize Session
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* F&B Order Modal */}
      {orderSessionId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex h-[80vh]">

            {/* Products Menu */}
            <div className="flex-[2] flex flex-col border-r border-[#222222]">
              <div className="p-6 border-b border-[#222222]">
                <h2 className="text-xl font-bold flex items-center">
                  <Utensils className="w-5 h-5 mr-3 text-[#ff9900]" />
                  Food & Beverage Menu
                </h2>
              </div>
              <div className="p-6 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className="p-4 bg-[#0a0a0a] border border-[#222222] rounded-xl text-left hover:border-[#ff9900]/50 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400 font-semibold">{p.category || 'Snack'}</span>
                      {p.stock <= 0 && <span className="text-xs text-[#ff3333] font-bold">SOLD OUT</span>}
                    </div>
                    <h3 className="font-bold text-sm mb-1 line-clamp-2">{p.name}</h3>
                    <p className="text-[#ff9900] font-bold font-mono">Rp {p.price.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart */}
            <div className="flex-1 flex flex-col bg-[#0a0a0a]">
              <div className="p-6 border-b border-[#222222]">
                <h2 className="text-lg font-bold flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-3 text-white" />
                  Cart Order
                </h2>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 mt-10">Select products to add to cart</p>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between border-b border-[#222222] pb-3">
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-sm">{item.product.name}</p>
                        <p className="text-[#ff9900] text-xs font-mono">Rp {(item.product.price * item.qty).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center space-x-2 bg-[#141414] rounded-lg border border-[#222222]">
                        <button onClick={() => updateCartQty(item.product.id, -1)} className="p-2 hover:text-[#ff3333]"><Minus className="w-3 h-3" /></button>
                        <span className="font-bold text-sm w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.product.id, 1)} className="p-2 hover:text-[#00ff66]"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-[#222222]">
                <div className="flex justify-between mb-4">
                  <span className="font-semibold text-gray-400">Total Items</span>
                  <span className="font-bold">{cart.reduce((a, b) => a + b.qty, 0)}</span>
                </div>
                <div className="flex justify-between mb-6">
                  <span className="font-bold">Total Amout</span>
                  <span className="font-bold text-xl text-[#ff9900]">Rp {cart.reduce((a, b) => a + (b.product.price * b.qty), 0).toLocaleString()}</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => { setOrderSessionId(null); setCart([]); }}
                    className="py-3 px-4 rounded-xl bg-[#141414] border border-[#222222] text-white font-semibold hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitOrder}
                    disabled={cart.length === 0}
                    className="flex-1 py-3 rounded-xl bg-[#ff9900] text-[#0a0a0a] font-bold hover:bg-[#ffaa33] shadow-[0_0_15px_rgba(255,153,0,0.2)] transition-all disabled:opacity-50"
                  >
                    Send to Kitchen
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Move Table Modal */}
      {moveSessionId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-6 border-b border-[#222222]">
              <h2 className="text-xl font-bold flex items-center">
                <ArrowRightLeft className="w-5 h-5 mr-3 text-[#00aaff]" />
                Move Table
              </h2>
            </div>
            <div className="p-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Destination Table</label>
              <select
                value={moveToTableId}
                onChange={e => setMoveToTableId(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#00aaff] transition-colors"
              >
                <option value="">-- Choose Available Table --</option>
                {tables.filter(t => t.status === 'AVAILABLE').map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                ))}
              </select>
            </div>
            <div className="p-6 border-t border-[#222222] flex space-x-3">
              <button onClick={() => setMoveSessionId(null)} className="flex-1 py-3 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white font-semibold">Cancel</button>
              <button onClick={moveTable} disabled={!moveToTableId} className="flex-1 py-3 rounded-xl bg-[#00aaff] text-white font-bold disabled:opacity-50">Move Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Duration Modal */}
      {addDurationSessionId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-6 border-b border-[#222222]">
              <h2 className="text-xl font-bold flex items-center">
                <TimerReset className="w-5 h-5 mr-3 text-[#bb00ff]" />
                Add Play Duration
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Addition Mode</label>
                <div className="grid grid-cols-2 gap-2 bg-[#0a0a0a] p-1 rounded-xl border border-[#222222]">
                  {['PACKAGE', 'CUSTOM'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setBillingMode(mode as any)}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${billingMode === mode
                        ? 'bg-[#222222] text-[#bb00ff] shadow-sm'
                        : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      {mode === 'PACKAGE' ? 'Promo Package' : 'Custom Mins'}
                    </button>
                  ))}
                </div>
              </div>

              {billingMode === 'PACKAGE' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <select
                    value={selectedPackage}
                    onChange={e => setSelectedPackage(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#bb00ff] transition-colors"
                  >
                    <option value="">Select Package...</option>
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - Rp {p.price.toLocaleString()} ({p.duration} mins)</option>
                    ))}
                  </select>
                </div>
              )}

              {billingMode === 'CUSTOM' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-[#0a0a0a] border border-[#222222] p-4 rounded-xl flex items-center justify-center space-x-6">
                  <button onClick={() => setCustomMinutes(Math.max(10, customMinutes - 10))} className="w-10 h-10 rounded-full border border-[#222222] bg-[#141414] hover:bg-white/5 flex items-center justify-center text-gray-400">
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="text-center w-24">
                    <span className="text-4xl font-mono font-bold text-white tracking-tighter shadow-sm">{customMinutes}</span>
                    <span className="block text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Added Mins</span>
                  </div>
                  <button onClick={() => setCustomMinutes(customMinutes + 10)} className="w-10 h-10 rounded-full border border-[#bb00ff]/30 bg-[#bb00ff]/10 text-[#bb00ff] flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-[#222222] flex space-x-3">
              <button onClick={() => setAddDurationSessionId(null)} className="flex-1 py-3 rounded-xl bg-[#0a0a0a] border border-[#222222] text-white font-semibold">Cancel</button>
              <button onClick={addDurationFn} className="flex-1 py-3 rounded-xl bg-[#bb00ff] text-white font-bold hover:bg-[#aa00ee]">Add Time</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt / Print Modal */}
      {receiptData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-5 border-b border-[#222222] flex justify-between items-center no-print">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#00ff66]" />
                Transaction Receipt
              </h2>
              <button onClick={() => setReceiptData(null)} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Printable Area */}
            <div className="px-4 py-3 bg-white max-h-[68vh] overflow-y-auto custom-scrollbar">
              <div id="printable-receipt" className="text-black font-mono text-[11px] leading-snug">

                {/* Header */}
                <div className="text-center mb-3">
                  <h1 className="font-black text-[15px] tracking-wide">{receiptData.venue?.name || 'VAMOS POS'}</h1>
                  <p className="text-[10px]">{receiptData.venue?.address || 'Billiard & Cafe'}</p>
                  <p className="mt-1 text-gray-400">{'- '.repeat(19)}</p>
                </div>

                {/* Bill Info */}
                <div className="mb-3 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-bold">{new Date(receiptData.paidAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date(receiptData.paidAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bill #</span>
                    <span className="font-bold">{receiptData.id?.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Table</span>
                    <span className="font-bold">{receiptData.table?.name || '-'}</span>
                  </div>
                  {receiptData.memberId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Member</span>
                      <span className="font-bold">{receiptData.member?.name || receiptData.memberId}</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-300">{'- '.repeat(19)}</p>

                {/* ── TABLE / PLAY TIME ── */}
                {(() => {
                  const startMs = receiptData.startTime ? new Date(receiptData.startTime).getTime() : null;
                  const endMs = receiptData.endTime ? new Date(receiptData.endTime).getTime() : null;
                  const mins = startMs && endMs ? Math.round((endMs - startMs) / 60000) : null;
                  const hrs = mins !== null ? Math.floor(mins / 60) : null;
                  const remMins = mins !== null ? mins % 60 : null;
                  return (
                    <div className="my-2">
                      <p className="font-black text-[10px] uppercase tracking-widest text-gray-500 mb-1">Billiard / Table Session</p>
                      <div className="flex justify-between">
                        <span>
                          {mins !== null
                            ? `${hrs}h ${remMins}m play time`
                            : 'Table session'}
                        </span>
                        <span className="font-bold">Rp {Math.round(receiptData.tableAmount || 0).toLocaleString('id-ID')}</span>
                      </div>
                      {receiptData.pricingName && (
                        <div className="text-gray-500 text-[10px]">({receiptData.pricingName})</div>
                      )}
                    </div>
                  );
                })()}

                {/* ── F&B ORDERS ── */}
                {receiptData.orders && receiptData.orders.length > 0 && (
                  <div className="my-2">
                    <p className="font-black text-[10px] uppercase tracking-widest text-gray-500 mb-1">Food & Beverage Orders</p>
                    {receiptData.orders.map((o: any, i: number) => (
                      <div key={i} className="flex justify-between mb-0.5">
                        <span className="flex-1">{o.product?.name || 'Item'} <span className="text-gray-500">x{o.quantity}</span></span>
                        <span className="font-bold ml-2">Rp {Math.round(o.total || 0).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                      <span className="text-gray-500">F&B Subtotal</span>
                      <span className="font-bold">Rp {Math.round(receiptData.fnbAmount || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}
                {(!receiptData.orders || receiptData.orders.length === 0) && (receiptData.fnbAmount || 0) > 0 && (
                  <div className="my-2">
                    <div className="flex justify-between">
                      <span>F&B Charges</span>
                      <span className="font-bold">Rp {Math.round(receiptData.fnbAmount || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}

                <p className="text-gray-300">{'- '.repeat(19)}</p>

                {/* Totals */}
                <div className="space-y-1 my-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp {((receiptData.tableAmount || 0) + (receiptData.fnbAmount || 0)).toLocaleString()}</span>
                  </div>
                  {receiptData.serviceAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charge</span>
                      <span>Rp {(receiptData.serviceAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {receiptData.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span>PPN</span>
                      <span>Rp {(receiptData.taxAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {receiptData.discount > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Discount</span>
                      <span>-Rp {receiptData.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-[13px] pt-1 mt-1 border-t border-dashed border-gray-200">
                    <span>TOTAL</span>
                    <span>Rp {(receiptData.finalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-gray-300">{'- '.repeat(19)}</p>

                {/* Payment */}
                <div className="space-y-0.5 my-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-bold uppercase">{receiptData.method || '-'}</span>
                  </div>
                  {(receiptData.receivedAmount || 0) > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Diterima</span>
                        <span>Rp {Math.round(receiptData.receivedAmount).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-500">Kembalian</span>
                        <span>Rp {Math.max(0, Math.round((receiptData.receivedAmount || 0) - (receiptData.finalAmount ?? receiptData.totalAmount ?? 0))).toLocaleString('id-ID')}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kasir</span>
                    <span>{receiptData.cashier?.name || user?.name || 'Admin'}</span>
                  </div>
                </div>

                {/* Footer */}
                <p className="text-gray-300">{'- '.repeat(19)}</p>
                <div className="text-center italic mt-3 mb-1 space-y-0.5">
                  <p className="font-bold">Terima kasih telah bermain!</p>
                  <p className="text-gray-500">Powered by VamosPOS</p>
                </div>

              </div>
            </div>

            <div className="p-4 border-t border-[#222222] flex gap-3 no-print">
              <button
                onClick={() => setReceiptData(null)}
                className="flex-1 py-3 rounded-xl bg-[#0a0a0a] border border-[#222] text-gray-400 font-semibold hover:bg-white/5 transition-all text-sm"
              >
                Tutup
              </button>
              <button
                onClick={() => { window.print(); }}
                className="flex-1 py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all"
                style={{ background: '#00ff66', color: '#0a0a0a', boxShadow: '0 0 15px rgba(0,255,102,0.2)' }}
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Session Detail Modal */}
      {detailSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[#222222] bg-[#0a0a0a]">
              <h2 className="text-lg font-bold flex justify-center items-center text-white pb-1">
                <Activity className="w-4 h-4 mr-2 text-[#00aaff]" />
                Active Session Detail
              </h2>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Time Estimation */}
              <div className="bg-[#0a0a0a] border border-[#222222] p-3 rounded-xl mb-4 text-center">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Live Subtotal (Table + F&B)</p>
                <p className="text-2xl font-black text-[#00ff66] font-mono">
                  Rp {(detailSession.tableAmount + detailSession.fnbAmount).toLocaleString('id-ID')}
                </p>
              </div>

              <h3 className="text-xs uppercase font-bold text-[#ff9900] tracking-wider mb-2 border-b border-[#222222] pb-1">Food & Beverage Items</h3>
              {detailSession.orders && detailSession.orders.length > 0 ? (
                <div className="space-y-2">
                  {detailSession.orders.map((o: any) => (
                    <div key={o.id} className="flex flex-col bg-[#0a0a0a] border border-[#222222] p-2.5 rounded-lg group relative">
                      <div className="flex justify-between w-full">
                        <span className="font-bold text-sm text-gray-200">{o.product?.name || 'Item'}</span>
                        <span className="font-mono text-gray-400 font-bold text-sm">x{o.quantity}</span>
                      </div>
                      <div className="flex justify-between w-full mt-1">
                        <span className="text-[10px] text-gray-500">Rp {(o.price || 0).toLocaleString()}</span>
                        <span className="font-mono text-[#ff9900] font-bold text-sm">Rp {o.total.toLocaleString()}</span>
                      </div>
                      {/* Tombol Cancel F&B muncul saat di-hover */}
                      <button
                        onClick={() => cancelOrder(o.id)}
                        className="absolute top-1/2 -translate-y-1/2 -right-8 opacity-0 group-hover:right-2 group-hover:opacity-100 transition-all p-2 bg-[#ff3333]/10 hover:bg-[#ff3333] text-[#ff3333] hover:text-white rounded-lg shadow-lg"
                        title="Cancel Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 italic">
                  Belum ada pesanan F&B di meja ini.
                </div>
              )}
            </div>
            <div className="p-4 bg-[#0a0a0a] border-t border-[#222222]">
              <button onClick={() => setDetailSession(null)} className="w-full py-3 rounded-xl bg-[#141414] border border-[#222222] text-white font-bold hover:bg-white/10 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Confirmation Modal */}
      {confirmEndSessionId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-yellow-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.15)] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#222222] text-center">
              <LogOut className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold flex justify-center items-center text-white mb-2">
                End Table Session?
              </h2>
              <p className="text-sm text-gray-400">This will stop the timer and generate the final bill for checkout.</p>
            </div>
            <div className="p-6 flex space-x-3 bg-[#0a0a0a]">
              <button
                onClick={() => setConfirmEndSessionId(null)}
                className="flex-1 py-3 rounded-xl bg-[#141414] border border-[#222222] text-white font-semibold hover:bg-white/5 transition-colors"
              >
                Keep Playing
              </button>
              <button
                onClick={() => {
                  endSession(confirmEndSessionId);
                  setConfirmEndSessionId(null);
                }}
                className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all"
              >
                Yes, Stop & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Shift Modal */}
      {showStartShiftModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-[#141414] border border-[#00ff66]/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,255,102,0.15)] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#222222]">
              <h2 className="text-xl font-bold flex items-center text-white">
                <Wallet className="w-5 h-5 mr-3 text-[#00ff66]" />
                Buka Shift Kasir
              </h2>
              <p className="text-xs text-gray-400 mt-2">Masukkan modal awal (cash) di laci kasir untuk memulai shift Anda.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Modal Awal Cash (Rp)</label>
                <input
                  type="number"
                  value={startShiftCash || ''}
                  onChange={e => setStartShiftCash(Number(e.target.value))}
                  placeholder="Contoh: 500000"
                  className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#00ff66] transition-colors font-mono text-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Catatan (Bila ada)</label>
                <input
                  type="text"
                  value={startShiftNotes}
                  onChange={e => setStartShiftNotes(e.target.value)}
                  placeholder="Kondisi laci, dsb..."
                  className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#00ff66] transition-colors text-sm"
                />
              </div>
            </div>
            <div className="p-6 flex space-x-3 bg-[#0a0a0a]">
              <button
                onClick={handleStartShift}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#00ff66] text-[#0a0a0a] font-black hover:bg-[#00e65c] transition-all disabled:opacity-50"
              >
                Mulai Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseShiftModal && activeShift && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-[#141414] border border-[#ff3333]/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(255,51,51,0.15)] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#222222] bg-[#0a0a0a]">
              <h2 className="text-xl font-bold flex items-center text-white">
                <LogOut className="w-5 h-5 mr-3 text-[#ff3333]" />
                Tutup Shift
              </h2>
              <p className="text-xs text-gray-400 mt-2">Menutup shift Anda saat ini. Hitung uang fisik di laci kasir.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#111] border border-[#222222] p-3 rounded-xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Shift Dimulai</p>
                <p className="text-sm font-bold text-gray-300">
                  {new Date(activeShift.startTime).toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#ff3333] uppercase tracking-wider mb-2">Total Cash Fisik di Laci</label>
                <input
                  type="number"
                  value={closeShiftCash || ''}
                  onChange={e => setCloseShiftCash(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-[#0a0a0a] border border-[#441111] rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff3333] transition-colors font-mono text-xl font-bold text-white shadow-[inset_0_0_10px_rgba(255,51,51,0.1)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Catatan Tambahan</label>
                <input
                  type="text"
                  value={closeShiftNotes}
                  onChange={e => setCloseShiftNotes(e.target.value)}
                  placeholder="Keterangan nominal selisih..."
                  className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff3333] transition-colors text-sm"
                />
              </div>
            </div>
            <div className="p-6 flex space-x-3 bg-[#0a0a0a] border-t border-[#222222]">
              <button
                onClick={() => setShowCloseShiftModal(false)}
                className="flex-[1] py-3 rounded-xl bg-transparent border border-[#2a2a2a] text-gray-400 font-semibold hover:bg-white/5 hover:text-white transition-all text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleCloseShift}
                disabled={loading}
                className="flex-[2] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: '#ff3333', color: 'white', boxShadow: '0 0 20px rgba(255,51,51,0.2)' }}
              >
                Selesaikan Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function formatDuration(session: any, _tick: number) {
  const start = new Date(session.startTime).getTime();
  const totalPausedMs = session.totalPausedMs || 0;
  const pausedAt = session.pausedAt ? new Date(session.pausedAt).getTime() : null;
  const now = pausedAt || Date.now();

  const elapsedMs = (now - start) - totalPausedMs;

  if (session.durationOpts) {
    const totalDurationMs = session.durationOpts * 60000;
    const remainingSecs = Math.max(0, Math.floor((totalDurationMs - elapsedMs) / 1000));

    const h = String(Math.floor(remainingSecs / 3600)).padStart(2, '0');
    const m = String(Math.floor((remainingSecs % 3600) / 60)).padStart(2, '0');
    const s = String(remainingSecs % 60).padStart(2, '0');
    return `-${h}:${m}:${s}`;
  } else {
    const elapsedSecs = Math.max(0, Math.floor(elapsedMs / 1000));
    const h = String(Math.floor(elapsedSecs / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsedSecs % 3600) / 60)).padStart(2, '0');
    const s = String(elapsedSecs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
}

function TableCard({ table, venue, tick, onStart, onEnd, onOrderFnB, onMove, onAddDuration, onViewDetail, onToggleRelay }: any) {
  const isPlaying = table.status === 'PLAYING' && table.activeSession;
  const isAvailable = table.status === 'AVAILABLE';

  const isTimeUp = (() => {
    if (!isPlaying || !table.activeSession?.durationOpts) return false;
    const start = new Date(table.activeSession.startTime).getTime();
    const totalPausedMs = table.activeSession.totalPausedMs || 0;
    const now = Date.now();
    const elapsedMs = (now - start) - totalPausedMs;
    const totalDurationMs = table.activeSession.durationOpts * 60000;
    return elapsedMs >= totalDurationMs;
  })();

  const warningMins = venue?.blinkWarningMinutes || 5;
  const isTimeBlinking = (() => {
    if (!isPlaying || !table.activeSession?.durationOpts || isTimeUp) return false;
    const start = new Date(table.activeSession.startTime).getTime();
    const totalPausedMs = table.activeSession.totalPausedMs || 0;
    const now = Date.now();
    const elapsedMs = (now - start) - totalPausedMs;
    const totalDurationMs = table.activeSession.durationOpts * 60000;
    const remainingMins = (totalDurationMs - elapsedMs) / 60000;
    return remainingMins > 0 && remainingMins <= warningMins;
  })();

  return (
    <div className={`bg-[#141414] border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 min-h-[260px] relative group
      ${isPlaying ?
        (isTimeUp ? 'border-yellow-500/80 shadow-[0_0_30px_rgba(234,179,8,0.25)] bg-yellow-500/5' :
          isTimeBlinking ? 'border-[#00aaff]/80 shadow-[0_0_30px_rgba(0,170,255,0.4)] bg-[#00aaff]/5 animate-pulse' :
            'border-[#ff3333]/30 shadow-[0_0_30px_rgba(255,51,51,0.05)]') :
        isAvailable ? 'border-[#00ff66]/30 hover:shadow-[0_0_20px_rgba(0,255,102,0.05)]' :
          'border-[#222222] opacity-80'}`}
    >
      <div className="flex justify-between items-start mb-6 z-10">
        <div>
          <h3 className="text-xl font-bold mb-1">{table.name}</h3>
          <p className="text-xs text-gray-400 tracking-wider uppercase">{table.type}</p>
          {isPlaying && (() => {
            const session = table.activeSession;
            const displayName = session.memberName || session.customerName || null;
            return displayName ? (
              <p className="text-xs text-[#00ff66] font-bold mt-1 flex items-center gap-1 truncate max-w-[120px]">
                <Users className="w-3 h-3 shrink-0" />
                <span className="truncate">{displayName}</span>
              </p>
            ) : null;
          })()}
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`text-[10px] px-2 py-1 rounded border font-bold tracking-wider
             ${isPlaying ? 'bg-[#ff3333]/10 border-[#ff3333]/50 text-[#ff3333]' :
              isAvailable ? 'bg-[#00ff66]/10 border-[#00ff66]/50 text-[#00ff66]' :
                'bg-orange-500/10 border-orange-500/50 text-orange-500'}`}
          >
            {table.status}
          </span>
          {/* Quick Actions (Hover) */}
          {isPlaying && (
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-[85px]">
              <button onClick={onMove} className="w-7 h-7 bg-[#00aaff]/10 border border-[#00aaff]/30 rounded flex items-center justify-center text-[#00aaff] hover:bg-[#00aaff] hover:text-white transition-colors" title="Move Table">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={onAddDuration} className="w-7 h-7 bg-[#bb00ff]/10 border border-[#bb00ff]/30 rounded flex items-center justify-center text-[#bb00ff] hover:bg-[#bb00ff] hover:text-white transition-colors" title="Add Duration">
                <TimerReset className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-4">
        {isPlaying ? (
          <>
            <div className={`text-4xl font-mono font-bold tracking-tight mb-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all relative
              ${table.activeSession.durationOpts ? 'text-orange-400' : ''}`}>
              {formatDuration(table.activeSession, tick)}
              {isTimeUp && (
                <div className="text-[10px] text-yellow-500 text-center uppercase font-black tracking-widest mt-2 bg-yellow-500/20 py-1 px-3 rounded-full border border-yellow-500/50 w-full animate-bounce">
                  Ready To Pay
                </div>
              )}
              {isTimeBlinking && !isTimeUp && (
                <div className="text-[10px] text-[#00aaff] text-center uppercase font-black tracking-widest mt-2 bg-[#00aaff]/20 py-1 px-3 rounded-full border border-[#00aaff]/50 w-full animate-pulse">
                  Waktu Hampir Habis
                </div>
              )}
            </div>
            <div className="text-sm font-semibold text-gray-400 flex flex-col items-center relative group/hw">
              <span>{table.activeSession.durationOpts ? 'Pre-paid Package' : 'Open Time Billing'}</span>
              <button
                onClick={onViewDetail}
                className="mt-1 flex items-center shrink-0 border border-[#ff9900]/30 bg-[#ff9900]/10 px-3 py-1.5 rounded-lg hover:bg-[#ff9900] hover:text-[#0a0a0a] text-[#ff9900] transition-colors cursor-pointer group-hover:shadow-[0_0_15px_rgba(255,153,0,0.2)]"
                title="View Detail Orders"
              >
                <Utensils className="w-3.5 h-3.5 mr-1.5" />
                Rp {(table.activeSession.fnbAmount || 0).toLocaleString()}
              </button>

              {/* Hardware Retry for Playing Table */}
              {onToggleRelay && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/hw:opacity-100 transition-opacity z-20 flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); onToggleRelay(table.id, 'on'); }} className="text-[7px] font-black bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20 px-2 py-0.5 rounded hover:bg-[#00ff66] hover:text-black uppercase tracking-tighter">Retry On</button>
                  <button onClick={(e) => { e.stopPropagation(); onToggleRelay(table.id, 'off'); }} className="text-[7px] font-black bg-[#ff3333]/10 text-[#ff3333] border border-[#ff3333]/20 px-2 py-0.5 rounded hover:bg-[#ff3333] hover:text-white uppercase tracking-tighter">Force Off</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#0a0a0a] border border-[#222222] flex items-center justify-center opacity-50 relative group/icon">
            <Activity className="w-6 h-6 text-gray-600" />

            {/* Manual Hardware Test Buttons */}
            {onToggleRelay && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex space-x-1 opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap z-20">
                <button onClick={(e) => { e.stopPropagation(); onToggleRelay(table.id, 'on'); }} className="text-[9px] font-bold bg-[#00ff66]/20 text-[#00ff66] px-2 py-1 rounded hover:bg-[#00ff66] hover:text-black">TEST ON</button>
                <button onClick={(e) => { e.stopPropagation(); onToggleRelay(table.id, 'off'); }} className="text-[9px] font-bold bg-[#ff3333]/20 text-[#ff3333] px-2 py-1 rounded hover:bg-[#ff3333] hover:text-white">TEST OFF</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="mt-4 flex space-x-2">
        {isPlaying ? (
          <>
            <button
              onClick={onOrderFnB}
              className="flex-1 py-3 bg-[#141414] border border-[#ff9900]/50 text-[#ff9900] rounded-xl text-sm font-semibold hover:bg-[#ff9900] hover:text-[#0a0a0a] transition-colors flex items-center justify-center p-0 shadow-[0_0_10px_rgba(255,153,0,0.1)]"
              title="Add Food & Beverage Order"
            >
              <Utensils className="w-4 h-4 mr-2" />
              F&B Order
            </button>
            <button onClick={onEnd} className={`flex-[0.7] py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_10px_rgba(255,51,51,0.2)]
              ${isTimeUp ? 'bg-yellow-500 border-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-[#ff3333]/10 border border-[#ff3333]/30 text-[#ff3333] hover:bg-[#ff3333] hover:text-white'}
            `}>
              {isTimeUp ? 'Pay Now' : 'End Session'}
            </button>
          </>
        ) : (
          <button
            disabled={!isAvailable}
            onClick={onStart}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all
              ${isAvailable
                ? 'bg-[#00ff66] text-[#0a0a0a] hover:bg-[#00e65c] shadow-[0_0_15px_rgba(0,255,102,0.2)]'
                : 'bg-[#0a0a0a] border border-[#222222] text-gray-500 cursor-not-allowed'}`}
          >
            {isAvailable ? 'Start Session' : table.status}
          </button>
        )}
      </div>
    </div>
  );
}


interface NavItemProps {
  icon: React.ReactElement;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number | string | null;
  badgeColor?: 'red' | 'blue' | 'green' | 'orange';
  accent?: 'gold' | 'green' | 'orange';
}

function NavItem({ icon, label, active, onClick, badge, badgeColor, accent }: NavItemProps) {
  const accentColor = accent === 'gold' ? '#f59e0b' : accent === 'orange' ? '#f97316' : '#00ff66';
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
      style={active ? {
        background: `${accentColor}15`,
        color: accentColor,
        border: `1px solid ${accentColor}25`,
        fontWeight: 700
      } : {
        color: '#6b7280',
        border: '1px solid transparent'
      }}
    >
      <div className="shrink-0" style={{ color: active ? accentColor : 'inherit' }}>
        {React.cloneElement(icon as any, { style: { width: '1.1rem', height: '1.1rem' }, className: undefined } as any)}
      </div>
      <span className="text-sm flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg min-w-[20px] text-center"
          style={
            badgeColor === 'red' ? { background: 'rgba(255,51,51,0.15)', color: '#ff5555' } :
              badgeColor === 'orange' ? { background: 'rgba(249,115,22,0.15)', color: '#f97316' } :
                badgeColor === 'blue' ? { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' } :
                  { background: 'rgba(0,255,102,0.15)', color: '#00ff66' }
          }>
          {badge}
        </span>
      )}
    </button>
  );
}

export default App;
