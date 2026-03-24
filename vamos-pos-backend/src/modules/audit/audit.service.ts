import { prisma } from '../../database/db';
import { logger } from '../../utils/logger';

export class AuditService {
    static async log(userId: string | undefined, action: string, resource: string, details?: any) {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                resource,
                details: details ? JSON.stringify(details) : undefined,
            }
        });
    }

    /**
     * Hapus AuditLog yang lebih tua dari `retentionDays` hari.
     * Default: 90 hari. Dipanggil otomatis dari server.ts setiap hari.
     */
    static async cleanupOldLogs(retentionDays = 90): Promise<number> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - retentionDays);

        const result = await prisma.auditLog.deleteMany({
            where: {
                createdAt: { lt: cutoff }
            }
        });

        if (result.count > 0) {
            logger.info(`🧹 AuditLog cleanup: ${result.count} log dihapus (lebih tua dari ${retentionDays} hari).`);
        }

        return result.count;
    }
}

