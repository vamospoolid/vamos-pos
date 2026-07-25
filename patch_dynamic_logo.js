const { Client } = require('ssh2');
const conn = new Client();

const config = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
    readyTimeout: 30000
};

conn.on('ready', () => {
    console.log('✅ SSH Connected! Mem-patch kode untuk Fitur Logo & Nama Dinamis...');
    
    const cmd = `
        echo "1. Memperbarui schema.prisma backend..."
        sed -i '/qrisImageUrl/a \\  logoUrl             String?' /var/www/vamosdemo/vamos-pos-backend/prisma/schema.prisma
        
        echo "2. Menerapkan perubahan schema ke database demo..."
        cd /var/www/vamosdemo/vamos-pos-backend
        npx prisma db push --accept-data-loss
        npx prisma generate
        
        echo "3. Memperbarui venue.service.ts backend..."
        sed -i '/qrisImageUrl?: string;/a \\        logoUrl?: string;' /var/www/vamosdemo/vamos-pos-backend/src/modules/venues/venue.service.ts
        
        echo "4. Build ulang backend..."
        npm run build
        pm2 restart vamosdemo-backend
        
        echo "5. Memperbarui Settings.tsx & App.tsx Frontend..."
        cd /var/www/vamosdemo/vamos-pos-frontend
        
        # Patch Settings.tsx (form fields & image upload logic)
        sed -i 's/qrisImageUrl: '\\'''\\',/qrisImageUrl: '\\'''\\',\\n        logoUrl: '\\'''\\',/' src/Settings.tsx
        sed -i 's/qrisImageUrl: serpongVenue.qrisImageUrl || '\\'''\\',/qrisImageUrl: serpongVenue.qrisImageUrl || '\\'''\\',\\n                    logoUrl: serpongVenue.logoUrl || '\\'''\\',/' src/Settings.tsx
        sed -i "s/type: 'splash' | 'qris' = 'splash'/type: 'splash' | 'qris' | 'logo' = 'splash'/" src/Settings.tsx
        sed -i "s/} else {/\} else if (type === 'qris') \{/" src/Settings.tsx
        sed -i "/setVenueForm({ ...venueForm, qrisImageUrl/a \\            } else {\\n                setVenueForm({ ...venueForm, logoUrl: reader.result as string });" src/Settings.tsx
        
        # Insert Sidebar Logo UI block in Settings.tsx
        sed -i '/<label className="block text-\\[10px\\] font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">Splash Screen Logo<\\/label>/i \\
                                <div className="p-4 bg-[#111] border border-[#222] rounded-xl">\\
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">Sidebar Mini Logo</label>\\
                                    <div className="flex items-center gap-4">\\
                                        <div className="w-16 h-16 rounded-lg bg-[#0a0a0a] border border-[#222] overflow-hidden flex items-center justify-center">\\
                                            {venueForm.logoUrl ? (\\
                                                <img src={venueForm.logoUrl} alt="Logo" className="w-full h-full object-contain" />\\
                                            ) : (\\
                                                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">\\
                                                    <Plus className="w-5 h-5 text-green-500" />\\
                                                </div>\\
                                            )}\\
                                        </div>\\
                                        <div className="flex-1">\\
                                            <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, '"'logo'"')} />\\
                                            <label htmlFor="logo-upload" className="inline-block px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-500 text-[9px] font-bold rounded cursor-pointer hover:bg-green-500 hover:text-white transition-all uppercase tracking-widest">{venueForm.logoUrl ? '"'Ganti Logo'"' : '"'Upload Logo'"'}</label>\\
                                            {venueForm.logoUrl && (<button onClick={() => setVenueForm({ ...venueForm, logoUrl: '"''"' })} className="ml-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-500 text-[9px] font-bold rounded hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest">Hapus</button>)}\\
                                            <p className="text-[8px] text-gray-600 mt-2 font-medium italic">* Recommend: SVG atau PNG transparan untuk pojok kiri atas.</p>\\
                                        </div>\\
                                    </div>\\
                                </div>' src/Settings.tsx
                                
        # Patch App.tsx (Dynamic Sidebar & WhatsApp Status Title)
        # Using block replace for the sidebar
        sed -i 's/<VamosLogo className="w-10 h-10" glowing \\/>/{venueConfig?.logoUrl ? (<img src={venueConfig.logoUrl} alt="Logo" className="w-10 h-10 object-contain" \\/>) : (<VamosLogo className="w-10 h-10" glowing \\/>)}/g' src/App.tsx
        sed -i 's/<div>/\\<div className="flex-1 min-w-0"\\>/g' src/App.tsx
        sed -i 's/<span className="text-lg font-black tracking-widest text-white">VAMOS POOL<\\/span>/<span className="text-lg font-black tracking-widest text-white truncate block">{venueConfig?.name?.toUpperCase() || '"'VAMOS POOL'"'}<\\/span>/g' src/App.tsx
        sed -i 's/<p className="text-\\[9px\\] text-gray-600 uppercase tracking-widest font-bold">Billiard Management<\\/p>/<p className="text-\\[9px\\] text-gray-600 uppercase tracking-widest font-bold truncate">Billiard Management<\\/p>/g' src/App.tsx
        sed -i 's/🎱 \\*VAMOS POOL - LIVE STATUS\\* 🎱/🎱 \\*{venueConfig?.name?.toUpperCase() || '\\''VAMOS POOL'\\'} - LIVE STATUS\\* 🎱/' src/App.tsx
        
        echo "6. Build Frontend..."
        npm run build
        
        echo "🎉 SELESAI! Fitur logo & nama dinamis sudah diimplementasikan di Server VPS."
    `;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect(config);
