/**
 * Storecove Peppol Access Point Integration
 * https://www.storecove.com/docs
 */

const STORECOVE_API_KEY = process.env.STORECOVE_API_KEY;
const STORECOVE_MODE = process.env.STORECOVE_MODE || 'test'; // 'test' or 'production'
const BASE_URL = STORECOVE_MODE === 'test' 
  ? 'https://api.storecove.com/api/v2'
  : 'https://api.storecove.com/api/v2';

/**
 * Send invoice via Storecove Peppol network
 */
export async function sendViaPeppol(ublXml, recipientId, recipientScheme, documentId) {
  if (!STORECOVE_API_KEY) {
    throw new Error('STORECOVE_API_KEY not configured in .env');
  }

  const payload = {
    legalEntityId: process.env.STORECOVE_LEGAL_ENTITY_ID || 1, // Your registered entity
    invoice: {
      documentType: 'invoice',
      invoiceNumber: documentId,
      // UBL XML as base64
      document: Buffer.from(ublXml).toString('base64'),
      routing: {
        eIdentifiers: [
          {
            scheme: recipientScheme,
            id: recipientId
          }
        ]
      }
    }
  };

  try {
    const response = await fetch(`${BASE_URL}/invoice_submissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STORECOVE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Storecove error: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      peppolId: result.guid,
      status: 'queued',
      message: 'Invoice queued for Peppol delivery',
    };
  } catch (error) {
    console.error('Storecove send error:', error);
    throw error;
  }
}

/**
 * Check Peppol delivery status
 */
export async function checkPeppolStatus(peppolId) {
  if (!STORECOVE_API_KEY) {
    throw new Error('STORECOVE_API_KEY not configured');
  }

  try {
    const response = await fetch(`${BASE_URL}/invoice_submissions/${peppolId}`, {
      headers: {
        'Authorization': `Bearer ${STORECOVE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      status: result.status, // 'queued', 'in_transit', 'delivered', 'failed'
      lastUpdate: result.updated,
      attempts: result.attempts || 0,
      error: result.error,
    };
  } catch (error) {
    console.error('Status check error:', error);
    return {
      status: 'unknown',
      error: error.message,
    };
  }
}
