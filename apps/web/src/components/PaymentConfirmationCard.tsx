"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Coins, Clock, CheckCircle, XCircle, ExternalLink, Star, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentIntentData {
  hasPaymentIntent: boolean;
  service?: string;
  serviceName?: string;
  amount?: number;
  currency?: string;
  type?: string;
  period?: string;
  confirmationMessage?: string;
  image?: string;
  url?: string;
  reviews?: string;
  provider?: string;
}

interface PaymentConfirmationCardProps {
  paymentIntent: PaymentIntentData;
  onApprove: (paymentData: PaymentIntentData, useSubscription?: boolean, subscriptionTier?: 'basic' | 'premium' | 'enterprise') => void;
  onDecline: () => void;
  isProcessing?: boolean;
  userCredential?: { verificationLevel: number; credentialType: string } | null;
}

const PaymentConfirmationCard: React.FC<PaymentConfirmationCardProps> = ({
  paymentIntent,
  onApprove,
  onDecline,
  isProcessing = false,
  userCredential
}) => {
  const [useSubscription, setUseSubscription] = useState(true); // 기본값을 true로 설정
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium' | 'enterprise'>('basic');

  if (!paymentIntent.hasPaymentIntent) {
    return null;
  }

  const xrpAmount = paymentIntent.amount ? (paymentIntent.amount * 0.5).toFixed(6) : '0';
  const isSubscriptionService = paymentIntent.type === 'subscription';

  // Check if user has sufficient verification for subscription options (모든 사용자 허용)
  const canUseSubscription = userCredential || true; // 검증이 없어도 기본 사용 허용

  return (
    <div className="w-full max-w-xs">
      <div className="bg-gradient-to-br from-[#1A2332] to-[#0F1B2E] rounded-xl p-3 border border-[#2EE6A6]/30 shadow-[0_0_20px_rgba(46,230,166,0.1)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-[#2EE6A6]/20 rounded-full flex items-center justify-center">
            <Coins className="w-4 h-4 text-[#2EE6A6]" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Payment Confirmation</h3>
            <p className="text-xs text-[#C9CDD6]">AI-initiated payment request</p>
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-[#0B1220] rounded-xl p-3 mb-3 border border-[#2EE6A6]/10">
          {/* Product/Service Header with Image */}
          <div className="flex gap-3 mb-3">
            {paymentIntent.image && (
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10">
                  <Image
                    src={paymentIntent.image}
                    alt={paymentIntent.serviceName || 'Service'}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm truncate">{paymentIntent.serviceName}</div>
              {paymentIntent.provider && (
                <div className="text-xs text-[#C9CDD6]">by {paymentIntent.provider}</div>
              )}
              {paymentIntent.reviews && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-[#C9CDD6]">{paymentIntent.reviews}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Information */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <div className="text-xs text-[#C9CDD6] mb-1">Amount (USD)</div>
              <div className="font-bold text-[#2EE6A6] text-sm">${paymentIntent.amount}</div>
            </div>
            <div>
              <div className="text-xs text-[#C9CDD6] mb-1">Amount (XRP)</div>
              <div className="font-bold text-blue-400 text-sm">{xrpAmount} XRP</div>
            </div>
          </div>

          {/* Subscription/Type Info */}
          {paymentIntent.type === 'subscription' && paymentIntent.period && (
            <div className="mb-2">
              <div className="font-medium text-white text-sm flex items-center">
                <Clock className="w-3 h-3 mr-1 text-[#2EE6A6]" />
                {paymentIntent.type} • {paymentIntent.period}
                <div className="inline-flex items-center ml-2 text-xs bg-[#2EE6A6]/10 text-[#2EE6A6] px-2 py-0.5 rounded-full">
                  Recurring
                </div>
              </div>
            </div>
          )}

          {/* URL Link */}
          {paymentIntent.url && (
            <div className="mt-2">
              <a
                href={paymentIntent.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#2EE6A6] hover:text-[#26D396] transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Visit {paymentIntent.provider || 'Website'}
              </a>
            </div>
          )}
        </div>

        {/* Confirmation Message */}
        {paymentIntent.confirmationMessage && (
          <div className="mb-3">
            <p className="text-[#C9CDD6] text-center italic text-sm">
              "{paymentIntent.confirmationMessage}"
            </p>
          </div>
        )}

        {/* Credential Status */}
        {userCredential && (
          <div className="mb-3 p-2 bg-[#0B1220]/50 rounded-lg border border-[#2EE6A6]/10">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3 h-3 text-[#2EE6A6]" />
              <span className="text-xs text-[#2EE6A6] font-medium">
                {userCredential.credentialType} Verified
              </span>
              <span className="text-xs text-[#C9CDD6]">
                (Level {userCredential.verificationLevel})
              </span>
            </div>
            <div className="text-xs text-[#C9CDD6]">
              Payment limit: ${[50, 200, 1000, 5000, 10000][userCredential.verificationLevel - 1] || 0}
            </div>
          </div>
        )}

        {/* MPToken Subscription Options - Always show for all services */}
        {canUseSubscription && (
          <div className="mb-3 p-3 bg-[#0B1220]/50 rounded-lg border border-[#2EE6A6]/10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3 h-3 text-[#2EE6A6]" />
              <span className="text-xs text-[#2EE6A6] font-medium">
                MPToken Subscription
              </span>
            </div>

            <div className="mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSubscription}
                  onChange={(e) => setUseSubscription(e.target.checked)}
                  className="w-3 h-3 rounded border-[#2EE6A6]/30 bg-transparent text-[#2EE6A6] accent-[#2EE6A6]"
                />
                <span className="text-xs text-white">
                  Create subscription token
                </span>
              </label>
            </div>

            {useSubscription && (
              <div className="space-y-2">
                <div className="text-xs text-[#C9CDD6] mb-1">Select tier:</div>
                <div className="grid grid-cols-3 gap-1">
                  {(['basic', 'premium', 'enterprise'] as const).map((tier) => (
                    <Button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      size="sm"
                      variant={selectedTier === tier ? "default" : "outline"}
                      className={`text-xs py-1 px-2 ${
                        selectedTier === tier
                          ? 'bg-[#2EE6A6] text-[#0B1220]'
                          : 'border-[#2EE6A6]/30 text-[#2EE6A6] hover:bg-[#2EE6A6]/10'
                      }`}
                    >
                      {tier}
                    </Button>
                  ))}
                </div>
                <div className="text-xs text-[#C9CDD6]">
                  {selectedTier === 'basic' && '100 uses/month'}
                  {selectedTier === 'premium' && '1,000 uses/month'}
                  {selectedTier === 'enterprise' && '10,000 uses/month'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              console.log('🔍 PaymentConfirmationCard onClick:', {
                useSubscription,
                selectedTier,
                paymentIntent
              });
              onApprove(paymentIntent, useSubscription, selectedTier);
            }}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-[#2EE6A6] to-[#26D396] text-[#0B1220] py-2.5 px-4 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(46,230,166,0.4)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center text-sm"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0B1220] mr-2"></div>
                Processing Payment...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {useSubscription ? 'Pay + Create MPToken' : 'Approve Payment'}
              </>
            )}
          </button>

          <button
            onClick={onDecline}
            disabled={isProcessing}
            className="w-full bg-transparent border border-red-500/50 text-red-400 py-2.5 px-4 rounded-xl font-medium transition-all duration-300 hover:bg-red-500/10 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Decline
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-3 pt-3 border-t border-[#2EE6A6]/10">
          <div className="flex items-center justify-center text-xs text-[#C9CDD6]">
            <CheckCircle className="w-3 h-3 mr-1" />
            Secured by XRPL • AI Payment Protocol
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmationCard;