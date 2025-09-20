// Verify wallet address matches the secret
const { Wallet } = require('xrpl');

const secrets = [
  'sDEVELOPMENT_WALLET1_SEED_PLACEHOLDER',
  'sDEVELOPMENT_WALLET2_SEED_PLACEHOLDER',
  'sDEVELOPMENT_WALLET3_SEED_PLACEHOLDER'
];

const expectedAddresses = [
  'rDEVELOPMENT_WALLET1_ADDRESS_PLACEHOLDER',
  'rDEVELOPMENT_WALLET2_ADDRESS_PLACEHOLDER',
  'rDEVELOPMENT_WALLET3_ADDRESS_PLACEHOLDER'
];

console.log('🔍 Verifying wallet credentials...\n');

secrets.forEach((secret, index) => {
  try {
    const wallet = Wallet.fromSeed(secret);
    const expectedAddr = expectedAddresses[index];
    const match = wallet.address === expectedAddr;

    console.log(`Wallet ${index + 1}:`);
    console.log(`  Secret: ${secret}`);
    console.log(`  Generated Address: ${wallet.address}`);
    console.log(`  Expected Address:  ${expectedAddr}`);
    console.log(`  ✅ Match: ${match ? 'YES' : 'NO'}`);
    console.log('');
  } catch (error) {
    console.log(`❌ Error with secret ${index + 1}: ${error.message}`);
  }
});