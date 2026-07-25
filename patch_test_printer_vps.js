const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07', readyTimeout: 30000 };

conn.on('ready', () => {
    console.log('✅ SSH Connected! Mem-patch Tombol Test Printer ke VPS...\n');
    
    const cmd = `
        echo "1. Patching Backend Production..."
        cd /var/www/vamos/vamos-pos-backend
        
        # Tambah endpoint test di system.controller.ts
        sed -i "/import { SyncService } from '.\\/sync.service';/a \\import { PrintService } from '../print/print.service';\\nimport { prisma } from '../../database/db';" src/modules/system/system.controller.ts
        
        # Insert testPrinter method
        sed -i "/static async fixTables/i \\    static async testPrinter(req: Request, res: Response) {\\n        try {\\n            const venue = await prisma.venue.findFirst();\\n            await PrintService.printReceipt({\\n                id: 'TEST-123',\\n                tableAmount: 0,\\n                totalAmount: 50000,\\n                finalAmount: 50000,\\n                discount: 0,\\n                receivedAmount: 50000,\\n                method: 'CASH',\\n                paidAt: new Date(),\\n                table: { name: 'TEST' },\\n                member: { name: 'ADMIN' },\\n                orders: [],\\n                venue: venue\\n            });\\n            return res.json({ success: true, message: 'Test print sent' });\\n        } catch (error: any) {\\n            return res.status(500).json({ success: false, message: error.message });\\n        }\\n    }\\n" src/modules/system/system.controller.ts
        
        # Update Routes
        sed -i "/router.post('\\/fix-tables'/a \\router.post('/print/test', localOrAuthenticate, SystemController.testPrinter);" src/modules/system/system.route.ts
        
        npm run build
        pm2 restart vamos-backend
        
        echo "2. Patching Frontend Production..."
        cd /var/www/vamos/vamos-pos-frontend
        
        # Tambah fungsi handleTestPrinter
        sed -i "/const handleSaveVenue = async () => {/i \\    const handleTestPrinter = async () => {\\n        try {\\n            await api.post('/system/print/test');\\n            vamosAlert('Berhasil mengirim test print ke ' + venueForm.printerPath);\\n        } catch (err: any) {\\n            vamosAlert('Gagal print: ' + (err.response?.data?.message || err.message));\\n        }\\n    };\\n" src/Settings.tsx
        
        # Ganti tombol save tunggal menjadi grid dengan tombol test
        sed -i 's/<button onClick={handleSaveVenue} className="w-full py-4 mt-2 bg-\\[#00ff66\\] text-\\[#0a0a0a\\] rounded-xl font-black text-sm hover:opacity-90 transition-all transform active:scale-95 flex items-center justify-center shadow-\\[0_0_20px_rgba(0,255,102,0.2)\\]">/<div className="grid grid-cols-2 gap-4">\\n                                    <button onClick={handleTestPrinter} className="w-full py-4 mt-2 bg-gray-800 text-white border border-gray-600 rounded-xl font-black text-sm hover:bg-gray-700 transition-all transform active:scale-95 flex items-center justify-center">\\n                                        Test Printer\\n                                    <\\/button>\\n                                    <button onClick={handleSaveVenue} className="w-full py-4 mt-2 bg-\\[#00ff66\\] text-\\[#0a0a0a\\] rounded-xl font-black text-sm hover:opacity-90 transition-all transform active:scale-95 flex items-center justify-center shadow-\\[0_0_20px_rgba(0,255,102,0.2)\\]">/g' src/Settings.tsx
        sed -i 's/<Save className="w-4 h-4 mr-2" \\/> Save Hardware Config\\n                                <\\/button>/<Save className="w-4 h-4 mr-2" \\/> Save Hardware Config\\n                                <\\/button>\\n                                <\\/div>/g' src/Settings.tsx

        npm run build
        
        echo "🎉 SELESAI! Tombol Test Printer ditambahkan ke VPS."
    `;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect(config);
