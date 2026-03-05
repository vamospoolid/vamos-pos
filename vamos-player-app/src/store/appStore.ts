import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api';

interface AppState {
    // --- Auth & Profile ---
    member: any | null;
    setMember: (member: any) => void;
    logout: () => void;

    // --- Realtime / UI States ---
    activeTab: 'home' | 'tournaments' | 'profile' | 'active-session' | 'rewards' | 'booking' | 'menu' | 'leaderboard';
    setActiveTab: (tab: 'home' | 'tournaments' | 'profile' | 'active-session' | 'rewards' | 'booking' | 'menu' | 'leaderboard') => void;

    // --- Session Tracking ---
    activeSession: any | null;
    setActiveSession: (session: any) => void;

    // --- Theme/Config Parameters (for global tracking) ---
    isDarkMode: boolean;
    setDarkMode: (val: boolean) => void;

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
                set({ member: null, activeSession: null, activeTab: 'home' });
            },

            activeTab: 'home',
            setActiveTab: (tab) => set({ activeTab: tab }),

            activeSession: null,
            setActiveSession: (session) => set({ activeSession: session }),

            isDarkMode: true,
            setDarkMode: (val) => set({ isDarkMode: val }),

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
