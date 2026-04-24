/**
 * Peppol API Routes
 */

import express from 'express';
import { authRequired } from '../middleware/authRequired.js';
import { query } from '../db.js';
import { generateUBL } from './ubl.js';
import { sendViaPeppol, checkPeppolStatus } from './storecove.js';

const router = express.Router();

// Export UBL XML
router.get('/document/:id/ubl', authRequired, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get document with customer and company info
    const docResult = await query(
      `SELECT d.*, c.name as customer_name, c.email as customer_email, c.vat as customer_vat,
              c.address as customer_address, c.city as customer_city, c.postal_code as customer_postal_code,
              c.country as customer_country
       FROM documents d
       LEFT JOIN customers c ON d.customer_id = c.id
       WHERE d.id = $1`,
      [id]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docResult.rows[0];

    // Get lines
    const linesResult = await query(
      'SELECT * FROM document_lines WHERE document_id = $1 ORDER BY sort_order, id',
      [id]
    );

    // Get company settings
    const companyResult = await query(
      'SELECT * FROM company_settings WHERE user_id = $1',
      [req.user.sub]
    );

    const company = companyResult.rows[0] || {};

    // Generate UBL XML
    const ublXml = generateUBL({
      document: doc,
      lines: linesResult.rows,
      customer: {
        name: doc.customer_name,
        vat: doc.customer_vat,
        address: doc.customer_address,
        city: doc.customer_city,
        postalCode: doc.customer_postal_code,
        country: doc.customer_country || 'BE',
      },
      company,
    });

    res.set('Content-Type', 'application/xml');
    res.send(ublXml);
  } catch (error) {
    console.error('UBL export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send via Peppol
router.post('/document/:id/send', authRequired, async (req, res) => {
  const { id } = req.params;
  const { recipientId, recipientScheme } = req.body;

  if (!recipientId || !recipientScheme) {
    return res.status(400).json({ error: 'recipientId and recipientScheme required' });
  }

  try {
    // Get UBL XML (reuse export logic)
    const docResult = await query(
      `SELECT d.*, c.name as customer_name, c.vat as customer_vat,
              c.address as customer_address, c.city as customer_city, 
              c.postal_code as customer_postal_code, c.country as customer_country
       FROM documents d
       LEFT JOIN customers c ON d.customer_id = c.id
       WHERE d.id = $1`,
      [id]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docResult.rows[0];
    const linesResult = await query('SELECT * FROM document_lines WHERE document_id = $1', [id]);
    const companyResult = await query('SELECT * FROM company_settings WHERE user_id = $1', [req.user.sub]);
    const company = companyResult.rows[0] || {};

    const ublXml = generateUBL({
      document: doc,
      lines: linesResult.rows,
      customer: {
        name: doc.customer_name,
        vat: doc.customer_vat,
        address: doc.customer_address,
        city: doc.customer_city,
        postalCode: doc.customer_postal_code,
        country: doc.customer_country || 'BE',
      },
      company,
    });

    // Send via Storecove
    const result = await sendViaPeppol(ublXml, recipientId, recipientScheme, doc.number);

    // Update document
    await query(
      `UPDATE documents 
       SET peppol_id = $1, peppol_status = $2, peppol_sent_at = $3, updated_at = $4
       WHERE id = $5`,
      [result.peppolId, result.status, new Date().toISOString(), new Date().toISOString(), id]
    );

    res.json({
      success: true,
      peppolId: result.peppolId,
      status: result.status,
      message: result.message,
    });
  } catch (error) {
    console.error('Peppol send error:', error);
    
    // Update document with error
    await query(
      `UPDATE documents 
       SET peppol_status = $1, peppol_response = $2, updated_at = $3
       WHERE id = $4`,
      ['failed', JSON.stringify({ error: error.message }), new Date().toISOString(), id]
    );

    res.status(500).json({ error: error.message });
  }
});

// Get Peppol status
router.get('/document/:id/status', authRequired, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      'SELECT peppol_id, peppol_status, peppol_sent_at, peppol_response FROM documents WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.rows[0];

    if (!doc.peppol_id) {
      return res.json({ status: 'not_sent' });
    }

    // Check live status from Storecove
    const liveStatus = await checkPeppolStatus(doc.peppol_id);

    // Update if status changed
    if (liveStatus.status !== doc.peppol_status) {
      await query(
        'UPDATE documents SET peppol_status = $1, updated_at = $2 WHERE id = $3',
        [liveStatus.status, new Date().toISOString(), id]
      );
    }

    res.json({
      peppolId: doc.peppol_id,
      status: liveStatus.status,
      sentAt: doc.peppol_sent_at,
      lastUpdate: liveStatus.lastUpdate,
      attempts: liveStatus.attempts,
      error: liveStatus.error,
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Retry failed send
router.post('/document/:id/retry', authRequired, async (req, res) => {
  const { id } = req.params;

  try {
    const docResult = await query(
      'SELECT peppol_status, peppol_response FROM documents WHERE id = $1',
      [id]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docResult.rows[0];

    if (doc.peppol_status !== 'failed') {
      return res.status(400).json({ error: 'Can only retry failed sends' });
    }

    // Reset status
    await query(
      'UPDATE documents SET peppol_status = $1, peppol_id = NULL, updated_at = $2 WHERE id = $3',
      ['pending', new Date().toISOString(), id]
    );

    res.json({ success: true, message: 'Retry initiated. Use POST /peppol/document/:id/send to resend.' });
  } catch (error) {
    console.error('Retry error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
