import { Request, Response } from 'express';
import { LicenseService } from './license.service';

const licenseService = new LicenseService();

export class LicenseController {
  async getStatus(req: Request, res: Response) {
    try {
      const status = await licenseService.getStatus();
      res.json({ success: true, data: status });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async activate(req: Request, res: Response) {
    try {
      const { licenseKey } = req.body;
      if (!licenseKey) {
        return res.status(400).json({ success: false, message: 'License key is required.' });
      }

      const license = await licenseService.activate(licenseKey);
      res.json({ success: true, message: 'Activation successful.', data: license });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async requestDemo(req: Request, res: Response) {
    try {
      const license = await licenseService.requestDemo();
      res.json({ success: true, message: 'Trial activated for 24 hours.', data: license });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
