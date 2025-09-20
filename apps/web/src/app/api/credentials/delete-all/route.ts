import { NextRequest, NextResponse } from 'next/server';
import { credentialsManager } from '@/lib/xrpl-credentials';

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Deleting all on-chain credentials for A2A agents...');

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

    // Delete credentials for each agent
    for (const address of agentAddresses) {
      try {
        console.log(`🗑️ Deleting credential for agent: ${address}`);

        const success = await credentialsManager.deleteCredential(
          address,
          'basic' // Delete basic credentials
        );

        results.push({
          address,
          success,
          deleted: true
        });

        // Small delay between deletions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Failed to delete credential for ${address}:`, error);
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
      message: `Credential deletion completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('❌ Credential deletion failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete credentials',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}