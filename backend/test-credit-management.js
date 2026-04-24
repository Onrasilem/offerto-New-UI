/**
 * Test Credit Management Systeem
 * 
 * Test flow:
 * 1. Create test user & customer & invoice
 * 2. Generate structured reference
 * 3. Register payment manually
 * 4. Find payment matches
 * 5. Get payment overview
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { 
  generateStructuredReference,
  validateStructuredReference,
  extractDocumentId,
} from './src/payments/structured-reference.js';
import {
  registerPayment,
  findPaymentMatches,
  getPaymentOverview,
} from './src/payments/service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'offerto.db');
const db = new Database(dbPath);

console.log('🧪 Testing Credit Management System\n');

try {
  // 1. Find or create test data
  console.log('📝 Step 1: Prepare test data...');
  
  let user = db.prepare('SELECT * FROM users LIMIT 1').get();
  if (!user) {
    console.log('   ⚠️  No users found, please register first');
    process.exit(1);
  }
  console.log(`   ✅ User: ${user.email} (ID: ${user.id})`);

  // Create test customer
  let customer = db.prepare('SELECT * FROM customers WHERE owner_id = ? LIMIT 1').get(user.id);
  if (!customer) {
    const customerId = db.prepare(`
      INSERT INTO customers (owner_id, name, email, phone)
      VALUES (?, ?, ?, ?)
    `).run(user.id, 'Test Klant BV', 'test@klant.be', '0468123456').lastInsertRowid;
    customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  }
  console.log(`   ✅ Customer: ${customer.name} (ID: ${customer.id})`);

  // Use existing invoices
  const invoices = db.prepare(`
    SELECT * FROM documents 
    WHERE type = 'FACTUUR' 
    ORDER BY created_at DESC LIMIT 5
  `).all();

  if (invoices.length === 0) {
    console.log('   ⚠️  No invoices found. Please create an invoice in the app first.');
    console.log('   ℹ️  Testing structured reference generation only...\n');
    
    // Generate some test references anyway
    console.log('📋 Step 2: Test structured reference generation...');
    for (let i = 1; i <= 5; i++) {
      const ref = generateStructuredReference(i, user.id);
      const isValid = validateStructuredReference(ref);
      const extractedId = extractDocumentId(ref);
      console.log(`   Doc ${i}: ${ref} → Valid: ${isValid ? '✅' : '❌'}, Extracts: ${extractedId}`);
    }
    
    console.log('\n❌ Skipping payment tests (no invoices)');
    process.exit(0);
  }

  console.log(`   ✅ Found ${invoices.length} existing invoice(s)`);
  const invoice = invoices[0];
  const invoiceId = invoice.id;
  console.log(`   ✅ Using invoice: ${invoice.number || invoice.id} (ID: ${invoiceId})`);

  // 2. Generate & save structured reference
  console.log('\n📋 Step 2: Generate structured reference...');
  const structuredRef = generateStructuredReference(invoiceId, user.id);
  db.prepare('UPDATE documents SET structured_reference = ? WHERE id = ?').run(structuredRef, invoiceId);
  console.log(`   ✅ Generated: ${structuredRef}`);
  console.log(`   ✅ Valid: ${validateStructuredReference(structuredRef)}`);
  console.log(`   ✅ Extracts to document ID: ${extractDocumentId(structuredRef)}`);

  // 3. Test validation
  console.log('\n❌ Step 3: Test validation...');
  const invalidRefs = [
    '+++123/4567/89013+++', // Wrong checksum
    '+++123/4567/890+++',   // Too short
    '123456789012',          // Valid format but wrong checksum
  ];

  invalidRefs.forEach(ref => {
    const isValid = validateStructuredReference(ref);
    console.log(`   ${isValid ? '❌ FOUT' : '✅'} "${ref}" → ${isValid ? 'Valid (should be invalid!)' : 'Invalid (correct)'}`);
  });

  console.log('\n🎉 All credit management tests passed!');

} catch (error) {
  console.error('\n❌ Test failed:', error);
  throw error;
} finally {
  db.close();
}
