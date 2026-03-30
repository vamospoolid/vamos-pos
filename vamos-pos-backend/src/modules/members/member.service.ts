import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { logger } from '../../utils/logger';

export class MemberService {
    static async createMember(data: { name: string; phone: string; photo?: string; handicap?: string; handicapLabel?: string }) {
        const existingMember = await prisma.member.findUnique({
            where: { phone: data.phone }
        });

        if (existingMember) {
            throw new AppError('Phone number already registered to another member', 400);
        }

        const newMember = await prisma.member.create({
            data
        });

        // Award 50 bonus points for registration
        try {
            await LoyaltyService.addPoints(
                newMember.id,
                50,
                'EARN_BONUS',
                '🎁 Bonus Pendaftaran Member Baru'
            );
        } catch (error) {
            console.error('Failed to award registration points:', error);
        }

        // WhatsApp Welcome Message
        if (newMember.phone) {
            try {
                const venue = await prisma.venue.findFirst();
                const venueName = venue?.name || 'VAMOS';
                const { WaTemplateService, WA_TEMPLATE_IDS } = await import('../whatsapp/wa.template.service');
                const waTemplate = await WaTemplateService.renderTemplate(WA_TEMPLATE_IDS.WELCOME_MEMBER, {
                    name: newMember.name,
                    venue: venueName,
                });
                
                if (waTemplate) {
                    const { waService } = await import('../whatsapp/wa.service');
                    if (waService.isReady) {
                        await waService.sendMessage(newMember.phone as string, waTemplate.body, waTemplate.imageUrl || undefined);
                        logger.info(`✅ [WA_WELCOME] Member ${newMember.name} (Phone: ${newMember.phone}) notified!`);
                    } else {
                        logger.warn(`⚠️ [WA_WELCOME] Skip notification for ${newMember.name}: WhatsApp client NOT ready.`);
                    }
                }
            } catch (error: any) {
                logger.error(`❌ [WA_WELCOME] Failed to send welcome WA to ${newMember.phone}: ${error.message}`);
            }
        }

        return newMember;
    }

    static async getMembers() {
        return prisma.member.findMany({
            where: { deletedAt: null },
            orderBy: {
                loyaltyPoints: 'desc' // Order by points by default to show top members
            }
        });
    }

    static async getMemberById(id: string) {
        const member = await prisma.member.findFirst({
            where: { id, deletedAt: null },
            include: {
                matches: {
                    include: {
                        match: true
                    },
                    orderBy: {
                        match: {
                            createdAt: 'desc'
                        }
                    },
                    take: 10 // Get last 10 matches
                }
            }
        });

        if (!member) {
            throw new AppError('Member not found', 404);
        }

        return member;
    }

    static async getMemberByPhone(phone: string) {
        const member = await prisma.member.findFirst({
            where: { phone, deletedAt: null }
        });

        if (!member) {
            throw new AppError('Member not found', 404);
        }

        return member;
    }

    static async updateMember(id: string, data: { name?: string; phone?: string; photo?: string; handicap?: string; handicapLabel?: string }) {
        const member = await prisma.member.findFirst({ where: { id, deletedAt: null } });
        if (!member) {
            throw new AppError('Member not found', 404);
        }

        if (data.phone && data.phone !== member.phone) {
            const existingMember = await prisma.member.findFirst({
                where: { phone: data.phone, id: { not: id }, deletedAt: null }
            });
            if (existingMember) {
                throw new AppError('Phone number already registered to another member', 400);
            }
        }

        return prisma.member.update({
            where: { id },
            data
        });
    }

    static async addLoyaltyPoints(id: string, points: number) {
        const member = await prisma.member.findFirst({ where: { id, deletedAt: null } });
        if (!member) {
            throw new AppError('Member not found', 404);
        }

        return prisma.member.update({
            where: { id },
            data: {
                loyaltyPoints: {
                    increment: points
                }
            }
        });
    }

    static async deleteMember(id: string) {
        const member = await prisma.member.findFirst({ where: { id, deletedAt: null } });
        if (!member) {
            throw new AppError('Member not found', 404);
        }

        // We could also anonymize the phone number or name, but soft delete is what we usually do.
        return prisma.member.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                // Prepend random string so the number can be reused if the member returns
                phone: `deleted_${Date.now()}_${member.phone}`
            }
        });
    }

    // Example of an internal service function (could be called when a Match concludes)
    static async updateMatchStats(memberId: string, isWinner: boolean) {
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) return;

        const newTotalMatches = member.totalMatches + 1;
        const newTotalWins = member.totalWins + (isWinner ? 1 : 0);
        const newWinRate = (newTotalWins / newTotalMatches) * 100;

        await prisma.member.update({
            where: { id: memberId },
            data: {
                totalMatches: newTotalMatches,
                totalWins: newTotalWins,
                winRate: newWinRate
            }
        });
    }

    static async updatePlayHours(memberId: string, hoursPlayed: number) {
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) return;

        const m = member as any;
        const now = new Date();

        // Month transition check
        const lastUpdated = member.updatedAt ? new Date(member.updatedAt) : new Date();
        const isNewMonth = now.getMonth() !== lastUpdated.getMonth() || now.getFullYear() !== lastUpdated.getFullYear();

        let currentHours = m.currentMonthPlayHours || 0;
        let lastHours = m.lastMonthPlayHours || 0;

        if (isNewMonth) {
            lastHours = currentHours;
            currentHours = 0;
        }

        await prisma.member.update({
            where: { id: memberId },
            data: {
                totalPlayHours: member.totalPlayHours + hoursPlayed,
                currentMonthPlayHours: currentHours + hoursPlayed,
                lastMonthPlayHours: lastHours
            } as any
        });
    }

    static async updateSpend(memberId: string, amount: number) {
        const member = await prisma.member.findUnique({ where: { id: memberId } }) as any;
        if (!member) return;

        await prisma.member.update({
            where: { id: memberId },
            data: {
                totalSpend: (member.totalSpend || 0) + amount
            } as any
        });
    }

    static async updatePrizeWon(memberId: string, prizeAmount: number) {
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) return;

        await prisma.member.update({
            where: { id: memberId },
            data: {
                totalPrizeWon: member.totalPrizeWon + prizeAmount
            }
        });
    }

    static async verifyWa(id: string) {
        const member = await prisma.member.update({
            where: { id },
            data: {
                isWaVerified: true,
                waVerifiedAt: new Date()
            }
        });
        await MemberService.checkAndAwardVerificationReward(id);
        return member;
    }

    static async updateVerificationStatus(id: string, status: string) {
        const data: any = { identityStatus: status };
        if (status === 'VERIFIED') {
            data.isPhotoVerified = true;
            data.photoVerifiedAt = new Date();
        } else if (status === 'REJECTED' || status === 'UNVERIFIED') {
            data.isPhotoVerified = false;
        }

        const member = await prisma.member.update({
            where: { id },
            data
        });

        if (status === 'VERIFIED') {
            await MemberService.checkAndAwardVerificationReward(id);
        }

        return member;
    }

    static async checkAndAwardVerificationReward(memberId: string) {
        const member = await prisma.member.findUnique({
            where: { id: memberId }
        });

        if (!member) return;

        if (member.isWaVerified && (member.isPhotoVerified || member.photo) && !member.isVerificationRewardClaimed) {
            // Award 50 points (Adjusted from 35,000 to be more realistic)
            await LoyaltyService.addPoints(
                memberId,
                50,
                'EARN_BONUS',
                '🎁 Reward Verifikasi WhatsApp & Foto'
            );

            await prisma.member.update({
                where: { id: memberId },
                data: {
                    isVerificationRewardClaimed: true
                }
            });
        }
    }
}
