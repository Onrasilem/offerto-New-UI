/**
 * Mollie Payments Migration
 * Adds payments table for tracking Mollie payment links and status
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'offerto.db');
const db = new Database(dbPath);

console.log('🔄 Starting Mollie payments migration...\n');

try {
  // Drop existing payments table if it exists (it might be old structure)
  db.exec(`DROP TABLE IF EXISTS payments`);
  console.log('ℹ️  Dropped existing payments table if present');

  // Create new payments table
  db.exec(`
    CREATE TABLE payments (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      mollie_payment_id TEXT UNIQUE,
      mollie_checkout_url TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'EUR',
      description TEXT,
      status TEXT DEFAULT 'pending',
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      paid_at TEXT,
      expired_at TEXT,
      failed_at TEXT,
      canceled_at TEXT
    )
  `);
  console.log('✅ Created payments table');

  // Create indices for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_document_id ON payments(document_id);
    CREATE INDEX IF NOT EXISTS idx_payments_mollie_id ON payments(mollie_payment_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  `);
  console.log('✅ Created indices on payments table');

  // Update documents table to track payment status
  const tableInfo = db.prepare("PRAGMA table_info(documents)").all();
  const hasPaymentStatus = tableInfo.some(col => col.name === 'payment_status');
  
  if (!hasPaymentStatus) {
    db.exec(`
      ALTER TABLE documents ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
    `);
    console.log('✅ Added payment_status column to documents table');
  } else {
    console.log('ℹ️  payment_status column already exists in documents');
  }

  // Create payment_events table for audit trail
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      status TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Created payment_events table for audit trail');

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON payment_events(payment_id);
    CREATE INDEX IF NOT EXISTS idx_payment_events_type ON payment_events(event_type);
  `);
  console.log('✅ Created indices on payment_events table');

  console.log('\n✅ Mollie payments migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Get Mollie API key from https://www.mollie.com/dashboard/developers/api-keys');
  console.log('2. Add MOLLIE_API_KEY=test_... to backend/.env');
  console.log('3. Configure webhook URL in Mollie dashboard');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
