import { Client, Wallet, Transaction } from 'xrpl';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const XRPL_SERVER = process.env.NEXT_PUBLIC_XRPL_SERVER || 'wss://s.devnet.rippletest.net:51233';

// Use the new IssuanceID we just created
const ISSUANCE_ID = "005E2BD89899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5";

async function userOptIn(userSeed: string) {
  const client = new Client(XRPL_SERVER);

  try {
    await client.connect();
    console.log('✅ Connected to XRPL devnet');

    const user = Wallet.fromSeed(userSeed);
    console.log('👤 User wallet:', user.address);
    console.log('🆔 IssuanceID:', ISSUANCE_ID);

    // User MPToken Authorization Transaction (Opt-in)
    const tx: Transaction = {
      TransactionType: "MPTokenAuthorize",
      Account: user.address,         // User opts in
      MPTokenIssuanceID: ISSUANCE_ID
    };

    console.log('\n🔐 User opting in to MPToken...');
    console.log('Transaction:', tx);

    const prepared = await client.autofill(tx);
    const signed = user.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    console.log('\n📋 Transaction Result:');
    console.log('Status:', result.result.meta?.TransactionResult);
    console.log('Hash:', result.result.hash);

    if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
      console.log('\n✅ User opt-in successful!');
      console.log(`🎫 ${user.address} has opted in to receive MPTokens for IssuanceID: ${ISSUANCE_ID}`);
      console.log('\n🔄 Now run: npx tsx scripts/github-examples/authorizeHolder.ts', user.address);
    } else {
      console.log('❌ Opt-in failed:', result.result.meta?.TransactionResult);
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
  const userSeed = process.argv[2];
  if (!userSeed) {
    console.error('❌ Please provide user seed: npx tsx userOptIn.ts <USER_SEED>');
    console.log('💡 Example: npx tsx userOptIn.ts sEd7...');
    process.exit(1);
  }
  userOptIn(userSeed).catch(console.error);
}

export { userOptIn };