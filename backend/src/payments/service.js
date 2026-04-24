/**
 * Credit Management & Payment Reconciliation Service
 */

import { generateStructuredReference, validateStructuredReference, extractDocumentId } from './structured-reference.js';

/**
 * Registreer een betaling (manueel of via webhook)
 */
export async function registerPayment(db, {
  documentId,
  amount,
  paymentMethod = 'bank_transfer',
  bankAccount = null,
  structuredReference = null,
  bankStatementDate = null,
  bankStatementRef = null,
  providerRef = null,
  notes = null,
  userId = null,
}) {
  // Haal document op
  const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!document) {
    throw new Error('Document not found');
  }

  // Valideer structured reference indien aanwezig
  if (structuredReference && !validateStructuredReference(structuredReference)) {
    throw new Error('Invalid structured reference');
  }

  // Bepaal reconciliation status
  let reconciliationStatus = 'pending';
  let matchedDocId = null;

  if (structuredReference) {
    const extractedDocId = extractDocumentId(structuredReference);
    if (extractedDocId === documentId) {
      reconciliationStatus = 'matched';
      matchedDocId = documentId;
    }
  }

  // Maak payment record
  const now = new Date().toISOString();
  const paymentId = db.prepare(`
    INSERT INTO payments (
      document_id, amount, currency, payment_method, 
      bank_account, bank_statement_date, bank_statement_ref,
      provider_ref, reconciliation_status, reconciled_at, 
      reconciled_by, notes, paid_at, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    documentId,
    amount,
    document.currency || 'EUR',
    paymentMethod,
    bankAccount,
    bankStatementDate,
    bankStatementRef,
    providerRef,
    reconciliationStatus,
    reconciliationStatus === 'matched' ? now : null,
    reconciliationStatus === 'matched' ? userId : null,
    notes,
    bankStatementDate || now,
    'paid',
    now
  ).lastInsertRowid;

  // Update document payment status
  const totalPaid = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM payments 
    WHERE document_id = ? AND status = 'paid'
  `).get(documentId).total;

  const totalAmount = parseFloat(document.total_incl_vat);
  let paymentStatus = 'unpaid';
  
  if (totalPaid >= totalAmount) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partial';
  } else if (document.payment_due_date && new Date(document.payment_due_date) < new Date()) {
    paymentStatus = 'overdue';
  }

  db.prepare(`
    UPDATE documents 
    SET payment_status = ?
    WHERE id = ?
  `).run(paymentStatus, documentId);

  // Create payment match record
  if (matchedDocId) {
    db.prepare(`
      INSERT INTO payment_matches (
        payment_id, document_id, match_type, match_confidence, amount_matched
      ) VALUES (?, ?, ?, ?, ?)
    `).run(paymentId, matchedDocId, 'exact', 1.0, amount);
  }

  return {
    paymentId,
    reconciliationStatus,
    paymentStatus,
    totalPaid,
    totalAmount,
  };
}

/**
 * Vind mogelijke matches voor een betaling
 */
export function findPaymentMatches(db, {
  amount,
  structuredReference = null,
  counterpartyName = null,
  transactionDate = null,
  userId,
}) {
  const matches = [];

  // 1. Exact match op structured reference
  if (structuredReference && validateStructuredReference(structuredReference)) {
    // Normalize de reference
    const normalizedRef = structuredReference.replace(/\D/g, '');
    
    const doc = db.prepare(`
      SELECT d.*, c.name as customer_name, c.email
      FROM documents d
      LEFT JOIN customers c ON d.customer_id = c.id
      WHERE REPLACE(REPLACE(REPLACE(d.structured_reference, '+', ''), '/', ''), ' ', '') = ?
        AND d.type = 'FACTUUR'
        AND d.payment_status != 'paid'
      LIMIT 1
    `).get(normalizedRef);

    if (doc) {
      // Parse totals_json for amount if needed
      let docAmount = 0;
      if (doc.totals_json) {
        try {
          const totals = typeof doc.totals_json === 'string' ? JSON.parse(doc.totals_json) : doc.totals_json;
          docAmount = parseFloat(totals.inc || totals.total_incl_vat || 0);
        } catch (e) {
          console.error('Failed to parse totals_json:', e);
        }
      }
      
      matches.push({
        documentId: doc.id,
        documentNumber: doc.number || doc.id,
        customerName: doc.customer_name,
        amount: docAmount,
        amountDiff: Math.abs(docAmount - amount),
        matchType: 'exact',
        confidence: 1.0,
        paymentStatus: doc.payment_status,
      });
    }
  }

  // 2. Fuzzy match op bedrag (binnen 5 euro verschil)
  if (matches.length === 0) {
    const allDocs = db.prepare(`
      SELECT d.*, c.name as customer_name, c.email
      FROM documents d
      LEFT JOIN customers c ON d.customer_id = c.id
      WHERE d.type = 'FACTUUR'
        AND d.payment_status != 'paid'
      LIMIT 50
    `).all();

    for (const doc of allDocs) {
      // Parse totals_json
      let docAmount = 0;
      if (doc.totals_json) {
        try {
          const totals = typeof doc.totals_json === 'string' ? JSON.parse(doc.totals_json) : doc.totals_json;
          docAmount = parseFloat(totals.inc || totals.total_incl_vat || 0);
        } catch (e) {
          continue;
        }
      }
      
      const amountDiff = Math.abs(docAmount - amount);
      if (amountDiff <= 5.0) {
        const confidence = 1.0 - (amountDiff / Math.max(amount, 1));
        matches.push({
          documentId: doc.id,
          documentNumber: doc.number || doc.id,
          customerName: doc.customer_name,
          amount: docAmount,
          amountDiff,
          matchType: 'amount',
          confidence,
          paymentStatus: doc.payment_status,
        });
      }
    }
    
    // Sort by best match
    matches.sort((a, b) => b.confidence - a.confidence);
    matches = matches.slice(0, 10);
  }

  // 3. Match op klantnaam (indien beschikbaar)
  if (counterpartyName && matches.length === 0) {
    const nameMatches = db.prepare(`
      SELECT d.*, c.name as customer_name, c.email,
             ABS(d.total_incl_vat - ?) as amount_diff
      FROM documents d
      LEFT JOIN customers c ON d.customer_id = c.id
      WHERE d.user_id = ? 
        AND d.type = 'FACTUUR'
        AND d.payment_status != 'paid'
        AND LOWER(c.name) LIKE LOWER(?)
      ORDER BY amount_diff ASC
      LIMIT 10
    `).all(amount, userId, `%${counterpartyName}%`);

    for (const doc of nameMatches) {
      matches.push({
        documentId: doc.id,
        documentNumber: doc.number,
        customerName: doc.customer_name,
        amount: parseFloat(doc.total_incl_vat),
        amountDiff: Math.abs(parseFloat(doc.total_incl_vat) - amount),
        matchType: 'name',
        confidence: 0.7,
        paymentStatus: doc.payment_status,
      });
    }
  }

  return matches;
}

/**
 * Haal payment overzicht op
 */
export function getPaymentOverview(db, userId) {
  // Totalen
  const totals = db.prepare(`
    SELECT 
      COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_count,
      COUNT(CASE WHEN payment_status = 'overdue' THEN 1 END) as overdue_count,
      COUNT(CASE WHEN payment_status = 'partial' THEN 1 END) as partial_count,
      COALESCE(SUM(CASE WHEN payment_status IN ('unpaid', 'overdue', 'partial') THEN total_incl_vat END), 0) as outstanding_amount,
      COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_incl_vat END), 0) as paid_amount
    FROM documents
    WHERE user_id = ? AND type = 'FACTUUR'
  `).get(userId);

  // Overdue facturen
  const overdueInvoices = db.prepare(`
    SELECT d.*, c.name as customer_name,
           julianday('now') - julianday(d.payment_due_date) as days_overdue
    FROM documents d
    LEFT JOIN customers c ON d.customer_id = c.id
    WHERE d.user_id = ? 
      AND d.type = 'FACTUUR'
      AND d.payment_status IN ('unpaid', 'overdue', 'partial')
      AND d.payment_due_date < date('now')
    ORDER BY d.payment_due_date ASC
    LIMIT 20
  `).all(userId);

  // Recent payments
  const recentPayments = db.prepare(`
    SELECT p.*, d.number as document_number, c.name as customer_name
    FROM payments p
    JOIN documents d ON p.document_id = d.id
    LEFT JOIN customers c ON d.customer_id = c.id
    WHERE d.user_id = ?
    ORDER BY p.paid_at DESC
    LIMIT 20
  `).all(userId);

  return {
    totals,
    overdueInvoices,
    recentPayments,
  };
}

/**
 * Update payment due date en reminder tracking
 */
export function updatePaymentReminder(db, documentId, userId) {
  const now = new Date().toISOString();
  
  const result = db.prepare(`
    UPDATE documents 
    SET payment_reminder_sent_at = ?,
        payment_reminder_count = payment_reminder_count + 1
    WHERE id = ? AND user_id = ?
  `).run(now, documentId, userId);

  return result.changes > 0;
}

/**
 * Bulk reconciliatie voor bank statement
 */
export async function reconcileBankStatement(db, statementId, userId) {
  const transactions = db.prepare(`
    SELECT * FROM bank_transactions 
    WHERE statement_id = ? AND is_reconciled = 0
  `).all(statementId);

  const results = {
    matched: 0,
    unmatched: 0,
    errors: 0,
  };

  for (const transaction of transactions) {
    try {
      const matches = findPaymentMatches(db, {
        amount: Math.abs(transaction.amount),
        structuredReference: transaction.structured_reference,
        counterpartyName: transaction.counterparty_name,
        transactionDate: transaction.transaction_date,
        userId,
      });

      if (matches.length > 0 && matches[0].confidence >= 0.9) {
        // Auto-match met hoge confidence
        const match = matches[0];
        
        await registerPayment(db, {
          documentId: match.documentId,
          amount: Math.abs(transaction.amount),
          paymentMethod: 'bank_transfer',
          bankAccount: transaction.counterparty_account,
          structuredReference: transaction.structured_reference,
          bankStatementDate: transaction.transaction_date,
          bankStatementRef: transaction.id.toString(),
          notes: `Auto-matched from bank statement (${match.matchType}, confidence: ${match.confidence})`,
          userId,
        });

        db.prepare(`
          UPDATE bank_transactions 
          SET is_reconciled = 1, matched_document_id = ?
          WHERE id = ?
        `).run(match.documentId, transaction.id);

        results.matched++;
      } else {
        results.unmatched++;
      }
    } catch (error) {
      console.error(`Error reconciling transaction ${transaction.id}:`, error);
      results.errors++;
    }
  }

  return results;
}

/**
 * ============================================
 * MOLLIE ONLINE PAYMENTS
 * ============================================
 */

import { createMollieClient } from '@mollie/api-client';
import { randomUUID } from 'crypto';
import { loadConfig } from '../config.js';

const config = loadConfig();

// Initialize Mollie client
const mollieClient = config.MOLLIE_API_KEY 
  ? createMollieClient({ apiKey: config.MOLLIE_API_KEY })
  : null;

/**
 * Create a Mollie payment link for a document
 */
export async function createMolliePayment(db, documentId, userId) {
  if (!mollieClient) {
    throw new Error('Mollie API key not configured. Add MOLLIE_API_KEY to .env');
  }

  // Get document
  const document = db.prepare(`
    SELECT d.*, c.name as customer_name, c.email as customer_email
    FROM documents d
    LEFT JOIN customers c ON d.customer_id = c.id
    WHERE d.id = ? AND d.user_id = ?
  `).get(documentId, userId);

  if (!document) {
    throw new Error('Document not found');
  }

  // Calculate total from document_lines
  const lines = db.prepare(`
    SELECT * FROM document_lines WHERE document_id = ?
  `).all(documentId);

  let totalAmount = 0;
  lines.forEach(line => {
    const qty = parseFloat(line.aantal) || 0;
    const price = parseFloat(line.eenheidsprijs) || 0;
    const vatRate = parseFloat(line.btwPerc) || 0;
    const subtotal = qty * price;
    const inc = subtotal * (1 + vatRate / 100);
    totalAmount += inc;
  });

  // Round to 2 decimals
  totalAmount = Math.round(totalAmount * 100) / 100;

  if (totalAmount <= 0) {
    throw new Error('Document total must be greater than 0');
  }

  // Check if active payment already exists
  const existingPayment = db.prepare(`
    SELECT * FROM payments 
    WHERE document_id = ? AND status IN ('pending', 'paid', 'open')
    ORDER BY created_at DESC
    LIMIT 1
  `).get(documentId);

  if (existingPayment && existingPayment.status === 'paid') {
    return {
      paymentId: existingPayment.id,
      checkoutUrl: existingPayment.mollie_checkout_url,
      status: 'paid',
      existing: true,
      message: 'Payment already completed',
    };
  }

  if (existingPayment && existingPayment.status === 'pending') {
    // Return existing pending payment
    return {
      paymentId: existingPayment.id,
      checkoutUrl: existingPayment.mollie_checkout_url,
      status: 'pending',
      existing: true,
      message: 'Active payment link exists',
    };
  }

  // Create payment in Mollie
  const description = `${document.type} ${document.number || documentId.slice(0, 8)}`;
  const redirectUrl = `${config.FRONTEND_URL || 'http://localhost:8081'}/payment-success?doc=${documentId}`;
  const webhookUrl = `${config.API_URL || 'http://localhost:4000'}/payments/webhook`;

  const molliePayment = await mollieClient.payments.create({
    amount: {
      currency: 'EUR',
      value: totalAmount.toFixed(2),
    },
    description,
    redirectUrl,
    webhookUrl,
    metadata: {
      documentId,
      userId,
      documentType: document.type,
      documentNumber: document.number,
    },
  });

  // Store payment in database
  const paymentId = randomUUID();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO payments (
      id, document_id, mollie_payment_id, mollie_checkout_url,
      amount, currency, description, status, metadata, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    paymentId,
    documentId,
    molliePayment.id,
    molliePayment._links.checkout.href,
    totalAmount,
    'EUR',
    description,
    molliePayment.status,
    JSON.stringify({ molliePayment }),
    now,
    now
  );

  // Log event
  db.prepare(`
    INSERT INTO payment_events (id, payment_id, event_type, status, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    paymentId,
    'created',
    molliePayment.status,
    JSON.stringify({ molliePaymentId: molliePayment.id }),
    now
  );

  console.log(`✅ Created Mollie payment: ${molliePayment.id} for document ${documentId}`);

  return {
    paymentId,
    molliePaymentId: molliePayment.id,
    checkoutUrl: molliePayment._links.checkout.href,
    status: molliePayment.status,
    amount: totalAmount,
    existing: false,
  };
}

/**
 * Handle Mollie webhook
 */
export async function handleMollieWebhook(db, molliePaymentId) {
  if (!mollieClient) {
    throw new Error('Mollie API key not configured');
  }

  // Get payment from Mollie
  const molliePayment = await mollieClient.payments.get(molliePaymentId);

  // Find our payment record
  const payment = db.prepare(`
    SELECT * FROM payments WHERE mollie_payment_id = ?
  `).get(molliePaymentId);

  if (!payment) {
    console.warn(`⚠️  Payment not found in database: ${molliePaymentId}`);
    return { success: false, message: 'Payment not found' };
  }

  const oldStatus = payment.status;
  const newStatus = molliePayment.status;
  const now = new Date().toISOString();

  // Update payment status
  const updateData = {
    status: newStatus,
    updated_at: now,
    paid_at: newStatus === 'paid' ? (molliePayment.paidAt || now) : payment.paid_at,
    expired_at: newStatus === 'expired' ? now : payment.expired_at,
    failed_at: newStatus === 'failed' ? now : payment.failed_at,
    canceled_at: newStatus === 'canceled' ? now : payment.canceled_at,
  };

  db.prepare(`
    UPDATE payments
    SET status = ?, updated_at = ?, paid_at = ?, expired_at = ?, failed_at = ?, canceled_at = ?, metadata = ?
    WHERE id = ?
  `).run(
    updateData.status,
    updateData.updated_at,
    updateData.paid_at,
    updateData.expired_at,
    updateData.failed_at,
    updateData.canceled_at,
    JSON.stringify({ molliePayment }),
    payment.id
  );

  // Update document payment status
  if (newStatus === 'paid') {
    db.prepare(`
      UPDATE documents
      SET payment_status = 'paid', status = 'Betaald'
      WHERE id = ?
    `).run(payment.document_id);
  } else if (newStatus === 'failed' || newStatus === 'expired' || newStatus === 'canceled') {
    db.prepare(`
      UPDATE documents
      SET payment_status = 'unpaid'
      WHERE id = ?
    `).run(payment.document_id);
  }

  // Log event
  db.prepare(`
    INSERT INTO payment_events (id, payment_id, event_type, status, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    payment.id,
    'webhook_received',
    newStatus,
    JSON.stringify({ oldStatus, newStatus, mollieStatus: molliePayment.status }),
    now
  );

  console.log(`✅ Payment webhook processed: ${molliePaymentId} | ${oldStatus} → ${newStatus}`);

  return {
    success: true,
    paymentId: payment.id,
    documentId: payment.document_id,
    oldStatus,
    newStatus,
  };
}

/**
 * Get payment status
 */
export async function getMolliePaymentStatus(db, paymentId) {
  const payment = db.prepare(`
    SELECT p.*, d.number as document_number, d.type as document_type
    FROM payments p
    LEFT JOIN documents d ON p.document_id = d.id
    WHERE p.id = ?
  `).get(paymentId);

  if (!payment) {
    throw new Error('Payment not found');
  }

  // If we have mollie client, fetch latest status
  if (mollieClient && payment.mollie_payment_id) {
    try {
      const molliePayment = await mollieClient.payments.get(payment.mollie_payment_id);
      
      // Update if status changed
      if (molliePayment.status !== payment.status) {
        const now = new Date().toISOString();
        db.prepare(`
          UPDATE payments SET status = ?, updated_at = ? WHERE id = ?
        `).run(molliePayment.status, now, paymentId);
        
        payment.status = molliePayment.status;
      }
    } catch (error) {
      console.warn(`⚠️  Failed to fetch Mollie payment status: ${error.message}`);
    }
  }

  return {
    id: payment.id,
    documentId: payment.document_id,
    documentNumber: payment.document_number,
    documentType: payment.document_type,
    molliePaymentId: payment.mollie_payment_id,
    checkoutUrl: payment.mollie_checkout_url,
    amount: payment.amount,
    currency: payment.currency,
    description: payment.description,
    status: payment.status,
    createdAt: payment.created_at,
    paidAt: payment.paid_at,
    expiredAt: payment.expired_at,
    failedAt: payment.failed_at,
    canceledAt: payment.canceled_at,
  };
}

/**
 * Get all payments for a document
 */
export function getDocumentMolliePayments(db, documentId) {
  const payments = db.prepare(`
    SELECT * FROM payments WHERE document_id = ? ORDER BY created_at DESC
  `).all(documentId);

  return payments;
}
