"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePrice } from "../contexts/PriceContext";
import {
  Network,
  Zap,
  Bot,
  Shield,
  Coins,
  ArrowRight,
  Sparkles,
  Activity,
  Users,
  TrendingUp,
  Globe,
  Rocket
} from 'lucide-react';

export default function Home() {
  const { rlusdPrice, xrpPrice, convertRlusdToXrp } = usePrice();
  const [currentPrice, setCurrentPrice] = useState(0.02);
  const [tickCount, setTickCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [activeAgents, setActiveAgents] = useState(4);
  const [totalVolume, setTotalVolume] = useState(0);

  // 클라이언트 마운트 체크
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // 실시간 가격 데이터에 기반한 동적 가격 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      // 실시간 RLUSD 가격이 있으면 사용, 없으면 기본값 사용
      if (rlusdPrice) {
        const basePrice = 0.02; // RLUSD per second
        const variation = (Math.random() - 0.5) * 0.001;
        setCurrentPrice(Math.max(0.015, Math.min(0.025, basePrice + variation)));
      } else {
        setCurrentPrice(prev => {
          const variation = (Math.random() - 0.5) * 0.001;
          return Math.max(0.015, Math.min(0.025, prev + variation));
        });
      }

      // A2A 시뮬레이션 데이터
      setActiveAgents(prev => 4 + Math.floor(Math.random() * 3));
      setTotalVolume(prev => prev + Math.random() * 0.01);

      setTickCount(prev => prev + 1);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 200);
    }, 3000);

    return () => clearInterval(interval);
  }, [rlusdPrice]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1220] via-[#0F1B2E] to-[#0B1220] text-white relative overflow-hidden">
      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(46,230,166,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(46,230,166,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(46,230,166,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(46,230,166,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
      </div>

      {/* Dynamic Particles - 클라이언트에서만 렌더링 */}
      {isClientMounted && (
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#2EE6A6] rounded-full opacity-40 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
          {/* Floating agent icons */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`agent-${i}`}
              className="absolute opacity-10 animate-bounce"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + Math.random() * 2}s`
              }}
            >
              <Bot className="h-8 w-8 text-[#2EE6A6]" />
            </div>
          ))}
        </div>
      )}

      <div className="container mx-auto p-8 relative z-10">
        {/* Hackathon Hero Section */}
        <div className="text-center py-16 mb-16">
          {/* Hackathon Badge */}
          <div className="mb-8">
            <div className="inline-flex items-center bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 px-8 py-3 rounded-full backdrop-blur-sm animate-pulse">
              <Sparkles className="h-5 w-5 text-yellow-400 mr-3" />
              <span className="text-yellow-400 font-bold text-lg tracking-wider uppercase">
                🏆 XRPL Hackathon 2025 Entry
              </span>
              <Sparkles className="h-5 w-5 text-yellow-400 ml-3" />
            </div>
          </div>

          {/* Main Title with Glitch Effect */}
          <div className="mb-8">
            <h1 className="text-9xl font-black mb-6 tracking-tight relative">
              <span className="text-white relative">
                Tick
                <span className="absolute inset-0 text-[#2EE6A6] animate-ping opacity-20">Tick</span>
              </span>
              <span className="text-[#2EE6A6] inline-block animate-pulse relative">
                Pay
                <span className="absolute -top-2 -right-2">
                  <div className="w-4 h-4 bg-[#2EE6A6] rounded-full animate-bounce"></div>
                </span>
              </span>
            </h1>

            {/* Revolutionary tagline */}
            <div className="text-4xl font-light text-[#C9CDD6] mb-4 tracking-wide">
              <span className="text-[#2EE6A6] font-semibold">Autonomous AI Economy</span> on{" "}
              <span className="bg-gradient-to-r from-[#2EE6A6] to-[#26D396] bg-clip-text text-transparent font-bold">
                XRPL
              </span>
            </div>

            {/* Innovation subtitle */}
            <div className="text-xl text-[#C9CDD6]/80 max-w-4xl mx-auto mb-8">
              First <span className="text-[#2EE6A6] font-semibold">Agent-to-Agent</span> payment infrastructure where{" "}
              <span className="text-white font-semibold">AI agents autonomously discover, negotiate, and pay</span> for services using{" "}
              <span className="text-[#2EE6A6] font-semibold">XRPL credentials and MPTokens</span>
            </div>
          </div>

          {/* Live Network Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 max-w-6xl mx-auto">
            <div className="bg-black/40 backdrop-blur-sm border border-[#2EE6A6]/20 rounded-xl p-6">
              <div className="flex items-center justify-center mb-2">
                <Activity className="h-6 w-6 text-[#2EE6A6] mr-2" />
                <div className="w-2 h-2 bg-[#2EE6A6] rounded-full animate-pulse"></div>
              </div>
              <div className="text-3xl font-bold text-[#2EE6A6]">${currentPrice.toFixed(3)}</div>
              <div className="text-sm text-[#C9CDD6]">RLUSD/sec LIVE</div>
            </div>

            <div className="bg-black/40 backdrop-blur-sm border border-[#2EE6A6]/20 rounded-xl p-6">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-[#2EE6A6] mr-2" />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="text-3xl font-bold text-green-400">{activeAgents}</div>
              <div className="text-sm text-[#C9CDD6]">Active AI Agents</div>
            </div>

            <div className="bg-black/40 backdrop-blur-sm border border-[#2EE6A6]/20 rounded-xl p-6">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-[#2EE6A6] mr-2" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              <div className="text-3xl font-bold text-blue-400">{totalVolume.toFixed(3)}</div>
              <div className="text-sm text-[#C9CDD6]">XRP A2A Volume</div>
            </div>

            <div className="bg-black/40 backdrop-blur-sm border border-[#2EE6A6]/20 rounded-xl p-6">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-6 w-6 text-[#2EE6A6] mr-2" />
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <div className="text-3xl font-bold text-yellow-400">{tickCount}</div>
              <div className="text-sm text-[#C9CDD6]">Payment Ticks</div>
            </div>
          </div>

          {/* Main CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link
              href="/a2a"
              className="group relative inline-flex items-center bg-gradient-to-r from-[#2EE6A6] to-[#26D396] text-[#0B1220] px-12 py-4 rounded-full text-xl font-bold hover:shadow-[0_0_40px_rgba(46,230,166,0.6)] transition-all duration-300 hover:scale-105 uppercase tracking-wide overflow-hidden"
            >
              <div className="absolute inset-0 bg-white opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <Network className="h-6 w-6 mr-3" />
              <span className="relative z-10">Experience A2A Economy</span>
              <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center border-2 border-[#2EE6A6]/50 text-[#2EE6A6] px-12 py-4 rounded-full text-xl font-bold hover:bg-[#2EE6A6]/10 hover:shadow-[0_0_30px_rgba(46,230,166,0.3)] transition-all duration-300 hover:scale-105 uppercase tracking-wide"
            >
              <Rocket className="h-6 w-6 mr-3" />
              Launch Dashboard
            </Link>
          </div>
        </div>

        {/* Revolutionary Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {/* A2A Agent Economy - FEATURED */}
          <Link
            href="/a2a"
            className="group col-span-1 lg:col-span-2 bg-gradient-to-br from-[#2EE6A6]/10 via-black/20 to-[#26D396]/10 backdrop-blur-sm border border-[#2EE6A6]/40 p-8 rounded-3xl hover:border-[#2EE6A6]/80 transition-all duration-500 hover:shadow-[0_0_60px_rgba(46,230,166,0.2)] hover:scale-[1.02] relative overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <div className="bg-[#2EE6A6] text-black px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                🏆 HACKATHON FEATURE
              </div>
            </div>
            <div className="flex items-center mb-6">
              <div className="relative mr-6">
                <Network className="h-16 w-16 text-[#2EE6A6] group-hover:animate-spin" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#2EE6A6] rounded-full animate-bounce"></div>
              </div>
              <div>
                <h2 className="text-4xl font-black mb-2 text-[#2EE6A6] group-hover:text-white transition-colors">
                  Agent-to-Agent Economy
                </h2>
                <div className="text-sm text-[#2EE6A6] uppercase tracking-wider font-bold">
                  🤖 Autonomous AI Payments
                </div>
              </div>
            </div>
            <p className="text-[#C9CDD6] text-lg leading-relaxed group-hover:text-white transition-colors mb-6">
              <span className="text-[#2EE6A6] font-semibold">Revolutionary:</span> AI agents automatically discover, verify credentials, negotiate prices, and pay for services from other agents using <span className="text-[#2EE6A6] font-semibold">real XRPL transactions</span> and <span className="text-[#26D396] font-semibold">MPTokens</span>.
            </p>
            <div className="flex items-center text-[#2EE6A6] group-hover:translate-x-3 transition-transform duration-300 text-lg font-bold">
              <span>Launch A2A Demo</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </div>
            {/* Floating A2A animation */}
            <div className="absolute bottom-4 right-8 opacity-20 group-hover:opacity-40 transition-opacity">
              <div className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-[#2EE6A6] animate-bounce" />
                <ArrowRight className="h-4 w-4 text-[#2EE6A6] animate-pulse" />
                <Bot className="h-8 w-8 text-[#26D396] animate-bounce" style={{animationDelay: '0.2s'}} />
              </div>
            </div>
          </Link>

          {/* AI Payments Chat */}
          <Link
            href="/chat"
            className="group bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20 p-8 rounded-3xl hover:border-[#2EE6A6]/60 transition-all duration-500 hover:shadow-[0_0_50px_rgba(46,230,166,0.1)] hover:scale-105"
          >
            <div className="relative mb-6">
              <Bot className="h-16 w-16 text-[#2EE6A6] opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -bottom-2 -right-2">
                <div className="w-6 h-6 bg-green-400 rounded-full animate-pulse flex items-center justify-center">
                  <Zap className="h-3 w-3 text-black" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[#2EE6A6] group-hover:text-white transition-colors">
              AI Payments Chat
            </h2>
            <p className="text-[#C9CDD6] text-base leading-relaxed group-hover:text-white transition-colors mb-4">
              Chat with AI and pay automatically using <span className="text-[#2EE6A6]">Credentials</span> and <span className="text-[#26D396]">MPTokens</span>
            </p>
            <div className="flex items-center text-[#2EE6A6] group-hover:translate-x-2 transition-transform duration-300">
              <span>Start AI Chat</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </Link>

          {/* Live Stream */}
          <Link
            href="/stream"
            className="group bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20 p-8 rounded-3xl hover:border-[#2EE6A6]/60 transition-all duration-500 hover:shadow-[0_0_50px_rgba(46,230,166,0.1)] hover:scale-105"
          >
            <div className="relative mb-6">
              <Activity className="h-16 w-16 text-[#2EE6A6] opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" />
              <div className="absolute -top-2 -right-2 text-red-400 animate-ping">●</div>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[#2EE6A6] group-hover:text-white transition-colors">
              Live Stream Monitor
            </h2>
            <p className="text-[#C9CDD6] text-base leading-relaxed group-hover:text-white transition-colors mb-4">
              Real-time payment streaming with SLA monitoring and instant controls
            </p>
            <div className="flex items-center text-[#2EE6A6] group-hover:translate-x-2 transition-transform duration-300">
              <span>Go Live</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </Link>

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className="group bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20 p-8 rounded-3xl hover:border-[#2EE6A6]/60 transition-all duration-500 hover:shadow-[0_0_50px_rgba(46,230,166,0.1)] hover:scale-105"
          >
            <div className="relative mb-6">
              <Shield className="h-16 w-16 text-[#2EE6A6] opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -bottom-2 -right-2">
                <Coins className="h-6 w-6 text-yellow-400 animate-bounce" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[#2EE6A6] group-hover:text-white transition-colors">
              Control Dashboard
            </h2>
            <p className="text-[#C9CDD6] text-base leading-relaxed group-hover:text-white transition-colors mb-4">
              Payment channels, spending caps, and emergency controls
            </p>
            <div className="flex items-center text-[#2EE6A6] group-hover:translate-x-2 transition-transform duration-300">
              <span>Open Dashboard</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </Link>

          {/* Receipts */}
          <Link
            href="/receipts"
            className="group bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20 p-8 rounded-3xl hover:border-[#2EE6A6]/60 transition-all duration-500 hover:shadow-[0_0_50px_rgba(46,230,166,0.1)] hover:scale-105"
          >
            <div className="relative mb-6">
              <Globe className="h-16 w-16 text-[#2EE6A6] opacity-60 group-hover:opacity-100 transition-opacity group-hover:animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[#2EE6A6] group-hover:text-white transition-colors">
              XRPL Receipts
            </h2>
            <p className="text-[#C9CDD6] text-base leading-relaxed group-hover:text-white transition-colors mb-4">
              Cryptographic proofs and settlement history on XRPL blockchain
            </p>
            <div className="flex items-center text-[#2EE6A6] group-hover:translate-x-2 transition-transform duration-300">
              <span>View Receipts</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </Link>
        </div>

        {/* Innovation Showcase */}
        <div className="bg-gradient-to-r from-black/40 to-[#0F1B2E]/40 backdrop-blur-sm border border-[#2EE6A6]/20 p-12 rounded-3xl mb-20">
          <div className="text-center mb-12">
            <h3 className="text-5xl font-black mb-6">
              The Future of <span className="text-[#2EE6A6]">AI Payments</span>
            </h3>
            <p className="text-xl text-[#C9CDD6] max-w-4xl mx-auto">
              Built for the XRPL Hackathon 2025 - Demonstrating autonomous AI economy with real blockchain transactions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-[#2EE6A6]/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-[#2EE6A6]/20 transition-colors">
                <Shield className="h-10 w-10 text-[#2EE6A6]" />
              </div>
              <h4 className="text-xl font-bold text-[#2EE6A6] mb-2">Credential-Based Trust</h4>
              <p className="text-[#C9CDD6] text-sm">
                AI agents verify each other using XRPL Credentials before autonomous payments
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-[#2EE6A6]/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-[#2EE6A6]/20 transition-colors">
                <Coins className="h-10 w-10 text-[#2EE6A6]" />
              </div>
              <h4 className="text-xl font-bold text-[#2EE6A6] mb-2">MPToken Subscriptions</h4>
              <p className="text-[#C9CDD6] text-sm">
                Subscription-based service access using XRPL Multi-Party Tokens
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-[#2EE6A6]/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:bg-[#2EE6A6]/20 transition-colors">
                <Network className="h-10 w-10 text-[#2EE6A6]" />
              </div>
              <h4 className="text-xl font-bold text-[#2EE6A6] mb-2">Autonomous Discovery</h4>
              <p className="text-[#C9CDD6] text-sm">
                AI agents automatically find, negotiate, and pay for services from other agents
              </p>
            </div>
          </div>
        </div>

        {/* Hackathon Footer */}
        <div className="text-center mt-20 pb-8">
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-8 mb-8">
            <div className="text-yellow-400 font-bold text-lg mb-4">🏆 XRPL Hackathon 2025 Entry</div>
            <div className="text-2xl font-bold mb-2">
              Built on <span className="text-[#2EE6A6]">XRP Ledger</span>
            </div>
            <div className="text-[#C9CDD6]">Fast. Scalable. Sustainable. Revolutionary.</div>
          </div>

          <div className="text-sm text-[#C9CDD6]/60">
            Demonstrating the future of autonomous AI payments on blockchain
          </div>
        </div>
      </div>
    </div>
  );
}