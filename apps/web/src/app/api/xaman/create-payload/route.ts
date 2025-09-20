import { NextRequest, NextResponse } from 'next/server';
import { XummSdk } from 'xumm-sdk';

// 서버사이드에서만 API Secret 사용
const xaman = new XummSdk(
  process.env.NEXT_PUBLIC_XAMAN_API_KEY!,
  process.env.XAMAN_API_SECRET!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📩 Payload 요청:', JSON.stringify(body, null, 2));

    // Payload 생성 요청
    const response = await xaman.payload.create(body);
    console.log('📦 Xaman 응답:', JSON.stringify(response, null, 2));

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('❌ Xaman payload 생성 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}