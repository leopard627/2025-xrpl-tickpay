// Debug utilities for checking stored data
export class DebugUtils {
  /**
   * Check all stored credentials in localStorage
   */
  static checkStoredCredentials(): any[] {
    if (typeof window === 'undefined') return [];

    const credentials = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('xrpl_credential_')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const credential = JSON.parse(stored);
            credentials.push({
              key,
              credential: {
                ...credential,
                issuedAt: new Date(credential.issuedAt),
                expiresAt: new Date(credential.expiresAt)
              }
            });
          }
        } catch (e) {
          console.error(`Failed to parse credential ${key}:`, e);
        }
      }
    }
    return credentials;
  }

  /**
   * Check all stored MPTokens in localStorage
   */
  static checkStoredMPTokens(): any[] {
    if (typeof window === 'undefined') return [];

    const tokens = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('mptoken_')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const token = JSON.parse(stored);
            tokens.push({
              key,
              token: {
                ...token,
                issuedAt: new Date(token.issuedAt),
                expiresAt: new Date(token.expiresAt)
              }
            });
          }
        } catch (e) {
          console.error(`Failed to parse MPToken ${key}:`, e);
        }
      }
    }
    return tokens;
  }

  /**
   * Print formatted debug info to console
   */
  static printDebugInfo(walletAddress?: string): void {
    console.log('\n🔍 ==========[ DEBUG INFO ]==========');

    // Credentials
    const credentials = this.checkStoredCredentials();
    console.log(`\n🔐 Stored Credentials (${credentials.length}):`);
    credentials.forEach((item, index) => {
      const cred = item.credential;
      console.log(`[${index}] ${cred.walletAddress}:`);
      console.log(`    Type: ${cred.credentialType} (Level ${cred.verificationLevel})`);
      console.log(`    Verified: ${cred.isVerified}`);
      console.log(`    Expires: ${cred.expiresAt.toLocaleDateString()}`);
      console.log(`    Hash: ${cred.credentialHash}`);
    });

    // MPTokens
    const tokens = this.checkStoredMPTokens();
    console.log(`\n🎫 Stored MPTokens (${tokens.length}):`);
    tokens.forEach((item, index) => {
      const token = item.token;
      console.log(`[${index}] ${token.serviceName} (${token.serviceId}):`);
      console.log(`    Owner: ${token.subscriberAddress}`);
      console.log(`    Tier: ${token.metadata.tier}`);
      console.log(`    Type: ${token.subscriptionType}`);
      console.log(`    Usage: ${token.remainingUsage}/${token.maxUsage}`);
      console.log(`    Active: ${token.isActive}`);
      console.log(`    Expires: ${token.expiresAt.toLocaleDateString()}`);
      console.log(`    TokenID: ${token.tokenId}`);
    });

    // Filter by wallet if provided
    if (walletAddress) {
      const userCredentials = credentials.filter(item =>
        item.credential.walletAddress === walletAddress
      );
      const userTokens = tokens.filter(item =>
        item.token.subscriberAddress === walletAddress
      );

      console.log(`\n👤 Data for wallet ${walletAddress}:`);
      console.log(`    Credentials: ${userCredentials.length}`);
      console.log(`    MPTokens: ${userTokens.length}`);
    }

    console.log('\n🔍 ===================================\n');
  }

  /**
   * Clear all stored data (for testing)
   */
  static clearAllStoredData(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('xrpl_credential_') || key?.startsWith('mptoken_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log(`🧹 Cleared ${keysToRemove.length} stored items`);
  }

  /**
   * Export all data as JSON
   */
  static exportData(): string {
    const credentials = this.checkStoredCredentials();
    const tokens = this.checkStoredMPTokens();

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      credentials,
      tokens
    }, null, 2);
  }
}

// Make it available globally for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).DebugUtils = DebugUtils;
  (window as any).checkMPTokens = () => DebugUtils.printDebugInfo();
}