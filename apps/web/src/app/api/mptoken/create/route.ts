import { NextRequest, NextResponse } from 'next/server';
import { Client, Wallet } from 'xrpl';
import { OnChainMPTokenManager } from '@/lib/xrpl-onchain-mptokens';

// Initialize XRPL client and MPToken manager
const client = new Client('wss://s.devnet.rippletest.net:51233');

// Use the same wallet that receives payments as MPToken issuer
const PROVIDER_SEED = process.env.XAMAN_WALLET_SEED;

// Validate seed format
let mpTokenManager: OnChainMPTokenManager;
try {
  if (!PROVIDER_SEED) {
    throw new Error('XAMAN_WALLET_SEED environment variable is required');
  }
  mpTokenManager = new OnChainMPTokenManager(client, PROVIDER_SEED);
} catch (error) {
  console.error('❌ Failed to initialize MPToken manager:', error);
  // Use a generated wallet as fallback for demo purposes
  mpTokenManager = new OnChainMPTokenManager(client);
}

export async function POST(req: NextRequest) {
  try {
    const {
      holderAddress,
      serviceId,
      serviceName,
      subscriptionType = 'monthly',
      tier = 'basic'
    } = await req.json();

    // Validation
    if (!holderAddress || !serviceId || !serviceName) {
      return NextResponse.json(
        { error: 'Missing required fields: holderAddress, serviceId, serviceName' },
        { status: 400 }
      );
    }

    console.log('🎫 Creating on-chain MPToken:', {
      holderAddress,
      serviceId,
      serviceName,
      subscriptionType,
      tier
    });

    // Connect to XRPL
    if (!client.isConnected()) {
      console.log('🔌 Connecting to XRPL...');
      await client.connect();
    }

    // Create MPToken on XRPL
    const result = await mpTokenManager.createMPTokenOnChain(
      holderAddress,
      serviceId,
      serviceName,
      subscriptionType,
      tier
    );

    if (result.success) {
      console.log('✅ MPToken created successfully:', {
        tokenId: result.tokenId,
        txHash: result.txHash
      });

      return NextResponse.json({
        success: true,
        tokenId: result.tokenId,
        txHash: result.txHash,
        token: result.token,
        explorerUrl: `https://devnet.xrpl.org/transactions/${result.txHash}`
      });
    } else {
      console.error('❌ MPToken creation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'MPToken creation failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const holderAddress = searchParams.get('holder');
    const tokenId = searchParams.get('tokenId');

    if (!client.isConnected()) {
      await client.connect();
    }

    if (tokenId) {
      // Get specific MPToken
      const token = await mpTokenManager.getMPTokenInfo(tokenId);
      return NextResponse.json({ token });
    } else if (holderAddress) {
      // Get all MPTokens for holder
      const tokens = await mpTokenManager.getHolderMPTokens(holderAddress);
      return NextResponse.json({ tokens });
    } else {
      return NextResponse.json(
        { error: 'Please provide either tokenId or holder address' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}