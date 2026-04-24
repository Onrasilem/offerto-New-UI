/**
 * Test Peppol Integration
 * 
 * Tests UBL export, Storecove send, and status tracking
 */

import { pool, query } from './src/db.js';
import { generateUBL } from './src/peppol/ubl.js';
import { sendViaPeppol, checkPeppolStatus } from './src/peppol/storecove.js';

async function testPeppol() {
  console.log('\n🧪 Testing Peppol Integration...\n');

  try {
    // 1. Create test user
    let userId;
    const existingUser = await query('SELECT id FROM users WHERE email = $1', ['test@peppol.com']);
    if (existingUser.rows && existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log('✅ Using existing test user:', userId);
    } else {
      const userResult = await query(
        `INSERT INTO users (email, password_hash, created_at) VALUES ($1, $2, $3)`,
        ['test@peppol.com', 'hash', new Date().toISOString()]
      );
      userId = userResult.lastID;
      console.log('✅ Test user created:', userId);
    }

    // 2. Create company settings with Peppol info
    const existingCompany = await query('SELECT user_id FROM company_settings WHERE user_id = $1', [userId]);
    if (!existingCompany.rows || existingCompany.rows.length === 0) {
      await query(
        `INSERT INTO company_settings (user_id, name, vat, iban, bic, address, city, postal_code, country, kvk)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [userId, 'Test BV', 'BE0123456789', 'BE68539007547034', 'GEBABEBB', 'Teststraat 1', 'Brussel', '1000', 'BE', '0123456789']
      );
    }
    console.log('✅ Company settings ready with VAT:', 'BE0123456789');

    // 3. Create test customer with Peppol ID
    await query(
      `INSERT INTO customers (owner_id, name, email, vat, address, city, postal_code, country, peppol_id, peppol_scheme, peppol_enabled, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [userId, 'Peppol Customer NV', 'customer@peppol.com', 'BE9876543210', 'Klantstraat 10', 'Antwerpen', '2000', 'BE', 'BE9876543210', '0208', 1, new Date().toISOString()]
    );
    const customerLookup = await query('SELECT id FROM customers WHERE email = $1', ['customer@peppol.com']);
    const customerId = customerLookup.rows[0]?.id;
    console.log('✅ Customer created with Peppol ID: BE9876543210, ID:', customerId);

    // 4. Create test invoice
    await query(
      `INSERT INTO documents (user_id, customer_id, type, number, date, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, customerId, 'FACTUUR', 'FAC-2025-001', new Date().toISOString().split('T')[0], 'Verzonden', new Date().toISOString()]
    );
    
    // Get the document ID
    const docLookup = await query('SELECT id FROM documents WHERE number = $1', ['FAC-2025-001']);
    const docId = docLookup.rows[0]?.id;
    console.log('✅ Invoice created: FAC-2025-001, ID:', docId);

    // 5. Add invoice lines
    await query(
      `INSERT INTO document_lines (document_id, description, quantity, unit_price, vat_rate, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [docId, 'Consultancy services', 1, 100.00, 21, new Date().toISOString()]
    );
    console.log('✅ Invoice line added');

    // 6. Generate UBL XML
    const docData = await query(
      `SELECT d.*, c.name as customer_name, c.email as customer_email, c.vat as customer_vat,
              c.address as customer_address, c.city as customer_city, c.postal_code as customer_postal_code,
              c.country as customer_country
       FROM documents d
       LEFT JOIN customers c ON d.customer_id = c.id
       WHERE d.id = $1`,
      [docId]
    );

    const linesData = await query('SELECT * FROM document_lines WHERE document_id = $1', [docId]);
    const companyData = await query('SELECT * FROM company_settings WHERE user_id = $1', [userId]);

    const doc = docData.rows?.[0] || docData[0];
    if (!doc) {
      throw new Error('Document not found - docData: ' + JSON.stringify(docData));
    }

    const ublXml = generateUBL({
      document: doc,
      lines: linesData.rows || [],
      customer: {
        name: doc.customer_name || 'Unknown',
        vat: doc.customer_vat || '',
        address: doc.customer_address || '',
        city: doc.customer_city || '',
        postalCode: doc.customer_postal_code || '',
        country: doc.customer_country || 'BE',
      },
      company: companyData.rows?.[0] || {},
    });

    console.log('✅ UBL XML generated');
    console.log('\n📄 UBL Preview (first 500 chars):');
    console.log(ublXml.substring(0, 500) + '...\n');

    // 7. Test Storecove send (will fail without API key, but tests structure)
    console.log('📨 Testing Storecove integration...');
    try {
      const result = await sendViaPeppol(ublXml, 'BE9876543210', '0208', doc.number);
      console.log('✅ Peppol send successful:', result);
      
      // Update document
      await query(
        'UPDATE documents SET peppol_id = $1, peppol_status = $2, peppol_sent_at = $3 WHERE id = $4',
        [result.peppolId, result.status, new Date().toISOString(), docId]
      );
      console.log('✅ Document updated with Peppol ID');

      // Check status
      const status = await checkPeppolStatus(result.peppolId);
      console.log('✅ Peppol status:', status);

    } catch (error) {
      if (error.message.includes('STORECOVE_API_KEY')) {
        console.log('⚠️  Storecove API key not configured (expected in dev)');
        console.log('   Set STORECOVE_API_KEY in .env to test live sending');
      } else {
        throw error;
      }
    }

    console.log('\n✅ All Peppol tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    if (pool && pool.close) pool.close();
  }
}

testPeppol();
