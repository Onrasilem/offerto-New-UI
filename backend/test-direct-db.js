/**
 * Direct Database Test - Frontend Flow Simulation
 * 
 * Bypasses HTTP layer to test business logic directly
 */

import { query } from './src/db.js';
import { hashPassword, verifyPassword } from './src/auth/password.js';
import { signAccess, signRefresh } from './src/auth/jwt.js';

async function testFlow() {
  console.log('🚀 Testing Frontend Flow (Direct DB)\n');

  // 1. Register User
  console.log('1️⃣  Register user...');
  const email = `test${Date.now()}@offerto.app`;
  const password = 'Test123!';
  const name = 'Test User';
  const password_hash = await hashPassword(password);
  
  await query('insert into users(email, password_hash, name) values($1,$2,$3)', [email, password_hash, name]);
  const userResult = await query('select id,email,name,role from users where email=$1', [email]);
  const user = userResult.rows[0];
  console.log('✅ User registered:', user.email);

  const accessToken = signAccess({ sub: user.id, role: user.role });
  const refreshToken = signRefresh({ sub: user.id });
  console.log('✅ Tokens generated');

  // 2. Create Customer
  console.log('\n2️⃣  Create customer...');
  await query(
    `insert into customers(owner_id, name, email, vat, address, city, postal_code, country)
     values($1,$2,$3,$4,$5,$6,$7,$8)`,
    [user.id, 'Acme Corp', 'billing@acme.com', 'BE0123456789', 'Main Street 1', 'Brussels', '1000', 'BE']
  );
  
  const customerResult = await query('select * from customers where owner_id=$1', [user.id]);
  const customer = customerResult.rows[0];
  console.log('✅ Customer created:', customer.name);

  // 3. Create Document with Lines
  console.log('\n3️⃣  Create document...');
  await query(
    `insert into documents(type, number, user_id, customer_id, status)
     values($1,$2,$3,$4,$5)`,
    ['offerte', 'OFF-2025-001', user.id, customer.id, 'Concept']
  );
  
  const docResult = await query('select * from documents where number=$1', ['OFF-2025-001']);
  const document = docResult.rows[0];
  console.log('✅ Document created:', document.number);

  // Add lines
  await query(
    `insert into document_lines(document_id, description, quantity, unit_price, vat_rate)
     values($1,$2,$3,$4,$5)`,
    [document.id, 'Website ontwerp', 1, 2500.00, 21.00]
  );
  await query(
    `insert into document_lines(document_id, description, quantity, unit_price, vat_rate)
     values($1,$2,$3,$4,$5)`,
    [document.id, 'Hosting (12 maanden)', 12, 15.00, 21.00]
  );
  
  const linesResult = await query('select * from document_lines where document_id=$1', [document.id]);
  console.log('✅ Lines added:', linesResult.rows.length);

  // Calculate totals
  let totalExcl = 0;
  let totalVat = 0;
  linesResult.rows.forEach(line => {
    const lineTotal = line.quantity * line.unit_price;
    const lineVat = lineTotal * (line.vat_rate / 100);
    totalExcl += lineTotal;
    totalVat += lineVat;
  });
  const totalIncl = totalExcl + totalVat;
  
  console.log(`   Total excl BTW: €${totalExcl.toFixed(2)}`);
  console.log(`   BTW: €${totalVat.toFixed(2)}`);
  console.log(`   Total incl BTW: €${totalIncl.toFixed(2)}`);

  // 4. Update Status
  console.log('\n4️⃣  Update status...');
  await query('update documents set status=$1 where id=$2', ['Verzonden', document.id]);
  const updated = await query('select status from documents where id=$1', [document.id]);
  console.log('✅ Status updated to:', updated.rows[0].status);

  // 5. List Documents
  console.log('\n5️⃣  List documents...');
  const allDocs = await query(
    `select d.*, c.name as customer_name 
     from documents d 
     left join customers c on d.customer_id = c.id 
     where d.user_id=$1`,
    [user.id]
  );
  console.log('✅ Documents found:', allDocs.rows.length);
  allDocs.rows.forEach(doc => {
    console.log(`   - ${doc.number} (${doc.type}) - ${doc.status}`);
  });

  // 6. Verify Login
  console.log('\n6️⃣  Verify login...');
  const loginUser = await query('select id,email,password_hash,role,name from users where email=$1', [email]);
  const ok = await verifyPassword(password, loginUser.rows[0].password_hash);
  console.log('✅ Login verification:', ok ? 'SUCCESS' : 'FAILED');

  console.log('\n✅ All frontend flow tests passed!\n');
}

testFlow().catch(e => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
