"use client";

import { useState, useEffect } from 'react';
import { Client, dropsToXrp } from 'xrpl';
import { useWallet } from '../contexts/WalletContext';

interface AccountInfo {
  balance: string;
  sequence: number;
  ownerReserve: string;
  reserve: string;
  trustLines?: TrustLine[];
  isLoading: boolean;
  error: string | null;
}

interface TrustLine {
  currency: string;
  issuer: string;
  balance: string;
  limit: string;
}

export const useXRPLAccount = () => {
  const { address, isConnected } = useWallet();
  const [client, setClient] = useState<Client | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    balance: '0',
    sequence: 0,
    ownerReserve: '0',
    reserve: '0',
    trustLines: [],
    isLoading: false,
    error: null
  });

  // XRPL 클라이언트 초기화
  useEffect(() => {
    const xrplClient = new Client('wss://s.devnet.rippletest.net:51233');
    setClient(xrplClient);

    return () => {
      if (xrplClient.isConnected()) {
        xrplClient.disconnect();
      }
    };
  }, []);

  const fetchAccountInfo = async (accountAddress: string) => {
    if (!client) return;

    setAccountInfo(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 클라이언트 연결
      if (!client.isConnected()) {
        await client.connect();
      }

      // 계정 정보 조회
      const accountInfoResponse = await client.request({
        command: 'account_info',
        account: accountAddress,
        ledger_index: 'current'
      });

      const accountData = accountInfoResponse.result.account_data;

      setAccountInfo(prev => ({
        ...prev,
        balance: dropsToXrp(accountData.Balance),
        sequence: accountData.Sequence,
        ownerReserve: dropsToXrp(String((accountData.OwnerCount || 0) * 2000000)),
        reserve: '10.000000', // Base reserve on devnet
        isLoading: false
      }));

      // Trust lines 조회
      await fetchTrustLines(accountAddress);

    } catch (error) {
      console.error('계정 정보 조회 실패:', error);
      setAccountInfo(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '계정 정보를 불러올 수 없습니다.',
        isLoading: false
      }));
    }
  };

  const fetchTrustLines = async (accountAddress: string) => {
    if (!client) return;

    try {
      // 클라이언트가 연결되어 있는지 확인
      if (!client.isConnected()) {
        await client.connect();
      }

      // Trust lines 조회
      const trustLinesResponse = await client.request({
        command: 'account_lines',
        account: accountAddress,
        ledger_index: 'current'
      });

      if (trustLinesResponse.result && trustLinesResponse.result.lines) {
        const trustLines: TrustLine[] = trustLinesResponse.result.lines.map((line: any) => ({
          currency: line.currency,
          issuer: line.account,
          balance: line.balance,
          limit: line.limit
        }));

        setAccountInfo(prev => ({
          ...prev,
          trustLines
        }));
      }

    } catch (error) {
      console.error('Trust lines 조회 실패:', error);
    }
  };

  const refreshAccountInfo = () => {
    if (address) {
      fetchAccountInfo(address);
    }
  };

  useEffect(() => {
    if (isConnected && address && client) {
      fetchAccountInfo(address);
    } else {
      setAccountInfo({
        balance: '0',
        sequence: 0,
        ownerReserve: '0',
        reserve: '0',
        trustLines: [],
        isLoading: false,
        error: null
      });
    }
  }, [isConnected, address, client]);

  return {
    ...accountInfo,
    refreshAccountInfo
  };
};