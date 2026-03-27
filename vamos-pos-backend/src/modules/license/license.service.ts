import { PrismaClient } from '@prisma/client';
import { getHardwareId } from '../../utils/hardware.utils';

const prisma = new PrismaClient();
const MASTER_KEY = 'Ahmad_dcc07';

export class LicenseService {
  async getStatus() {
    const hwid = getHardwareId();
    let license = null;
    
    try {
      license = await prisma.license.findUnique({
        where: { hardwareId: hwid }
      });
    } catch (err) {
      console.error('Database connection failed in getStatus, returning raw hwid.');
    }

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

  async activate(key: string) {
    const hwid = getHardwareId();

    // Check if machine already has a license
    const existingMachineLicense = await prisma.license.findUnique({
      where: { hardwareId: hwid }
    });

    if (existingMachineLicense && existingMachineLicense.isActivated) {
      throw new Error('This machine is already activated.');
    }

    // Special Master Key Logic
    if (key.trim().toUpperCase() === MASTER_KEY.toUpperCase()) {
      // If master key is used, we create/update a dedicated master license for this machine
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

    // Regular Key Logic
    const license = await prisma.license.findUnique({
      where: { licenseKey: key }
    });

    if (!license) {
      throw new Error('Invalid license key.');
    }

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

  async requestDemo() {
    const hwid = getHardwareId();

    // Check if machine already has any license
    const existing = await prisma.license.findUnique({
      where: { hardwareId: hwid }
    });

    if (existing) {
      if (existing.isActivated && !existing.licenseKey.startsWith('DEMO-')) {
        throw new Error('This machine already has a full license.');
      }
      throw new Error('Trial has already been requested or used on this machine.');
    }

    // Grant 24h trial
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

  async verify() {
    const hwid = getHardwareId();
    const license = await prisma.license.findUnique({
      where: { hardwareId: hwid }
    });

    if (!license || !license.isActivated || !license.isActive) {
      return false;
    }

    // Check expiry
    if (license.expiresAt && new Date() > license.expiresAt) {
      return false;
    }

    return true;
  }
}
