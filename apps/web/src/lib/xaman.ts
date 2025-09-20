// 클라이언트에서는 API Secret을 사용하지 않고 Next.js API 라우트를 통해 서버사이드에서 처리

export interface XamanPayloadResponse {
  uuid: string;
  next: {
    always: string;
    no_push_msg_received?: string;
  };
  pushed: boolean;
  qr_png: string;
  qr_matrix: string;
  qr_uri_quality_opts: string[];
  refs: {
    qr_png: string;
    qr_matrix: string;
    qr_uri_quality_opts: string[];
    websocket_status: string;
  };
}

export interface XamanSignInPayload {
  txjson: {
    TransactionType: 'SignIn';
  };
  options?: {
    submit?: boolean;
    multisign?: boolean;
    return_url?: {
      web?: string;
      app?: string;
    };
  };
}

// Devnet을 위한 설정
export const createSignInPayload = (): XamanSignInPayload => ({
  txjson: {
    TransactionType: 'SignIn'
  },
  options: {
    submit: false, // SignIn은 제출하지 않음
    expire: 300, // 5분 만료시간
    return_url: {
      web: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`,
      app: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`
    }
  }
});

// QR 코드 생성을 위한 유틸리티 - API 라우트를 통해 서버사이드에서 처리
export const generateXamanQR = async (payload: XamanSignInPayload): Promise<XamanPayloadResponse> => {
  try {
    const response = await fetch('/api/xaman/create-payload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to create payload');
    }

    return result.data as XamanPayloadResponse;
  } catch (error) {
    console.error('Xaman QR 생성 실패:', error);
    throw error;
  }
};

// 결제 payload 상태 확인 - API 라우트를 통해 서버사이드에서 처리
export const checkPayloadStatus = async (payloadUuid: string) => {
  try {
    const response = await fetch(`/api/xaman/check-payload?uuid=${payloadUuid}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to check payload status');
    }

    return result.data;
  } catch (error) {
    console.error('Payload 상태 확인 실패:', error);
    throw error;
  }
};