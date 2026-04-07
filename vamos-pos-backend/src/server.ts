// db.ts sudah menangani dotenv dan Prisma engine config saat pertama diimpor
import './database/db'; // Pastikan db init berjalan sebelum routes
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { logger } from './utils/logger';
import { RelayService } from './modules/relay/relay.service';
import { getCloudSocket, getLastCloudError } from './socket';

// --- PKG NATIVE MODULES WORKAROUND ---
// Memaksa pkg untuk membundel dan men-extract file .node yang dibutuhkan serialport
// Ini memperbaiki bug CRASH saat app portable (vamous-pos.exe) dijalankan.
if ((process as any).pkg) {
    try {
        require('@serialport/bindings-cpp/prebuilds/win32-x64/@serialport+bindings-cpp.node');
        console.log('✅ SerialPort native binding loaded OK (SNAPSHOT)');
    } catch (e) {
        try {
            const path = require('path');
            const externalDir = path.dirname(process.execPath);
            const externalPath = path.join(externalDir, '@serialport+bindings-cpp.node');
            require(externalPath);
            console.log('✅ SerialPort native binding loaded OK (EXTERNAL):', externalPath);
        } catch (e2) {
            console.error('❌ ALL FAILED: SerialPort native binding missing!', (e2 as any).message);
        }
    }
}


const isLocalBridge = !!process.env.IS_LOCAL_ELECTRON;
if (isLocalBridge) {
    // Non-blocking initialization to ensure UI is never blocked by hardware
    import('./modules/system/bridge.service').then(({ BridgeService }) => {
        try {
            BridgeService.init();
        } catch (e) {
            logger.error('⚠️ BRIDGE INIT ERROR (Non-blocking):', (e as any).message);
        }
    });
}
logger.info('🚀 SYSTEM STARTING: Access First mode active. Hardware scanning in background.');
const app = express();

app.use(helmet({
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false, // MATIKAN pemblokiran lintas domain secara total
}));

// Improved CORS for Local Bridge & Cloud UI Synergy
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://pos.vamospool.id',
            'https://app.vamospool.id',
            'http://pos.local'
        ];
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(ao => origin.includes(ao.replace('https://', '').replace('http://', '')))) {
            callback(null, true);
        } else {
            callback(null, true); // Permissive for local hardware synergy
        }
    },
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Format 'combined' terlalu verbose di production — pakai 'tiny' agar overhead minimal
const morganFormat = process.env.NODE_ENV === 'production' ? 'tiny' : 'combined';
app.use(morgan(morganFormat, { stream: { write: message => logger.info(message.trim()) } }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'
});
app.use(limiter);

// Dynamic imports for heavy services
// import { waService } from './modules/whatsapp/wa.service';
// import { WaTemplateService } from './modules/whatsapp/wa.template.service';

// API Routes
app.use('/api', routes);

// Diagnostic Route for Hardware Bridge
app.get('/api/system/bridge-status', (req, res) => {
    const cloudSocket = getCloudSocket();
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        relay: RelayService.getStatus(),
        vps: {
            url: process.env.CLOUD_BASE_URL || 'https://pos.vamospool.id',
            isConnected: cloudSocket?.connected || false,
            socketId: cloudSocket?.id || null,
            lastError: getLastCloudError()
        },
        env: {
            IS_LOCAL_ELECTRON: process.env.IS_LOCAL_ELECTRON,
            NODE_ENV: process.env.NODE_ENV
        }
    });
});

// Serve Frontend Static Files (Unified Build)
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));
app.use('/uploads', express.static(path.join(publicPath, 'uploads')));

// Handle SPA routing (redirect all non-api to index.html)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.use(errorHandler);

// Initialize WA Service (VPS ONLY)
if (!isLocalBridge) {
    try {
        // Gunakan eval-require agar pkg tidak melacak dependensi ini di lokal
        const waMod = eval('require("./modules/whatsapp/wa.service")');
        const templateMod = eval('require("./modules/whatsapp/wa.template.service")');
        
        waMod.waService.initialize();
        templateMod.WaTemplateService.ensureDefaults().catch((e: any) => logger.error('WaTemplate seed error:', e));
    } catch (e: any) {
        logger.error('❌ Terjadi kesalahan saat memuat layanan WhatsApp (VPS ONLY):', e.message);
    }
}

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [HEARTBEAT-${Date.now()}]`);
});

import { initSocket } from './socket';
initSocket(server);

// Tuning untuk performa lebih baik
server.keepAliveTimeout = 5000;
server.headersTimeout = 6000;

// ── AUTO FIX STUCK TABLES ────────────────────────────────────────────────
// PENTING: Jangan jalankan di Smart Bridge (IS_LOCAL_ELECTRON) karena DB lokal
// tidak menyimpan data sesi — semua sesi ada di VPS. Jika dijalankan, ia akan
// melihat semua meja PLAYING sebagai "stuck" (tidak ada sesi lokal) dan mereset
// seluruh meja ke AVAILABLE, membatalkan semua transaksi yang sedang berjalan!
const runFixStuckTables = async () => {
    // Guard: HANYA jalankan di VPS, TIDAK di mesin kasir lokal
    if (isLocalBridge) {
        logger.info('⏭️ fixStuckTables: Dilewati (Smart Bridge mode — sesi ada di VPS).');
        return;
    }
    try {
        const { TableService } = await import('./modules/tables/table.service');
        const result = await TableService.fixStuckTables();
        if (result.fixed > 0) {
            logger.warn(
                `🔧 Auto-fix: ${result.fixed} meja stuck direset → [${result.tableNames.join(', ')}] | ` +
                `Relay OFF: ch[${result.relayOff.join(', ')}]` +
                (result.relayErrors.length > 0 ? ` | ⚠️ Relay errors: ${result.relayErrors.length}` : '')
            );
        }
    } catch (err: any) {
        logger.error(`❌ runFixStuckTables gagal: ${err.message}`);
    }
};

// Jalankan sekali saat start (delay 3 detik agar DB & relay siap)
// Di Smart Bridge mode, fungsi akan langsung return tanpa efek
setTimeout(runFixStuckTables, 3000);

// ── BACKGROUND SERVICES (DI VPS SAJA) ────────────────────────────────────

if (!isLocalBridge || process.env.NODE_ENV === 'development') {
    logger.info('⚙️ Starting Background Services (Local Dev/VPS)...');

    // 1. Auto-fix stuck tables (setiap 5 menit)
    setInterval(runFixStuckTables, 5 * 60 * 1000);

    // 2. Auto end expired sessions (setiap 1 menit)
    const runAutoExpireSessions = async () => {
        try {
            const { SessionService } = await import('./modules/sessions/session.service');
            await SessionService.checkExpiredSessions();
        } catch (err: any) {
            logger.error(`❌ runAutoExpireSessions gagal: ${err.message}`);
        }
    };
    setTimeout(runAutoExpireSessions, 5000);
    setInterval(runAutoExpireSessions, 15 * 1000);

    // 3. Auto expire waitlist (setiap 10 menit)
    const runWaitlistCheck = async () => {
        try {
            const { WaitlistService } = await import('./modules/waitlist/waitlist.service');
            await WaitlistService.checkExpiredWaitlist();
        } catch (err: any) {
            logger.error(`❌ runWaitlistCheck gagal: ${err.message}`);
        }
    };
    setTimeout(runWaitlistCheck, 15000);
    setInterval(runWaitlistCheck, 10 * 60 * 1000);

    // 4. Audit Log Cleanup (setiap 24 jam)
    const runAuditCleanup = async () => {
        try {
            const { AuditService } = await import('./modules/audit/audit.service');
            await AuditService.cleanupOldLogs(90);
        } catch (err: any) {
            logger.error(`❌ AuditLog cleanup gagal: ${err.message}`);
        }
    };
    setTimeout(runAuditCleanup, 10000);
    setInterval(runAuditCleanup, 24 * 60 * 60 * 1000);

    // 5. Monthly Database Backup (setiap jam 2 pagi tgl 1)
    const runMonthlyBackup = async () => {
        try {
            const now = new Date();
            if (now.getDate() !== 1 || now.getHours() !== 2) return;
            const { BackupService } = await import('./utils/backup.service');
            const existing = BackupService.listBackups();
            const todayStr = now.toISOString().slice(0, 10);
            const alreadyDone = existing.some(b => b.name.includes(todayStr));
            if (alreadyDone) return;
            const result = await BackupService.runBackup();
            if (result.success) logger.info(`✅ Monthly backup selesai: ${result.file}`);
        } catch (err: any) {
            logger.error(`❌ Monthly backup error: ${err.message}`);
        }
    };
    setInterval(runMonthlyBackup, 60 * 60 * 1000);

    // 6. Local-First Sync Worker (ambil data dari POS lokal)
    import('./modules/system/sync.service').then(({ SyncService }) => {
        SyncService.startBackgroundSync();
    });
} else {
    logger.info('⚡ BRIDGE MODE: Socket listener enabled for cloud commands.');
    
    // Start Sync Worker even in bridge mode to push local transactions to VPS
    import('./modules/system/sync.service').then(({ SyncService }) => {
        SyncService.startBackgroundSync();
    });
}
// ─────────────────────────────────────────────────────────────────────────

const shutdown = (signal: string) => {
    logger.info(`${signal} received: closing HTTP server`);
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
    // Force exit jika tidak close dalam 3 detik
    setTimeout(() => process.exit(0), 3000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));


