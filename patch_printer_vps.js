const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '173.212.243.240', port: 22, username: 'root', password: 'Ahmad_dcc07', readyTimeout: 30000 };

conn.on('ready', () => {
    console.log('✅ SSH Connected! Mem-patch Fitur Ukuran Kertas Printer ke VPS...\n');
    
    const cmd = `
        echo "1. Patching Backend Production (/var/www/vamos/vamos-pos-backend)..."
        cd /var/www/vamos/vamos-pos-backend
        
        # Tambah schema.prisma
        sed -i '/printerPath         String/a \\  printerWidth        Int       @default(32)' prisma/schema.prisma
        npx prisma db push --accept-data-loss
        npx prisma generate
        
        # Tambah parameter di venue.service.ts
        sed -i '/printerPath?: string;/a \\        printerWidth?: number;' src/modules/venues/venue.service.ts
        
        # Update print.service.ts untuk dinamik lebar
        sed -i 's/const printerInterface = data.venue?.printerPath || '"'"'RP58 Printer'"'"';/const printerInterface = data.venue?.printerPath || '"'"'RP58 Printer'"'"';\\n            const width = data.venue?.printerWidth || 32;/' src/modules/print/print.service.ts
        sed -i 's/width: 32,/width: width,/' src/modules/print/print.service.ts
        sed -i 's/printer.println("-".repeat(32));/printer.println("-".repeat(width));/g' src/modules/print/print.service.ts
        
        npm run build
        pm2 restart vamos-backend
        
        echo "2. Patching Frontend Production (/var/www/vamos/vamos-pos-frontend)..."
        cd /var/www/vamos/vamos-pos-frontend
        
        # Tambah state dan parameter
        sed -i "s/printerPath: 'RP58 Printer',/printerPath: 'RP58 Printer',\\n        printerWidth: 32,/" src/Settings.tsx
        sed -i "s/printerPath: serpongVenue.printerPath || '',/printerPath: serpongVenue.printerPath || '',\\n                    printerWidth: serpongVenue.printerWidth ?? 32,/" src/Settings.tsx
        
        # Tambah UI Dropdown Printer Width
        sed -i '/<input type="text" value={venueForm.printerPath}/!b;n;a\\
                                <div>\\
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Printer Paper Width</label>\\
                                    <select value={venueForm.printerWidth} onChange={e => setVenueForm({ ...venueForm, printerWidth: Number(e.target.value) })} className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00ff66] transition-colors text-white">\\
                                        <option value={32}>Kertas 58mm (32 Karakter) - Standar</option>\\
                                        <option value={48}>Kertas 80mm (48 Karakter) - Lebar</option>\\
                                        <option value={42}>Kertas 80mm (42 Karakter) - Medium</option>\\
                                    </select>\\
                                </div>' src/Settings.tsx
        
        npm run build
        
        echo "🎉 SELESAI! Opsi Printer 80mm sudah ditambahkan ke VPS Production."
    `;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect(config);
