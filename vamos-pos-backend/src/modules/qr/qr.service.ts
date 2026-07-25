import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { getIO } from '../../socket';
import { ProductService } from '../products/product.service';

export class QRService {
    static async getMenuForTable(tableId: string) {
        const table = await prisma.table.findUnique({ where: { id: tableId } });
        if (!table) throw new AppError('Table not found', 404);
        
        const venue = await prisma.venue.findFirst();
        const isRecipeSystemEnabled = venue?.isRecipeSystemEnabled || false;

        const allProducts = await prisma.product.findMany({
            where: { deletedAt: null },
            include: { recipes: true },
            orderBy: { name: 'asc' }
        });

        const availableProducts = allProducts.filter(p => {
            if (isRecipeSystemEnabled && p.recipes && p.recipes.length > 0) return true;
            return p.stock > 0;
        });

        const session = await prisma.session.findFirst({
            where: { tableId, status: 'ACTIVE' },
            include: { orders: { include: { product: true } } }
        });

        return { table, products: availableProducts, activeSession: session };
    }

    static async createOrderForTable(tableId: string, cart: { productId: string, quantity: number }[]) {
        let session: any = await prisma.session.findFirst({
            where: { tableId, status: 'ACTIVE' },
            include: { table: true }
        });
        
        if (!session) {
            const table = await prisma.table.findUnique({ where: { id: tableId } });
            session = await prisma.session.create({
                data: {
                    tableId,
                    status: 'ACTIVE',
                    billingType: 'FNB_ONLY',
                    customerName: 'QR Order - ' + Math.random().toString(36).substring(2, 6).toUpperCase(),
                },
                include: { table: true }
            }) as any;
        }

        const ordersCreated = [];
        
        for (const item of cart) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product) continue;
            await ProductService.validateStock(product.id, item.quantity);

            const checkExisting = await prisma.order.findFirst({
                where: { sessionId: session.id, productId: item.productId, kdsStatus: 'PENDING' }
            });

            let order;
            if (checkExisting) {
                order = await prisma.order.update({
                    where: { id: checkExisting.id },
                    data: {
                        quantity: checkExisting.quantity + item.quantity,
                        total: (checkExisting.quantity + item.quantity) * product.price
                    }
                });
            } else {
                order = await prisma.order.create({
                    data: {
                        sessionId: session.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        price: product.price,
                        total: product.price * item.quantity,
                        kdsStatus: 'PENDING'
                    }
                });
            }

            const sessionDesc = session.customerName ? session.customerName : (session.table ? `Meja ${session.table.name}` : `Walk-In (${session.id.substring(0,6)})`);
            await ProductService.updateStock(product.id, -item.quantity, 'SALE', `QR Order - ${sessionDesc}`);
            ordersCreated.push(order);
        }

        const fnbTotal = await prisma.order.aggregate({
            where: { sessionId: session.id },
            _sum: { total: true }
        });

        await prisma.session.update({
            where: { id: session.id },
            data: {
                fnbAmount: fnbTotal._sum.total || 0,
                totalAmount: (fnbTotal._sum.total || 0) + (session.tableAmount || 0)
            }
        });

        getIO().emit('orders:updated');
        getIO().emit('sessions:updated');
        getIO().emit('kds:updated');
        
        return ordersCreated;
    }
}
