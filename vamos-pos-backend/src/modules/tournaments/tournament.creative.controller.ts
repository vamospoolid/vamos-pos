import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { TournamentCreativeService } from './tournament.creative.service';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/errors';


/**
 * Generate tournament prompt and social media copy
 */
export const generateTournamentPromo = catchAsync(async (req: AuthRequest, res: Response) => {
    const { name, prizePool, prizes, entryFee, rules, style, date, venue } = req.body;

    if (!name || prizePool === undefined || entryFee === undefined) {
        throw new AppError('Data turnamen tidak lengkap. Nama, Total Hadiah, dan Biaya Masuk wajib diisi.', 400);
    }

    const result = await TournamentCreativeService.generatePromoPack({
        name,
        prizePool: Number(prizePool),
        prizes: prizes || 'Sesuai regulasi turnamen',
        entryFee: Number(entryFee),
        rules: rules || 'Single Elimination',
        style: style || 'Cyberpunk Neon',
        date: date || 'Segera Diumumkan',
        venue: venue || 'Vamos Pool & Cafe'
    });

    res.status(200).json({
        status: 'success',
        data: result
    });
});

/**
 * Analyze user uploaded image (coffee, venue) to generate copywriting
 */
export const analyzePromoImage = catchAsync(async (req: AuthRequest, res: Response) => {
    const file = req.file;
    const { briefText } = req.body;

    if (!file) {
        throw new AppError('Tidak ada file gambar yang diunggah.', 400);
    }

    if (!briefText) {
        throw new AppError('Brief teks promosi wajib diisi.', 400);
    }

    const result = await TournamentCreativeService.analyzeImagePromo(
        file.buffer,
        file.mimetype,
        briefText
    );

    res.status(200).json({
        status: 'success',
        data: result
    });
});
