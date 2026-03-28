import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// --- PKG / PRISMA ENGINE FIX ---
// If we are running from a bundled EXE, we need to point to the external Prisma engine
if ((process as any).pkg) {
    const localEnginePath = path.join(process.cwd(), 'query_engine-windows.dll.node');
    if (fs.existsSync(localEnginePath)) {
        process.env.PRISMA_QUERY_ENGINE_LIBRARY = localEnginePath;
    }
}
// --- END PKG FIX ---

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { logger } from './utils/logger';

dotenv.config();

const isLocalBridge = !!process.env.IS_LOCAL_ELECTRON;
const app = express();

app.use(helmet({
    crossOriginOpenerPolicy: false, // Prevents the COOP error shown in console
}));

// Conditional CORS to avoid duplicate headers with Nginx in production
// We disable it if the host contains vamospool.id or we are in production
app.use((req, res, next) => {
    const isProdHost = req.headers.host?.includes('vamospool.id');
    const isLocalHost = req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1');
    const isProdEnv = process.env.NODE_ENV === 'production';
    
    // If we're on the production domain, we assume Nginx adds the CORS headers.
    // Express should NOT add them to avoid the "multiple values '*, *'" error.
    if (isProdHost || (isProdEnv && !isLocalHost)) {
        if (req.method === 'OPTIONS') {
            // Some proxies still need the backend to acknowledge the OPTIONS request
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-device-id');
            return res.status(200).end();
        }
        next();
    } else {
        cors()(req, res, next);
    }
});
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

// Serve Frontend Static Files (Unified Build)
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

// Handle SPA routing (redirect all non-api to index.html)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.use(errorHandler);

// Initialize WA Service (VPS ONLY)
if (!isLocalBridge) {
    import('./modules/whatsapp/wa.service').then(({ waService }) => {
        waService.initialize();
    }).catch(e => logger.error('WA Service init error:', e));

    import('./modules/whatsapp/wa.template.service').then(({ WaTemplateService }) => {
        WaTemplateService.ensureDefaults().catch(e => logger.error('WaTemplate seed error:', e));
    });
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
// Jalankan sekali saat server start — bersihkan meja stuck dari restart sebelumnya.
// Jadwal ulang setiap 5 menit hanya di VPS.
const runFixStuckTables = async () => {
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
setTimeout(runFixStuckTables, 3000);

// ── BACKGROUND SERVICES (DI VPS SAJA) ────────────────────────────────────

if (!isLocalBridge) {
    logger.info('⚙️ Starting VPS Background Services...');

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
    setInterval(runAutoExpireSessions, 60 * 1000);

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
    logger.info('⚡ BRIDGE MODE: Background services locked (OFF) for local hardware bridge.');
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


