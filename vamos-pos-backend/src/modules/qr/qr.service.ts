import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { getIO } from '../../socket';
import { ProductService } from '../products/product.service';

export class QRService {
    static async findTableFlexible(tableId: string) {
        let table = await prisma.table.findUnique({ where: { id: tableId } });
        if (!table) {
            const isShortNumber = /^\d{1,3}$/.test(tableId.trim());
            const channelNum = isShortNumber ? parseInt(tableId.trim(), 10) : null;
            
            table = await prisma.table.findFirst({
                where: {
                    deletedAt: null,
                    OR: [
                        { id: { startsWith: tableId.slice(0, 8) } },
                        { name: { contains: tableId, mode: 'insensitive' } },
                        ...(channelNum !== null ? [{ relayChannel: channelNum }] : [])
                    ]
                }
            });
        }
        if (!table) {
            table = await prisma.table.findFirst({
                where: { deletedAt: null },
                orderBy: { relayChannel: 'asc' }
            });
        }
        return table;
    }

    static async getMenuForTable(tableId: string) {
        if (tableId.startsWith('AREA_')) {
            const areaNames: Record<string, string> = {
                'AREA_CAFE': 'Kafe / Lounge',
                'AREA_BAR': 'Bar Counter',
                'AREA_TAKEAWAY': 'Bungkus / Takeaway'
            };
            const venue = await prisma.venue.findFirst();
            const isRecipeSystemEnabled = venue?.isRecipeSystemEnabled || false;

            const allProducts = await prisma.product.findMany({
                where: { deletedAt: null },
                include: { recipes: true },
                orderBy: { name: 'asc' }
            });

            const availableProducts = allProducts.filter(p => {
                if (isRecipeSystemEnabled && p.recipes && p.recipes.length > 0) return true;
                return p.stock > 0 || allProducts.length <= 10;
            });

            return {
                table: { id: tableId, name: areaNames[tableId] || 'Area Khusus', type: 'Area' },
                products: availableProducts.length > 0 ? availableProducts : allProducts,
                activeSession: null
            };
        }

        const table = await this.findTableFlexible(tableId);
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
            return p.stock > 0 || allProducts.length <= 10;
        });

        const session = await prisma.session.findFirst({
            where: { tableId: table.id, status: 'ACTIVE' },
            include: { orders: { include: { product: true } } }
        });

        return { table, products: availableProducts.length > 0 ? availableProducts : allProducts, activeSession: session };
    }

    static async createOrderForTable(
        tableId: string,
        cart: { productId: string, quantity: number, notes?: string }[],
        waiterName?: string,
        areaNote?: string,
        customerNameInput?: string,
        memberId?: string
    ) {
        if (tableId.startsWith('AREA_')) {
            const areaMap: Record<string, string> = {
                'AREA_CAFE': 'Kafe / Lounge',
                'AREA_BAR': 'Bar Counter',
                'AREA_TAKEAWAY': 'Bungkus / Takeaway',
            };
            const baseArea = areaMap[tableId] || tableId.replace('AREA_', '');
            const targetCustomerName = customerNameInput?.trim() || `${baseArea}${areaNote ? ` - ${areaNote.trim()}` : ''}${waiterName ? ` (Waiter: ${waiterName})` : ''}`;

            // Reuse existing PENDING session for the same customer / member if available (except for takeaway)
            let session: any = null;
            if (tableId !== 'AREA_TAKEAWAY') {
                if (memberId) {
                    session = await prisma.session.findFirst({
                        where: {
                            status: 'PENDING',
                            tableId: null,
                            billingType: 'FNB_ONLY',
                            memberId: memberId
                        },
                        orderBy: { createdAt: 'desc' }
                    });
                }

                if (!session && customerNameInput?.trim()) {
                    session = await prisma.session.findFirst({
                        where: {
                            status: 'PENDING',
                            tableId: null,
                            billingType: 'FNB_ONLY',
                            customerName: { equals: customerNameInput.trim(), mode: 'insensitive' }
                        },
                        orderBy: { createdAt: 'desc' }
                    });
                }

                // Fallback for legacy areaNote pattern
                if (!session && areaNote) {
                    const searchPattern = `${baseArea} - ${areaNote.trim()}`;
                    session = await prisma.session.findFirst({
                        where: {
                            status: 'PENDING',
                            tableId: null,
                            customerName: { startsWith: searchPattern }
                        },
                        orderBy: { createdAt: 'desc' }
                    });
                }
            }

            if (!session) {
                // Create FNB_ONLY session without billiard tableId (appears in Pending Bills)
                session = await prisma.session.create({
                    data: {
                        status: 'PENDING',
                        billingType: 'FNB_ONLY',
                        customerName: targetCustomerName,
                        memberId: memberId || null
                    } as any
                });
            } else if (memberId && !session.memberId) {
                // Attach member if previously not attached
                session = await prisma.session.update({
                    where: { id: session.id },
                    data: { memberId }
                });
            }

            // Pre-validate all cart items for stock before writing any orders
            for (const item of cart) {
                const product = await prisma.product.findUnique({ where: { id: item.productId } });
                if (!product) throw new AppError('Produk tidak ditemukan', 404);
                await ProductService.validateStock(product.id, item.quantity);
            }

            const ordersCreated = [];
            for (const item of cart) {
                const product = await prisma.product.findUnique({ where: { id: item.productId } });
                if (!product) continue;

                // Group by productId, PENDING status, and matching notes
                const checkExisting = await prisma.order.findFirst({
                    where: {
                        sessionId: session.id,
                        productId: item.productId,
                        kdsStatus: 'PENDING',
                        notes: item.notes ? item.notes.trim() : null
                    }
                });

                let order;
                if (checkExisting) {
                    order = await prisma.order.update({
                        where: { id: checkExisting.id },
                        data: {
                            quantity: checkExisting.quantity + item.quantity,
                            total: (checkExisting.quantity + item.quantity) * product.price,
                            waiterName: waiterName || checkExisting.waiterName || null
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
                            notes: item.notes ? item.notes.trim() : null,
                            waiterName: waiterName || null,
                            kdsStatus: 'PENDING'
                        }
                    });
                }

                const notesSuffix = item.notes ? ` [${item.notes.trim()}]` : '';
                await ProductService.updateStock(product.id, -item.quantity, 'SALE', `F&B Order - ${targetCustomerName}${notesSuffix}`);
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
                    totalAmount: fnbTotal._sum.total || 0
                }
            });

            getIO().emit('orders:updated');
            getIO().emit('sessions:updated');
            getIO().emit('kds:updated');
            getIO().emit('stock:updated');
            getIO().emit('notification:new', {
                type: 'ORDER',
                title: 'Pesanan Kafe Baru',
                message: `${targetCustomerName} — ${ordersCreated.length} item pesanan`,
                sessionId: session.id
            });

            return ordersCreated;
        }

        const table = await this.findTableFlexible(tableId);
        if (!table) throw new AppError('Table not found', 404);

        let session: any = await prisma.session.findFirst({
            where: { tableId: table.id, status: 'ACTIVE' },
            include: { table: true }
        });
        
        if (!session) {
            const customerName = areaNote
                ? `${areaNote.trim()} (Waiter: ${waiterName || 'Staff'})`
                : (waiterName ? `Pelanggan (Waiter: ${waiterName})` : `QR ${table.name}`);
            session = await prisma.session.create({
                data: {
                    tableId: table.id,
                    status: 'ACTIVE',
                    billingType: 'FNB_ONLY',
                    customerName,
                },
                include: { table: true }
            }) as any;
        } else if (waiterName && (!session.customerName || session.customerName.startsWith('QR '))) {
            const customerName = customerNameInput?.trim() || (areaNote
                ? `${areaNote.trim()} (Waiter: ${waiterName})`
                : `Pelanggan (Waiter: ${waiterName})`);
            session = await prisma.session.update({
                where: { id: session.id },
                data: { 
                    customerName,
                    memberId: memberId || session.memberId
                },
                include: { table: true }
            });
        } else if (memberId && !session.memberId) {
            session = await prisma.session.update({
                where: { id: session.id },
                data: { memberId },
                include: { table: true }
            });
        }

        // Pre-validate all cart items for stock before writing any orders
        for (const item of cart) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product) throw new AppError('Produk tidak ditemukan', 404);
            await ProductService.validateStock(product.id, item.quantity);
        }

        const ordersCreated = [];
        
        for (const item of cart) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product) continue;

            // Group by productId, PENDING status, AND matching notes (so special instructions aren't merged)
            const checkExisting = await prisma.order.findFirst({
                where: { 
                    sessionId: session.id, 
                    productId: item.productId, 
                    kdsStatus: 'PENDING',
                    notes: item.notes ? item.notes.trim() : null
                }
            });

            let order;
            if (checkExisting) {
                order = await prisma.order.update({
                    where: { id: checkExisting.id },
                    data: {
                        quantity: checkExisting.quantity + item.quantity,
                        total: (checkExisting.quantity + item.quantity) * product.price,
                        waiterName: waiterName || checkExisting.waiterName || null
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
                        notes: item.notes ? item.notes.trim() : null,
                        waiterName: waiterName || null,
                        kdsStatus: 'PENDING'
                    }
                });
            }

            const sessionDesc = session.customerName ? session.customerName : (session.table ? `Meja ${session.table.name}` : `Walk-In (${session.id.substring(0,6)})`);
            const notesSuffix = item.notes ? ` [${item.notes.trim()}]` : '';
            const waiterSuffix = waiterName ? ` (Waiter: ${waiterName})` : '';
            await ProductService.updateStock(product.id, -item.quantity, 'SALE', `F&B Order - ${sessionDesc}${notesSuffix}${waiterSuffix}`);
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
        getIO().emit('stock:updated');
        getIO().emit('notification:new', {
            type: 'ORDER',
            title: `Pesanan Baru: ${session.table?.name || 'Meja Biliar'}`,
            message: `${session.customerName || 'Pelanggan'} — ${ordersCreated.length} item pesanan`,
            sessionId: session.id
        });
        
        return ordersCreated;
    }
}
