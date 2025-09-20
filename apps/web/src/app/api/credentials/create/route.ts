import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'xrpl';
import { credentialsManager } from '@/lib/xrpl-credentials';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, credentialType = 'basic' } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate credential type
    if (!['basic', 'premium', 'enterprise'].includes(credentialType)) {
      return NextResponse.json(
        { error: 'Invalid credential type. Must be basic, premium, or enterprise' },
        { status: 400 }
      );
    }

    console.log('🔐 Creating on-chain credential for:', walletAddress, credentialType);

    // Create on-chain credential
    const credential = await credentialsManager.createOnChainCredential(
      walletAddress,
      credentialType as 'basic' | 'premium' | 'enterprise'
    );

    return NextResponse.json({
      success: true,
      credential: {
        walletAddress: credential.walletAddress,
        credentialType: credential.credentialType,
        verificationLevel: credential.verificationLevel,
        isOnChain: credential.isOnChain,
        credentialHash: credential.credentialHash,
        issuedAt: credential.issuedAt,
        expiresAt: credential.expiresAt
      }
    });

  } catch (error) {
    console.error('❌ Credential creation failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to create credential',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking credentials for:', walletAddress);

    // Check existing credentials
    const verificationResult = await credentialsManager.verifyUserCredentials(walletAddress);

    return NextResponse.json({
      success: true,
      isValid: verificationResult.isValid,
      credential: verificationResult.credential ? {
        walletAddress: verificationResult.credential.walletAddress,
        credentialType: verificationResult.credential.credentialType,
        verificationLevel: verificationResult.credential.verificationLevel,
        isOnChain: verificationResult.credential.isOnChain,
        credentialHash: verificationResult.credential.credentialHash,
        issuedAt: verificationResult.credential.issuedAt,
        expiresAt: verificationResult.credential.expiresAt,
        onChainCredential: verificationResult.credential.onChainCredential
      } : null,
      error: verificationResult.error
    });

  } catch (error) {
    console.error('❌ Credential verification failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to verify credentials',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}