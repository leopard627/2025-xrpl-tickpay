import { Client, Wallet, Transaction } from 'xrpl';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ADMIN_SEED = process.env.ADMIN_SEED;
const XRPL_SERVER = process.env.NEXT_PUBLIC_XRPL_SERVER || 'wss://s.devnet.rippletest.net:51233';

// Use the new IssuanceID we just created
const ISSUANCE_ID = "005E2BD89899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5";

if (!ADMIN_SEED) {
  throw new Error('ADMIN_SEED is required in environment variables');
}

async function sendMPToken(recipientAddress: string, amount: string) {
  const client = new Client(XRPL_SERVER);

  try {
    await client.connect();
    console.log('✅ Connected to XRPL devnet');

    const admin = Wallet.fromSeed(ADMIN_SEED);
    console.log('🔑 Admin wallet:', admin.address);
    console.log('👤 Recipient address:', recipientAddress);
    console.log('🆔 IssuanceID:', ISSUANCE_ID);
    console.log('💰 Amount:', amount);

    // MPToken Payment Transaction
    const tx: Transaction = {
      TransactionType: "Payment",
      Account: admin.address,        // Admin sends tokens
      Destination: recipientAddress, // User receives tokens
      Amount: {
        mpt_issuance_id: ISSUANCE_ID,
        value: amount
      }
    };

    console.log('\n💸 Sending MPTokens...');
    console.log('Transaction:', tx);

    const prepared = await client.autofill(tx);
    const signed = admin.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    console.log('\n📋 Transaction Result:');
    console.log('Status:', result.result.meta?.TransactionResult);
    console.log('Hash:', result.result.hash);

    if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
      console.log('\n✅ MPToken transfer successful!');
      console.log(`🎫 Sent ${amount} MPTokens to ${recipientAddress}`);
      console.log(`🆔 IssuanceID: ${ISSUANCE_ID}`);
    } else {
      console.log('❌ Transfer failed:', result.result.meta?.TransactionResult);
    }

    return result;

  } catch (error) {
    console.error('💥 Error:', error);
    throw error;
  } finally {
    await client.disconnect();
    console.log('🔌 Disconnected from XRPL');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const recipientAddress = process.argv[2];
  const amount = process.argv[3] || '100';

  if (!recipientAddress) {
    console.error('❌ Please provide recipient address: npx tsx sendMPToken.ts <RECIPIENT_ADDRESS> [AMOUNT]');
    console.log('💡 Example: npx tsx sendMPToken.ts rG1... 100');
    process.exit(1);
  }

  sendMPToken(recipientAddress, amount).catch(console.error);
}

export { sendMPToken };