#!/usr/bin/env tsx

/**
 * Script to pre-create MPTokens for all service/tier combinations
 * Run this once to create all necessary MPToken issuances
 * The IssuanceIDs will be logged for adding to .env file
 */

import { Client, Wallet, xrpToDrops } from 'xrpl';

// Load MPToken issuer seed from environment
const ISSUER_SEED = process.env.ADMIN_SEED || 'sDEVELOPMENT_ADMIN_SEED_PLACEHOLDER'; // MPToken issuer (ADMIN) seed

interface ServiceConfig {
  serviceId: string;
  serviceName: string;
  tiers: ('basic' | 'premium' | 'enterprise')[];
}

const SERVICES: ServiceConfig[] = [
  {
    serviceId: 'netflix',
    serviceName: 'Netflix',
    tiers: ['basic', 'premium', 'enterprise']
  },
  {
    serviceId: 'spotify',
    serviceName: 'Spotify',
    tiers: ['basic', 'premium']
  },
  {
    serviceId: 'youtube',
    serviceName: 'YouTube',
    tiers: ['basic', 'premium']
  },
  {
    serviceId: 'coupang',
    serviceName: 'Coupang',
    tiers: ['basic', 'premium']
  }
];

class MPTokenCreator {
  private client: Client;
  private issuerWallet: Wallet;

  constructor() {
    this.client = new Client('wss://s.devnet.rippletest.net:51233');
    this.issuerWallet = Wallet.fromSeed(ISSUER_SEED);
  }

  async connect() {
    await this.client.connect();
    console.log('✅ Connected to XRPL Devnet');

    // Check issuer balance
    const accountInfo = await this.client.request({
      command: 'account_info',
      account: this.issuerWallet.address
    });

    console.log(`💰 Issuer Balance: ${parseFloat(accountInfo.result.account_data.Balance) / 1000000} XRP`);
  }

  private getMaxSupplyForTier(tier: 'basic' | 'premium' | 'enterprise'): number {
    const baseSupply = {
      basic: 10000,      // 10,000 tokens for basic tier
      premium: 50000,    // 50,000 tokens for premium tier
      enterprise: 200000 // 200,000 tokens for enterprise tier
    };
    return baseSupply[tier];
  }

  private getMPTFlags(tier: 'basic' | 'premium' | 'enterprise'): any {
    // Using the same flag format as the working example
    const flags: any = {
      tfMPTCanTransfer: true,
      tfMPTCanEscrow: true,
      tfMPTRequireAuth: false
    };

    return flags;
  }

  async createMPToken(serviceId: string, serviceName: string, tier: 'basic' | 'premium' | 'enterprise') {
    console.log(`\n🏗️ Creating ${serviceName} ${tier} MPToken...`);

    // Add timestamp to make each MPToken unique
    const timestamp = Date.now();
    // Create compliant ticker (max 6 chars, A-Z and 0-9 only)
    const serviceCode = serviceId.substring(0, 3).toUpperCase();
    const tierCode = tier === 'basic' ? 'B' : tier === 'premium' ? 'P' : 'E';
    const ticker = `${serviceCode}${tierCode}`;

    const metadata = {
      ticker: ticker,
      icon: "https://tickpay.com/icon.png", // Replace with actual icon URL
      asset_class: "other", // Using 'other' as it's one of the allowed values
      issuer_name: "TickPay Platform",
      service: serviceId,
      tier: tier,
      timestamp: timestamp,
      name: `${serviceName} ${tier} Subscription`
    };

    const mpTokenCreateTx: any = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: this.issuerWallet.address,
      AssetScale: 0,
      MaximumAmount: this.getMaxSupplyForTier(tier).toString(),
      Flags: this.getMPTFlags(tier),
      // Add unique JSON metadata to ensure different IssuanceID
      MPTokenMetadata: Buffer.from(JSON.stringify(metadata)).toString('hex').toUpperCase(),
    };

    try {
      const prepared = await this.client.autofill(mpTokenCreateTx);
      const signed = this.issuerWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
        // Extract IssuanceID from transaction result
        const issuanceId = (result.result.meta as any)?.mpt_issuance_id;
        if (issuanceId) {
          console.log(`✅ ${serviceName} ${tier}: ${issuanceId}`);
          return issuanceId;
        } else {
          throw new Error('IssuanceID not found in transaction result');
        }
      } else {
        throw new Error(`Transaction failed: ${result.result.meta?.TransactionResult}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create ${serviceName} ${tier}:`, error);
      return null;
    }
  }

  async createAllTokens() {
    const results: Record<string, string> = {};

    for (const service of SERVICES) {
      for (const tier of service.tiers) {
        const issuanceId = await this.createMPToken(service.serviceId, service.serviceName, tier);
        if (issuanceId) {
          const envKey = `NEXT_PUBLIC_${service.serviceId.toUpperCase()}_${tier.toUpperCase()}_ISSUANCE_ID`;
          results[envKey] = issuanceId;
        }
      }

      // Wait 1 second between services to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  async disconnect() {
    await this.client.disconnect();
    console.log('✅ Disconnected from XRPL');
  }
}

async function main() {
  const creator = new MPTokenCreator();

  try {
    await creator.connect();

    console.log('🚀 Starting MPToken creation for all services...\n');
    const results = await creator.createAllTokens();

    console.log('\n🎉 All MPTokens created successfully!');
    console.log('\n📝 Add these to your .env file:');
    console.log('=====================================');

    Object.entries(results).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });

    console.log('=====================================\n');

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await creator.disconnect();
  }
}

// Run the script
main().catch(console.error);