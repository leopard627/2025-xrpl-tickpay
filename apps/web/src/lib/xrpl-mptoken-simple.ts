// Simplified MPToken manager that only transfers pre-created tokens
import { Client, Wallet, xrpToDrops } from 'xrpl';

export interface SimpleMPTokenResult {
  success: boolean;
  tokenId?: string;
  txHash?: string;
  error?: string;
  requiresUserOptIn?: boolean;
  optInPayload?: any;
  xamanOptIn?: {
    uuid: string;
    qrCode: string;
    deepLink: string;
  };
}

export class SimpleMPTokenManager {
  private client: Client;
  private issuerWallet: Wallet;
  private issuanceIds: Record<string, string> = {};

  constructor(client: Client, issuerSeed: string) {
    this.client = client;
    this.issuerWallet = Wallet.fromSeed(issuerSeed);
    this.loadIssuanceIds();
  }

  private loadIssuanceIds() {
    // Load all pre-created IssuanceIDs from environment with fallback to tested working ID
    const testedWorkingId = '005E2BD89899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5'; // From GitHub examples test

    this.issuanceIds = {
      'netflix-basic': process.env.NEXT_PUBLIC_NETFLIX_BASIC_ISSUANCE_ID || testedWorkingId,
      'netflix-premium': process.env.NEXT_PUBLIC_NETFLIX_PREMIUM_ISSUANCE_ID || testedWorkingId,
      'netflix-enterprise': process.env.NEXT_PUBLIC_NETFLIX_ENTERPRISE_ISSUANCE_ID || testedWorkingId,
      'spotify-basic': process.env.NEXT_PUBLIC_SPOTIFY_BASIC_ISSUANCE_ID || testedWorkingId,
      'spotify-premium': process.env.NEXT_PUBLIC_SPOTIFY_PREMIUM_ISSUANCE_ID || testedWorkingId,
      'youtube-basic': process.env.NEXT_PUBLIC_YOUTUBE_BASIC_ISSUANCE_ID || testedWorkingId,
      'youtube-premium': process.env.NEXT_PUBLIC_YOUTUBE_PREMIUM_ISSUANCE_ID || testedWorkingId,
      'coupang-basic': process.env.NEXT_PUBLIC_COUPANG_BASIC_ISSUANCE_ID || testedWorkingId,
      'coupang-premium': process.env.NEXT_PUBLIC_COUPANG_PREMIUM_ISSUANCE_ID || testedWorkingId,
      'chatgpt-basic': testedWorkingId, // Add ChatGPT service
      'chatgpt-premium': testedWorkingId,
      'chatgpt-enterprise': testedWorkingId,
    };

    console.log('📋 Loaded IssuanceIDs (using tested working ID):', testedWorkingId);
  }

  private getIssuanceId(serviceId: string, tier: 'basic' | 'premium' | 'enterprise'): string {
    // Extract base service name if serviceId contains tier info (e.g., "netflix-basic" -> "netflix")
    const baseService = serviceId.includes('-') ? serviceId.split('-')[0] : serviceId;
    const key = `${baseService}-${tier}`;

    let issuanceId = this.issuanceIds[key];

    // Fallback: try direct environment variable lookup
    if (!issuanceId) {
      const envKey = `${baseService.toUpperCase()}_${tier.toUpperCase()}_ISSUANCE_ID`;
      issuanceId = process.env[envKey] || '';
    }

    // Final fallback: use hardcoded values that were generated
    if (!issuanceId) {
      const fallbackIds: Record<string, string> = {
        'netflix-basic': '005E2B719899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5',
        'netflix-premium': '005E2B729899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5',
        'netflix-enterprise': '005E2B739899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5',
        'spotify-basic': '005E2B749899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5',
        'spotify-premium': '005E2B759899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5',
        'youtube-basic': '005E2B769899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5',
        'youtube-premium': '005E2B779899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5',
        'coupang-basic': '005E2B789899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5',
        'coupang-premium': '005E2B799899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5',
      };
      issuanceId = fallbackIds[key] || '';
    }

    if (!issuanceId) {
      throw new Error(`No pre-created IssuanceID found for ${key}. Please run 'npm run create-mptokens' first.`);
    }

    return issuanceId;
  }

  async authorizeMPTokenHolder(
    holderAddress: string,
    serviceId: string,
    tier: 'basic' | 'premium' | 'enterprise' = 'basic'
  ): Promise<SimpleMPTokenResult> {
    try {
      // Connect to XRPL if not connected
      if (!this.client.isConnected()) {
        await this.client.connect();
      }

      // Get pre-created IssuanceID
      const issuanceId = this.getIssuanceId(serviceId, tier);
      console.log('🔐 Authorizing holder for IssuanceID:', issuanceId);

      // Create MPTokenAuthorize transaction
      const authorizeTx: any = {
        TransactionType: 'MPTokenAuthorize',
        Account: this.issuerWallet.address,
        MPTokenIssuanceID: issuanceId,
        Holder: holderAddress
      };

      console.log('🔐 Authorizing MPToken holder:', authorizeTx);

      const prepared = await this.client.autofill(authorizeTx);
      const signed = this.issuerWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
        console.log('✅ MPToken holder authorized successfully!');
        return {
          success: true,
          tokenId: issuanceId,
          txHash: result.result.hash
        };
      } else {
        throw new Error(`Authorization failed: ${result.result.meta?.TransactionResult}`);
      }

    } catch (error) {
      console.error('❌ MPToken authorization failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async requestUserOptIn(
    holderAddress: string,
    serviceId: string,
    tier: 'basic' | 'premium' | 'enterprise' = 'basic'
  ): Promise<SimpleMPTokenResult> {
    try {
      const issuanceId = this.getIssuanceId(serviceId, tier);

      // Create user opt-in transaction payload for Xaman
      const optInPayload = {
        TransactionType: "MPTokenAuthorize",
        Account: holderAddress,           // User signs this
        MPTokenIssuanceID: issuanceId
      };

      console.log('🔐 Step 1 Required: User must opt-in to MPToken');
      console.log('📱 Send this transaction to user\'s Xaman wallet:', optInPayload);

      return {
        success: false,
        requiresUserOptIn: true,
        optInPayload: optInPayload,
        tokenId: issuanceId,
        error: 'User must first opt-in to MPToken via Xaman wallet'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendMPTokenToUser(
    holderAddress: string,
    serviceId: string,
    tier: 'basic' | 'premium' | 'enterprise' = 'basic',
    amount: number = 1
  ): Promise<SimpleMPTokenResult> {
    try {
      // Connect to XRPL if not connected
      if (!this.client.isConnected()) {
        await this.client.connect();
      }

      // Get pre-created IssuanceID
      const issuanceId = this.getIssuanceId(serviceId, tier);
      console.log('🎫 Using IssuanceID:', issuanceId);

      console.log('💡 Simplified MPToken Flow (based on GitHub examples):');
      console.log(`   1. User Opt-in → 2. Direct Token Transfer`);
      console.log(`   • ADMIN (Issuer): ${this.issuerWallet.address}`);
      console.log(`   • USER (Holder): ${holderAddress}`);
      console.log(`   • IssuanceID: ${issuanceId}`);

      // Try direct token transfer first - if it fails, user needs to opt-in
      console.log('🚀 Attempting direct MPToken transfer...');

      const paymentTx: any = {
        TransactionType: 'Payment',
        Account: this.issuerWallet.address,  // ADMIN (토큰 발행자)
        Destination: holderAddress,          // USER (토큰 받는 사람)
        Amount: {
          mpt_issuance_id: issuanceId,
          value: amount.toString()
        }
      };

      console.log('📤 Sending MPToken via Payment (ADMIN → USER):', paymentTx);

      const prepared = await this.client.autofill(paymentTx);
      const signed = this.issuerWallet.sign(prepared);  // ADMIN이 서명
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
        console.log('✅ MPToken sent successfully! Direct transfer worked!');
        return {
          success: true,
          tokenId: issuanceId,
          txHash: result.result.hash
        };
      } else if (result.result.meta?.TransactionResult === 'tecNO_AUTH') {
        // User hasn't opted in yet - create Xaman opt-in request
        console.log('❌ Transfer failed - User opt-in required!');

        try {
          // Create Xaman opt-in request via server API
          console.log('📱 Creating Xaman opt-in request via server API...');
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

          const response = await fetch(`${apiUrl}/mptoken/optin/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userAddress: holderAddress,
              issuanceId: issuanceId,
              serviceId: serviceId.split('-')[0], // Remove tier suffix (netflix-basic -> netflix)
              serviceName: `${serviceId.split('-')[0]} Subscription`
            })
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const xamanRequest = await response.json();

          return {
            success: false,
            requiresUserOptIn: true,
            optInPayload: {
              TransactionType: "MPTokenAuthorize",
              Account: holderAddress,
              MPTokenIssuanceID: issuanceId
            },
            xamanOptIn: {
              uuid: xamanRequest.uuid,
              qrCode: xamanRequest.qrCode,
              deepLink: xamanRequest.deepLink
            },
            tokenId: issuanceId,
            error: 'User must first opt-in to MPToken via Xaman wallet.'
          };
        } catch (xamanError) {
          console.error('❌ Failed to create Xaman opt-in request:', xamanError);
          // Fallback to manual opt-in
          return {
            success: false,
            requiresUserOptIn: true,
            optInPayload: {
              TransactionType: "MPTokenAuthorize",
              Account: holderAddress,
              MPTokenIssuanceID: issuanceId
            },
            tokenId: issuanceId,
            error: 'User must first opt-in to MPToken. Server API failed: ' + (xamanError instanceof Error ? xamanError.message : 'Unknown error')
          };
        }
      } else {
        throw new Error(`Payment failed: ${result.result.meta?.TransactionResult}`);
      }

    } catch (error) {
      console.error('❌ MPToken send failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Helper function to create manager instance
export function createSimpleMPTokenManager(issuerSeed: string): SimpleMPTokenManager {
  return new SimpleMPTokenManager(
    new Client('wss://s.devnet.rippletest.net:51233'),
    issuerSeed
  );
}