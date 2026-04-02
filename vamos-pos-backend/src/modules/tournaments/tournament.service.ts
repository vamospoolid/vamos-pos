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
            const exists = await prisma.tournamentParticipant.findFirst({
                where: { tournamentId, memberId }
            });
            if (exists) throw new AppError('Member already registered', 400);
        }

        const finalStatus = status || (tournament.entryFee > 0 ? 'UNPAID' : 'PAID');

        const result = await prisma.$transaction(async (tx) => {
            const participant = await tx.tournamentParticipant.create({
                data: {
                    tournamentId,
                    memberId: memberId || null,
                    name: memberId ? null : name,
                    handicap,
                    paymentNotes,
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

    private static async generateSingleElimination(tournamentId: string) {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { participants: true }
        });
        if (!tournament) throw new AppError('Tournament not found', 404);

        let participants = [...tournament.participants].sort(() => Math.random() - 0.5);
        const N = participants.length;

        if (N < 2) throw new AppError('Minimum 2 peserta untuk generate bracket', 400);

        // --- Find next power of 2 (bracket size) ---
        // Use maxPlayers as the intended bracket capacity, or N if it's larger
        let bracketSize = 1;
        const targetCapacity = Math.max(N, tournament.maxPlayers || 0);
        while (bracketSize < targetCapacity) bracketSize *= 2;

        const totalRounds = Math.log2(bracketSize);
        const byes = bracketSize - N; // number of free passes to round 2

        /**
         * Smart Seeding with Byes:
         * 
         * Standard bracket seeding for bracketSize slots:
         * slots[0] vs slots[bracketSize-1], slots[1] vs slots[bracketSize-2], etc.
         * 
         * The first `byes` seeded positions get a BYE (no opponent in Round 1).
         * They are auto-advanced to Round 2.
         * 
         * We build a standard seeded slot array, then place participants into slots.
         * Slots that have no participant = BYE.
         */
        const buildSeededOrder = (size: number): number[] => {
            if (size === 2) return [0, 1];
            const prev = buildSeededOrder(size / 2);
            const result: number[] = [];
            for (const p of prev) {
                result.push(p);
                result.push(size - 1 - p);
            }
            return result;
        };

        // seededOrder tells us: at bracket position i, which participant slot index goes there
        const seededOrder = buildSeededOrder(bracketSize);

        // Build a participant map: bracketPosition -> participant (or null = bye)
        // Top `byes` positions in seeded order get BYE (no participant fills opposing slot)
        // Actually, a BYE means one of the two slots in a Round 1 match has no player.
        // We assign participants to slots, and positions without a participant = BYE.
        const slotMap: (typeof participants[0] | null)[] = Array(bracketSize).fill(null);
        for (let i = 0; i < N; i++) {
            slotMap[seededOrder[i]] = participants[i];
        }
        // slotMap[seededOrder[N]] through slotMap[seededOrder[bracketSize-1]] remain null = BYE

        const matchesData: any[] = [];
        let matchNumber = 1;

        // --- Round 1 matches ---
        // Create a match for every pair of bracket slots
        // If a match has player1 but player2 = null, it's a BYE match
        // We'll track which matches are bye matches, and auto-advance their player to round 2
        const round1Matches: { idx: number; player1: typeof participants[0] | null; player2: typeof participants[0] | null; isBye: boolean }[] = [];

        for (let i = 0; i < bracketSize; i += 2) {
            const p1 = slotMap[i];
            const p2 = slotMap[i + 1];
            const isBye = (p1 !== null && p2 === null) || (p1 === null && p2 !== null);
            round1Matches.push({ idx: Math.floor(i / 2), player1: p1, player2: p2, isBye });
        }

        // Push round 1 matches to matchesData
        const round1MatchIndices: number[] = [];
        for (const rm of round1Matches) {
            round1MatchIndices.push(matchNumber);
            matchesData.push({
                tournamentId,
                round: 1,
                matchNumber: matchNumber++,
                player1Id: rm.player1?.id || null,
                player2Id: rm.isBye ? null : (rm.player2?.id || null),
                // For bye matches: mark as COMPLETED with the non-null player as winner
                // We'll handle this after DB insert
            });
        }

        // --- Subsequent rounds (empty placeholder matches) ---
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

        // (Auto-advance BYE removed to allow manual slot filling as requested by user)
        
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

        const players = [...tournament.participants].sort(() => Math.random() - 0.5);
        const N = players.length;
        
        // Find next power of 2 for WB size
        let wbSize = 1;
        const target = Math.max(N, tournament.maxPlayers || 0);
        while (wbSize < target) wbSize *= 2;

        const matchesData: any[] = [];
        let matchNum = 1;

        // --- WINNERS BRACKET ---
        // Basic Single Elim generator for WB
        const wbMatchMap: any[] = [];
        let currentWBRoundSize = wbSize / 2;
        let round = 1;

        while (currentWBRoundSize >= 1) {
            for (let i = 0; i < currentWBRoundSize; i++) {
                const m: any = {
                    tournamentId,
                    round,
                    matchNumber: matchNum++,
                    bracket: 'WINNERS',
                    player1Id: null,
                    player2Id: null,
                };
                
                // Assign initial players to Round 1
                if (round === 1) {
                    const p1Idx = i * 2;
                    const p2Idx = i * 2 + 1;
                    m.player1Id = players[p1Idx]?.id || null;
                    m.player2Id = players[p2Idx]?.id || null;
                }
                
                matchesData.push(m);
                wbMatchMap.push(m);
            }
            // Transition to Single Elim for Final Phase: 
            // In hybrid, if we reach Top 32, we stop generating "Double" structure and keep simple WB.
            // But for simple implementation, we generate FULL WB/LB.
            currentWBRoundSize /= 2;
            round++;
        }

        // --- LOSERS BRACKET (Qualifying for Single Elim) ---
        // We only generate LB until we have the same Number of survivors as WB at the transition point.
        // Transition Point: WB has transitionSize/2 winners, LB has transitionSize/2 winners. Total transitionSize.
        
        let lbMatchNum = matchNum;
        let currentLBRoundSize = wbSize / 4; 
        let lbRound = 1;

        const transitionSize = tournament.transitionSize || 32;
        const targetSurvivors = transitionSize / 2; // When WB has this many survivors
        let wbSurvivors = wbSize / 2;
        
        while (wbSurvivors > targetSurvivors) {
            // Stage 1: LB winners play each other (if it's not the very first round)
            if (lbRound > 1) {
                const matchesInStage = currentLBRoundSize;
                for (let i = 0; i < matchesInStage; i++) {
                    matchesData.push({
                        tournamentId,
                        round: lbRound++,
                        matchNumber: lbMatchNum++,
                        bracket: 'LOSERS',
                        player1Id: null,
                        player2Id: null,
                    });
                }
            }

            // Stage 2: LB winners vs WB Losers
            // The number of matches is same as WB losers incoming
            const matchesInStage = wbSurvivors / 2;
            for (let i = 0; i < matchesInStage; i++) {
                matchesData.push({
                    tournamentId,
                    round: lbRound++,
                    matchNumber: lbMatchNum++,
                    bracket: 'LOSERS',
                    player1Id: null,
                    player2Id: null,
                });
            }
            
            wbSurvivors /= 2;
            currentLBRoundSize = wbSurvivors / 2;
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
                const t = tournament as any; // Cast for bracket property
                const transitionSize = t.transitionSize || 32;
                const targetSurvivors = transitionSize / 2;
                const wbSize = t.matches.filter((m: any) => m.bracket === 'WINNERS' && m.round === 1).length * 2;
                
                const currentBracketMatches = t.matches.filter((m: any) => m.bracket === (match as any).bracket && m.round === match.round).sort((a: any, b: any) => a.matchNumber - b.matchNumber);
                const currentMatchIndex = currentBracketMatches.findIndex((m: any) => m.id === match.id);

                if (currentMatchIndex === -1) {
                    throw new AppError('Current match not found in its round/bracket', 500);
                }

                // --- ADVANCE WINNER ---
                const nextRoundMatches = t.matches.filter((m: any) => m.bracket === (match as any).bracket && m.round === match.round + 1).sort((a: any, b: any) => a.matchNumber - b.matchNumber);
                
                if (nextRoundMatches.length > 0) {
                    const nextMatchIndex = Math.floor(currentMatchIndex / 2);
                    const nextMatch = nextRoundMatches[nextMatchIndex];
                    if (nextMatch) {
                        const isSlot2 = currentMatchIndex % 2 === 1;
                        await prisma.tournamentMatch.update({
                            where: { id: nextMatch.id },
                            data: { [isSlot2 ? 'player2Id' : 'player1Id']: data.winnerId }
                        });
                    }
                } else if ((match as any).bracket === 'LOSERS') {
                    // LB QUALIFIED: Merger Logic
                    // Winner of the last LB round goes to the 'player2Id' of WB transition round
                    const transitionRound = Math.log2(wbSize) - Math.log2(transitionSize / 2) + 1;
                    const wbTransitionMatches = t.matches.filter((m: any) => m.bracket === 'WINNERS' && m.round === transitionRound).sort((a: any, b: any) => a.matchNumber - b.matchNumber);
                    
                    if (wbTransitionMatches.length > 0) {
                        const targetWBMatch = wbTransitionMatches[currentMatchIndex];
                        if (targetWBMatch) {
                            await prisma.tournamentMatch.update({
                                where: { id: targetWBMatch.id },
                                data: { player2Id: data.winnerId }
                            });
                        }
                    }
                }

                // --- DOUBLE ELIMINATION: Loser Routing ---
                const currentWBSurvivors = wbSize / Math.pow(2, match.round);

                if (t.eliminationType === 'DOUBLE' && (match as any).bracket === 'WINNERS' && data.winnerId && currentWBSurvivors > targetSurvivors) {
                    const loserId = match.player1Id === data.winnerId ? match.player2Id : match.player1Id;
                    if (loserId) {
                        // Determine the target LB round based on WB round
                        let targetLBRound;
                        let lbMatchSlotIndex; // Which slot in the LB match the loser goes to

                        if (match.round === 1) {
                            // WB R1 losers go to LB R1
                            targetLBRound = 1;
                            lbMatchSlotIndex = currentMatchIndex % 2 === 0 ? 0 : 1; // 0 for player1 slot, 1 for player2 slot
                        } else {
                            // For WB R2 and beyond, losers go to a later LB round,
                            // potentially merging with winners from previous LB rounds.
                            // This logic needs to be more robust for full DE.
                            // For now, a simplified mapping:
                            // WB R2 losers -> LB R2 (merging with LB R1 winners)
                            // WB R3 losers -> LB R4 (merging with LB R3 winners)
                            // The pattern is: WB Round R losers go to LB Round 2*(R-1)
                            targetLBRound = 2 * (match.round - 1);
                            lbMatchSlotIndex = currentMatchIndex % 2 === 0 ? 0 : 1; // 0 for player1 slot, 1 for player2 slot
                        }

                        const lbMatchesInTargetRound = t.matches.filter((m: any) => m.bracket === 'LOSERS' && m.round === targetLBRound).sort((a: any, b: any) => a.matchNumber - b.matchNumber);
                        
                        if (lbMatchesInTargetRound.length > 0) {
                            const lbMatchIndex = Math.floor(currentMatchIndex / 2); // Simplified mapping for now
                            const lbMatch = lbMatchesInTargetRound[lbMatchIndex];

                            if (lbMatch) {
                                await prisma.tournamentMatch.update({
                                    where: { id: lbMatch.id },
                                    data: lbMatchSlotIndex === 0 ? { player1Id: loserId } : { player2Id: loserId }
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
            // Mark tournament completed
            await tx.tournament.update({ where: { id: tournamentId }, data: { status: 'COMPLETED' } });

            const loadMemberId = async (participantId: string) => {
                if (!participantId) return null;
                const p = await tx.tournamentParticipant.findUnique({ where: { id: participantId } });
                return p?.memberId || null;
            };

            const championMemberId = await loadMemberId(payload.championId);
            const runnerUpMemberId = await loadMemberId(payload.runnerUpId || '');

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
