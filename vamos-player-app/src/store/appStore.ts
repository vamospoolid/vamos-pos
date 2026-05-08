import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api';

interface AppState {
    // --- Auth & Profile ---
    member: any | null;
    setMember: (member: any) => void;
    venueInfo: any | null;
    setVenueInfo: (venue: any) => void;
    logout: () => void;

    // --- Realtime / UI States ---
    activeTab: 'dashboard' | 'play' | 'tournaments' | 'profile' | 'active-session' | 'rewards' | 'booking' | 'menu' | 'leaderboard' | 'live-table' | 'ledger' | 'training';
    setActiveTab: (tab: 'dashboard' | 'play' | 'tournaments' | 'profile' | 'active-session' | 'rewards' | 'booking' | 'menu' | 'leaderboard' | 'live-table' | 'ledger' | 'training') => void;

    rewardsTab: 'catalog' | 'vault' | 'history' | 'tiers';
    setRewardsTab: (tab: 'catalog' | 'vault' | 'history' | 'tiers') => void;

    // --- Notifications ---
    toasts: any[];
    addToast: (toast: { message: string, type?: 'success' | 'error' | 'info' | 'warning' | 'match', title?: string, duration?: number, actionLabel?: string, onAction?: () => void }) => void;
    removeToast: (id: string) => void;

    // --- Session Tracking ---
    activeSession: any | null;
    setActiveSession: (session: any) => void;

    // --- Theme/Config Parameters (for global tracking) ---
    isDarkMode: boolean;
    setDarkMode: (val: boolean) => void;

    // --- Tournament Selection ---
    selectedTournament: any | null;
    setSelectedTournament: (t: any | null) => void;

    // Global Actions
    refreshMemberData: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            member: null,
            setMember: (member) => set({ member }),
            venueInfo: null,
            setVenueInfo: (venueInfo) => set({ venueInfo }),
            logout: () => {
                localStorage.removeItem('playerToken');
                set({ member: null, activeSession: null, activeTab: 'dashboard' });
            },

            activeTab: 'dashboard',
            setActiveTab: (tab) => set({ activeTab: tab }),

            rewardsTab: 'catalog',
            setRewardsTab: (tab) => set({ rewardsTab: tab }),

            toasts: [],
            addToast: (toast) => {
                const id = Math.random().toString(36).substring(2, 9);
                set(state => ({ toasts: [...state.toasts, { ...toast, id }] }));
            },
            removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

            activeSession: null,
            setActiveSession: (session) => set({ activeSession: session }),

            isDarkMode: true,
            setDarkMode: (val) => set({ isDarkMode: val }),

            selectedTournament: null,
            setSelectedTournament: (t) => set({ selectedTournament: t }),

            refreshMemberData: async () => {
                const { member } = get();
                if (!member?.id) return;

                try {
                    const res = await api.get(`/player/${member.id}`);
                    if (res.data.success) {
                        set({ member: res.data.data });
                    }
                } catch (error) {
                    console.error("Failed to refresh member data", error);
                }
            }
        }),
        {
            name: 'vamos-player-storage',
            partialize: (state) => ({ member: state.member, isDarkMode: state.isDarkMode }), // only persist member state & theme
        }
    )
);
