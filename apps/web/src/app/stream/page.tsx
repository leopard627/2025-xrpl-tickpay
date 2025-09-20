"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useStreaming } from '../../contexts/StreamingContext';
import { useWallet } from '../../contexts/WalletContext';
import StreamingChart from '../../components/StreamingChart';
import XamanConnect from '../../components/XamanConnect';

export default function LiveStream() {
  const { isConnected, address } = useWallet();
  const {
    isRunning,
    totalCost,
    currentRate,
    elapsedSeconds,
    tokensProcessed,
    channelId,
    providerAddress,
    metrics,
    caps,
    usageProofs,
    startStreaming,
    stopStreaming,
    pauseStreaming,
    settleNow,
    isLoading,
    error
  } = useStreaming();

  const [jobId, setJobId] = useState("");
  const [costHistory, setCostHistory] = useState<number[]>([]);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [throughputHistory, setThroughputHistory] = useState<number[]>([]);

  // 히스토리 데이터 업데이트
  useEffect(() => {
    if (isRunning) {
      setCostHistory(prev => [...prev.slice(-59), totalCost]);
      setLatencyHistory(prev => [...prev.slice(-59), metrics.latency]);
      setThroughputHistory(prev => [...prev.slice(-59), metrics.throughput]);
    }
  }, [isRunning, totalCost, metrics]);

  const handleStartJob = async () => {
    if (!isConnected || !address) {
      alert('지갑을 먼저 연결해주세요!');
      return;
    }

    setJobId(`job_${Date.now().toString(36)}`);
    await startStreaming();
  };

  const handleStopJob = () => {
    stopStreaming();
  };

  const handleSettleNow = async () => {
    console.log('🔘 Settle Now 버튼 클릭됨', {
      usageProofs: usageProofs.length,
      isLoading,
      totalCost,
      elapsedSeconds
    });

    if (window.confirm('현재까지의 사용량을 정산하시겠습니까?')) {
      console.log('✅ 사용자가 정산 확인함');
      try {
        await settleNow();
        console.log('✅ 정산 완료됨');
      } catch (error) {
        console.error('❌ 정산 실패:', error);
      }
    } else {
      console.log('❌ 사용자가 정산 취소함');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="container mx-auto p-8">
        <header className="mb-8">
          <Link href="/" className="text-[#2EE6A6] hover:text-white">← Back to Home</Link>
          <h1 className="text-3xl font-bold mt-4 mb-2">Live Stream</h1>
          <p className="text-[#C9CDD6]">Real-time usage monitoring and cost tracking</p>
        </header>

        {/* 지갑 연결 필수 UI */}
        {!isConnected && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-600/30 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h2 className="text-2xl font-bold text-yellow-500">지갑 연결 필요</h2>
              </div>
              <p className="text-[#C9CDD6] mb-6">
                실시간 스트리밍 결제를 시작하려면 Xaman 지갑을 먼저 연결해야 합니다.
                연결된 지갑이 결제를 받을 Provider 주소로 사용됩니다.
              </p>

              <div className="bg-[#1A2332] p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-3 text-[#2EE6A6]">스트리밍 결제 방식:</h3>
                <div className="space-y-2 text-sm text-[#C9CDD6]">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-[#2EE6A6] rounded-full mr-3"></span>
                    실시간으로 초당 $0.02 RLUSD 과금
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-[#2EE6A6] rounded-full mr-3"></span>
                    XRPL Payment Channels를 통한 마이크로 결제
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-[#2EE6A6] rounded-full mr-3"></span>
                    연결된 지갑으로 즉시 결제 수령
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-[#2EE6A6] rounded-full mr-3"></span>
                    시간당 $5.00, 일일 $30.00 자동 제한
                  </div>
                </div>
              </div>

              <XamanConnect
                className="max-w-md"
                onSuccess={() => {
                  console.log('🎉 지갑 연결 완료 - 스트리밍 준비됨');
                }}
              />
            </div>
          </div>
        )}

        {/* 지갑이 연결된 경우에만 스트리밍 컨트롤 표시 */}
        {isConnected && (
          <>
            {/* 연결된 지갑 정보 표시 */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-green-600/20 to-[#2EE6A6]/20 border border-green-600/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                    <div>
                      <div className="text-sm text-[#C9CDD6]">Connected Payout Wallet</div>
                      <div className="font-mono text-[#2EE6A6] font-semibold">
                        {address?.slice(0, 8)}...{address?.slice(-6)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#C9CDD6]">Ready for Streaming</div>
                    <div className="text-[#2EE6A6] text-sm">Provider Address Set</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-[#1A2332] p-6 rounded-lg mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">Job Control</h2>
                      <p className="text-sm text-[#C9CDD6]">Start streaming to earn $0.02 RLUSD per second</p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={handleStartJob}
                        disabled={isRunning || isLoading}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-semibold"
                      >
                        {isLoading ? '준비중...' : '▶ Start Job'}
                      </button>
                      <button
                        onClick={handleStopJob}
                        disabled={!isRunning || isLoading}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-semibold"
                      >
                        ⏹ Stop Job
                      </button>
                    </div>
                  </div>

              {jobId && (
                <div className="bg-[#0B1220] p-4 rounded mb-6">
                  <div className="text-sm text-[#C9CDD6]">Current Job ID</div>
                  <div className="font-mono">{jobId}</div>
                  <div className="flex items-center mt-2">
                    <div className={`w-3 h-3 rounded-full mr-2 ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-sm">{isRunning ? 'Running' : 'Stopped'}</span>
                  </div>
                </div>
              )}

              <div className="bg-[#0B1220] p-6 rounded-lg">
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-[#2EE6A6] mb-2">
                    ${totalCost.toFixed(2)}
                  </div>
                  <div className="text-xl text-[#C9CDD6]">Total Cost (RLUSD)</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center bg-[#1A2332] p-4 rounded">
                    <div className="text-2xl font-bold text-[#2EE6A6]">${currentRate.toFixed(2)}</div>
                    <div className="text-sm text-[#C9CDD6]">Current Rate/sec</div>
                  </div>
                  <div className="text-center bg-[#1A2332] p-4 rounded">
                    <div className="text-2xl font-bold text-[#2EE6A6]">{elapsedSeconds}</div>
                    <div className="text-sm text-[#C9CDD6]">Seconds Elapsed</div>
                  </div>
                  <div className="text-center bg-[#1A2332] p-4 rounded">
                    <div className="text-2xl font-bold text-[#2EE6A6]">{tokensProcessed.toLocaleString()}</div>
                    <div className="text-sm text-[#C9CDD6]">Tokens Processed</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1A2332] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Usage Metrics</h2>
              <div className="space-y-4">
                <div className="bg-[#0B1220] p-4 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#C9CDD6]">Latency</span>
                    <span className="text-[#2EE6A6]">{metrics.latency.toFixed(0)}ms</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metrics.latency <= 120 ? 'bg-[#2EE6A6]' : 'bg-red-500'
                      }`}
                      style={{width: `${Math.min((metrics.latency / 120) * 100, 100)}%`}}
                    ></div>
                  </div>
                  <div className="text-xs text-[#C9CDD6] mt-1">SLA: ≤120ms</div>
                </div>

                <div className="bg-[#0B1220] p-4 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#C9CDD6]">Error Rate</span>
                    <span className="text-[#2EE6A6]">{metrics.errorRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metrics.errorRate < 0.5 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{width: `${Math.min((metrics.errorRate / 0.5) * 100, 100)}%`}}
                    ></div>
                  </div>
                  <div className="text-xs text-[#C9CDD6] mt-1">SLA: &lt;0.5%</div>
                </div>

                <div className="bg-[#0B1220] p-4 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#C9CDD6]">Throughput</span>
                    <span className="text-[#2EE6A6]">{metrics.throughput.toFixed(0)} tokens/s</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-[#2EE6A6] h-2 rounded-full transition-all"
                      style={{width: `${Math.min((metrics.throughput / 1000) * 100, 100)}%`}}
                    ></div>
                  </div>
                  <div className="text-xs text-[#C9CDD6] mt-1">Target: ~800 tokens/s</div>
                </div>
              </div>

              {/* 실시간 차트 추가 */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Real-time Charts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StreamingChart
                    data={latencyHistory}
                    label="Latency (ms)"
                    color="#2EE6A6"
                    maxValue={150}
                  />
                  <StreamingChart
                    data={throughputHistory}
                    label="Throughput (tokens/s)"
                    color="#26D396"
                    maxValue={1000}
                  />
                </div>
                <StreamingChart
                  data={costHistory}
                  label="Cost Accumulation (RLUSD)"
                  color="#C9CDD6"
                />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#1A2332] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Live Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[#C9CDD6]">Provider</span>
                  <span className="font-mono text-sm">{providerAddress.slice(0, 6)}...{providerAddress.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9CDD6]">Channel ID</span>
                  <span className="font-mono text-sm">
                    {channelId ? `${channelId.slice(0, 6)}...` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9CDD6]">XRP Equivalent</span>
                  <span className="text-[#2EE6A6]">{(totalCost * 1.92).toFixed(6)} XRP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9CDD6]">Usage Proofs</span>
                  <span className="text-sm">{usageProofs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9CDD6]">Last Claim</span>
                  <span className="text-sm">{isRunning ? 'Live' : (usageProofs.length > 0 ? 'Ready' : 'N/A')}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1A2332] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Cap Status</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hourly Limit</span>
                    <span>${caps.hourlyUsed.toFixed(2)} / ${caps.perHour.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-[#0B1220] rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        caps.hourlyUsed >= caps.perHour ? 'bg-red-500' : 'bg-[#2EE6A6]'
                      }`}
                      style={{width: `${Math.min((caps.hourlyUsed / caps.perHour) * 100, 100)}%`}}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Daily Limit</span>
                    <span>${caps.dailyUsed.toFixed(2)} / ${caps.perDay.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-[#0B1220] rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        caps.dailyUsed >= caps.perDay ? 'bg-red-500' : 'bg-[#2EE6A6]'
                      }`}
                      style={{width: `${Math.min((caps.dailyUsed / caps.perDay) * 100, 100)}%`}}
                    ></div>
                  </div>
                </div>
              </div>

              {caps.hourlyUsed >= caps.perHour && (
                <div className="mt-4 p-3 bg-red-600 rounded text-sm">
                  ⚠️ Hourly cap reached! Job paused automatically.
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-600 rounded text-sm">
                  ❌ {error}
                </div>
              )}
            </div>

            <div className="bg-[#1A2332] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={handleSettleNow}
                  disabled={isLoading || usageProofs.length === 0}
                  className="w-full bg-[#2EE6A6] text-[#0B1220] py-2 rounded font-semibold hover:bg-[#26D396] disabled:bg-gray-600 disabled:text-white disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Settling...' : `Settle Now (${usageProofs.length} proofs)`}
                </button>
                <button
                  onClick={isRunning ? pauseStreaming : () => {}}
                  disabled={!isRunning || isLoading}
                  className="w-full bg-yellow-600 text-white py-2 rounded font-semibold hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {isRunning ? 'Pause Job' : 'Resume Job'}
                </button>
                <Link href="/receipts" className="block w-full bg-gray-600 text-white py-2 rounded font-semibold text-center hover:bg-gray-700">
                  View Receipts
                </Link>
              </div>

            </div>
              </div>
            </div>
          </>
        )}

        {/* 지갑이 연결되지 않은 상태에서는 이 메시지만 표시됨 */}
        {!isConnected && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold mb-4">Wallet Connection Required</h2>
            <p className="text-[#C9CDD6] max-w-md mx-auto">
              Connect your Xaman wallet above to start earning with real-time streaming payments.
              Your connected wallet will receive all payments instantly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}