"use client";

import React from 'react';
import Image from 'next/image';
import { usePrice } from '../contexts/PriceContext';

const PriceTicker: React.FC = () => {
  const { rlusdPrice, xrpPrice, isConnected, connectionError, reconnect } = usePrice();

  const formatPrice = (price: number): string => {
    if (price >= 1) {
      return price.toFixed(4);
    } else {
      return price.toFixed(6);
    }
  };

  const formatPercent = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  if (connectionError) {
    return (
      <div className="bg-[#0B1220] border border-red-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 text-sm">가격 피드 연결 실패</span>
          </div>
          <button
            onClick={reconnect}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs transition-colors"
          >
            재연결
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B1220] border border-[#2A3441] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[#C9CDD6] font-medium">실시간 가격</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
          <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-gray-400'}`}>
            {isConnected ? (connectionError?.includes('Mock') ? 'Mock 데이터' : 'Bitget 연결됨') : '연결 중...'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* RLUSD/USDT */}
        <div className="flex items-center justify-between py-2 border-b border-[#2A3441]/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex items-center justify-center">
              <Image
                src="/rlusd.png"
                alt="RLUSD"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-white font-medium">RLUSD</div>
              <div className="text-[#C9CDD6] text-xs">Ripple USD</div>
            </div>
          </div>

          <div className="text-right">
            {rlusdPrice ? (
              <>
                <div className="text-white font-mono text-lg">
                  ${formatPrice(rlusdPrice.price)}
                </div>
                <div className={`text-sm font-mono ${getChangeColor(rlusdPrice.changePercent24h)}`}>
                  {formatPercent(rlusdPrice.changePercent24h)}
                </div>
              </>
            ) : (
              <div className="animate-pulse">
                <div className="bg-[#2A3441] h-6 w-20 rounded mb-1"></div>
                <div className="bg-[#2A3441] h-4 w-16 rounded"></div>
              </div>
            )}
          </div>
        </div>

        {/* XRP/USDT */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex items-center justify-center">
              <Image
                src="/xrp.png"
                alt="XRP"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-white font-medium">XRP</div>
              <div className="text-[#C9CDD6] text-xs">Ripple</div>
            </div>
          </div>

          <div className="text-right">
            {xrpPrice ? (
              <>
                <div className="text-white font-mono text-lg">
                  ${formatPrice(xrpPrice.price)}
                </div>
                <div className={`text-sm font-mono ${getChangeColor(xrpPrice.changePercent24h)}`}>
                  {formatPercent(xrpPrice.changePercent24h)}
                </div>
              </>
            ) : (
              <div className="animate-pulse">
                <div className="bg-[#2A3441] h-6 w-20 rounded mb-1"></div>
                <div className="bg-[#2A3441] h-4 w-16 rounded"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 마지막 업데이트 시간 */}
      {(rlusdPrice || xrpPrice) && (
        <div className="mt-3 pt-2 border-t border-[#2A3441]/50">
          <div className="text-[#C9CDD6] text-xs">
            마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </div>
        </div>
      )}

      {/* 환율 정보 (RLUSD to XRP) */}
      {rlusdPrice && xrpPrice && (
        <div className="mt-2 p-2 bg-[#2A3441]/30 rounded text-center">
          <div className="text-[#C9CDD6] text-xs mb-1">환율</div>
          <div className="text-[#2EE6A6] font-mono">
            1 RLUSD = {(rlusdPrice.price / xrpPrice.price).toFixed(4)} XRP
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceTicker;