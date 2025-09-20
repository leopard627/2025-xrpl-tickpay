// XRPL On-Chain Credentials utility for user verification
import { Client, Wallet, SubmitResponse } from 'xrpl';
import { walletManager } from './a2a-wallet-manager';

// On-chain Credential interface matching XRPL structure
export interface OnChainCredential {
  LedgerEntryType: 'Credential';
  Account: string; // Issuer address
  Subject: string; // Holder address
  CredentialType: string; // Hex-encoded credential type
  Expiration?: number; // Unix timestamp
  URI?: string; // Hex-encoded URI
  PreviousTxnID?: string;
  PreviousTxnLgrSeq?: number;
  OwnerNode?: string;
  index?: string;
}

export interface UserCredential {
  walletAddress: string;
  isVerified: boolean;
  credentialType: 'basic' | 'premium' | 'enterprise';
  verificationLevel: number; // 1-5
  issuedAt: Date;
  expiresAt: Date;
  credentialHash?: string;
  // On-chain data
  onChainCredential?: OnChainCredential;
  isOnChain: boolean;
}

export interface CredentialVerificationResult {
  isValid: boolean;
  credential?: UserCredential;
  error?: string;
}

export class XRPLCredentialsManager {
  private client: Client;
  private issuerWallet: Wallet;

  constructor(client: Client, issuerSeed?: string) {
    this.client = client;
    // Use admin wallet as issuer for on-chain credentials
    this.issuerWallet = issuerSeed ? Wallet.fromSeed(issuerSeed) :
      Wallet.fromSeed(process.env.NEXT_PUBLIC_ADMIN_SEED || 'sDEVELOPMENT_ADMIN_SEED_PLACEHOLDER');
  }

  /**
   * Convert string to hex for XRPL Credential fields
   */
  private toHex(str: string): string {
    return Buffer.from(str, 'utf8').toString('hex').toUpperCase();
  }

  /**
   * Convert hex back to string
   */
  private fromHex(hex: string): string {
    return Buffer.from(hex, 'hex').toString('utf8');
  }

  /**
   * Get current Unix timestamp
   */
  private now(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Get user seed from environment variables based on address
   */
  private getUserSeed(userAddress: string): string | null {
    // Map agent addresses to their environment variable seeds
    // Create dynamic mapping from environment variables
    const agentSeeds: { [key: string]: string | undefined } = {};

    // Map environment variables to their addresses
    if (process.env.NEXT_PUBLIC_AGENT1_ADDRESS && process.env.NEXT_PUBLIC_AGENT1_SEED) {
      agentSeeds[process.env.NEXT_PUBLIC_AGENT1_ADDRESS] = process.env.NEXT_PUBLIC_AGENT1_SEED;
    }
    if (process.env.NEXT_PUBLIC_AGENT2_ADDRESS && process.env.NEXT_PUBLIC_AGENT2_SEED) {
      agentSeeds[process.env.NEXT_PUBLIC_AGENT2_ADDRESS] = process.env.NEXT_PUBLIC_AGENT2_SEED;
    }
    if (process.env.NEXT_PUBLIC_AGENT3_ADDRESS && process.env.NEXT_PUBLIC_AGENT3_SEED) {
      agentSeeds[process.env.NEXT_PUBLIC_AGENT3_ADDRESS] = process.env.NEXT_PUBLIC_AGENT3_SEED;
    }
    if (process.env.NEXT_PUBLIC_AGENT4_ADDRESS && process.env.NEXT_PUBLIC_AGENT4_SEED) {
      agentSeeds[process.env.NEXT_PUBLIC_AGENT4_ADDRESS] = process.env.NEXT_PUBLIC_AGENT4_SEED;
    }
    if (process.env.NEXT_PUBLIC_AGENT5_ADDRESS && process.env.NEXT_PUBLIC_AGENT5_SEED) {
      agentSeeds[process.env.NEXT_PUBLIC_AGENT5_ADDRESS] = process.env.NEXT_PUBLIC_AGENT5_SEED;
    }
    if (process.env.NEXT_PUBLIC_AGENT6_ADDRESS && process.env.NEXT_PUBLIC_AGENT6_SEED) {
      agentSeeds[process.env.NEXT_PUBLIC_AGENT6_ADDRESS] = process.env.NEXT_PUBLIC_AGENT6_SEED;
    }

    return agentSeeds[userAddress as keyof typeof agentSeeds] || null;
  }

  /**
   * Create real on-chain XRPL Credential with auto-acceptance (using wallet manager)
   */
  async createOnChainCredential(
    userAddress: string,
    credentialType: 'basic' | 'premium' | 'enterprise' = 'basic'
  ): Promise<UserCredential> {
    try {
      // Use wallet manager to avoid connection issues
      const client = await walletManager.getClient('credential-issuer');

      const now = this.now();
      const expirationTime = now + (365 * 24 * 60 * 60); // 1 year from now

      // Step 1: Create CredentialCreate transaction
      const credentialTx: any = {
        TransactionType: "CredentialCreate",
        Account: this.issuerWallet.address,
        Subject: userAddress,
        CredentialType: this.toHex(`A2A_${credentialType.toUpperCase()}_VERIFICATION`),
        Expiration: expirationTime,
        URI: this.toHex(`https://tickpay.com/credentials/${credentialType}/${userAddress}`)
      };

      console.log('🔐 Step 1: Creating on-chain credential:', credentialTx);

      // Submit the credential creation transaction
      const prepared = await client.autofill(credentialTx);
      const signed = this.issuerWallet.sign(prepared);
      const createResult = await client.submitAndWait(signed.tx_blob);

      if (createResult.result.meta?.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Credential creation failed: ${createResult.result.meta?.TransactionResult}`);
      }

      console.log('✅ Step 1: On-chain credential created successfully:', createResult.result.hash);

      // Step 2: Auto-accept the credential using the agent's wallet
      const userSeed = this.getUserSeed(userAddress);
      if (userSeed) {
        const userWallet = Wallet.fromSeed(userSeed);

        const acceptTx: any = {
          TransactionType: "CredentialAccept",
          Account: userWallet.address,
          Issuer: this.issuerWallet.address,
          CredentialType: this.toHex(`A2A_${credentialType.toUpperCase()}_VERIFICATION`)
        };

        console.log('🤝 Step 2: Auto-accepting credential:', acceptTx);

        const acceptPrepared = await client.autofill(acceptTx);
        const acceptSigned = userWallet.sign(acceptPrepared);
        const acceptResult = await client.submitAndWait(acceptSigned.tx_blob);

        if (acceptResult.result.meta?.TransactionResult !== 'tesSUCCESS') {
          console.warn('⚠️ Credential acceptance failed, but creation succeeded:', acceptResult.result.meta?.TransactionResult);
        } else {
          console.log('✅ Step 2: On-chain credential accepted successfully:', acceptResult.result.hash);
        }
      }

      // Create UserCredential object
      const credential: UserCredential = {
        walletAddress: userAddress,
        isVerified: true,
        credentialType,
        verificationLevel: credentialType === 'basic' ? 1 : credentialType === 'premium' ? 3 : 5,
        issuedAt: new Date(now * 1000),
        expiresAt: new Date(expirationTime * 1000),
        credentialHash: createResult.result.hash,
        isOnChain: true
      };

      // Store locally for quick access
      this.storeCredentialLocally(credential);

      return credential;

    } catch (error) {
      console.error('❌ Failed to create on-chain credential:', error);
      throw error;
    }
  }

  /**
   * Create credential using Payment transaction memo (XRPL DevNet compatible)
   */
  async createCredentialWithPaymentMemo(
    userAddress: string,
    credentialType: 'basic' | 'premium' | 'enterprise' = 'basic'
  ): Promise<UserCredential> {
    try {
      // Use wallet manager to avoid connection issues
      const client = await walletManager.getClient('credential-payment');

      const now = this.now();
      const expirationTime = now + (365 * 24 * 60 * 60); // 1 year from now

      // Create credential data as JSON
      const credentialData = {
        type: 'A2A_CREDENTIAL_ISSUANCE',
        subject: userAddress,
        issuer: this.issuerWallet.address,
        credentialType: `A2A_${credentialType.toUpperCase()}_VERIFICATION`,
        issuedAt: now,
        expiresAt: expirationTime,
        verificationLevel: credentialType === 'basic' ? 1 : credentialType === 'premium' ? 3 : 5
      };

      // Create Payment transaction with credential memo
      const paymentTx: any = {
        TransactionType: "Payment",
        Account: this.issuerWallet.address,
        Destination: userAddress,
        Amount: "1", // 1 drop (0.000001 XRP) for credential issuance
        Memos: [{
          Memo: {
            MemoType: this.toHex('A2A_CREDENTIAL'),
            MemoData: this.toHex(JSON.stringify(credentialData))
          }
        }]
      };

      console.log('🔐 Creating credential via Payment memo:', paymentTx);

      // Submit the payment transaction
      const prepared = await client.autofill(paymentTx);
      const signed = this.issuerWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta?.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Credential payment failed: ${result.result.meta?.TransactionResult}`);
      }

      console.log('✅ On-chain credential created via Payment memo:', result.result.hash);

      // Create UserCredential object
      const credential: UserCredential = {
        walletAddress: userAddress,
        isVerified: true,
        credentialType,
        verificationLevel: credentialData.verificationLevel,
        issuedAt: new Date(now * 1000),
        expiresAt: new Date(expirationTime * 1000),
        credentialHash: result.result.hash,
        isOnChain: true
      };

      // Store locally for quick access
      this.storeCredentialLocally(credential);

      return credential;

    } catch (error) {
      console.error('❌ Failed to create credential via Payment memo:', error);
      throw error;
    }
  }

  /**
   * Create local credential as fallback
   */
  async createLocalCredential(
    userAddress: string,
    credentialType: 'basic' | 'premium' | 'enterprise' = 'basic'
  ): Promise<UserCredential> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year

    const credential: UserCredential = {
      walletAddress: userAddress,
      isVerified: true,
      credentialType,
      verificationLevel: credentialType === 'basic' ? 1 : credentialType === 'premium' ? 3 : 5,
      issuedAt: now,
      expiresAt,
      credentialHash: this.generateCredentialHash(userAddress, credentialType),
      isOnChain: false
    };

    this.storeCredentialLocally(credential);
    console.log('📝 Created local credential for user:', credential);
    return credential;
  }

  /**
   * Accept on-chain credential (called by user) - using wallet manager
   */
  async acceptCredential(userWallet: Wallet, issuerAddress: string, credentialType: string): Promise<boolean> {
    try {
      // Use wallet manager to avoid connection issues
      const client = await walletManager.getClient('credential-accept');

      const acceptTx: any = {
        TransactionType: "CredentialAccept",
        Account: userWallet.address,
        Issuer: issuerAddress,
        CredentialType: this.toHex(`A2A_${credentialType.toUpperCase()}_VERIFICATION`)
      };

      console.log('🤝 Accepting on-chain credential:', acceptTx);

      const prepared = await client.autofill(acceptTx);
      const signed = userWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta?.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Credential acceptance failed: ${result.result.meta?.TransactionResult}`);
      }

      console.log('✅ On-chain credential accepted successfully:', result.result.hash);
      return true;

    } catch (error) {
      console.error('❌ Failed to accept on-chain credential:', error);
      throw error;
    }
  }

  /**
   * Delete on-chain credential (called by user) - using wallet manager
   */
  async deleteCredential(userAddress: string, credentialType: string): Promise<boolean> {
    try {
      // Use wallet manager to avoid connection issues
      const client = await walletManager.getClient('credential-delete');

      // Get user seed to create wallet
      const userSeed = this.getUserSeed(userAddress);
      if (!userSeed) {
        throw new Error(`No seed found for user address: ${userAddress}`);
      }

      const userWallet = Wallet.fromSeed(userSeed);

      const deleteTx: any = {
        TransactionType: "CredentialDelete",
        Account: userWallet.address,
        Issuer: this.issuerWallet.address,
        Subject: userWallet.address,
        CredentialType: this.toHex(`A2A_${credentialType.toUpperCase()}_VERIFICATION`)
      };

      console.log('🗑️ Deleting on-chain credential:', deleteTx);

      const prepared = await client.autofill(deleteTx);
      const signed = userWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta?.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Credential deletion failed: ${result.result.meta?.TransactionResult}`);
      }

      console.log('✅ On-chain credential deleted successfully:', result.result.hash);

      // Remove from local storage as well
      if (typeof window !== 'undefined') {
        const key = `xrpl_credential_${userAddress}`;
        localStorage.removeItem(key);
      }

      return true;

    } catch (error) {
      console.error('❌ Failed to delete on-chain credential:', error);
      throw error;
    }
  }

  /**
   * Check on-chain credentials for a user (using wallet manager)
   */
  async checkOnChainCredentials(walletAddress: string): Promise<OnChainCredential[]> {
    try {
      // Use wallet manager to avoid connection issues
      const client = await walletManager.getClient('credential-check');

      const response: any = await client.request({
        command: "account_objects",
        account: walletAddress,
        limit: 400
      });

      const credentials = (response.result.account_objects || []).filter(
        (obj: any) => obj.LedgerEntryType === "Credential"
      );

      console.log('🔍 Found on-chain credentials:', credentials);
      return credentials;

    } catch (error) {
      console.error('❌ Failed to check on-chain credentials:', error);
      return [];
    }
  }

  /**
   * Verify user credentials for AI payment authorization (now with on-chain support)
   */
  async verifyUserCredentials(walletAddress: string): Promise<CredentialVerificationResult> {
    try {
      // First check on-chain credentials
      const onChainCredentials = await this.checkOnChainCredentials(walletAddress);

      // Look for A2A verification credentials
      const validCredential = onChainCredentials.find((cred: OnChainCredential) => {
        if (!cred.CredentialType) return false;

        try {
          const credType = this.fromHex(cred.CredentialType);
          const isA2ACredential = credType.startsWith('A2A_') && credType.includes('_VERIFICATION');
          const isNotExpired = !cred.Expiration || cred.Expiration > this.now();

          return isA2ACredential && isNotExpired;
        } catch {
          return false;
        }
      });

      if (validCredential) {
        // Convert on-chain credential to UserCredential
        const credType = this.fromHex(validCredential.CredentialType);
        const typeMatch = credType.match(/A2A_(\w+)_VERIFICATION/);
        const credentialType = typeMatch ? typeMatch[1].toLowerCase() as ('basic' | 'premium' | 'enterprise') : 'basic';

        const userCredential: UserCredential = {
          walletAddress,
          isVerified: true,
          credentialType,
          verificationLevel: credentialType === 'basic' ? 1 : credentialType === 'premium' ? 3 : 5,
          issuedAt: new Date(), // Could extract from transaction if needed
          expiresAt: validCredential.Expiration ? new Date(validCredential.Expiration * 1000) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          credentialHash: validCredential.index,
          onChainCredential: validCredential,
          isOnChain: true
        };

        console.log('✅ Valid on-chain credential found:', userCredential);
        return {
          isValid: true,
          credential: userCredential
        };
      }

      // Fallback to local credentials for backward compatibility
      const localCredential = this.getLocalCredential(walletAddress);
      if (localCredential && localCredential.expiresAt > new Date()) {
        return {
          isValid: true,
          credential: localCredential
        };
      }

      // Auto-create credential for new users (using Payment memo approach)
      if (!localCredential && !validCredential) {
        console.log('🆕 Creating new credential for user (Payment memo approach):', walletAddress);
        // Use Payment memo approach as XRPL DevNet may not support CredentialCreate yet
        try {
          const newCredential = await this.createCredentialWithPaymentMemo(walletAddress, 'basic');
          return {
            isValid: true,
            credential: newCredential
          };
        } catch (error) {
          console.warn('⚠️ Payment memo credential creation failed, using local:', error);
          const localCredential = await this.createLocalCredential(walletAddress, 'basic');
          return {
            isValid: true,
            credential: localCredential
          };
        }
      }

      return {
        isValid: false,
        error: 'No valid credentials found'
      };

    } catch (error) {
      console.error('❌ Credential verification failed:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Check if user has sufficient verification level for AI payment
   */
  canAuthorizeAIPayment(credential: UserCredential, paymentAmount: number): boolean {
    // Different verification levels have different spending limits
    const limits = {
      1: 50,    // Basic: $50
      2: 200,   // Standard: $200
      3: 1000,  // Premium: $1000
      4: 5000,  // Business: $5000
      5: 10000  // Enterprise: $10000
    };

    const limit = limits[credential.verificationLevel as keyof typeof limits] || 0;
    return paymentAmount <= limit;
  }

  /**
   * Upgrade user credential level
   */
  async upgradeCredential(
    walletAddress: string,
    newType: 'premium' | 'enterprise'
  ): Promise<UserCredential> {
    const existing = this.getLocalCredential(walletAddress);
    if (!existing) {
      throw new Error('No existing credential found');
    }

    const upgraded: UserCredential = {
      ...existing,
      credentialType: newType,
      verificationLevel: newType === 'premium' ? 3 : 5,
      credentialHash: this.generateCredentialHash(walletAddress, newType)
    };

    this.storeCredentialLocally(upgraded);
    console.log('⬆️ Upgraded credential:', upgraded);
    return upgraded;
  }

  // Demo utility methods
  private generateCredentialHash(address: string, type: string): string {
    return `cred_${address.slice(0, 8)}_${type}_${Date.now()}`;
  }

  private storeCredentialLocally(credential: UserCredential): void {
    if (typeof window !== 'undefined') {
      const key = `xrpl_credential_${credential.walletAddress}`;
      const credentialData = {
        ...credential,
        issuedAt: credential.issuedAt.toISOString(),
        expiresAt: credential.expiresAt.toISOString()
      };
      localStorage.setItem(key, JSON.stringify(credentialData));
    }
  }

  private getLocalCredential(walletAddress: string): UserCredential | null {
    if (typeof window === 'undefined') return null;

    try {
      const key = `xrpl_credential_${walletAddress}`;
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const credential = JSON.parse(stored);
      return {
        ...credential,
        issuedAt: new Date(credential.issuedAt),
        expiresAt: new Date(credential.expiresAt)
      };
    } catch {
      return null;
    }
  }

  /**
   * Get credential status for display
   */
  getCredentialStatus(credential: UserCredential): {
    status: string;
    color: string;
    description: string;
  } {
    const isExpired = credential.expiresAt <= new Date();

    if (isExpired) {
      return {
        status: 'Expired',
        color: 'red',
        description: 'Credential has expired'
      };
    }

    const statusMap = {
      basic: { status: 'Basic Verified', color: 'blue', description: 'Basic identity verification' },
      premium: { status: 'Premium Verified', color: 'green', description: 'Enhanced verification with higher limits' },
      enterprise: { status: 'Enterprise Verified', color: 'purple', description: 'Full enterprise verification' }
    };

    return statusMap[credential.credentialType];
  }
}

// Export singleton instance
export const credentialsManager = new XRPLCredentialsManager(
  new Client('wss://s.devnet.rippletest.net:51233')
);