import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { logger } from './utils/logger';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'
});
app.use(limiter);

import path from 'path';
import { waService } from './modules/whatsapp/wa.service';
import { WaTemplateService } from './modules/whatsapp/wa.template.service';

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

// Initialize WA Service
waService.initialize();

// Seed default WA templates if not yet created
WaTemplateService.ensureDefaults().catch(e => logger.error('WaTemplate seed error:', e));

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
// Jalankan sekali saat server start — bersihkan meja stuck dari restart sebelumnya
// lalu jadwalkan setiap 5 menit secara otomatis.
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

// Jadwalkan setiap 5 menit
setInterval(runFixStuckTables, 5 * 60 * 1000);
// ─────────────────────────────────────────────────────────────────────────

// ── AUTO END EXPIRED SESSIONS ─────────────────────────────────────────────
// Sesi yang beli paket (prepaid) otomatis mati jika durasi habis.
// Cek setiap 60 detik.
const runAutoExpireSessions = async () => {
    try {
        const { SessionService } = await import('./modules/sessions/session.service');
        await SessionService.checkExpiredSessions();
    } catch (err: any) {
        logger.error(`❌ runAutoExpireSessions gagal: ${err.message}`);
    }
};
setTimeout(runAutoExpireSessions, 5000);  // 5 detik setelah start
setInterval(runAutoExpireSessions, 60 * 1000); // Setiap 60 detik
// ─────────────────────────────────────────────────────────────────────────

// ── AUTO EXPIRE WAITLIST (PENALTY NO-SHOW) ──────────────────────────────
// Cek antrian yang sudah lewat 30 menit dan berikan denda poin.
const runWaitlistCheck = async () => {
    try {
        const { WaitlistService } = await import('./modules/waitlist/waitlist.service');
        await WaitlistService.checkExpiredWaitlist();
    } catch (err: any) {
        logger.error(`❌ runWaitlistCheck gagal: ${err.message}`);
    }
};
setTimeout(runWaitlistCheck, 15000); // 15 detik setelah start
setInterval(runWaitlistCheck, 10 * 60 * 1000); // Setiap 10 menit
// ─────────────────────────────────────────────────────────────────────────

// ── AUDIT LOG CLEANUP ────────────────────────────────────────────────────
// Hapus log lebih dari 90 hari agar tabel tidak terus membengkak.
// Jalankan sekali saat start, lalu setiap 24 jam.
const runAuditCleanup = async () => {
    try {
        const { AuditService } = await import('./modules/audit/audit.service');
        await AuditService.cleanupOldLogs(90);
    } catch (err: any) {
        logger.error(`❌ AuditLog cleanup gagal: ${err.message}`);
    }
};

setTimeout(runAuditCleanup, 10000);                   // 10 detik setelah start
setInterval(runAuditCleanup, 24 * 60 * 60 * 1000);   // Setiap 24 jam
// ─────────────────────────────────────────────────────────────────────────

// ── MONTHLY DATABASE BACKUP ──────────────────────────────────────────────
// Strategi: cek setiap jam apakah hari ini tanggal 1 dan belum ada backup
// hari ini. Lebih reliable dari setInterval 30 hari karena tahan restart.
const runMonthlyBackup = async () => {
    try {
        const now = new Date();
        // Hanya jalankan di tanggal 1 setiap bulan, antara jam 02:00–03:00
        if (now.getDate() !== 1 || now.getHours() !== 2) return;

        const { BackupService } = await import('./utils/backup.service');

        // Cek apakah backup hari ini sudah ada (hindari backup ganda)
        const existing = BackupService.listBackups();
        const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const alreadyDone = existing.some(b => b.name.includes(todayStr));
        if (alreadyDone) return;

        logger.info('📅 Monthly backup terjadwal — menjalankan pg_dump...');
        const result = await BackupService.runBackup();

        if (result.success) {
            logger.info(`✅ Monthly backup selesai: ${result.file}`);
        } else {
            logger.error(`❌ Monthly backup gagal: ${result.message}`);
        }
    } catch (err: any) {
        logger.error(`❌ Monthly backup error: ${err.message}`);
    }
};

// Cek setiap jam (bukan setiap bulan) agar tahan restart server
setInterval(runMonthlyBackup, 60 * 60 * 1000);   // setiap 1 jam
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


