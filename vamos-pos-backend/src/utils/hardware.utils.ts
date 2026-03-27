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
      // Look for a line that isn't empty, isn't the header, and isn't the generic 0000...
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && 
            trimmed.toUpperCase() !== 'UUID' && 
            trimmed !== '00000000-0000-0000-0000-000000000000' &&
            trimmed.length > 5) { // Ensure it's not some random debris
          return trimmed;
        }
      }
    }
    
    // Fallback based on OS info + hostname
    const fallback = `${process.platform}-${process.arch}-${process.env.COMPUTERNAME || 'NODE-MACHINE'}`.replace(/\s+/g, '-').toUpperCase();
    return fallback;
  } catch (error) {
    console.error('Failed to get hardware ID:', error);
    return 'MACHINE-' + (process.env.COMPUTERNAME || 'UNKNOWN');
  }
};
