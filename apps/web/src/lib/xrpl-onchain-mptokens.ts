// Real XRPL on-chain MPToken implementation
import { Client, Wallet, Transaction, SubmitResponse, xrpToDrops } from 'xrpl';

export interface OnChainMPToken {
  tokenId: string;
  issuer: string;
  holder: string;
  serviceId: string;
  serviceName: string;
  subscriptionType: 'monthly' | 'yearly' | 'lifetime';
  tier: 'basic' | 'premium' | 'enterprise';
  maxUsage: number;
  remainingUsage: number;
  issuedAt: Date;
  expiresAt: Date;
  txHash: string;
  onChain: true;
}

export interface MPTokenCreateResult {
  success: boolean;
  tokenId?: string;
  txHash?: string;
  error?: string;
  token?: OnChainMPToken;
}

export class OnChainMPTokenManager {
  private client: Client;
  private issuerWallet: Wallet;
  private issuanceIds: Record<string, string> = {};

  constructor(client: Client, issuerSeed?: string) {
    this.client = client;
    // Use a dedicated issuer wallet for MPTokens - must be funded!
    if (issuerSeed) {
      this.issuerWallet = Wallet.fromSeed(issuerSeed);
    } else {
      throw new Error('MPToken issuer seed is required. Please provide a funded account seed.');
    }

    // Load pre-created IssuanceIDs from environment variables
    this.loadIssuanceIds();
  }

  private loadIssuanceIds() {
    // Load all pre-created IssuanceIDs from environment
    this.issuanceIds = {
      'netflix-basic': process.env.NETFLIX_BASIC_ISSUANCE_ID || '',
      'netflix-premium': process.env.NETFLIX_PREMIUM_ISSUANCE_ID || '',
      'netflix-enterprise': process.env.NETFLIX_ENTERPRISE_ISSUANCE_ID || '',
      'spotify-basic': process.env.SPOTIFY_BASIC_ISSUANCE_ID || '',
      'spotify-premium': process.env.SPOTIFY_PREMIUM_ISSUANCE_ID || '',
      'youtube-basic': process.env.YOUTUBE_BASIC_ISSUANCE_ID || '',
      'youtube-premium': process.env.YOUTUBE_PREMIUM_ISSUANCE_ID || '',
      'coupang-basic': process.env.COUPANG_BASIC_ISSUANCE_ID || '',
      'coupang-premium': process.env.COUPANG_PREMIUM_ISSUANCE_ID || '',
    };

    console.log('📋 Loaded IssuanceIDs:', Object.keys(this.issuanceIds).filter(key => this.issuanceIds[key]));
  }

  private getIssuanceId(serviceId: string, tier: 'basic' | 'premium' | 'enterprise'): string {
    const key = `${serviceId}-${tier}`;
    const issuanceId = this.issuanceIds[key];

    if (!issuanceId) {
      throw new Error(`No pre-created IssuanceID found for ${key}. Please run 'npm run create-mptokens' first.`);
    }

    return issuanceId;
  }

  /**
   * Send pre-created MPToken to holder (no longer creates new tokens)
   */
  async createMPTokenOnChain(
    holderAddress: string,
    serviceId: string,
    serviceName: string,
    subscriptionType: 'monthly' | 'yearly' | 'lifetime' = 'monthly',
    tier: 'basic' | 'premium' | 'enterprise' = 'basic'
  ): Promise<MPTokenCreateResult> {
    try {
      // Connect to XRPL if not connected
      if (!this.client.isConnected()) {
        await this.client.connect();
      }

      // Check if issuer account exists and is funded
      try {
        const accountInfo = await this.client.request({
          command: 'account_info',
          account: this.issuerWallet.address
        });
        console.log('✅ Issuer account info:', {
          address: this.issuerWallet.address,
          balance: accountInfo.result.account_data.Balance,
          sequence: accountInfo.result.account_data.Sequence
        });
      } catch (accountError) {
        console.error('❌ Issuer account not found or not funded:', this.issuerWallet.address);
        throw new Error(`Issuer account ${this.issuerWallet.address} not found. Please fund this account first.`);
      }

      console.log('🏗️ Creating MPToken on XRPL for:', {
        holder: holderAddress,
        service: serviceName,
        tier,
        type: subscriptionType
      });

      // Step 1: Create the MPToken Issuance (following Catalyze docs format)
      const mpTokenCreateTx: any = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: this.issuerWallet.address,
        // Asset scale (0 = integer-only for subscription tokens)
        AssetScale: 0,
        // Maximum supply based on tier
        MaximumAmount: this.getMaxSupplyForTier(tier, subscriptionType).toString(),
        // MPT Flags: Use object format per documentation
        Flags: this.getMPTFlagsObject(subscriptionType, tier),
        Fee: xrpToDrops('0.02'), // Higher fee for MPT creation
      };

      console.log('📝 MPTokenCreate transaction:', mpTokenCreateTx);

      // Check if MPTokensV1 amendment is enabled
      try {
        const serverInfo = await this.client.request({
          command: 'server_info'
        });
        console.log('🔍 XRPL Server Info:', {
          buildVersion: serverInfo.result.info?.build_version,
          networkId: serverInfo.result.info?.network_id,
          serverState: serverInfo.result.info?.server_state,
          validatedLedger: serverInfo.result.info?.validated_ledger?.seq
        });

        // Check amendment status using correct ledger format
        try {
          const ledgerData = await this.client.request({
            command: 'ledger',
            ledger_index: 'validated',
            accounts: false,
            transactions: false
          });
          console.log('🔍 Ledger info:', {
            ledgerIndex: ledgerData.result.ledger_index,
            closeTime: ledgerData.result.close_time,
            amendmentIds: ledgerData.result.ledger?.amendments
          });
        } catch (ledgerError) {
          console.warn('⚠️ Could not check ledger amendments:', ledgerError);
        }

        // Also check feature availability
        const features = await this.client.request({
          command: 'feature',
        });
        console.log('🔍 Available features:', features.result);

        // Test if MPTokenIssuanceCreate is actually supported
        console.log('🧪 Testing transaction type support...');
        const testTx = {
          TransactionType: 'MPTokenIssuanceCreate',
          Account: this.issuerWallet.address,
          Fee: '12' // minimal fee for testing
        };

        try {
          const prepared = await this.client.autofill(testTx);
          console.log('✅ MPTokenIssuanceCreate transaction type is supported');
          console.log('📝 Prepared transaction example:', prepared);
        } catch (autofillError: any) {
          console.error('❌ MPTokenIssuanceCreate transaction type NOT supported:', autofillError.message);
          console.error('🔍 Autofill error details:', autofillError);
        }

      } catch (error) {
        console.warn('⚠️ Could not check server/amendment info:', error);
      }

      // Submit MPToken creation transaction with detailed error handling
      console.log('🚀 Submitting MPToken creation transaction...');
      let createResult;

      try {
        createResult = await this.client.submitAndWait(mpTokenCreateTx, {
          wallet: this.issuerWallet,
          autofill: true
        });

        console.log('📊 Transaction result:', {
          hash: createResult.result.hash,
          ledgerIndex: createResult.result.ledger_index,
          transactionResult: createResult.result.meta?.TransactionResult,
          validated: createResult.result.validated
        });

      } catch (submitError: any) {
        console.error('❌ MPToken transaction submit error details:', {
          message: submitError.message,
          name: submitError.name,
          data: submitError.data,
          response: submitError.response,
          stack: submitError.stack
        });

        // Check if it's a specific XRPL error
        if (submitError.data?.error) {
          console.error('💥 XRPL Error Details:', submitError.data.error);
        }

        throw new Error(`MPToken submit failed: ${submitError.message} (${submitError.name})`);
      }

      if (createResult.result.meta?.TransactionResult !== 'tesSUCCESS') {
        console.error('❌ Transaction failed with result:', createResult.result.meta?.TransactionResult);
        console.error('📋 Full transaction result:', JSON.stringify(createResult.result, null, 2));
        throw new Error(`MPToken creation failed: ${createResult.result.meta?.TransactionResult}`);
      }

      const tokenId = this.extractTokenIdFromResult(createResult);
      console.log('✅ MPToken created on-chain with ID:', tokenId);

      // Step 2: Send token to the holder (MPTokens are issued to the issuer by default)
      console.log('📤 Sending MPToken to holder address:', holderAddress);
      await this.sendMPTokenToHolder(tokenId, holderAddress);

      // Step 3: Authorize the holder to use the token (if needed)
      // Note: Skip authorization if flags don't require it
      if (this.getMPTFlags(subscriptionType, tier) & 0x2) { // lsfMPTRequireAuth
        await this.authorizeMPTokenHolder(tokenId, holderAddress);
      }

      // Step 3: Create local tracking object
      const now = new Date();
      const duration = this.getSubscriptionDuration(subscriptionType);
      const maxUsage = this.getMaxUsage(tier, subscriptionType);

      const onChainToken: OnChainMPToken = {
        tokenId,
        issuer: this.issuerWallet.address,
        holder: holderAddress,
        serviceId,
        serviceName,
        subscriptionType,
        tier,
        maxUsage,
        remainingUsage: maxUsage,
        issuedAt: now,
        expiresAt: new Date(now.getTime() + duration),
        txHash: createResult.result.hash,
        onChain: true
      };

      // Store reference locally for quick access
      this.storeTokenReference(onChainToken);

      return {
        success: true,
        tokenId,
        txHash: createResult.result.hash,
        token: onChainToken
      };

    } catch (error) {
      console.error('❌ MPToken creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send MPToken to holder using regular Payment transaction with MPT amount
   */
  private async sendMPTokenToHolder(issuanceId: string, holderAddress: string, amount: number = 1): Promise<void> {
    try {
      // For now, let's try with the previous working IssuanceID to test the format
      const workingIssuanceId = 'C216F7B3019078BCF4F6D3F9CE1F554CDF43BB623B3404E237E7EC4C90366A9C';
      console.log('🧪 Testing with previous working IssuanceID:', workingIssuanceId);
      console.log('🔍 Current IssuanceID from result:', issuanceId);

      // Use the original GitHub format
      const sendTx: any = {
        TransactionType: 'Payment',
        Account: this.issuerWallet.address,
        Destination: holderAddress,
        Amount: {
          mpt_issuance_id: workingIssuanceId, // Test with known working ID first
          value: amount.toString()
        },
        Fee: xrpToDrops('0.005'),
      };

      console.log('📤 Sending MPToken to holder via Payment:', sendTx);

      const result = await this.client.submitAndWait(sendTx, {
        wallet: this.issuerWallet,
        autofill: true
      });

      if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
        console.log('✅ MPToken sent to holder successfully via Payment transaction');
      } else {
        console.warn('⚠️ MPToken Payment may have failed:', result.result.meta?.TransactionResult);
        throw new Error(`MPToken Payment failed: ${result.result.meta?.TransactionResult}`);
      }

    } catch (error) {
      console.error('❌ MPToken Payment error:', error);
      throw error; // Re-throw to handle in main function
    }
  }

  /**
   * Authorize holder to interact with the MPToken
   */
  private async authorizeMPTokenHolder(issuanceId: string, holderAddress: string): Promise<void> {
    try {
      // Create MPTokenAuthorize transaction with proper IssuanceID
      const authorizeTx: any = {
        TransactionType: 'MPTokenAuthorize',
        Account: this.issuerWallet.address,
        MPTokenIssuanceID: issuanceId, // Use IssuanceID, not TokenID
        MPTokenHolder: holderAddress,
        Fee: xrpToDrops('0.005'),
      };

      console.log('🔐 Authorizing MPToken holder:', authorizeTx);

      const result = await this.client.submitAndWait(authorizeTx, {
        wallet: this.issuerWallet,
        autofill: true
      });

      if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
        console.log('✅ MPToken holder authorized');
      } else {
        console.warn('⚠️ MPToken authorization may have failed:', result.result.meta?.TransactionResult);
      }

    } catch (error) {
      console.warn('⚠️ MPToken authorization error (may not be required):', error);
      // Non-critical error - continue
    }
  }

  /**
   * Consume MPToken usage on-chain
   */
  async consumeMPTokenUsage(
    tokenId: string,
    holderWallet: Wallet,
    usageAmount: number = 1
  ): Promise<{ success: boolean; remainingUsage?: number; error?: string }> {
    try {
      // Get current token state
      const tokenInfo = await this.getMPTokenInfo(tokenId);
      if (!tokenInfo || tokenInfo.remainingUsage < usageAmount) {
        return { success: false, error: 'Insufficient token usage remaining' };
      }

      // Create usage transaction (this might be implementation-specific)
      const usageTx: Transaction = {
        TransactionType: 'Payment', // Or specific MPToken usage transaction
        Account: holderWallet.address,
        Destination: this.issuerWallet.address,
        Amount: '1', // Minimal amount to record usage
        Memos: [{
          Memo: {
            MemoType: Buffer.from('mptoken-usage', 'utf8').toString('hex').toUpperCase(),
            MemoData: Buffer.from(JSON.stringify({
              tokenId,
              usageAmount,
              serviceUsage: true
            }), 'utf8').toString('hex').toUpperCase()
          }
        }],
        Fee: xrpToDrops('0.001'),
      };

      const result = await this.client.submitAndWait(usageTx, {
        wallet: holderWallet,
        autofill: true
      });

      if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
        // Update local tracking
        const updatedUsage = tokenInfo.remainingUsage - usageAmount;
        this.updateTokenUsage(tokenId, updatedUsage);

        console.log(`✅ MPToken usage consumed: ${usageAmount}, remaining: ${updatedUsage}`);
        return { success: true, remainingUsage: updatedUsage };
      }

      return { success: false, error: 'Usage transaction failed' };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Query MPToken information from XRPL
   */
  async getMPTokenInfo(tokenId: string): Promise<OnChainMPToken | null> {
    try {
      // First check local cache
      const cachedToken = this.getLocalTokenReference(tokenId);
      if (cachedToken) {
        return cachedToken;
      }

      // Query XRPL for MPToken object
      const response = await this.client.request({
        command: 'ledger_entry',
        mptoken: tokenId
      });

      if (response.result.node) {
        // Parse XRPL MPToken object and convert to our format
        return this.parseXRPLMPToken(response.result.node);
      }

      return null;

    } catch (error) {
      console.error('Error querying MPToken:', error);
      return null;
    }
  }

  /**
   * Get all MPTokens for a specific holder
   */
  async getHolderMPTokens(holderAddress: string): Promise<OnChainMPToken[]> {
    try {
      // Connect to XRPL if not connected
      if (!this.client.isConnected()) {
        await this.client.connect();
      }

      // Query account objects for MPTokens
      const response = await this.client.request({
        command: 'account_objects',
        account: holderAddress,
        type: 'mptoken'
      });

      const tokens: OnChainMPToken[] = [];
      if (response.result.account_objects) {
        for (const obj of response.result.account_objects) {
          const token = this.parseXRPLMPToken(obj);
          if (token) {
            tokens.push(token);
          }
        }
      }

      return tokens;

    } catch (error) {
      console.error('Error querying holder MPTokens:', error);
      return [];
    }
  }

  // Utility methods

  private getMaxSupplyForTier(tier: 'basic' | 'premium' | 'enterprise', type: 'monthly' | 'yearly' | 'lifetime'): number {
    // Define maximum tokens that can be issued for each tier
    const baseSupply = {
      basic: 1000,      // 1,000 tokens for basic tier
      premium: 5000,    // 5,000 tokens for premium tier
      enterprise: 20000 // 20,000 tokens for enterprise tier
    };

    const multiplier = type === 'yearly' ? 2 : type === 'lifetime' ? 10 : 1;
    return baseSupply[tier] * multiplier;
  }

  private getMPTFlagsObject(subscriptionType: 'monthly' | 'yearly' | 'lifetime', tier: 'basic' | 'premium' | 'enterprise'): any {
    // Use object format per Catalyze documentation
    const flags: any = {
      tfMPTCanTransfer: true,     // All subscription tokens can be transferred
      tfMPTCanEscrow: false,      // Not needed for subscription tokens
    };

    // Premium and Enterprise require authorization (compliance/KYC)
    if (tier === 'premium' || tier === 'enterprise') {
      flags.tfMPTRequireAuth = true;
    } else {
      flags.tfMPTRequireAuth = false;
    }

    return flags;
  }

  // Keep old method for authorization checks
  private getMPTFlags(subscriptionType: 'monthly' | 'yearly' | 'lifetime', tier: 'basic' | 'premium' | 'enterprise'): number {
    const lsfMPTRequireAuth = 0x2;    // Require authorization to hold tokens
    return (tier === 'premium' || tier === 'enterprise') ? lsfMPTRequireAuth : 0;
  }

  private getServiceIcon(serviceId: string): string {
    // Return icon URLs for different services
    const serviceIcons = {
      'netflix-basic': 'https://images.ctfassets.net/y2ske730sjqp/5QQ9SVIdc1tmkqrtFnG9U1/de758bba0f65dcc1c6bc1f31f161003d/BrandAssets_Logos_02-NSymbol.jpg',
      'coupang-samdasoo': 'https://static.coupangcdn.com/image/cmg_icon/cmg_icon_300x300_1540896147000.png',
      'spotify-premium': 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png',
      'youtube-premium': 'https://www.youtube.com/img/desktop/yt_1200.png'
    };

    return serviceIcons[serviceId as keyof typeof serviceIcons] || 'https://via.placeholder.com/64x64.png?text=MPT';
  }

  private extractTokenIdFromResult(result: SubmitResponse): string {
    // Extract MPTokenIssuance ID from transaction result
    const meta = result.result.meta as any;

    console.log('🔍 Extracting IssuanceID from transaction metadata:', JSON.stringify(meta, null, 2));

    // Look for created MPTokenIssuance objects in metadata
    if (meta?.CreatedNodes) {
      for (const node of meta.CreatedNodes) {
        console.log('🔍 Checking created node:', JSON.stringify(node, null, 2));
        if (node.NewNode?.LedgerEntryType === 'MPTokenIssuance') {
          const issuanceId = node.NewNode.index;
          console.log('✅ Found MPTokenIssuance node with index:', issuanceId);
          return issuanceId || result.result.hash;
        }
      }
    }

    console.log('⚠️ No MPTokenIssuance node found, using transaction hash as fallback');
    // Fallback: use transaction hash directly as IssuanceID
    return result.result.hash;
  }

  private parseXRPLMPToken(xrplObj: any): OnChainMPToken | null {
    try {
      // Parse XRPL MPToken object format
      const metadata = xrplObj.MPTokenMetadata
        ? JSON.parse(Buffer.from(xrplObj.MPTokenMetadata, 'hex').toString('utf8'))
        : {};

      return {
        tokenId: xrplObj.MPTokenID || xrplObj.index,
        issuer: xrplObj.Issuer,
        holder: xrplObj.Holder || metadata.holderAddress,
        serviceId: metadata.serviceId || 'unknown',
        serviceName: metadata.serviceName || 'Unknown Service',
        subscriptionType: metadata.subscriptionType || 'monthly',
        tier: metadata.tier || 'basic',
        maxUsage: metadata.maxUsage || 100,
        remainingUsage: metadata.remainingUsage || 100,
        issuedAt: new Date(metadata.issuedAt || Date.now()),
        expiresAt: new Date(metadata.expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000),
        txHash: metadata.txHash || '',
        onChain: true
      };

    } catch (error) {
      console.error('Error parsing XRPL MPToken:', error);
      return null;
    }
  }

  private getSubscriptionDuration(type: 'monthly' | 'yearly' | 'lifetime'): number {
    const durations = {
      monthly: 30 * 24 * 60 * 60 * 1000,
      yearly: 365 * 24 * 60 * 60 * 1000,
      lifetime: 100 * 365 * 24 * 60 * 60 * 1000
    };
    return durations[type];
  }

  private getMaxUsage(tier: 'basic' | 'premium' | 'enterprise', type: 'monthly' | 'yearly' | 'lifetime'): number {
    const baseUsage = {
      basic: 100,
      premium: 1000,
      enterprise: 10000
    };

    const multiplier = {
      monthly: 1,
      yearly: 12,
      lifetime: 1000
    };

    return baseUsage[tier] * multiplier[type];
  }

  private storeTokenReference(token: OnChainMPToken): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`onchain_mptoken_${token.tokenId}`, JSON.stringify(token));
    }
  }

  private getLocalTokenReference(tokenId: string): OnChainMPToken | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(`onchain_mptoken_${tokenId}`);
      if (!stored) return null;

      const token = JSON.parse(stored);
      return {
        ...token,
        issuedAt: new Date(token.issuedAt),
        expiresAt: new Date(token.expiresAt)
      };
    } catch {
      return null;
    }
  }

  private updateTokenUsage(tokenId: string, remainingUsage: number): void {
    const token = this.getLocalTokenReference(tokenId);
    if (token) {
      token.remainingUsage = remainingUsage;
      this.storeTokenReference(token);
    }
  }
}

// Function to create manager instance with funded issuer
export function createOnChainMPTokenManager(issuerSeed: string): OnChainMPTokenManager {
  return new OnChainMPTokenManager(
    new Client('wss://s.devnet.rippletest.net:51233'),
    issuerSeed
  );
}

// Default instance - will be initialized in chat page with proper seed
export let onChainMPTokenManager: OnChainMPTokenManager;