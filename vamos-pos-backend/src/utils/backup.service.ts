import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

const execAsync = promisify(exec);

// ── Folder penyimpanan backup ─────────────────────────────────────────────────
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const KEEP_MONTHS = 6;   // simpan backup 6 bulan terakhir

// Pastikan folder backups/ ada
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// ── Parse DATABASE_URL → credential terpisah ─────────────────────────────────
interface DbCredentials {
    host: string;
    port: string;
    user: string;
    password: string;
    database: string;
}

function parseDbUrl(url: string): DbCredentials | null {
    try {
        // Format: postgresql://user:password@host:port/database?schema=public
        const match = url.match(
            /postgresql?:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/([^?]+)/
        );
        if (!match) return null;
        return {
            user: match[1],
            password: match[2],
            host: match[3],
            port: match[4],
            database: match[5],
        };
    } catch {
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────

export class BackupService {

    /**
     * Jalankan pg_dump dan simpan ke file .sql di folder backups/.
     * Nama file: backup-YYYY-MM-DD_HH-mm.sql
     *
     * Return: path file backup yang dibuat, atau null jika gagal.
     */
    static async runBackup(): Promise<{ success: boolean; file: string | null; message: string }> {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            const msg = 'DATABASE_URL tidak ditemukan di environment variables.';
            logger.error(`❌ Backup gagal: ${msg}`);
            return { success: false, file: null, message: msg };
        }

        const creds = parseDbUrl(dbUrl);
        if (!creds) {
            const msg = 'Format DATABASE_URL tidak valid, tidak bisa parse credentials.';
            logger.error(`❌ Backup gagal: ${msg}`);
            return { success: false, file: null, message: msg };
        }

        // Format nama file dengan tanggal + jam agar tidak overwrite
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
        const fileName = `backup-${dateStr}.sql`;
        const filePath = path.join(BACKUP_DIR, fileName);

        // pg_dump command — PGPASSWORD di-set via env agar tidak perlu file .pgpass
        const pgDumpCmd = [
            `set PGPASSWORD=${creds.password}`,          // Windows: set env dulu
            `&&`,
            `pg_dump`,
            `-h ${creds.host}`,
            `-p ${creds.port}`,
            `-U ${creds.user}`,
            `-d ${creds.database}`,
            `--no-password`,
            `--format=plain`,
            `--encoding=UTF8`,
            `-f "${filePath}"`,
        ].join(' ');

        logger.info(`💾 Memulai backup database → ${fileName} ...`);

        try {
            await execAsync(pgDumpCmd, {
                timeout: 5 * 60 * 1000,   // timeout 5 menit
                shell: 'cmd.exe',          // Windows shell
            });

            const stat = fs.statSync(filePath);
            const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
            logger.info(`✅ Backup selesai: ${fileName} (${sizeMB} MB)`);

            // Cleanup backup lama
            await BackupService.cleanupOldBackups();

            return {
                success: true,
                file: fileName,
                message: `Backup berhasil: ${fileName} (${sizeMB} MB)`,
            };

        } catch (err: any) {
            const errMsg = err.stderr || err.message || 'Unknown error';
            logger.error(`❌ Backup gagal: ${errMsg}`);

            // Hapus file kosong/rusak jika ada
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (_) { }
            }

            return {
                success: false,
                file: null,
                message: `Backup gagal: ${errMsg}`,
            };
        }
    }

    /**
     * Hapus file backup yang lebih tua dari KEEP_MONTHS bulan.
     * Hanya hapus file dengan pola backup-*.sql
     */
    static async cleanupOldBackups(): Promise<number> {
        try {
            const files = fs.readdirSync(BACKUP_DIR)
                .filter(f => f.startsWith('backup-') && f.endsWith('.sql'));

            const cutoff = new Date();
            cutoff.setMonth(cutoff.getMonth() - KEEP_MONTHS);

            let deleted = 0;
            for (const file of files) {
                const filePath = path.join(BACKUP_DIR, file);
                const stat = fs.statSync(filePath);
                if (stat.mtime < cutoff) {
                    fs.unlinkSync(filePath);
                    deleted++;
                    logger.info(`🗑️ Backup lama dihapus: ${file}`);
                }
            }

            return deleted;
        } catch (err: any) {
            logger.warn(`⚠️ Cleanup backup gagal: ${err.message}`);
            return 0;
        }
    }

    /**
     * Daftar semua file backup yang ada, diurutkan dari terbaru.
     */
    static listBackups(): { name: string; sizeMB: string; createdAt: Date }[] {
        try {
            const files = fs.readdirSync(BACKUP_DIR)
                .filter(f => f.startsWith('backup-') && f.endsWith('.sql'));

            return files
                .map(name => {
                    const stat = fs.statSync(path.join(BACKUP_DIR, name));
                    return {
                        name,
                        sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
                        createdAt: stat.mtime,
                    };
                })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } catch {
            return [];
        }
    }
}
