/**
 * Migrate database to add Peppol fields
 */

import { db } from './src/db-sqlite.js';

console.log('Running migrations...\n');

try {
  // Add company_settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS company_settings (
      user_id TEXT PRIMARY KEY,
      name TEXT,
      vat TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      country TEXT DEFAULT 'BE',
      kvk TEXT,
      iban TEXT,
      bic TEXT,
      automations_enabled INTEGER DEFAULT 1,
      default_follow_up_days TEXT DEFAULT '5,10,15',
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  console.log('✅ company_settings table created');

  // Add Peppol fields to customers (if not exists)
  try {
    db.exec('ALTER TABLE customers ADD COLUMN peppol_id TEXT');
    console.log('✅ Added peppol_id to customers');
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
    console.log('   peppol_id already exists');
  }

  try {
    db.exec('ALTER TABLE customers ADD COLUMN peppol_scheme TEXT DEFAULT "0208"');
    console.log('✅ Added peppol_scheme to customers');
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
    console.log('   peppol_scheme already exists');
  }

  try {
    db.exec('ALTER TABLE customers ADD COLUMN peppol_enabled INTEGER DEFAULT 0');
    console.log('✅ Added peppol_enabled to customers');
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
    console.log('   peppol_enabled already exists');
  }

  // Add Peppol fields to documents (if not exists)
  try {
    db.exec('ALTER TABLE documents ADD COLUMN peppol_id TEXT');
    console.log('✅ Added peppol_id to documents');
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
    console.log('   peppol_id already exists');
  }

  try {
    db.exec('ALTER TABLE documents ADD COLUMN peppol_status TEXT');
    console.log('✅ Added peppol_status to documents');
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
    console.log('   peppol_status already exists');
  }

  try {
    db.exec('ALTER TABLE documents ADD COLUMN peppol_sent_at TEXT');
    console.log('✅ Added peppol_sent_at to documents');
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
    console.log('   peppol_sent_at already exists');
  }

  try {
    db.exec('ALTER TABLE documents ADD COLUMN peppol_response TEXT');
    console.log('✅ Added peppol_response to documents');
  } catch (e) {
    if (!e.message.includes('duplicate column')) throw e;
    console.log('   peppol_response already exists');
  }

  console.log('\n✅ All migrations completed successfully!\n');
} catch (error) {
  console.error('\n❌ Migration failed:', error);
  throw error;
} finally {
  db.close();
}
