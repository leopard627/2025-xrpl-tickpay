import { Client, Wallet, Transaction } from 'xrpl';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ADMIN_SEED = process.env.ADMIN_SEED;
const XRPL_SERVER = process.env.NEXT_PUBLIC_XRPL_SERVER || 'wss://s.devnet.rippletest.net:51233';

// Use the new IssuanceID we just created
const ISSUANCE_ID = "TEST_MPTOKEN_ISSUANCE_ID_PLACEHOLDER";

if (!ADMIN_SEED) {
  throw new Error('ADMIN_SEED is required in environment variables');
}

async function authorizeHolder(holderAddress: string) {
  const client = new Client(XRPL_SERVER);

  try {
    await client.connect();
    console.log('✅ Connected to XRPL devnet');

    const admin = Wallet.fromSeed(ADMIN_SEED);
    console.log('🔑 Admin wallet:', admin.address);
    console.log('👤 Holder address:', holderAddress);
    console.log('🆔 IssuanceID:', ISSUANCE_ID);

    // MPToken Authorization Transaction
    const tx: Transaction = {
      TransactionType: "MPTokenAuthorize",
      Account: admin.address,        // Admin authorizes
      MPTokenIssuanceID: ISSUANCE_ID,
      Holder: holderAddress         // User to be authorized
    };

    console.log('\n🔐 Authorizing holder...');
    console.log('Transaction:', tx);

    const prepared = await client.autofill(tx);
    const signed = admin.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    console.log('\n📋 Transaction Result:');
    console.log('Status:', result.result.meta?.TransactionResult);
    console.log('Hash:', result.result.hash);

    if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
      console.log('\n✅ Holder authorized successfully!');
      console.log(`🎫 ${holderAddress} can now receive MPTokens for IssuanceID: ${ISSUANCE_ID}`);
    } else {
      console.log('❌ Authorization failed:', result.result.meta?.TransactionResult);
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
  // Use a test holder address (you can change this)
  const testHolderAddress = process.argv[2] || 'rDEVELOPMENT_TEST_HOLDER_ADDRESS';
  authorizeHolder(testHolderAddress).catch(console.error);
}

export { authorizeHolder };