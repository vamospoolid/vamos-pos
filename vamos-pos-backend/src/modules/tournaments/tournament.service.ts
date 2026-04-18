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
            if (registeredCount >= 2) throw new AppError('Member sudah terdaftar maksimal (2 slot) di turnamen ini', 400);
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

            // Create Payment record if paid immediately
            if (finalStatus === 'PAID' && tournament.entryFee > 0) {
                const activeShift = await tx.cashierShift.findFirst({
                    where: { userId, status: 'OPEN' }
                });

                await tx.payment.create({
                    data: {
                        amount: tournament.entryFee,
                        method: paymentMethod,
                        status: 'SUCCESS',
                        cashierId: userId,
                        shiftId: activeShift ? activeShift.id : undefined,
                        sessionId: undefined
                    } as any
                });
            }

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

        // If status changes to PAID, create a Payment record
        return prisma.$transaction(async (tx) => {
            if (paymentStatus === 'PAID' && participant.paymentStatus !== 'PAID' && tournament.entryFee > 0) {
                const activeShift = await tx.cashierShift.findFirst({
                    where: { userId, status: 'OPEN' }
                });

                await tx.payment.create({
                    data: {
                        amount: tournament.entryFee,
                        method: paymentMethod,
                        status: 'SUCCESS',
                        cashierId: userId,
                        shiftId: activeShift ? activeShift.id : undefined,
                        sessionId: undefined
                    } as any
                });
            }

            return tx.tournamentParticipant.update({
                where: { id: participantId },
                data: { paymentStatus }
            });
        });
    }

    static async generateBracket(tournamentId: string) {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { participants: true, matches: true }
        });
        if (!tournament) throw new AppError('Tournament not found', 404);
        if (tournament.matches.length > 0) throw new AppError('Bracket already generated', 400);
        
        const eliminationType = (tournament as any).eliminationType;

        if (eliminationType === 'DOUBLE') {
            return this.generateDoubleElimination(tournamentId);
        }

        return this.generateSingleElimination(tournamentId);
    }

    private static smartShuffleAndSeed(participants: any[], bracketSize: number) {
        const groups = new Map<string, any[]>();
        const singles: any[] = [];
        
        for (const p of participants) {
            if (p.memberId) {
                const arr = groups.get(p.memberId) || [];
                arr.push(p);
                groups.set(p.memberId, arr);
            } else {
                singles.push(p);
            }
        }
        
        const twins: any[][] = [];
        for (const arr of groups.values()) {
            if(arr.length >= 2) {
                twins.push([arr[0], arr[1]]);
                for(let i=2; i<arr.length; i++) singles.push(arr[i]);
            } else {
                singles.push(arr[0]);
            }
        }
        
        singles.sort(() => Math.random() - 0.5);
        twins.sort(() => Math.random() - 0.5);
        
        const pairs: any[][] = [...twins];
        for (let i = 0; i < singles.length; i += 2) {
            if (singles[i + 1]) {
                pairs.push([singles[i], singles[i + 1]]);
            } else {
                pairs.push([singles[i]]);
            }
        }
        
        pairs.sort(() => Math.random() - 0.5);
        
        const smartPlayers: any[] = [];
        for (const pair of pairs) {
            smartPlayers.push(pair[0]);
            if (pair[1]) smartPlayers.push(pair[1]);
        }

        const buildSeededOrder = (size: number): number[] => {
            if (size <= 1) return [0];
            const prev = buildSeededOrder(size / 2);
            const result: number[] = [];
            for (const p of prev) {
                result.push(p);
                result.push(size - 1 - p);
            }
            return result;
        };

        const seededOrder = buildSeededOrder(bracketSize);
        const slotMap: any[] = Array(bracketSize).fill(null);
        
        for (let i = 0; i < smartPlayers.length; i++) {
            slotMap[seededOrder[i]] = smartPlayers[i];
        }

        return slotMap;
    }

    private static async generateSingleElimination(tournamentId: string) {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { participants: true }
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

        const round1Matches: { idx: number; player1: any; player2: any; isBye: boolean }[] = [];

        for (let i = 0; i < bracketSize; i += 2) {
            const p1 = slotMap[i];
            const p2 = slotMap[i + 1];
            const isBye = (p1 !== null && p2 === null) || (p1 === null && p2 !== null);
            round1Matches.push({ idx: Math.floor(i / 2), player1: p1, player2: p2, isBye });
        }

        for (const rm of round1Matches) {
            matchesData.push({
                tournamentId,
                round: 1,
                matchNumber: matchNumber++,
                player1Id: rm.player1?.id || null,
                player2Id: rm.isBye ? null : (rm.player2?.id || null),
            });
        }

        let prevRoundCount = bracketSize / 2;
        for (let r = 2; r <= totalRounds; r++) {
            const matchesInRound = prevRoundCount / 2;
            for (let i = 0; i < matchesInRound; i++) {
                matchesData.push({
                    tournamentId,
                    round: r,
                    matchNumber: matchNumber++,
                    player1Id: null,
                    player2Id: null,
                });
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
            include: { participants: true }
        });
        if (!tournament) throw new AppError('Tournament not found', 404);

        const N = tournament.participants.length;
        
        let wbSize = 1;
        const targetCapacity = Math.max(N, tournament.maxPlayers || 0);
        while (wbSize < targetCapacity) wbSize *= 2;

        const slotMap = this.smartShuffleAndSeed(tournament.participants, wbSize);

        const transitionSize = tournament.transitionSize || 32;
        const targetSurvivors = Math.max(1, transitionSize / 2);

        const lastWBRound = Math.max(1, Math.log2(wbSize) - Math.log2(targetSurvivors));
        
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
                };
                if (r === 1) {
                    m.player1Id = slotMap[i * 2]?.id || null;
                    m.player2Id = slotMap[i * 2 + 1]?.id || null;
                }
                matchesData.push(m);
            }
            wbMatchSize /= 2;
        }

        // --- 2. LOSERS BRACKET ---
        const lbSizes: number[] = [];
        let sz = wbSize / 4;
        while (sz >= targetSurvivors) {
            lbSizes.push(sz);
            lbSizes.push(sz);
            sz /= 2;
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
                });
            }
            finalSize /= 2;
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

    static async updateMatchResult(matchId: string, data: { score1: number, score2: number, winnerId: string }) {
        const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } });
        if (!match) throw new AppError('Match not found', 404);

        const updatedMatch = await prisma.tournamentMatch.update({
            where: { id: matchId },
            data: {
                score1: data.score1,
                score2: data.score2,
                winnerId: data.winnerId,
                status: 'COMPLETED'
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
