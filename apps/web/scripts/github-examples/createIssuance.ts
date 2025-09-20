import { Client, Wallet, Transaction } from 'xrpl';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ADMIN_SEED = process.env.ADMIN_SEED;
const XRPL_SERVER = process.env.NEXT_PUBLIC_XRPL_SERVER || 'wss://s.devnet.rippletest.net:51233';

if (!ADMIN_SEED) {
  throw new Error('ADMIN_SEED is required in environment variables');
}

async function createMPTokenIssuance() {
  const client = new Client(XRPL_SERVER);

  try {
    await client.connect();
    console.log('✅ Connected to XRPL devnet');

    const admin = Wallet.fromSeed(ADMIN_SEED);
    console.log('🔑 Admin wallet:', admin.address);

    // MPToken Issuance Create Transaction
    const tx: Transaction = {
      TransactionType: "MPTokenIssuanceCreate",
      Account: admin.address,
      AssetScale: 0,                    // No decimal places
      MaximumAmount: "1000000000",      // Maximum amount that can be issued
      Flags: 0                          // No special flags
    };

    console.log('🎫 Creating MPToken issuance...');
    console.log('Transaction:', tx);

    const prepared = await client.autofill(tx);
    const signed = admin.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    console.log('\n📋 Transaction Result:');
    console.log('Status:', result.result.meta?.TransactionResult);
    console.log('Hash:', result.result.hash);

    if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
      // Extract IssuanceID from transaction metadata
      const meta = result.result.meta;
      console.log('\n✅ MPToken Issuance Created Successfully!');

      // Extract IssuanceID from metadata
      const issuanceId = (meta as any).mpt_issuance_id;
      if (issuanceId) {
        console.log('🆔 New IssuanceID:', issuanceId);
        console.log('\n📝 Add this to your .env.local:');
        console.log(`NEW_MPTOKEN_ISSUANCE_ID=${issuanceId}`);
      } else {
        console.log('⚠️ IssuanceID not found in metadata');
        console.log('🔍 Full metadata:', JSON.stringify(meta, null, 2));
      }
    } else {
      console.log('❌ Transaction failed:', result.result.meta?.TransactionResult);
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await client.disconnect();
    console.log('🔌 Disconnected from XRPL');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createMPTokenIssuance().catch(console.error);
}

export { createMPTokenIssuance };