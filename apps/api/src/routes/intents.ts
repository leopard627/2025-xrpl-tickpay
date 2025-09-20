import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger();

router.post('/', [
  body('intent').isObject(),
  body('buyer').isString().notEmpty(),
  body('signature').isString().notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { intent, buyer, signature } = req.body;

  logger.info('Creating intent', { intentId: intent.intent_id, buyer });

  res.json({
    success: true,
    intent_id: intent.intent_id,
    created_at: new Date().toISOString()
  });
});

router.get('/:intentId', (req, res) => {
  const { intentId } = req.params;

  const mockIntent = {
    intent_id: intentId,
    price: 0.02,
    caps: {
      per_hour: 5.00,
      per_day: 30.00
    },
    sla: {
      latency_ms: 120,
      error_rate: 0.5
    },
    violation: {
      action: 'pause',
      penalty: 0.10
    },
    allow: {
      recipients: ['rProv1...'],
      assets: ['RLUSD']
    },
    valid_until: '2025-12-31T23:59:59Z',
    created_at: '2025-01-14T10:00:00Z'
  };

  res.json(mockIntent);
});

export { router as intentRoutes };