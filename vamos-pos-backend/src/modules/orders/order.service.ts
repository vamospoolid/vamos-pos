import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';
import { ProductService } from '../products/product.service';

export class OrderService {
    static async addOrder(sessionId: string, productId: string, quantity: number, userId: string, notes?: string) {
        const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { table: true } });
        if (!session || !['ACTIVE', 'PENDING', 'FINISHED'].includes(session.status)) {
            throw new AppError('Cannot add orders to this session', 400);
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new AppError('Product not found', 404);
        await ProductService.validateStock(productId, quantity);

        const checkExisting = await prisma.order.findFirst({
            where: { sessionId, productId, notes: notes ? notes.trim() : null }
        });

        let order;
        if (checkExisting) {
            order = await prisma.order.update({
                where: { id: checkExisting.id },
                data: {
                    quantity: checkExisting.quantity + quantity,
                    total: (checkExisting.quantity + quantity) * product.price
                }
            });
        } else {
            order = await prisma.order.create({
                data: {
                    sessionId,
                    productId,
                    quantity,
                    price: product.price,
                    total: product.price * quantity,
                    notes: notes ? notes.trim() : null,
                }
            });
        }

        const sessionDesc = session.customerName ? session.customerName : (session.table ? `Meja ${session.table.name}` : `Walk-In (${session.id.substring(0,6)})`);
        const notesSuffix = notes ? ` [${notes.trim()}]` : '';
        await ProductService.updateStock(productId, -quantity, 'SALE', `Penjualan - ${sessionDesc}${notesSuffix}`);

        const fnbTotal = await prisma.order.aggregate({
            where: { sessionId },
            _sum: { total: true }
        });

        await prisma.session.update({
            where: { id: sessionId },
            data: {
                fnbAmount: fnbTotal._sum.total || 0,
                totalAmount: (fnbTotal._sum.total || 0) + (session.tableAmount || 0)
            }
        });

        await AuditService.log(userId, 'ORDER_CREATE', 'Order', { sessionId, orderId: order.id });
        return order;
    }

    static async removeOrder(orderId: string, userId: string) {
        const order = await prisma.order.findUnique({ where: { id: orderId }, include: { session: { include: { table: true } } } });
        if (!order) throw new AppError('Order not found', 404);
        if (!['ACTIVE', 'PENDING', 'FINISHED'].includes(order.session.status)) {
            throw new AppError('Cannot modify orders for this session', 400);
        }

        await prisma.order.delete({ where: { id: orderId } });

        const sessionDesc = order.session.customerName ? order.session.customerName : (order.session.table ? `Meja ${order.session.table.name}` : `Walk-In (${order.session.id.substring(0,6)})`);
        await ProductService.updateStock(order.productId, order.quantity, 'RETURN', `Batal Penjualan - ${sessionDesc}`);

        const fnbTotal = await prisma.order.aggregate({
            where: { sessionId: order.sessionId },
            _sum: { total: true }
        });

        const currentSession = await prisma.session.findUnique({ where: { id: order.sessionId } });
        const remainingFnb = fnbTotal._sum.total || 0;
        const remainingTable = currentSession?.tableAmount || 0;
        const newTotal = remainingFnb + remainingTable;

        // Jika sesi FNB_ONLY semua pesanannya dibatalkan (total Rp 0), tandai CANCELLED agar tidak jadi tagihan hantu di kasir
        const isFnbOnlyEmpty = (!currentSession?.tableId || currentSession?.billingType === 'FNB_ONLY') && remainingFnb === 0 && remainingTable === 0;

        await prisma.session.update({
            where: { id: order.sessionId },
            data: {
                status: isFnbOnlyEmpty ? 'CANCELLED' : currentSession?.status,
                fnbAmount: remainingFnb,
                totalAmount: newTotal
            }
        });

        await AuditService.log(userId, 'ORDER_DELETE', 'Order', { orderId });
        return { success: true };
    }

    static async getKDSOrders(status: string = 'active') {
        if (status === 'history') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return await prisma.order.findMany({
                where: {
                    kdsStatus: 'SERVED',
                    updatedAt: { gte: today }
                },
                include: {
                    product: true,
                    session: {
                        include: {
                            table: true
                        }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                },
                take: 100
            });
        }

        return await prisma.order.findMany({
            where: {
                kdsStatus: {
                    not: 'SERVED'
                }
            },
            include: {
                product: true,
                session: {
                    include: {
                        table: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
    }

    static async serveSessionKDS(sessionId: string) {
        return await prisma.order.updateMany({
            where: {
                sessionId,
                kdsStatus: { not: 'SERVED' }
            },
            data: {
                kdsStatus: 'SERVED'
            }
        });
    }

    static async revertSessionKDS(sessionId: string) {
        return await prisma.order.updateMany({
            where: {
                sessionId,
                kdsStatus: 'SERVED'
            },
            data: {
                kdsStatus: 'PENDING'
            }
        });
    }

    static async updateKDSStatus(orderId: string, status: string) {
        if (!['PENDING', 'PROCESSING', 'READY', 'SERVED'].includes(status)) {
            throw new AppError('Invalid KDS status', 400);
        }
        
        return await prisma.order.update({
            where: { id: orderId },
            data: { kdsStatus: status }
        });
    }
}
