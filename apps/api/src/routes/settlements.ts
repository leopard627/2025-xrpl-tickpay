import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger();

router.post('/', [
  body('channel_id').isString().notEmpty(),
  body('cumulative_drops').isString().notEmpty(),
  body('convert_to').equals('RLUSD'),
  body('issuer').isString().notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { channel_id, cumulative_drops, convert_to, issuer } = req.body;

  logger.info('Settlement request', { channel_id, cumulative_drops, convert_to });

  const claimTx = {
    TransactionType: 'PaymentChannelClaim',
    Account: 'rProv1...',
    Channel: channel_id,
    Balance: cumulative_drops,
    Amount: cumulative_drops,
    PublicKey: 'ED' + '0'.repeat(64),
    Signature: '3045' + '0'.repeat(140),
    Flags: 0
  };

  const paymentTx = {
    TransactionType: 'Payment',
    Account: 'rProv1...',
    Amount: {
      currency: 'RLUSD',
      issuer: issuer,
      value: (parseInt(cumulative_drops) / 1000000 / 1.92).toFixed(6)
    },
    Destination: 'rProv1...',
    SendMax: cumulative_drops,
    Flags: 131072
  };

  res.json({
    success: true,
    settlement_id: `settle_${Date.now()}`,
    claim_transaction: claimTx,
    payment_transaction: paymentTx,
    estimated_rlusd: (parseInt(cumulative_drops) / 1000000 / 1.92).toFixed(6)
  });
});

export { router as settlementRoutes };