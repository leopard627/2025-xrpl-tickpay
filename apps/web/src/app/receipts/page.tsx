"use client";

import Link from "next/link";
import { useState } from "react";
import { useTransactions, TransactionRecord } from "../../contexts/TransactionContext";
import { useWallet } from "../../contexts/WalletContext";

export default function Receipts() {
  const {
    transactions,
    getTotalSpent,
    clearTransactions,
    deleteTransaction,
    deleteOldTransactions,
    getRecentTransactions
  } = useTransactions();
  const { address } = useWallet();
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionRecord | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'recent10' | 'week'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 완료된 거래만 필터링
  const completedTransactions = transactions.filter(tx => tx.status === 'completed');

  // 보기 모드에 따른 트랜잭션 필터링
  const getFilteredTransactions = () => {
    const completed = completedTransactions;

    switch (viewMode) {
      case 'recent10':
        return completed
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
      case 'week':
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return completed
          .filter(tx => tx.timestamp >= weekAgo)
          .sort((a, b) => b.timestamp - a.timestamp);
      case 'all':
      default:
        return completed.sort((a, b) => b.timestamp - a.timestamp);
    }
  };

  const filteredTransactions = getFilteredTransactions();

  // 대량 삭제 함수들
  const handleClearAll = () => {
    if (window.confirm('🚨 모든 거래 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      clearTransactions();
      setDeleteConfirm(null);
    }
  };

  const handleDeleteOld = () => {
    const count = deleteOldTransactions(7);
    if (count > 0) {
      alert(`✅ 1주일 이전 거래 기록 ${count}개를 삭제했습니다.`);
    } else {
      alert('ℹ️ 삭제할 오래된 기록이 없습니다.');
    }
    setDeleteConfirm(null);
  };

  const handleDeleteSingle = (id: string) => {
    if (window.confirm('이 거래 기록을 삭제하시겠습니까?')) {
      deleteTransaction(id);
    }
  };

  const downloadReceipt = (receipt: TransactionRecord) => {
    const receiptData = {
      receipt_id: receipt.id,
      timestamp: receipt.date,
      channel_id: receipt.channelId,
      provider_address: receipt.providerAddress,
      payer_address: receipt.payerAddress,
      streaming_session_id: receipt.streamingSessionId,
      amounts: {
        rlusd_delivered: receipt.rlusdAmount.toFixed(2),
        xrp_claimed: receipt.xrpAmount.toFixed(6)
      },
      usage: {
        elapsed_seconds: receipt.elapsedSeconds,
        tokens_processed: receipt.tokensProcessed,
        rate_per_second: 0.02
      },
      transactions: {
        claim_tx: receipt.claimTx,
        payment_tx: receipt.paymentTx
      },
      merkle_root: receipt.merkleRoot,
      usage_proofs: receipt.usageProofs,
      status: receipt.status,
      verification: "Cryptographic proof available on XRPL Devnet"
    };

    const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickpay_receipt_${receipt.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="container mx-auto p-8">
        <header className="mb-8">
          <Link href="/" className="text-[#2EE6A6] hover:text-white">← Back to Home</Link>
          <h1 className="text-3xl font-bold mt-4 mb-2">Receipts</h1>
          <p className="text-[#C9CDD6]">Settlement history and downloadable receipts</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-[#1A2332] p-6 rounded-lg">
              <div className="flex flex-col space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Settlement History</h2>
                  <div className="text-sm text-[#C9CDD6]">
                    Total: ${completedTransactions.reduce((sum, r) => sum + r.rlusdAmount, 0).toFixed(2)} RLUSD
                  </div>
                </div>

                {/* 필터 및 관리 버튼들 */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  {/* 보기 모드 필터 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('all')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        viewMode === 'all'
                          ? 'bg-[#2EE6A6] text-black'
                          : 'bg-[#0B1220] text-[#C9CDD6] hover:bg-[#2A3441]'
                      }`}
                    >
                      전체 ({completedTransactions.length})
                    </button>
                    <button
                      onClick={() => setViewMode('recent10')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        viewMode === 'recent10'
                          ? 'bg-[#2EE6A6] text-black'
                          : 'bg-[#0B1220] text-[#C9CDD6] hover:bg-[#2A3441]'
                      }`}
                    >
                      최근 10개
                    </button>
                    <button
                      onClick={() => setViewMode('week')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        viewMode === 'week'
                          ? 'bg-[#2EE6A6] text-black'
                          : 'bg-[#0B1220] text-[#C9CDD6] hover:bg-[#2A3441]'
                      }`}
                    >
                      최근 1주일
                    </button>
                  </div>

                  {/* 삭제 메뉴 */}
                  <div className="relative">
                    {deleteConfirm ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteOld}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors"
                        >
                          1주일 이전 삭제
                        </button>
                        <button
                          onClick={handleClearAll}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                        >
                          모두 삭제
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1 bg-[#2A3441] hover:bg-[#3A4451] text-[#C9CDD6] rounded text-sm transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm('menu')}
                        className="px-3 py-1 bg-[#0B1220] text-[#C9CDD6] hover:bg-red-600 hover:text-white rounded text-sm transition-colors"
                        disabled={completedTransactions.length === 0}
                      >
                        🗑️ 관리
                      </button>
                    )}
                  </div>
                </div>

                {/* 현재 필터 상태 표시 */}
                <div className="text-xs text-[#C9CDD6]">
                  {viewMode === 'all' && `전체 ${filteredTransactions.length}개 기록`}
                  {viewMode === 'recent10' && `최근 10개 기록 (${filteredTransactions.length}개 표시)`}
                  {viewMode === 'week' && `최근 1주일 기록 (${filteredTransactions.length}개 표시)`}
                </div>
              </div>

              <div className="space-y-4">
                {filteredTransactions.map((receipt) => (
                  <div
                    key={receipt.id}
                    className={`bg-[#0B1220] p-4 rounded-lg transition-all ${
                      selectedReceipt?.id === receipt.id ? 'ring-2 ring-[#2EE6A6]' : 'hover:bg-[#1A2332]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedReceipt(receipt)}
                      >
                        <div className="font-mono text-sm text-[#2EE6A6]">{receipt.id}</div>
                        <div className="text-sm text-[#C9CDD6]">{receipt.date}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-[#2EE6A6] font-semibold">${receipt.rlusdAmount.toFixed(2)}</div>
                          <div className="text-sm text-[#C9CDD6]">{receipt.xrpAmount.toFixed(6)} XRP</div>
                        </div>
                        <button
                          onClick={() => handleDeleteSingle(receipt.id)}
                          className="ml-2 p-1 hover:bg-red-600 hover:text-white rounded transition-colors text-[#C9CDD6] text-xs"
                          title="이 기록 삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <div className="text-sm text-[#C9CDD6]">Channel</div>
                        <div className="font-mono text-sm">{receipt.channelId.substring(0, 12)}...</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#C9CDD6]">Provider</div>
                        <div className="font-mono text-sm">{receipt.providerAddress.substring(0, 12)}...</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <div className="text-sm text-[#C9CDD6]">Duration</div>
                        <div className="font-mono text-sm">{receipt.elapsedSeconds}s</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#C9CDD6]">Tokens</div>
                        <div className="font-mono text-sm">{receipt.tokensProcessed.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <span className="px-2 py-1 bg-green-600 text-xs rounded">
                        {receipt.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadReceipt(receipt);
                        }}
                        className="text-[#2EE6A6] hover:text-white text-sm"
                      >
                        Download JSON
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {completedTransactions.length === 0 ? (
                <div className="text-center py-12 text-[#C9CDD6]">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-xl mb-2">No receipts yet</h3>
                  <p>Settlement receipts will appear here after streaming job completion</p>
                  <Link href="/stream" className="text-[#2EE6A6] hover:text-white mt-4 inline-block">
                    → Start streaming to generate receipts
                  </Link>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-[#C9CDD6]">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl mb-2">필터 조건에 맞는 기록이 없습니다</h3>
                  <p>다른 필터를 선택하거나 '전체'를 확인해보세요</p>
                  <button
                    onClick={() => setViewMode('all')}
                    className="text-[#2EE6A6] hover:text-white mt-4 inline-block underline"
                  >
                    → 전체 기록 보기
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-8">
            {selectedReceipt && (
              <div className="bg-[#1A2332] p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Receipt Details</h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-[#C9CDD6]">Receipt ID</div>
                    <div className="font-mono text-sm">{selectedReceipt.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#C9CDD6]">Timestamp</div>
                    <div>{selectedReceipt.date}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#C9CDD6]">RLUSD Delivered</div>
                    <div className="text-[#2EE6A6] font-semibold">${selectedReceipt.rlusdAmount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#C9CDD6]">XRP Claimed</div>
                    <div>{selectedReceipt.xrpAmount.toFixed(6)} XRP</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#C9CDD6]">Duration</div>
                    <div>{selectedReceipt.elapsedSeconds} seconds</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#C9CDD6]">Tokens Processed</div>
                    <div>{selectedReceipt.tokensProcessed.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#C9CDD6]">Provider Address</div>
                    <div className="font-mono text-sm break-all">{selectedReceipt.providerAddress}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#C9CDD6]">Payer Address</div>
                    <div className="font-mono text-sm break-all">{selectedReceipt.payerAddress}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#C9CDD6]">Channel ID</div>
                    <div className="font-mono text-sm break-all">{selectedReceipt.channelId}</div>
                  </div>
                  {selectedReceipt.claimTx && (
                    <div>
                      <div className="text-sm text-[#C9CDD6]">Claim Transaction</div>
                      <div className="font-mono text-sm break-all">{selectedReceipt.claimTx}</div>
                      <a
                        href={`https://devnet.xrpl.org/transactions/${selectedReceipt.claimTx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2EE6A6] hover:text-white text-sm"
                      >
                        View on XRPL Devnet Explorer →
                      </a>
                    </div>
                  )}
                  {selectedReceipt.paymentTx && (
                    <div>
                      <div className="text-sm text-[#C9CDD6]">Payment Transaction</div>
                      <div className="font-mono text-sm break-all">{selectedReceipt.paymentTx}</div>
                      <a
                        href={`https://devnet.xrpl.org/transactions/${selectedReceipt.paymentTx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2EE6A6] hover:text-white text-sm"
                      >
                        View on XRPL Devnet Explorer →
                      </a>
                    </div>
                  )}
                  {selectedReceipt.merkleRoot && (
                    <div>
                      <div className="text-sm text-[#C9CDD6]">Merkle Root</div>
                      <div className="font-mono text-sm break-all">{selectedReceipt.merkleRoot}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-[#C9CDD6]">Usage Proofs</div>
                    <div className="text-sm">{selectedReceipt.usageProofs.length} proof(s) recorded</div>
                  </div>
                </div>

                <button
                  onClick={() => downloadReceipt(selectedReceipt)}
                  className="w-full mt-6 bg-[#2EE6A6] text-[#0B1220] py-2 rounded font-semibold hover:bg-[#26D396]"
                >
                  Download Receipt
                </button>
              </div>
            )}

            <div className="bg-[#1A2332] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#C9CDD6]">Total Settlements</span>
                  <span className="text-[#2EE6A6]">{completedTransactions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9CDD6]">Total RLUSD</span>
                  <span className="text-[#2EE6A6]">
                    ${completedTransactions.reduce((sum, r) => sum + r.rlusdAmount, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9CDD6]">Total XRP</span>
                  <span className="text-[#2EE6A6]">
                    {completedTransactions.reduce((sum, r) => sum + r.xrpAmount, 0).toFixed(6)} XRP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9CDD6]">Avg Settlement</span>
                  <span className="text-[#2EE6A6]">
                    ${completedTransactions.length > 0
                      ? (completedTransactions.reduce((sum, r) => sum + r.rlusdAmount, 0) / completedTransactions.length).toFixed(2)
                      : '0.00'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9CDD6]">Total Tokens</span>
                  <span className="text-[#2EE6A6]">
                    {completedTransactions.reduce((sum, r) => sum + r.tokensProcessed, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#1A2332] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Export Options</h2>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const exportData = completedTransactions.map(tx => ({
                      receipt_id: tx.id,
                      timestamp: tx.date,
                      channel_id: tx.channelId,
                      provider_address: tx.providerAddress,
                      payer_address: tx.payerAddress,
                      rlusd_amount: tx.rlusdAmount,
                      xrp_amount: tx.xrpAmount,
                      elapsed_seconds: tx.elapsedSeconds,
                      tokens_processed: tx.tokensProcessed,
                      status: tx.status,
                      claim_tx: tx.claimTx,
                      payment_tx: tx.paymentTx,
                      merkle_root: tx.merkleRoot
                    }));

                    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                      type: 'application/json'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `tickpay_receipts_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full bg-[#2EE6A6] text-[#0B1220] py-2 rounded font-semibold hover:bg-[#26D396]"
                >
                  Export All ({completedTransactions.length}) JSON
                </button>
                <button
                  onClick={() => {
                    const csvData = [
                      'Receipt ID,Timestamp,Channel ID,Provider,Payer,RLUSD,XRP,Duration (s),Tokens,Status,Claim Tx,Payment Tx',
                      ...completedTransactions.map(tx =>
                        `${tx.id},${tx.date},${tx.channelId},${tx.providerAddress},${tx.payerAddress},${tx.rlusdAmount},${tx.xrpAmount},${tx.elapsedSeconds},${tx.tokensProcessed},${tx.status},${tx.claimTx || ''},${tx.paymentTx || ''}`
                      )
                    ].join('\n');

                    const blob = new Blob([csvData], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `tickpay_receipts_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full bg-gray-600 text-white py-2 rounded font-semibold hover:bg-gray-700"
                >
                  Export All CSV
                </button>
                <button className="w-full bg-gray-600 text-white py-2 rounded font-semibold hover:bg-gray-700">
                  Tax Report (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}