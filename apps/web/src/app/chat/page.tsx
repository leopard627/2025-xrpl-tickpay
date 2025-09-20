'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Zap, Coins } from 'lucide-react';
import { useXRPLWallet } from '@/hooks/useXRPLWallet';
import { useTransactions } from '@/contexts/TransactionContext';
import { toast } from 'sonner';
import XamanConnect from '@/components/XamanConnect';
import PaymentQRModal from '@/components/PaymentQRModal';
import PaymentConfirmationCard from '@/components/PaymentConfirmationCard';
import UserCredentialCard from '@/components/UserCredentialCard';
import { credentialsManager, UserCredential } from '@/lib/xrpl-credentials';
import { mpTokenManager } from '@/lib/xrpl-mptokens';
import { createSimpleMPTokenManager } from '@/lib/xrpl-mptoken-simple';
import { DebugUtils } from '@/lib/debug-utils';

interface PaymentIntentData {
  hasPaymentIntent: boolean;
  service?: string;
  serviceName?: string;
  amount?: number;
  currency?: string;
  type?: string;
  period?: string;
  confirmationMessage?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
  paymentIntent?: PaymentIntentData;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  });
  const [sessionTokens, setSessionTokens] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentQR, setPaymentQR] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDeepLink, setPaymentDeepLink] = useState<string | null>(null);
  const [xamanUuid, setXamanUuid] = useState<string | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [completedPayments, setCompletedPayments] = useState<Set<string>>(new Set());
  const [userCredential, setUserCredential] = useState<UserCredential | null>(null);
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [showOptInModal, setShowOptInModal] = useState(false);
  const [optInQR, setOptInQR] = useState<string | null>(null);
  const [optInDeepLink, setOptInDeepLink] = useState<string | null>(null);
  const [optInUuid, setOptInUuid] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { isConnected, balance, sendPayment, address: walletAddress, isSending } = useXRPLWallet();
  const { addTransaction, updateTransaction } = useTransactions();

  // 디버깅을 위한 로그
  console.log('🔍 Chat Page - wallet state:', {
    isConnected,
    balance,
    hasBalance: !!balance
  });

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        // Force scroll to bottom with small delay for content rendering
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 50);
      }
    }
  };

  // Auto scroll when messages change or when loading
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100); // Small delay to ensure content is rendered

    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  // Also scroll when payment processing state changes
  useEffect(() => {
    if (isPaymentProcessing) {
      scrollToBottom();
    }
  }, [isPaymentProcessing]);

  const calculateTokenCost = (tokens: number): number => {
    // 해커톤 데모용으로 토큰당 비용을 크게 설정
    // 1000토큰당 1 XRP로 설정 (최소 결제 금액 확보)
    return Math.max(0.001, (tokens / 1000) * 1.0); // 최소 0.001 XRP 보장
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          conversationHistory,
          streaming: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      let totalUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                toast.error('Chat Error: ' + data.error);
                break;
              }

              if (data.content) {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: msg.content + data.content }
                      : msg
                  )
                );
                // Auto-scroll during streaming
                scrollToBottom();
              }

              if (data.promptTokens !== undefined) {
                totalUsage = {
                  promptTokens: data.promptTokens,
                  completionTokens: data.completionTokens,
                  totalTokens: data.totalTokens,
                };
                setTokenUsage(totalUsage);
              }

              if (data.finished) {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? {
                          ...msg,
                          tokens: totalUsage.totalTokens,
                          paymentIntent: data.paymentIntent || undefined
                        }
                      : msg
                  )
                );
                setSessionTokens(prev => prev + totalUsage.totalTokens);

                // Log payment intent for debugging
                if (data.paymentIntent?.hasPaymentIntent) {
                  console.log('🤖 AI detected payment intent:', data.paymentIntent);
                }

                break;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const payForTokens = async () => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (sessionTokens === 0) {
      toast.error('No tokens to pay for');
      return;
    }

    const cost = calculateTokenCost(sessionTokens);
    // 실제 Provider 주소 (ChatGPT API 서비스 제공자)
    const providerAddress = 'rDEVELOPMENT_PROVIDER_ADDRESS'; // 환경변수에서 가져온 유효한 주소
    let transactionId: string | null = null;

    try {
      toast.info('🚀 실제 XRPL 결제를 시작합니다...');

      // 트랜잭션 기록 추가 (pending 상태)
      transactionId = addTransaction({
        type: 'payment_channel',
        channelId: `chatgpt_${Date.now()}`,
        providerAddress,
        payerAddress: walletAddress,
        rlusdAmount: cost * 0.5, // XRP를 RLUSD 환산 (임시 환율)
        xrpAmount: cost,
        elapsedSeconds: 0, // ChatGPT는 시간 기반이 아님
        tokensProcessed: sessionTokens,
        usageProofs: [],
        status: 'pending',
        streamingSessionId: `chatgpt_session_${Date.now()}`
      });

      // QR 코드 콜백 함수
      const handleQRCode = (qrCode: string, payload: unknown) => {
        setPaymentQR(qrCode);
        setPaymentAmount(cost);
        setPaymentDeepLink((payload as { next?: { always?: string } })?.next?.always || null);
        setShowPaymentModal(true);
      };

      // 실제 Xaman을 통한 결제 실행
      const result = await sendPayment(
        providerAddress,
        cost,
        `Payment for ${sessionTokens} ChatGPT tokens - Session ID: ${transactionId.slice(-8)}`,
        handleQRCode
      );

      // 결제 성공 시 트랜잭션 기록 업데이트
      updateTransaction(transactionId, {
        status: 'completed',
        paymentTx: result.txHash,
        claimTx: result.txHash
      });

      toast.success(`✅ 실제 XRPL 결제 완료! ${cost.toFixed(6)} XRP for ${sessionTokens} tokens`);
      console.log(`🎉 블록체인에 기록된 트랜잭션: https://devnet.xrpl.org/transactions/${result.txHash}`);

      // 결제 완료 시 모달 닫기
      setShowPaymentModal(false);
      setPaymentQR(null);
      setPaymentDeepLink(null);

      // 세션 토큰 리셋
      setSessionTokens(0);

    } catch (error) {
      console.error('❌ 실제 XRPL 결제 실패:', error);

      // 실패 시 트랜잭션 상태 업데이트
      if (transactionId) {
        updateTransaction(transactionId, {
          status: 'failed'
        });
      }

      // 에러 시 모달 닫기
      setShowPaymentModal(false);
      setPaymentQR(null);
      setPaymentDeepLink(null);

      toast.error(`결제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // AI-initiated payment handlers
  const handlePaymentApproval = async (
    paymentData: PaymentIntentData,
    useSubscription: boolean = false,
    subscriptionTier: 'basic' | 'premium' | 'enterprise' = 'basic',
    messageId?: string
  ) => {
    // DEBUG: Log parameters
    console.log('🔍 handlePaymentApproval called with:', {
      paymentData,
      useSubscription,
      subscriptionTier,
      messageId
    });

    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!paymentData.amount) {
      toast.error('Invalid payment amount');
      return;
    }

    setIsPaymentProcessing(true);

    try {
      // Step 1: Verify user credentials
      console.log('🔐 Verifying user credentials...');
      const credentialResult = await credentialsManager.verifyUserCredentials(walletAddress);

      if (!credentialResult.isValid || !credentialResult.credential) {
        toast.error('Unable to verify user credentials');
        setIsPaymentProcessing(false);
        return;
      }

      const userCred = credentialResult.credential;
      console.log('✅ User credential verified:', userCred);

      // Step 2: Check payment authorization
      const canAuthorize = credentialsManager.canAuthorizeAIPayment(userCred, paymentData.amount);
      if (!canAuthorize) {
        toast.error(`Payment amount exceeds your verification limit. Please upgrade your credential.`);
        setIsPaymentProcessing(false);
        return;
      }

      // Step 3: Check for existing subscription token
      if (paymentData.service && mpTokenManager.hasValidSubscription(walletAddress, paymentData.service)) {
        const result = await mpTokenManager.verifyAndConsumeToken(
          `mptoken_${paymentData.service}_${walletAddress.slice(0, 8)}_*`, // This would need proper token lookup
          1
        );

        if (result.isValid) {
          toast.success(`✅ Used existing subscription token for ${paymentData.serviceName}`);

          // Add success message to chat
          const successMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `🎫 Used your existing subscription token for ${paymentData.serviceName}! Remaining usage: ${result.token?.remainingUsage}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, successMessage]);

          if (messageId) {
            setCompletedPayments(prev => new Set(prev).add(messageId));
          }
          setIsPaymentProcessing(false);
          return;
        }
      }
    } catch (error) {
      console.error('Credential verification failed:', error);
      toast.error('Credential verification failed');
      setIsPaymentProcessing(false);
      return;
    }

    // Convert USD to XRP (mock rate: 1 USD = 0.5 XRP)
    const xrpAmount = paymentData.amount * 0.5;
    // Provider address should match MPToken issuer
    const providerAddress = 'rDEVELOPMENT_PROVIDER_ADDRESS'; // Same as MPToken issuer

    try {
      // New flow: Handle MPToken opt-in first, then payment
      let subscriptionToken = null;

      // DEBUG: Log MPToken decision
      console.log('🎫 MPToken Creation Decision:', {
        useSubscription,
        hasService: !!paymentData.service,
        hasServiceName: !!paymentData.serviceName,
        service: paymentData.service,
        serviceName: paymentData.serviceName,
        willCreateMPToken: useSubscription && paymentData.service && paymentData.serviceName
      });

      // Step 1: Create real XRPL MPToken if subscription requested
      if (useSubscription && paymentData.service && paymentData.serviceName) {
        try {
          console.log('🎫 Step 1: Creating real XRPL MPToken (Simplified Flow)...');

          // Create MPToken manager with ADMIN issuer account
          const adminSeed = process.env.NEXT_PUBLIC_ADMIN_SEED || 'sDEVELOPMENT_ADMIN_SEED_PLACEHOLDER';
          const mpTokenManager = createSimpleMPTokenManager(adminSeed);

          // Try direct MPToken transfer (will handle opt-in if needed)
          const mpTokenResult = await mpTokenManager.sendMPTokenToUser(
            walletAddress,
            paymentData.service,
            subscriptionTier
          );

          if (mpTokenResult.success && mpTokenResult.tokenId) {
            // Success - MPToken transferred directly (user already opted in)
            const now = new Date();
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            subscriptionToken = {
              tokenId: mpTokenResult.tokenId,
              serviceId: paymentData.service,
              serviceName: paymentData.serviceName,
              subscriberAddress: walletAddress,
              subscriptionType: 'monthly',
              tier: subscriptionTier,
              isActive: true,
              maxUsage: 100,
              remainingUsage: 100,
              issuedAt: now,
              expiresAt: expiresAt,
              metadata: {
                tier: subscriptionTier,
                type: 'RealMPToken',
                onChain: true,
                txHash: mpTokenResult.txHash || '',
                issuer: 'rDEVELOPMENT_ISSUER_ADDRESS',
                holder: walletAddress,
                xamanUuid: '',
                issuanceId: mpTokenResult.tokenId
              }
            };

            toast.success(`🎫 Real XRPL MPToken created: ${subscriptionTier} tier`);
            console.log('✅ Real XRPL MPToken created:', {
              tokenId: subscriptionToken.tokenId,
              txHash: mpTokenResult.txHash,
              onChain: true
            });

            setActiveSubscriptions(prev => {
              const filtered = prev.filter(sub => sub.serviceId !== paymentData.service);
              return [...filtered, subscriptionToken];
            });

          } else if (mpTokenResult.requiresUserOptIn && mpTokenResult.xamanOptIn) {
            // User opt-in required - show QR and handle it
            console.log('🔐 User opt-in required for MPToken');
            toast.info('📱 MPToken Authorization Required', {
              description: 'Please approve the MPToken authorization in Xaman to continue.',
              duration: 10000
            });

            setOptInQR(mpTokenResult.xamanOptIn.qrCode);
            setOptInDeepLink(mpTokenResult.xamanOptIn.deepLink);
            setOptInUuid(mpTokenResult.xamanOptIn.uuid);
            setShowOptInModal(true);

            // Open Xaman automatically
            window.open(mpTokenResult.xamanOptIn.deepLink, '_blank');

            // Simple polling for completion with retry logic
            let pollCount = 0;
            const pollInterval = setInterval(async () => {
              try {
                pollCount++;
                if (pollCount > 60) { // 5 minutes timeout
                  clearInterval(pollInterval);
                  toast.error('Opt-in timeout. Please try again.');
                  setShowOptInModal(false);
                  return;
                }

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const response = await fetch(`${apiUrl}/mptoken/optin/status/${mpTokenResult.xamanOptIn?.uuid}`);

                if (response.ok) {
                  const status = await response.json();

                  if (status.signed && status.resolved) {
                    clearInterval(pollInterval);
                    setShowOptInModal(false);
                    setOptInQR(null);
                    setOptInDeepLink(null);
                    setOptInUuid(null);

                    toast.success('✅ MPToken authorized! Sending token now...');

                    // Now retry MPToken transfer after opt-in (simplified)
                    const retryResult = await mpTokenManager.sendMPTokenToUser(
                      walletAddress,
                      paymentData.service,
                      subscriptionTier
                    );

                    if (retryResult.success) {
                      const now = new Date();
                      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                      subscriptionToken = {
                        tokenId: retryResult.tokenId,
                        serviceId: paymentData.service,
                        serviceName: paymentData.serviceName,
                        subscriberAddress: walletAddress,
                        subscriptionType: 'monthly',
                        tier: subscriptionTier,
                        isActive: true,
                        maxUsage: 100,
                        remainingUsage: 100,
                        issuedAt: now,
                        expiresAt: expiresAt,
                        metadata: {
                          tier: subscriptionTier,
                          type: 'RealMPToken',
                          onChain: true,
                          txHash: retryResult.txHash || '',
                          issuer: 'rDEVELOPMENT_ISSUER_ADDRESS',
                          holder: walletAddress,
                          xamanUuid: mpTokenResult.xamanOptIn?.uuid || '',
                          issuanceId: retryResult.tokenId
                        }
                      };

                      setActiveSubscriptions(prev => {
                        const filtered = prev.filter(sub => sub.serviceId !== paymentData.service);
                        return [...filtered, subscriptionToken];
                      });

                      toast.success(`🎫 Real MPToken transferred: ${subscriptionTier} tier`);
                    }

                    return; // Proceed to payment after successful MPToken
                  }
                }
              } catch (error) {
                console.log('Polling error:', error);
              }
            }, 5000);

            return; // Don't continue to payment yet, wait for opt-in

          } else {
            throw new Error(`MPToken creation failed: ${mpTokenResult.error}`);
          }

        } catch (error) {
          console.error('MPToken creation failed:', error);
          toast.error(`MPToken failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Continue to regular payment if MPToken fails
        }
      }

      // Step 2: Process regular payment (if no subscription or MPToken succeeded)
      if (!useSubscription || subscriptionToken) {
        console.log('💰 Processing service payment...');

        const handleQRCode = (qrCode: string, payload: unknown) => {
          setPaymentQR(qrCode);
          setPaymentAmount(xrpAmount);
          setPaymentDeepLink((payload as { next?: { always?: string } })?.next?.always || null);
          setShowPaymentModal(true);
        };

        const paymentResult = await sendPayment(
          providerAddress,
          xrpAmount,
          `AI Payment: ${paymentData.serviceName} - $${paymentData.amount}`,
          handleQRCode
        );

        if (!paymentResult.success) {
          throw new Error('Service payment failed');
        }

        toast.success(`💳 Service payment completed for ${paymentData.serviceName}`);

        // Final success message
        const finalSuccessMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: subscriptionToken
            ? `🎉 Payment & MPToken complete! Your ${paymentData.serviceName} ${subscriptionTier} subscription is ready. Real XRPL MPToken ID: ${subscriptionToken.tokenId.slice(-8)}...`
            : `🎉 Payment completed! Your ${paymentData.serviceName} service is activated. Transaction: ${paymentResult.txHash?.slice(0, 8)}...`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, finalSuccessMessage]);

        if (messageId) {
          setCompletedPayments(prev => new Set(prev).add(messageId));
        }
      }


    } catch (error) {
      console.error('❌ AI Payment failed:', error);
      toast.error(`AI Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Add failure message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Payment failed for ${paymentData.serviceName}. Please try again or check your wallet balance.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);

      // Close modal on error
      setShowPaymentModal(false);
      setPaymentQR(null);
      setPaymentDeepLink(null);
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handlePaymentDecline = () => {
    toast.info('Payment cancelled by user');

    // Add cancellation message to chat
    const cancelMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '⏸️ Payment cancelled. Let me know if you need anything else!',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#0B1220] via-[#0F1B2E] to-[#0B1220] text-white relative overflow-hidden">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(46,230,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(46,230,166,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="container mx-auto max-w-4xl p-4 relative z-10 h-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 h-full">
        {/* Chat Interface */}
        <div className="lg:col-span-3 flex flex-col h-full">
          <Card className="flex-1 flex flex-col bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#2EE6A6]">
                <Bot className="h-5 w-5" />
                AI Chat with Token Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-6 h-full">
              <ScrollArea className="flex-1 mb-4 bg-[#0F1825]/50 rounded-lg p-2 max-h-[calc(100vh-300px)]" ref={scrollAreaRef}>
                <div className="space-y-4 pr-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center text-[#C9CDD6] py-8">
                        Start a conversation with AI. Each message will track token usage for XRPL payments.
                      </div>
                    </div>
                  ) : (
                    <>
                  {messages.map((message) => (
                    <div key={message.id} className="w-full">
                      <div
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`flex gap-3 max-w-[80%] ${
                            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                        <div className="flex-shrink-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.role === 'user'
                                ? 'bg-[#2EE6A6] text-[#0B1220]'
                                : 'bg-[#1A2332] text-[#2EE6A6]'
                            }`}
                          >
                            {message.role === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                        <div
                          className={`rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-[#2EE6A6] text-[#0B1220]'
                              : 'bg-[#2A3441] text-white border border-[#2EE6A6]/10'
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </div>
                          {message.tokens && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                {message.tokens} tokens
                              </Badge>
                            </div>
                          )}
                        </div>
                        </div>
                      </div>

                      {/* Payment Confirmation Card */}
                      {message.role === 'assistant' &&
                       message.paymentIntent?.hasPaymentIntent &&
                       !completedPayments.has(message.id) && (
                        <div className="mt-3 ml-11 max-w-xs">
                          <PaymentConfirmationCard
                            paymentIntent={message.paymentIntent}
                            onApprove={(paymentData, useSubscription, subscriptionTier) => handlePaymentApproval(paymentData, useSubscription, subscriptionTier, message.id)}
                            userCredential={userCredential}
                            onDecline={handlePaymentDecline}
                            isProcessing={isPaymentProcessing}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                    </>
                  )}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-[#1A2332] text-[#2EE6A6] flex items-center justify-center">
                            <Bot className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="bg-[#2A3441] text-white rounded-lg p-3 border border-[#2EE6A6]/10">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-[#2EE6A6] rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-[#2EE6A6] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-[#2EE6A6] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input - Fixed at bottom */}
              <div className="flex gap-2 flex-shrink-0 w-full min-h-[60px]">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 bg-[#1A2332] border-[#2EE6A6]/20 text-white placeholder-[#C9CDD6] focus:border-[#2EE6A6]"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="bg-gradient-to-r from-[#2EE6A6] to-[#26D396] text-[#0B1220] hover:shadow-[0_0_20px_rgba(46,230,166,0.4)] transition-all duration-300"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Usage & Payment Panel */}
        <div className="lg:col-span-1 flex flex-col h-full">
          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* User Credentials & Subscriptions */}
            <UserCredentialCard
              walletAddress={walletAddress}
              onCredentialUpdate={setUserCredential}
              activeSubscriptions={activeSubscriptions}
            />

            {/* Current Token Usage */}
            <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-[#2EE6A6]">
                  <Zap className="h-4 w-4" />
                  Token Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <div className="text-xs text-[#C9CDD6]">Current Message:</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-white">
                  <div>
                    <div className="font-medium text-[#C9CDD6]">Prompt</div>
                    <div className="text-green-400 font-semibold">{tokenUsage.promptTokens}</div>
                  </div>
                  <div>
                    <div className="font-medium text-[#C9CDD6]">Response</div>
                    <div className="text-green-400 font-semibold">{tokenUsage.completionTokens}</div>
                  </div>
                </div>
                <div className="border-t border-[#2EE6A6]/20 pt-2">
                  <div className="flex justify-between text-sm text-white">
                    <span>Total</span>
                    <span className="font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">{tokenUsage.totalTokens}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Summary */}
            <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-[#2EE6A6]">
                  <Coins className="h-4 w-4" />
                  Session Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <div className="text-xs text-[#C9CDD6] mb-1">Total Tokens Used</div>
                  <div className="text-xl font-black text-green-400 bg-green-400/20 px-3 py-2 rounded-lg text-center border border-green-400/30">{sessionTokens}</div>
                </div>

                <div>
                  <div className="text-xs text-[#C9CDD6] mb-1">Estimated Cost</div>
                  <div className="text-lg font-bold text-[#2EE6A6]">
                    {calculateTokenCost(sessionTokens).toFixed(6)} XRP
                  </div>
                </div>

                {isConnected && (
                  <div>
                    <div className="text-xs text-[#C9CDD6] mb-1">Wallet Balance</div>
                    <div className="text-sm font-medium text-white">
                      {balance ? `${parseFloat(balance).toFixed(2)} XRP` : 'Loading...'}
                    </div>
                  </div>
                )}

                <Button
                  onClick={payForTokens}
                  disabled={!isConnected || sessionTokens === 0 || isSending}
                  className="w-full bg-gradient-to-r from-[#2EE6A6] to-[#26D396] text-[#0B1220] hover:shadow-[0_0_20px_rgba(46,230,166,0.4)] transition-all duration-300 disabled:opacity-50"
                  size="sm"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  {isSending ? 'Processing Payment...' : 'Pay for Tokens'}
                </Button>

                {!isConnected && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#C9CDD6] text-center">
                      Connect wallet to make payments
                    </p>
                    <XamanConnect
                      className="w-full text-sm"
                      onSuccess={() => {
                        console.log('🎉 Wallet connected in chat page');
                        toast.success('Wallet connected successfully!');
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages Count */}
            <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#2EE6A6]">{messages.length}</div>
                <div className="text-xs text-[#C9CDD6]">Messages Exchanged</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>

      {/* Payment QR Modal */}
      <PaymentQRModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentQR(null);
          setPaymentDeepLink(null);
          setXamanUuid(null);
        }}
        qrCode={paymentQR || undefined}
        amount={paymentAmount}
        currency="XRP"
        description={`Payment for ${sessionTokens} ChatGPT tokens`}
        deepLink={paymentDeepLink || undefined}
        onSuccess={() => {
          setShowPaymentModal(false);
          setPaymentQR(null);
          setPaymentDeepLink(null);
          setXamanUuid(null);
          setSessionTokens(0);
        }}
        xamanUuid={xamanUuid || undefined}
      />

      {/* MPToken Opt-in QR Modal */}
      <PaymentQRModal
        isOpen={showOptInModal}
        onClose={() => {
          setShowOptInModal(false);
          setOptInQR(null);
          setOptInDeepLink(null);
          setOptInUuid(null);
        }}
        qrCode={optInQR || undefined}
        amount={0}
        currency="MPToken"
        description="MPToken Authorization Required - Please approve in Xaman"
        deepLink={optInDeepLink || undefined}
        onSuccess={() => {
          setShowOptInModal(false);
          setOptInQR(null);
          setOptInDeepLink(null);
          setOptInUuid(null);
        }}
        xamanUuid={optInUuid || undefined}
      />
    </div>
  );
}