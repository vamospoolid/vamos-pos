import { getHardwareId } from '../../utils/hardware.utils';
import { prisma } from '../../database/db';

const MASTER_KEY = 'Ahmad_dcc07';

export class LicenseService {
  async getStatus(providedHwid?: string) {
    const hwid = providedHwid || getHardwareId();
    let license = null;
    
    try {
      license = await prisma.license.findUnique({
        where: { hardwareId: hwid }
      });
    } catch (err) { }

    return {
      machineId: hwid,
      isActivated: !!(license && license.isActivated && license.isActive),
      license: license ? {
        licenseKey: license.licenseKey,
        activatedAt: license.activatedAt,
        expiresAt: license.expiresAt,
        isActive: license.isActive
      } : null
    };
  }

  async activate(key: string, providedHwid?: string) {
    const hwid = providedHwid || getHardwareId();

    const existingMachineLicense = await prisma.license.findUnique({
      where: { hardwareId: hwid }
    });

    if (existingMachineLicense && existingMachineLicense.isActivated) {
      throw new Error('This machine is already activated.');
    }

    if (key.trim().toUpperCase() === MASTER_KEY.toUpperCase()) {
      return await prisma.license.upsert({
        where: { hardwareId: hwid },
        update: {
          licenseKey: `MASTER-${hwid}`,
          isActivated: true,
          activatedAt: new Date(),
          isActive: true
        },
        create: {
          licenseKey: `MASTER-${hwid}`,
          hardwareId: hwid,
          isActivated: true,
          activatedAt: new Date(),
          isActive: true
        }
      });
    }

    const license = await prisma.license.findUnique({
      where: { licenseKey: key }
    });

    if (!license) throw new Error('Invalid license key.');

    if (license.isActivated && license.hardwareId !== hwid) {
      throw new Error('This license key is already bound to another machine.');
    }

    return await prisma.license.update({
      where: { licenseKey: key },
      data: {
        hardwareId: hwid,
        isActivated: true,
        activatedAt: new Date()
      }
    });
  }

  async requestDemo(providedHwid?: string) {
    const hwid = providedHwid || getHardwareId();

    const existing = await prisma.license.findUnique({
      where: { hardwareId: hwid }
    });

    if (existing) {
      throw new Error('Trial has already been requested or used on this machine.');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return await prisma.license.create({
      data: {
        licenseKey: `DEMO-${hwid.substring(0, 8)}-${Date.now().toString().slice(-4)}`,
        hardwareId: hwid,
        isActivated: true,
        activatedAt: new Date(),
        expiresAt: expiresAt,
        isActive: true
      }
    });
  }

  async verify(providedHwid?: string) {
    const hwid = providedHwid || getHardwareId();
    const license = await prisma.license.findUnique({
      where: { hardwareId: hwid }
    });

    if (!license || !license.isActivated || !license.isActive) return false;
    if (license.expiresAt && new Date() > license.expiresAt) return false;

    return true;
  }
}
