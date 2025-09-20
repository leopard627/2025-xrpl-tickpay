"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, Clock, AlertTriangle, Zap, Bug } from 'lucide-react';
import { credentialsManager, UserCredential } from '@/lib/xrpl-credentials';
import { mpTokenManager, SubscriptionToken } from '@/lib/xrpl-mptokens';
import { DebugUtils } from '@/lib/debug-utils';

interface UserCredentialCardProps {
  walletAddress: string | null;
  onCredentialUpdate?: (credential: UserCredential | null) => void;
  activeSubscriptions?: any[];
}

const UserCredentialCard: React.FC<UserCredentialCardProps> = ({
  walletAddress,
  onCredentialUpdate,
  activeSubscriptions = []
}) => {
  const [credential, setCredential] = useState<UserCredential | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      loadCredential();
      loadRealMPTokens(); // Load actual on-chain MPTokens
    } else {
      setCredential(null);
      setSubscriptions([]);
    }
  }, [walletAddress, activeSubscriptions]);

  const loadRealMPTokens = async () => {
    if (!walletAddress) return;

    try {
      // Import MPToken manager
      const { createOnChainMPTokenManager } = await import('@/lib/xrpl-onchain-mptokens');
      const mpTokenManager = createOnChainMPTokenManager(process.env.NEXT_PUBLIC_ISSUER_SEED || 'sDEVELOPMENT_ISSUER_SEED_PLACEHOLDER');

      console.log('🔍 Querying real XRPL MPTokens for wallet:', walletAddress);
      const realTokens = await mpTokenManager.getHolderMPTokens(walletAddress);

      console.log('🎫 Found real MPTokens:', realTokens);

      // Convert to SubscriptionToken format for display
      const subscriptionTokens = realTokens.map(token => ({
        tokenId: token.tokenId,
        serviceName: token.serviceName,
        tier: token.tier,
        subscriptionType: token.subscriptionType,
        maxUsage: token.maxUsage,
        remainingUsage: token.remainingUsage,
        metadata: {
          tier: token.tier,
          type: 'RealMPToken',
          onChain: true,
          txHash: token.txHash,
          issuer: token.issuer,
          holder: token.holder
        }
      }));

      setSubscriptions(subscriptionTokens);

    } catch (error) {
      console.error('❌ Failed to load real MPTokens:', error);
      // Fallback to props
      setSubscriptions(activeSubscriptions);
    }
  };

  const loadCredential = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    try {
      const result = await credentialsManager.verifyUserCredentials(walletAddress);
      const cred = result.isValid ? result.credential || null : null;
      setCredential(cred);
      onCredentialUpdate?.(cred);
    } catch (error) {
      console.error('Failed to load credential:', error);
      setCredential(null);
    } finally {
      setIsLoading(false);
    }
  };


  const handleUpgrade = async (newType: 'premium' | 'enterprise') => {
    if (!walletAddress) return;

    setIsLoading(true);
    try {
      const upgraded = await credentialsManager.upgradeCredential(walletAddress, newType);
      setCredential(upgraded);
      onCredentialUpdate?.(upgraded);
    } catch (error) {
      console.error('Failed to upgrade credential:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!walletAddress) {
    return (
      <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
        <CardContent className="p-4 text-center text-[#C9CDD6]">
          Connect wallet to view credentials
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
        <CardContent className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2EE6A6] mx-auto"></div>
          <div className="text-[#C9CDD6] mt-2">Loading credentials...</div>
        </CardContent>
      </Card>
    );
  }

  const credStatus = credential ? credentialsManager.getCredentialStatus(credential) : null;

  return (
    <div className="space-y-4">
      {/* User Credential Card */}
      <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-[#2EE6A6]">
            <Shield className="h-4 w-4" />
            User Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {credential && credStatus ? (
            <>
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={`text-xs border-${credStatus.color}-500 text-${credStatus.color}-400`}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {credStatus.status}
                </Badge>
                <div className="text-xs text-[#C9CDD6]">
                  Level {credential.verificationLevel}
                </div>
              </div>

              <div className="text-xs text-[#C9CDD6]">
                {credStatus.description}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[#C9CDD6]">Spending Limit</div>
                  <div className="text-white font-medium">
                    ${[50, 200, 1000, 5000, 10000][credential.verificationLevel - 1]}
                  </div>
                </div>
                <div>
                  <div className="text-[#C9CDD6]">Expires</div>
                  <div className="text-white font-medium">
                    {credential.expiresAt.toLocaleDateString()}
                  </div>
                </div>
              </div>

              {credential.credentialType === 'basic' && (
                <div className="pt-2 border-t border-[#2EE6A6]/10">
                  <div className="text-xs text-[#C9CDD6] mb-2">Upgrade for higher limits</div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpgrade('premium')}
                      size="sm"
                      variant="outline"
                      className="text-xs border-[#2EE6A6]/50 text-[#2EE6A6] hover:bg-[#2EE6A6]/10"
                      disabled={isLoading}
                    >
                      Premium ($1K)
                    </Button>
                    <Button
                      onClick={() => handleUpgrade('enterprise')}
                      size="sm"
                      variant="outline"
                      className="text-xs border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                      disabled={isLoading}
                    >
                      Enterprise ($10K)
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-xs text-[#C9CDD6]">No verification found</div>
              <Button
                onClick={loadCredential}
                size="sm"
                className="mt-2 bg-[#2EE6A6] text-[#0B1220] hover:bg-[#26D396]"
              >
                Create Basic Verification
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      {subscriptions.length > 0 && (
        <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-[#2EE6A6]">
              <Zap className="h-4 w-4" />
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {subscriptions.map((subscription) => {
              const status = mpTokenManager.getSubscriptionStatus(subscription);
              return (
                <div key={subscription.tokenId} className="border border-[#2EE6A6]/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-white text-sm">
                      {subscription.serviceName}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs border-${status.color}-500 text-${status.color}-400`}
                    >
                      {status.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#C9CDD6]">
                    <div>
                      <div>Tier: {subscription.tier || subscription.metadata?.tier}</div>
                      <div>Type: {subscription.subscriptionType}</div>
                    </div>
                    <div>
                      <div>Usage: {subscription.remainingUsage}/{subscription.maxUsage}</div>
                      <div>Days left: {status.daysRemaining}</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-[#2EE6A6] h-1 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(0, (subscription.remainingUsage / subscription.maxUsage) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default UserCredentialCard;