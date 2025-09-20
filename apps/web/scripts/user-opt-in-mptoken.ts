import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

// Test user opt-in for MPToken
const TEST_USER_ADDRESS = "rDEVELOPMENT_TEST_USER_ADDRESS"  // Test user - dummy address
const TEST_ISSUANCE_ID = "TEST_MPTOKEN_ISSUANCE_ID_PLACEHOLDER"  // Test MPToken ID

export async function userOptInMPToken() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()
  console.log("✅ Connected to XRPL Devnet")

  // For testing, we need a user wallet seed
  // In real scenario, this would be done by the user's Xaman wallet
  console.log("⚠️ Note: In production, this would be done by user's Xaman wallet")
  console.log(`👤 USER Address: ${TEST_USER_ADDRESS}`)
  console.log(`🎫 IssuanceID: ${TEST_ISSUANCE_ID}`)

  // Step 1: User opts into the MPToken issuance
  const optInTx: Transaction = {
    TransactionType: "MPTokenAuthorize",
    Account: TEST_USER_ADDRESS,       // USER signs this transaction
    MPTokenIssuanceID: TEST_ISSUANCE_ID
    // No Holder field needed when USER is opting in for themselves
  }

  try {
    console.log("\n🔐 Step 1: User opting into MPToken...")
    console.log("Opt-in TX:", optInTx)

    console.log("⚠️ This transaction needs to be signed by the USER wallet")
    console.log("💡 In real scenario, this would be done through Xaman wallet interaction")
    console.log("📝 For testing purposes, we would need the user's wallet seed")

    return { success: true, message: "User opt-in transaction prepared" }
  } catch (error) {
    console.error("💥 User opt-in error:", error)
    throw error
  } finally {
    await client.disconnect()
    console.log("✅ Disconnected from XRPL")
  }
}

// Execute if this file is run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  userOptInMPToken().catch(e => {
    console.error("💥 Script failed:", e)
    process.exit(1)
  })
}