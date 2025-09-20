'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Shield, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { A2ATransaction } from '@/lib/a2a-agents';

interface JudgeVerificationPanelProps {
  transactions: A2ATransaction[];
}

export default function JudgeVerificationPanel({ transactions }: JudgeVerificationPanelProps) {
  const verifiedTransactions = transactions.filter(tx =>
    tx.verificationData || tx.credentialVerification
  );

  const totalXRPVolume = verifiedTransactions.reduce((sum, tx) =>
    sum + (tx.verificationData?.amountXRP || 0), 0
  );

  const uniqueLedgers = new Set(verifiedTransactions.map(tx =>
    tx.verificationData?.ledgerIndex
  ).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      {/* Verification Summary for Judges */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-400">
            🏆 Hackathon Judge Verification Panel
          </CardTitle>
          <p className="text-sm text-yellow-300/80">
            Real XRPL transactions and credential verifications for judge review
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{verifiedTransactions.length}</div>
              <div className="text-sm text-yellow-300/70">Verified Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{totalXRPVolume.toFixed(4)}</div>
              <div className="text-sm text-yellow-300/70">Total XRP Volume</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{uniqueLedgers}</div>
              <div className="text-sm text-yellow-300/70">Unique Ledgers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {verifiedTransactions.filter(tx => tx.status === 'completed').length}
              </div>
              <div className="text-sm text-yellow-300/70">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Transaction Verification */}
      <Card className="bg-black/20 backdrop-blur-sm border border-[#2EE6A6]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2EE6A6]">
            <Shield className="h-5 w-5" />
            XRPL Transaction & Credential Verification Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {verifiedTransactions.length === 0 ? (
              <div className="text-center text-[#C9CDD6] py-8">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No verified transactions yet</p>
                <p className="text-sm">Run A2A demos to generate verification data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {verifiedTransactions.map(tx => (
                  <div key={tx.id} className="bg-[#1A2332] rounded-lg p-4 border border-[#2EE6A6]/10">
                    {/* Transaction Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-2 py-1">
                          {tx.serviceRequest.serviceType.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={
                          tx.status === 'completed'
                            ? 'bg-green-400/20 text-green-400 border-green-400/30'
                            : tx.status === 'failed'
                            ? 'bg-red-400/20 text-red-400 border-red-400/30'
                            : 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30'
                        }>
                          {tx.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {tx.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {tx.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-[#C9CDD6]">
                        ID: {tx.id.slice(-8)}
                      </div>
                    </div>

                    {/* XRPL Transaction Verification */}
                    {tx.verificationData && (
                      <div className="mb-3 p-3 bg-[#0F1825] rounded border border-[#2EE6A6]/20">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-4 w-4 text-[#2EE6A6]" />
                          <span className="text-sm font-medium text-[#2EE6A6]">
                            XRPL Transaction Verification
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="text-[#C9CDD6] mb-1">Transaction Hash</div>
                            <div className="font-mono text-white break-all">
                              {tx.paymentTx}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#C9CDD6] mb-1">Ledger Index</div>
                            <div className="font-mono text-white">
                              {tx.verificationData.ledgerIndex}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#C9CDD6] mb-1">From Account</div>
                            <div className="font-mono text-white break-all">
                              {tx.verificationData.accountFrom}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#C9CDD6] mb-1">To Account</div>
                            <div className="font-mono text-white break-all">
                              {tx.verificationData.accountTo}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#C9CDD6] mb-1">Amount</div>
                            <div className="font-mono text-[#2EE6A6] font-bold">
                              {tx.verificationData.amountXRP} XRP
                            </div>
                          </div>
                          <div>
                            <div className="text-[#C9CDD6] mb-1">Network Status</div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-400" />
                              <span className="text-green-400">Confirmed</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <a
                            href={tx.verificationData.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#2EE6A6] hover:underline text-sm"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View on XRPL Explorer
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Credential Verification */}
                    {tx.credentialVerification && (
                      <div className="p-3 bg-[#1A2332] rounded border border-purple-400/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-medium text-purple-400">
                            Credential Verification
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="text-[#C9CDD6] mb-1">From Agent Level</div>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                                Level {tx.credentialVerification.credentialLevels.from}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <div className="text-[#C9CDD6] mb-1">To Agent Level</div>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                                Level {tx.credentialVerification.credentialLevels.to}
                              </Badge>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-[#C9CDD6] mb-1">Verification Timestamp</div>
                            <div className="font-mono text-white">
                              {new Date(tx.credentialVerification.verificationTimestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-[#C9CDD6] mb-1">Credential Hashes</div>
                            <div className="space-y-1">
                              <div className="font-mono text-xs text-white break-all">
                                From: {tx.credentialVerification.fromAgentCredential}
                              </div>
                              <div className="font-mono text-xs text-white break-all">
                                To: {tx.credentialVerification.toAgentCredential}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Service Details */}
                    <div className="mt-3 pt-3 border-t border-[#2EE6A6]/10">
                      <div className="text-xs text-[#C9CDD6] space-y-1">
                        <div>
                          <span className="font-medium">Service:</span> {tx.serviceRequest.serviceType}
                        </div>
                        <div>
                          <span className="font-medium">Timestamp:</span> {' '}
                          {new Date(tx.serviceRequest.timestamp).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Request ID:</span> {tx.serviceRequest.id}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}