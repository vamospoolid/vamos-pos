import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { TableStatus } from '@prisma/client';

export class TableService {
    static async createTable(data: { venueId: string; name: string; type: string; relayChannel: number }) {
        console.log('Validating table create data:', JSON.stringify(data));

        // Ensure id is not accidentally passed as empty string
        const { venueId, name, type, relayChannel } = data as any;
        const cleanData = {
            venueId,
            name,
            type,
            relayChannel: Number(relayChannel)
        };

        if (isNaN(cleanData.relayChannel)) {
            throw new AppError('Relay channel must be a valid number', 400);
        }

        // Verify venue exists
        const venue = await prisma.venue.findFirst({ where: { id: cleanData.venueId, deletedAt: null } });
        if (!venue) {
            console.error('Venue not found for ID:', cleanData.venueId);
            throw new AppError('Venue not found with ID: ' + cleanData.venueId, 404);
        }

        // Check if relayChannel is already used in this venue
        const existingTable = await prisma.table.findFirst({
            where: { venueId: cleanData.venueId, relayChannel: cleanData.relayChannel, deletedAt: null }
        });
        if (existingTable) {
            throw new AppError(`Relay channel ${cleanData.relayChannel} is already used by ${existingTable.name}`, 400);
        }

        try {
            return await prisma.table.create({
                data: cleanData
            });
        } catch (dbError: any) {
            console.error('Prisma Create Table Error:', dbError);
            throw dbError;
        }
    }

    static async getTables(venueId?: string) {
        const whereClause: any = { deletedAt: null };
        if (venueId) {
            whereClause.venueId = venueId;
        }

        return prisma.table.findMany({
            where: whereClause,
            include: {
                venue: true
            },
            orderBy: {
                name: 'asc'
            }
        });
    }

    static async getTableById(id: string) {
        const table = await prisma.table.findFirst({
            where: { id, deletedAt: null },
            include: {
                venue: true
            }
        });

        if (!table) {
            throw new AppError('Table not found', 404);
        }

        return table;
    }

    static async updateTable(id: string, data: { name?: string; type?: string; status?: TableStatus; relayChannel?: number }) {
        const table = await prisma.table.findFirst({ where: { id, deletedAt: null } });
        if (!table) {
            throw new AppError('Table not found', 404);
        }

        if (data.relayChannel && data.relayChannel !== table.relayChannel) {
            const existingTable = await prisma.table.findFirst({
                where: { venueId: table.venueId, relayChannel: data.relayChannel, deletedAt: null }
            });
            if (existingTable) {
                throw new AppError('Relay channel is already in use at this venue', 400);
            }
        }

        return prisma.table.update({
            where: { id },
            data
        });
    }

    static async deleteTable(id: string) {
        const table = await prisma.table.findFirst({ where: { id, deletedAt: null } });
        if (!table) {
            throw new AppError('Table not found', 404);
        }

        return prisma.table.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }

    /**
     * Resets tables stuck in PLAYING status that have no active session.
     */
    static async fixStuckTables() {
        // Find all PLAYING tables
        const playingTables = await prisma.table.findMany({
            where: { status: 'PLAYING', deletedAt: null },
            include: {
                sessions: {
                    where: { status: 'ACTIVE' },
                    take: 1
                }
            }
        });

        // Filter those with no active session
        const stuckTables = playingTables.filter(t => t.sessions.length === 0);

        if (stuckTables.length === 0) {
            return { fixed: 0, tableNames: [] };
        }

        await prisma.table.updateMany({
            where: { id: { in: stuckTables.map(t => t.id) } },
            data: { status: 'AVAILABLE' }
        });

        return {
            fixed: stuckTables.length,
            tableNames: stuckTables.map(t => t.name)
        };
    }
}
