import { xrpToDrops } from 'xrpl';

// 실제 Xaman을 통한 XRP 결제
export async function sendXRPPaymentViaXaman(
  sourceAddress: string,
  destinationAddress: string,
  amount: string, // XRP 단위
  memo?: string,
  onQRCode?: (qrCode: string, payload: any) => void
): Promise<{ success: boolean; txHash?: string; error?: string; payloadUuid?: string }> {
  try {
    console.log('💸 실제 Xaman을 통한 XRP 결제 시작:', {
      sourceAddress,
      destinationAddress,
      amount,
      memo
    });

    const memos = memo ? [{
      Memo: {
        MemoData: Buffer.from(memo, 'utf8').toString('hex').toUpperCase(),
        MemoType: Buffer.from('text/plain', 'utf8').toString('hex').toUpperCase()
      }
    }] : undefined;

    // 1. 실제 Xaman Payload 생성
    const response = await fetch('/api/xaman/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        txjson: {
          TransactionType: 'Payment',
          Account: sourceAddress,
          Destination: destinationAddress,
          Amount: xrpToDrops(amount),
          ...(memos && { Memos: memos })
        }
      })
    });

    console.log('🔍 Xaman API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Xaman API HTTP 오류:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Xaman API HTTP 오류 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('🔍 Xaman API 전체 응답:', JSON.stringify(result, null, 2));

    if (!result.success) {
      console.error('❌ Xaman API 비즈니스 로직 오류:', result);
      throw new Error(result.error || 'Xaman 페이로드 생성 실패');
    }

    if (!result.data) {
      console.error('❌ Xaman API 응답에 data 필드가 없음:', result);
      throw new Error('Xaman API 응답에서 data를 찾을 수 없습니다');
    }

    const payload = result.data;
    console.log('✅ Xaman 페이로드 생성 성공:', {
      uuid: payload.uuid,
      qrUrl: payload.refs.qr_png
    });

    // 2. QR 코드를 콜백으로 전달 (모달 표시용)
    if (onQRCode && payload.refs?.qr_png) {
      onQRCode(payload.refs.qr_png, payload);
    }

    // 3. 딥링크는 QR 모달에서 수동으로 처리하도록 변경
    if (payload.next?.always) {
      console.log('📱 Xaman 딥링크 준비됨 (자동 열기 비활성화):', payload.next.always);
      // 자동 새창 열기 제거 - QR 모달만 사용
    }

    // 3. WebSocket을 통한 서명 상태 모니터링
    const signResult = await monitorPayloadStatus(payload.uuid, payload.refs.websocket_status);

    if (signResult.success && signResult.txHash) {
      console.log('✅ 실제 XRPL 트랜잭션 완료!', {
        txHash: signResult.txHash,
        explorerUrl: `https://devnet.xrpl.org/transactions/${signResult.txHash}`
      });

      return {
        success: true,
        txHash: signResult.txHash,
        payloadUuid: payload.uuid
      };
    } else {
      throw new Error(signResult.error || '트랜잭션 서명 실패');
    }

  } catch (error) {
    console.error('❌ Xaman 결제 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

// Payload 상태 모니터링 (WebSocket)
async function monitorPayloadStatus(
  payloadUuid: string,
  websocketUrl: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  return new Promise((resolve) => {
    let timeout: NodeJS.Timeout;
    let ws: WebSocket;

    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      if (ws) ws.close();
    };

    try {
      // 5분 타임아웃
      timeout = setTimeout(() => {
        cleanup();
        resolve({ success: false, error: '서명 타임아웃 (5분 경과)' });
      }, 300000);

      // WebSocket 연결
      ws = new WebSocket(websocketUrl);

      ws.onopen = () => {
        console.log('🔗 Xaman WebSocket 연결됨');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Xaman WebSocket 메시지 (전체):', JSON.stringify(data, null, 2));
          console.log('🔍 txid 값:', data.txid);
          console.log('🔍 signed 값:', data.signed);
          console.log('🔍 dispatched 값:', data.dispatched);
          console.log('🔍 txresult 값:', data.txresult);

          if (data.signed === true && data.txid) {
            // 서명 완료!
            cleanup();
            resolve({
              success: true,
              txHash: data.txid
            });
          } else if (data.signed === false) {
            // 서명 거절 또는 오류
            cleanup();

            // 특정 오류 메시지 확인
            let errorMessage = '사용자가 트랜잭션을 거절했습니다';
            if (data.txresult && data.txresult.includes('redundant')) {
              errorMessage = '중복 트랜잭션: 이미 처리된 결제입니다';
            } else if (data.error) {
              errorMessage = `트랜잭션 오류: ${data.error}`;
            }

            resolve({
              success: false,
              error: errorMessage
            });
          } else if (data.dispatched === true) {
            // 트랜잭션이 네트워크로 전송됨 (중간 상태)
            console.log('🚀 트랜잭션이 XRPL 네트워크로 전송됨');
          } else if (data.error) {
            // 일반적인 오류
            cleanup();
            resolve({
              success: false,
              error: `트랜잭션 처리 오류: ${data.error}`
            });
          }
        } catch (e) {
          console.error('WebSocket 메시지 파싱 실패:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket 오류:', error);
        cleanup();
        resolve({ success: false, error: 'WebSocket 연결 실패' });
      };

    } catch (error) {
      cleanup();
      resolve({ success: false, error: 'WebSocket 초기화 실패' });
    }
  });
}