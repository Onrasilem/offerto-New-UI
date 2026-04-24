import express from 'express';
import pool from '../db-sqlite.js';
import { mapPaymentStatus } from './statusMap.js';
import { authRequired } from '../middleware/authRequired.js';
import { 
  registerPayment, 
  findPaymentMatches, 
  getPaymentOverview,
  updatePaymentReminder,
  createMolliePayment,
  handleMollieWebhook,
  getMolliePaymentStatus,
  getDocumentMolliePayments,
} from './service.js';

const router = express.Router();
const db = pool;

/**
 * Create Mollie payment link for a document
 * POST /payments/mollie/create
 */
router.post('/mollie/create', authRequired, async (req, res) => {
  try {
    const { documentId } = req.body;
    const userId = req.user.id;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    const result = await createMolliePayment(db, documentId, userId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error creating Mollie payment:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create payment link',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * Mollie webhook endpoint
 * POST /payments/webhook
 * 
 * Called by Mollie when payment status changes
 * NO AUTH REQUIRED (Mollie calls this)
 */
router.post('/webhook', async (req, res) => {
  try {
    const { id: molliePaymentId } = req.body;
    
    if (!molliePaymentId) {
      console.warn('⚠️  Webhook missing payment id');
      return res.status(400).json({ error: 'Payment ID required' });
    }

    const result = await handleMollieWebhook(db, molliePaymentId);

    // Always respond 200 OK to Mollie
    res.status(200).json({ received: true, ...result });
  } catch (error) {
    console.error('❌ Error handling Mollie webhook:', error);
    // Still respond 200 to prevent Mollie retries
    res.status(200).json({ received: true, error: error.message });
  }
});

/**
 * Get payment status
 * GET /payments/:paymentId/status
 */
router.get('/:paymentId/status', authRequired, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await getMolliePaymentStatus(db, paymentId);
    
    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(404).json({ error: error.message });
  }
});

/**
 * Get all payments for a document
 * GET /payments/document/:documentId
 */
router.get('/document/:documentId', authRequired, async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const payments = getDocumentMolliePayments(db, documentId);
    
    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error('Error getting document payments:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Legacy Mollie webhook (redirect to new endpoint)
 */
router.post('/mollie', async (req, res) => {
  console.log('⚠️  Legacy /payments/mollie endpoint called, redirecting...');
  req.url = '/webhook';
  return router.handle(req, res);
});

// ===== CREDIT MANAGEMENT ROUTES =====

/**
 * POST /payments/register
 * Registreer een betaling (handmatig of via bank statement)
 */
router.post('/register', authRequired, async (req, res) => {
  const userId = req.user.id;
  const { db } = req.app.locals;
  
  try {
    const {
      documentId,
      amount,
      paymentMethod = 'bank_transfer',
      bankAccount = null,
      structuredReference = null,
      bankStatementDate = null,
      bankStatementRef = null,
      notes = null,
    } = req.body;

    if (!documentId || !amount) {
      return res.status(400).json({ error: 'documentId and amount are required' });
    }

    const result = await registerPayment(db, {
      documentId,
      amount,
      paymentMethod,
      bankAccount,
      structuredReference,
      bankStatementDate,
      bankStatementRef,
      notes,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Error registering payment:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /payments/find-matches
 * Vind mogelijke document matches voor een betaling
 */
router.post('/find-matches', authRequired, async (req, res) => {
  const userId = req.user.id;
  const { db } = req.app.locals;
  
  try {
    const {
      amount,
      structuredReference = null,
      counterpartyName = null,
      transactionDate = null,
    } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'amount is required' });
    }

    const matches = findPaymentMatches(db, {
      amount,
      structuredReference,
      counterpartyName,
      transactionDate,
      userId,
    });

    res.json({ matches });
  } catch (error) {
    console.error('Error finding payment matches:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /payments/overview
 * Haal payment overview op (totals, overdue, recent)
 */
router.get('/overview', authRequired, async (req, res) => {
  const userId = req.user.id;
  const { db } = req.app.locals;
  
  try {
    const overview = getPaymentOverview(db, userId);
    res.json(overview);
  } catch (error) {
    console.error('Error getting payment overview:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /payments/document/:documentId
 * Haal alle betalingen voor een document
 */
router.get('/document/:documentId', authRequired, async (req, res) => {
  const userId = req.user.id;
  const { documentId } = req.params;
  const { db } = req.app.locals;
  
  try {
    const payments = db.prepare(`
      SELECT p.*, pm.match_type, pm.match_confidence
      FROM payments p
      LEFT JOIN payment_matches pm ON p.id = pm.payment_id
      JOIN documents d ON p.document_id = d.id
      WHERE p.document_id = ? AND d.user_id = ?
      ORDER BY p.paid_at DESC
    `).all(documentId, userId);

    const document = db.prepare(`
      SELECT total_incl_vat, payment_status, structured_reference
      FROM documents
      WHERE id = ? AND user_id = ?
    `).get(documentId, userId);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    res.json({
      payments,
      document,
      totalAmount: parseFloat(document.total_incl_vat),
      totalPaid,
      amountRemaining: parseFloat(document.total_incl_vat) - totalPaid,
    });
  } catch (error) {
    console.error('Error getting document payments:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /payments/reminder/:documentId
 * Verzend betalingsherinnering
 */
router.post('/reminder/:documentId', authRequired, async (req, res) => {
  const userId = req.user.id;
  const { documentId } = req.params;
  const { db } = req.app.locals;
  
  try {
    const updated = updatePaymentReminder(db, documentId, userId);
    
    if (!updated) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // TODO: Trigger email automation
    // await sendPaymentReminderEmail(documentId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
