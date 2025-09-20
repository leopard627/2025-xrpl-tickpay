import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

// Test authorization for a specific user
const TEST_USER_ADDRESS = "rDEVELOPMENT_TEST_USER_ADDRESS"  // Test user - dummy address
const TEST_ISSUANCE_ID = "TEST_MPTOKEN_ISSUANCE_ID_PLACEHOLDER"  // Test MPToken ID

export async function testAuthorization() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()
  console.log("✅ Connected to XRPL Devnet")

  const ADMIN_SEED = process.env.ADMIN_SEED  // MPToken issuer seed
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED)
  console.log(`🔑 ADMIN (Issuer): ${admin.address}`)
  console.log(`👤 USER (Holder): ${TEST_USER_ADDRESS}`)
  console.log(`🎫 IssuanceID: ${TEST_ISSUANCE_ID}`)

  const authTx: Transaction = {
    TransactionType: "MPTokenAuthorize",
    Account: admin.address,          // ADMIN authorizes
    MPTokenIssuanceID: TEST_ISSUANCE_ID,
    Holder: TEST_USER_ADDRESS        // USER gets authorized
  }

  try {
    console.log("\n🔐 Authorizing user for MPToken...")
    console.log("Authorization TX:", authTx)

    const prepared = await client.autofill(authTx)
    console.log("✅ Transaction prepared successfully")

    const signed = admin.sign(prepared)
    console.log("✅ Transaction signed successfully")

    const result = await client.submitAndWait(signed.tx_blob)
    console.log("\n📊 Authorization Result:")
    console.log(`Status: ${result.result.meta?.TransactionResult}`)
    console.log(`TX Hash: ${result.result.hash}`)

    if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
      console.log("🎉 Authorization successful!")
    } else {
      console.log("❌ Authorization failed!")
      console.log("Full result:", JSON.stringify(result, null, 2))
    }

    return result
  } catch (error) {
    console.error("💥 Authorization error:", error)
    throw error
  } finally {
    await client.disconnect()
    console.log("✅ Disconnected from XRPL")
  }
}

// Execute if this file is run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  testAuthorization().catch(e => {
    console.error("💥 Script failed:", e)
    process.exit(1)
  })
}