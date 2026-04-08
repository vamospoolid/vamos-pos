import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer';
import { logger } from '../../utils/logger';
import path from 'path';
import fs from 'fs';

export class PrintService {
    static async printReceipt(data: any) {
        try {
            const printerInterface = data.venue?.printerPath || 'RP58 Printer';
            logger.info(`🔍 [PRINT_DEBUG] Menyiapkan printer: ${printerInterface}`);

            const printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: printerInterface, // No 'printer:' prefix to avoid driver error
                characterSet: CharacterSet.PC437_USA,
                removeSpecialCharacters: false,
                lineCharacter: "=",
                width: 32,
            });

            // Note: We skip isPrinterConnected() because we use Windows Shared Printer bypassing driver checks
            // const isConnected = await printer.isPrinterConnected();
            // if (!isConnected) {
            //     logger.error(`❌ [PRINT_DEBUG] Printer "${printerInterface}" TIDAK ditemukan. Silakan cek kabel atau penulisan nama printer di Settings.`);
            //     return { success: false, message: 'Printer not connected' };
            // }
            logger.info(`✅ [PRINT_DEBUG] Menyiapkan data struk untuk: ${printerInterface}...`);

            // --- START PRINTING ---
            // Set tighter line spacing (most 58mm thermal printers support this)
            // 30 is usually the tightest readable
            // printer.setLineSpacing(30); 

            printer.alignCenter();
            printer.setTextNormal();
            printer.println(data.venue?.name?.toUpperCase() || 'VAMOS POOL & CAFE');
            printer.println(data.venue?.address || 'Billiard & Cafe');
            printer.println("-".repeat(32));

            printer.alignLeft();
            const dateStr = new Date(data.paidAt || Date.now()).toLocaleString('id-ID', { 
                day: '2-digit', month: '2-digit', year: '2-digit', 
                hour: '2-digit', minute: '2-digit' 
            });
            
            printer.println(`TGL: ${dateStr}`);
            printer.println(`BIL: #${(data.id || '').substring(0, 6).toUpperCase()} | MEJA: ${data.table?.name || '-'}`);
            if (data.member?.name) printer.println(`MEM: ${data.member.name.toUpperCase()}`);
            printer.println("-".repeat(32));

            // Session
            if (data.tableAmount > 0) {
                const mins = data.totalMinutes || 0;
                const hrs = Math.floor(mins / 60);
                const rem = mins % 60;
                printer.println(`Billiard (${hrs}h ${rem}m)`);
                printer.alignRight();
                printer.println(`Rp ${data.tableAmount.toLocaleString()}`);
                printer.alignLeft();
            }

            // Orders
            if (data.orders && data.orders.length > 0) {
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
            printer.tableCustom([
                { text: "TOTAL", align: "LEFT", width: 0.4 },
                { text: `Rp ${(data.finalAmount || 0).toLocaleString()}`, align: "RIGHT", width: 0.6 }
            ]);
            printer.println("-".repeat(32));

            // Payment Detail
            const change = Math.max(0, (data.receivedAmount || 0) - (data.finalAmount || 0));
            printer.println(`BAYAR  : ${data.method || 'CASH'}`);
            if (data.receivedAmount > 0) {
                printer.println(`TUNAI  : Rp ${data.receivedAmount.toLocaleString()}`);
                printer.println(`KEMBALI: Rp ${change.toLocaleString()}`);
            }

            printer.println("-".repeat(32));
            printer.alignCenter();
            printer.println("TERIMA KASIH!");
            printer.println("VAMOSPOOL.ID");
            
            // Cut and Feed
            printer.cut();
            
            const buffer = printer.getBuffer();
            const tempFile = path.join(process.cwd(), 'receipt.bin');
            const { execSync } = await import('child_process');
            
            fs.writeFileSync(tempFile, buffer);
            
            const shareName = data.venue?.printerPath === 'RP58 Printer' ? 'RP58' : data.venue?.printerPath;
            const computerName = process.env.COMPUTERNAME || '127.0.0.1';
            const networkPath = `\\\\${computerName}\\${shareName}`;
            
            logger.info(`✅ [PRINT_DEBUG] Mengirim data raw ke shared printer: ${networkPath}...`);
            
            try {
                // Command sakti Windows untuk kirim raw bytes ke printer shared
                execSync(`copy /b "${tempFile}" "${networkPath}"`);
                logger.info(`✨ [PRINT_DEBUG] Sukses! Kertas harusnya sudah keluar.`);
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                return { success: true };
            } catch (cmdErr: any) {
                logger.error(`❌ [PRINT_DEBUG] Gagal copy ke jaringan lokal. Error: ${cmdErr.message}`);
                
                // Fallback: LPT1 / USB direct mapping
                try {
                    logger.warn(`⚠️ Mencoba mem-print via print command bawaan Windows...`);
                    // Using print command which is native to windows for raw files
                    execSync(`print /D:"${networkPath}" "${tempFile}"`);
                    logger.info(`✨ [PRINT_DEBUG] Sukses via Fallback Print Command!`);
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    return { success: true };
                } catch (printErr: any) {
                     logger.error(`❌ [PRINT_DEBUG] Gagal menggunakan print command: ${printErr.message}`);
                     throw new Error(`Gagal cetak ke jaringan. Pastikan printer di-share dengan nama ${shareName}`);
                }
            }
        } catch (error: any) {
            logger.error(`❌ [PRINT_DEBUG] Gagal total: ${error.message}`);
            throw error;
        }
    }
}
