import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api';

interface AppState {
    // --- Auth & Profile ---
    member: any | null;
    setMember: (member: any) => void;
    logout: () => void;

    // --- Realtime / UI States ---
    activeTab: 'dashboard' | 'play' | 'tournaments' | 'profile' | 'active-session' | 'rewards' | 'booking' | 'menu' | 'leaderboard' | 'live-table' | 'ledger';
    setActiveTab: (tab: 'dashboard' | 'play' | 'tournaments' | 'profile' | 'active-session' | 'rewards' | 'booking' | 'menu' | 'leaderboard' | 'live-table' | 'ledger') => void;

    rewardsTab: 'catalog' | 'vault' | 'history' | 'tiers';
    setRewardsTab: (tab: 'catalog' | 'vault' | 'history' | 'tiers') => void;

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
            logout: () => {
                localStorage.removeItem('playerToken');
                set({ member: null, activeSession: null, activeTab: 'dashboard' });
            },

            activeTab: 'dashboard',
            setActiveTab: (tab) => set({ activeTab: tab }),

            rewardsTab: 'catalog',
            setRewardsTab: (tab) => set({ rewardsTab: tab }),

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
