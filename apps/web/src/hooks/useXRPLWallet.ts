"use client";

import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useXRPLAccount } from './useXRPLAccount';
import { sendXRPPaymentViaXaman } from '../utils/xaman-transactions';

export const useXRPLWallet = () => {
  const wallet = useWallet();
  const account = useXRPLAccount();
  const [isSending, setIsSending] = useState(false);

  // 디버깅을 위한 로그
  console.log('🔍 useXRPLWallet - wallet state:', {
    isConnected: wallet.isConnected,
    address: wallet.address,
    balance: account.balance
  });

  const sendPayment = async (
    destinationAddress: string,
    amount: number,
    memo?: string,
    onQRCode?: (qrCode: string, payload: any) => void
  ): Promise<any> => {
    if (!wallet.isConnected || !wallet.address) {
      throw new Error('Wallet is not connected');
    }

    setIsSending(true);

    try {
      console.log('💸 실제 Xaman을 통한 ChatGPT 토큰 결제 시작:', {
        from: wallet.address,
        to: destinationAddress,
        amount,
        memo
      });

      // 실제 Xaman을 통한 XRP 결제 실행
      const result = await sendXRPPaymentViaXaman(
        wallet.address,
        destinationAddress,
        amount.toString(),
        memo,
        onQRCode
      );

      if (!result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      console.log('✅ 실제 XRPL 결제 완료!', {
        txHash: result.txHash,
        payloadUuid: result.payloadUuid,
        explorerUrl: `https://devnet.xrpl.org/transactions/${result.txHash}`
      });

      // 결제 성공 후 계정 정보 새로고침
      account.refreshAccountInfo();

      return result;

    } catch (error) {
      console.error('❌ 실제 XRPL 결제 실패:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return {
    isConnected: wallet.isConnected,
    address: wallet.address,
    balance: account.balance,
    isLoading: account.isLoading || wallet.isLoading,
    isSending,
    sendPayment,
    connectWallet: wallet.connectWallet,
    disconnectWallet: wallet.disconnectWallet,
  };
};