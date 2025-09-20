// Utility to generate a valid XRPL wallet for testing
const { Wallet } = require('xrpl');

// Generate a new wallet
const wallet = Wallet.generate();

console.log('Generated Test Wallet:');
console.log('Address:', wallet.address);
console.log('Seed:', wallet.seed);
console.log('Public Key:', wallet.publicKey);
console.log('Private Key:', wallet.privateKey);

console.log('\nAdd this to your .env.local:');
console.log(`XAMAN_WALLET_SEED=${wallet.seed}`);
console.log(`NEXT_PUBLIC_SERVICE_WALLET=${wallet.address}`);

// Also generate provider address
const providerWallet = Wallet.generate();
console.log('\nProvider Wallet (for payments):');
console.log('Address:', providerWallet.address);
console.log('Seed:', providerWallet.seed);