import { prisma } from '../../database/db';

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
}
