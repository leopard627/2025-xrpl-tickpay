'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIAgent, A2ATransaction } from '@/lib/a2a-agents';
import {
  Bot,
  Zap,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Activity,
  Coins,
  Sparkles,
  Star
} from 'lucide-react';

interface A2APixelVisualizationProps {
  agents: AIAgent[];
  transactions: A2ATransaction[];
  isAutoMode: boolean;
}

interface AgentActivity {
  agentId: string;
  status: 'idle' | 'processing' | 'sending' | 'receiving' | 'completed';
  currentTransaction?: A2ATransaction;
  lastActivity?: Date;
  animationTrigger?: number; // For triggering re-animations
}

interface FloatingParticle {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  speed: number;
  lifespan: number;
  created: number;
}

export default function A2APixelVisualization({ agents, transactions, isAutoMode }: A2APixelVisualizationProps) {
  const [agentActivities, setAgentActivities] = useState<Map<string, AgentActivity>>(new Map());
  const [recentTransactions, setRecentTransactions] = useState<A2ATransaction[]>([]);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [transactionBeams, setTransactionBeams] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize agent activities
  useEffect(() => {
    const activities = new Map<string, AgentActivity>();
    agents.forEach(agent => {
      activities.set(agent.id, {
        agentId: agent.id,
        status: 'idle'
      });
    });
    setAgentActivities(activities);
  }, [agents]);

  // Update activities based on transactions with animations
  useEffect(() => {
    const newRecentTx = transactions.slice(-5).reverse(); // Show last 5 transactions
    setRecentTransactions(newRecentTx);

    // Update agent activities based on recent transactions
    const updatedActivities = new Map(agentActivities);

    // Reset all to idle first
    updatedActivities.forEach(activity => {
      if (activity.status !== 'idle') {
        activity.status = 'idle';
      }
    });

    // Update based on recent transactions and trigger animations
    newRecentTx.forEach(tx => {
      const fromActivity = updatedActivities.get(tx.serviceRequest.fromAgent);
      const toActivity = updatedActivities.get(tx.serviceRequest.toAgent);

      if (fromActivity) {
        fromActivity.currentTransaction = tx;
        fromActivity.lastActivity = tx.serviceRequest.timestamp;
        fromActivity.animationTrigger = Date.now();

        if (tx.status === 'pending') {
          fromActivity.status = 'sending';
        } else if (tx.status === 'completed') {
          fromActivity.status = 'completed';
          // Trigger completion particles
          createParticleExplosion(tx.serviceRequest.fromAgent, 'completed');
        } else if (tx.status === 'failed') {
          fromActivity.status = 'idle';
        }
      }

      if (toActivity) {
        toActivity.currentTransaction = tx;
        toActivity.lastActivity = tx.serviceRequest.timestamp;
        toActivity.animationTrigger = Date.now();

        if (tx.status === 'pending') {
          toActivity.status = 'processing';
          // Create processing particles
          createParticleExplosion(tx.serviceRequest.toAgent, 'processing');
        } else if (tx.status === 'completed') {
          toActivity.status = 'completed';
          // Trigger success beam
          triggerTransactionBeam(`${tx.serviceRequest.fromAgent}-${tx.serviceRequest.toAgent}`);
        } else if (tx.status === 'failed') {
          toActivity.status = 'idle';
        }
      }
    });

    setAgentActivities(updatedActivities);
  }, [transactions]);

  // Particle animation system
  const createParticleExplosion = (agentId: string, type: 'completed' | 'processing' | 'sending') => {
    const colors = {
      completed: '#2EE6A6',
      processing: '#FCD34D',
      sending: '#60A5FA'
    };

    const newParticles: FloatingParticle[] = [];
    const particleCount = type === 'completed' ? 12 : 6;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 30 + Math.random() * 20;

      newParticles.push({
        id: `${agentId}-${type}-${i}-${Date.now()}`,
        x: 32, // Center of 64px agent box
        y: 32,
        targetX: 32 + Math.cos(angle) * distance,
        targetY: 32 + Math.sin(angle) * distance,
        color: colors[type],
        size: 2 + Math.random() * 3,
        speed: 0.1 + Math.random() * 0.1,
        lifespan: 1000 + Math.random() * 1000,
        created: Date.now()
      });
    }

    setParticles(prev => [...prev.slice(-20), ...newParticles]); // Keep max 20 particles
  };

  // Transaction beam effect
  const triggerTransactionBeam = (beamId: string) => {
    setTransactionBeams(prev => [...prev, beamId]);
    setTimeout(() => {
      setTransactionBeams(prev => prev.filter(id => id !== beamId));
    }, 1000);
  };

  // Animate particles
  useEffect(() => {
    const animateParticles = () => {
      const now = Date.now();

      setParticles(prev => prev
        .map(particle => {
          const age = now - particle.created;
          const progress = Math.min(age / particle.lifespan, 1);

          return {
            ...particle,
            x: particle.x + (particle.targetX - particle.x) * particle.speed,
            y: particle.y + (particle.targetY - particle.y) * particle.speed,
          };
        })
        .filter(particle => now - particle.created < particle.lifespan)
      );
    };

    const interval = setInterval(animateParticles, 50);
    return () => clearInterval(interval);
  }, []);

  const getAgentStatusColor = (status: string, animationTrigger?: number) => {
    const baseClasses = {
      'idle': 'bg-gray-600 border-gray-400',
      'processing': 'bg-yellow-500 border-yellow-300',
      'sending': 'bg-blue-500 border-blue-300',
      'receiving': 'bg-green-500 border-green-300',
      'completed': 'bg-[#2EE6A6] border-[#26D396]'
    };

    const animationClasses = {
      'idle': '',
      'processing': 'animate-pulse',
      'sending': 'animate-bounce',
      'receiving': 'animate-pulse',
      'completed': 'animate-ping'
    };

    const base = baseClasses[status as keyof typeof baseClasses] || baseClasses['idle'];
    const animation = animationClasses[status as keyof typeof animationClasses] || '';

    // Add extra effects for active states
    let extraEffects = '';
    if (status !== 'idle') {
      extraEffects = 'shadow-lg transform scale-105 transition-all duration-300';
      if (status === 'completed') {
        extraEffects += ' shadow-[#2EE6A6]/50 glow-effect';
      } else if (status === 'processing') {
        extraEffects += ' shadow-yellow-500/50';
      } else if (status === 'sending') {
        extraEffects += ' shadow-blue-500/50';
      }
    }

    return `${base} ${animation} ${extraEffects}`;
  };

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'idle': return <Bot className="h-3 w-3" />;
      case 'processing': return <Activity className="h-3 w-3" />;
      case 'sending': return <ArrowRight className="h-3 w-3" />;
      case 'receiving': return <Zap className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      default: return <Bot className="h-3 w-3" />;
    }
  };

  const getTransactionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'pending': return <Clock className="h-3 w-3 text-yellow-400" />;
      case 'failed': return <AlertCircle className="h-3 w-3 text-red-400" />;
      default: return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pixel Agent Network Visualization */}
      <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2EE6A6]">
            <Activity className="h-5 w-5" />
            Live Agent Network Activity
            {isAutoMode && (
              <Badge className="bg-green-400/20 text-green-400 border-green-400/30 animate-pulse">
                AUTO MODE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Pixel Grid of Agents */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-8" ref={containerRef}>
            {agents.map((agent, index) => {
              const activity = agentActivities.get(agent.id);
              const statusColor = getAgentStatusColor(activity?.status || 'idle', activity?.animationTrigger);

              return (
                <div key={agent.id} className="text-center relative">
                  {/* Pixel Agent Avatar */}
                  <div className="relative mx-auto mb-2">
                    {/* Main Agent Box */}
                    <div
                      className={`w-16 h-16 rounded-lg border-2 ${statusColor} flex items-center justify-center relative overflow-hidden`}
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%),
                          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px),
                          radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)
                        `,
                        imageRendering: 'pixelated' as any,
                      }}
                    >
                      {/* Agent Icon */}
                      <div className={`text-white ${activity?.status !== 'idle' ? 'animate-pulse' : ''}`}>
                        {getAgentStatusIcon(activity?.status || 'idle')}
                      </div>

                      {/* Pixel-style scanlines */}
                      <div className="absolute inset-0 opacity-20">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-full bg-white opacity-10"
                            style={{
                              height: '1px',
                              top: `${i * 8}px`,
                              animation: activity?.status !== 'idle' ? `scanline 2s linear infinite ${i * 0.1}s` : 'none'
                            }}
                          />
                        ))}
                      </div>

                      {/* Activity pulse rings */}
                      {activity?.status !== 'idle' && (
                        <>
                          <div className="absolute inset-0 border-2 border-[#2EE6A6] rounded-lg animate-ping opacity-30" />
                          <div className="absolute inset-0 border border-[#2EE6A6] rounded-lg animate-pulse opacity-20"
                               style={{ animationDelay: '0.5s' }} />
                        </>
                      )}

                      {/* Transaction indicator with bounce */}
                      {activity?.currentTransaction && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#2EE6A6] rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-[#2EE6A6]/50">
                          <Coins className="h-2 w-2 text-black animate-spin" />
                        </div>
                      )}

                      {/* Success celebration particles */}
                      {activity?.status === 'completed' && (
                        <div className="absolute inset-0 pointer-events-none">
                          {[...Array(8)].map((_, i) => (
                            <div
                              key={`star-${i}`}
                              className="absolute w-1 h-1 bg-[#2EE6A6] rounded-full animate-ping opacity-80"
                              style={{
                                left: `${20 + (i % 4) * 15}px`,
                                top: `${20 + Math.floor(i / 4) * 15}px`,
                                animationDelay: `${i * 0.1}s`,
                                animationDuration: '0.8s'
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Floating Particles */}
                    <div className="absolute inset-0 pointer-events-none">
                      {particles
                        .filter(p => p.id.startsWith(agent.id))
                        .map(particle => (
                          <div
                            key={particle.id}
                            className="absolute rounded-full animate-pulse"
                            style={{
                              left: `${particle.x}px`,
                              top: `${particle.y}px`,
                              width: `${particle.size}px`,
                              height: `${particle.size}px`,
                              backgroundColor: particle.color,
                              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                              transform: `translate(-50%, -50%) scale(${1 - (Date.now() - particle.created) / particle.lifespan})`,
                              opacity: Math.max(0, 1 - (Date.now() - particle.created) / particle.lifespan)
                            }}
                          />
                        ))
                      }
                    </div>

                    {/* Processing effect */}
                    {activity?.status === 'processing' && (
                      <div className="absolute -inset-2 pointer-events-none">
                        <div className="w-full h-full border-2 border-dashed border-yellow-400 rounded-xl animate-spin opacity-60" />
                      </div>
                    )}
                  </div>

                  {/* Agent Info */}
                  <div className="text-xs">
                    <div className="font-medium text-white mb-1 truncate">
                      {agent.name}
                    </div>
                    <div className="text-[#C9CDD6] capitalize">
                      {activity?.status || 'idle'}
                    </div>
                    <div className="text-[#2EE6A6] font-mono text-[10px]">
                      {agent.pricePerRequest} XRP
                    </div>

                    {/* Current Service */}
                    {activity?.currentTransaction && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {activity.currentTransaction.serviceRequest.serviceType.replace('-', ' ')}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Retro Network Visualization */}
          <div className="relative bg-[#0F1825] rounded-lg p-4 mb-6 overflow-hidden">
            {/* Matrix-style background */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-px bg-[#2EE6A6] data-stream"
                  style={{
                    left: `${i * 5}%`,
                    animationDelay: `${i * 0.2}s`,
                    height: '2px'
                  }}
                />
              ))}
            </div>

            <div className="relative text-center text-sm text-[#C9CDD6] mb-4 text-flicker">
              🌐 NETWORK CONNECTIONS
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {recentTransactions.slice(0, 6).map((tx, index) => {
                const fromAgent = agents.find(a => a.id === tx.serviceRequest.fromAgent);
                const toAgent = agents.find(a => a.id === tx.serviceRequest.toAgent);

                return (
                  <div
                    key={tx.id}
                    className="bg-[#1A2332] rounded p-2 border border-[#2EE6A6]/10 relative overflow-hidden pixel-perfect hover:scale-105 transition-transform"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Transaction beam effect */}
                    {tx.status === 'completed' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2EE6A6]/30 to-transparent transaction-beam" />
                    )}

                    <div className="flex items-center justify-between text-xs relative z-10">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          tx.status === 'completed' ? 'bg-[#2EE6A6] animate-ping' :
                          tx.status === 'pending' ? 'bg-yellow-400 animate-pulse' :
                          'bg-blue-400'
                        }`}></div>
                        <span className="text-[#C9CDD6] truncate w-12 font-mono">
                          {fromAgent?.name.split(' ')[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Animated connection arrow */}
                        <div className="flex items-center">
                          {tx.status === 'pending' && (
                            <>
                              <div className="w-1 h-px bg-[#2EE6A6] animate-pulse" />
                              <ArrowRight className="h-2 w-2 text-[#2EE6A6] animate-bounce mx-1" />
                              <div className="w-1 h-px bg-[#2EE6A6] animate-pulse" />
                            </>
                          )}
                          {tx.status === 'completed' && (
                            <>
                              <div className="w-2 h-px bg-[#2EE6A6] animate-ping" />
                              <ArrowRight className="h-3 w-3 text-[#2EE6A6] glow-effect mx-1" />
                              <div className="w-2 h-px bg-[#2EE6A6] animate-ping" />
                            </>
                          )}
                          {tx.status === 'failed' && (
                            <ArrowRight className="h-3 w-3 text-red-400 digital-noise" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[#C9CDD6] truncate w-12 font-mono">
                          {toAgent?.name.split(' ')[0]}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${
                          tx.status === 'completed' ? 'bg-[#2EE6A6] animate-ping' :
                          tx.status === 'pending' ? 'bg-yellow-400 animate-pulse' :
                          'bg-green-400'
                        }`}></div>
                      </div>
                    </div>

                    <div className="text-center mt-1 relative z-10">
                      <div className={tx.status === 'completed' ? 'glow-effect' : ''}>
                        {getTransactionStatusIcon(tx.status)}
                      </div>
                    </div>

                    {/* Loading bar for pending transactions */}
                    {tx.status === 'pending' && (
                      <div className="absolute bottom-0 left-0 h-1 bg-[#2EE6A6]/20 w-full">
                        <div className="h-full bg-[#2EE6A6] loading-bar" />
                      </div>
                    )}

                    {/* Success particles */}
                    {tx.status === 'completed' && (
                      <div className="absolute inset-0 pointer-events-none">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-1 h-1 bg-[#2EE6A6] rounded-full pixel-explosion"
                            style={{
                              left: `${30 + i * 20}%`,
                              top: `${30 + i * 15}%`,
                              animationDelay: `${i * 0.2}s`
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Network activity indicator */}
            <div className="text-center mt-4">
              <div className="inline-flex items-center gap-2 text-xs text-[#C9CDD6]">
                <div className="w-2 h-2 bg-[#2EE6A6] rounded-full animate-pulse" />
                <span className="font-mono">
                  NETWORK ACTIVITY: {recentTransactions.filter(tx => tx.status === 'pending').length} PENDING
                </span>
                <div className="w-2 h-2 bg-[#2EE6A6] rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transaction Feed with Fixed Explorer Links */}
      <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2EE6A6]">
            <Zap className="h-5 w-5" />
            Live Transaction Stream
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentTransactions.length === 0 ? (
              <div className="text-center text-[#C9CDD6] py-8">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Waiting for agent activity...</p>
              </div>
            ) : (
              recentTransactions.map(tx => {
                const fromAgent = agents.find(a => a.id === tx.serviceRequest.fromAgent);
                const toAgent = agents.find(a => a.id === tx.serviceRequest.toAgent);

                return (
                  <div key={tx.id} className="bg-[#1A2332] rounded-lg p-3 border border-[#2EE6A6]/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-white font-medium">
                          {fromAgent?.name} → {toAgent?.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {getTransactionStatusIcon(tx.status)}
                        <Badge className={
                          tx.status === 'completed'
                            ? 'bg-green-400/20 text-green-400 border-green-400/30'
                            : tx.status === 'failed'
                            ? 'bg-red-400/20 text-red-400 border-red-400/30'
                            : 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30'
                        }>
                          {tx.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#C9CDD6]">
                      <div>
                        <span className="font-medium">Service:</span> {tx.serviceRequest.serviceType}
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span> {toAgent?.pricePerRequest} XRP
                      </div>
                    </div>

                    {/* Fixed Transaction Link */}
                    {tx.verificationData && (
                      <div className="mt-2 p-2 bg-[#0F1825] rounded border border-[#2EE6A6]/20">
                        <div className="flex items-center justify-between">
                          <div className="text-xs">
                            <div className="text-[#2EE6A6] font-mono">
                              {tx.paymentTx?.slice(0, 16)}...
                            </div>
                            <div className="text-[#C9CDD6]">
                              Ledger: {tx.verificationData.ledgerIndex}
                            </div>
                          </div>

                          <a
                            href={`https://devnet.xrpl.org/transactions/${tx.paymentTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#2EE6A6] hover:text-[#26D396] transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="text-xs">XRPL</span>
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-[#C9CDD6]">
                      {new Date(tx.serviceRequest.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}