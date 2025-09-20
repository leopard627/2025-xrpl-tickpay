"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Smartphone, CheckCircle, Clock } from 'lucide-react';

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode?: string;
  amount: number;
  currency: string;
  description?: string;
  onSuccess?: () => void;
  deepLink?: string;
  xamanUuid?: string; // Add UUID for payment status checking
}

const PaymentQRModal: React.FC<PaymentQRModalProps> = ({
  isOpen,
  onClose,
  qrCode,
  amount,
  currency,
  description,
  onSuccess: _onSuccess,
  deepLink,
  xamanUuid
}) => {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'completed' | 'failed'>('pending');

  // Auto-check payment status if UUID is provided
  useEffect(() => {
    if (!isOpen || !xamanUuid) return;

    const checkPaymentStatus = async () => {
      try {
        setPaymentStatus('checking');
        const response = await fetch(`/api/xaman/check-payload?uuid=${xamanUuid}`);
        const result = await response.json();

        if (result.success && result.data?.signed === true) {
          setPaymentStatus('completed');
          setTimeout(() => {
            if (_onSuccess) _onSuccess();
            onClose();
          }, 2000); // Show success for 2 seconds before closing
        } else if (result.data?.signed === false) {
          setPaymentStatus('failed');
        } else {
          setPaymentStatus('pending');
        }
      } catch (error) {
        console.error('Payment status check failed:', error);
        setPaymentStatus('pending');
      }
    };

    // Check immediately
    checkPaymentStatus();

    // Then check every 3 seconds
    const interval = setInterval(checkPaymentStatus, 3000);

    return () => clearInterval(interval);
  }, [isOpen, xamanUuid, _onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1A2332] to-[#0F1B2E] rounded-3xl p-8 max-w-lg w-full border border-[#2EE6A6]/20 shadow-[0_0_50px_rgba(46,230,166,0.1)]">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {paymentStatus === 'completed' ? 'Payment Completed! 🎉' :
               paymentStatus === 'failed' ? 'Payment Failed' :
               paymentStatus === 'checking' ? 'Checking Payment...' : 'Complete Payment'}
            </h3>
            <p className="text-[#C9CDD6] text-sm">
              {paymentStatus === 'completed' ? 'Your payment has been processed successfully' :
               paymentStatus === 'failed' ? 'Payment was cancelled or failed' :
               paymentStatus === 'checking' ? 'Waiting for payment confirmation...' : 'Scan QR code with Xaman app'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#C9CDD6] hover:text-white transition-colors p-2 hover:bg-[#2A3441] rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Payment Details */}
        <div className="bg-[#0B1220] rounded-2xl p-6 mb-8 border border-[#2EE6A6]/10">
          <div className="text-center">
            <div className="text-3xl font-black text-[#2EE6A6] mb-2">
              {amount.toFixed(6)} {currency}
            </div>
            {description && (
              <p className="text-sm text-[#C9CDD6]">{description}</p>
            )}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="text-center mb-8">
          {qrCode ? (
            <div className="inline-block">
              <div className="bg-white p-6 rounded-2xl mb-4 shadow-lg">
                <Image
                  src={qrCode}
                  alt="Payment QR Code"
                  width={280}
                  height={280}
                  className="block"
                />
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-center text-[#2EE6A6] mb-4">
                <Clock className="w-5 h-5 mr-2 animate-pulse" />
                <span className="text-sm font-medium">Waiting for payment confirmation...</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-[#0B1220] rounded-2xl border border-[#2EE6A6]/10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2EE6A6] mx-auto mb-4"></div>
                <p className="text-[#C9CDD6]">Generating QR code...</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions and Actions */}
        <div className="space-y-4">
          {/* Manual Deep Link Button */}
          {deepLink && (
            <button
              onClick={() => window.open(deepLink, '_blank')}
              className="w-full bg-gradient-to-r from-[#2EE6A6] to-[#26D396] text-[#0B1220] py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(46,230,166,0.4)] hover:scale-105 flex items-center justify-center"
            >
              <Smartphone className="w-5 h-5 mr-2" />
              Open in Xaman App
            </button>
          )}

          {/* Payment Completed Button */}
          <button
            onClick={() => {
              if (_onSuccess) _onSuccess();
              onClose();
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            결제 완료 확인
          </button>

          {/* Instructions */}
          <div className="bg-[#0B1220] rounded-xl p-4 border border-[#2EE6A6]/10">
            <div className="text-sm text-[#C9CDD6]">
              <p className="font-medium text-white mb-3 text-center">Choose your payment method:</p>
              <div className="grid grid-cols-1 gap-3 text-xs">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-[#2EE6A6] text-[#0B1220] rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
                  <div>
                    <p className="font-medium text-white">Mobile users:</p>
                    <p>Tap &quot;Open in Xaman App&quot; button above</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-[#2EE6A6] text-[#0B1220] rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
                  <div>
                    <p className="font-medium text-white">Desktop users:</p>
                    <p>Scan the QR code with your Xaman mobile app</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#2EE6A6]/10">
          <div className="flex items-center justify-center text-xs text-[#C9CDD6]">
            <CheckCircle className="w-4 h-4 mr-1" />
            Secured by XRPL Devnet
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentQRModal;