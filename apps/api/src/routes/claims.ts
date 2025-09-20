import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger();

router.post('/ingest', [
  body('jwt').isString().notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { jwt } = req.body;

  logger.info('Ingesting usage claim', { jwt: jwt.substring(0, 50) + '...' });

  res.json({
    success: true,
    claim_id: `claim_${Date.now()}`,
    processed_at: new Date().toISOString()
  });
});

router.get('/latest/:channelId', (req, res) => {
  const { channelId } = req.params;

  const mockClaim = {
    channel_id: channelId,
    cumulative_drops: '2400000',
    oracle_jwt: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ...',
    ledger_price_src: 'XRPL-DEX:RLUSD/XRP@ledger:8A3F...',
    created_at: '2025-01-14T10:30:00Z'
  };

  res.json(mockClaim);
});

export { router as claimRoutes };