import { NextRequest, NextResponse } from 'next/server';
import { XummSdk } from 'xumm-sdk';

// 실제 Xaman SDK 초기화
let xaman: XummSdk;
try {
  xaman = new XummSdk(
    process.env.NEXT_PUBLIC_XAMAN_API_KEY!,
    process.env.XAMAN_API_SECRET!
  );
  console.log('✅ Xaman SDK 초기화 성공');
} catch (error) {
  console.error('❌ Xaman SDK 초기화 실패:', error);
  throw error;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Xaman API 환경변수 체크:', {
      hasApiKey: !!process.env.NEXT_PUBLIC_XAMAN_API_KEY,
      hasSecret: !!process.env.XAMAN_API_SECRET,
      apiKeyPrefix: process.env.NEXT_PUBLIC_XAMAN_API_KEY?.slice(0, 8) + '...',
    });

    const body = await request.json();
    const { txjson } = body;

    console.log('💸 실제 Payment 트랜잭션 페이로드 생성:', JSON.stringify(txjson, null, 2));

    // 중복 방지를 위한 고유 DestinationTag 추가
    const uniqueTag = Math.floor(Math.random() * 4294967295); // 32bit 최대값

    const enhancedTxjson = {
      ...txjson,
      DestinationTag: uniqueTag,
      // LastLedgerSequence를 추가하여 트랜잭션 만료 설정
      LastLedgerSequence: undefined // Xaman이 자동 설정하도록
    };

    console.log('🏷️ 고유 DestinationTag 추가:', uniqueTag);

    // 실제 Xaman Payload 생성
    console.log('🔄 Xaman payload.create 호출 시작...');
    console.log('🔍 SDK 인스턴스 상태:', !!xaman, typeof xaman);

    // 먼저 SDK ping 테스트
    try {
      const pingResult = await xaman.ping();
      console.log('🏓 Xaman SDK ping 결과:', pingResult);
    } catch (pingError) {
      console.error('❌ Xaman SDK ping 실패:', pingError);
    }

    const payloadRequest = {
      txjson: enhancedTxjson,
      options: {
        submit: true, // 자동 제출
        expire: 300,  // 5분 만료
        force_network: 'DEVNET', // Devnet 강제 설정
        return_url: {
          web: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/receipts`,
          app: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/receipts`
        }
      }
    };

    console.log('🔍 Xaman payload.create 전체 요청:', JSON.stringify(payloadRequest, null, 2));

    const response = await xaman.payload.create(payloadRequest);

    console.log('🔍 Xaman 원본 응답:', JSON.stringify(response, null, 2));

    if (!response || !response.uuid) {
      console.error('❌ Xaman 응답에 uuid가 없음:', response);
      return NextResponse.json({
        success: false,
        error: 'Xaman API에서 유효하지 않은 응답을 받았습니다'
      }, { status: 500 });
    }

    console.log('✅ 실제 Xaman 페이로드 생성 성공:', {
      uuid: response.uuid,
      qr: !!response.refs?.qr_png,
      websocket: !!response.refs?.websocket_status
    });

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ 실제 Payment 페이로드 생성 실패:', error);

    let errorMessage = 'Xaman API 오류';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Xaman API 특정 에러 처리
      if (error.message.includes('API key')) {
        errorMessage = 'Xaman API 키가 유효하지 않습니다';
        statusCode = 401;
      } else if (error.message.includes('network')) {
        errorMessage = 'Xaman 네트워크 연결 오류';
        statusCode = 503;
      } else if (error.message.includes('Account')) {
        errorMessage = '잘못된 계정 주소입니다';
        statusCode = 400;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : String(error)
    }, { status: statusCode });
  }
}
