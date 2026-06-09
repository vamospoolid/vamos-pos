/**
 * Timezone utilities to handle differences between VPS (typically UTC)
 * and cashier computers (local Indonesian timezone: WIB UTC+7, WITA UTC+8, or WIT UTC+9).
 */

/**
 * Returns the timezone offset in milliseconds.
 * If running in a local Electron/cashier computer environment, it uses the actual machine system timezone offset.
 * Otherwise, it falls back to process.env.VENUE_TIMEZONE or a default of +8 (Makassar/WITA).
 */
export const getTimezoneOffsetMs = (): number => {
    if (process.env.IS_LOCAL_ELECTRON === 'true') {
        return -new Date().getTimezoneOffset() * 60 * 1000;
    }
    const tz = parseFloat(process.env.VENUE_TIMEZONE || '8');
    return (isNaN(tz) ? 8 : tz) * 60 * 60 * 1000;
};

/**
 * Returns the timezone offset in hours.
 */
export const getTimezoneOffsetHours = (): number => {
    return getTimezoneOffsetMs() / (60 * 60 * 1000);
};
