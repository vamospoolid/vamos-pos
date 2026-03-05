import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';

export class OrderService {
    static async addOrder(sessionId: string, productId: string, quantity: number, userId: string) {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session || !['ACTIVE', 'PENDING', 'FINISHED'].includes(session.status)) {
            throw new AppError('Cannot add orders to this session', 400);
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new AppError('Product not found', 404);
        if (product.stock < quantity) throw new AppError('Not enough stock', 400);

        const checkExisting = await prisma.order.findFirst({
            where: { sessionId, productId }
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
                }
            });
        }

        await prisma.product.update({
            where: { id: productId },
            data: { stock: product.stock - quantity },
        });

        const fnbTotal = await prisma.order.aggregate({
            where: { sessionId },
            _sum: { total: true }
        });

        const currentSession = await prisma.session.findUnique({ where: { id: sessionId } });
        await prisma.session.update({
            where: { id: sessionId },
            data: {
                fnbAmount: fnbTotal._sum.total || 0,
                totalAmount: (fnbTotal._sum.total || 0) + (currentSession?.tableAmount || 0)
            }
        });

        await AuditService.log(userId, 'ORDER_CREATE', 'Order', { sessionId, orderId: order.id });
        return order;
    }

    static async removeOrder(orderId: string, userId: string) {
        const order = await prisma.order.findUnique({ where: { id: orderId }, include: { session: true } });
        if (!order) throw new AppError('Order not found', 404);
        if (!['ACTIVE', 'PENDING', 'FINISHED'].includes(order.session.status)) {
            throw new AppError('Cannot modify orders for this session', 400);
        }

        await prisma.order.delete({ where: { id: orderId } });

        await prisma.product.update({
            where: { id: order.productId },
            data: { stock: { increment: order.quantity } }
        });

        const fnbTotal = await prisma.order.aggregate({
            where: { sessionId: order.sessionId },
            _sum: { total: true }
        });

        const currentSession = await prisma.session.findUnique({ where: { id: order.sessionId } });
        await prisma.session.update({
            where: { id: order.sessionId },
            data: {
                fnbAmount: fnbTotal._sum.total || 0,
                totalAmount: (fnbTotal._sum.total || 0) + (currentSession?.tableAmount || 0)
            }
        });

        await AuditService.log(userId, 'ORDER_DELETE', 'Order', { orderId });
        return { success: true };
    }
}
