import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer';
import { logger } from '../../utils/logger';

export class PrintService {
    static async printReceipt(data: any) {
        try {
            // Standard config for 58mm thermal printers (Usually RP58)
            const printer = new ThermalPrinter({
                type: PrinterTypes.EPSON, // HaoYin usually Epson compatible
                interface: 'printer:RP58 Printer', // Use the name from Windows Settings
                characterSet: CharacterSet.PC437_USA,
                removeSpecialCharacters: false,
                lineCharacter: "=",
                width: 32, // Standard for 58mm is 32 columns
            });

            const isConnected = await printer.isPrinterConnected();
            if (!isConnected) {
                logger.error('❌ Printer RP58 Printer tidak ditemukan atau mati.');
                return { success: false, message: 'Printer not connected' };
            }

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
            
            await printer.execute();
            return { success: true };
        } catch (error: any) {
            logger.error('❌ Print Error:', error.message);
            return { success: false, error: error.message };
        }
    }
}
