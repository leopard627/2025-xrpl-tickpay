import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from '../contexts/WalletContext';
import { StreamingProvider } from '../contexts/StreamingContext';
import { TransactionProvider } from '../contexts/TransactionContext';
import { PriceProvider } from '../contexts/PriceContext';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TickPay - AI Agent Streaming Payments",
  description: "When the agent works, money ticks. RLUSD-denominated, usage-based payments on XRPL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider>
          <PriceProvider>
            <TransactionProvider>
              <StreamingProvider>
                {children}
                <Toaster />
              </StreamingProvider>
            </TransactionProvider>
          </PriceProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
