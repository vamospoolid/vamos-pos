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

/**
 * GET /api/relay/scan
 * Daftar semua COM port yang terdeteksi di sistem — tanpa mengubah koneksi.
 */
export const scanPorts = catchAsync(async (req: Request, res: Response) => {
    const ports = await RelayService.scanPorts();
    res.json({
        success: true,
        count: ports.length,
        ports,
    });
});

/**
 * POST /api/relay/reconnect
 * Putuskan koneksi lama, lalu jalankan auto-detect ulang ke semua COM port.
 * Hasil port yang berhasil otomatis disimpan ke database.
 */
export const reconnect = catchAsync(async (req: Request, res: Response) => {
    const result = await RelayService.reconnect();
    await AuditService.log(
        (req as any).user?.id,
        'RELAY_RECONNECT',
        'System',
        { result }
    );
    res.json({ success: result.success, port: result.port, message: result.message });
});
