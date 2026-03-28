import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';
import bcrypt from 'bcrypt';
import { PricingService } from '../pricing/pricing.service';
import { waService } from '../whatsapp/wa.service';
import { getInitialRatingFromHC, calculateMatchRating } from '../../utils/rating.util';
import { KingService } from '../matches/king.service';

export class PlayerController {
    static async createChallenge(req: Request, res: Response, next: NextFunction) {
        try {
            let { challengerId, opponentId, pointsStake, isFightForTable, sessionId, note } = req.body;
            if (!challengerId || !opponentId) return res.status(400).json({ success: false, message: 'Both players are required' });
            
            // Trim just in case
            challengerId = challengerId.trim();
            opponentId = opponentId.trim();

            if (challengerId === opponentId) return res.status(400).json({ success: false, message: 'You cannot challenge yourself' });

            // Ensure opponent exists
            const opponent = await prisma.member.findUnique({ where: { id: opponentId } });
            if (!opponent) return res.status(400).json({ success: false, message: 'Target ID tidak valid atau Player tidak ditemukan.' });

            // Balance Check for Challenger -- REMOVED AS REQUESTED (XP ONLY)
            /* 
            const challenger = await prisma.member.findUnique({ where: { id: challengerId } });
            if (!challenger || (challenger.loyaltyPoints || 0) < (pointsStake || 50)) {
                return res.status(400).json({ success: false, message: 'Poin Anda tidak mencukupi untuk melakukan taruhan ini.' });
            }

            // Balance Check for Opponent
            if ((opponent.loyaltyPoints || 0) < (pointsStake || 50)) {
                return res.status(400).json({ success: false, message: 'Saldo poin lawan tidak mencukupi untuk menerima tantangan ini.' });
            }
            */

            const challenge = await (prisma.matchChallenge as any).create({
                data: {
                    challengerId,
                    opponentId,
                    pointsStake: pointsStake || 0,
                    isFightForTable: !!isFightForTable,
                    sessionId: sessionId || null,
                    note: note || null,
                    status: 'PENDING'
                },
                include: { challenger: true, opponent: true }
            });

            const { getIO } = await import('../../socket');
            getIO().emit(`challenge:new:${opponentId}`, challenge);
            getIO().emit(`challenge:new_arena`, challenge);

            res.json({ success: true, data: challenge });
        } catch (error) { next(error); }
    }

    static async getChallenges(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: memberId } = req.params;
            const challenges = await (prisma.matchChallenge as any).findMany({
                where: {
                    OR: [{ challengerId: memberId }, { opponentId: memberId }],
                    status: { in: ['PENDING', 'ACCEPTED', 'WAITING_VERIFICATION'] }
                },
                include: { 
                    challenger: true, 
                    opponent: true,
                    session: { include: { table: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, data: challenges });
        } catch (error) { next(error); }
    }

    static async getPendingVerifications(req: Request, res: Response, next: NextFunction) {
        try {
            const challenges = await (prisma.matchChallenge as any).findMany({
                where: { 
                    status: { in: ['PENDING', 'ACCEPTED', 'WAITING_VERIFICATION'] } 
                },
                include: { 
                    challenger: true, 
                    opponent: true,
                    session: { include: { table: true } }
                },
                orderBy: { updatedAt: 'desc' }
            });
            res.json({ success: true, data: challenges });
        } catch (error) { next(error); }
    }

    static async respondToChallenge(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: challengeId } = req.params;
            const { status } = req.body; // ACCEPTED or DECLINED

            const currentChallenge = await prisma.matchChallenge.findUnique({ 
                where: { id: challengeId },
                include: { challenger: true, opponent: true }
            });
            if (!currentChallenge) return res.status(404).json({ success: false, message: 'Tantangan tidak ditemukan.' });

            /* 
            if (status === 'ACCEPTED') {
                // Final balance check for opponent before accepting
                if ((currentChallenge.opponent.loyaltyPoints || 0) < currentChallenge.pointsStake) {
                    return res.status(400).json({ success: false, message: 'Poin Anda tidak mencukupi untuk menerima tantangan ini.' });
                }
            }
            */

            const challenge = await prisma.matchChallenge.update({
                where: { id: challengeId },
                data: { status }
            });

            // Notify both parties and POS that status changed
            const { getIO } = await import('../../socket');
            getIO().emit(`challenge:update:${challenge.challengerId}`, challenge);
            getIO().emit(`challenge:update:${challenge.opponentId}`, challenge);
            getIO().emit(`challenge:new_arena`, challenge);

            res.json({ success: true, data: challenge });
        } catch (error) { next(error); }
    }

    /**
     * PLAYER ACTION: Link an active session to an ongoing challenge
     */
    static async linkSession(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: challengeId } = req.params;
            const { sessionId } = req.body;
            const challenge = await (prisma.matchChallenge as any).update({
                where: { id: challengeId },
                data: { sessionId, isFightForTable: true }
            });
            res.json({ success: true, data: challenge });
        } catch (error) { next(error); }
    }

    /**
     * PLAYER ACTION: Claiming victory from their phone
     */
    static async claimVictory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: challengeId } = req.params;
            const { winnerId } = req.body;

            const challenge = await prisma.matchChallenge.update({
                where: { id: challengeId },
                data: {
                    status: 'WAITING_VERIFICATION',
                    winnerId: winnerId
                }
            });

            // Notify POS that a victory has been claimed and needs verification
            const { getIO } = await import('../../socket');
            getIO().emit(`challenge:new_arena`, challenge);
            getIO().emit(`challenge:update:${challenge.challengerId}`, challenge);
            getIO().emit(`challenge:update:${challenge.opponentId}`, challenge);

            res.json({ success: true, data: challenge, message: 'Victory reported. Awaiting cashier verification.' });
        } catch (error) { next(error); }
    }

    /**
     * CASHIER ACTION: Final approval and execution of point/bill transfer
     */
    static async completeChallenge(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: challengeId } = req.params;
            const { action, winnerId: manualWinnerId } = req.body; // 'APPROVE' or 'REJECT'

            const challenge = await prisma.matchChallenge.findUnique({
                where: { id: challengeId },
                include: { challenger: true, opponent: true, session: true }
            });

            if (!challenge) {
                return res.status(404).json({ success: false, message: 'Challenge not found.' });
            }

            const validStatuses = ['WAITING_VERIFICATION', 'ACCEPTED', 'PENDING'];
            if (!validStatuses.includes(challenge.status)) {
                return res.status(400).json({ success: false, message: 'Challenge is not in a completable state.' });
            }

            if (action === 'REJECT') {
                await prisma.matchChallenge.update({
                    where: { id: challengeId },
                    data: { status: 'ACCEPTED', winnerId: null }
                });
                return res.json({ success: true, message: 'Challenge outcome rejected. Protocol reset to ACCEPTED.' });
            }

            const winnerId = manualWinnerId || challenge.winnerId;
            if (!winnerId) return res.status(400).json({ success: false, message: 'Winner not identified. Admin must select a winner.' });

            const loserId = challenge.challengerId === winnerId ? challenge.opponentId : challenge.challengerId;
            const stake = challenge.pointsStake || 0;
            
            // Professional Rank Logic (Fixed XP Rewards)
            const winReputation = 100; 
            const lossReputation = 20; 
            
            const result = await prisma.$transaction(async (tx) => {
                // 1. POINT TRANSFER (If stake > 0)
                if (stake > 0) {
                    const { LoyaltyService } = await import('../loyalty/loyalty.service');
                    
                    // Deduct from loser
                    await tx.member.update({
                        where: { id: loserId },
                        data: { loyaltyPoints: { decrement: stake } }
                    });
                    
                    // Add to winner
                    await tx.member.update({
                        where: { id: winnerId },
                        data: { loyaltyPoints: { increment: stake } }
                    });

                    // Log points
                    await tx.pointLog.create({
                        data: {
                            memberId: winnerId,
                            points: stake,
                            type: 'EARN_GAME',
                            description: `🏆 Menang Taruhan Arena vs ${challenge.challengerId === winnerId ? challenge.opponent.name : challenge.challenger.name}`
                        }
                    });

                    await tx.pointLog.create({
                        data: {
                            memberId: loserId,
                            points: -stake,
                            type: 'REDEEM',
                            description: `💀 Kalah Taruhan Arena vs ${winnerId === challenge.challengerId ? challenge.challenger.name : challenge.opponent.name}`
                        }
                    });
                }

                // Background Skill Rating Calculation (Shadow Mode)
                const winner = await tx.member.findUnique({ where: { id: winnerId } });
                const loser = await tx.member.findUnique({ where: { id: loserId } });

                let winnerNewRating = winner?.skillRating || 200;
                let loserNewRating = loser?.skillRating || 200;
                let ratingDelta = 0;

                if (winner && loser) {
                    const ratingResult = calculateMatchRating(
                        winner.skillRating || 200,
                        loser.skillRating || 200,
                        winner.ratingConfidence || 0,
                        loser.ratingConfidence || 0
                    );
                    winnerNewRating = ratingResult.winnerNewRating;
                    loserNewRating = ratingResult.loserNewRating;
                    ratingDelta = ratingResult.delta;
                }

                // Update Winner
                if (winner) {
                    let newRep = (winner.experience || 0) + winReputation;
                    let newRank = winner.level || 1;
                    const nextRankRep = newRank * 1000;

                    if (newRep >= nextRankRep) {
                        newRank++;
                        newRep -= nextRankRep;
                    }

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
                            totalWins: { increment: 1 },
                            totalMatches: { increment: 1 },
                            experience: newRep,
                            level: newRank,
                            streakCount: { increment: 1 },
                            badges: newBadges,
                            skillRating: winnerNewRating,
                            ratingConfidence: { increment: 1 }
                        }
                    });
                }

                // Update Loser
                if (loser) {
                    let newRep = (loser.experience || 0) + lossReputation;
                    let newRank = loser.level || 1;
                    const nextRankRep = newRank * 1000;

                    if (newRep >= nextRankRep) {
                        newRank++;
                        newRep -= nextRankRep;
                    }

                    await tx.member.update({
                        where: { id: loserId },
                        data: {
                            totalMatches: { increment: 1 },
                            experience: newRep,
                            level: newRank,
                            streakCount: 0,
                            skillRating: loserNewRating,
                            ratingConfidence: { increment: 1 }
                        }
                    });
                }

                // TRANSFER BILL RESPONSIBILITY
                if (challenge.isFightForTable && challenge.sessionId) {
                    await tx.session.update({
                        where: { id: challenge.sessionId },
                        data: {
                            memberId: loserId,
                            customerName: (challenge.challengerId === loserId ? challenge.challenger.name : challenge.opponent.name)
                        }
                    });
                }

                // Logs
                // Note: We only log game completion here, 
                // points are logged during billing by SessionService
                // (Log game completion, points removed as requested)
                await tx.pointLog.create({
                    data: { 
                        memberId: winnerId, 
                        points: 0, 
                        type: 'EARN_GAME', 
                        description: `⭐ Kemenangan Challenge vs ${challenge.challengerId === winnerId ? challenge.opponent.name : challenge.challenger.name} (+${winReputation} XP)` 
                    }
                });

                await tx.pointLog.create({
                    data: { 
                        memberId: loserId, 
                        points: 0, 
                        type: 'EARN_GAME', 
                        description: `⭐ Kekalahan Challenge vs ${winnerId === challenge.challengerId ? challenge.challenger.name : challenge.opponent.name} (+${lossReputation} XP)` 
                    }
                });

                const updatedChallenge = await tx.matchChallenge.update({
                    where: { id: challengeId },
                    data: { status: 'COMPLETED', winnerId },
                    include: { challenger: true, opponent: true }
                });

                // Update King Status if applicable
                if (challenge.session?.tableId) {
                    await KingService.handleMatchEnd(challenge.session.tableId, winnerId, challengeId);
                    const { getIO } = await import('../../socket');
                    getIO().emit('king:updated', { tableId: challenge.session.tableId, winnerId });
                }

                return updatedChallenge;
            });

            // WA Notifications
            const winObj = result.challengerId === winnerId ? result.challenger : result.opponent;
            const lossObj = result.challengerId === winnerId ? result.opponent : result.challenger;

            let winMsg = `🏆 *CHALLENGE SELESAI*\n\nSelamat! Kemenangan Anda melawan *${lossObj.name}* telah diverifikasi.\n\n⭐ *XP:* +${winReputation} XP`;
            if (challenge.isFightForTable && challenge.sessionId) {
                winMsg += `\n(Sesi meja ini sepenuhnya ditangani oleh lawan)`;
            }

            let lossMsg = `🧾 *CHALLENGE SELESAI*\n\nAnda telah menyelesaikan pertandingan melawan *${winObj.name}*.\n\n⭐ *XP:* +${lossReputation} XP`;
            if (challenge.isFightForTable && challenge.sessionId) {
                lossMsg += `\n\n💰 *Billing:* Sesuai kesepakatan, tagihan sesi meja telah dialihkan ke akun Anda.`;
            }

            waService.sendMessage(winObj.phone, winMsg);
            waService.sendMessage(lossObj.phone, lossMsg);

            // Notify UI to refresh lists
            const { getIO } = await import('../../socket');
            getIO().emit(`challenge:new_arena`, result);
            getIO().emit(`challenge:update:${result.challengerId}`, result);
            getIO().emit(`challenge:update:${result.opponentId}`, result);

            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    static async adminCreateChallenge(req: Request, res: Response, next: NextFunction) {
        try {
            let { challengerId, opponentId, note } = req.body;
            if (!challengerId || !opponentId) return res.status(400).json({ success: false, message: 'Both players are required' });

            challengerId = challengerId.trim();
            opponentId = opponentId.trim();

            if (challengerId === opponentId) return res.status(400).json({ success: false, message: 'You cannot challenge the same person' });

            // Ensure players exist
            const p1 = await prisma.member.findUnique({ where: { id: challengerId } });
            const p2 = await prisma.member.findUnique({ where: { id: opponentId } });
            if (!p1 || !p2) return res.status(400).json({ success: false, message: 'ID Player tidak valid.' });

            const challenge = await (prisma.matchChallenge as any).create({
                data: {
                    challengerId,
                    opponentId,
                    pointsStake: 0,
                    status: 'ACCEPTED', // Admin creates are auto-accepted
                    note: note || 'Admin Created Match',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                include: { challenger: true, opponent: true }
            });

            const { getIO } = await import('../../socket');
            // Notify both players
            getIO().emit(`challenge:update:${challengerId}`, challenge);
            getIO().emit(`challenge:update:${opponentId}`, challenge);
            getIO().emit(`challenge:new_arena`, challenge);

            res.json({ success: true, data: challenge });
        } catch (error) { next(error); }
    }

    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone, name, email, deviceId, password } = req.body;
            if (!phone || !name) return res.status(400).json({ success: false, message: 'Phone and Name are required' });
            if (!password) return res.status(400).json({ success: false, message: 'Password wajib diisi untuk keamanan' });

            const cleanedPhone = phone.replace(/[^0-9]/g, '');
            
            const hashedPassword = await bcrypt.hash(password, 10);

            const existing = await prisma.member.findFirst({
                where: { OR: [{ phone: cleanedPhone }, { email: email || undefined }] }
            });
            if (existing) return res.status(400).json({ success: false, message: 'Number or email already registered' });

            const member = await prisma.member.create({
                data: {
                    phone: cleanedPhone,
                    name: name.toUpperCase(),
                    password: hashedPassword,
                    tier: 'BRONZE',
                    handicap: "4",
                    handicapLabel: 'Entry Fragger',
                    loyaltyPoints: 0, // Points will be added by log
                    skillRating: getInitialRatingFromHC("4"),
                    deviceId: deviceId || null,
                    lastLoginAt: new Date()
                } as any
            });

            // Ensure registration points are logged
            try {
                const { LoyaltyService } = await import('../loyalty/loyalty.service');
                await LoyaltyService.addPoints(member.id, 50, 'EARN_BONUS', '🎁 Welcome Bonus Registration');
            } catch (e) {
                console.error('Failed to award welcome points:', e);
                // Fallback direct update if service fails for some reason
                await prisma.member.update({ where: { id: member.id }, data: { loyaltyPoints: 50 } });
            }

            res.json({ success: true, data: { member, token: `player_${member.id}` }, message: 'Welcome to Vamos Elite Arena!' });
        } catch (error) { next(error); }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone, deviceId, password } = req.body;
            if (!phone) return res.status(400).json({ success: false, message: 'No Handphone wajib diisi' });
            if (!password) return res.status(400).json({ success: false, message: 'Password wajib diisi untuk keamanan' });

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

            if (!member) return res.status(404).json({ success: false, message: 'Member tidak ditemukan. Silakan registrasi terlebih dahulu.' });
            
            // Legacy / First-time password set
            if (!member.password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await prisma.member.update({
                    where: { id: member.id },
                    data: { password: hashedPassword }
                });
            } else {
                // Verify existing password
                const isMatch = await bcrypt.compare(password, member.password);
                if (!isMatch) {
                    return res.status(401).json({ success: false, message: 'Password salah' });
                }
            }

            // 1-Device-1-ID Logic: Every login updates the deviceId (Kicks the former one)
            if (deviceId) {
                await prisma.member.update({
                    where: { id: member.id },
                    data: { 
                        deviceId,
                        lastLoginAt: new Date()
                    } as any
                });
            }

            const { LoyaltyService } = await import('../loyalty/loyalty.service');
            const { member: _, ...loyaltyInfo } = await LoyaltyService.getMemberLoyalty(member.id);

            res.json({ success: true, data: { member: { ...member, ...loyaltyInfo, deviceId }, token: `player_${member.id}` } });
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

            const { LoyaltyService } = await import('../loyalty/loyalty.service');
            const { member: _, ...loyaltyInfo } = await LoyaltyService.getMemberLoyalty(memberId);

            res.json({ success: true, data: { ...member, ...loyaltyInfo } });
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

            const { LoyaltyService } = await import('../loyalty/loyalty.service');
            const { member: _, ...loyaltyInfo } = await LoyaltyService.getMemberLoyalty(memberId);

            // Enrich sessions for dynamic live billing
            const enrichedSessions = await Promise.all(member.sessions.map(async (session) => {
                if (session.status !== 'ACTIVE' || !session.table) return session;

                let runningTableAmount = session.tableAmount;
                const startTime = new Date(session.startTime).getTime();
                const now = Date.now();
                const totalPausedMs = (session as any).totalPausedMs || 0;
                const elapsedMs = (now - startTime) - totalPausedMs;

                // If Open Time Billing (no fixed duration), calculate live price
                if (!session.durationOpts && !session.packageId) {
                    runningTableAmount = await PricingService.calculateTableAmount(session.table.type, session.startTime, new Date(), true);
                }

                return {
                    ...session,
                    elapsedMs,
                    runningTableAmount,
                    runningTotal: runningTableAmount + session.fnbAmount
                };
            }));

            res.json({ success: true, data: { ...member, sessions: enrichedSessions, ...loyaltyInfo } });
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

    static async getKings(req: Request, res: Response, next: NextFunction) {
        try {
            const kings = await KingService.getGlobalKingStatus();
            res.json({ success: true, data: kings });
        } catch (error) { next(error); }
    }

    static async getHallOfFame(req: Request, res: Response, next: NextFunction) {
        try {
            const hallOfFame = await KingService.getHallOfFame();
            res.json({ success: true, data: hallOfFame });
        } catch (error) { next(error); }
    }

    static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
        const { venueId } = req.query;
        try {
            // 1. All-Time Legends
            const allTime = await prisma.member.findMany({
                where: venueId ? {
                    sessions: {
                        some: {
                            table: { venueId: venueId as string }
                        }
                    }
                } : {},
                orderBy: [
                    { totalWins: 'desc' },
                    { loyaltyPoints: 'desc' }
                ],
                take: 50
            });

            // 2. Monthly League (Points earned this month)
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            // Group points by member for this month
            const monthlyPoints = await prisma.pointLog.groupBy({
                by: ['memberId'],
                where: {
                    createdAt: { gte: startOfMonth },
                    points: { gt: 0 },
                    ...(venueId ? {
                        session: {
                            table: { venueId: venueId as string }
                        }
                    } : {})
                },
                _sum: { points: true },
                orderBy: { _sum: { points: 'desc' } },
                take: 20
            });

            // Fetch member details for the monthly leaders
            const monthlyMemberIds = monthlyPoints.map(p => p.memberId);
            const monthlyMembersInfo = await prisma.member.findMany({
                where: { id: { in: monthlyMemberIds } }
            });

            const monthly = monthlyPoints.map(mp => {
                const member = monthlyMembersInfo.find(m => m.id === mp.memberId);
                return {
                    ...member,
                    monthlyScore: mp._sum.points || 0
                };
            });

            // 3. Active Kings (Currently holding a King Table)
            const activeKingsData = await prisma.kingTable.findMany({
                where: {
                    table: venueId ? { venueId: venueId as string } : {}
                },
                include: {
                    king: true,
                    table: true
                },
                orderBy: { streak: 'desc' },
                take: 10
            });

            const activeKings = activeKingsData.map(ak => ({
                ...ak.king,
                currentStreak: ak.streak,
                tableName: ak.table.name
            }));

            // 4. Hall of Fame (All-time Highest Streaks)
            const hallOfFame = await KingService.getHallOfFame(20);

            res.json({ 
                success: true, 
                data: {
                    allTime,
                    monthly,
                    activeKings,
                    hallOfFame
                } 
            });
        } catch (error) { next(error); }
    }

    static async getMatchHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const memberId = req.params.id;

            // Fetch Arena Challenge Matches (MatchChallenge table)
            const cMatches = await (prisma.matchChallenge as any).findMany({
                where: {
                    OR: [{ challengerId: memberId }, { opponentId: memberId }],
                    status: 'COMPLETED'
                },
                include: { challenger: true, opponent: true }
            });

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

            // Fetch Legacy Arena matches if any
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

            const normalizedC = cMatches.map((m: any) => {
                const isChallenger = m.challengerId === memberId;
                const opp = isChallenger ? m.opponent : m.challenger;

                return {
                    id: m.id,
                    type: 'CHALLENGE',
                    tournamentName: m.isFightForTable ? 'Fight for Table' : 'Pit Match',
                    isWinner: m.winnerId === memberId,
                    myScore: m.winnerId === memberId ? 1 : 0,
                    opponentScore: m.winnerId !== memberId ? 1 : 0,
                    opponentName: opp?.name || 'Unknown Player',
                    opponentPhoto: opp?.photo,
                    date: m.updatedAt
                }
            });

            const allMatches = [...normalizedT, ...normalizedA, ...normalizedC]
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

            const { LoyaltyService } = await import('../loyalty/loyalty.service');
            const result = await LoyaltyService.redeem(memberId, rewardId);

            res.json({ success: true, data: result.updatedMember, message: 'Reward redeemed successfully!' });
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
            const { date } = req.query; // Expecting YYYY-MM-DD
            const targetDate = date ? new Date(date as string) : new Date();
            targetDate.setHours(0, 0, 0, 0);
            
            const nextDay = new Date(targetDate);
            nextDay.setDate(targetDate.getDate() + 1);

            // Fetch tables that are playable
            const tables = await prisma.table.findMany({
                where: {
                    status: { not: 'MAINTENANCE' },
                    deletedAt: null
                }
            });

            // Fetch active sessions (ongoing now)
            const activeSessions = await prisma.session.findMany({
                where: {
                    status: 'ACTIVE',
                    deletedAt: null
                },
                include: { table: true }
            });

            // Fetch confirmed bookings for target date
            const bookings = await prisma.waitlist.findMany({
                where: {
                    status: { in: ['WAITING', 'CONFIRMED'] },
                    reservedTime: {
                        gte: targetDate,
                        lt: nextDay
                    },
                    deletedAt: null
                },
                include: { table: true }
            });

            const TIME_SLOTS = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30", "21:00", "22:30", "00:00"];
            const tableTypes = ['REGULAR', 'VIP', 'VVIP'];

            const availabilityBySlot: Record<string, any> = {};

            tableTypes.forEach(type => {
                const typeTables = tables.filter(t => t.type === type);
                const totalOfThisType = typeTables.length;

                const slots: Record<string, any> = {};
                
                TIME_SLOTS.forEach(slot => {
                    const [h, m] = slot.split(':').map(Number);
                    const slotStart = new Date(targetDate);
                    slotStart.setHours(h, m, 0, 0);
                    
                    // Assume each slot is 90 mins for checking overlap
                    const slotEnd = new Date(slotStart.getTime() + 90 * 60000);

                    let occupiedCount = 0;

                    // 1. Check Active Sessions overlap with this slot
                    activeSessions.forEach(s => {
                        if (s.table?.type !== type) return;

                        const sStart = new Date(s.startTime);
                        let sEnd = s.endTime ? new Date(s.endTime) : null;
                        
                        // If end time not set but duration is, calculate it
                        if (!sEnd && s.durationOpts) {
                            sEnd = new Date(sStart.getTime() + s.durationOpts * 60000);
                        }

                        // If it's open time (no end), and we are checking today, 
                        // we assume it occupies the slot if sStart <= slotStart or overlap exists
                        const isOccupied = sEnd 
                            ? (slotStart < sEnd && slotEnd > sStart)
                            : (slotEnd > sStart); // Open time assumes occupied from start onwards
                        
                        if (isOccupied) occupiedCount++;
                    });

                    // 2. Check Bookings overlap with this slot
                    bookings.forEach(b => {
                        // Check either table specific booking or table type area booking
                        const isSameType = (b.tableType === type) || (b.table?.type === type);
                        if (!isSameType || !b.reservedTime) return;

                        const bStart = new Date(b.reservedTime);
                        const bEnd = new Date(bStart.getTime() + (b.durationMinutes || 60) * 60000);

                        if (slotStart < bEnd && slotEnd > bStart) {
                            occupiedCount++;
                        }
                    });

                    slots[slot] = {
                        available: Math.max(0, totalOfThisType - occupiedCount),
                        isFull: occupiedCount >= totalOfThisType,
                        occupied: occupiedCount,
                        total: totalOfThisType
                    };
                });

                availabilityBySlot[type] = {
                    total: totalOfThisType,
                    slots
                };
            });

            // Legacy support for basic available count (summary)
            const summary = tableTypes.map(type => {
                const typeTables = tables.filter(t => t.type === type);
                const activeOnType = activeSessions.filter(s => s.table?.type === type).length;
                
                let nextFreeAt = new Date();
                if (activeOnType >= typeTables.length && typeTables.length > 0) {
                    // Estimate soonest free time from active sessions
                    const ends = activeSessions
                        .filter(s => s.table?.type === type)
                        .map(s => {
                            const start = new Date(s.startTime);
                            return s.endTime ? new Date(s.endTime).getTime() : (start.getTime() + (s.durationOpts || 60) * 60000);
                        });
                    nextFreeAt = new Date(Math.min(...ends));
                }

                return {
                    type,
                    total: typeTables.length,
                    available: Math.max(0, typeTables.length - activeOnType),
                    nextFreeAt,
                    slots: availabilityBySlot[type].slots
                };
            });

            res.json({ success: true, data: summary });
        } catch (error) { next(error); }
    }


    static async getTables(req: Request, res: Response, next: NextFunction) {
        try {
            const tables = await prisma.table.findMany({
                where: {
                    status: { not: 'MAINTENANCE' },
                    deletedAt: null
                },
                include: {
                    sessions: {
                        where: { status: 'ACTIVE' },
                        include: {
                            member: { select: { name: true, photo: true, level: true, handicap: true } }
                        }
                    },
                    kingStatus: {
                        include: { king: true }
                    }
                },
                orderBy: { name: 'asc' }
            });

            const result = tables.map(t => {
                const activeSession = t.sessions[0];
                const king = t.kingStatus;

                return {
                    id: t.id,
                    name: t.name,
                    type: t.type,
                    status: activeSession ? 'PLAYING' : t.status,
                    isKingTable: t.isKingTable,
                    kingInfo: king ? {
                        name: king.king.name,
                        avatar: king.king.photo,
                        streak: king.streak
                    } : null,
                    session: activeSession ? {
                        id: activeSession.id,
                        startTime: activeSession.startTime,
                        endTime: activeSession.endTime,
                        durationMinutes: activeSession.durationOpts,
                        customerName: activeSession.customerName || activeSession.member?.name || 'Guest',
                        memberPhoto: activeSession.member?.photo,
                        memberLevel: activeSession.member?.level,
                        memberHandicap: activeSession.member?.handicap
                    } : null
                };
            });

            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }


    static async createBooking(req: Request, res: Response, next: NextFunction) {
        try {
            const { memberId, tableId, tableType, packageId, reservedTime, partySize, durationMinutes, notes } = req.body;
            if (!memberId) return res.status(400).json({ success: false, message: 'Member ID is required' });

            const member = await prisma.member.findUnique({ where: { id: memberId } });
            if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

            // ANTI-SPAM: 1 Booking constraint
            const activeBooking = await prisma.waitlist.findFirst({
                where: {
                    memberId,
                    status: { in: ['WAITING', 'CONFIRMED'] },
                    deletedAt: null
                }
            });
            if (activeBooking) {
                return res.status(400).json({ success: false, message: 'You already have an active booking waiting. Please wait for the cashier to process your previous booking.' });
            }

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

            const { getIO } = await import('../../socket');
            // Emit dengan payload LENGKAP agar local POS bridge bisa sync ke DB lokal
            // tanpa perlu callback ke VPS (eliminasi latency)
            getIO().emit('booking:new', {
                ...result.booking,
                memberName: member.name,
                memberPhone: member.phone,
                memberPhoto: member.photo,
                memberTier: member.tier,
            });
            getIO().emit('waitlist:updated'); // backward compat untuk UI refresh

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
                await MemberService.checkAndAwardVerificationReward(memberId);
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

            const { getIO } = await import('../../socket');
            getIO().emit('orders:updated');

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
    static async getTransactions(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: memberId } = req.params;
            const sessions = await prisma.session.findMany({
                where: { 
                    memberId,
                    status: 'PAID'
                },
                include: { 
                    table: true,
                    payments: true,
                    orders: { include: { product: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            res.json({ success: true, data: sessions });
        } catch (error) { next(error); }
    }

    static async getUnpaidBills(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: memberId } = req.params;
            
            // Unpaid bills are stored as PENDING DEBT in Expense table
            const debts = await prisma.expense.findMany({
                where: {
                    memberId,
                    category: 'DEBT',
                    status: 'PENDING',
                    isDebt: true
                },
                include: {
                    session: {
                        include: {
                            table: true,
                            orders: { include: { product: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json({ success: true, data: debts });
        } catch (error) { next(error); }
    }

    static async getVenues(req: Request, res: Response, next: NextFunction) {
        try {
            const venues = await prisma.venue.findMany({
                where: { deletedAt: null },
                select: { id: true, name: true, address: true }
            });
            res.json({ success: true, data: venues });
        } catch (error) { next(error); }
    }
}
