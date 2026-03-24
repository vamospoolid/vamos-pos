import winston from 'winston';
import path from 'path';
import fs from 'fs';

// ── Pastikan folder logs/ ada sebelum winston menulis ────────────────────────
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// ── Format untuk file: timestamp lengkap + JSON ──────────────────────────────
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),   // sertakan stack trace jika ada Error
    winston.format.json()
);

// ── Format untuk console: ringkas dan berwarna ───────────────────────────────
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level}: ${message}`;
    })
);

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        // ── Console (selalu aktif) ───────────────────────────────────────────
        new winston.transports.Console({
            format: consoleFormat,
        }),

        // ── File: error saja → logs/error.log ───────────────────────────────
        // Rotasi otomatis: max 10MB per file, simpan 14 file terakhir (~140MB max)
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 10 * 1024 * 1024,   // 10 MB
            maxFiles: 14,
            tailable: true,
        }),

        // ── File: semua level → logs/combined.log ───────────────────────────
        // Rotasi otomatis: max 20MB per file, simpan 7 file terakhir (~140MB max)
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: fileFormat,
            maxsize: 20 * 1024 * 1024,   // 20 MB
            maxFiles: 7,
            tailable: true,
        }),
    ],

    // Jangan crash jika logger sendiri error (misal disk penuh)
    exitOnError: false,
});

// ── Helper: log event hardware dengan format khusus ──────────────────────────
export const hardwareLogger = {
    relay: (msg: string) => logger.info(`[RELAY] ${msg}`),
    relayError: (msg: string) => logger.error(`[RELAY] ${msg}`),
    wa: (msg: string) => logger.info(`[WA] ${msg}`),
    waError: (msg: string) => logger.error(`[WA] ${msg}`),
};
