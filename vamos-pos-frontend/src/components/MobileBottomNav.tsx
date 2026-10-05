import React from 'react';
import { LayoutDashboard, Receipt, Utensils, Clock, Grid3X3 } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeTableCount?: number;
  pendingBillsCount?: number;
  waitlistCount?: number;
  isMenuDrawerOpen: boolean;
  onToggleMenuDrawer: () => void;
  hasNotification?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  activeTableCount = 0,
  pendingBillsCount = 0,
  waitlistCount = 0,
  isMenuDrawerOpen,
  onToggleMenuDrawer,
  hasNotification = false,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Meja',
      icon: LayoutDashboard,
      badge: activeTableCount > 0 ? activeTableCount : null,
      badgeColor: 'bg-[#00ff66] text-[#0a0a0a]',
    },
    {
      id: 'bills',
      label: 'Kasir',
      icon: Receipt,
      badge: pendingBillsCount > 0 ? pendingBillsCount : null,
      badgeColor: 'bg-[#ff3333] text-white animate-pulse',
    },
    {
      id: 'fnb-order',
      label: 'Cafe',
      icon: Utensils,
      badge: null,
      badgeColor: '',
      isCenterFab: true,
    },
    {
      id: 'waitlist',
      label: 'Antrian',
      icon: Clock,
      badge: waitlistCount > 0 ? waitlistCount : null,
      badgeColor: 'bg-sky-500 text-white',
    },
    {
      id: 'more',
      label: 'Menu',
      icon: Grid3X3,
      badge: hasNotification ? '!' : null,
      badgeColor: 'bg-amber-400 text-black',
      isDrawer: true,
    },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0d0d0d]/95 backdrop-blur-xl border-t border-[#222222] shadow-[0_-8px_25px_rgba(0,0,0,0.85)] px-1 pb-1 pt-1 bottom-nav-safe select-none overflow-visible"
    >
      <div 
        className="w-full max-w-lg mx-auto relative flex flex-row items-end justify-around overflow-visible"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isDrawer ? isMenuDrawerOpen : activeTab === item.id && !isMenuDrawerOpen;

          // Special Center Android-style Circular Floating Action Button (FAB)
          if (item.isCenterFab) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className="flex flex-col items-center justify-center flex-1 relative -top-3 transition-all duration-200 active:scale-90 group cursor-pointer"
              >
                {/* Elevated Circular FAB Button */}
                <div
                  className={`rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-[#0d0d0d] ${
                    isActive
                      ? 'bg-gradient-to-tr from-[#00cc52] to-[#00ff66] text-[#0a0a0a] shadow-[0_0_25px_rgba(0,255,102,0.65)] scale-110'
                      : 'bg-[#181818] border border-[#2a2a2a] text-[#00ff66] shadow-[0_6px_16px_rgba(0,0,0,0.7)] group-hover:border-[#00ff66]/50 group-hover:scale-105'
                  }`}
                  style={{ width: '50px', height: '50px' }}
                >
                  <Icon className={`w-6 h-6 stroke-[2.2] transition-transform duration-200 ${isActive ? 'rotate-[-8deg] scale-105' : 'group-hover:scale-110'}`} />
                </div>

                {/* Center Label */}
                <span
                  className={`text-[10px] font-black tracking-wider uppercase mt-1 transition-colors ${
                    isActive ? 'text-[#00ff66]' : 'text-gray-400 group-hover:text-gray-200'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          // Standard Nav Item
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isDrawer) {
                  onToggleMenuDrawer();
                } else {
                  onSelectTab(item.id);
                }
              }}
              className="flex flex-col items-center justify-center flex-1 py-1 px-0.5 relative transition-all duration-200 active:scale-90 group cursor-pointer min-w-0"
            >
              {/* Active Pill Indicator */}
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 rounded-full bg-[#00ff66] shadow-[0_0_10px_#00ff66] animate-fade-in-fast" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-9 h-7 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-[#00ff66]/15 text-[#00ff66]'
                      : 'text-gray-400 group-hover:text-gray-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 drop-shadow-[0_0_6px_rgba(0,255,102,0.6)]' : ''}`} />
                </div>

                {item.badge !== null && (
                  <span
                    className={`absolute -top-1 -right-1.5 px-1.5 min-w-[16px] h-4 rounded-full text-[9px] font-black flex items-center justify-center shadow-md ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-bold tracking-tight mt-0.5 transition-colors truncate max-w-full ${
                  isActive ? 'text-[#00ff66] font-black' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
