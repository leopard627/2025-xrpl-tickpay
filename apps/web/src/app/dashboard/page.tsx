"use client";

import Link from "next/link";
import { useState } from "react";
import { useWallet } from '../../contexts/WalletContext';
import { useStreaming } from '../../contexts/StreamingContext';
import XamanConnect from '../../components/XamanConnect';
import WalletInfo from '../../components/WalletInfo';
import PriceTicker from '../../components/PriceTicker';

export default function Dashboard() {
  const [isPaused, setIsPaused] = useState(true);
  const [isEditingIntent, setIsEditingIntent] = useState(false);
  const [intentSettings, setIntentSettings] = useState({
    pricePerSecond: 0.02,
    hourlyCap: 5.00,
    dailyCap: 30.00
  });

  const { isConnected, address } = useWallet();
  const { isRunning, channelId, totalCost, caps } = useStreaming();

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="container mx-auto p-8">
        <header className="mb-8">
          <Link href="/" className="text-[#2EE6A6] hover:text-white">← Back to Home</Link>
          <h1 className="text-3xl font-bold mt-4 mb-2">Dashboard</h1>
          <p className="text-[#C9CDD6]">Monitor your payment channels and manage intents</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <PriceTicker />
            </div>

            <div className="bg-[#1A2332] p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold mb-4">Current Intent</h2>

              {!isEditingIntent ? (
                <>
                  <div className="bg-[#0B1220] p-4 rounded mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-[#C9CDD6]">Intent ID</div>
                        <div className="font-mono">it_2025_0001</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#C9CDD6]">Price per Second</div>
                        <div className="text-[#2EE6A6]">${intentSettings.pricePerSecond.toFixed(3)} RLUSD</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#C9CDD6]">Hourly Cap</div>
                        <div className="text-[#2EE6A6]">${intentSettings.hourlyCap.toFixed(2)} RLUSD</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#C9CDD6]">Daily Cap</div>
                        <div className="text-[#2EE6A6]">${intentSettings.dailyCap.toFixed(2)} RLUSD</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingIntent(true)}
                    className="bg-[#2EE6A6] text-[#0B1220] px-4 py-2 rounded font-semibold hover:bg-[#26D396]"
                    disabled={isRunning}
                  >
                    {isRunning ? 'Streaming Active - Cannot Edit' : 'Edit Intent'}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-[#0B1220] p-4 rounded mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-[#C9CDD6] mb-2">Price per Second (RLUSD)</div>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          max="1"
                          value={intentSettings.pricePerSecond}
                          onChange={(e) => setIntentSettings(prev => ({ ...prev, pricePerSecond: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-[#2A3441] text-white px-3 py-2 rounded border border-[#4A5568] focus:border-[#2EE6A6] focus:outline-none"
                        />
                      </div>
                      <div>
                        <div className="text-sm text-[#C9CDD6] mb-2">Hourly Cap (RLUSD)</div>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="100"
                          value={intentSettings.hourlyCap}
                          onChange={(e) => setIntentSettings(prev => ({ ...prev, hourlyCap: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-[#2A3441] text-white px-3 py-2 rounded border border-[#4A5568] focus:border-[#2EE6A6] focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-sm text-[#C9CDD6] mb-2">Daily Cap (RLUSD)</div>
                        <input
                          type="number"
                          step="1"
                          min="5"
                          max="1000"
                          value={intentSettings.dailyCap}
                          onChange={(e) => setIntentSettings(prev => ({ ...prev, dailyCap: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-[#2A3441] text-white px-3 py-2 rounded border border-[#4A5568] focus:border-[#2EE6A6] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsEditingIntent(false);
                        // 여기서 설정을 실제로 저장할 수 있습니다
                        console.log('Intent 설정 저장:', intentSettings);
                      }}
                      className="bg-[#2EE6A6] text-[#0B1220] px-4 py-2 rounded font-semibold hover:bg-[#26D396]"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditingIntent(false)}
                      className="bg-[#4A5568] text-white px-4 py-2 rounded font-semibold hover:bg-[#5A6578]"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="bg-[#1A2332] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>

              {!isRunning && !channelId ? (
                <div className="text-center py-8 text-[#C9CDD6]">
                  <div className="text-4xl mb-3">💤</div>
                  <p className="mb-4">No active streaming sessions</p>
                  <Link
                    href="/stream"
                    className="inline-block bg-[#2EE6A6] text-[#0B1220] px-6 py-3 rounded font-semibold hover:bg-[#26D396] transition-colors"
                  >
                    Start New Session
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {channelId && (
                    <div className="bg-[#0B1220] p-4 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm text-[#C9CDD6]">Session ID</div>
                          <div className="font-mono text-sm">{channelId.slice(0, 16)}...</div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          isRunning ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                        }`}>
                          {isRunning ? 'Streaming' : 'Paused'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                        <div>
                          <div className="text-sm text-[#C9CDD6]">Current Cost</div>
                          <div className="text-[#2EE6A6] font-semibold">${totalCost?.toFixed(2) || '0.00'} RLUSD</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#C9CDD6]">Hourly Usage</div>
                          <div>${caps?.hourlyUsed?.toFixed(2) || '0.00'} / ${caps?.perHour?.toFixed(2) || '5.00'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-[#C9CDD6]">Provider</div>
                          <div className="font-mono text-sm">
                            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#2A3441]">
                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-1 bg-[#2A3441] rounded">직접 XRP 정산</span>
                          <span className="px-2 py-1 bg-[#2A3441] rounded">실시간 사용량 추적</span>
                          <span className="px-2 py-1 bg-[#2A3441] rounded">자동 Cap 보호</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <Link
                  href="/stream"
                  className="bg-[#2EE6A6] text-[#0B1220] px-4 py-2 rounded font-semibold hover:bg-[#26D396] transition-colors"
                >
                  {isRunning ? 'Manage Session' : 'Start New Session'}
                </Link>
                {isRunning && (
                  <Link
                    href="/receipts"
                    className="bg-[#4A5568] text-white px-4 py-2 rounded font-semibold hover:bg-[#5A6578] transition-colors"
                  >
                    View History
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#1A2332] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Cap Usage</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hourly (${intentSettings.hourlyCap.toFixed(2)})</span>
                    <span>${caps?.hourlyUsed?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="w-full bg-[#0B1220] rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        (caps?.hourlyUsed || 0) / intentSettings.hourlyCap >= 0.8
                          ? 'bg-red-500'
                          : (caps?.hourlyUsed || 0) / intentSettings.hourlyCap >= 0.6
                          ? 'bg-yellow-500'
                          : 'bg-[#2EE6A6]'
                      }`}
                      style={{
                        width: `${Math.min(((caps?.hourlyUsed || 0) / intentSettings.hourlyCap) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Daily (${intentSettings.dailyCap.toFixed(2)})</span>
                    <span>${caps?.dailyUsed?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="w-full bg-[#0B1220] rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        (caps?.dailyUsed || 0) / intentSettings.dailyCap >= 0.8
                          ? 'bg-red-500'
                          : (caps?.dailyUsed || 0) / intentSettings.dailyCap >= 0.6
                          ? 'bg-yellow-500'
                          : 'bg-[#2EE6A6]'
                      }`}
                      style={{
                        width: `${Math.min(((caps?.dailyUsed || 0) / intentSettings.dailyCap) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* 경고 메시지 */}
              {caps?.hourlyUsed && caps.hourlyUsed / intentSettings.hourlyCap >= 0.8 && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded text-red-400 text-sm">
                  ⚠️ 시간당 한도의 80%에 도달했습니다. 스트리밍이 곧 자동 중지될 수 있습니다.
                </div>
              )}
              {caps?.dailyUsed && caps.dailyUsed / intentSettings.dailyCap >= 0.8 && (
                <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/40 rounded text-yellow-400 text-sm">
                  ⚠️ 일일 한도의 80%에 도달했습니다.
                </div>
              )}
            </div>

            <div className="bg-[#1A2332] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Emergency Controls</h2>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg ${
                  isPaused
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
              </button>
              <p className="text-sm text-[#C9CDD6] mt-2">
                {isPaused ? 'All payments are paused' : 'Payments are active'}
              </p>
            </div>

            <div className="bg-[#1A2332] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Wallet Status</h2>

              {isConnected ? (
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="text-sm text-[#C9CDD6]">XRPL Address</div>
                    <div className="font-mono text-sm text-[#2EE6A6]">
                      {address?.slice(0, 8)}...{address?.slice(-6)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#C9CDD6]">Network</div>
                    <div className="text-sm">XRPL Devnet</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#C9CDD6]">Status</div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-green-400">Connected</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <XamanConnect />
            </div>

            {/* 지갑이 연결되면 상세 정보 표시 */}
            {isConnected && <WalletInfo className="mt-8" />}
          </div>
        </div>
      </div>
    </div>
  );
}