import { prisma } from '../../database/db';
import { logger } from '../../utils/logger';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export class PrinterService {
    private static isPrinting: boolean = false;

    /**
     * Generate ESC/POS commands for a 58mm receipt
     */
    private static encodeReceipt(venue: any, session: any): Buffer {
        const ESC = '\x1b';
        const GS = '\x1d';
        const LF = '\n';

        // 58mm printing is roughly 32 characters per line
        const width = 32;

        let content = '';

        // Reset
        content += ESC + '@';

        // Header: Center, Bold, Large
        content += ESC + 'a' + '\x01'; // Center
        content += ESC + 'E' + '\x01'; // Bold ON
        content += GS + '!' + '\x11'; // Double height/width
        content += (venue.name || 'VAMOS POOL').toUpperCase() + LF;
        content += GS + '!' + '\x00'; // Normal size
        content += ESC + 'E' + '\x00'; // Bold OFF
        content += (venue.address || '') + LF;
        content += '-'.repeat(width) + LF;

        // Session Info: Left
        content += ESC + 'a' + '\x00'; // Left
        content += `TRX: ${session.id.substring(0, 8).toUpperCase()}` + LF;
        content += `Meja: ${session.table?.name || '-'}` + LF;
        content += `Kasir: ${session.cashier?.name || '-'}` + LF;
        content += `Waktu: ${new Date().toLocaleString()}` + LF;
        content += '-'.repeat(width) + LF;

        // Items Header
        content += 'ITEM            QTY    TOTAL' + LF;
        content += '-'.repeat(width) + LF;

        // Playtime
        const playTime = `${session.table?.name || 'Billiard'}`;
        const hours = (session.tableAmount || 0).toLocaleString();
        content += `${playTime.padEnd(16)} 1x ${hours.padStart(10)}` + LF;

        // F&B Orders
        if (session.orders && session.orders.length > 0) {
            for (const order of session.orders) {
                const name = order.product?.name || 'F&B';
                const qty = `${order.quantity}x`;
                const total = order.total.toLocaleString();
                content += `${name.padEnd(16)} ${qty.padStart(3)} ${total.padStart(10)}` + LF;
            }
        }
        content += '-'.repeat(width) + LF;

        // Totals: Right
        content += ESC + 'a' + '\x02'; // Right
        content += `Subtotal: ${session.totalAmount.toLocaleString()}` + LF;
        if (session.taxAmount > 0) content += `Pajak: ${session.taxAmount.toLocaleString()}` + LF;
        if (session.serviceAmount > 0) content += `Service: ${session.serviceAmount.toLocaleString()}` + LF;
        if (session.discount > 0) content += `Diskon: -${session.discount.toLocaleString()}` + LF;
        
        content += ESC + 'E' + '\x01'; // Bold ON
        content += `TOTAL: Rp ${(session.finalAmount || session.totalAmount).toLocaleString()}` + LF;
        content += ESC + 'E' + '\x00'; // Bold OFF
        content += '-'.repeat(width) + LF;

        // Footer: Center
        content += ESC + 'a' + '\x01'; // Center
        content += 'Terima Kasih Atas Kunjungan Anda' + LF;
        content += 'VAMOS POOL - Billing System' + LF;
        content += LF + LF + LF + LF; // Extra space for tearing
        
        // Cut command (GS V m) - Some 58mm don't auto-cut, but we try
        content += GS + 'V' + '\x42' + '\x00';

        return Buffer.from(content, 'binary');
    }

    /**
     * Main print function - Non-blocking
     */
    static async printReceipt(sessionId: string) {
        if (this.isPrinting) return;
        this.isPrinting = true;

        try {
            const isLocalBridge = !!process.env.IS_LOCAL_ELECTRON;

            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    table: { include: { venue: true } },
                    orders: { include: { product: true } },
                    cashier: true,
                    member: true
                }
            });

            if (!session) throw new Error('Session not found');

            const venue = session.table?.venue || await prisma.venue.findFirst();
            if (!venue) throw new Error('Venue not configured');

            // --- CLOUD VPS MODE: EMIT SOCKET TO LOCAL BRIDGE ---
            if (!isLocalBridge) {
                const { getIO } = await import('../../socket');
                const io = getIO();
                if (io) {
                    logger.info(`📡 [VPS] Emitting print:receipt for session ${sessionId} to Local Bridge...`);
                    // We emit to everyone, the Local Bridge with matching Venue (or all) will pick it up
                    // Ideally we should emit to specific room, but for now global is fine as usually 1 venue 1 bridge
                    io.emit('print:receipt', {
                        ...session,
                        venue
                    });
                    return; // Stop here, VPS doesn't print physically
                }
            }

            // --- LOCAL BRIDGE MODE: PHYSICAL PRINTING ---
            const printerPath = venue.printerPath || 'RP58 Printer'; // Default to user's printer name
            
            logger.info(`🖨️ PRINTER: Printing receipt for session ${sessionId} to ${printerPath}`);

            // If we are on local bridge, we can use our new PrintService (more stable for 58mm)
            try {
                const { PrintService } = await import('../print/print.service');
                await PrintService.printReceipt({ ...session, venue });
                return;
            } catch (e) {
                logger.warn(`⚠️ PrintService (raw) failed, falling back to PowerShell: ${e}`);
            }

            // FALLBACK TO POWERSHELL (Old Method)
            const buffer = this.encodeReceipt(venue, session);
            const tempFile = path.join(os.tmpdir(), `receipt_${sessionId}.bin`);
            fs.writeFileSync(tempFile, buffer);

            const psCommand = `"$bytes = [System.IO.File]::ReadAllBytes('${tempFile.replace(/'/g, "''")}'); $printer = '${printerPath.replace(/'/g, "''")}'; [System.IO.File]::WriteAllBytes('\\\\localhost\\'+$printer, $bytes)"`;
            
            exec(`powershell -Command ${psCommand}`, (error) => {
                if (error) {
                    exec(`copy /b "${tempFile}" "\\\\localhost\\${printerPath}"`);
                }
                setTimeout(() => fs.existsSync(tempFile) && fs.unlinkSync(tempFile), 2000);
            });

        } catch (err: any) {
            logger.error(`🚨 PRINTER SERVICE ERROR: ${err.message}`);
        } finally {
            this.isPrinting = false;
        }
    }

    /**
     * Silent Test Print
     */
    static async testPrint() {
        logger.info('🖨️ PRINTER: Running silent test print...');
        // Implementation for a small "Printer Ready" text
    }
}
