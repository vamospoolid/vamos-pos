import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';
import { PricingService } from '../pricing/pricing.service';
import { waService } from '../whatsapp/wa.service';

export class PlayerController {
    static async createChallenge(req: Request, res: Response, next: NextFunction) {
        try {
            const { challengerId, opponentId, pointsStake, isFightForTable, sessionId } = req.body;
            if (!challengerId || !opponentId) return res.status(400).json({ success: false, message: 'Both players are required' });
            if (challengerId === opponentId) return res.status(400).json({ success: false, message: 'You cannot challenge yourself' });

            const challenge = await prisma.matchChallenge.create({
                data: {
                    challengerId,
                    opponentId,
                    pointsStake: pointsStake || 50,
                    isFightForTable: !!isFightForTable,
                    sessionId: sessionId || null,
                    status: 'PENDING'
                },
                include: { challenger: true, opponent: true }
            });
            res.json({ success: true, data: challenge });
        } catch (error) { next(error); }
    }

    static async getChallenges(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: memberId } = req.params;
            const challenges = await prisma.matchChallenge.findMany({
                where: {
                    OR: [{ challengerId: memberId }, { opponentId: memberId }],
                    status: { in: ['PENDING', 'ACCEPTED'] }
                },
                include: { challenger: true, opponent: true },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, data: challenges });
        } catch (error) { next(error); }
    }

    static async respondToChallenge(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: challengeId } = req.params;
            const { status } = req.body; // ACCEPTED or DECLINED
            const challenge = await prisma.matchChallenge.update({
                where: { id: challengeId },
                data: { status }
            });
            res.json({ success: true, data: challenge });
        } catch (error) { next(error); }
    }

    static async completeChallenge(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: challengeId } = req.params;
            const { winnerId } = req.body;

            const challenge = await prisma.matchChallenge.findUnique({
                where: { id: challengeId },
                include: { challenger: true, opponent: true }
            });

            if (!challenge || challenge.status !== 'ACCEPTED') {
                return res.status(400).json({ success: false, message: 'Challenge must be ACCEPTED to complete' });
            }

            const loserId = challenge.challengerId === winnerId ? challenge.opponentId : challenge.challengerId;
            const stake = challenge.pointsStake;

            const result = await prisma.$transaction(async (tx) => {
                // XP Logic
                const winXP = 100 + stake;
                const lossXP = 20;

                // Update Winner
                const winner = await tx.member.findUnique({ where: { id: winnerId } });
                if (winner) {
                    let newExp = (winner.experience || 0) + winXP;
                    let newLevel = winner.level || 1;
                    const nextLevelExp = newLevel * 1000;

                    if (newExp >= nextLevelExp) {
                        newLevel++;
                        newExp -= nextLevelExp;
                    }

                    // Badge Logic
                    const earnedBadges = winner.badges || [];
                    const newBadges = [...earnedBadges];
                    const nextWins = (winner.totalWins || 0) + 1;
                    const nextStreak = (winner.streakCount || 0) + 1;

                    if (nextWins === 1 && !newBadges.includes('PIONEER')) newBadges.push('PIONEER');
                    if (nextStreak === 3 && !newBadges.includes('STREAK_KING')) newBadges.push('STREAK_KING');
                    if (stake >= 100 && !newBadges.includes('DEATHMATCH')) newBadges.push('DEATHMATCH');

                    await tx.member.update({
                        where: { id: winnerId },
                        data: {
                            loyaltyPoints: { increment: stake },
                            totalWins: { increment: 1 },
                            totalMatches: { increment: 1 },
                            experience: newExp,
                            level: newLevel,
                            streakCount: { increment: 1 },
                            badges: newBadges
                        }
                    });
                }

                // Update Loser
                const loser = await tx.member.findUnique({ where: { id: loserId } });
                if (loser) {
                    let newExp = (loser.experience || 0) + lossXP;
                    let newLevel = loser.level || 1;
                    const nextLevelExp = newLevel * 1000;

                    if (newExp >= nextLevelExp) {
                        newLevel++;
                        newExp -= nextLevelExp;
                    }

                    await tx.member.update({
                        where: { id: loserId },
                        data: {
                            loyaltyPoints: { decrement: Math.min(stake, 0) ? 0 : stake },
                            totalMatches: { increment: 1 },
                            experience: newExp,
                            level: newLevel,
                            streakCount: 0
                        }
                    });
                }

                // If Fight For Table, transfer the session bill responsibility to loser
                if (challenge.isFightForTable && challenge.sessionId) {
                    await tx.session.update({
                        where: { id: challenge.sessionId },
                        data: {
                            memberId: loserId,
                            customerName: (challenge.challengerId === loserId ? challenge.challenger.name : challenge.opponent.name)
                        }
                    });
                }

                // Log for winner
                await tx.pointLog.create({
                    data: { memberId: winnerId, points: stake, type: 'EARN_GAME', description: `Winner: Arena against ${challenge.challengerId === winnerId ? challenge.opponent.name : challenge.challenger.name}` }
                });

                // Log for loser
                await tx.pointLog.create({
                    data: { memberId: loserId, points: -stake, type: 'REDEEM', description: `Loser: Arena against ${winnerId === challenge.challengerId ? challenge.challenger.name : challenge.opponent.name}` }
                });

                const updatedChallenge = await tx.matchChallenge.update({
                    where: { id: challengeId },
                    data: { status: 'COMPLETED', winnerId },
                    include: { challenger: true, opponent: true }
                });

                return updatedChallenge;
            });

            // Send WA Notifications after transaction success
            const winner = result.challengerId === winnerId ? result.challenger : result.opponent;
            const loser = result.challengerId === winnerId ? result.opponent : result.challenger;
            const finalStake = result.pointsStake;

            const winMsg = `🏆 *CONGRATULATIONS ${winner.name}!*\n\nYou secured VICTORY in the Arena against *${loser.name}*.\n\n✨ *XP Earned:* +${100 + finalStake}\n💰 *Loyalty Points:* +${finalStake}\n\nKeep the streak alive! Check your profile for new badges. 🎯`;
            const lossMsg = `💀 *DEFEAT LOGGED: ${loser.name}*\n\nYou fell in the Arena against *${winner.name}*.\n\n📈 *XP Gain:* +20\n📉 *Points Deducted:* -${finalStake}\n\nTrain harder! The table bill has been authorized to your account. 🎱`;

            waService.sendMessage(winner.phone, winMsg);
            waService.sendMessage(loser.phone, result.isFightForTable ? lossMsg : lossMsg.replace("The table bill has been authorized to your account.", "Next time will be yours!"));

            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone, name, email } = req.body;
            if (!phone || !name) return res.status(400).json({ success: false, message: 'Phone and Name are required' });

            const cleanedPhone = phone.replace(/[^0-9]/g, '');

            const existing = await prisma.member.findFirst({
                where: { OR: [{ phone: cleanedPhone }, { email: email || undefined }] }
            });
            if (existing) return res.status(400).json({ success: false, message: 'Number or email already registered' });

            const member = await prisma.member.create({
                data: {
                    phone: cleanedPhone,
                    name: name.toUpperCase(),
                    tier: 'BRONZE',
                    handicap: 4,
                    handicapLabel: 'Entry Fragger',
                    loyaltyPoints: 100 // Welcome bonus
                }
            });

            res.json({ success: true, data: { member, token: `player_${member.id}` }, message: 'Welcome to Vamos Elite Arena!' });
        } catch (error) { next(error); }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone } = req.body;
            if (!phone) return res.status(400).json({ success: false, message: 'Phone is required' });

            const cleanedPhone = phone.replace(/[^0-9]/g, '');

            const member = await prisma.member.findFirst({
                where: { phone: cleanedPhone },
                include: {
                    sessions: {
                        where: { status: 'ACTIVE' },
                        include: { table: true }
                    },
                    tournamentParticipant: {
                        include: { tournament: true }
                    },
                    pointLogs: {
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    }
                }
            });

            if (!member) return res.status(404).json({ success: false, message: 'Member not found. Please register first.' });

            res.json({ success: true, data: { member, token: `player_${member.id}` } });
        } catch (error) { next(error); }
    }

    static async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const memberId = req.params.id;
            const member = await prisma.member.findUnique({
                where: { id: memberId },
                include: {
                    sessions: {
                        where: { status: { in: ['ACTIVE', 'PENDING'] } },
                        include: {
                            table: true,
                            orders: { include: { product: true } }
                        },
                        orderBy: { createdAt: 'desc' }
                    },
                    tournamentParticipant: {
                        include: { tournament: true }
                    },
                    challengesSent: {
                        include: { opponent: { select: { name: true, photo: true } } },
                        orderBy: { updatedAt: 'desc' },
                        take: 5
                    },
                    challengesReceived: {
                        include: { challenger: { select: { name: true, photo: true } } },
                        orderBy: { updatedAt: 'desc' },
                        take: 5
                    }
                }
            });
            if (!member) return res.status(404).json({ success: false, message: 'Profile not found' });
            res.json({ success: true, data: member });
        } catch (error) { next(error); }
    }

    static async getDashboard(req: Request, res: Response, next: NextFunction) {
        try {
            const memberId = req.params.id;
            const member = await prisma.member.findUnique({
                where: { id: memberId },
                include: {
                    sessions: {
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                        include: { table: true, orders: { include: { product: true } } }
                    }
                }
            });
            if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
            res.json({ success: true, data: member });
        } catch (error) { next(error); }
    }

    static async getTournaments(req: Request, res: Response, next: NextFunction) {
        try {
            const tournaments = await prisma.tournament.findMany({
                where: { status: { in: ['PENDING', 'ONGOING'] } },
                include: {
                    matches: {
                        orderBy: [{ round: 'desc' }, { matchNumber: 'asc' }]
                    },
                    participants: {
                        include: { member: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, data: tournaments });
        } catch (error) { next(error); }
    }

    static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
        try {
            const members = await prisma.member.findMany({
                orderBy: [
                    { totalWins: 'desc' },
                    { loyaltyPoints: 'desc' },
                    { totalPrizeWon: 'desc' }
                ],
                take: 50
            });
            res.json({ success: true, data: members });
        } catch (error) { next(error); }
    }

    static async getMatchHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const memberId = req.params.id;

            // Fetch Tournament Matches
            const participants = await prisma.tournamentParticipant.findMany({
                where: { memberId },
                select: { id: true }
            });
            const participantIds = participants.map(p => p.id);

            const tMatches = await prisma.tournamentMatch.findMany({
                where: {
                    OR: [
                        { player1Id: { in: participantIds } },
                        { player2Id: { in: participantIds } }
                    ],
                    status: 'COMPLETED'
                },
                include: {
                    tournament: {
                        include: {
                            participants: {
                                include: { member: true }
                            }
                        }
                    }
                }
            });

            // Fetch Arena Challenge Matches (Individual Matches)
            const aMatches = await prisma.match.findMany({
                where: {
                    members: {
                        some: { memberId }
                    }
                },
                include: {
                    members: {
                        include: { member: true }
                    }
                }
            });

            // Normalizing data for easier frontend use
            const normalizedT = tMatches.map(m => {
                const meParticipantId = participantIds.find(pid => pid === m.player1Id || pid === m.player2Id);
                const oppParticipantId = m.player1Id === meParticipantId ? m.player2Id : m.player1Id;

                const me = m.tournament.participants.find(p => p.id === meParticipantId);
                const opp = m.tournament.participants.find(p => p.id === oppParticipantId);
                const getsPName = (p: any) => p ? (p.member?.name || p.name || 'Unknown') : 'TBD';

                return {
                    id: m.id,
                    type: 'TOURNAMENT',
                    tournamentName: m.tournament?.name || 'Grand Prix',
                    isWinner: m.winnerId === meParticipantId,
                    myScore: m.player1Id === meParticipantId ? m.score1 : m.score2,
                    opponentScore: m.player1Id === meParticipantId ? m.score2 : m.score1,
                    opponentName: getsPName(opp),
                    opponentPhoto: opp?.member?.photo,
                    date: m.updatedAt
                }
            });

            const normalizedA = aMatches.map(m => {
                const me = m.members.find(mm => mm.memberId === memberId);
                const opp = m.members.find(mm => mm.memberId !== memberId);

                return {
                    id: m.id,
                    type: 'ARENA',
                    tournamentName: 'Pit Match',
                    isWinner: m.winnerId === memberId,
                    myScore: m.winnerId === memberId ? 1 : 0, // Simplified for Arena
                    opponentScore: m.winnerId !== memberId ? 1 : 0,
                    opponentName: opp?.member?.name || 'Ghost Player',
                    opponentPhoto: opp?.member?.photo,
                    date: m.updatedAt
                }
            });

            const allMatches = [...normalizedT, ...normalizedA]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            res.json({ success: true, data: allMatches });
        } catch (error) { next(error); }
    }

    static async getRewards(req: Request, res: Response, next: NextFunction) {
        try {
            let rewards = await prisma.reward.findMany({ where: { isActive: true } });
            if (rewards.length === 0) {
                // Seed default rewards if empty
                await prisma.reward.createMany({
                    data: [
                        { title: 'Signature Drink', description: 'Coffee or Cocktail', pointsRequired: 150, imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=200&auto=format&fit=crop' },
                        { title: 'Free Table Hour', description: 'Any available table', pointsRequired: 500, imageUrl: 'https://images.unsplash.com/photo-1595130761362-75dcc02a11b6?q=80&w=200&auto=format&fit=crop' },
                        { title: 'Vamos Tee', description: 'Limited edition merch', pointsRequired: 1200, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=200&auto=format&fit=crop' },
                        { title: 'Free Appetizer', description: 'Choice of snack', pointsRequired: 300, imageUrl: 'https://images.unsplash.com/photo-1625937712144-8c6fa2281be8?q=80&w=200&auto=format&fit=crop' }
                    ]
                });
                rewards = await prisma.reward.findMany({ where: { isActive: true } });
            }
            res.json({ success: true, data: rewards });
        } catch (error) { next(error); }
    }

    static async redeemReward(req: Request, res: Response, next: NextFunction) {
        try {
            const { memberId, rewardId } = req.body;
            if (!memberId || !rewardId) return res.status(400).json({ success: false, message: 'MemberId and RewardId are required' });

            const result = await prisma.$transaction(async (tx) => {
                const member = await tx.member.findUnique({ where: { id: memberId } });
                const reward = await tx.reward.findUnique({ where: { id: rewardId } });

                if (!member || !reward) throw new Error('Member or Reward not found');
                if (member.loyaltyPoints < reward.pointsRequired) throw new Error('Not enough points');
                if (reward.stock <= 0) throw new Error('Reward out of stock');

                // Deduct points
                const updatedMember = await tx.member.update({
                    where: { id: memberId },
                    data: { loyaltyPoints: member.loyaltyPoints - reward.pointsRequired }
                });

                // Deduct stock
                await tx.reward.update({
                    where: { id: rewardId },
                    data: { stock: reward.stock - 1 }
                });

                // Create redemption record
                const redemption = await tx.redemption.create({
                    data: { memberId, rewardId }
                });

                return { updatedMember, redemption };
            });

            res.json({ success: true, data: result.updatedMember, message: 'Reward redeemed successfully' });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async getRedemptions(req: Request, res: Response, next: NextFunction) {
        try {
            const { memberId } = req.params;
            const redemptions = await prisma.redemption.findMany({
                where: { memberId },
                include: { reward: true },
                orderBy: { claimedAt: 'desc' }
            });
            res.json({ success: true, data: redemptions });
        } catch (error) { next(error); }
    }

    static async registerTournament(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: tournamentId } = req.params;
            const { memberId, handicap, paymentNotes, paymentStatus } = req.body;

            const { TournamentService } = await import('../tournaments/tournament.service');
            const pt = await TournamentService.registerParticipant(tournamentId, memberId, undefined, handicap, paymentNotes, paymentStatus);

            res.json({ success: true, data: pt });
        } catch (error) { next(error); }
    }

    static async getAvailability(req: Request, res: Response, next: NextFunction) {
        try {
            const tables = await prisma.table.findMany({
                where: {
                    status: { not: 'MAINTENANCE' },
                    deletedAt: null
                },
                include: {
                    sessions: {
                        where: { status: 'ACTIVE' },
                        select: { id: true, startTime: true, durationOpts: true }
                    }
                }
            });

            const availability = tables.map(t => {
                const activeSession = t.sessions[0];
                let freeAt = new Date();

                if (activeSession) {
                    const start = new Date(activeSession.startTime);
                    const durationMs = (activeSession.durationOpts || 0) * 60000;
                    if (durationMs > 0) {
                        freeAt = new Date(start.getTime() + durationMs);
                    } else {
                        // Open-ended, assume occupied for a while
                        freeAt = new Date(Date.now() + 60 * 60000);
                    }
                }

                return {
                    tableId: t.id,
                    tableName: t.name,
                    tableType: t.type,
                    status: activeSession ? 'OCCUPIED' : 'AVAILABLE',
                    freeAt: freeAt
                };
            });

            const types = ['REGULAR', 'VIP', 'VVIP'];
            const grouped = types.map(type => {
                const typeTables = availability.filter(a => a.tableType === type);
                const availableTables = typeTables.filter(a => a.status === 'AVAILABLE');

                let nextFreeAt = new Date();
                if (typeTables.length > 0 && availableTables.length === 0) {
                    nextFreeAt = new Date(Math.min(...typeTables.map(a => a.freeAt.getTime())));
                }

                return {
                    type,
                    total: typeTables.length,
                    available: availableTables.length,
                    nextFreeAt
                };
            });

            res.json({ success: true, data: grouped });
        } catch (error) { next(error); }
    }

    static async getTables(req: Request, res: Response, next: NextFunction) {
        try {
            // "Privacy" requirement: only show tables that are not MAINTENANCE and not deleted
            // and potentially only those marked for public view (though we don't have that flag yet, MAINTENANCE is a good proxy)
            const tables = await prisma.table.findMany({
                where: {
                    status: { not: 'MAINTENANCE' },
                    deletedAt: null
                },
                orderBy: { name: 'asc' }
            });
            res.json({ success: true, data: tables });
        } catch (error) { next(error); }
    }

    static async createBooking(req: Request, res: Response, next: NextFunction) {
        try {
            const { memberId, tableId, tableType, packageId, reservedTime, partySize, durationMinutes, notes } = req.body;
            if (!memberId) return res.status(400).json({ success: false, message: 'Member ID is required' });

            const member = await prisma.member.findUnique({ where: { id: memberId } });
            if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

            // DYNAMIC POINT DEDUCTION LOGIC
            let cost = 0;
            let duration = parseInt(durationMinutes as string) || 60;

            if (packageId) {
                const pkg = await prisma.package.findUnique({ where: { id: packageId } });
                if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
                cost = pkg.memberPrice || pkg.price;
                duration = pkg.duration;
            } else {
                const startTime = reservedTime ? new Date(reservedTime) : new Date();
                const endTime = new Date(startTime.getTime() + duration * 60000);
                cost = await PricingService.calculateTableAmount(
                    tableType || 'REGULAR',
                    startTime,
                    endTime,
                    true // Player App users are members
                );
            }

            // Points calculation logic (1 PT for every 1000 IDR)
            const pointsToEarn = Math.floor(cost / 1000);

            const result = await prisma.$transaction(async (tx) => {
                // Create booking/waitlist entry
                const booking = await tx.waitlist.create({
                    data: {
                        customerName: member.name,
                        phone: member.phone,
                        memberId: member.id,
                        packageId: packageId || undefined,
                        pointsCost: pointsToEarn, // This is now projected points to earn
                        price: cost, // Save actual IDR price
                        tableId,
                        tableType: (tableType || 'REGULAR').toUpperCase(),
                        reservedTime: reservedTime ? new Date(reservedTime) : new Date(),
                        durationMinutes: duration,
                        partySize: partySize || 1,
                        notes: notes || 'Booked via Player App',
                        status: 'WAITING'
                    } as any
                });

                return { booking };
            });

            // WA Notification for Booking
            let waSent = false;
            if (member.phone) {
                const { waService } = await import('../whatsapp/wa.service');
                if (waService.isReady) {
                    const venue = await prisma.venue.findFirst();
                    const venueName = venue?.name || 'VAMOS';
                    const bookedTime = reservedTime ? new Date(reservedTime).toLocaleString('id-ID') : 'Sekarang';
                    const message = `Halo ${member.name}! 🎱\n\nBooking via Player App di ${venueName} telah kami terima.\n\nDetail:\n- Meja: ${tableType || 'Any'}\n- Jam: ${bookedTime}\n\nTerima kasih! Tunggu kabar dari Kasir kami ya.`;
                    waSent = await waService.sendMessage(member.phone as string, message);
                }
            }

            res.json({ success: true, data: result.booking, waSent, message: 'Booking created successfully' });
        } catch (error) { next(error); }
    }

    static async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const { memberId, photo, identityStatus } = req.body;
            if (!memberId) return res.status(400).json({ success: false, message: 'Member ID is required' });

            const { MemberService } = await import('../members/member.service');

            let member;
            if (identityStatus) {
                member = await MemberService.updateVerificationStatus(memberId, identityStatus);
            }

            if (photo) {
                member = await MemberService.updateMember(memberId, { photo });
            }

            if (!identityStatus && !photo) {
                member = await prisma.member.findUnique({ where: { id: memberId } });
            }

            res.json({ success: true, data: member });
        } catch (error) { next(error); }
    }

    static async getMenu(req: Request, res: Response, next: NextFunction) {
        try {
            const products = await prisma.product.findMany({
                where: { deletedAt: null, stock: { gt: 0 } },
                orderBy: { category: 'asc' }
            });

            // Group by category
            const menu = products.reduce((acc: any, product) => {
                const category = product.category || 'Other';
                if (!acc[category]) acc[category] = [];
                acc[category].push(product);
                return acc;
            }, {});

            res.json({ success: true, data: menu });
        } catch (error) { next(error); }
    }

    static async placeOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const { memberId, sessionId, items } = req.body;
            if (!memberId || !sessionId || !items || !items.length) {
                return res.status(400).json({ success: false, message: 'Missing required order details' });
            }

            const { OrderService } = await import('../orders/order.service');

            const results = [];
            for (const item of items) {
                const order = await OrderService.addOrder(
                    sessionId,
                    item.productId,
                    item.quantity,
                    `PLAYER_${memberId}`
                );
                results.push(order);
            }

            res.json({ success: true, data: results, message: 'F&B Order Transmitted!' });
        } catch (error) { next(error); }
    }

    static async getH2H(req: Request, res: Response, next: NextFunction) {
        try {
            const memberId = req.params.id;

            // Tournament matches
            const participants = await prisma.tournamentParticipant.findMany({
                where: { memberId },
                select: { id: true }
            });
            const participantIds = participants.map(p => p.id);

            const tMatches = await prisma.tournamentMatch.findMany({
                where: {
                    OR: [
                        { player1Id: { in: participantIds } },
                        { player2Id: { in: participantIds } }
                    ],
                    status: 'COMPLETED'
                },
                include: {
                    player1: { include: { member: true } },
                    player2: { include: { member: true } }
                }
            });

            // Challenge matches (Match/MatchMember)
            const matchesOfMember = await prisma.matchMember.findMany({
                where: { memberId },
                include: {
                    match: {
                        include: {
                            members: { include: { member: true } }
                        }
                    }
                }
            });

            const stats: Record<string, any> = {};

            // Process Tournament Matches
            for (const m of tMatches) {
                const me = participantIds.includes(m.player1Id!) ? m.player1 : m.player2;
                const opp = participantIds.includes(m.player1Id!) ? m.player2 : m.player1;

                if (!opp?.id) continue;

                const oppMemberId = opp.memberId || `guest_${opp.id}`;
                if (!stats[oppMemberId]) stats[oppMemberId] = {
                    opponentId: oppMemberId,
                    name: opp.member?.name || opp.name || 'Unknown',
                    photo: opp.member?.photo,
                    wins: 0, losses: 0, total: 0
                };

                stats[oppMemberId].total++;
                if (m.winnerId === me?.id) stats[oppMemberId].wins++;
                else if (m.winnerId === opp.id) stats[oppMemberId].losses++;
            }

            // Process Challenge Matches
            for (const mm of matchesOfMember) {
                const m = mm.match;
                const oppMM = m.members.find(om => om.memberId !== memberId);
                if (!oppMM) continue;

                const oppId = oppMM.memberId;
                if (!stats[oppId]) stats[oppId] = {
                    opponentId: oppId,
                    name: oppMM.member.name,
                    photo: oppMM.member.photo,
                    wins: 0, losses: 0, total: 0
                };

                stats[oppId].total++;
                if (m.winnerId === memberId) stats[oppId].wins++;
                else if (m.winnerId === oppId) stats[oppId].losses++;
            }

            const sortedStats = Object.values(stats)
                .sort((a: any, b: any) => b.total - a.total)
                .slice(0, 5);

            res.json({ success: true, data: sortedStats });
        } catch (error) { next(error); }
    }
}
