import { prisma } from '../../database/db';

export class KingService {
    /**
     * Updates the King of the Table status after a match.
     * Only applies if the table is designated as a King Table.
     * @param tableId The ID of the table where the match was played
     * @param winnerId The member ID of the winner
     * @param matchId Optional match ID for tracking
     */
    static async handleMatchEnd(tableId: string, winnerId: string, matchId?: string) {
        const table = await prisma.table.findUnique({
            where: { id: tableId },
            include: { kingStatus: true }
        });

        // Only process if it's a King Table
        if (!table || !table.isKingTable) return null;

        const currentKing = table.kingStatus;

        if (!currentKing) {
            // No king yet, first king for this table
            const newKing = await prisma.kingTable.create({
                data: {
                    tableId,
                    kingMemberId: winnerId,
                    streak: 1,
                    sinceMatchId: matchId || null
                },
                include: { king: true }
            });
            await this.updateMemberStreak(winnerId, 1);
            return { action: 'NEW_KING', data: newKing };
        }

        if (currentKing.kingMemberId === winnerId) {
            // King defends the title
            const updatedKing = await prisma.kingTable.update({
                where: { tableId },
                data: {
                    streak: { increment: 1 }
                },
                include: { king: true }
            });
            await this.updateMemberStreak(winnerId, updatedKing.streak);
            return { action: 'KING_DEFENDED', data: updatedKing };
        } else {
            // King is dethroned!
            const newKing = await prisma.kingTable.update({
                where: { tableId },
                data: {
                    kingMemberId: winnerId,
                    streak: 1,
                    sinceMatchId: matchId || null
                },
                include: { king: true }
            });
            await this.updateMemberStreak(winnerId, 1);
            return { action: 'KING_DETHRONED', data: newKing };
        }
    }

    private static async updateMemberStreak(memberId: string, currentStreak: number) {
        const member = await prisma.member.findUnique({
            where: { id: memberId },
            select: { highestKingStreak: true }
        });

        if (member && currentStreak > member.highestKingStreak) {
            await prisma.member.update({
                where: { id: memberId },
                data: { highestKingStreak: currentStreak }
            });
        }
    }

    /**
     * Get all active King Tables and their current status
     */
    static async getGlobalKingStatus() {
        return prisma.kingTable.findMany({
            include: {
                table: { select: { name: true, id: true } },
                king: { select: { name: true, id: true, photo: true, level: true, skillRating: true, streakCount: true } }
            },
            orderBy: { streak: 'desc' }
        });
    }

    /**
     * Mark a table as a King Table
     */
    static async designateKingTable(tableId: string, isKing: boolean = true) {
        return prisma.table.update({
            where: { id: tableId },
            data: { isKingTable: isKing }
        });
    }

    /**
     * Get top players with highest historical streaks
     */
    static async getHallOfFame(limit: number = 10) {
        return prisma.member.findMany({
            where: { highestKingStreak: { gt: 0 }, deletedAt: null },
            select: {
                id: true,
                name: true,
                photo: true,
                level: true,
                highestKingStreak: true,
                skillRating: true
            },
            orderBy: { highestKingStreak: 'desc' },
            take: limit
        });
    }
}
