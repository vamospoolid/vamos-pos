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
            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    table: { include: { venue: true } },
                    orders: { include: { product: true } },
                    cashier: true
                }
            });

            if (!session) throw new Error('Session not found');

            const venue = session.table?.venue || await prisma.venue.findFirst();
            if (!venue) throw new Error('Venue not configured');

            const printerPath = venue.printerPath || 'POS-58'; // Default name
            
            logger.info(`🖨️ PRINTER: Printing receipt for session ${sessionId} to ${printerPath}`);

            const buffer = this.encodeReceipt(venue, session);
            
            // Write to a temporary file
            const tempFile = path.join(os.tmpdir(), `receipt_${sessionId}.bin`);
            fs.writeFileSync(tempFile, buffer);

            // Send to Windows Printer using different methods
            // Method A: If printer is shared, use copy /b
            // Method B: Using PowerShell Out-Printer (doesn't support RAW ESC/POS well)
            // Method C: Using WriteAllBytes directly to a USB port (requires identifying USB001/2/3)

            // We use a universal PowerShell Command to write raw bytes to the printer handle
            const psCommand = `"$bytes = [System.IO.File]::ReadAllBytes('${tempFile.replace(/'/g, "''")}'); $printer = '${printerPath.replace(/'/g, "''")}'; [System.IO.File]::WriteAllBytes('\\\\localhost\\'+$printer, $bytes)"`;
            
            exec(`powershell -Command ${psCommand}`, (error, stdout, stderr) => {
                if (error) {
                    logger.error(`🚨 PRINTER ERROR: ${error.message}`);
                    // Fallback to simpler 'copy' if shared
                    exec(`copy /b "${tempFile}" "\\\\localhost\\${printerPath}"`);
                }
                // Cleanup
                setTimeout(() => fs.unlinkSync(tempFile), 2000);
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
