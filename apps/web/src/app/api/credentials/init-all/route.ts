import { NextRequest, NextResponse } from 'next/server';
import { credentialsManager } from '@/lib/xrpl-credentials';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Initializing on-chain credentials for all A2A agents...');

    // All A2A agent addresses
    const agentAddresses = [
      process.env.NEXT_PUBLIC_AGENT1_ADDRESS || 'rDEVELOPMENT_AGENT1_ADDRESS', // Agent 1
      process.env.NEXT_PUBLIC_AGENT3_ADDRESS || 'rDEVELOPMENT_AGENT3_ADDRESS', // Agent 2
      process.env.NEXT_PUBLIC_AGENT2_ADDRESS || 'rDEVELOPMENT_AGENT2_ADDRESS', // Agent 3
      process.env.NEXT_PUBLIC_AGENT6_ADDRESS || 'rDEVELOPMENT_AGENT6_ADDRESS', // Agent 4
      process.env.NEXT_PUBLIC_AGENT5_ADDRESS || 'rDEVELOPMENT_AGENT5_ADDRESS', // Agent 5
      process.env.NEXT_PUBLIC_AGENT4_ADDRESS || 'rDEVELOPMENT_AGENT4_ADDRESS'  // Agent 6
    ];

    const results: any[] = [];

    // Create credentials for each agent
    for (const address of agentAddresses) {
      try {
        console.log(`🔐 Creating credential for agent: ${address}`);

        const credential = await credentialsManager.createOnChainCredential(
          address,
          'basic' // Start with basic credentials for all agents
        );

        results.push({
          address,
          success: true,
          credentialHash: credential.credentialHash,
          isOnChain: credential.isOnChain
        });

        // Small delay between creations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Failed to create credential for ${address}:`, error);
        results.push({
          address,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `Credential initialization completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('❌ Credential initialization failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to initialize credentials',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}