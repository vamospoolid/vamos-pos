import { prisma } from '../../database/db';
import { LoyaltyService } from '../loyalty/loyalty.service';

export class QuestService {
    /**
     * Get or Initialize daily quests for a member
     */
    static async getMemberQuests(memberId: string) {
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Get all active quests
        let activeQuests = await prisma.quest.findMany({
            where: { isActive: true }
        });

        // Auto-seed if empty
        if (activeQuests.length === 0) {
            await this.seedDefaultQuests();
            activeQuests = await prisma.quest.findMany({
                where: { isActive: true }
            });
        }

        // 2. Ensure MemberQuest entries exist for today
        for (const q of activeQuests) {
            await prisma.memberQuest.upsert({
                where: {
                    memberId_questId_resetKey: {
                        memberId,
                        questId: q.id,
                        resetKey: today
                    }
                },
                update: {},
                create: {
                    memberId,
                    questId: q.id,
                    resetKey: today,
                    currentValue: 0,
                    isCompleted: false
                }
            });
        }

        // 3. Return combined data
        return prisma.memberQuest.findMany({
            where: { memberId, resetKey: today },
            include: { quest: true }
        });
    }

    /**
     * Update progress for a specific quest type
     */
    static async updateProgress(memberId: string, key: string, value: number = 1) {
        const today = new Date().toISOString().split('T')[0];
        
        const memberQuests = await prisma.memberQuest.findMany({
            where: {
                memberId,
                resetKey: today,
                quest: { key }
            },
            include: { quest: true }
        });

        for (const mq of memberQuests) {
            if (mq.isCompleted) continue;

            const newValue = mq.currentValue + value;
            const isNowCompleted = newValue >= mq.quest.targetValue;

            await prisma.memberQuest.update({
                where: { id: mq.id },
                data: {
                    currentValue: newValue,
                    isCompleted: isNowCompleted,
                    completedAt: isNowCompleted ? new Date() : null
                }
            });
        }
    }

    /**
     * Claim rewards for a completed quest
     */
    static async claimReward(memberQuestId: string, memberId: string) {
        const mq = await prisma.memberQuest.findUnique({
            where: { id: memberQuestId },
            include: { quest: true }
        });

        if (!mq || mq.memberId !== memberId || !mq.isCompleted || mq.isClaimed) {
            throw new Error('QUEST_NOT_CLAIMABLE');
        }

        // 1. Mark as claimed
        await prisma.memberQuest.update({
            where: { id: memberQuestId },
            data: {
                isClaimed: true,
                claimedAt: new Date()
            }
        });

        // 2. Award rewards via LoyaltyService
        if (mq.quest.rewardXp > 0) {
            await LoyaltyService.addExperience(memberId, mq.quest.rewardXp, `QUEST_REWARD: ${mq.quest.title}`);
        }

        if (mq.quest.rewardPts > 0) {
            await LoyaltyService.addPoints(memberId, mq.quest.rewardPts, 'EARN_BONUS', `QUEST_REWARD: ${mq.quest.title}`);
        }

        return { xp: mq.quest.rewardXp, pts: mq.quest.rewardPts };
    }

    /**
     * Seed initial quests (Admin only or system init)
     */
    static async seedDefaultQuests() {
        const defaults = [
            { key: 'MATCH_WIN', title: 'Daily Challenger', description: 'Win 1 match in the Arena', target: 1, xp: 500 },
            { key: 'STAKE_EARN', title: 'Point Collector', description: 'Earn 100 PSS from matches', target: 100, xp: 200 },
            { key: 'TOURNAMENT_JOIN', title: 'Social Elite', description: 'Join 1 Tournament session', target: 1, xp: 1000 }
        ];

        for (const d of defaults) {
            await prisma.quest.upsert({
                where: { id: d.key }, // Using key as stable ID for seeding
                update: {
                    title: d.title,
                    description: d.description,
                    targetValue: d.target,
                    rewardXp: d.xp,
                    type: 'DAILY'
                },
                create: {
                    id: d.key,
                    key: d.key,
                    title: d.title,
                    description: d.description,
                    targetValue: d.target,
                    rewardXp: d.xp,
                    type: 'DAILY'
                }
            });
        }
    }
}
