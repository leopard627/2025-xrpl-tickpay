// Xaman API integration for MPToken opt-in transactions

interface XamanOptInRequest {
  txjson: {
    TransactionType: 'MPTokenAuthorize';
    Account: string;
    MPTokenIssuanceID: string;
  };
  custom_meta?: {
    identifier?: string;
    blob?: {
      purpose: string;
      service: string;
      description: string;
    };
  };
}

interface XamanOptInResponse {
  uuid: string;
  next: {
    always: string;
    no_push_msg_received?: string;
  };
  refs: {
    qr_png: string;
    qr_matrix: string;
    qr_uri_quality_opts: string[];
    websocket_status: string;
  };
  pushed: boolean;
}

export class XamanMPTokenOptIn {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://xumm.app/api/v1/platform';

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async createOptInRequest(
    userAddress: string,
    issuanceId: string,
    serviceId: string,
    serviceName: string
  ): Promise<XamanOptInResponse> {
    const payload: XamanOptInRequest = {
      txjson: {
        TransactionType: 'MPTokenAuthorize',
        Account: userAddress,
        MPTokenIssuanceID: issuanceId
      },
      custom_meta: {
        identifier: `mptoken-optin-${serviceId}-${Date.now()}`,
        blob: {
          purpose: 'MPToken Opt-in Authorization',
          service: serviceName,
          description: `Authorize receiving ${serviceName} subscription tokens`
        }
      }
    };

    const response = await fetch(`${this.baseUrl}/payload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-API-Secret': this.apiSecret
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xaman API error: ${response.status} ${error}`);
    }

    const result = await response.json();
    console.log('✅ Xaman opt-in request created:', result);

    return result;
  }

  async checkOptInStatus(uuid: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/payload/${uuid}`, {
      headers: {
        'X-API-Key': this.apiKey,
        'X-API-Secret': this.apiSecret
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xaman status check error: ${response.status} ${error}`);
    }

    return await response.json();
  }

  async waitForOptInCompletion(uuid: string, timeoutMs: number = 300000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.checkOptInStatus(uuid);

      console.log('🔍 Checking opt-in status:', status.meta?.resolved ? 'resolved' : 'pending');

      if (status.meta?.resolved) {
        if (status.meta.signed === true) {
          console.log('✅ User completed opt-in transaction!');
          return true;
        } else {
          console.log('❌ User rejected opt-in transaction');
          return false;
        }
      }

      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('⏰ Opt-in timeout reached');
    return false;
  }
}

// Helper function to create Xaman opt-in manager
export function createXamanOptInManager(): XamanMPTokenOptIn {
  const apiKey = process.env.NEXT_PUBLIC_XAMAN_API_KEY;
  const apiSecret = process.env.XAMAN_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('Missing Xaman API credentials');
  }

  return new XamanMPTokenOptIn(apiKey, apiSecret);
}