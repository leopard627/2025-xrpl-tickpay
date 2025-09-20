import { NextRequest, NextResponse } from 'next/server';
import { XummSdk } from 'xumm-sdk';

// 서버사이드에서만 API Secret 사용
const xaman = new XummSdk(
  process.env.NEXT_PUBLIC_XAMAN_API_KEY!,
  process.env.XAMAN_API_SECRET!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const payloadUuid = searchParams.get('uuid');

    if (!payloadUuid) {
      return NextResponse.json(
        { success: false, error: 'Payload UUID is required' },
        { status: 400 }
      );
    }

    // Payload 상태 확인
    const status = await xaman.payload.get(payloadUuid);

    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Payload 상태 확인 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}