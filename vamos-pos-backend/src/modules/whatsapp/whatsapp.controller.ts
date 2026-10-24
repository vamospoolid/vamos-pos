import { Request, Response } from 'express';
import { waService } from './wa.service';
import { WaTemplateService } from './wa.template.service';

export const getStatus = (req: Request, res: Response) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                isReady: waService.isReady,
                hasQr: !!waService.latestQr,
                isInitializing: waService.isInitializing
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getQr = (req: Request, res: Response) => {
    try {
        if (waService.isReady) {
            return res.status(200).json({ success: true, data: { qr: null, message: 'WhatsApp already connected' } });
        }
        // latestQr sekarang sudah berupa base64 PNG data URL (dari Baileys + qrcode library)
        res.status(200).json({ success: true, data: { qr: waService.latestQr || null, isDataUrl: true } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const reset = async (req: Request, res: Response) => {
    try {
        await waService.resetSession();
        res.status(200).json({ success: true, message: 'WhatsApp session reset initiated' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sendTest = async (req: Request, res: Response) => {
    try {
        const { phone, message } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Nomor telepon wajib diisi' });
        }
        if (!waService.isReady) {
            return res.status(400).json({ success: false, message: 'WhatsApp gateway belum terhubung. Silakan scan QR terlebih dahulu.' });
        }
        const text = message || 'Halo! Ini pesan tes dari Vamos POS WhatsApp Gateway.';
        const sent = await waService.sendMessage(phone, text);
        if (sent) {
            res.json({ success: true, message: `Pesan tes berhasil dikirim ke ${phone}` });
        } else {
            res.status(500).json({ success: false, message: 'Gagal mengirim pesan. Pastikan nomor valid.' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Template endpoints ─────────────────────────────────────────────────────

export const getTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await WaTemplateService.getAll();
        res.json({ success: true, data: templates });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { body, imageUrl, isActive } = req.body;
        const updated = await WaTemplateService.update(id, body, imageUrl, isActive ?? true);
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const resetTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const reset = await WaTemplateService.resetToDefault(id);
        res.json({ success: true, data: reset });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
