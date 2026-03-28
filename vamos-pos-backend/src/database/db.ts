import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// --- PKG / BUNDLE INITIALIZATION ---
// Detect if running as a pkg bundle to handle external files correctly
const isPkg = (process as any).pkg;
const execDir = isPkg ? path.dirname(process.execPath) : process.cwd();

// When running as a bundled EXE (cashier machine), always enforce Smart Bridge mode.
// This disables SyncWorker, SessionService, etc. regardless of how the EXE is launched.
if (isPkg && !process.env.IS_LOCAL_ELECTRON) {
    process.env.IS_LOCAL_ELECTRON = 'true';
}

// Load .env from the physical directory where the EXE is located
const envPath = path.join(execDir, '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config(); // Fallback to current working directory
}

// Set Prisma Engine path if it exists locally as a child of the EXE
if (isPkg) {
    const enginePath = path.join(execDir, 'query_engine-windows.dll.node');
    if (fs.existsSync(enginePath)) {
        process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath;
    }
}
// --- END PKG INITIALIZATION ---

export const prisma = new PrismaClient({
    datasources: {
        db: { url: process.env.DATABASE_URL },
    },
    log: process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
});
