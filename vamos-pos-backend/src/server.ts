import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { logger } from './utils/logger';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,  // Increased for local development
    skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'
});
app.use(limiter);

import { waService } from './modules/whatsapp/wa.service';
import { WaTemplateService } from './modules/whatsapp/wa.template.service';

app.use('/api', routes);

app.use(errorHandler);

// Initialize WA Service
waService.initialize();

// Seed default WA templates if not yet created
WaTemplateService.ensureDefaults().catch(e => logger.error('WaTemplate seed error:', e));

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [HEARTBEAT-${Date.now()}]`);
});

// Tuning untuk performa lebih baik
server.keepAliveTimeout = 5000;
server.headersTimeout = 6000;

const shutdown = (signal: string) => {
    logger.info(`${signal} received: closing HTTP server`);
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
    // Force exit jika tidak close dalam 3 detik
    setTimeout(() => process.exit(0), 3000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

