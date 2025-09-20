'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  Network,
  Zap,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  Shield,
  CreditCard,
  Users
} from 'lucide-react';
import { useXRPLWallet } from '@/hooks/useXRPLWallet';
import { a2aManager, AIAgent, A2ATransaction } from '@/lib/a2a-agents';
import { toast } from 'sonner';
import JudgeVerificationPanel from '@/components/JudgeVerificationPanel';
import A2APixelVisualization from '@/components/A2APixelVisualization';
import '../../styles/pixel-animations.css';

export default function A2APage() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [liveTransactions, setLiveTransactions] = useState<A2ATransaction[]>([]);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [totalVolume, setTotalVolume] = useState(0);
  const [completedTxs, setCompletedTxs] = useState(0);
  const { isConnected, address: userAddress } = useXRPLWallet();

  useEffect(() => {
    setAgents(a2aManager.getAllAgents());
    refreshLiveData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoMode) {
      // Auto mode - simulate agents continuously requesting services
      interval = setInterval(async () => {
        await simulateRandomA2ATransaction();
      }, 3000); // Every 3 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoMode, agents]);

  const refreshLiveData = () => {
    const allTxs: A2ATransaction[] = [];
    let volume = 0;
    let completed = 0;

    agents.forEach(agent => {
      const agentTxs = a2aManager.getTransactionsForAgent(agent.id);
      agentTxs.forEach(tx => {
        if (!allTxs.find(existing => existing.id === tx.id)) {
          allTxs.push(tx);
          const toAgent = agents.find(a => a.id === tx.serviceRequest.toAgent);
          if (toAgent) {
            volume += toAgent.pricePerRequest;
          }
          if (tx.status === 'completed') {
            completed++;
          }
        }
      });
    });

    setLiveTransactions(allTxs.sort((a, b) =>
      b.serviceRequest.timestamp.getTime() - a.serviceRequest.timestamp.getTime()
    ).slice(0, 10)); // Show last 10 transactions
    setTotalVolume(volume);
    setCompletedTxs(completed);
  };

  const simulateRandomA2ATransaction = async () => {
    try {
      const tx = await a2aManager.generateRandomTransaction();
      if (tx) {
        const fromAgent = agents.find(a => a.id === tx.serviceRequest.fromAgent);
        const toAgent = agents.find(a => a.id === tx.serviceRequest.toAgent);

        toast.success(`🤖 ${fromAgent?.name} → ${toAgent?.name}: ${tx.serviceRequest.serviceType}`, {
          duration: 2000
        });

        // Refresh data after a short delay
        setTimeout(refreshLiveData, 500);
      }
    } catch (error) {
      console.error('Auto A2A failed:', error);
    }
  };

  const startAutoMode = () => {
    setIsAutoMode(true);
    toast.info('🚀 Auto A2A mode activated! Agents will autonomously trade services.');
  };

  const stopAutoMode = () => {
    setIsAutoMode(false);
    toast.info('⏸️ Auto A2A mode stopped.');
  };

  const initializeCredentials = async () => {
    try {
      toast.info('🔐 Initializing on-chain credentials for all agents...');

      const response = await fetch('/api/credentials/init-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize credentials');
      }

      const result = await response.json();

      if (result.success) {
        toast.success(`✅ Credentials initialized: ${result.summary.successful} successful, ${result.summary.failed} failed`);
        console.log('🔐 Credential initialization results:', result.results);

        // Refresh agents to show updated credential status
        setTimeout(() => {
          refreshLiveData();
        }, 2000);
      } else {
        throw new Error(result.error || 'Unknown error');
      }

    } catch (error) {
      console.error('❌ Credential initialization failed:', error);
      toast.error(`Failed to initialize credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteAllCredentials = async () => {
    try {
      toast.info('🗑️ Deleting all on-chain credentials...');

      const response = await fetch('/api/credentials/delete-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete credentials');
      }

      const result = await response.json();

      if (result.success) {
        toast.success(`✅ Credentials deleted: ${result.summary.successful} successful, ${result.summary.failed} failed`);
        console.log('🗑️ Credential deletion results:', result.results);

        // Refresh agents to show updated credential status
        setTimeout(() => {
          refreshLiveData();
        }, 2000);
      } else {
        throw new Error(result.error || 'Unknown error');
      }

    } catch (error) {
      console.error('❌ Credential deletion failed:', error);
      toast.error(`Failed to delete credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runMegaDemo = async () => {
    toast.info('🚀 Starting Mega A2A Demo...');

    try {
      // Run multiple simultaneous requests
      const promises = [
        a2aManager.requestService('chatgpt-agent', 'translator-agent', 'translation',
          { text: 'The future is autonomous!', to: 'korean' }),
        a2aManager.requestService('claude-agent', 'data-agent', 'data-analysis',
          { dataType: 'ai_performance', dataset: 'performance.csv' }),
        a2aManager.requestService('translator-agent', 'chatgpt-agent', 'text-generation',
          { prompt: 'Explain blockchain to a 5-year-old' }),
        a2aManager.requestService('data-agent', 'claude-agent', 'reasoning',
          { question: 'What is the optimal AI agent network topology?' })
      ];

      await Promise.all(promises);

      setTimeout(() => {
        refreshLiveData();
        toast.success('🎉 Mega Demo completed! 4 autonomous transactions executed.');
      }, 1000);

    } catch (error) {
      toast.error('❌ Mega demo failed');
    }
  };

  const getAgentStats = (agent: AIAgent) => {
    const agentTxs = a2aManager.getTransactionsForAgent(agent.id);
    const asProvider = agentTxs.filter(tx => tx.serviceRequest.toAgent === agent.id);
    const asConsumer = agentTxs.filter(tx => tx.serviceRequest.fromAgent === agent.id);
    const earned = asProvider.filter(tx => tx.status === 'completed').length * agent.pricePerRequest;
    const spent = asConsumer.filter(tx => tx.status === 'completed').reduce((sum, tx) => {
      const providerAgent = agents.find(a => a.id === tx.serviceRequest.toAgent);
      return sum + (providerAgent?.pricePerRequest || 0);
    }, 0);

    return { earned, spent, providedServices: asProvider.length, consumedServices: asConsumer.length };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1220] via-[#0F1B2E] to-[#0B1220] text-white">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(46,230,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(46,230,166,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="container mx-auto max-w-7xl p-6 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2EE6A6] to-[#26D396] bg-clip-text text-transparent mb-2">
            Autonomous Agent Economy
          </h1>
          <p className="text-[#C9CDD6] text-lg">
            AI agents autonomously discover, negotiate, and pay for services using XRPL credentials and tokens
          </p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#2EE6A6]">{agents.length}</div>
              <div className="text-sm text-[#C9CDD6]">Active Agents</div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#2EE6A6]">{liveTransactions.length}</div>
              <div className="text-sm text-[#C9CDD6]">Total Transactions</div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#2EE6A6]">{totalVolume.toFixed(4)}</div>
              <div className="text-sm text-[#C9CDD6]">Total Volume (XRP)</div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#2EE6A6]">
                {liveTransactions.length > 0 ? Math.round((completedTxs / liveTransactions.length) * 100) : 0}%
              </div>
              <div className="text-sm text-[#C9CDD6]">Success Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2EE6A6]">
              <Zap className="h-5 w-5" />
              A2A Control Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={runMegaDemo}
                className="bg-gradient-to-r from-[#2EE6A6] to-[#26D396] text-[#0B1220] hover:shadow-[0_0_20px_rgba(46,230,166,0.4)]"
              >
                <Network className="h-4 w-4 mr-2" />
                Run Mega Demo
              </Button>

              {!isAutoMode ? (
                <Button
                  onClick={startAutoMode}
                  variant="outline"
                  className="border-[#2EE6A6]/20 text-[#2EE6A6] hover:bg-[#2EE6A6]/10"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Start Auto Mode
                </Button>
              ) : (
                <Button
                  onClick={stopAutoMode}
                  variant="outline"
                  className="border-red-400/20 text-red-400 hover:bg-red-400/10"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Stop Auto Mode
                </Button>
              )}

              <Button
                onClick={refreshLiveData}
                variant="outline"
                className="border-[#2EE6A6]/20 text-[#2EE6A6] hover:bg-[#2EE6A6]/10"
              >
                🔄 Refresh
              </Button>

              <Button
                onClick={initializeCredentials}
                variant="outline"
                className="border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/10"
              >
                🔐 Init Credentials
              </Button>

              <Button
                onClick={deleteAllCredentials}
                variant="outline"
                className="border-red-400/20 text-red-400 hover:bg-red-400/10"
              >
                🗑️ Delete All
              </Button>

              {isAutoMode && (
                <Badge className="bg-green-400/20 text-green-400 border-green-400/30 px-3 py-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  AUTO MODE ACTIVE
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agent Network */}
          <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#2EE6A6]">
                <Users className="h-5 w-5" />
                AI Agent Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {agents.map(agent => {
                    const stats = getAgentStats(agent);
                    return (
                      <div key={agent.id} className="bg-[#1A2332] rounded-lg p-4 border border-[#2EE6A6]/10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-[#2EE6A6]" />
                            <div>
                              <div className="font-medium text-white">{agent.name}</div>
                              <div className="text-xs text-[#C9CDD6]">{agent.serviceDomain}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4 text-[#2EE6A6]" />
                            <span className="text-sm font-medium text-[#2EE6A6]">L{agent.credentialLevel}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-[#C9CDD6]">Earned</div>
                            <div className="text-sm font-medium text-green-400">
                              {stats.earned.toFixed(4)} XRP
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#C9CDD6]">Spent</div>
                            <div className="text-sm font-medium text-orange-400">
                              {stats.spent.toFixed(4)} XRP
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {agent.capabilities.map(cap => (
                            <Badge key={cap} variant="outline" className="text-xs px-2 py-0.5">
                              {cap.replace('-', ' ')}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex justify-between text-xs text-[#C9CDD6]">
                          <span>Provided: {stats.providedServices}</span>
                          <span>Consumed: {stats.consumedServices}</span>
                          <span>{agent.pricePerRequest} XRP/req</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Live Transaction Feed */}
          <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#2EE6A6]">
                <CreditCard className="h-5 w-5" />
                Live Transaction Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {liveTransactions.length === 0 ? (
                  <div className="text-center text-[#C9CDD6] py-12">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Start auto mode or run a demo!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {liveTransactions.map(tx => {
                      const fromAgent = agents.find(a => a.id === tx.serviceRequest.fromAgent);
                      const toAgent = agents.find(a => a.id === tx.serviceRequest.toAgent);

                      return (
                        <div key={tx.id} className="bg-[#1A2332] rounded-lg p-3 border border-[#2EE6A6]/10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-white">
                                {fromAgent?.name}
                              </div>
                              <ArrowRight className="h-3 w-3 text-[#2EE6A6]" />
                              <div className="text-sm font-medium text-white">
                                {toAgent?.name}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {tx.status === 'completed' && <CheckCircle className="h-3 w-3 text-green-400" />}
                              {tx.status === 'pending' && <Clock className="h-3 w-3 text-yellow-400" />}
                              {tx.status === 'failed' && <AlertCircle className="h-3 w-3 text-red-400" />}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {tx.serviceRequest.serviceType.replace('-', ' ')}
                              </Badge>
                              {tx.paymentType === 'mptoken' && (
                                <Badge variant="outline" className="text-xs bg-purple-900/20 text-purple-400 border-purple-400/30">
                                  🎫 MPToken
                                </Badge>
                              )}
                              {tx.paymentType === 'xrp' && (
                                <Badge variant="outline" className="text-xs bg-blue-900/20 text-blue-400 border-blue-400/30">
                                  💎 XRP
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-[#2EE6A6] font-medium">
                              {tx.paymentType === 'mptoken' ? '1 Token' : `${toAgent?.pricePerRequest} XRP`}
                            </div>
                          </div>

                          <div className="text-xs text-[#C9CDD6]">
                            {new Date(tx.serviceRequest.timestamp).toLocaleTimeString()}
                          </div>

                          {/* Hackathon Judge Verification Info */}
                          {tx.verificationData && (
                            <div className="mt-2 p-2 bg-[#0F1825] rounded border border-[#2EE6A6]/10">
                              <div className="text-xs text-[#2EE6A6] mb-1">🏆 Judge Verification:</div>
                              <div className="text-xs text-white space-y-1">
                                <div>TX: {tx.paymentTx?.slice(0, 12)}...</div>
                                <div>Ledger: {tx.verificationData.ledgerIndex}</div>
                                <a
                                  href={`https://devnet.xrpl.org/transactions/${tx.paymentTx}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#2EE6A6] hover:underline"
                                >
                                  🔗 View on XRPL Explorer
                                </a>
                              </div>
                            </div>
                          )}

                          {tx.credentialVerification && (
                            <div className="mt-2 p-2 bg-[#1A2332] rounded border border-[#2EE6A6]/10">
                              <div className="text-xs text-[#2EE6A6] mb-1">🔐 ON-CHAIN Credential Verification:</div>
                              <div className="text-xs text-white space-y-1">
                                <div className="flex justify-between">
                                  <span>From Level: {tx.credentialVerification.credentialLevels.from}</span>
                                  {tx.credentialVerification.onChainData?.fromAgentOnChain && (
                                    <Badge variant="outline" className="text-xs bg-green-900/20 text-green-400 border-green-400/30">
                                      ⛓️ On-Chain
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex justify-between">
                                  <span>To Level: {tx.credentialVerification.credentialLevels.to}</span>
                                  {tx.credentialVerification.onChainData?.toAgentOnChain && (
                                    <Badge variant="outline" className="text-xs bg-green-900/20 text-green-400 border-green-400/30">
                                      ⛓️ On-Chain
                                    </Badge>
                                  )}
                                </div>
                                <div>Verified: {new Date(tx.credentialVerification.verificationTimestamp).toLocaleTimeString()}</div>
                                {tx.credentialVerification.onChainData && (
                                  <div className="mt-1 pt-1 border-t border-[#2EE6A6]/20">
                                    <div className="text-xs text-[#C9CDD6]">
                                      From: {tx.credentialVerification.onChainData.fromAgentCredentialType || 'N/A'}
                                      {tx.credentialVerification.onChainData.fromAgentOnChainIndex && (
                                        <span className="ml-1 text-green-400">({tx.credentialVerification.onChainData.fromAgentOnChainIndex.slice(-8)})</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-[#C9CDD6]">
                                      To: {tx.credentialVerification.onChainData.toAgentCredentialType || 'N/A'}
                                      {tx.credentialVerification.onChainData.toAgentOnChainIndex && (
                                        <span className="ml-1 text-green-400">({tx.credentialVerification.onChainData.toAgentOnChainIndex.slice(-8)})</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* MPToken Transfer Info */}
                          {tx.mpTokenData && (
                            <div className="mt-2 p-2 bg-[#2A1B3D] rounded border border-purple-400/20">
                              <div className="text-xs text-purple-400 mb-1">🎫 MPToken Transfer:</div>
                              <div className="text-xs text-white space-y-1">
                                <div>Token ID: {tx.mpTokenData.tokenId.slice(-12)}...</div>
                                <div>Service: {tx.mpTokenData.serviceId}</div>
                                <div>Remaining Uses: {tx.mpTokenData.remainingUsage || 'N/A'}</div>
                                {tx.mpTokenTx && (
                                  <div className="text-xs text-purple-300">
                                    Tx: {tx.mpTokenTx.slice(0, 8)}...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {tx.result && (
                            <div className="mt-2 p-2 bg-[#0F1825] rounded border border-green-400/20">
                              <div className="text-xs text-green-400">✅ Service completed</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Pixel Agent Visualization - Full Width */}
        <div className="col-span-1 lg:col-span-2 mt-8">
          <A2APixelVisualization
            agents={agents}
            transactions={liveTransactions}
            isAutoMode={isAutoMode}
          />
        </div>

        {/* Judge Verification Panel - Full Width */}
        <div className="col-span-1 lg:col-span-2 mt-8">
          <JudgeVerificationPanel transactions={liveTransactions} />
        </div>
      </div>
    </div>
  );
}