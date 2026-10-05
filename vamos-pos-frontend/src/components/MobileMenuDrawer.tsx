import React from 'react';
import {
  X,
  ChefHat,
  Swords,
  Trophy,
  BarChart3,
  Wallet,
  ArrowRightLeft,
  Package2,
  Users,
  Gift,
  Tag,
  DollarSign,
  Settings as SettingsIcon,
  ShieldAlert,
  LogOut,
  User,
  Clock,
} from 'lucide-react';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  user: any;
  activeShift: any;
  onOpenCloseShiftModal: () => void;
  onLogout: () => void;
  pendingKdsCount?: number;
  arenaPendingCount?: number;
  redemptionPendingCount?: number;
  unpaidDebtCount?: number;
  syncCount?: number;
  hwStatus?: string;
  waStatus?: any;
  onSyncHardware?: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  user,
  activeShift,
  onOpenCloseShiftModal,
  onLogout,
  pendingKdsCount = 0,
  arenaPendingCount = 0,
  redemptionPendingCount = 0,
  unpaidDebtCount = 0,
  syncCount = 0,
  hwStatus = 'READY',
  waStatus,
  onSyncHardware,
}) => {
  if (!isOpen) return null;

  const handleSelect = (tab: string) => {
    onSelectTab(tab);
    onClose();
  };

  const isAdminOrOwner = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'OWNER';

  return (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-fade-in-fast"
      />

      {/* Drawer Container (Slide Up) */}
      <div 
        className="relative bg-[#111111] border-t border-[#2a2a2a] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.9)] max-h-[85vh] flex flex-col z-10 animate-slide-up overflow-hidden"
      >
        {/* Handle Bar & Header */}
        <div className="pt-3 pb-2 px-6 flex flex-col items-center border-b border-[#1f1f1f] bg-[#141414] shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-gray-600 mb-3 opacity-60" />
          
          <div className="w-full flex items-center justify-between">
            {/* User Profile Info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00ff66] to-sky-500 flex items-center justify-center font-black text-sm text-[#0a0a0a] shadow-[0_0_10px_rgba(0,255,102,0.3)]">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{user?.name || 'Admin'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: isAdminOrOwner ? 'rgba(0,255,102,0.15)' : 'rgba(255,255,255,0.1)',
                      color: isAdminOrOwner ? '#00ff66' : '#9ca3af',
                    }}
                  >
                    {user?.role || 'STAFF'}
                  </span>
                  {activeShift && (
                    <span className="text-[9px] text-[#00ff66] font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
                      Shift Aktif
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Shift Handover Action */}
          {activeShift && (
            <div className="w-full mt-3 pt-2.5 border-t border-[#222222] flex items-center justify-between">
              <div className="text-[11px] text-gray-400">
                Shift Operasional Kasir
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenCloseShiftModal();
                }}
                className="text-xs font-bold bg-[#ff3333]/15 text-[#ff3333] border border-[#ff3333]/40 px-3 py-1 rounded-xl hover:bg-[#ff3333]/25 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                Tutup Shift
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Menu Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 pb-safe">
          
          {/* Section: Operasional & Dapur */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
              Operasional & Dapur
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleSelect('kds')}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left relative ${
                  activeTab === 'kds'
                    ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                    : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block truncate">Kitchen KDS</span>
                  <span className="text-[9px] text-gray-400 block truncate">Pesanan Barista</span>
                </div>
                {pendingKdsCount > 0 && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black animate-pulse">
                    {pendingKdsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSelect('challenges')}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left relative ${
                  activeTab === 'challenges'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                  <Swords className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block truncate">Arena Challenge</span>
                  <span className="text-[9px] text-gray-400 block truncate">Tantangan Tamu</span>
                </div>
                {arenaPendingCount > 0 && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black">
                    {arenaPendingCount}
                  </span>
                )}
              </button>

              {isAdminOrOwner && (
                <button
                  onClick={() => handleSelect('competitions')}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left col-span-2 ${
                    activeTab === 'competitions'
                      ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400'
                      : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold block truncate">Turnamen & Bracket Pool</span>
                    <span className="text-[9px] text-gray-400 block truncate">Bagan kompetisi 16/32/64 bagan</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Section: Keuangan & Laporan */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
              Keuangan & Pembukuan
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSelect('reports')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  activeTab === 'reports'
                    ? 'bg-[#00ff66]/15 border-[#00ff66]/40 text-[#00ff66]'
                    : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                }`}
              >
                <BarChart3 className="w-5 h-5 mb-1.5 text-[#00ff66]" />
                <span className="text-[11px] font-bold block truncate w-full">Laporan</span>
                <span className="text-[8px] text-gray-400 block truncate w-full">Sales & Shift</span>
              </button>

              <button
                onClick={() => handleSelect('expenses')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all relative ${
                  activeTab === 'expenses'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                }`}
              >
                <Wallet className="w-5 h-5 mb-1.5 text-rose-400" />
                <span className="text-[11px] font-bold block truncate w-full">Pengeluaran</span>
                <span className="text-[8px] text-gray-400 block truncate w-full">Biaya Operasional</span>
                {unpaidDebtCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>

              <button
                onClick={() => handleSelect('incomes')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  activeTab === 'incomes'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                }`}
              >
                <ArrowRightLeft className="w-5 h-5 mb-1.5 text-emerald-400" />
                <span className="text-[11px] font-bold block truncate w-full">Incomes</span>
                <span className="text-[8px] text-gray-400 block truncate w-full">Pendapatan Lain</span>
              </button>
            </div>
          </div>

          {/* Section: Manajemen Toko & Tamu */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
              Inventaris, Member & Tarif
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleSelect('inventory')}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                  activeTab === 'inventory'
                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                    : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                }`}
              >
                <Package2 className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">Stok Barang</span>
                  <span className="text-[9px] text-gray-400 block truncate">Inventaris Cafe</span>
                </div>
              </button>

              <button
                onClick={() => handleSelect('members')}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                  activeTab === 'members'
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                    : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                }`}
              >
                <Users className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">Members</span>
                  <span className="text-[9px] text-gray-400 block truncate">Data Pelanggan</span>
                </div>
              </button>

              <button
                onClick={() => handleSelect('rewards')}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left relative ${
                  activeTab === 'rewards'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                }`}
              >
                <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">Loyalty Rewards</span>
                  <span className="text-[9px] text-gray-400 block truncate">Klaim Hadiah</span>
                </div>
                {redemptionPendingCount > 0 && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black">
                    {redemptionPendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSelect('pricing')}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                  activeTab === 'pricing'
                    ? 'bg-[#00ff66]/15 border-[#00ff66]/40 text-[#00ff66]'
                    : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                }`}
              >
                <DollarSign className="w-4 h-4 text-[#00ff66] shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">Tarif Meja</span>
                  <span className="text-[9px] text-gray-400 block truncate">Paket & Open</span>
                </div>
              </button>

              <button
                onClick={() => handleSelect('discounts')}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                  activeTab === 'discounts'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                }`}
              >
                <Tag className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">Voucher Diskon</span>
                  <span className="text-[9px] text-gray-400 block truncate">Kode Promo</span>
                </div>
              </button>

              <button
                onClick={() => handleSelect('employees')}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                  activeTab === 'employees'
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                    : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                }`}
              >
                <User className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">Karyawan</span>
                  <span className="text-[9px] text-gray-400 block truncate">Akun & Shift</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section: Sistem & Pengaturan */}
          {isAdminOrOwner && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                Sistem & Pengaturan
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleSelect('settings')}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                    activeTab === 'settings'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                      : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                  }`}
                >
                  <SettingsIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">System Settings</span>
                    <span className="text-[9px] text-gray-400 block truncate">Relay, WA, Venue</span>
                  </div>
                </button>

                <button
                  onClick={() => handleSelect('license')}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                    activeTab === 'license'
                      ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                      : 'bg-[#161616] border-[#222222] text-gray-200 hover:bg-[#1a1a1a]'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">Lisensi POS</span>
                    <span className="text-[9px] text-gray-400 block truncate">Status & Device</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Hardware & Cloud Sync Micro status */}
          <div className="p-3 rounded-2xl bg-[#0a0a0a] border border-[#222222] flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${hwStatus === 'READY' ? 'bg-[#00ff66] shadow-[0_0_8px_#00ff66]' : 'bg-red-500'}`} />
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                  HW Lampu: {hwStatus === 'READY' ? 'READY' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${waStatus?.isReady ? 'bg-[#00ff66]' : 'bg-yellow-500'}`} />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  WA: {waStatus?.isReady ? 'READY' : 'SCAN QR'} • Cloud: {syncCount > 0 ? `${syncCount} pending` : 'Synced'}
                </span>
              </div>
            </div>

            {onSyncHardware && (
              <button
                onClick={() => {
                  onSyncHardware();
                }}
                className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-[#1f1f1f] text-gray-300 hover:text-white border border-[#333]"
              >
                Sync HW
              </button>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            Keluar dari Sistem (Logout)
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenuDrawer;
