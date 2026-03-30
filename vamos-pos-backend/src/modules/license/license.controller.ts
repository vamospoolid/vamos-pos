import { Request, Response } from 'express';
import { LicenseService } from './license.service';

const licenseService = new LicenseService();

export class LicenseController {
  private getActiveHwid = async (): Promise<string | undefined> => {
    const isVPS = process.env.NODE_ENV === 'production' && !process.env.IS_LOCAL_ELECTRON;
    if (isVPS) {
       const { getLatestBridgeStatus } = await import('../../socket');
       const bridgeStatus = getLatestBridgeStatus();
       return bridgeStatus?.hardwareId;
    }
    return undefined;
  }

  getStatus = async (req: Request, res: Response) => {
    try {
      const hwid = await this.getActiveHwid();
      const status = await licenseService.getStatus(hwid);
      res.json({ success: true, data: status });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  activate = async (req: Request, res: Response) => {
    try {
      const { licenseKey } = req.body;
      if (!licenseKey) {
        return res.status(400).json({ success: false, message: 'License key is required.' });
      }

      const hwid = await this.getActiveHwid();
      const license = await licenseService.activate(licenseKey, hwid);
      res.json({ success: true, message: 'Activation successful.', data: license });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  requestDemo = async (req: Request, res: Response) => {
    try {
      const hwid = await this.getActiveHwid();
      const license = await licenseService.requestDemo(hwid);
      res.json({ success: true, message: 'Trial activated for 24 hours.', data: license });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
