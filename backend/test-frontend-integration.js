/**
 * Test Frontend-Backend Integration
 * 
 * Simulates what the React Native app will do:
 * 1. Register user
 * 2. Create customer
 * 3. Create document with lines
 * 4. List documents
 * 5. Update status
 */

const BASE_URL = 'http://localhost:4000';

let accessToken = null;
let userId = null;
let customerId = null;
let documentId = null;

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

async function testRegisterAndLogin() {
  console.log('\n1️⃣  Testing Register + Login...');
  
  const email = `test${Date.now()}@offerto.app`;
  const password = 'Test123!';
  const name = 'Test User';

  // Register
  const registerData = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });

  console.log('✅ Registered:', registerData.user.name);
  accessToken = registerData.accessToken;
  userId = registerData.user.id;
  
  console.log('   Token:', accessToken ? 'received ✓' : 'MISSING ✗');

  // Login (test credentials work)
  const loginData = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  console.log('✅ Logged in:', loginData.user.email);
  accessToken = loginData.accessToken;
  
  console.log('   Token after login:', accessToken ? 'received ✓' : 'MISSING ✗');

  return { email, password, userId };
}

async function testCreateCustomer() {
  console.log('\n2️⃣  Testing Create Customer...');

  const customer = await request('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Acme Corp',
      email: 'billing@acme.com',
      vat: 'BE0123456789',
      address: 'Main Street 1',
      city: 'Brussels',
      postal_code: '1000',
      country: 'BE',
    }),
  });

  console.log('✅ Created customer:', customer.name);
  customerId = customer.id;

  return customer;
}

async function testCreateDocument() {
  console.log('\n3️⃣  Testing Create Document with Lines...');

  const document = await request('/documents', {
    method: 'POST',
    body: JSON.stringify({
      type: 'offerte',
      number: 'OFF-2025-001',
      customer_id: customerId,
      lines: [
        {
          description: 'Website ontwerp',
          quantity: 1,
          unit_price: 2500.00,
          vat_rate: 21.00,
        },
        {
          description: 'Hosting (12 maanden)',
          quantity: 12,
          unit_price: 15.00,
          vat_rate: 21.00,
        },
      ],
    }),
  });

  console.log('✅ Created document:', document.number);
  console.log('   Lines:', document.lines?.length || 0);
  documentId = document.id;

  return document;
}

async function testListDocuments() {
  console.log('\n4️⃣  Testing List Documents...');

  const documents = await request('/documents');

  console.log('✅ Listed documents:', documents.length);
  documents.forEach(doc => {
    console.log(`   - ${doc.number} (${doc.type}) - ${doc.status}`);
  });

  return documents;
}

async function testUpdateStatus() {
  console.log('\n5️⃣  Testing Update Status...');

  const updated = await request(`/documents/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'Verzonden' }),
  });

  console.log('✅ Updated status:', updated.status);

  return updated;
}

async function testGetDocument() {
  console.log('\n6️⃣  Testing Get Document Detail...');

  const doc = await request(`/documents/${documentId}`);

  console.log('✅ Got document:', doc.number);
  console.log('   Customer:', doc.customer_name);
  console.log('   Total excl BTW:', doc.total_excl);
  console.log('   BTW:', doc.total_vat);
  console.log('   Total incl BTW:', doc.total_incl);

  return doc;
}

async function runTests() {
  console.log('🚀 Starting Frontend-Backend Integration Test\n');
  console.log('Backend URL:', BASE_URL);

  try {
    await testRegisterAndLogin();
    await testCreateCustomer();
    await testCreateDocument();
    await testListDocuments();
    await testUpdateStatus();
    await testGetDocument();

    console.log('\n✅ All tests passed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
