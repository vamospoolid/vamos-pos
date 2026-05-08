import { prisma } from '../../database/db';
import { logger } from '../../utils/logger';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export const BADGES: Record<string, Badge> = {
    PIONEER: {
        id: 'PIONEER',
        name: 'First Blood',
        description: 'Menangkan pertandingan pertama Anda di Arena.',
        icon: 'Trophy'
    },
    STREAK_KING: {
        id: 'STREAK_KING',
        name: 'Streak King',
        description: 'Capai 3 kemenangan beruntun.',
        icon: 'Flame'
    },
    DEATHMATCH: {
        id: 'DEATHMATCH',
        name: 'High Roller',
        description: 'Menangkan pertandingan dengan stake di atas 100 PSS.',
        icon: 'Zap'
    },
    VETERAN: {
        id: 'VETERAN',
        name: 'Arena Veteran',
        description: 'Selesaikan 50 pertandingan.',
        icon: 'Shield'
    }
};

export class AchievementService {
    /**
     * Checks if a member qualifies for any new badges and awards them.
     * Returns an array of newly awarded badge IDs.
     */
    static async checkAndAwardBadges(
        memberId: string, 
        context: { totalWins?: number, streakCount?: number, stake?: number, totalMatches?: number },
        tx?: any
    ): Promise<string[]> {
        try {
            const db = tx || prisma;
            const member = await db.member.findUnique({
                where: { id: memberId },
                select: { badges: true, totalWins: true, streakCount: true, totalMatches: true }
            });

            if (!member) return [];

            const existingBadges = member.badges || [];
            const newlyAwarded: string[] = [];

            const wins = context.totalWins ?? member.totalWins;
            const streak = context.streakCount ?? member.streakCount;
            const stake = context.stake ?? 0;
            const matches = context.totalMatches ?? member.totalMatches;

            // 1. PIONEER: First win
            if (wins >= 1 && !existingBadges.includes('PIONEER')) {
                newlyAwarded.push('PIONEER');
            }

            // 2. STREAK_KING: 3 wins in a row
            if (streak >= 3 && !existingBadges.includes('STREAK_KING')) {
                newlyAwarded.push('STREAK_KING');
            }

            // 3. DEATHMATCH: Win with high stake
            if (stake >= 100 && !existingBadges.includes('DEATHMATCH')) {
                newlyAwarded.push('DEATHMATCH');
            }

            // 4. VETERAN: 50 matches
            if (matches >= 50 && !existingBadges.includes('VETERAN')) {
                newlyAwarded.push('VETERAN');
            }

            if (newlyAwarded.length > 0) {
                const updatedBadges = [...existingBadges, ...newlyAwarded];
                await db.member.update({
                    where: { id: memberId },
                    data: { badges: updatedBadges }
                });

                logger.info(`[AchievementService] Awarded badges ${newlyAwarded.join(', ')} to member ${memberId}`);
            }

            return newlyAwarded;
        } catch (error) {
            logger.error(`[AchievementService] Error checking badges for member ${memberId}:`, error);
            return [];
        }
    }
}
