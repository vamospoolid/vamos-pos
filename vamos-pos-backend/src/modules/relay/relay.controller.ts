import { Request, Response } from 'express';
import { RelayService } from './relay.service';
import { AuditService } from '../audit/audit.service';
import { catchAsync } from '../../utils/catchAsync';

export const turnOn = catchAsync(async (req: Request, res: Response) => {
    const { channel } = req.body;
    const success = await RelayService.sendCommand(channel, 'on');
    await AuditService.log((req as any).user?.id, 'RELAY_ON', 'Table', { channel, success });
    res.json({ success, channel, command: 'on' });
});

export const turnOff = catchAsync(async (req: Request, res: Response) => {
    const { channel } = req.body;
    const success = await RelayService.sendCommand(channel, 'off');
    await AuditService.log((req as any).user?.id, 'RELAY_OFF', 'Table', { channel, success });
    res.json({ success, channel, command: 'off' });
});

export const getStatus = catchAsync(async (req: Request, res: Response) => {
    const status = RelayService.getStatus();
    res.json({ success: true, data: status });
});
