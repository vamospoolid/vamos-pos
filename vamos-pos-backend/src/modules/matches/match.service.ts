import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';

export class MatchService {
    static async recordMatch(sessionId: string, memberIds: string[], winnerId: string | null, userId: string) {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) throw new AppError('Session not found', 404);

        const result = await prisma.$transaction(async (tx) => {
            const match = await tx.match.create({
                data: {
                    sessionId,
                    winnerId,
                    members: {
                        create: memberIds.map(memberId => ({ memberId }))
                    }
                }
            });

            for (const memberId of memberIds) {
                const isWinner = memberId === winnerId;
                const member = await tx.member.findUnique({ where: { id: memberId } });
                if (member) {
                    const totalMatches = member.totalMatches + 1;
                    const totalWins = member.totalWins + (isWinner ? 1 : 0);
                    const winRate = (totalWins / totalMatches) * 100;

                    await tx.member.update({
                        where: { id: memberId },
                        data: { totalMatches, totalWins, winRate }
                    });
                }
            }
            return match;
        });

        await AuditService.log(userId, 'MATCH_RECORDED', 'Match', { matchId: result.id });
        return result;
    }

    static async getLeaderboard() {
        return prisma.member.findMany({
            orderBy: { winRate: 'desc' },
            take: 10,
            select: {
                id: true,
                name: true,
                totalMatches: true,
                totalWins: true,
                winRate: true
            }
        });
    }
}
