import { Client } from "xrpl"

// Check MPToken information
const TEST_ISSUANCE_ID = "TEST_MPTOKEN_ISSUANCE_ID_PLACEHOLDER"  // Test MPToken ID

export async function checkMPTokenInfo() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()
  console.log("✅ Connected to XRPL Devnet")

  try {
    console.log(`🔍 Checking MPToken info for: ${TEST_ISSUANCE_ID}`)

    // Try to get MPToken information
    const response = await client.request({
      command: 'ledger_entry',
      mpt_issuance_id: TEST_ISSUANCE_ID
    })

    console.log("\n📊 MPToken Information:")
    console.log(JSON.stringify(response, null, 2))

  } catch (error) {
    console.error("❌ Error getting MPToken info:", error)

    // Try alternative method - get account info for the issuer
    try {
      console.log("\n🔍 Trying to get issuer account info...")
      const accountInfo = await client.request({
        command: 'account_info',
        account: 'rDEVELOPMENT_ISSUER_ADDRESS'
      })
      console.log("📊 Issuer Account Info:")
      console.log(JSON.stringify(accountInfo, null, 2))
    } catch (error2) {
      console.error("❌ Error getting account info:", error2)
    }
  } finally {
    await client.disconnect()
    console.log("✅ Disconnected from XRPL")
  }
}

// Execute if this file is run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  checkMPTokenInfo().catch(e => {
    console.error("💥 Script failed:", e)
    process.exit(1)
  })
}