import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { RelayService } from '../relay/relay.service';

export class VenueService {
    static async createVenue(data: { name: string; address?: string; openTime?: string; closeTime?: string; relayComPort?: string; taxPercent?: number; servicePercent?: number }) {
        return prisma.venue.create({
            data
        });
    }

    static async getVenues() {
        return prisma.venue.findMany({
            where: { deletedAt: null },
            include: {
                tables: {
                    where: { deletedAt: null }
                }
            }
        });
    }

    static async getVenueById(id: string) {
        const venue = await prisma.venue.findFirst({
            where: { id, deletedAt: null },
            include: {
                tables: {
                    where: { deletedAt: null }
                }
            }
        });

        if (!venue) {
            throw new AppError('Venue not found', 404);
        }

        return venue;
    }

    static async updateVenue(id: string, data: { name?: string; address?: string; openTime?: string; closeTime?: string; relayComPort?: string; taxPercent?: number; servicePercent?: number; printerPath?: string; blinkWarningMinutes?: number; isSyncEnabled?: boolean; syncIntervalSeconds?: number; splashImageUrl?: string }) {
        const venue = await prisma.venue.findFirst({ where: { id, deletedAt: null } });
        if (!venue) {
            throw new AppError('Venue not found', 404);
        }

        // PROTECTION: Jangan timpa data dengan string Kosong (hasil race condition frontend)
        const updateData: any = { ...data };
        if (updateData.name === '') delete updateData.name;
        if (updateData.address === '') delete updateData.address;
        if (updateData.relayComPort === '') delete updateData.relayComPort;

        const updated = await prisma.venue.update({
            where: { id },
            data: updateData
        });

        if (data.relayComPort) {
            // TERIAKKAN KE BRIDGE (LAPTOP) AGAR GANTI PORT REAL-TIME
            RelayService.notifyConfigUpdate(data.relayComPort);
            
            // JUGA UPDATE LOKAL (JIKA SEDANG RUN DI MODE LOKAL)
            RelayService.init(data.relayComPort);
        }

        return updated;
    }

    static async deleteVenue(id: string) {
        const venue = await prisma.venue.findFirst({ where: { id, deletedAt: null } });
        if (!venue) {
            throw new AppError('Venue not found', 404);
        }

        return prisma.venue.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
