"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWallet } from '../contexts/WalletContext';

interface XamanConnectProps {
  onSuccess?: () => void;
  className?: string;
}

const XamanConnect: React.FC<XamanConnectProps> = ({ onSuccess, className = '' }) => {
  const {
    isConnected,
    address,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    qrCode,
    isConnecting
  } = useWallet();

  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (isConnected && onSuccess) {
      onSuccess();
    }
  }, [isConnected, onSuccess]);

  const handleConnect = async () => {
    try {
      await connectWallet();
      setShowQR(true);
    } catch (error) {
      console.error('연결 실패:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowQR(false);
  };

  const closeQRModal = () => {
    setShowQR(false);
  };

  if (isConnected) {
    return (
      <div className={`bg-[#1A2332] p-4 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <div className="text-sm text-[#C9CDD6]">Connected Wallet</div>
              <div className="font-mono text-sm text-[#2EE6A6]">
                {address?.slice(0, 8)}...{address?.slice(-6)}
              </div>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-[#1A2332] p-4 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-[#2EE6A6]/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[#2EE6A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-[#C9CDD6] mb-4">
            Connect with Xaman to start streaming payments
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-600/20 border border-red-600/30 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isLoading || isConnecting}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
              isLoading || isConnecting
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#2EE6A6] to-[#26D396] text-[#0B1220] hover:shadow-[0_0_20px_rgba(46,230,166,0.3)] hover:scale-105'
            }`}
          >
            {isLoading || isConnecting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isConnecting ? 'Waiting for Xaman...' : 'Connecting...'}
              </div>
            ) : (
              'Connect with Xaman'
            )}
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && qrCode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl p-8 max-w-md w-full border border-[#2EE6A6]/20">
            <div className="text-center">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Scan with Xaman</h3>
                <button
                  onClick={closeQRModal}
                  className="text-[#C9CDD6] hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl mb-6 inline-block">
                <Image
                  src={qrCode}
                  alt="Xaman QR Code"
                  width={256}
                  height={256}
                  className="block"
                />
              </div>

              <div className="text-sm text-[#C9CDD6] mb-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-2 h-2 bg-[#2EE6A6] rounded-full animate-pulse mr-2"></div>
                  Waiting for signature...
                </div>
                <p className="mb-2">Open Xaman app and scan this QR code to connect your wallet</p>
                <div className="text-xs text-[#C9CDD6] bg-[#0B1220] p-2 rounded">
                  <strong>📱 Steps:</strong><br/>
                  1. Open Xaman app on your phone<br/>
                  2. Tap "Scan QR" or use camera<br/>
                  3. Scan this QR code<br/>
                  4. Approve the SignIn request
                </div>
              </div>

              <div className="flex items-center justify-center text-xs text-[#C9CDD6]">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secured by XRPL Devnet
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default XamanConnect;