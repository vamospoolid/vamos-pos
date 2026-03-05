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

    static async registerParticipant(tournamentId: string, memberId?: string, name?: string, handicap?: string, paymentNotes?: string, status?: string) {
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

        const participant = await prisma.tournamentParticipant.create({
            data: {
                tournamentId,
                memberId: memberId || null,
                name: memberId ? null : name,
                handicap,
                paymentNotes,
                paymentStatus: status || (tournament.entryFee > 0 ? 'UNPAID' : 'PAID')
            },
            include: { member: true }
        });

        // LOYALTY INTEGRATION: 200 pts for participation
        if (memberId) {
            try {
                const { LoyaltyService } = await import('../loyalty/loyalty.service');
                await LoyaltyService.awardTournamentPoints(memberId, 'PARTICIPATE');
            } catch (e) {
                console.error('Loyalty award error:', e);
            }
        }

        return participant;
    }

    static async updateParticipantStatus(tournamentId: string, participantId: string, paymentStatus: string) {
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
            include: { participants: true, matches: true }
        });
        if (!tournament) throw new AppError('Tournament not found', 404);
        if (tournament.matches.length > 0) throw new AppError('Bracket already generated', 400);

        let participants = [...tournament.participants].sort(() => Math.random() - 0.5); // shuffle

        // Find nearest power of 2
        let n = 2;
        while (n < participants.length) n *= 2;

        const matchesData: any[] = [];
        let totalRounds = Math.log2(n);
        let matchIndex = 1;

        // Round 1
        for (let i = 0; i < n; i += 2) {
            matchesData.push({
                tournamentId,
                round: 1,
                matchNumber: matchIndex++,
                player1Id: participants[i]?.id || null,
                player2Id: participants[i + 1]?.id || null,
            });
        }

        // Subsequent rounds
        let matchesInPreviousRound = n / 2;
        let startOfCurrentRound = 1;
        for (let r = 2; r <= totalRounds; r++) {
            let matchesInCurrentRound = matchesInPreviousRound / 2;
            for (let i = 0; i < matchesInCurrentRound; i++) {
                matchesData.push({
                    tournamentId,
                    round: r,
                    matchNumber: matchIndex++,
                    player1Id: null,
                    player2Id: null,
                });
            }
            matchesInPreviousRound = matchesInCurrentRound;
        }

        await prisma.tournamentMatch.createMany({ data: matchesData });

        return prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: 'ONGOING' },
            include: { matches: true }
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
            const participant = await prisma.tournamentParticipant.findUnique({
                where: { id: data.winnerId }
            });

            if (participant?.memberId) {
                await prisma.member.update({
                    where: { id: participant.memberId },
                    data: { loyaltyPoints: { increment: 50 }, totalWins: { increment: 1 } }
                });
            }

            // Advance to next round
            const tournament = await prisma.tournament.findUnique({
                where: { id: match.tournamentId },
                include: { matches: true }
            });

            if (tournament) {
                // Determine next match
                // Match tree logic: if current match is N in round R, it feeds into match Math.ceil(N/2) in round R+1
                // We need to find the correct match index in the next round.
                // It's easier: just find the matches in current round, and map to next round.
                const currentRoundMatches = tournament.matches.filter(m => m.round === match.round).sort((a, b) => a.matchNumber - b.matchNumber);
                const nextRoundMatches = tournament.matches.filter(m => m.round === match.round + 1).sort((a, b) => a.matchNumber - b.matchNumber);

                const currentMatchIndex = currentRoundMatches.findIndex(m => m.id === match.id);
                if (currentMatchIndex !== -1 && nextRoundMatches.length > 0) {
                    const nextMatchIndex = Math.floor(currentMatchIndex / 2);
                    const nextMatch = nextRoundMatches[nextMatchIndex];
                    if (nextMatch) {
                        const isPlayer1 = currentMatchIndex % 2 === 0;
                        await prisma.tournamentMatch.update({
                            where: { id: nextMatch.id },
                            data: isPlayer1 ? { player1Id: data.winnerId } : { player2Id: data.winnerId }
                        });
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
                await tx.member.update({
                    where: { id: championMemberId },
                    data: {
                        totalWins: { increment: 1 },
                        totalPrizeWon: { increment: tournament.prizeChampion }
                    }
                });
                await LoyaltyService.awardTournamentPoints(championMemberId, 'CHAMPION');
            }

            // Runner Up Rewards
            if (runnerUpMemberId) {
                await tx.member.update({
                    where: { id: runnerUpMemberId },
                    data: {
                        totalPrizeWon: { increment: tournament.prizeRunnerUp }
                    }
                });
                await LoyaltyService.awardTournamentPoints(runnerUpMemberId, 'RUNNER_UP');
            }

            // Semi Finalists Rewards (staying as is for now as not explicitly changed in points rule request)
            if (payload.semiFinalistIds && payload.semiFinalistIds.length > 0) {
                for (const id of payload.semiFinalistIds) {
                    const sfMemberId = await loadMemberId(id);
                    if (sfMemberId) {
                        await tx.member.update({
                            where: { id: sfMemberId },
                            data: {
                                loyaltyPoints: { increment: 200 },
                                totalPrizeWon: { increment: tournament.prizeSemiFinal }
                            }
                        });
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
}
