/**
 * Database migratie: Credit Management
 * 
 * Voegt velden toe voor:
 * - Gestructureerde mededelingen (Belgisch systeem)
 * - Payment reconciliatie
 * - Bank statement tracking
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'offerto.db');
const db = new Database(dbPath);

console.log('🔄 Starting credit management migration...\n');

try {
  db.exec('BEGIN TRANSACTION');

  // 1. Update documents table met structured reference + payment tracking
  console.log('📝 Step 1: Add credit management fields to documents...');
  
  const documentsColumns = `
    ALTER TABLE documents ADD COLUMN structured_reference TEXT;
    ALTER TABLE documents ADD COLUMN payment_status TEXT DEFAULT 'unpaid'; -- unpaid | partial | paid | overdue
    ALTER TABLE documents ADD COLUMN payment_due_date TEXT; -- Vervaldatum
    ALTER TABLE documents ADD COLUMN payment_reminder_sent_at TEXT; -- Laatste herinnering
    ALTER TABLE documents ADD COLUMN payment_reminder_count INTEGER DEFAULT 0;
  `;

  try {
    db.exec(documentsColumns);
    console.log('   ✅ Documents table updated');
  } catch (err) {
    if (err.message.includes('duplicate column')) {
      console.log('   ⚠️  Columns already exist, skipping');
    } else {
      throw err;
    }
  }

  // 2. Update payments table met reconciliation fields
  console.log('\n📝 Step 2: Add reconciliation fields to payments...');
  
  const paymentsColumns = `
    ALTER TABLE payments ADD COLUMN payment_method TEXT; -- bank_transfer | mollie | stripe | cash
    ALTER TABLE payments ADD COLUMN bank_account TEXT; -- IBAN van betaler
    ALTER TABLE payments ADD COLUMN bank_statement_date TEXT; -- Datum op bankafschrift
    ALTER TABLE payments ADD COLUMN bank_statement_ref TEXT; -- Referentie van bank
    ALTER TABLE payments ADD COLUMN reconciliation_status TEXT DEFAULT 'pending'; -- pending | matched | manual | unmatched
    ALTER TABLE payments ADD COLUMN reconciled_by INTEGER; -- User ID die match deed
    ALTER TABLE payments ADD COLUMN reconciled_at TEXT;
    ALTER TABLE payments ADD COLUMN notes TEXT; -- Notities bij betaling
  `;

  try {
    db.exec(paymentsColumns);
    console.log('   ✅ Payments table updated');
  } catch (err) {
    if (err.message.includes('duplicate column')) {
      console.log('   ⚠️  Columns already exist, skipping');
    } else {
      throw err;
    }
  }

  // 3. Create payment_matches table voor automatische reconciliatie
  console.log('\n📝 Step 3: Create payment_matches table...');
  
  const paymentMatchesTable = `
    CREATE TABLE IF NOT EXISTS payment_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER REFERENCES payments(id) ON DELETE CASCADE,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      match_type TEXT, -- exact | partial | fuzzy | manual
      match_confidence REAL, -- 0.0 - 1.0
      amount_matched REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `;

  db.exec(paymentMatchesTable);
  console.log('   ✅ Payment matches table created');

  // 4. Create bank_statements table voor CODA files
  console.log('\n📝 Step 4: Create bank_statements table...');
  
  const bankStatementsTable = `
    CREATE TABLE IF NOT EXISTS bank_statements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      bank_account TEXT NOT NULL,
      statement_date TEXT,
      file_name TEXT,
      file_type TEXT, -- coda | csv | ofx
      total_credits REAL DEFAULT 0,
      total_debits REAL DEFAULT 0,
      transaction_count INTEGER DEFAULT 0,
      processed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `;

  db.exec(bankStatementsTable);
  console.log('   ✅ Bank statements table created');

  // 5. Create bank_transactions table voor parsed transactions
  console.log('\n📝 Step 5: Create bank_transactions table...');
  
  const bankTransactionsTable = `
    CREATE TABLE IF NOT EXISTS bank_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      statement_id INTEGER REFERENCES bank_statements(id) ON DELETE CASCADE,
      transaction_date TEXT,
      value_date TEXT,
      amount REAL,
      currency TEXT DEFAULT 'EUR',
      counterparty_name TEXT,
      counterparty_account TEXT,
      structured_reference TEXT,
      unstructured_reference TEXT,
      transaction_type TEXT, -- credit | debit
      is_reconciled INTEGER DEFAULT 0,
      matched_document_id INTEGER REFERENCES documents(id),
      created_at TEXT DEFAULT (datetime('now'))
    );
  `;

  db.exec(bankTransactionsTable);
  console.log('   ✅ Bank transactions table created');

  // 6. Create indices voor performance
  console.log('\n📝 Step 6: Create indices...');
  
  const indices = `
    CREATE INDEX IF NOT EXISTS idx_documents_structured_ref ON documents(structured_reference);
    CREATE INDEX IF NOT EXISTS idx_documents_payment_status ON documents(payment_status);
    CREATE INDEX IF NOT EXISTS idx_payments_reconciliation ON payments(reconciliation_status);
    CREATE INDEX IF NOT EXISTS idx_bank_transactions_structured_ref ON bank_transactions(structured_reference);
    CREATE INDEX IF NOT EXISTS idx_bank_transactions_reconciled ON bank_transactions(is_reconciled);
  `;

  db.exec(indices);
  console.log('   ✅ Indices created');

  // 7. Generate structured references voor bestaande facturen
  console.log('\n📝 Step 7: Generate structured references for existing invoices...');
  
  const existingInvoices = db.prepare(`
    SELECT id, user_id FROM documents 
    WHERE type = 'FACTUUR' AND structured_reference IS NULL
  `).all();

  if (existingInvoices.length > 0) {
    // Import structured reference generator
    const { generateStructuredReference } = await import('./src/payments/structured-reference.js');
    
    const updateStmt = db.prepare(`
      UPDATE documents 
      SET structured_reference = ?, payment_status = 'unpaid'
      WHERE id = ?
    `);

    for (const invoice of existingInvoices) {
      const reference = generateStructuredReference(invoice.id, invoice.user_id || 0);
      updateStmt.run(reference, invoice.id);
    }

    console.log(`   ✅ Generated ${existingInvoices.length} structured references`);
  } else {
    console.log('   ℹ️  No existing invoices to update');
  }

  db.exec('COMMIT');
  console.log('\n✅ Credit management migration completed successfully!');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('\n❌ Migration failed:', error.message);
  throw error;
} finally {
  db.close();
}
