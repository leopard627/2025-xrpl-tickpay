// Express API for Xaman MPToken opt-in
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.XAMAN_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Xaman API configuration
const XAMAN_API_KEY = process.env.NEXT_PUBLIC_XAMAN_API_KEY;
const XAMAN_API_SECRET = process.env.XAMAN_API_SECRET;
const XAMAN_BASE_URL = 'https://xumm.app/api/v1/platform';

// Create MPToken opt-in request
app.post('/api/mptoken/optin/create', async (req, res) => {
  try {
    const { userAddress, issuanceId, serviceId, serviceName } = req.body;

    if (!userAddress || !issuanceId || !serviceId || !serviceName) {
      return res.status(400).json({
        error: 'Missing required fields: userAddress, issuanceId, serviceId, serviceName'
      });
    }

    if (!XAMAN_API_KEY || !XAMAN_API_SECRET) {
      return res.status(500).json({
        error: 'Missing Xaman API credentials'
      });
    }

    console.log('📱 Creating Xaman opt-in request for:', {
      userAddress,
      issuanceId,
      serviceId,
      serviceName
    });

    const payload = {
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

    const response = await fetch(`${XAMAN_BASE_URL}/payload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': XAMAN_API_KEY,
        'X-API-Secret': XAMAN_API_SECRET
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Xaman API error:', error);
      return res.status(response.status).json({
        error: `Xaman API error: ${response.status} ${error}`
      });
    }

    const result = await response.json();
    console.log('✅ Xaman opt-in request created:', result.uuid);

    res.json({
      success: true,
      uuid: result.uuid,
      qrCode: result.refs.qr_png,
      deepLink: result.next.always,
      websocket: result.refs.websocket_status
    });

  } catch (error) {
    console.error('💥 API Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Check opt-in status
app.get('/api/mptoken/optin/status/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;

    if (!XAMAN_API_KEY || !XAMAN_API_SECRET) {
      return res.status(500).json({
        error: 'Missing Xaman API credentials'
      });
    }

    const response = await fetch(`${XAMAN_BASE_URL}/payload/${uuid}`, {
      headers: {
        'X-API-Key': XAMAN_API_KEY,
        'X-API-Secret': XAMAN_API_SECRET
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({
        error: `Xaman status check error: ${response.status} ${error}`
      });
    }

    const result = await response.json();

    res.json({
      success: true,
      resolved: result.meta?.resolved || false,
      signed: result.meta?.signed || false,
      txid: result.response?.txid || null,
      account: result.response?.account || null
    });

  } catch (error) {
    console.error('💥 Status Check Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Xaman MPToken Opt-in API',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Xaman MPToken API server running on port ${PORT}`);
  console.log(`📱 Opt-in endpoint: http://localhost:${PORT}/api/mptoken/optin/create`);
  console.log(`🔍 Status endpoint: http://localhost:${PORT}/api/mptoken/optin/status/:uuid`);
});

export default app;