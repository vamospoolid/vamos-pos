import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { TableStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

export class TableService {
    static async createTable(data: { venueId: string; name: string; type: string; relayChannel: number; isKingTable?: boolean }) {
        console.log('Validating table create data:', JSON.stringify(data));

        const { venueId, name, type, relayChannel } = data as any;
        const cleanData = {
            venueId,
            name,
            type,
            relayChannel: Number(relayChannel),
            isKingTable: Boolean(data.isKingTable)
        };

        if (isNaN(cleanData.relayChannel)) {
            throw new AppError('Relay channel must be a valid number', 400);
        }

        const venue = await prisma.venue.findFirst({ where: { id: cleanData.venueId, deletedAt: null } });
        if (!venue) {
            console.error('Venue not found for ID:', cleanData.venueId);
            throw new AppError('Venue not found with ID: ' + cleanData.venueId, 404);
        }

        const existingTable = await prisma.table.findFirst({
            where: { venueId: cleanData.venueId, relayChannel: cleanData.relayChannel, deletedAt: null }
        });
        if (existingTable) {
            throw new AppError(`Relay channel ${cleanData.relayChannel} is already used by ${existingTable.name}`, 400);
        }

        try {
            return await prisma.table.create({ data: cleanData });
        } catch (dbError: any) {
            console.error('Prisma Create Table Error:', dbError);
            throw dbError;
        }
    }

    static async getTables(venueId?: string) {
        const whereClause: any = { deletedAt: null };
        if (venueId) whereClause.venueId = venueId;

        return prisma.table.findMany({
            where: whereClause,
            include: { 
                venue: true,
                kingStatus: {
                    include: {
                        king: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    static async getTableById(id: string) {
        const table = await prisma.table.findFirst({
            where: { id, deletedAt: null },
            include: { 
                venue: true,
                kingStatus: {
                    include: {
                        king: true
                    }
                }
            }
        });
        if (!table) throw new AppError('Table not found', 404);
        return table;
    }

    static async updateTable(id: string, data: { name?: string; type?: string; status?: TableStatus; relayChannel?: number; isKingTable?: boolean }) {
        const table = await prisma.table.findFirst({ where: { id, deletedAt: null } });
        if (!table) throw new AppError('Table not found', 404);

        if (data.relayChannel && data.relayChannel !== table.relayChannel) {
            const existingTable = await prisma.table.findFirst({
                where: { venueId: table.venueId, relayChannel: data.relayChannel, deletedAt: null }
            });
            if (existingTable) throw new AppError('Relay channel is already in use at this venue', 400);
        }

        return prisma.table.update({ where: { id }, data });
    }

    static async deleteTable(id: string) {
        const table = await prisma.table.findFirst({ where: { id, deletedAt: null } });
        if (!table) throw new AppError('Table not found', 404);
        return prisma.table.update({ where: { id }, data: { deletedAt: new Date() } });
    }

    /**
     * Reset meja yang stuck di status PLAYING padahal tidak ada sesi aktif.
     *
     * Langkah:
     *   1. Update status DB → AVAILABLE
     *   2. Kirim perintah relay OFF per channel → lampu fisik benar-benar mati
     *
     * Return value mencakup berapa relay berhasil dimatikan dan
     * channel mana yang gagal (jika relay tidak terhubung, tetap tidak crash).
     */
    static async fixStuckTables(): Promise<{
        fixed: number;
        tableNames: string[];
        relayOff: number[];
        relayErrors: string[];
    }> {
        // Cari semua meja berstatus PLAYING
        const playingTables = await prisma.table.findMany({
            where: { status: 'PLAYING', deletedAt: null },
            include: {
                sessions: {
                    where: { status: 'ACTIVE' },
                    take: 1
                }
            }
        });

        // Yang tidak punya sesi aktif = stuck
        const stuckTables = playingTables.filter(t => t.sessions.length === 0);

        if (stuckTables.length === 0) {
            return { fixed: 0, tableNames: [], relayOff: [], relayErrors: [] };
        }

        logger.warn(
            `🔧 fixStuckTables: ditemukan ${stuckTables.length} meja stuck → ` +
            `[${stuckTables.map(t => `${t.name}(ch${t.relayChannel})`).join(', ')}]`
        );

        // ── LANGKAH 1: Reset status DB ──────────────────────────────────
        await prisma.table.updateMany({
            where: { id: { in: stuckTables.map(t => t.id) } },
            data: { status: 'AVAILABLE' }
        });
        logger.info(`✅ fixStuckTables: Status DB ${stuckTables.length} meja → AVAILABLE`);

        // ── LANGKAH 2: Matikan relay per channel (DIPERINTAHKAN USER UNTUK DIHAPUS) ──────
        // User ingin meja direset di DB tapi lampu tetap menyala (mungkin untuk manual check)
        /*
        const { RelayService } = await import('../relay/relay.service');
        for (const table of stuckTables) {
            try {
                await RelayService.sendCommand(table.relayChannel, 'off');
                relayOff.push(table.relayChannel);
            } catch (err: any) { ... }
        }
        */

        // ── LANGKAH 3: Sinyal Realtime ──────────────────────────────────
        try {
            const { getIO } = await import('../../socket');
            const io = getIO();
            if (io) {
                io.emit('tables:updated');
                io.emit('sessions:updated');
                logger.info('📡 fixStuckTables: Sinyal realtime dikirim ke Frontend');
            }
        } catch (socketErr: any) {
            logger.error(`❌ fixStuckTables Gagal mengirim socket: ${socketErr.message}`);
        }

        return {
            fixed: stuckTables.length,
            tableNames: stuckTables.map(t => t.name),
            relayOff: [],
            relayErrors: [],
        };
    }
}
