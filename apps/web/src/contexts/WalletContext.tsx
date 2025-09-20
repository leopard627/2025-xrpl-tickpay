"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateXamanQR, checkPayloadStatus, createSignInPayload, XamanPayloadResponse } from '../lib/xaman';
import Toast from '../components/Toast';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  isLoading: boolean;
  error: string | null;
}

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  qrCode: string | null;
  payloadUuid: string | null;
  isConnecting: boolean;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    isLoading: false,
    error: null
  });

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [payloadUuid, setPayloadUuid] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
  };

  // localStorage에서 지갑 정보 복원
  useEffect(() => {
    const savedWallet = localStorage.getItem('tickpay-wallet');
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet);
        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          address: walletData.address,
          balance: walletData.balance || null
        }));
      } catch (error) {
        console.error('저장된 지갑 정보 복원 실패:', error);
      }
    }
  }, []);

  // Payload 상태를 주기적으로 확인
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (payloadUuid && isConnecting) {
      interval = setInterval(async () => {
        try {
          const status = await checkPayloadStatus(payloadUuid);

          if (status.meta.signed) {
            // 성공적으로 서명됨
            const address = status.response.account;

            setWalletState(prev => ({
              ...prev,
              isConnected: true,
              address,
              error: null
            }));

            // localStorage에 저장
            localStorage.setItem('tickpay-wallet', JSON.stringify({ address }));

            // 성공 토스트 표시
            showToast('🎉 Xaman 지갑이 성공적으로 연결되었습니다!', 'success');

            // 연결 상태 초기화
            setIsConnecting(false);
            setQrCode(null);
            setPayloadUuid(null);

          } else if (status.meta.cancelled || status.meta.expired) {
            // 취소되거나 만료됨
            setWalletState(prev => ({
              ...prev,
              error: status.meta.cancelled ? '사용자가 연결을 취소했습니다.' : 'QR 코드가 만료되었습니다.'
            }));

            setIsConnecting(false);
            setQrCode(null);
            setPayloadUuid(null);
          }
        } catch (error) {
          console.error('Payload 상태 확인 중 오류:', error);
          setWalletState(prev => ({
            ...prev,
            error: '지갑 연결 상태 확인 중 오류가 발생했습니다.'
          }));
        }
      }, 2000); // 2초마다 확인
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [payloadUuid, isConnecting]);

  const connectWallet = async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
      setIsConnecting(true);

      // API 키 확인
      if (!process.env.NEXT_PUBLIC_XAMAN_API_KEY) {
        throw new Error('Xaman API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
      }

      const payload = createSignInPayload();
      const response: XamanPayloadResponse = await generateXamanQR(payload);

      console.log('🔍 Xaman 응답 구조:', response);

      // 실제 API 응답 구조에 맞춰 QR 코드와 UUID 추출
      const qrImage = response.refs?.qr_png || response.qr_png;
      const payloadId = response.uuid;

      if (!qrImage || !payloadId) {
        console.error('❌ 응답에서 필수 필드를 찾을 수 없음:', { qrImage, payloadId, response });
        throw new Error('Xaman QR 코드 생성에 실패했습니다. 응답 형식을 확인하세요.');
      }

      setQrCode(qrImage);
      setPayloadUuid(payloadId);

    } catch (error) {
      console.error('지갑 연결 실패:', error);

      let errorMessage = '지갑 연결 중 오류가 발생했습니다.';

      if (error instanceof Error) {
        if (error.message.includes('API 키')) {
          errorMessage = 'Xaman API 설정이 필요합니다. 개발자에게 문의해주세요.';
        } else if (error.message.includes('QR 코드')) {
          errorMessage = 'QR 코드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.';
        } else {
          errorMessage = error.message;
        }
      }

      setWalletState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      setIsConnecting(false);
    } finally {
      setWalletState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      address: null,
      balance: null,
      isLoading: false,
      error: null
    });

    setQrCode(null);
    setPayloadUuid(null);
    setIsConnecting(false);

    // localStorage에서 제거
    localStorage.removeItem('tickpay-wallet');
  };

  const contextValue: WalletContextType = {
    ...walletState,
    connectWallet,
    disconnectWallet,
    qrCode,
    payloadUuid,
    isConnecting
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};