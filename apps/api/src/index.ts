import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { intentRoutes } from './routes/intents';
import { channelRoutes } from './routes/channels';
import { claimRoutes } from './routes/claims';
import { settlementRoutes } from './routes/settlements';
import { receiptRoutes } from './routes/receipts';

dotenv.config();

const app = express();
const logger = createLogger();
const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/intents', intentRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/receipts', receiptRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`TickPay API Server running on port ${PORT}`);
});