/**
 * Timezone utilities to handle differences between VPS (typically UTC)
 * and cashier computers (local Indonesian timezone: WIB UTC+7, WITA UTC+8, or WIT UTC+9).
 */

import { prisma } from '../database/db';
import { logger } from './logger';

// In-memory cache so every call does NOT hit the DB
let _cachedOffsetMs: number | null = null;

// ─── DB initialiser (call once at startup, VPS only) ─────────────────────────

/**
 * Reads `timezoneOffset` from the first active Venue record and caches it.
 * Safe to call multiple times — re-reads on each call to pick up venue edits.
 */
export const initializeTimezoneFromVenue = async (): Promise<void> => {
    if (process.env.IS_LOCAL_ELECTRON === 'true') return; // local mode: always uses system clock
    try {
        const venue = await prisma.venue.findFirst({ where: { deletedAt: null } });
        if (venue != null && typeof venue.timezoneOffset === 'number') {
            _cachedOffsetMs = venue.timezoneOffset * 60 * 60 * 1000;
            logger.info(`🕐 [Timezone] Venue timezone loaded: UTC+${venue.timezoneOffset} (${_cachedOffsetMs / 3600000}h)`);
        }
    } catch (err: any) {
        logger.warn(`⚠️ [Timezone] Could not read venue timezone from DB, using env fallback. ${err.message}`);
    }
};

/**
 * Call this after the admin saves Venue settings so the cache is immediately updated.
 */
export const refreshTimezoneCache = async (): Promise<void> => {
    _cachedOffsetMs = null;          // Clear cache
    await initializeTimezoneFromVenue(); // Re-read from DB
};

// ─── Accessors ────────────────────────────────────────────────────────────────

/**
 * Returns the timezone offset in milliseconds.
 *
 * - Local Electron (cashier PC): uses the PC's actual OS timezone offset (live, no caching)
 * - VPS / cloud:                 uses the cached value from Venue.timezoneOffset in the DB
 *   Fallback: VENUE_TIMEZONE env var → 8 (WITA) if nothing else is available
 */
export const getTimezoneOffsetMs = (): number => {
    if (process.env.IS_LOCAL_ELECTRON === 'true') {
        return -new Date().getTimezoneOffset() * 60 * 1000;
    }
    
    if (_cachedOffsetMs !== null) return _cachedOffsetMs;

    const tz = parseFloat(process.env.VENUE_TIMEZONE || '8');
    return (isNaN(tz) ? 8 : tz) * 60 * 60 * 1000;
};

/**
 * Returns the timezone offset in hours.
 */
export const getTimezoneOffsetHours = (): number => {
    return getTimezoneOffsetMs() / (60 * 60 * 1000);
};
