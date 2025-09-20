import { NextRequest, NextResponse } from 'next/server';
import { Client, Wallet, Transaction } from 'xrpl';

const XRPL_SERVER = process.env.NEXT_PUBLIC_XRPL_SERVER || 'wss://s.devnet.rippletest.net:51233';
const ADMIN_SEED = process.env.ADMIN_SEED;

// Use working IssuanceID from your test
const ISSUANCE_ID = "0049CE469E4215DD8AC6196A0A5027DF489AEC3B17BD6211";

export async function POST(request: NextRequest) {
  if (!ADMIN_SEED) {
    return NextResponse.json({ error: 'ADMIN_SEED not configured' }, { status: 500 });
  }

  try {
    console.log('🎫 Initializing MPToken opt-in for all A2A agents...');

    // All A2A agent data - need both address and seed for opt-in
    const agents = [
      {
        address: process.env.NEXT_PUBLIC_AGENT1_ADDRESS || 'rDEVELOPMENT_AGENT1_ADDRESS',
        seed: process.env.ADMIN_SEED || 'sDEVELOPMENT_ADMIN_SEED_PLACEHOLDER'
      }, // Agent 1 (Admin)
      {
        address: process.env.NEXT_PUBLIC_AGENT3_ADDRESS || 'rDEVELOPMENT_AGENT3_ADDRESS',
        seed: process.env.USER_SEED || 'sDEVELOPMENT_USER_SEED_PLACEHOLDER'
      }, // Agent 2
      {
        address: process.env.NEXT_PUBLIC_AGENT2_ADDRESS || 'rDEVELOPMENT_AGENT2_ADDRESS',
        seed: process.env.USER2_SEED || 'sDEVELOPMENT_USER2_SEED_PLACEHOLDER'
      }, // Agent 3
      {
        address: process.env.NEXT_PUBLIC_AGENT6_ADDRESS || 'rDEVELOPMENT_AGENT6_ADDRESS',
        seed: process.env.USER3_SEED || 'sDEVELOPMENT_USER3_SEED_PLACEHOLDER'
      }, // Agent 4
      {
        address: process.env.NEXT_PUBLIC_AGENT5_ADDRESS || 'rDEVELOPMENT_AGENT5_ADDRESS',
        seed: process.env.USER4_SEED || 'sDEVELOPMENT_USER4_SEED_PLACEHOLDER'
      }, // Agent 5
      {
        address: process.env.NEXT_PUBLIC_AGENT4_ADDRESS || 'rDEVELOPMENT_AGENT4_ADDRESS',
        seed: process.env.USER5_SEED || 'sDEVELOPMENT_USER5_SEED_PLACEHOLDER'
      }  // Agent 6
    ];

    const client = new Client(XRPL_SERVER);
    await client.connect();

    const adminWallet = Wallet.fromSeed(ADMIN_SEED);
    const results: any[] = [];

    console.log(`🔑 Using Admin: ${adminWallet.address}`);
    console.log(`🆔 IssuanceID: ${ISSUANCE_ID}`);

    // Process each agent
    for (const agent of agents) {
      try {
        console.log(`\n🤖 Processing Agent: ${agent.address}`);

        if (!agent.seed) {
          console.log(`⚠️ Skipping ${agent.address} - No seed available`);
          results.push({
            address: agent.address,
            userOptIn: false,
            adminAuthorize: false,
            error: 'No seed available',
            skipped: true
          });
          continue;
        }

        const agentWallet = Wallet.fromSeed(agent.seed);
        let userOptInSuccess = false;
        let adminAuthorizeSuccess = false;

        // Step 1: User Opt-in (Agent authorizes themselves to receive tokens)
        if (agent.address !== adminWallet.address) { // Skip self opt-in for admin
          console.log(`  🔐 Step 1: User opt-in for ${agent.address}...`);

          const userOptInTx: Transaction = {
            TransactionType: "MPTokenAuthorize",
            Account: agent.address,
            MPTokenIssuanceID: ISSUANCE_ID
          };

          try {
            const preparedOptIn = await client.autofill(userOptInTx);
            const signedOptIn = agentWallet.sign(preparedOptIn);
            const optInResult = await client.submitAndWait(signedOptIn.tx_blob);

            if (optInResult.result.meta?.TransactionResult === 'tesSUCCESS') {
              console.log(`  ✅ User opt-in successful`);
              userOptInSuccess = true;
            } else {
              console.log(`  ❌ User opt-in failed: ${optInResult.result.meta?.TransactionResult}`);
            }

            // Small delay between transactions
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (error) {
            console.log(`  ❌ User opt-in error:`, error);
          }
        } else {
          userOptInSuccess = true; // Admin doesn't need to opt-in to their own issuance
          console.log(`  ✅ Admin skip user opt-in (self-issuance)`);
        }

        // Step 2: Admin Authorization (Admin authorizes the agent as holder)
        if (agent.address !== adminWallet.address) { // Skip self-authorization for admin
          console.log(`  🔑 Step 2: Admin authorization for ${agent.address}...`);

          const adminAuthTx: Transaction = {
            TransactionType: "MPTokenAuthorize",
            Account: adminWallet.address,
            MPTokenIssuanceID: ISSUANCE_ID,
            Holder: agent.address
          };

          try {
            const preparedAuth = await client.autofill(adminAuthTx);
            const signedAuth = adminWallet.sign(preparedAuth);
            const authResult = await client.submitAndWait(signedAuth.tx_blob);

            if (authResult.result.meta?.TransactionResult === 'tesSUCCESS') {
              console.log(`  ✅ Admin authorization successful`);
              adminAuthorizeSuccess = true;
            } else {
              console.log(`  ❌ Admin authorization failed: ${authResult.result.meta?.TransactionResult}`);
            }

            // Small delay between agents
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (error) {
            console.log(`  ❌ Admin authorization error:`, error);
          }
        } else {
          adminAuthorizeSuccess = true; // Admin can send to anyone they've authorized
          console.log(`  ✅ Admin skip self-authorization`);
        }

        results.push({
          address: agent.address,
          userOptIn: userOptInSuccess,
          adminAuthorize: adminAuthorizeSuccess,
          ready: userOptInSuccess && adminAuthorizeSuccess,
          issuanceId: ISSUANCE_ID
        });

      } catch (error) {
        console.error(`❌ Failed to process agent ${agent.address}:`, error);
        results.push({
          address: agent.address,
          userOptIn: false,
          adminAuthorize: false,
          ready: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    await client.disconnect();

    const readyCount = results.filter(r => r.ready).length;
    const totalCount = results.length;

    console.log(`\n🎫 MPToken opt-in initialization completed: ${readyCount}/${totalCount} agents ready`);

    return NextResponse.json({
      success: true,
      message: `MPToken opt-in completed: ${readyCount}/${totalCount} agents ready for transfers`,
      issuanceId: ISSUANCE_ID,
      results,
      summary: {
        total: totalCount,
        ready: readyCount,
        failed: totalCount - readyCount
      }
    });

  } catch (error) {
    console.error('❌ MPToken opt-in initialization failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to initialize MPToken opt-in',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}