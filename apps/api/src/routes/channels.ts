import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger();

router.post('/open', [
  body('buyer').isString().notEmpty(),
  body('provider').isString().notEmpty(),
  body('capacity_xrp').isString().notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { buyer, provider, capacity_xrp } = req.body;

  logger.info('Channel open request', { buyer, provider, capacity_xrp });

  const channelCreateTx = {
    TransactionType: 'PaymentChannelCreate',
    Account: buyer,
    Amount: (parseFloat(capacity_xrp) * 1000000).toString(),
    Destination: provider,
    SettleDelay: 60,
    PublicKey: 'ED' + '0'.repeat(64),
    CancelAfter: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
    SourceTag: 1001,
    DestinationTag: 9001
  };

  res.json({
    success: true,
    transaction: channelCreateTx,
    instructions: 'Sign and submit this transaction to create the payment channel'
  });
});

router.get('/:channelId', (req, res) => {
  const { channelId } = req.params;

  const mockChannel = {
    id: channelId,
    buyer_addr: 'rBuyer...',
    provider_addr: 'rProv1...',
    capacity_xrp: '25.000000',
    balance_xrp: '0.000000',
    open_tx: 'A3F2B1C8...',
    status: 'open',
    created_at: '2025-01-14T09:00:00Z'
  };

  res.json(mockChannel);
});

export { router as channelRoutes };