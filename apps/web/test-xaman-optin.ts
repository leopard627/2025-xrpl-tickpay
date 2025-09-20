import { createSimpleMPTokenManager } from './src/lib/xrpl-mptoken-simple.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testXamanOptInFlow() {
  console.log('🧪 Testing Xaman opt-in flow with server API...');

  const adminSeed = process.env.ADMIN_SEED || process.env.NEXT_PUBLIC_ADMIN_SEED;
  if (!adminSeed) {
    console.error('❌ ADMIN_SEED not found in environment');
    return;
  }

  console.log('🔑 Using ADMIN wallet:', adminSeed.substring(0, 10) + '...');

  const manager = createSimpleMPTokenManager(adminSeed);

  // Test user address - using a different account than ADMIN for testing
  const testUserAddress = 'rDEVELOPMENT_TEST_USER_ADDRESS'; // For testing - dummy address

  console.log('👤 Test user address:', testUserAddress);
  console.log('🎫 Testing with Netflix Basic subscription...');

  try {
    const result = await manager.sendMPTokenToUser(
      testUserAddress,
      'netflix',
      'basic',
      1
    );

    console.log('📋 Result:', result);

    if (result.requiresUserOptIn && result.xamanOptIn) {
      console.log('✅ Xaman opt-in request created successfully!');
      console.log('🆔 UUID:', result.xamanOptIn.uuid);
      console.log('📱 QR Code URL:', result.xamanOptIn.qrCode);
      console.log('🔗 Deep Link:', result.xamanOptIn.deepLink);

      // Test status check
      console.log('\n🔍 Testing status check...');
      const statusResponse = await fetch(`http://localhost:3001/api/mptoken/optin/status/${result.xamanOptIn.uuid}`);
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        console.log('📊 Status:', status);
      }
    } else if (result.success) {
      console.log('✅ MPToken sent successfully!');
      console.log('🆔 Token ID:', result.tokenId);
      console.log('🔗 Tx Hash:', result.txHash);
    } else {
      console.log('❌ Failed:', result.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testXamanOptInFlow().catch(console.error);