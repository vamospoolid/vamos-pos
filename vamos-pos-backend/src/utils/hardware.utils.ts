import { execSync } from 'child_process';

/**
 * Gets the unique Hardware ID (BIOS UUID) of the current machine.
 * Currently supports Windows using wmic.
 */
export const getHardwareId = (): string => {
  try {
    if (process.platform === 'win32') {
      // Try wmic first (Windows 10 and older)
      let output = '';
      try {
        output = execSync('wmic csproduct get uuid', { timeout: 3000 }).toString();
      } catch (_wmicErr) {
        // wmic deprecated/removed on Windows 11 — fall back to PowerShell
        try {
          output = execSync(
            'powershell -NoProfile -Command "(Get-WmiObject Win32_ComputerSystemProduct).UUID"',
            { timeout: 5000 }
          ).toString();
        } catch (_psErr) {
          output = '';
        }
      }

      const lines = output.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed &&
            trimmed.toUpperCase() !== 'UUID' &&
            trimmed !== '00000000-0000-0000-0000-000000000000' &&
            trimmed.length > 5) {
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
