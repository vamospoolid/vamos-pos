import { execSync } from 'child_process';

/**
 * Gets the unique Hardware ID (BIOS UUID) of the current machine.
 * Currently supports Windows using wmic.
 */
export const getHardwareId = (): string => {
  try {
    if (process.platform === 'win32') {
      const output = execSync('wmic csproduct get uuid').toString();
      const lines = output.split('\n');
      if (lines.length >= 2) {
        const uuid = lines[1].trim();
        if (uuid && uuid !== '00000000-0000-0000-0000-000000000000') {
          return uuid;
        }
      }
    }
    
    // Fallback/Generic (could be improved for Linux/macOS if needed)
    return 'GENERIC-HWID-' + process.env.COMPUTERNAME || 'UNKNOWN';
  } catch (error) {
    console.error('Failed to get hardware ID:', error);
    return 'ERROR-HWID';
  }
};
