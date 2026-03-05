export interface Tournament {
    id: string;
    title: string;
    date: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'FINISHED';
    participants: number;
    maxParticipants: number;
    type: string;
    venue: string;
    prizePool?: string;
}

export interface Player {
    id: string;
    name: string;
    email: string;
    phone: string;
    registeredEvents: number;
    lastAppeared?: string;
    seed?: number;
}

export interface Match {
    id: string;
    round: number;
    p1: string;
    p2: string;
    score1: number | null;
    score2: number | null;
    winner: string | null;
}
