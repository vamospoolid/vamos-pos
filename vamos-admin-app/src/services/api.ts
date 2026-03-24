import axios from 'axios';

// ── Base URL — change to your server IP for APK build ──────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 12000,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Attach JWT on every request ────────────────────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─── Auto-logout on 401 ─────────────────────────────────────────────────
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// ═══════════════════════════════════════════════════════════════════════
// AUTH
// POST /api/auth/login  → { user, token }
// ═══════════════════════════════════════════════════════════════════════
export interface AuthUser { id: string; name: string; role: string; email: string }
export const authApi = {
    login: (email: string, password: string) =>
        api.post<{ user: AuthUser; token: string }>('/auth/login', { email, password }),
};

// ═══════════════════════════════════════════════════════════════════════
// SESSIONS  (active meja yang sedang main)
// ═══════════════════════════════════════════════════════════════════════
export interface Session {
    id: string;
    status: 'ACTIVE' | 'PENDING' | 'CLOSED';
    startTime: string;
    endTime?: string;
    table?: { id: string; name: string };
    member?: { id: string; name: string };
}
export const sessionsApi = {
    getActive: () => api.get<Session[]>('/sessions/active'),
    getPending: () => api.get<Session[]>('/sessions/pending'),
};

// ═══════════════════════════════════════════════════════════════════════
// TOURNAMENTS
// GET  /api/tournaments            → list
// POST /api/tournaments            → create
// POST /api/tournaments/:id/register
// POST /api/tournaments/:id/generate-bracket
// PUT  /api/tournaments/matches/:matchId   → update result
// PUT  /api/tournaments/matches/:matchId/players
// POST /api/tournaments/:id/finish
// DELETE /api/tournaments/:id
// ═══════════════════════════════════════════════════════════════════════
export interface Tournament {
    id: string;
    name: string;
    status: 'PENDING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    format?: string;
    maxPlayers: number;
    startDate?: string;
    venue?: string;
    participants?: Participant[];
    matches?: Match[];
    _count?: { participants: number };
    prizeChampion: number;
    prizeRunnerUp: number;
    prizeSemiFinal: number;
    eliminationType?: 'SINGLE' | 'DOUBLE';
    transitionSize?: number;
}

export interface Participant {
    id: string;
    name: string;
    seed?: number;
    memberId?: string;
    paymentStatus?: string;
    handicap?: string | number;
}

export interface Match {
    id: string;
    round: number;
    matchNumber: number;
    player1?: Participant;
    player2?: Participant;
    score1?: number | null;
    score2?: number | null;
    winner?: Participant;
    status?: string;
}

export const tournamentsApi = {
    getAll: () => api.get<{ success: boolean; data: Tournament[] }>('/tournaments'),
    getById: (id: string) => api.get<{ success: boolean; data: Tournament }>(`/tournaments/${id}`),
    create: (body: { 
        name: string; 
        format?: string; 
        startDate?: string; 
        venue?: string; 
        participants?: string[];
        eliminationType?: 'SINGLE' | 'DOUBLE';
        transitionSize?: number;
    }) =>
        api.post<{ success: boolean; data: Tournament }>('/tournaments', body),
    update: (id: string, body: Partial<Tournament>) =>
        api.put<{ success: boolean; data: Tournament }>(`/tournaments/${id}`, body),
    delete: (id: string) => api.delete(`/tournaments/${id}`),
    registerParticipant: (id: string, body: { memberId?: string; name: string; handicap?: number }) =>
        api.post(`/tournaments/${id}/register`, body),
    updateParticipantStatus: (id: string, participantId: string, paymentStatus: string) =>
        api.put(`/tournaments/${id}/participants/${participantId}/status`, { paymentStatus }),
    generateBracket: (id: string) =>
        api.post(`/tournaments/${id}/generate-bracket`),
    resetBracket: (id: string) =>
        api.post(`/tournaments/${id}/reset-bracket`),
    updateMatchResult: (matchId: string, body: { score1: number; score2: number; winnerId?: string }) =>
        api.put(`/tournaments/matches/${matchId}`, body),
    updateMatchPlayers: (matchId: string, body: { player1Id?: string; player2Id?: string }) =>
        api.put(`/tournaments/matches/${matchId}/players`, body),
    finish: (id: string, body?: object) =>
        api.post(`/tournaments/${id}/finish`, body ?? {}),
    removeParticipant: (id: string, participantId: string) =>
        api.delete(`/tournaments/${id}/participants/${participantId}`),
    purgeParticipants: (id: string) =>
        api.delete(`/tournaments/${id}/participants`),
};

// ═══════════════════════════════════════════════════════════════════════
// MEMBERS  (player registry)
// GET  /api/members
// GET  /api/members/:id
// GET  /api/members/phone/:phone
// POST /api/members
// PUT  /api/members/:id
// DELETE /api/members/:id
// ═══════════════════════════════════════════════════════════════════════
export interface Member {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    loyaltyPoints?: number;
    createdAt?: string;
}
export const membersApi = {
    getAll: () => api.get<{ success: boolean; data: Member[] }>('/members'),
    getById: (id: string) => api.get<Member>(`/members/${id}`),
    getByPhone: (phone: string) => api.get<Member>(`/members/phone/${phone}`),
    create: (body: { name: string; email?: string; phone?: string }) =>
        api.post<Member>('/members', body),
    update: (id: string, body: Partial<Member>) =>
        api.put<Member>(`/members/${id}`, body),
    delete: (id: string) => api.delete(`/members/${id}`),
};

// ═══════════════════════════════════════════════════════════════════════
// REPORTS
// GET /api/reports/daily-revenue?date=YYYY-MM-DD
// GET /api/reports/table-utilization
// GET /api/reports/top-players
// GET /api/reports/top-products
// GET /api/reports/today-utilization-split
// ═══════════════════════════════════════════════════════════════════════
export interface DailyRevenue { date: string; revenue: number; expenses?: number }
export interface TableUtilization { tableId: string; tableName: string; totalSessions: number; totalHours: number; revenue: number; utilization: number }
export interface TopPlayer { memberId: string; memberName: string; totalSessions: number; totalSpend: number; favoriteTable: string }
export interface TopProduct { productId: string; productName: string; category: string; totalQty: number; totalRevenue: number }

export const reportsApi = {
    dailyRevenue: (params: { startDate?: string; endDate?: string; days?: number }) =>
        api.get<any>('/reports/daily-revenue', { params }),
    tableUtilization: (params: { startDate?: string; endDate?: string; days?: number }) =>
        api.get<any>('/reports/table-utilization', { params }),
    topPlayers: (params: { startDate?: string; endDate?: string; days?: number }) =>
        api.get<any>('/reports/top-players', { params }),
    topProducts: (params: { startDate?: string; endDate?: string; days?: number }) =>
        api.get<any>('/reports/top-products', { params }),
    todayUtilizationSplit: () =>
        api.get<any>('/reports/today-utilization-split'),
    transactions: (params: { startDate?: string; endDate?: string; days?: number }) =>
        api.get<any>('/reports/transactions', { params }),
    getExpenses: (params: { startDate?: string; endDate?: string; days?: number }) =>
        api.get<any>('/expenses', { params }),
    getShifts: (params: { startDate?: string; endDate?: string; days?: number }) =>
        api.get<any>('/shifts/reports', { params }),
};

// ═══════════════════════════════════════════════════════════════════════
// MATCHES & LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════
export const matchesApi = {
    leaderboard: () => api.get('/matches/leaderboard'),
    create: (body: { sessionId: string; memberIds: string[]; winnerId: string | null }) =>
        api.post('/matches', body),
};

// ═══════════════════════════════════════════════════════════════════════
// WAITLIST / BOOKINGS
// ═══════════════════════════════════════════════════════════════════════
export interface WaitlistEntry {
    id: string;
    customerName: string;
    phone?: string;
    partySize: number;
    tableType?: string;
    status: 'WAITING' | 'PLAYING' | 'CANCELLED' | 'FINISHED';
    notes?: string;
    reservedTime?: string;
    createdAt: string;
    tableId?: string;
    memberId?: string;
    durationMinutes?: number;
    pointsCost?: number;
    table?: { id: string; name: string };
    member?: { id: string; name: string; loyaltyPoints: number };
}

export const waitlistApi = {
    getAll: () => api.get<WaitlistEntry[]>('/waitlist'),
    updateStatus: (id: string, body: { status: string; tableId?: string }) =>
        api.patch<{ success: boolean }>(`/waitlist/${id}/status`, body),
    delete: (id: string) => api.delete<{ success: boolean }>(`/waitlist/${id}`),
};

// ═══════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════════════
export interface Announcement {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    targetUrl?: string;
    isActive: boolean;
    priority: number;
    createdAt?: string;
}

export const announcementsApi = {
    getAll: () => api.get<{ success: boolean; data: Announcement[] }>('/announcements'),
    create: (body: Partial<Announcement>) => api.post<{ success: boolean; data: Announcement }>('/announcements', body),
    update: (id: string, body: Partial<Announcement>) => api.put<{ success: boolean; data: Announcement }>(`/announcements/${id}`, body),
    delete: (id: string) => api.delete(`/announcements/${id}`),
};

export const systemApi = {
    reset: () => api.post('/system/reset'),
    seed: () => api.post('/system/seed'),
    fixTables: () => api.post('/system/fix-tables'),
    export: () => api.get('/system/export', { responseType: 'blob' }),
};

// ═══════════════════════════════════════════════════════════════════════
// RELAY HARDWARE
// GET  /api/relay/status   → { isConnected, port, isOpen, lastKnownPort, isScanning }
// GET  /api/relay/scan     → { count, ports: [{ path, manufacturer, serialNumber }] }
// POST /api/relay/reconnect → { success, port, message }
// ═══════════════════════════════════════════════════════════════════════
export interface RelayStatus {
    isConnected: boolean;
    port: string | null;
    isOpen: boolean;
    lastKnownPort: string | null;
    isScanning: boolean;
}
export interface RelayPort {
    path: string;
    manufacturer?: string;
    serialNumber?: string;
}
export const relayApi = {
    getStatus: () => api.get<{ success: boolean; data: RelayStatus }>('/relay/status'),
    scanPorts: () => api.get<{ success: boolean; count: number; ports: RelayPort[] }>('/relay/scan'),
    reconnect: () => api.post<{ success: boolean; port: string | null; message: string }>('/relay/reconnect'),
};

export default api;
