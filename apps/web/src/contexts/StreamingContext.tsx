"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { useTransactions, TransactionRecord } from './TransactionContext';
import { usePrice } from './PriceContext';
import { sendXRPPaymentViaXaman } from '../utils/xaman-transactions';

// 스트리밍 결제 상태 인터페이스
interface StreamingState {
  isRunning: boolean;
  totalCost: number; // RLUSD
  currentRate: number; // RLUSD per second
  elapsedSeconds: number;
  tokensProcessed: number;
  channelId: string | null;
  providerAddress: string;
  usageProofs: UsageProof[];
  metrics: StreamingMetrics;
  caps: StreamingCaps;
}

// 사용량 증명
interface UsageProof {
  timestamp: number;
  seconds: number;
  cost: number; // RLUSD
  tokens: number;
  signature: string; // JWT 서명
}

// 스트리밍 메트릭스
interface StreamingMetrics {
  latency: number; // ms
  errorRate: number; // %
  throughput: number; // tokens/sec
}

// 사용량 제한
interface StreamingCaps {
  perHour: number; // RLUSD
  perDay: number; // RLUSD
  hourlyUsed: number;
  dailyUsed: number;
}

interface StreamingContextType extends StreamingState {
  startStreaming: () => Promise<void>;
  stopStreaming: () => void;
  pauseStreaming: () => void;
  resumeStreaming: () => void;
  settleNow: () => Promise<void>;
  createPaymentChannel: () => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

const StreamingContext = createContext<StreamingContextType | undefined>(undefined);

interface StreamingProviderProps {
  children: ReactNode;
}

export const StreamingProvider: React.FC<StreamingProviderProps> = ({ children }) => {
  const { address, isConnected } = useWallet();
  const { addTransaction, updateTransaction } = useTransactions();
  const { convertRlusdToXrp } = usePrice();

  const [streamingState, setStreamingState] = useState<StreamingState>({
    isRunning: false,
    totalCost: 0,
    currentRate: 0,
    elapsedSeconds: 0,
    tokensProcessed: 0,
    channelId: null,
    providerAddress: address || '', // 연결된 지갑 주소를 provider로 사용
    usageProofs: [],
    metrics: {
      latency: 0,
      errorRate: 0,
      throughput: 0
    },
    caps: {
      perHour: 5.00,
      perDay: 30.00,
      hourlyUsed: 0,
      dailyUsed: 0
    }
  });

  // 지갑 주소가 변경될 때 provider address 업데이트
  useEffect(() => {
    setStreamingState(prev => ({
      ...prev,
      providerAddress: address || ''
    }));
  }, [address]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);

  // 스트리밍 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (streamingState.isRunning) {
      interval = setInterval(() => {
        setStreamingState(prev => {
          const newElapsed = prev.elapsedSeconds + 1;
          const newCost = newElapsed * 0.02; // $0.02 per second
          const newTokens = prev.tokensProcessed + Math.floor(Math.random() * 100 + 750); // 750-850 tokens/sec

          // Cap 체크
          const hourlyUsed = newCost; // 간단히 현재 세션만 계산
          const dailyUsed = newCost;

          // Hourly cap 초과시 자동 중지
          if (hourlyUsed >= prev.caps.perHour) {
            return {
              ...prev,
              isRunning: false,
              currentRate: 0,
              caps: { ...prev.caps, hourlyUsed, dailyUsed }
            };
          }

          // 사용량 증명 생성 (1초마다)
          const newProof: UsageProof = {
            timestamp: Date.now(),
            seconds: newElapsed,
            cost: newCost,
            tokens: newTokens,
            signature: `jwt_proof_${newElapsed}_${Date.now()}`
          };

          // 실시간으로 거래 기록 업데이트 (비동기로 처리)
          if (currentTransactionId) {
            setTimeout(() => {
              updateTransaction(currentTransactionId, {
                rlusdAmount: newCost,
                xrpAmount: convertRlusdToXrp(newCost), // 실시간 환율 사용
                elapsedSeconds: newElapsed,
                tokensProcessed: newTokens,
                usageProofs: [...prev.usageProofs.slice(-59), {
                  timestamp: newProof.timestamp,
                  seconds: newProof.seconds,
                  cost: newProof.cost,
                  tokens: newProof.tokens,
                  signature: newProof.signature
                }]
              });
            }, 0);
          }

          // 메트릭스 업데이트 (랜덤 시뮬레이션)
          const newMetrics: StreamingMetrics = {
            latency: Math.floor(Math.random() * 40 + 80), // 80-120ms
            errorRate: Math.random() * 0.3, // 0-0.3%
            throughput: Math.floor(Math.random() * 100 + 750) // 750-850 tokens/sec
          };

          return {
            ...prev,
            totalCost: newCost,
            currentRate: 0.02,
            elapsedSeconds: newElapsed,
            tokensProcessed: newTokens,
            usageProofs: [...prev.usageProofs.slice(-59), newProof], // 최근 60개 유지
            metrics: newMetrics,
            caps: { ...prev.caps, hourlyUsed, dailyUsed }
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [streamingState.isRunning]);

  const createPaymentChannel = async (): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!address) {
        throw new Error('지갑이 연결되지 않았습니다');
      }

      console.log('🔗 Xaman을 통한 Payment Channel 생성 중...');

      // 연결된 Xaman 지갑을 사용하여 Payment Channel 생성
      const result = await createPaymentChannelViaXaman(
        address, // 연결된 지갑 주소 (소스)
        address, // 동일한 주소를 destination으로 사용 (셀프 채널)
        '10' // 10 XRP로 채널 생성
      );

      if (!result.success) {
        throw new Error(result.error || 'Payment Channel 생성 실패');
      }

      const channelId = result.txHash!;
      console.log('✅ Payment Channel 생성 완료:', channelId);
      return channelId;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Payment Channel 생성 실패';
      console.error('❌ Payment Channel 생성 실패:', error);
      setError(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const startStreaming = async () => {
    // 지갑 연결 필수 검증
    if (!isConnected || !address) {
      setError('⚠️ 지갑 연결이 필요합니다. Dashboard에서 Xaman 지갑을 먼저 연결해주세요.');
      return;
    }

    // 지갑 주소가 유효한지 검증
    if (!address.startsWith('r') || address.length < 25) {
      setError('❌ 유효하지 않은 지갑 주소입니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 간단한 세션 ID를 채널 ID로 사용 (Payment Channel 생성 건너뛰기)
      const channelId = `simple_session_${Date.now().toString(36)}`;

      // Job ID 생성
      const newJobId = `job_${Date.now().toString(36)}`;
      setJobId(newJobId);

      // 거래 기록 생성
      const transactionId = addTransaction({
        type: 'settlement',
        channelId,
        providerAddress: address,
        payerAddress: address, // 동일한 지갑이 payer
        rlusdAmount: 0,
        xrpAmount: 0,
        elapsedSeconds: 0,
        tokensProcessed: 0,
        usageProofs: [],
        status: 'pending',
        streamingSessionId: newJobId
      });

      setCurrentTransactionId(transactionId);

      console.log('🚀 스트리밍 시작:', {
        jobId: newJobId,
        channelId,
        providerAddress: address,
        payoutWallet: address,
        transactionId
      });

      setStreamingState(prev => ({
        ...prev,
        isRunning: true,
        channelId,
        providerAddress: address, // 현재 연결된 지갑을 provider로 사용
        totalCost: 0,
        elapsedSeconds: 0,
        tokensProcessed: 0,
        usageProofs: []
      }));

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '스트리밍 시작 실패';
      setError(errorMsg);
      console.error('스트리밍 시작 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopStreaming = () => {
    console.log('⏹️ 스트리밍 중지');
    setStreamingState(prev => ({
      ...prev,
      isRunning: false,
      currentRate: 0
    }));
  };

  const pauseStreaming = () => {
    console.log('⏸️ 스트리밍 일시정지');
    setStreamingState(prev => ({
      ...prev,
      isRunning: false,
      currentRate: 0
    }));
  };

  const resumeStreaming = () => {
    console.log('▶️ 스트리밍 재개');
    setStreamingState(prev => ({
      ...prev,
      isRunning: true
    }));
  };

  const settleNow = async () => {
    if (streamingState.usageProofs.length === 0) {
      setError('정산할 사용량이 없습니다.');
      return;
    }

    if (!currentTransactionId) {
      setError('진행중인 거래가 없습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('💰 즉시 정산 시작:', {
        totalCost: streamingState.totalCost,
        proofs: streamingState.usageProofs.length,
        transactionId: currentTransactionId
      });

      // 실제 XRPL 정산 - 단순 XRP 결제로 처리
      console.log('💰 실제 XRPL 결제 정산 시작...');

      if (!address) {
        throw new Error('지갑이 연결되지 않았습니다');
      }

      // RLUSD 금액을 XRP로 변환 (실시간 환율 사용)
      const xrpAmount = convertRlusdToXrp(streamingState.totalCost).toFixed(6);

      // 환경변수에서 징수용 지갑 주소 가져오기
      const serviceWallet = process.env.NEXT_PUBLIC_SERVICE_WALLET || 'rDEVELOPMENT_SERVICE_WALLET_ADDRESS';

      // Payment Channel 대신 직접 XRP 결제로 정산 처리
      const paymentResult = await sendXRPPaymentViaXaman(
        address, // 연결된 지갑 주소 (소스)
        serviceWallet, // 징수용 지갑 (목적지)
        xrpAmount,
        `TickPay Settlement: ${streamingState.elapsedSeconds}s, ${streamingState.tokensProcessed} tokens`
      );

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'XRP 결제 실패');
      }

      console.log('✅ 실제 XRPL 결제 완료:', paymentResult);

      const claimTx = paymentResult.txHash!;
      const paymentTx = paymentResult.txHash!;
      const merkleRoot = `${Math.random().toString(36).substr(2, 8).toUpperCase()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      // 거래 기록 완료 처리
      updateTransaction(currentTransactionId, {
        status: 'completed',
        claimTx,
        paymentTx,
        merkleRoot
      });

      console.log('✅ 정산 완료 - 거래 기록 업데이트됨:', {
        transactionId: currentTransactionId,
        claimTx,
        paymentTx,
        finalAmount: streamingState.totalCost
      });

      // 정산 후 상태 초기화
      setStreamingState(prev => ({
        ...prev,
        totalCost: 0,
        elapsedSeconds: 0,
        tokensProcessed: 0,
        usageProofs: []
      }));

      // 현재 거래 ID 초기화
      setCurrentTransactionId(null);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '정산 실패';
      setError(errorMsg);
      console.error('정산 실패:', error);

      // 실패한 경우 거래 상태를 failed로 업데이트
      if (currentTransactionId) {
        updateTransaction(currentTransactionId, {
          status: 'failed'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: StreamingContextType = {
    ...streamingState,
    startStreaming,
    stopStreaming,
    pauseStreaming,
    resumeStreaming,
    settleNow,
    createPaymentChannel,
    isLoading,
    error
  };

  return (
    <StreamingContext.Provider value={contextValue}>
      {children}
    </StreamingContext.Provider>
  );
};

export const useStreaming = (): StreamingContextType => {
  const context = useContext(StreamingContext);
  if (!context) {
    throw new Error('useStreaming must be used within a StreamingProvider');
  }
  return context;
};