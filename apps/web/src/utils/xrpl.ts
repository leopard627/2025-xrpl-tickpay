import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl';

// XRPL Devnet 클라이언트
let client: Client | null = null;

export async function getXRPLClient(): Promise<Client> {
  if (!client) {
    client = new Client('wss://s.devnet.rippletest.net:51233');
  }

  if (!client.isConnected()) {
    await client.connect();
  }

  return client;
}

// 테스트용 지갑 생성 (Devnet에서만 사용)
export function generateTestWallet(): Wallet {
  return Wallet.generate();
}

// Devnet Faucet에서 XRP 요청
export async function fundWallet(wallet: Wallet): Promise<void> {
  try {
    const client = await getXRPLClient();

    const response = await fetch('https://faucet.devnet.rippletest.net/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination: wallet.address
      })
    });

    if (!response.ok) {
      throw new Error('Faucet request failed');
    }

    console.log(`💰 Faucet 자금 지급 완료: ${wallet.address}`);
  } catch (error) {
    console.error('Faucet 자금 지급 실패:', error);
    throw error;
  }
}

// Payment Channel 생성
export async function createPaymentChannel(
  sourceWallet: Wallet,
  destinationAddress: string,
  amount: string // XRP 단위
): Promise<string> {
  try {
    const client = await getXRPLClient();

    const channelCreate = {
      TransactionType: 'PaymentChannelCreate',
      Account: sourceWallet.address,
      Destination: destinationAddress,
      Amount: xrpToDrops(amount), // XRP를 drops로 변환
      SettleDelay: 86400, // 24시간 (초 단위)
      PublicKey: sourceWallet.publicKey
    };

    const prepared = await client.autofill(channelCreate);
    const signed = sourceWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        // Payment Channel ID 추출
        const channelId = result.result.hash;
        console.log('✅ Payment Channel 생성 성공:', {
          channelId,
          txHash: result.result.hash,
          sourceAddress: sourceWallet.address,
          destinationAddress,
          amount
        });
        return channelId;
      }
    }

    throw new Error('Payment Channel 생성 실패');
  } catch (error) {
    console.error('Payment Channel 생성 오류:', error);
    throw error;
  }
}

// Payment Channel Claim (정산)
export async function claimPaymentChannel(
  channelId: string,
  sourceWallet: Wallet,
  amount: string, // XRP 단위
  signature?: string
): Promise<{ claimTx: string; paymentTx?: string }> {
  try {
    const client = await getXRPLClient();

    // Payment Channel Claim 트랜잭션
    const channelClaim = {
      TransactionType: 'PaymentChannelClaim',
      Account: sourceWallet.address,
      Channel: channelId,
      Amount: xrpToDrops(amount),
      Signature: signature || '' // 실제로는 proper signature 필요
    };

    const prepared = await client.autofill(channelClaim);
    const signed = sourceWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        console.log('✅ Payment Channel Claim 성공:', {
          claimTx: result.result.hash,
          amount
        });

        return {
          claimTx: result.result.hash
        };
      }
    }

    throw new Error('Payment Channel Claim 실패');
  } catch (error) {
    console.error('Payment Channel Claim 오류:', error);
    throw error;
  }
}

// 계정 잔액 조회
export async function getAccountBalance(address: string): Promise<string> {
  try {
    const client = await getXRPLClient();
    const response = await client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated'
    });

    return dropsToXrp(response.result.account_data.Balance);
  } catch (error) {
    console.error('잔액 조회 실패:', error);
    throw error;
  }
}

// XRPL 연결 해제
export async function disconnectXRPL(): Promise<void> {
  if (client && client.isConnected()) {
    await client.disconnect();
    client = null;
  }
}