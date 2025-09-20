import { Client } from 'xrpl';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const XRPL_SERVER = process.env.NEXT_PUBLIC_XRPL_SERVER || 'wss://s.devnet.rippletest.net:51233';
const ISSUANCE_ID = "005E2BD89899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5";

async function checkMPTokenAuth(userAddress: string) {
  const client = new Client(XRPL_SERVER);

  try {
    await client.connect();
    console.log('✅ Connected to XRPL devnet');
    console.log('👤 User address:', userAddress);
    console.log('🆔 IssuanceID:', ISSUANCE_ID);

    // Check MPToken issuance info
    console.log('\n🔍 Checking MPToken issuance...');
    try {
      const issuanceInfo = await client.request({
        command: 'ledger_entry',
        mpt_issuance_id: ISSUANCE_ID
      });
      console.log('MPToken Issuance Info:', JSON.stringify(issuanceInfo, null, 2));
    } catch (error) {
      console.log('❌ Could not get issuance info:', error);
    }

    // Check user's MPToken objects
    console.log('\n🔍 Checking user MPToken objects...');
    try {
      const userObjects = await client.request({
        command: 'account_objects',
        account: userAddress,
        type: 'mpt'
      });
      console.log('User MPToken Objects:', JSON.stringify(userObjects, null, 2));
    } catch (error) {
      console.log('❌ Could not get user objects:', error);
    }

    // Check account info
    console.log('\n🔍 Checking user account info...');
    try {
      const accountInfo = await client.request({
        command: 'account_info',
        account: userAddress
      });
      console.log('User Account Info:', JSON.stringify(accountInfo, null, 2));
    } catch (error) {
      console.log('❌ Could not get account info:', error);
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
  const userAddress = process.argv[2];

  if (!userAddress) {
    console.error('❌ Please provide user address: npx tsx checkMPTokenAuth.ts <USER_ADDRESS>');
    process.exit(1);
  }

  checkMPTokenAuth(userAddress).catch(console.error);
}

export { checkMPTokenAuth };