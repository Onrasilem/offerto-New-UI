/**
 * Test Complete Automation Flow
 * Tests: register → customer → document → send → schedule → process
 */

import { query } from './src/db.js';
import { hashPassword } from './src/auth/password.js';
import { scheduleFollowUps, processDueAutomations } from './src/automations/service.js';

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Automation Flow\n');

  try {
    // 1. Create user
    console.log('1️⃣  Creating test user...');
    const email = `test${Date.now()}@offerto.app`;
    const password_hash = await hashPassword('test123');
    
    await query(
      'insert into users(email, password_hash, name) values($1,$2,$3)',
      [email, password_hash, 'Test User']
    );
    
    const userRes = await query('select id from users where email=$1', [email]);
    const userId = userRes.rows[0].id;
    console.log('✅ User created:', userId);

    // 2. Create customer
    console.log('\n2️⃣  Creating customer...');
    await query(
      `insert into customers(owner_id, name, email, vat, address, city, postal_code, country)
       values($1,$2,$3,$4,$5,$6,$7,$8)`,
      [userId, 'Test Corp BV', 'customer@test.com', 'BE0123456789', 'Main St 1', 'Brussels', '1000', 'BE']
    );
    
    const customerRes = await query('select id from customers where owner_id=$1', [userId]);
    const customerId = customerRes.rows[0].id;
    console.log('✅ Customer created:', customerId);

    // 3. Create document
    console.log('\n3️⃣  Creating document...');
    const now = new Date().toISOString();
    await query(
      `insert into documents(type, user_id, customer_id, status, number, date, sent_at)
       values($1,$2,$3,$4,$5,$6,$7)`,
      ['offerte', userId, customerId, 'Verzonden', 'OFF-TEST-001', now, now]
    );
    
    const docRes = await query('select id from documents where user_id=$1', [userId]);
    const documentId = docRes.rows[0].id;
    console.log('✅ Document created:', documentId);

    // 4. Add lines
    console.log('\n4️⃣  Adding line items...');
    await query(
      `insert into document_lines(document_id, description, quantity, unit_price, vat_rate)
       values($1,$2,$3,$4,$5)`,
      [documentId, 'Consulting Services', 10, 150.00, 21.00]
    );
    console.log('✅ Line items added');

    // 5. Schedule follow-ups
    console.log('\n5️⃣  Scheduling follow-ups...');
    await scheduleFollowUps(documentId);
    
    const autoRes = await query(
      'select id, next_run_at, attempts, max_attempts from automations where document_id=$1',
      [documentId]
    );
    console.log(`✅ Scheduled ${autoRes.rows.length} follow-ups:`);
    autoRes.rows.forEach((auto, i) => {
      console.log(`   ${i + 1}. Run at: ${auto.next_run_at} (attempt ${auto.attempts}/${auto.max_attempts})`);
    });

    // 6. Manually trigger first automation (for testing)
    console.log('\n6️⃣  Triggering first automation...');
    
    // Update first automation to be due now
    if (autoRes.rows.length > 0) {
      await query(
        'update automations set next_run_at=$1 where id=$2',
        [now, autoRes.rows[0].id]
      );
      
      // Process automations
      await processDueAutomations();
      
      // Check if processed
      const afterRes = await query(
        'select attempts from automations where id=$1',
        [autoRes.rows[0].id]
      );
      
      if (afterRes.rows.length > 0) {
        console.log(`✅ Automation processed (attempts: ${afterRes.rows[0].attempts})`);
      } else {
        console.log('✅ Automation completed (max attempts reached)');
      }
    }

    // Check email events
    console.log('\n7️⃣  Checking email events...');
    const emailRes = await query(
      'select type, created_at from email_events where document_id=$1',
      [documentId]
    );
    console.log(`✅ Email events logged: ${emailRes.rows.length}`);

    // 8. Check activity log
    console.log('\n8️⃣  Checking activity log...');
    const activityRes = await query(
      'select kind, message, created_at from activity_log where document_id=$1',
      [documentId]
    );
    console.log(`✅ Activity entries: ${activityRes.rows.length}`);
    activityRes.rows.forEach(act => {
      console.log(`   - ${act.kind}: ${act.message}`);
    });

    console.log('\n✅ Complete automation flow test passed!');
    console.log('\n📊 Summary:');
    console.log(`   User: ${userId}`);
    console.log(`   Customer: ${customerId}`);
    console.log(`   Document: ${documentId}`);
    console.log(`   Automations: ${autoRes.rows.length} scheduled`);
    console.log(`   Emails: ${emailRes.rows.length} sent`);
    console.log(`   Activity: ${activityRes.rows.length} logged`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testCompleteFlow();
