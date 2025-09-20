'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  ArrowRight,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  Network,
  Coins
} from 'lucide-react';
import { a2aManager, AIAgent, A2ATransaction } from '@/lib/a2a-agents';
import { toast } from 'sonner';

export default function A2ADemo() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [transactions, setTransactions] = useState<A2ATransaction[]>([]);
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [selectedFromAgent, setSelectedFromAgent] = useState<string>('');
  const [selectedToAgent, setSelectedToAgent] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');

  useEffect(() => {
    // Load agents on component mount
    const allAgents = a2aManager.getAllAgents();
    setAgents(allAgents);
    setSelectedFromAgent(allAgents[0]?.id || '');
  }, []);

  const refreshTransactions = () => {
    const allTransactions: A2ATransaction[] = [];
    agents.forEach(agent => {
      const agentTxs = a2aManager.getTransactionsForAgent(agent.id);
      agentTxs.forEach(tx => {
        if (!allTransactions.find(existing => existing.id === tx.id)) {
          allTransactions.push(tx);
        }
      });
    });
    setTransactions(allTransactions.sort((a, b) =>
      b.serviceRequest.timestamp.getTime() - a.serviceRequest.timestamp.getTime()
    ));
  };

  const runFullDemo = async () => {
    setIsRunningDemo(true);

    try {
      toast.info('🚀 Starting A2A autonomous demonstration...');

      // Run the demonstration chain
      await a2aManager.demonstrateA2AChain();

      // Refresh transactions to show results
      setTimeout(() => {
        refreshTransactions();
        toast.success('🎉 A2A demonstration completed successfully!');
      }, 1000);

    } catch (error) {
      console.error('Demo failed:', error);
      toast.error('❌ A2A demonstration failed');
    } finally {
      setIsRunningDemo(false);
    }
  };

  const requestCustomService = async () => {
    if (!selectedFromAgent || !selectedToAgent || !selectedService) {
      toast.error('Please select agents and service type');
      return;
    }

    if (selectedFromAgent === selectedToAgent) {
      toast.error('From and To agents must be different');
      return;
    }

    try {
      toast.info(`🤖 ${selectedFromAgent} requesting ${selectedService} from ${selectedToAgent}...`);

      const serviceParams = {
        'text-generation': { prompt: 'Explain quantum computing', maxTokens: 100 },
        'translation': { text: 'Hello World!', from: 'en', to: 'ko' },
        'data-analysis': { dataType: 'financial', dataset: 'market_data.csv' },
        'code-analysis': { code: 'function fibonacci(n) { return n < 2 ? n : fibonacci(n-1) + fibonacci(n-2); }', language: 'javascript' },
        'reasoning': { question: 'What are the implications of AI on society?', context: 'technological advancement' },
        'analysis': { subject: 'market trends', data: 'Q1 2025 performance' }
      };

      const params = serviceParams[selectedService as keyof typeof serviceParams] || { request: 'generic service request' };

      const transaction = await a2aManager.requestService(
        selectedFromAgent,
        selectedToAgent,
        selectedService,
        params,
        { useSubscription: true, priority: 'high' }
      );

      // Refresh transactions immediately to show the new one
      setTimeout(() => {
        refreshTransactions();
        toast.success(`✅ Service request completed: ${transaction.id.slice(-8)}`);
      }, 500);

    } catch (error) {
      console.error('Service request failed:', error);
      toast.error(`❌ Service request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'pending':
      case 'authorized':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending':
      case 'authorized':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'failed':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getAvailableServices = () => {
    if (!selectedToAgent) return [];
    const agent = agents.find(a => a.id === selectedToAgent);
    return agent?.capabilities || [];
  };

  const initializeCredentials = async () => {
    try {
      toast.info('🔐 Initializing on-chain credentials for all A2A agents...');

      const response = await fetch('/api/credentials/init-all', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ Credentials initialized: ${data.summary.successful}/${data.summary.total} agents ready`);
      } else {
        toast.error('❌ Credential initialization failed');
      }
    } catch (error) {
      console.error('Credential initialization failed:', error);
      toast.error('❌ Failed to initialize credentials');
    }
  };


  const deleteAllCredentials = async () => {
    try {
      toast.info('🗑️ Deleting all A2A agent credentials...');

      const response = await fetch('/api/credentials/delete-all', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ Credentials deleted: ${data.summary.successful}/${data.summary.total} removed`);
      } else {
        toast.error('❌ Credential deletion failed');
      }
    } catch (error) {
      console.error('Credential deletion failed:', error);
      toast.error('❌ Failed to delete credentials');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2EE6A6]">
            <Network className="h-5 w-5" />
            Agent-to-Agent (A2A) Autonomous Payment System
          </CardTitle>
          <p className="text-sm text-[#C9CDD6]">
            AI agents autonomously request and pay for services from other agents using XRPL credentials, XRP payments, and Batch transactions
          </p>
        </CardHeader>
      </Card>

      {/* Demo Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Demo */}
        <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
          <CardHeader>
            <CardTitle className="text-sm text-[#2EE6A6]">🚀 Full Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#C9CDD6]">
              Run a complete A2A demonstration with multiple service chains:
            </p>
            <ul className="text-xs text-[#C9CDD6] space-y-1">
              <li>• ChatGPT → Translator (Translation)</li>
              <li>• Claude → Data Agent (Analysis)</li>
              <li>• ChatGPT → Claude (Code Review)</li>
            </ul>
            <Button
              onClick={runFullDemo}
              disabled={isRunningDemo}
              className="w-full bg-gradient-to-r from-[#2EE6A6] to-[#26D396] text-[#0B1220] hover:shadow-[0_0_20px_rgba(46,230,166,0.4)]"
            >
              {isRunningDemo ? 'Running Demo...' : 'Run A2A Demo'}
            </Button>
          </CardContent>
        </Card>

        {/* Custom Service Request */}
        <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
          <CardHeader>
            <CardTitle className="text-sm text-[#2EE6A6]">🎯 Custom Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-[#C9CDD6] mb-1 block">From Agent</label>
              <select
                value={selectedFromAgent}
                onChange={(e) => setSelectedFromAgent(e.target.value)}
                className="w-full bg-[#1A2332] border border-[#2EE6A6]/20 rounded px-2 py-1 text-sm text-white"
              >
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#C9CDD6] mb-1 block">To Agent</label>
              <select
                value={selectedToAgent}
                onChange={(e) => {
                  setSelectedToAgent(e.target.value);
                  setSelectedService(''); // Reset service when agent changes
                }}
                className="w-full bg-[#1A2332] border border-[#2EE6A6]/20 rounded px-2 py-1 text-sm text-white"
              >
                <option value="">Select agent...</option>
                {agents.filter(a => a.id !== selectedFromAgent).map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#C9CDD6] mb-1 block">Service Type</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full bg-[#1A2332] border border-[#2EE6A6]/20 rounded px-2 py-1 text-sm text-white"
                disabled={!selectedToAgent}
              >
                <option value="">Select service...</option>
                {getAvailableServices().map(service => (
                  <option key={service} value={service}>{service.replace('-', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={requestCustomService}
              disabled={!selectedFromAgent || !selectedToAgent || !selectedService}
              className="w-full bg-gradient-to-r from-[#2EE6A6] to-[#26D396] text-[#0B1220] hover:shadow-[0_0_20px_rgba(46,230,166,0.4)]"
              size="sm"
            >
              Request Service
            </Button>
          </CardContent>
        </Card>

        {/* Credential Management */}
        <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
          <CardHeader>
            <CardTitle className="text-sm text-[#2EE6A6]">🔐 Agent Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[#C9CDD6]">
              Initialize on-chain credentials for A2A agents:
            </p>
            <div className="space-y-2">
              <Button
                onClick={initializeCredentials}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                🔐 Init Credentials
              </Button>
              <Button
                onClick={deleteAllCredentials}
                variant="outline"
                className="w-full border-red-400/20 text-red-400 hover:bg-red-400/10"
                size="sm"
              >
                🗑️ Delete All
              </Button>
            </div>
            <p className="text-xs text-[#C9CDD6]/70">
              Note: XRP payments (60%) and Batch transactions (40%) are used for A2A
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
        <CardHeader>
          <CardTitle className="text-sm text-[#2EE6A6]">🤖 Available AI Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map(agent => (
              <div key={agent.id} className="bg-[#1A2332] rounded-lg p-3 border border-[#2EE6A6]/10">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-4 w-4 text-[#2EE6A6]" />
                  <div className="font-medium text-white text-sm">{agent.name}</div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="text-[#C9CDD6]">
                    Price: {agent.pricePerRequest} {agent.currency}
                  </div>
                  <div className="text-[#C9CDD6]">
                    Level: {agent.credentialLevel}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {agent.capabilities.slice(0, 2).map(cap => (
                      <Badge key={cap} variant="outline" className="text-xs px-1 py-0">
                        {cap}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 2 && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        +{agent.capabilities.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-[#2EE6A6]">📊 A2A Transaction History</CardTitle>
          <Button
            onClick={refreshTransactions}
            size="sm"
            variant="outline"
            className="border-[#2EE6A6]/20 text-[#2EE6A6] hover:bg-[#2EE6A6]/10"
          >
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {transactions.length === 0 ? (
              <div className="text-center text-[#C9CDD6] py-8">
                No A2A transactions yet. Run the demo to see autonomous payments!
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map(tx => {
                  const fromAgent = agents.find(a => a.id === tx.serviceRequest.fromAgent);
                  const toAgent = agents.find(a => a.id === tx.serviceRequest.toAgent);

                  return (
                    <div key={tx.id} className="bg-[#1A2332] rounded-lg p-3 border border-[#2EE6A6]/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-white">
                            {fromAgent?.name} → {toAgent?.name}
                          </div>
                          <ArrowRight className="h-3 w-3 text-[#2EE6A6]" />
                          <Badge variant="outline" className="text-xs">
                            {tx.serviceRequest.serviceType}
                          </Badge>
                          {tx.paymentType === 'batch' && (
                            <Badge className="text-xs bg-purple-600/20 text-purple-400 border-purple-400/20">
                              📦 BATCH
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tx.status)}
                          <Badge className={`text-xs ${getStatusColor(tx.status)}`}>
                            {tx.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-xs text-[#C9CDD6] space-y-1">
                        <div>ID: {tx.id.slice(-12)}</div>
                        <div>Price: {toAgent?.pricePerRequest} {toAgent?.currency}</div>
                        {tx.paymentTx && (
                          <div className="flex items-center gap-1">
                            <Coins className="h-3 w-3" />
                            Payment: {tx.paymentTx.slice(0, 8)}...
                          </div>
                        )}
                        {tx.result && (
                          <div className="mt-2 p-2 bg-[#0F1825] rounded border border-[#2EE6A6]/10">
                            <div className="text-xs text-[#2EE6A6] mb-1">Result:</div>
                            <div className="text-xs text-white">
                              {typeof tx.result === 'string' ? tx.result : JSON.stringify(tx.result, null, 2).slice(0, 100)}...
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}