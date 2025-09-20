"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 가격 데이터 인터페이스
interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  lastUpdated: number;
}

interface PriceContextType {
  rlusdPrice: PriceData | null;
  xrpPrice: PriceData | null;
  isConnected: boolean;
  connectionError: string | null;
  reconnect: () => void;
  // Helper 함수들
  getRlusdToXrpRate: () => number;
  convertRlusdToXrp: (rlusdAmount: number) => number;
  convertXrpToRlusd: (xrpAmount: number) => number;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

interface PriceProviderProps {
  children: ReactNode;
}

export const PriceProvider: React.FC<PriceProviderProps> = ({ children }) => {
  const [rlusdPrice, setRlusdPrice] = useState<PriceData | null>(null);
  const [xrpPrice, setXrpPrice] = useState<PriceData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  const BITGET_WS_URL = 'wss://ws.bitget.com/v2/ws/public';

  // Mock 데이터 생성 함수
  const generateMockData = () => {
    const baseRlusdPrice = 1.00;
    const baseXrpPrice = 2.45;

    // 작은 변동을 추가하여 실시간 느낌 생성
    const rlusdVariation = (Math.random() - 0.5) * 0.01; // ±0.005
    const xrpVariation = (Math.random() - 0.5) * 0.05; // ±0.025

    const mockRlusd: PriceData = {
      symbol: 'RLUSD/USDT',
      price: baseRlusdPrice + rlusdVariation,
      change24h: (Math.random() - 0.5) * 0.02,
      changePercent24h: (Math.random() - 0.5) * 2,
      volume24h: Math.random() * 1000000 + 500000,
      lastUpdated: Date.now()
    };

    const mockXrp: PriceData = {
      symbol: 'XRP/USDT',
      price: baseXrpPrice + xrpVariation,
      change24h: (Math.random() - 0.5) * 0.2,
      changePercent24h: (Math.random() - 0.5) * 8,
      volume24h: Math.random() * 50000000 + 20000000,
      lastUpdated: Date.now()
    };

    setRlusdPrice(mockRlusd);
    setXrpPrice(mockXrp);
    // console.log('🎭 Mock 데이터 업데이트:', { rlusd: mockRlusd, xrp: mockXrp });
  };

  // Mock 데이터 모드 시작
  const startMockDataMode = () => {
    console.log('🎭 Mock 데이터 모드 시작');
    setUseMockData(true);
    setIsConnected(true);
    setConnectionError(null);

    // 즉시 첫 데이터 생성
    generateMockData();

    // 5초마다 mock 데이터 업데이트
    const interval = setInterval(generateMockData, 5000);

    return () => clearInterval(interval);
  };

  const connectWebSocket = () => {
    try {
      const websocket = new WebSocket(BITGET_WS_URL);

      websocket.onopen = () => {
        console.log('🔗 Bitget WebSocket 연결됨');
        setIsConnected(true);
        setConnectionError(null);

        // RLUSD/USDT와 XRP/USDT 실시간 가격 구독 (Bitget v2 API 형식)
        const subscribeMessage = {
          op: 'subscribe',
          args: [{
            instType: 'SPOT',
            channel: 'ticker',
            instId: 'RLUSDUSDT'
          }, {
            instType: 'SPOT',
            channel: 'ticker',
            instId: 'XRPUSDT'
          }]
        };

        websocket.send(JSON.stringify(subscribeMessage));
        console.log('💰 가격 피드 구독 요청:', subscribeMessage);
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // console.log('📨 Bitget WebSocket 원본 데이터:', data);

          // ping-pong 처리
          if (data === 'pong') {
            // console.log('🏓 pong 수신됨');
            return;
          }

          // 구독 확인 메시지
          if (data.event === 'subscribe') {
            // console.log('✅ 구독 성공:', data);
            return;
          }

          // 실제 ticker 데이터 처리
          if (data.action === 'snapshot' || data.action === 'update') {
            data.data?.forEach((ticker: any) => {
              // console.log('📊 Ticker 데이터:', ticker);

              if (ticker.instId === 'RLUSDUSDT') {
                const priceData: PriceData = {
                  symbol: 'RLUSD/USDT',
                  price: parseFloat(ticker.lastPr || ticker.last || '0'),
                  change24h: parseFloat(ticker.change24h || '0'),
                  changePercent24h: parseFloat(ticker.changePercent24h || '0'),
                  volume24h: parseFloat(ticker.baseVol || ticker.baseVolume || '0'),
                  lastUpdated: Date.now()
                };

                setRlusdPrice(priceData);
                // console.log('📈 RLUSD 가격 업데이트:', priceData);
              }

              if (ticker.instId === 'XRPUSDT') {
                const priceData: PriceData = {
                  symbol: 'XRP/USDT',
                  price: parseFloat(ticker.lastPr || ticker.last || '0'),
                  change24h: parseFloat(ticker.change24h || '0'),
                  changePercent24h: parseFloat(ticker.changePercent24h || '0'),
                  volume24h: parseFloat(ticker.baseVol || ticker.baseVolume || '0'),
                  lastUpdated: Date.now()
                };

                setXrpPrice(priceData);
                // console.log('📈 XRP 가격 업데이트:', priceData);
              }
            });
          }
        } catch (error) {
          console.error('가격 데이터 파싱 오류:', error);
          console.error('원본 데이터:', event.data);
        }
      };

      websocket.onerror = (error) => {
        console.error('Bitget WebSocket 오류:', error);
        console.log('🔄 Mock 데이터 모드로 전환...');
        setConnectionError('WebSocket 연결 실패 - Mock 데이터 사용');
        setIsConnected(false);

        // 3초 후 mock 데이터 모드로 전환
        setTimeout(() => {
          startMockDataMode();
        }, 3000);
      };

      websocket.onclose = (event) => {
        console.log('Bitget WebSocket 연결 종료:', event.code, event.reason);
        setIsConnected(false);

        // Mock 데이터 모드가 아닌 경우에만 재연결 시도
        if (!useMockData && !event.wasClean) {
          setTimeout(() => {
            console.log('🔄 Bitget WebSocket 자동 재연결 시도...');
            connectWebSocket();
          }, 5000);
        } else if (!useMockData) {
          // 정상 종료된 경우에도 mock 데이터 모드로 전환
          console.log('🔄 Mock 데이터 모드로 전환...');
          setTimeout(() => {
            startMockDataMode();
          }, 2000);
        }
      };

      setWs(websocket);
    } catch (error) {
      console.error('WebSocket 초기화 실패:', error);
      setConnectionError('WebSocket 초기화 실패 - Mock 데이터 사용');

      // 즉시 mock 데이터 모드로 전환
      setTimeout(() => {
        startMockDataMode();
      }, 1000);
    }
  };

  const reconnect = () => {
    if (ws) {
      ws.close();
    }
    connectWebSocket();
  };

  // 컴포넌트 마운트 시 WebSocket 연결
  useEffect(() => {
    connectWebSocket();

    // 컴포넌트 언마운트 시 연결 정리
    return () => {
      if (ws) {
        console.log('🔌 Bitget WebSocket 연결 해제');
        ws.close();
      }
    };
  }, []);

  // 연결 상태 확인용 하트비트 (30초마다)
  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Bitget ping 메시지
        ws.send(JSON.stringify({ op: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(heartbeat);
  }, [ws]);

  // Helper 함수들
  const getRlusdToXrpRate = (): number => {
    if (!rlusdPrice || !xrpPrice) {
      // Fallback 환율 (RLUSD $1.00, XRP $2.45 기준)
      return 1.0 / 2.45; // 약 0.408
    }
    return rlusdPrice.price / xrpPrice.price;
  };

  const convertRlusdToXrp = (rlusdAmount: number): number => {
    const rate = getRlusdToXrpRate();
    return rlusdAmount * rate;
  };

  const convertXrpToRlusd = (xrpAmount: number): number => {
    const rate = getRlusdToXrpRate();
    return xrpAmount / rate;
  };

  const contextValue: PriceContextType = {
    rlusdPrice,
    xrpPrice,
    isConnected,
    connectionError,
    reconnect,
    getRlusdToXrpRate,
    convertRlusdToXrp,
    convertXrpToRlusd
  };

  return (
    <PriceContext.Provider value={contextValue}>
      {children}
    </PriceContext.Provider>
  );
};

export const usePrice = (): PriceContextType => {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error('usePrice must be used within a PriceProvider');
  }
  return context;
};