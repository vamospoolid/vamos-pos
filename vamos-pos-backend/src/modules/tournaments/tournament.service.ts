import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';

export class TournamentService {
    static async createTournament(data: any) {
        return prisma.$transaction(async (tx) => {
            const tournament = await tx.tournament.create({
                data: {
                    name: data.name,
                    description: data.description,
                    entryFee: data.entryFee || 0,
                    prizePool: data.prizePool || 0,
                    prizeChampion: data.prizeChampion || 0,
                    prizeRunnerUp: data.prizeRunnerUp || 0,
                    prizeSemiFinal: data.prizeSemiFinal || 0,
                    maxPlayers: data.maxPlayers || 32,
                    eliminationType: (data.eliminationType as any) || 'SINGLE',
                    transitionSize: data.transitionSize ? Number(data.transitionSize) : 32,
                    startDate: data.startDate ? new Date(data.startDate) : undefined,
                    venue: data.venue,
                    format: data.format || '8-Ball',
                    rules: data.rules,
                }
            });

            if (data.participants && Array.isArray(data.participants)) {
                const participantsData = data.participants
                    .filter((name: string) => name.trim().length > 0)
                    .map((name: string) => ({
                        tournamentId: tournament.id,
                        name: name.trim()
                    }));

                if (participantsData.length > 0) {
                    await tx.tournamentParticipant.createMany({
                        data: participantsData
                    });
                }
            }

            return tournament;
        });
    }

    static async updateTournament(id: string, data: any) {
        return prisma.tournament.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                entryFee: data.entryFee !== undefined ? Number(data.entryFee) : undefined,
                prizePool: data.prizePool !== undefined ? Number(data.prizePool) : undefined,
                prizeChampion: data.prizeChampion !== undefined ? Number(data.prizeChampion) : undefined,
                prizeRunnerUp: data.prizeRunnerUp !== undefined ? Number(data.prizeRunnerUp) : undefined,
                prizeSemiFinal: data.prizeSemiFinal !== undefined ? Number(data.prizeSemiFinal) : undefined,
                maxPlayers: data.maxPlayers !== undefined ? Number(data.maxPlayers) : undefined,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                venue: data.venue,
                format: data.format,
                eliminationType: data.eliminationType as any,
                transitionSize: data.transitionSize !== undefined ? Number(data.transitionSize) : undefined,
                rules: data.rules,
            }
        });
    }

    static async getTournaments() {
        return prisma.tournament.findMany({
            include: {
                participants: { include: { member: true } },
                matches: {
                    include: {
                        player1: { include: { member: true } },
                        player2: { include: { member: true } },
                        winner: true,
                        table: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getTournamentById(id: string) {
        return prisma.tournament.findUnique({
            where: { id },
            include: {
                participants: {
                    include: { member: true },
                    orderBy: { registeredAt: 'asc' }
                },
                matches: {
                    include: {
                        player1: { include: { member: true } },
                        player2: { include: { member: true } },
                        winner: true,
                        table: true
                    },
                    orderBy: { matchNumber: 'asc' }
                }
            }
        });
    }

    static async registerParticipant(
        tournamentId: string, 
        userId: string,
        memberId?: string, 
        name?: string, 
        handicap?: string, 
        paymentNotes?: string, 
        status?: string,
        paymentMethod: string = 'CASH'
    ) {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { _count: { select: { participants: true } } }
        });

        if (!tournament) throw new AppError('Tournament not found', 404);
        if (tournament.status !== 'PENDING' && tournament.status !== 'ONGOING') throw new AppError('Registration closed', 400);
        if (tournament._count.participants >= tournament.maxPlayers) throw new AppError('Tournament is full', 400);

        if (memberId) {
            const registeredCount = await prisma.tournamentParticipant.count({
                where: { tournamentId, memberId }
            });
            if (registeredCount >= 4) throw new AppError('Member sudah terdaftar maksimal (4 slot) di turnamen ini', 400);
        }

        const finalStatus = status || (tournament.entryFee > 0 ? 'UNPAID' : 'PAID');

        const result = await prisma.$transaction(async (tx) => {
            const participant = await tx.tournamentParticipant.create({
                data: {
                    tournamentId,
                    memberId: memberId || null,
                    name: name || null,
                    handicap,
                    paymentNotes: paymentNotes || '',
                    paymentStatus: finalStatus
                },
                include: { member: true }
            });

            return participant;
        });

        // LOYALTY & XP INTEGRATION: Dynamic based on entry fee
        if (memberId) {
            try {
                const { LoyaltyService } = await import('../loyalty/loyalty.service');
                await LoyaltyService.awardTournamentRewards(memberId, 'PARTICIPATE', tournament.entryFee);
            } catch (e) {
                console.error('Loyalty award error:', e);
            }
        }

        return result;
    }

    static async importParticipants(tournamentId: string, lines: string[]) {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { _count: { select: { participants: true } } }
        });
        if (!tournament) throw new AppError('Tournament not found', 404);
        if (tournament.status !== 'PENDING' && tournament.status !== 'ONGOING') throw new AppError('Registration closed', 400);

        const currentCount = tournament._count.participants;
        const availableSlots = tournament.maxPlayers - currentCount;
        if (availableSlots <= 0) throw new AppError('Tournament is full', 400);

        const cleanedLines = lines
            .map(l => l.replace(/^\d+[\.\-\)]\s*/, '').trim()) // remove leading numbering like "1. ", "1 - ", "1) "
            .filter(l => l.length > 0);

        if (cleanedLines.length === 0) throw new AppError('Tidak ada nama peserta yang valid untuk di-import', 400);

        const toInsert = cleanedLines.slice(0, availableSlots).map(name => ({
            tournamentId,
            name,
            handicap: 'OPEN',
            paymentStatus: (tournament.entryFee > 0 ? 'UNPAID' : 'PAID') as any,
            paymentNotes: 'BULK_IMPORT'
        }));

        await prisma.tournamentParticipant.createMany({
            data: toInsert
        });

        return {
            importedCount: toInsert.length,
            totalParticipants: currentCount + toInsert.length
        };
    }

    static async updateParticipant(tournamentId: string, participantId: string, data: { name?: string, handicap?: string, paymentNotes?: string }) {
        const pt = await prisma.tournamentParticipant.findUnique({
            where: { id: participantId }
        });

        if (!pt || pt.tournamentId !== tournamentId) {
            throw new AppError('Participant not found', 404);
        }

        return prisma.tournamentParticipant.update({
            where: { id: participantId },
            data: {
                name: data.name !== undefined ? data.name : undefined,
                handicap: data.handicap !== undefined ? data.handicap : undefined,
                paymentNotes: data.paymentNotes !== undefined ? data.paymentNotes : undefined
            }
        });
    }

    static async updateParticipantStatus(tournamentId: string, participantId: string, paymentStatus: string, userId: string, paymentMethod: string = 'CASH') {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId }
        });

        if (!tournament) throw new AppError('Tournament not found', 404);

        const participant = await prisma.tournamentParticipant.findUnique({
            where: { id: participantId }
        });

        if (!participant) throw new AppError('Participant not found', 404);

        return prisma.tournamentParticipant.update({
            where: { id: participantId },
            data: { paymentStatus }
        });
    }

    static async generateBracket(tournamentId: string) {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { participants: { include: { member: true } }, matches: true }
        });
        if (!tournament) throw new AppError('Tournament not found', 404);
        if (tournament.matches.length > 0) throw new AppError('Bracket already generated', 400);
        
        const eliminationType = (tournament as any).eliminationType;
        const formatStr = (tournament.format || '').toUpperCase();
        const rulesStr = (tournament.rules || '').toUpperCase();

        if (formatStr.includes('ROUND_ROBIN') || formatStr.includes('BEREGU') || formatStr.includes('TEAM') || rulesStr.includes('ROUND_ROBIN') || eliminationType === 'ROUND_ROBIN') {
            return this.generateRoundRobin(tournamentId);
        }

        if (eliminationType === 'DOUBLE') {
            return this.generateDoubleElimination(tournamentId);
        }

        return this.generateSingleElimination(tournamentId);
    }

    private static async generateRoundRobin(tournamentId: string) {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { participants: { include: { member: true } } }
        });
        if (!tournament) throw new AppError('Tournament not found', 404);

        const participants = tournament.participants;
        const N = participants.length;
        if (N < 2) throw new AppError('Minimal butuh 2 tim/peserta untuk generate jadwal Round Robin', 400);

        // Initial seeding
        const teamList: (any | null)[] = [...participants];
        if (teamList.length % 2 !== 0) {
            teamList.push(null); // Add BYE dummy slot for odd count
        }

        const totalTeams = teamList.length;
        const totalRounds = totalTeams - 1;
        const matchesPerRound = totalTeams / 2;

        const matchesData: any[] = [];
        let matchNumber = 1;
        let currentList = [...teamList];

        for (let round = 1; round <= totalRounds; round++) {
            for (let m = 0; m < matchesPerRound; m++) {
                const home = currentList[m];
                const away = currentList[totalTeams - 1 - m];

                if (home !== null && away !== null) {
                    matchesData.push({
                        tournamentId,
                        round,
                        matchNumber: matchNumber++,
                        player1Id: home.id,
                        player2Id: away.id,
                        status: 'PENDING',
                        score1: 0,
                        score2: 0,
                        bracket: 'WINNERS'
                    });
                } else if (home !== null && away === null) {
                    matchesData.push({
                        tournamentId,
                        round,
                        matchNumber: matchNumber++,
                        player1Id: home.id,
                        player2Id: null,
                        winnerId: home.id,
                        status: 'COMPLETED',
                        score1: 3,
                        score2: 0,
                        bracket: 'WINNERS'
                    });
                } else if (home === null && away !== null) {
                    matchesData.push({
                        tournamentId,
                        round,
                        matchNumber: matchNumber++,
                        player1Id: away.id,
                        player2Id: null,
                        winnerId: away.id,
                        status: 'COMPLETED',
                        score1: 3,
                        score2: 0,
                        bracket: 'WINNERS'
                    });
                }
            }

            // Rotate list circularly around fixed index 0
            const fixed = currentList[0];
            const rest = currentList.slice(1);
            const last = rest.pop()!;
            rest.unshift(last);
            currentList = [fixed, ...rest];
        }

        await prisma.tournamentMatch.createMany({
            data: matchesData
        });

        await prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: 'ONGOING' }
        });

        return { totalMatches: matchesData.length, totalRounds };
    }

    private static cleanParticipantName(raw: string): string {
        if (!raw) return '';
        return raw
            .replace(/\[.*?\]|\(.*?\)/g, '')
            .replace(/\s+-\s+.*$/, '') // strip " - TEAM" suffix
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+(?:#?\d+|[IVX]+)$/i, '') // strip trailing slot number: "FADLY 1", "FADLY #2", "FADLY II"
            .replace(/\s+/g, ' ')
            .trim();
    }

    private static detectTeamsAndPersons(participants: any[]) {
        const cleanedList = participants.map((p, idx) => {
            const rawName = p.name || p.member?.name || `Player ${idx + 1}`;
            const withoutBrackets = rawName
                .replace(/\[.*?\]|\(.*?\)/g, '')
                .replace(/\s+-\s+.*$/, '')
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            const baseClean = this.cleanParticipantName(rawName);
            return {
                id: p.id,
                raw: rawName,
                withoutBrackets,
                clean: baseClean,
                memberId: p.memberId || null,
                original: p
            };
        });

        // Count prefix/suffix across UNIQUE base names so 1 player taking 4 slots ("ANDI SAPUTRA 1..4")
        // doesn't falsely trigger "SAPUTRA" as a team unless another distinct player shares it.
        const suffixOwners = new Map<string, Set<string>>();
        const prefixOwners = new Map<string, Set<string>>();

        cleanedList.forEach(p => {
            const words = p.clean.split(/\s+/).filter((w: string) => w.length > 0);
            if (words.length > 1) {
                const baseKey = p.clean.toUpperCase();
                const lastWord = words[words.length - 1].toUpperCase();
                const firstWord = words[0].toUpperCase();

                if (lastWord.length >= 2 && !/^\d+$/.test(lastWord)) {
                    if (!suffixOwners.has(lastWord)) suffixOwners.set(lastWord, new Set());
                    suffixOwners.get(lastWord)!.add(baseKey);
                }
                if (firstWord.length >= 2 && !/^\d+$/.test(firstWord)) {
                    if (!prefixOwners.has(firstWord)) prefixOwners.set(firstWord, new Set());
                    prefixOwners.get(firstWord)!.add(baseKey);
                }
            }
        });

        return cleanedList.map(p => {
            const words = p.clean.split(/\s+/).filter((w: string) => w.length > 0);
            let team: string | null = null;
            let corePersonName = p.clean.toUpperCase();

            // 1. Check bracket tag in raw name: "FADLY 1 (GARUDA)" or "FADLY [GARUDA]"
            const tagMatch = p.raw.match(/\(([a-zA-Z0-9_\s-]+)\)|\[([a-zA-Z0-9_\s-]+)\]/);
            if (tagMatch) {
                const tag = (tagMatch[1] || tagMatch[2]).trim().toUpperCase();
                if (!tag.startsWith('HC') && !tag.startsWith('HANDICAP') && !/^\d+$/.test(tag) && tag.length >= 2) {
                    team = tag;
                }
            }

            // 2. Check dash separator: "FADLY 1 - GARUDA"
            if (!team) {
                const dashMatch = p.raw.match(/\s+-\s+([a-zA-Z0-9_\s]+)$/);
                if (dashMatch) {
                    const tag = dashMatch[1].trim().toUpperCase();
                    if (!tag.startsWith('HC') && tag.length >= 2) {
                        team = tag;
                    }
                }
            }

            // 3. Check shared prefix/suffix across at least 2 distinct player names
            if (!team && words.length > 1) {
                const lastWord = words[words.length - 1].toUpperCase();
                const firstWord = words[0].toUpperCase();

                if ((suffixOwners.get(lastWord)?.size || 0) >= 2) {
                    team = lastWord;
                    corePersonName = words.slice(0, -1).join(' ').toUpperCase();
                } else if ((prefixOwners.get(firstWord)?.size || 0) >= 2) {
                    team = firstWord;
                    corePersonName = words.slice(1).join(' ').toUpperCase();
                }
            }

            // Strip any trailing slot number still left in corePersonName (e.g. "GARUDA FADLY 1" -> "FADLY")
            corePersonName = corePersonName.replace(/\s+(?:#?\d+|[IVX]+)$/i, '').trim() || p.clean.toUpperCase();

            // Person Identifier (groups 2, 3, or 4 slots belonging to the same human player)
            const personKey = p.memberId
                ? `MEM_${p.memberId}`
                : `NAME_${corePersonName}`;

            return {
                ...p,
                team: team || 'INDIVIDUAL',
                personKey
            };
        });
    }

    private static smartShuffleAndSeed(participants: any[], bracketSize: number) {
        const annotated = this.detectTeamsAndPersons(participants);

        // Group by personKey to detect players taking 4, 3, 2, or 1 slot(s)
        const personGroups = new Map<string, any[]>();
        annotated.forEach(p => {
            const list = personGroups.get(p.personKey) || [];
            list.push(p);
            personGroups.set(p.personKey, list);
        });

        const quadPlayers: any[][] = [];
        const triplePlayers: any[][] = [];
        const twinPairs: any[][] = [];
        const singlePlayers: any[] = [];

        personGroups.forEach(list => {
            if (list.length >= 4) {
                quadPlayers.push(list.slice(0, 4));
                for (let i = 4; i < list.length; i++) singlePlayers.push(list[i]);
            } else if (list.length === 3) {
                triplePlayers.push(list);
            } else if (list.length === 2) {
                twinPairs.push(list);
            } else if (list.length === 1) {
                singlePlayers.push(list[0]);
            }
        });

        const matchCount = Math.floor(bracketSize / 2);
        const quadrantSize = Math.max(1, Math.floor(matchCount / 4));

        // Hierarchical Binary Tree Distance Conflict Evaluator
        // Ensures teammates & same-person entries are separated as far as possible across the bracket tree
        const evaluateSlotConflict = (
            matches: Array<{ matchIndex: number; p1: any; p2: any; quadrant: number }>,
            player: any,
            targetMatchIdx: number,
            isSameZoneAllowedForQuadSelf = false
        ): number => {
            let penalty = 0;
            for (let m = 0; m < matchCount; m++) {
                const occupants = [matches[m].p1, matches[m].p2].filter(Boolean);
                for (const occ of occupants) {
                    const samePerson = occ.personKey === player.personKey;
                    const sameTeam = player.team !== 'INDIVIDUAL' && occ.team === player.team;
                    if (!samePerson && !sameTeam) continue;

                    if (m === targetMatchIdx) {
                        // Round 1 (128 Besar): direct clash in the exact same match
                        if (samePerson) penalty += 100_000_000;
                        if (sameTeam) penalty += 50_000_000;
                    } else if (Math.floor(m / 2) === Math.floor(targetMatchIdx / 2)) {
                        // Round 2 (64 Besar): adjacent match
                        if (samePerson) penalty += 20_000_000;
                        if (sameTeam) penalty += 5_000_000;
                    } else if (Math.floor(m / 4) === Math.floor(targetMatchIdx / 4)) {
                        // Round 3 (32 Besar): same 4-match sector (8 slots)
                        if (samePerson) penalty += 5_000_000;
                        if (sameTeam) penalty += 500_000;
                    } else if (Math.floor(m / 8) === Math.floor(targetMatchIdx / 8)) {
                        // Round 4 (16 Besar): same 8-match block (16 slots)
                        if (samePerson) penalty += 1_000_000;
                        if (sameTeam) penalty += 50_000;
                    } else if (Math.floor(m / 16) === Math.floor(targetMatchIdx / 16)) {
                        // Round 5 (8 Besar / Quarter Final): same 16-match quadrant (32 slots)
                        if (samePerson && !isSameZoneAllowedForQuadSelf) penalty += 100_000;
                        if (sameTeam && !samePerson) penalty += 5_000;
                    } else if (Math.floor(m / 32) === Math.floor(targetMatchIdx / 32)) {
                        // Round 6 (Semifinal): same 32-match pool (64 slots)
                        if (sameTeam && !samePerson) penalty += 500;
                    }
                }
            }
            return penalty;
        };

        // Helper to pick best match & slot inside a range [startMatch, endMatch)
        const placeInRange = (
            matches: Array<{ matchIndex: number; p1: any; p2: any; quadrant: number }>,
            player: any,
            startMatch: number,
            endMatch: number,
            preferredSlot?: 'p1' | 'p2',
            allowQuadSelf = false
        ) => {
            const clampedStart = Math.max(0, Math.min(matchCount - 1, startMatch));
            const clampedEnd = Math.max(clampedStart + 1, Math.min(matchCount, endMatch));

            const candidates: Array<{ matchIdx: number; slot: 'p1' | 'p2'; score: number }> = [];
            for (let m = clampedStart; m < clampedEnd; m++) {
                const slotsToCheck: Array<'p1' | 'p2'> = preferredSlot ? [preferredSlot, preferredSlot === 'p1' ? 'p2' : 'p1'] : ['p1', 'p2'];
                for (const s of slotsToCheck) {
                    if (!matches[m][s]) {
                        const slotPrefPenalty = preferredSlot && s !== preferredSlot ? 10 : 0;
                        const score = evaluateSlotConflict(matches, player, m, allowQuadSelf) + slotPrefPenalty + Math.random() * 5;
                        candidates.push({ matchIdx: m, slot: s, score });
                    }
                }
            }

            // Fallback to any open slot in the entire bracket if the target sub-range is completely full
            if (candidates.length === 0) {
                for (let m = 0; m < matchCount; m++) {
                    for (const s of ['p1', 'p2'] as const) {
                        if (!matches[m][s]) {
                            const score = evaluateSlotConflict(matches, player, m, allowQuadSelf) + Math.random() * 5;
                            candidates.push({ matchIdx: m, slot: s, score });
                        }
                    }
                }
            }

            if (candidates.length > 0) {
                candidates.sort((a, b) => a.score - b.score);
                const chosen = candidates[0];
                matches[chosen.matchIdx][chosen.slot] = player;
            }
        };

        // Helper to place a pair into a Quadrant so they converge at 8 Besar (on 128-slot bracket)
        // or Quadrant Final (on smaller brackets):
        // First half of Quadrant = Block A [qStart .. qMid), Second half of Quadrant = Block B [qMid .. qEnd)
        const placePairInQuadrant8Besar = (
            matches: Array<{ matchIndex: number; p1: any; p2: any; quadrant: number }>,
            pA: any,
            pB: any,
            quadIdx: number
        ) => {
            const qStart = quadIdx * quadrantSize;
            const qEnd = Math.min(matchCount, (quadIdx + 1) * quadrantSize);
            const qMid = qStart + Math.max(1, Math.floor((qEnd - qStart) / 2));

            placeInRange(matches, pA, qStart, qMid, 'p1', true);
            placeInRange(matches, pB, qMid, qEnd, 'p2', true);
        };

        let bestResult: any[] | null = null;
        let lowestTotalPenalty = Infinity;

        for (let attempt = 0; attempt < 25; attempt++) {
            const matches: Array<{
                matchIndex: number;
                p1: any;
                p2: any;
                quadrant: number;
            }> = Array.from({ length: matchCount }, (_, i) => ({
                matchIndex: i,
                p1: null,
                p2: null,
                quadrant: Math.min(3, Math.floor(i / quadrantSize))
            }));

            // Helper to score a Quadrant for placing a pair of a given team
            const getQuadrantLoadScore = (qIdx: number, team: string) => {
                const qStart = qIdx * quadrantSize;
                const qEnd = Math.min(matchCount, (qIdx + 1) * quadrantSize);
                let teamCount = 0;
                let totalOccupied = 0;
                for (let m = qStart; m < qEnd; m++) {
                    for (const occ of [matches[m].p1, matches[m].p2]) {
                        if (occ) {
                            totalOccupied++;
                            if (team !== 'INDIVIDUAL' && occ.team === team) {
                                teamCount++;
                            }
                        }
                    }
                }
                return teamCount * 10_000 + totalOccupied * 10 + Math.random() * 5;
            };

            // 1. Place 4-Slot Players (Saling Bunuh di 8 Besar):
            // Pair 1 (Slot 1 & 2) -> Pool A (Quadrant 0 or 1), Block A vs Block B -> Meet in 8 Besar!
            // Pair 2 (Slot 3 & 4) -> Pool B (Quadrant 2 or 3), Block A vs Block B -> Meet in 8 Besar!
            const shuffledQuads = [...quadPlayers].sort(() => Math.random() - 0.5);
            for (const qGroup of shuffledQuads) {
                const team = qGroup[0].team;
                if (matchCount >= 4) {
                    const poolAQuads = [0, 1].sort((a, b) => getQuadrantLoadScore(a, team) - getQuadrantLoadScore(b, team));
                    const poolBQuads = [2, 3].sort((a, b) => getQuadrantLoadScore(a, team) - getQuadrantLoadScore(b, team));

                    placePairInQuadrant8Besar(matches, qGroup[0], qGroup[1], poolAQuads[0]);
                    placePairInQuadrant8Besar(matches, qGroup[2], qGroup[3], poolBQuads[0]);
                } else {
                    for (const p of qGroup) placeInRange(matches, p, 0, matchCount);
                }
            }

            // 2. Place 3-Slot Players:
            // Pair 1 (Slot 1 & 2) -> Best Quadrant in Pool A or B (Block A vs Block B -> Meet in 8 Besar)
            // Slot 3 -> Best Quadrant in the opposite Pool (can only meet in Final)
            const shuffledTriples = [...triplePlayers].sort(() => Math.random() - 0.5);
            for (const tGroup of shuffledTriples) {
                const team = tGroup[0].team;
                if (matchCount >= 4) {
                    const allQuads = [0, 1, 2, 3].sort((a, b) => getQuadrantLoadScore(a, team) - getQuadrantLoadScore(b, team));
                    const pairQuad = allQuads[0];
                    const oppositePoolQuads = (pairQuad < 2 ? [2, 3] : [0, 1]).sort(
                        (a, b) => getQuadrantLoadScore(a, team) - getQuadrantLoadScore(b, team)
                    );
                    const singleQuad = oppositePoolQuads[0];

                    placePairInQuadrant8Besar(matches, tGroup[0], tGroup[1], pairQuad);
                    const sStart = singleQuad * quadrantSize;
                    const sEnd = Math.min(matchCount, (singleQuad + 1) * quadrantSize);
                    placeInRange(matches, tGroup[2], sStart, sEnd, 'p1', false);
                } else {
                    for (const p of tGroup) placeInRange(matches, p, 0, matchCount);
                }
            }

            // 3. Place 2-Slot Players (Twin Pairs):
            // Placed in Block A & Block B of the best Quadrant (converge at 8 Besar on 128-slot bracket)
            const shuffledTwins = [...twinPairs].sort(() => Math.random() - 0.5);
            for (const pair of shuffledTwins) {
                const team = pair[0].team;
                if (matchCount >= 4) {
                    const allQuads = [0, 1, 2, 3].sort((a, b) => getQuadrantLoadScore(a, team) - getQuadrantLoadScore(b, team));
                    placePairInQuadrant8Besar(matches, pair[0], pair[1], allQuads[0]);
                } else {
                    for (const p of pair) placeInRange(matches, p, 0, matchCount);
                }
            }

            // 4. Place Remaining Single Players (sorted by largest team first so big teams spread evenly)
            const remainingPlayers = [...singlePlayers].sort(() => Math.random() - 0.5);
            const teamTotalCounts = new Map<string, number>();
            annotated.forEach(p => {
                if (p.team !== 'INDIVIDUAL') {
                    teamTotalCounts.set(p.team, (teamTotalCounts.get(p.team) || 0) + 1);
                }
            });
            remainingPlayers.sort((a, b) => {
                const countA = a.team === 'INDIVIDUAL' ? 0 : (teamTotalCounts.get(a.team) || 0);
                const countB = b.team === 'INDIVIDUAL' ? 0 : (teamTotalCounts.get(b.team) || 0);
                return countB - countA;
            });

            for (const player of remainingPlayers) {
                placeInRange(matches, player, 0, matchCount);
            }

            // Evaluate overall bracket quality for this attempt
            let attemptPenalty = 0;
            for (let i = 0; i < matchCount; i++) {
                const { p1, p2 } = matches[i];
                if (p1 && p2) {
                    if (p1.personKey === p2.personKey) attemptPenalty += 100_000_000;
                    if (p1.team !== 'INDIVIDUAL' && p1.team === p2.team) attemptPenalty += 50_000_000;
                }
                // Check Round 2 (64 Besar) adjacent match team clashes
                if (i % 2 === 0 && i + 1 < matchCount) {
                    const mA = [matches[i].p1, matches[i].p2].filter(Boolean);
                    const mB = [matches[i + 1].p1, matches[i + 1].p2].filter(Boolean);
                    for (const a of mA) {
                        for (const b of mB) {
                            if (a.personKey === b.personKey) attemptPenalty += 20_000_000;
                            if (a.team !== 'INDIVIDUAL' && a.team === b.team) attemptPenalty += 5_000_000;
                        }
                    }
                }
            }

            if (attemptPenalty < lowestTotalPenalty) {
                lowestTotalPenalty = attemptPenalty;
                const slotMap: any[] = Array(bracketSize).fill(null);
                for (let i = 0; i < matchCount; i++) {
                    slotMap[i * 2] = matches[i].p1 ? matches[i].p1.original : null;
                    slotMap[i * 2 + 1] = matches[i].p2 ? matches[i].p2.original : null;
                }
                bestResult = slotMap;
            }

            if (attemptPenalty === 0) {
                break;
            }
        }

        return bestResult || Array(bracketSize).fill(null);
    }

    private static async generateSingleElimination(tournamentId: string) {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { participants: { include: { member: true } } }
        });
        if (!tournament) throw new AppError('Tournament not found', 404);

        const N = tournament.participants.length;
        if (N < 2) throw new AppError('Minimum 2 peserta untuk generate bracket', 400);

        let bracketSize = 1;
        const targetCapacity = Math.max(N, tournament.maxPlayers || 0);
        while (bracketSize < targetCapacity) bracketSize *= 2;
        const totalRounds = Math.log2(bracketSize);

        const slotMap = this.smartShuffleAndSeed(tournament.participants, bracketSize);

        const matchesData: any[] = [];
        let matchNumber = 1;

        // 1. Generate Round 1 matches with symmetrical BYE handling
        const round1MatchesCount = bracketSize / 2;
        const r1Matches: any[] = [];

        for (let i = 0; i < bracketSize; i += 2) {
            const p1 = slotMap[i];
            const p2 = slotMap[i + 1];

            // Normalize: If p1 is empty but p2 has player, assign present player as player1
            const effectiveP1 = p1 || p2 || null;
            const effectiveP2 = (p1 && p2) ? p2 : null;
            const isBye = (effectiveP1 !== null && effectiveP2 === null);

            r1Matches.push({
                tournamentId,
                round: 1,
                matchNumber: matchNumber++,
                player1Id: effectiveP1 ? effectiveP1.id : null,
                player2Id: effectiveP2 ? effectiveP2.id : null,
                winnerId: isBye ? effectiveP1.id : null,
                status: isBye ? 'COMPLETED' : 'PENDING',
                autoWinnerId: isBye ? effectiveP1.id : null
            });
        }

        // Add Round 1 matches
        for (const m of r1Matches) {
            const { autoWinnerId, ...dbMatch } = m;
            matchesData.push(dbMatch);
        }

        // 2. Generate Subsequent Rounds & Auto-route Round 1 BYE winners to Round 2
        let prevRoundMatches = r1Matches;
        let prevRoundCount = round1MatchesCount;

        for (let r = 2; r <= totalRounds; r++) {
            const matchesInRound = prevRoundCount / 2;
            const currentRoundMatches: any[] = [];

            for (let i = 0; i < matchesInRound; i++) {
                // If previous round (Round 1) had a BYE, route that winner directly to Round 2 slot
                const prevM1 = (r === 2) ? prevRoundMatches[i * 2] : null;
                const prevM2 = (r === 2) ? prevRoundMatches[i * 2 + 1] : null;

                const p1Id = prevM1?.autoWinnerId || null;
                const p2Id = prevM2?.autoWinnerId || null;

                const matchObj = {
                    tournamentId,
                    round: r,
                    matchNumber: matchNumber++,
                    player1Id: p1Id,
                    player2Id: p2Id,
                    winnerId: null,
                    status: 'PENDING'
                };
                currentRoundMatches.push(matchObj);
                matchesData.push(matchObj);
            }
            prevRoundCount = matchesInRound;
        }

        await prisma.tournamentMatch.createMany({ data: matchesData });
        
        return prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: 'ONGOING' },
            include: { matches: { include: { player1: true, player2: true, winner: true } } }
        });
    }

    private static async generateDoubleElimination(tournamentId: string) {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { participants: { include: { member: true } } }
        });
        if (!tournament) throw new AppError('Tournament not found', 404);

        const N = tournament.participants.length;
        if (N < 2) throw new AppError('Minimum 2 peserta untuk generate bracket', 400);

        let wbSize = 1;
        const targetCapacity = Math.max(N, tournament.maxPlayers || 0);
        while (wbSize < targetCapacity) wbSize *= 2;

        const slotMap = this.smartShuffleAndSeed(tournament.participants, wbSize);

        // Safe transitionSize: Must be a valid power of 2, >= 2, and strictly <= wbSize / 2
        let transitionSize = tournament.transitionSize ? Number(tournament.transitionSize) : 32;
        if (!transitionSize || transitionSize > wbSize / 2 || transitionSize < 2) {
            transitionSize = Math.max(2, wbSize / 2);
        }
        const targetSurvivors = Math.max(1, Math.floor(transitionSize / 2));

        const lastWBRound = Math.max(1, Math.round(Math.log2(wbSize) - Math.log2(targetSurvivors)));
        
        const matchesData: any[] = [];
        let matchNum = 1;

        // --- 1. WINNERS BRACKET ---
        let wbMatchSize = wbSize / 2;
        for (let r = 1; r <= lastWBRound; r++) {
            for (let i = 0; i < wbMatchSize; i++) {
                const m: any = {
                    tournamentId,
                    round: r,
                    matchNumber: matchNum++,
                    bracket: 'WINNERS',
                    player1Id: null,
                    player2Id: null,
                    status: 'PENDING',
                    winnerId: null
                };
                if (r === 1) {
                    const p1 = slotMap[i * 2];
                    const p2 = slotMap[i * 2 + 1];
                    const effectiveP1 = p1 || p2 || null;
                    const effectiveP2 = (p1 && p2) ? p2 : null;
                    m.player1Id = effectiveP1?.id || null;
                    m.player2Id = effectiveP2?.id || null;
                    if (effectiveP1 && !effectiveP2) {
                        m.winnerId = effectiveP1.id;
                        m.status = 'COMPLETED';
                    }
                }
                matchesData.push(m);
            }
            wbMatchSize = Math.floor(wbMatchSize / 2);
        }

        // --- 2. LOSERS BRACKET ---
        const lbSizes: number[] = [];
        let sz = Math.floor(wbSize / 4);
        while (sz >= 1 && sz >= Math.floor(targetSurvivors / 2)) {
            lbSizes.push(sz);
            if (sz > 1) {
                lbSizes.push(sz);
            }
            sz = Math.floor(sz / 2);
        }

        if (lbSizes.length === 0 && wbSize >= 4) {
            lbSizes.push(1);
        }

        for (let r = 0; r < lbSizes.length; r++) {
            const lbSize = lbSizes[r];
            for (let i = 0; i < lbSize; i++) {
                matchesData.push({
                    tournamentId,
                    round: r + 1,
                    matchNumber: matchNum++,
                    bracket: 'LOSERS',
                    player1Id: null,
                    player2Id: null,
                    status: 'PENDING',
                    winnerId: null
                });
            }
        }

        // --- 3. FINAL PHASE ---
        let finalSize = targetSurvivors;
        let finalRound = lastWBRound + 1;
        while (finalSize >= 1) {
            for (let i = 0; i < finalSize; i++) {
                matchesData.push({
                    tournamentId,
                    round: finalRound,
                    matchNumber: matchNum++,
                    bracket: 'WINNERS',
                    player1Id: null,
                    player2Id: null,
                    status: 'PENDING',
                    winnerId: null
                });
            }
            finalSize = Math.floor(finalSize / 2);
            finalRound++;
        }

        await prisma.tournamentMatch.createMany({ data: matchesData });

        return prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: 'ONGOING' },
            include: { matches: true }
        });
    }

    static async resetBracket(tournamentId: string) {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId }
        });
        if (!tournament) throw new AppError('Tournament not found', 404);
        if (tournament.status === 'COMPLETED') throw new AppError('Cannot reset bracket of completed tournament', 400);

        return prisma.$transaction(async (tx) => {
            await tx.tournamentMatch.deleteMany({ where: { tournamentId } });
            return tx.tournament.update({
                where: { id: tournamentId },
                data: { status: 'PENDING' }
            });
        });
    }

    static async reshuffleBracket(tournamentId: string) {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId }
        });
        if (!tournament) throw new AppError('Tournament not found', 404);
        if (tournament.status === 'COMPLETED') throw new AppError('Cannot reshuffle completed tournament', 400);

        await prisma.tournamentMatch.deleteMany({ where: { tournamentId } });
        await prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: 'PENDING' }
        });

        return this.generateBracket(tournamentId);
    }

    static async getTournamentTables(tournamentId: string) {
        const tables = await prisma.table.findMany({
            where: {
                name: { startsWith: 'Table' }
            },
            select: {
                id: true,
                name: true,
                status: true,
                relayChannel: true
            },
            orderBy: { name: 'asc' }
        });

        const activeMatches = await prisma.tournamentMatch.findMany({
            where: {
                tournamentId,
                status: 'ONGOING',
                tableId: { not: null }
            },
            include: {
                player1: { include: { member: true } },
                player2: { include: { member: true } },
                table: true
            }
        });

        return tables.map(t => {
            const activeMatch = activeMatches.find(m => m.tableId === t.id);
            return {
                ...t,
                activeMatch: activeMatch || null
            };
        });
    }

    static async assignMatchTable(matchId: string, data: { tableId?: string | null, status?: string }) {
        const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } });
        if (!match) throw new AppError('Match not found', 404);

        const tableId = data.tableId !== undefined ? data.tableId : match.tableId;
        const newStatus = data.status || (tableId ? 'ONGOING' : 'PENDING');

        const updatedMatch = await prisma.tournamentMatch.update({
            where: { id: matchId },
            data: {
                tableId: tableId,
                status: newStatus
            },
            include: {
                table: true,
                player1: { include: { member: true } },
                player2: { include: { member: true } },
                winner: true
            }
        });

        return updatedMatch;
    }

    static async updateMatchResult(matchId: string, data: { score1: number, score2: number, winnerId?: string | null, tableId?: string | null, status?: string }) {
        const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } });
        if (!match) throw new AppError('Match not found', 404);

        const newStatus = data.status || (data.winnerId ? 'COMPLETED' : 'ONGOING');

        const updatedMatch = await prisma.tournamentMatch.update({
            where: { id: matchId },
            data: {
                score1: data.score1 !== undefined ? data.score1 : match.score1,
                score2: data.score2 !== undefined ? data.score2 : match.score2,
                winnerId: data.winnerId !== undefined ? data.winnerId : match.winnerId,
                status: newStatus,
                ...(data.tableId !== undefined ? { tableId: data.tableId } : {})
            },
            include: {
                table: true,
                player1: true,
                player2: true,
                winner: true
            }
        });

        // Add small flat 50 loyalty points per match win to winner
        if (data.winnerId) {
            const tournament = await prisma.tournament.findUnique({
                where: { id: match.tournamentId },
                include: { matches: true }
            });

            const participant = await prisma.tournamentParticipant.findUnique({
                where: { id: data.winnerId }
            });

            if (participant?.memberId && tournament) {
                try {
                    const { LoyaltyService } = await import('../loyalty/loyalty.service');
                    await LoyaltyService.awardTournamentRewards(participant.memberId, 'MATCH_WIN', tournament.entryFee);
                    
                    await prisma.member.update({
                        where: { id: participant.memberId },
                        data: { totalWins: { increment: 1 } }
                    });
                } catch (e) {
                    console.error('Match win loyalty error:', e);
                }
            }

            // Advance to next round
            if (tournament) {
                const t = tournament as any;
                const formatStr = (t.format || '').toUpperCase();
                const rulesStr = (t.rules || '').toUpperCase();
                const isRoundRobin = formatStr.includes('ROUND_ROBIN') || formatStr.includes('BEREGU') || formatStr.includes('TEAM') || rulesStr.includes('ROUND_ROBIN') || t.eliminationType === 'ROUND_ROBIN';

                if (!isRoundRobin) {
                    const wbSize = t.matches.filter((m: any) => m.bracket === 'WINNERS' && m.round === 1).length * 2;
                    
                    let targetBracket = '';
                    let targetRound = 0;
                    let targetMatchIndex = 0;
                    let targetSlot = 0;

                    const currentBracketMatches = t.matches.filter((m: any) => m.bracket === (match as any).bracket && m.round === match.round).sort((a: any, b: any) => a.matchNumber - b.matchNumber);
                    const currentMatchIndex = currentBracketMatches.findIndex((m: any) => m.id === match.id);

                    if (currentMatchIndex === -1) {
                        throw new AppError('Current match not found in its round/bracket', 500);
                    }

                if (t.eliminationType === 'DOUBLE') {
                    const transitionSize = t.transitionSize || 32;
                    const targetSurvivors = Math.max(1, transitionSize / 2);
                    const lastWBRound = Math.max(1, Math.log2(wbSize) - Math.log2(targetSurvivors));
                    const lastLBRound = 2 * (lastWBRound - 1);

                    // --- ADVANCE WINNER ---
                    if ((match as any).bracket === 'WINNERS') {
                        if (match.round === lastWBRound) {
                            targetBracket = 'WINNERS';
                            targetRound = match.round + 1;
                            targetMatchIndex = currentMatchIndex;
                            targetSlot = 0;
                        } else {
                            targetBracket = 'WINNERS';
                            targetRound = match.round + 1;
                            targetMatchIndex = Math.floor(currentMatchIndex / 2);
                            targetSlot = currentMatchIndex % 2;
                        }
                    } else if ((match as any).bracket === 'LOSERS') {
                        if (match.round === lastLBRound) {
                            targetBracket = 'WINNERS';
                            targetRound = lastWBRound + 1;
                            targetMatchIndex = currentMatchIndex;
                            targetSlot = 1;
                        } else {
                            targetBracket = 'LOSERS';
                            targetRound = match.round + 1;
                            if (match.round % 2 === 1) {
                                targetMatchIndex = currentMatchIndex;
                                targetSlot = 0;
                            } else {
                                targetMatchIndex = Math.floor(currentMatchIndex / 2);
                                targetSlot = currentMatchIndex % 2;
                            }
                        }
                    }

                    // --- ADVANCE LOSER ---
                    if ((match as any).bracket === 'WINNERS' && match.round <= lastWBRound && data.winnerId) {
                        const loserId = match.player1Id === data.winnerId ? match.player2Id : match.player1Id;
                        if (loserId) {
                            let loserTargetRound = 0;
                            let loserTargetMatchIndex = 0;
                            let loserTargetSlot = 0;

                            if (match.round === 1) {
                                loserTargetRound = 1;
                                loserTargetMatchIndex = Math.floor(currentMatchIndex / 2);
                                loserTargetSlot = currentMatchIndex % 2;
                            } else {
                                loserTargetRound = 2 * (match.round - 1);
                                loserTargetMatchIndex = currentMatchIndex;
                                loserTargetSlot = 1;
                            }

                            if (loserTargetRound > 0) {
                                const lbTargetMatches = t.matches.filter((m: any) => m.bracket === 'LOSERS' && m.round === loserTargetRound).sort((a: any, b: any) => a.matchNumber - b.matchNumber);
                                const lbMatch = lbTargetMatches[loserTargetMatchIndex];
                                if (lbMatch) {
                                    await prisma.tournamentMatch.update({
                                        where: { id: lbMatch.id },
                                        data: { [loserTargetSlot === 1 ? 'player2Id' : 'player1Id']: loserId }
                                    });
                                }
                            }
                        }
                    }
                } else {
                    // --- SINGLE ELIMINATION WINNER ROUTING ---
                    targetBracket = 'WINNERS';
                    targetRound = match.round + 1;
                    targetMatchIndex = Math.floor(currentMatchIndex / 2);
                    targetSlot = currentMatchIndex % 2;
                }

                // Apply Winner Routing
                if (targetBracket && targetRound) {
                    const nextRoundMatches = t.matches.filter((m: any) => m.bracket === targetBracket && m.round === targetRound).sort((a: any, b: any) => a.matchNumber - b.matchNumber);
                    if (nextRoundMatches.length > 0) {
                        const nextMatch = nextRoundMatches[targetMatchIndex];
                        if (nextMatch) {
                            await prisma.tournamentMatch.update({
                                where: { id: nextMatch.id },
                                data: { [targetSlot === 1 ? 'player2Id' : 'player1Id']: data.winnerId }
                            });
                        }
                    }
                }
            }
        }
    }

        return updatedMatch;
    }

    static async updateMatchPlayers(matchId: string, data: { player1Id?: string | null, player2Id?: string | null }) {
        const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } });
        if (!match) throw new AppError('Match not found', 404);

        const updatedMatch = await prisma.tournamentMatch.update({
            where: { id: matchId },
            data: {
                player1Id: data.player1Id !== undefined ? data.player1Id : match.player1Id,
                player2Id: data.player2Id !== undefined ? data.player2Id : match.player2Id,
                status: 'PENDING',
                winnerId: null,
                score1: 0,
                score2: 0
            }
        });

        return updatedMatch;
    }

    static async finishTournament(tournamentId: string, payload: { championId: string; runnerUpId?: string; semiFinalistIds?: string[] }) {
        const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
        if (!tournament) throw new AppError('Tournament not found', 404);

        if (tournament.status === 'COMPLETED') throw new AppError('Already finished', 400);

        await prisma.$transaction(async (tx) => {
            const loadMemberId = async (participantId: string) => {
                if (!participantId) return null;
                const p = await tx.tournamentParticipant.findUnique({ where: { id: participantId } });
                return p?.memberId || null;
            };

            const championMemberId = await loadMemberId(payload.championId);
            const runnerUpMemberId = await loadMemberId(payload.runnerUpId || '');

            // Mark tournament completed and save champion
            await tx.tournament.update({ 
                where: { id: tournamentId }, 
                data: { 
                    status: 'COMPLETED',
                    championId: championMemberId
                } 
            });

            const { LoyaltyService } = await import('../loyalty/loyalty.service');

            // Champion Rewards
            if (championMemberId) {
                await LoyaltyService.awardTournamentRewards(championMemberId, 'PLACEMENT', tournament.entryFee, tournament.prizeChampion);
                await tx.member.update({
                    where: { id: championMemberId },
                    data: { totalWins: { increment: 1 } }
                });
            }

            // Runner Up Rewards
            if (runnerUpMemberId) {
                await LoyaltyService.awardTournamentRewards(runnerUpMemberId, 'PLACEMENT', tournament.entryFee, tournament.prizeRunnerUp);
            }

            // Semi Finalists Rewards
            if (payload.semiFinalistIds && payload.semiFinalistIds.length > 0) {
                for (const id of payload.semiFinalistIds) {
                    const sfMemberId = await loadMemberId(id);
                    if (sfMemberId) {
                        await LoyaltyService.awardTournamentRewards(sfMemberId, 'PLACEMENT', tournament.entryFee, tournament.prizeSemiFinal);
                    }
                }
            }
        });

        return { message: 'Tournament Finished' };
    }

    static async deleteTournament(id: string) {
        await prisma.$transaction(async (tx) => {
            await tx.tournamentMatch.deleteMany({ where: { tournamentId: id } });
            await tx.tournamentParticipant.deleteMany({ where: { tournamentId: id } });
            await tx.tournament.delete({ where: { id } });
        });
        return { message: 'Tournament deleted successfully' };
    }

    static async removeParticipant(tournamentId: string, participantId: string) {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { matches: true }
        });

        if (!tournament) throw new AppError('Tournament not found', 404);
        if (tournament.status === 'COMPLETED') throw new AppError('Cannot remove participants from completed tournament', 400);

        return prisma.$transaction(async (tx) => {
            // Nullify in matches
            await tx.tournamentMatch.updateMany({
                where: { tournamentId, player1Id: participantId },
                data: { player1Id: null }
            });
            await tx.tournamentMatch.updateMany({
                where: { tournamentId, player2Id: participantId },
                data: { player2Id: null }
            });
            await tx.tournamentMatch.updateMany({
                where: { tournamentId, winnerId: participantId },
                data: { winnerId: null }
            });

            // Delete participant
            return tx.tournamentParticipant.delete({
                where: { id: participantId }
            });
        });
    }

    static async purgeParticipants(tournamentId: string) {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId }
        });

        if (!tournament) throw new AppError('Tournament not found', 404);
        if (tournament.status !== 'PENDING') throw new AppError('Can only purge participants in PENDING status', 400);

        return prisma.$transaction(async (tx) => {
            // If matches exist, they must be deleted too because they refer to participants
            await tx.tournamentMatch.deleteMany({ where: { tournamentId } });
            return tx.tournamentParticipant.deleteMany({ where: { tournamentId } });
        });
    }
}
