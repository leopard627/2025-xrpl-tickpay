"use client";

import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useXRPLAccount } from '../hooks/useXRPLAccount';

interface WalletInfoProps {
  className?: string;
}

const WalletInfo: React.FC<WalletInfoProps> = ({ className = '' }) => {
  const { isConnected, address } = useWallet();
  const {
    balance,
    sequence,
    ownerReserve,
    reserve,
    trustLines,
    isLoading,
    error,
    refreshAccountInfo
  } = useXRPLAccount();

  if (!isConnected) {
    return null;
  }

  const rlusdTrustLine = trustLines?.find(tl => tl.currency === 'RLUSD' || tl.currency === 'USD');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 기본 지갑 정보 */}
      <div className="bg-[#0B1220] p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#2EE6A6]">Account Details</h3>
          <button
            onClick={refreshAccountInfo}
            disabled={isLoading}
            className="text-[#C9CDD6] hover:text-white transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-[#C9CDD6]">Address</div>
            <div className="font-mono text-sm text-white break-all">
              {address}
            </div>
          </div>
          <div>
            <div className="text-sm text-[#C9CDD6]">Network</div>
            <div className="text-sm text-white">XRPL Devnet</div>
          </div>
          <div>
            <div className="text-sm text-[#C9CDD6]">Sequence</div>
            <div className="text-sm text-white">{sequence}</div>
          </div>
          <div>
            <div className="text-sm text-[#C9CDD6]">Status</div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-400 text-sm">Active</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-600/20 border border-red-600/30 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* 잔액 정보 */}
      <div className="bg-[#0B1220] p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-[#2EE6A6] mb-4">Balances</h3>

        <div className="space-y-3">
          {/* XRP 잔액 */}
          <div className="flex items-center justify-between p-3 bg-[#1A2332] rounded">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mr-3">
                <span className="text-xs font-bold text-white">XRP</span>
              </div>
              <div>
                <div className="text-white font-semibold">XRP</div>
                <div className="text-xs text-[#C9CDD6]">Native Currency</div>
              </div>
            </div>
            <div className="text-right">
              {isLoading ? (
                <div className="animate-pulse bg-[#C9CDD6] h-4 w-16 rounded"></div>
              ) : (
                <>
                  <div className="text-white font-semibold">{balance}</div>
                  <div className="text-xs text-[#C9CDD6]">
                    Reserved: {(parseFloat(reserve) + parseFloat(ownerReserve)).toFixed(6)} XRP
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RLUSD Trust Line */}
          {rlusdTrustLine ? (
            <div className="flex items-center justify-between p-3 bg-[#1A2332] rounded">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#2EE6A6] rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs font-bold text-[#0B1220]">USD</span>
                </div>
                <div>
                  <div className="text-white font-semibold">RLUSD</div>
                  <div className="text-xs text-[#C9CDD6] font-mono">
                    {rlusdTrustLine.issuer.slice(0, 6)}...
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">{rlusdTrustLine.balance}</div>
                <div className="text-xs text-[#C9CDD6]">
                  Limit: {rlusdTrustLine.limit}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-[#1A2332] rounded opacity-50">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs font-bold text-gray-300">USD</span>
                </div>
                <div>
                  <div className="text-gray-300 font-semibold">RLUSD</div>
                  <div className="text-xs text-gray-400">No trust line</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-300">0.00</div>
                <div className="text-xs text-gray-400">Not set up</div>
              </div>
            </div>
          )}

          {/* 기타 Trust Lines */}
          {trustLines && trustLines.filter(tl => tl.currency !== 'RLUSD' && tl.currency !== 'USD').map((trustLine, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-[#1A2332] rounded">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs font-bold text-white">
                    {trustLine.currency.slice(0, 3)}
                  </span>
                </div>
                <div>
                  <div className="text-white font-semibold">{trustLine.currency}</div>
                  <div className="text-xs text-[#C9CDD6] font-mono">
                    {trustLine.issuer.slice(0, 6)}...
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">{trustLine.balance}</div>
                <div className="text-xs text-[#C9CDD6]">
                  Limit: {trustLine.limit}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 개발자 정보 */}
      <div className="bg-[#0B1220] p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-[#2EE6A6] mb-4">Developer Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#C9CDD6]">Available Balance:</span>
            <span className="text-white font-mono">
              {(parseFloat(balance) - parseFloat(reserve) - parseFloat(ownerReserve)).toFixed(6)} XRP
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#C9CDD6]">Base Reserve:</span>
            <span className="text-white font-mono">{reserve} XRP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#C9CDD6]">Owner Reserve:</span>
            <span className="text-white font-mono">{ownerReserve} XRP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletInfo;