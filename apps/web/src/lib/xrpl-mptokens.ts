// XRPL MPTokensV1 utility for AI service subscriptions
import { Client, Wallet, Transaction } from 'xrpl';

export interface SubscriptionToken {
  tokenId: string;
  serviceId: string;
  serviceName: string;
  subscriberAddress: string;
  issuerAddress: string;
  subscriptionType: 'monthly' | 'yearly' | 'lifetime';
  issuedAt: Date;
  expiresAt: Date;
  remainingUsage: number;
  maxUsage: number;
  isActive: boolean;
  metadata: {
    features: string[];
    tier: 'basic' | 'premium' | 'enterprise';
    autoRenew: boolean;
  };
}

export interface TokenCreationResult {
  success: boolean;
  tokenId?: string;
  transaction?: string;
  error?: string;
}

export class XRPLMPTokenManager {
  private client: Client;
  private issuerWallet: Wallet;

  constructor(client: Client, issuerSeed?: string) {
    this.client = client;
    // Demo issuer wallet for hackathon
    this.issuerWallet = issuerSeed ? Wallet.fromSeed(issuerSeed) : Wallet.generate();
  }

  /**
   * Create subscription token for AI service
   */
  async createSubscriptionToken(
    serviceId: string,
    serviceName: string,
    subscriberAddress: string,
    subscriptionType: 'monthly' | 'yearly' | 'lifetime' = 'monthly',
    tier: 'basic' | 'premium' | 'enterprise' = 'basic'
  ): Promise<SubscriptionToken> {
    const now = new Date();
    const duration = this.getSubscriptionDuration(subscriptionType);
    const expiresAt = subscriptionType === 'lifetime'
      ? new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000) // 100 years for "lifetime"
      : new Date(now.getTime() + duration);

    const maxUsage = this.getMaxUsage(tier, subscriptionType);

    const token: SubscriptionToken = {
      tokenId: this.generateTokenId(serviceId, subscriberAddress),
      serviceId,
      serviceName,
      subscriberAddress,
      issuerAddress: this.issuerWallet.address,
      subscriptionType,
      issuedAt: now,
      expiresAt,
      remainingUsage: maxUsage,
      maxUsage,
      isActive: true,
      metadata: {
        features: this.getServiceFeatures(serviceId, tier),
        tier,
        autoRenew: subscriptionType !== 'lifetime'
      }
    };

    // For demo, store locally. In real implementation, this would create MPToken on XRPL
    this.storeTokenLocally(token);

    console.log('🎫 Created subscription token:', token);
    return token;
  }

  /**
   * Verify and consume subscription token for AI service usage
   */
  async verifyAndConsumeToken(
    tokenId: string,
    usageAmount: number = 1
  ): Promise<{ isValid: boolean; token?: SubscriptionToken; error?: string }> {
    try {
      const token = this.getLocalToken(tokenId);

      if (!token) {
        return { isValid: false, error: 'Token not found' };
      }

      if (!token.isActive) {
        return { isValid: false, error: 'Token is inactive' };
      }

      if (token.expiresAt <= new Date()) {
        token.isActive = false;
        this.storeTokenLocally(token);
        return { isValid: false, error: 'Token has expired' };
      }

      if (token.remainingUsage < usageAmount) {
        return { isValid: false, error: 'Insufficient usage remaining' };
      }

      // Consume usage
      token.remainingUsage -= usageAmount;

      // Deactivate if usage is exhausted
      if (token.remainingUsage <= 0) {
        token.isActive = false;
      }

      this.storeTokenLocally(token);

      return { isValid: true, token };

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Get user's active subscription tokens
   */
  getUserSubscriptions(userAddress: string): SubscriptionToken[] {
    if (typeof window === 'undefined') return [];

    const tokens: SubscriptionToken[] = [];
    const tokenMap = new Map<string, SubscriptionToken>(); // To prevent duplicates

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('mptoken_') || key?.startsWith('onchain_mptoken_')) {
          const tokenData = localStorage.getItem(key);
          if (tokenData) {
            const token = JSON.parse(tokenData);
            token.issuedAt = new Date(token.issuedAt);
            token.expiresAt = new Date(token.expiresAt);

            // Handle both old format (subscriberAddress) and new format (holder)
            const tokenHolder = token.subscriberAddress || token.holder;

            if (tokenHolder === userAddress) {
              // Create unique key based on service and tier to prevent duplicates
              const uniqueKey = `${token.serviceId}_${token.tier || token.metadata?.tier}`;

              // Only keep the most recent token for each service+tier combination
              if (!tokenMap.has(uniqueKey) || token.issuedAt > tokenMap.get(uniqueKey)!.issuedAt) {
                tokenMap.set(uniqueKey, token);
              }
            }
          }
        }
      }

      // Convert map values back to array
      tokens.push(...tokenMap.values());
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
    }

    return tokens.filter(token => token.isActive && token.expiresAt > new Date());
  }

  /**
   * Renew subscription token
   */
  async renewSubscription(tokenId: string): Promise<SubscriptionToken> {
    const token = this.getLocalToken(tokenId);
    if (!token) {
      throw new Error('Token not found');
    }

    const duration = this.getSubscriptionDuration(token.subscriptionType);
    const newExpiresAt = new Date(Date.now() + duration);
    const maxUsage = this.getMaxUsage(token.metadata.tier, token.subscriptionType);

    const renewedToken: SubscriptionToken = {
      ...token,
      expiresAt: newExpiresAt,
      remainingUsage: maxUsage,
      maxUsage,
      isActive: true
    };

    this.storeTokenLocally(renewedToken);
    console.log('🔄 Renewed subscription token:', renewedToken);
    return renewedToken;
  }

  /**
   * Check if user has valid subscription for service
   */
  hasValidSubscription(userAddress: string, serviceId: string): boolean {
    const userTokens = this.getUserSubscriptions(userAddress);
    return userTokens.some(token =>
      token.serviceId === serviceId &&
      token.isActive &&
      token.expiresAt > new Date() &&
      token.remainingUsage > 0
    );
  }

  /**
   * Get subscription status for display
   */
  getSubscriptionStatus(token: SubscriptionToken): {
    status: string;
    color: string;
    daysRemaining: number;
    usagePercentage: number;
  } {
    const now = new Date();
    // Ensure expiresAt is a Date object
    const expiresAt = token.expiresAt instanceof Date ? token.expiresAt : new Date(token.expiresAt);
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const usagePercentage = ((token.maxUsage - token.remainingUsage) / token.maxUsage) * 100;

    let status = 'Active';
    let color = 'green';

    if (!token.isActive) {
      status = 'Inactive';
      color = 'gray';
    } else if (token.expiresAt <= now) {
      status = 'Expired';
      color = 'red';
    } else if (daysRemaining <= 7) {
      status = 'Expiring Soon';
      color = 'orange';
    } else if (token.remainingUsage <= 0) {
      status = 'Usage Exhausted';
      color = 'red';
    } else if (usagePercentage > 80) {
      status = 'High Usage';
      color = 'yellow';
    }

    return { status, color, daysRemaining, usagePercentage };
  }

  // Utility methods
  private generateTokenId(serviceId: string, userAddress: string): string {
    return `mptoken_${serviceId}_${userAddress.slice(0, 8)}_${Date.now()}`;
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

  private getServiceFeatures(serviceId: string, tier: 'basic' | 'premium' | 'enterprise'): string[] {
    const allFeatures = {
      'netflix-basic': {
        basic: ['1080p Streaming', '1 Device'],
        premium: ['4K Streaming', '4 Devices', 'Downloads'],
        enterprise: ['4K Streaming', 'Unlimited Devices', 'Downloads', 'Priority Support']
      },
      'spotify-premium': {
        basic: ['Ad-free Music', 'Offline Downloads'],
        premium: ['High Quality Audio', 'Unlimited Skips', 'Spotify Connect'],
        enterprise: ['Lossless Audio', 'Early Access', 'Family Plan']
      },
      'chatgpt-plus': {
        basic: ['GPT-4 Access', 'Faster Response'],
        premium: ['GPT-4 Turbo', 'DALL-E Access', 'Advanced Data Analysis'],
        enterprise: ['Custom Models', 'API Access', 'Priority Support', 'Extended Context']
      }
    };

    return allFeatures[serviceId as keyof typeof allFeatures]?.[tier] || ['Standard Features'];
  }

  private storeTokenLocally(token: SubscriptionToken): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mptoken_${token.tokenId}`, JSON.stringify(token));
    }
  }

  private getLocalToken(tokenId: string): SubscriptionToken | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(`mptoken_${tokenId}`);
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
}

// Export singleton instance
export const mpTokenManager = new XRPLMPTokenManager(
  new Client('wss://s.devnet.rippletest.net:51233')
);