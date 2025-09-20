"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 거래 기록 인터페이스
export interface TransactionRecord {
  id: string;
  timestamp: number;
  date: string;
  type: 'settlement' | 'payment_channel';
  channelId: string;
  providerAddress: string;
  payerAddress: string;
  rlusdAmount: number;
  xrpAmount: number;
  elapsedSeconds: number;
  tokensProcessed: number;
  claimTx?: string;
  paymentTx?: string;
  merkleRoot?: string;
  usageProofs: UsageProofRecord[];
  status: 'pending' | 'completed' | 'failed';
  streamingSessionId: string;
}

// 사용량 증명 기록
export interface UsageProofRecord {
  timestamp: number;
  seconds: number;
  cost: number;
  tokens: number;
  signature: string;
}

interface TransactionContextType {
  transactions: TransactionRecord[];
  addTransaction: (transaction: Omit<TransactionRecord, 'id' | 'timestamp' | 'date'>) => string;
  updateTransaction: (id: string, updates: Partial<TransactionRecord>) => void;
  getTransactionsByAddress: (address: string) => TransactionRecord[];
  getTotalSpent: (address?: string) => number;
  clearTransactions: () => void;
  deleteTransaction: (id: string) => void;
  deleteOldTransactions: (days: number) => number; // 삭제된 개수 반환
  getRecentTransactions: (limit: number) => TransactionRecord[];
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const STORAGE_KEY = 'tickpay_transactions';

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // 로컬 스토리지에서 거래 기록 로드
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTransactions(parsed);
      } catch (error) {
        console.error('거래 기록 로드 실패:', error);
      }
    }
  }, []);

  // 거래 기록 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions]);

  const addTransaction = (transactionData: Omit<TransactionRecord, 'id' | 'timestamp' | 'date'>): string => {
    const now = Date.now();
    const transaction: TransactionRecord = {
      ...transactionData,
      id: `txn_${now.toString(36)}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: now,
      date: new Date(now).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };

    setTransactions(prev => [transaction, ...prev]);

    console.log('💾 거래 기록 저장됨:', transaction);

    return transaction.id;
  };

  const updateTransaction = (id: string, updates: Partial<TransactionRecord>) => {
    setTransactions(prev =>
      prev.map(tx =>
        tx.id === id
          ? { ...tx, ...updates }
          : tx
      )
    );

    console.log('🔄 거래 기록 업데이트됨:', id, updates);
  };

  const getTransactionsByAddress = (address: string): TransactionRecord[] => {
    return transactions.filter(tx =>
      tx.providerAddress === address || tx.payerAddress === address
    );
  };

  const getTotalSpent = (address?: string): number => {
    const relevantTransactions = address
      ? getTransactionsByAddress(address)
      : transactions;

    return relevantTransactions
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.rlusdAmount, 0);
  };

  const clearTransactions = () => {
    setTransactions([]);
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ 모든 거래 기록 삭제됨');
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => {
      const filtered = prev.filter(tx => tx.id !== id);
      console.log(`🗑️ 거래 기록 삭제됨: ${id}`);
      return filtered;
    });
  };

  const deleteOldTransactions = (days: number): number => {
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    setTransactions(prev => {
      const filtered = prev.filter(tx => {
        const isOld = tx.timestamp < cutoffDate;
        if (isOld) deletedCount++;
        return !isOld;
      });

      if (deletedCount > 0) {
        console.log(`🗑️ ${days}일 이전 거래 기록 ${deletedCount}개 삭제됨`);
      }

      return filtered;
    });

    return deletedCount;
  };

  const getRecentTransactions = (limit: number): TransactionRecord[] => {
    return transactions
      .sort((a, b) => b.timestamp - a.timestamp) // 최신순 정렬
      .slice(0, limit);
  };

  const contextValue: TransactionContextType = {
    transactions,
    addTransaction,
    updateTransaction,
    getTransactionsByAddress,
    getTotalSpent,
    clearTransactions,
    deleteTransaction,
    deleteOldTransactions,
    getRecentTransactions
  };

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};