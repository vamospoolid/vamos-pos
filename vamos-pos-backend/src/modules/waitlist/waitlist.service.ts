import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';
import { SessionService } from '../sessions/session.service';

export class WaitlistService {
    static async addToWaitlist(data: { customerName: string, phone?: string, partySize?: number, tableType?: string, notes?: string, reservedTime?: string, tableId?: string }, userId: string) {
        const waitlist = await prisma.waitlist.create({
            data: {
                customerName: data.customerName,
                phone: data.phone,
                partySize: data.partySize || 1,
                tableType: data.tableType,
                notes: data.notes,
                reservedTime: data.reservedTime ? new Date(data.reservedTime) : null,
                tableId: data.tableId || null,
                status: 'WAITING'
            }
        });

        if (data.phone) {
            try {
                const venue = await prisma.venue.findFirst();
                const venueName = venue?.name || 'VAMOS';
                const { WaTemplateService, WA_TEMPLATE_IDS } = await import('../whatsapp/wa.template.service');
                const waTemplate = await WaTemplateService.renderTemplate(WA_TEMPLATE_IDS.WAITLIST_CONFIRM, {
                    name: data.customerName,
                    venue: venueName,
                    table: data.tableType || 'Any',
                    time: data.reservedTime ? new Date(data.reservedTime).toLocaleString('id-ID') : 'Sekarang',
                });
                if (waTemplate) {
                    import('../whatsapp/wa.service').then(({ waService }) => {
                        waService.sendMessage(data.phone as string, waTemplate.body, waTemplate.imageUrl || undefined);
                    });
                }
            } catch (error) {
                console.error('Failed to send waitlist confirm WA:', error);
            }
        }


        await AuditService.log(userId, 'WAITLIST_ADD', 'Waitlist', { waitlistId: waitlist.id });
        return waitlist;
    }

    static async getWaitlist() {
        return prisma.waitlist.findMany({
            where: {
                status: { in: ['WAITING', 'CALLED'] },
                deletedAt: null
            },
            include: {
                table: true
            },
            orderBy: [
                { reservedTime: 'asc' },
                { createdAt: 'asc' }
            ]
        });
    }

    static async updateStatus(id: string, status: string, userId: string, tableId?: string) {
        let waitlist = await prisma.waitlist.findUnique({ where: { id } });
        if (!waitlist) throw new AppError('Waitlist entry not found', 404);

        if (status === 'CALLED' && waitlist.phone) {
            try {
                const venue = await prisma.venue.findFirst();
                const venueName = venue?.name || 'VAMOS';
                const { WaTemplateService, WA_TEMPLATE_IDS } = await import('../whatsapp/wa.template.service');
                const waTemplate = await WaTemplateService.renderTemplate(WA_TEMPLATE_IDS.WAITLIST_READY, {
                    name: waitlist.customerName,
                    venue: venueName,
                });
                if (waTemplate) {
                    import('../whatsapp/wa.service').then(({ waService }) => {
                        waService.sendMessage(waitlist!.phone as string, waTemplate.body, waTemplate.imageUrl || undefined);
                    });
                }
            } catch (error) {
                console.error('Failed to send waitlist ready WA:', error);
            }
        }


        if (status === 'SEATED') {
            const finalTableId = tableId || waitlist!.tableId;
            if (!finalTableId) {
                throw new AppError('Silakan pilih meja terlebih dahulu untuk menidurkan (SEATED) tamu ini.', 400);
            }

            // Update tableId if changed/assigned
            if (tableId && tableId !== waitlist!.tableId) {
                waitlist = await prisma.waitlist.update({
                    where: { id },
                    data: { tableId }
                });
            }

            // Start Session
            await SessionService.startSession(
                finalTableId,
                userId,
                (waitlist! as any).packageId || undefined,
                waitlist!.memberId || undefined,
                (waitlist! as any).durationMinutes || 60,
                (waitlist! as any).price || undefined
            );
        }

        const updated = await prisma.waitlist.update({
            where: { id },
            data: { status }
        });

        await AuditService.log(userId, 'WAITLIST_UPDATE_STATUS', 'Waitlist', { waitlistId: id, status });
        return updated;
    }

    static async deleteWaitlist(id: string, userId: string) {
        await prisma.waitlist.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        await AuditService.log(userId, 'WAITLIST_DELETE', 'Waitlist', { waitlistId: id });
        return { success: true };
    }
}
