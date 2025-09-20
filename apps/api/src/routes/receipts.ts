import { Router } from 'express';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger();

router.get('/:receiptId', (req, res) => {
  const { receiptId } = req.params;

  logger.info('Receipt requested', { receiptId });

  const mockReceipt = {
    id: receiptId,
    channel_id: '5DB1A4C7...',
    claim_cum_drops: '2400000',
    claim_tx: 'A3F2B1C8...',
    convert_payment_tx: 'D7E9F2A1...',
    merkle_root: '8C4A9E2F...',
    rlusd_delivered: '1.250000',
    created_at: '2025-01-14T10:30:42Z',
    verification: {
      xrpl_explorer_claim: `https://devnet.xrpl.org/transactions/A3F2B1C8...`,
      xrpl_explorer_payment: `https://devnet.xrpl.org/transactions/D7E9F2A1...`,
      oracle_claims_hash: '8C4A9E2F...'
    }
  };

  res.json(mockReceipt);
});

router.get('/', (req, res) => {
  const { buyer, provider, from_date, to_date } = req.query;

  logger.info('Receipts list requested', { buyer, provider, from_date, to_date });

  const mockReceipts = [
    {
      id: 'rcpt_2025_001',
      channel_id: '5DB1A4C7...',
      buyer_addr: 'rBuyer...',
      provider_addr: 'rProv1...',
      rlusd_delivered: '1.20',
      xrp_claimed: '2.400000',
      created_at: '2025-01-14T10:30:42Z',
      status: 'completed'
    },
    {
      id: 'rcpt_2025_002',
      channel_id: '5DB1A4C7...',
      buyer_addr: 'rBuyer...',
      provider_addr: 'rProv1...',
      rlusd_delivered: '0.80',
      xrp_claimed: '1.600000',
      created_at: '2025-01-14T09:15:33Z',
      status: 'completed'
    }
  ];

  res.json({
    receipts: mockReceipts,
    total_count: mockReceipts.length,
    total_rlusd: mockReceipts.reduce((sum, r) => sum + parseFloat(r.rlusd_delivered), 0).toFixed(6),
    total_xrp: mockReceipts.reduce((sum, r) => sum + parseFloat(r.xrp_claimed), 0).toFixed(6)
  });
});

export { router as receiptRoutes };