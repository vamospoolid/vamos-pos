import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer';
import { logger } from '../../utils/logger';
import path from 'path';
import fs from 'fs';

export class PrintService {
    static async printReceipt(data: any) {
        try {
            const printerInterface = `printer:${data.venue?.printerPath || 'RP58 Printer'}`;
            logger.info(`🔍 [PRINT_DEBUG] Mencoba cetak ke: ${printerInterface}`);

            const printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: printerInterface,
                characterSet: CharacterSet.PC437_USA,
                removeSpecialCharacters: false,
                lineCharacter: "=",
                width: 32,
            });

            const isConnected = await printer.isPrinterConnected();
            if (!isConnected) {
                logger.error(`❌ [PRINT_DEBUG] Printer "${printerInterface}" TIDAK ditemukan. Silakan cek kabel atau penulisan nama printer di Settings.`);
                return { success: false, message: 'Printer not connected' };
            }
            logger.info(`✅ [PRINT_DEBUG] Printer Terdeteksi! Memulai pencetakan...`);

            // --- START PRINTING ---
            printer.alignCenter();
            printer.setTextSize(1, 1);
            printer.println(data.venue?.name || 'VAMOS POOL & CAFE');
            printer.setTextNormal();
            printer.println(data.venue?.address || 'Billiard & Cafe');
            printer.println("-".repeat(32));

            printer.alignLeft();
            printer.println(`Date: ${new Date(data.paidAt || Date.now()).toLocaleString('id-ID')}`);
            printer.println(`Bill: #${(data.id || '').substring(0, 8).toUpperCase()}`);
            printer.println(`Table: ${data.table?.name || '-'}`);
            if (data.member?.name) printer.println(`Mem: ${data.member.name}`);
            printer.println("-".repeat(32));

            // Session
            if (data.tableAmount > 0) {
                printer.println("Billiard / Table Session");
                const mins = data.totalMinutes || 0;
                const hrs = Math.floor(mins / 60);
                const rem = mins % 60;
                printer.tableCustom([
                    { text: `${hrs}h ${rem}m`, align: "LEFT", width: 0.5 },
                    { text: `Rp ${data.tableAmount.toLocaleString()}`, align: "RIGHT", width: 0.5 }
                ]);
            }

            // Orders
            if (data.orders && data.orders.length > 0) {
                if (data.tableAmount > 0) printer.println("");
                printer.println("Orders:");
                data.orders.forEach((o: any) => {
                    const name = o.product?.name || 'Item';
                    printer.println(`${name} x${o.quantity}`);
                    printer.alignRight();
                    printer.println(`Rp ${(o.total || 0).toLocaleString()}`);
                    printer.alignLeft();
                });
            }

            printer.println("-".repeat(32));

            // Totals
            printer.tableCustom([
                { text: "SUBTOTAL", align: "LEFT", width: 0.5 },
                { text: `Rp ${(data.totalAmount || data.finalAmount || 0).toLocaleString()}`, align: "RIGHT", width: 0.5 }
            ]);

            if (data.discount > 0) {
                printer.tableCustom([
                    { text: "DISCOUNT", align: "LEFT", width: 0.5 },
                    { text: `-Rp ${data.discount.toLocaleString()}`, align: "RIGHT", width: 0.5 }
                ]);
            }

            printer.drawLine();
            printer.setTextSize(1, 1);
            printer.tableCustom([
                { text: "TOTAL", align: "LEFT", width: 0.4 },
                { text: `Rp ${(data.finalAmount || 0).toLocaleString()}`, align: "RIGHT", width: 0.6 }
            ]);
            printer.setTextNormal();
            printer.println("-".repeat(32));

            // Payment
            printer.println(`Payment: ${data.method || 'CASH'}`);
            if (data.receivedAmount > 0) {
                printer.println(`Cash: Rp ${data.receivedAmount.toLocaleString()}`);
                printer.println(`Change: Rp ${Math.max(0, data.receivedAmount - (data.finalAmount || 0)).toLocaleString()}`);
            }

            printer.println("-".repeat(32));
            printer.alignCenter();
            printer.println("Terima kasih telah berkunjung!");
            printer.println("Powered by VamosPOS");
            
            // Cut and Feed
            printer.cut();
            
            const buffer = printer.getBuffer();
            const tempFile = path.join(process.cwd(), 'receipt.bin');
            const { execSync } = await import('child_process');
            
            fs.writeFileSync(tempFile, buffer);
            
            const shareName = data.venue?.printerPath === 'RP58 Printer' ? 'RP58' : data.venue?.printerPath;
            logger.info(`✅ [PRINT_DEBUG] Mengirim data raw ke shared printer: \\\\localhost\\${shareName}...`);
            
            try {
                // Command sakti Windows untuk kirim raw bytes ke printer shared
                execSync(`copy /b "${tempFile}" "\\\\localhost\\${shareName}"`);
                logger.info(`✨ [PRINT_DEBUG] Sukses! Kertas harusnya sudah keluar.`);
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                return { success: true };
            } catch (cmdErr: any) {
                logger.warn(`⚠️ Jalur Shared gagal, mencoba jalur Out-Printer (PowerShell)...`);
                execSync(`powershell -Command "Get-Content '${tempFile}' | Out-Printer -Name '${data.venue?.printerPath || 'RP58 Printer'}'"`);
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                return { success: true };
            }
        } catch (error: any) {
            logger.error(`❌ [PRINT_DEBUG] Gagal total: ${error.message}`);
            throw error;
        }
    }
}
