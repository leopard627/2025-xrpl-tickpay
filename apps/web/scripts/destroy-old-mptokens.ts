import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env.local") })

// Current MPToken IssuanceIDs that need to be destroyed (problematic tokens)
const OLD_ISSUANCE_IDS = [
  "005E2B5A9899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5", // Netflix Basic (current problematic)
  "005E2B5B9899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5", // Netflix Premium (current problematic)
  "005E2B5C9899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5", // Netflix Enterprise (current problematic)
  "005E2B5D9899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5", // Spotify Basic (current problematic)
  "005E2B5E9899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5", // Spotify Premium (current problematic)
  "005E2B5F9899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5", // YouTube Basic (current problematic)
  "005E2B609899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5", // YouTube Premium (current problematic)
  "005E2B619899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5", // Coupang Basic (current problematic)
  "005E2B629899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5", // Coupang Premium (current problematic)
]

export async function destroyOldMPTokens() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()
  console.log("✅ Connected to XRPL Devnet")

  // Use the MPToken issuer seed
  const ADMIN_SEED = process.env.ADMIN_SEED
  if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")
  const issuerWallet = Wallet.fromSeed(ADMIN_SEED)

  console.log(`💰 Issuer: ${issuerWallet.address}`)
  console.log(`🗑️ Destroying ${OLD_ISSUANCE_IDS.length} old MPTokens...`)

  let successCount = 0
  let failureCount = 0

  for (let i = 0; i < OLD_ISSUANCE_IDS.length; i++) {
    const issuanceId = OLD_ISSUANCE_IDS[i]
    console.log(`\n🔥 Destroying MPToken ${i + 1}/${OLD_ISSUANCE_IDS.length}: ${issuanceId}`)

    const tx: Transaction = {
      TransactionType: "MPTokenIssuanceDestroy",
      Account: issuerWallet.address,
      MPTokenIssuanceID: issuanceId
    }

    try {
      const prepared = await client.autofill(tx)
      const signed = issuerWallet.sign(prepared)
      const result = await client.submitAndWait(signed.tx_blob)

      if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
        if (result.result.meta.TransactionResult === 'tesSUCCESS') {
          console.log(`✅ Successfully destroyed: ${issuanceId}`)
          successCount++
        } else {
          console.log(`❌ Failed to destroy: ${issuanceId} - ${result.result.meta.TransactionResult}`)
          failureCount++
        }
      }
    } catch (error) {
      console.log(`❌ Error destroying ${issuanceId}:`, error.message)
      failureCount++
    }

    // Add small delay between transactions
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`\n📊 Destruction Summary:`)
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${failureCount}`)
  console.log(`📝 Total: ${OLD_ISSUANCE_IDS.length}`)

  await client.disconnect()
  console.log("✅ Disconnected from XRPL")
}

// Execute if this file is run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  destroyOldMPTokens().catch(e => {
    console.error("💥 Error:", e)
    process.exit(1)
  })
}