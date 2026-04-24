import { query } from './src/db-sqlite.js';
import { scheduleFollowUps, processDueAutomations } from './src/automations/service.js';

console.log('Testing automation flow...\n');

// Insert test customer
console.log('1. Creating test customer...');
await query('delete from customers where email=$1', ['test@automation.nl']);
await query(
  'insert into customers(name, email, phone) values($1,$2,$3)',
  ['Test Customer', 'test@automation.nl', '0612345678']
);
const custRes = await query('select * from customers where email=$1', ['test@automation.nl']);
const customer = custRes.rows[0];
console.log('✓ Customer created:', customer.id);

// Insert test document
console.log('\n2. Creating test document...');
await query(
  'insert into documents(type, customer_id, status, number, totals_json, pipeline_stage) values($1,$2,$3,$4,$5,$6)',
  ['Quote', customer.id, 'Draft', 'OFF-2024-001', JSON.stringify({ total: 1500 }), 'Lead']
);
const docRes = await query('select * from documents where customer_id=$1 order by created_at desc limit 1', [customer.id]);
const document = docRes.rows[0];
console.log('✓ Document created:', document.id);

// Mark as sent and schedule follow-ups
console.log('\n3. Marking document as Sent and scheduling follow-ups...');
await query('update documents set status=$1, pipeline_stage=$2 where id=$3', ['Sent', 'Offerte verstuurd', document.id]);
await scheduleFollowUps(document.id);
console.log('✓ Follow-ups scheduled');

// Check scheduled automations
const autoRes = await query('select * from automations where document_id=$1', [document.id]);
console.log(`✓ ${autoRes.rows.length} automations scheduled`);
autoRes.rows.forEach((a, i) => {
  console.log(`  ${i + 1}. Run at: ${a.next_run_at}, Attempts: ${a.attempts}/${a.max_attempts}`);
});

// Force one to be due now
if (autoRes.rows.length > 0) {
  const firstAuto = autoRes.rows[0];
  console.log('\n4. Forcing first automation to be due now...');
  await query('update automations set next_run_at=$1 where id=$2', [new Date().toISOString(), firstAuto.id]);
  console.log('✓ Automation updated');
  
  console.log('\n5. Processing due automations...');
  const processed = await processDueAutomations();
  console.log(`✓ Processed ${processed} automation(s)`);
  
  // Check email events
  const emailRes = await query('select * from email_events where document_id=$1', [document.id]);
  console.log(`✓ ${emailRes.rows.length} email event(s) logged`);
  
  // Check activity log
  const actRes = await query('select * from activity_log where document_id=$1', [document.id]);
  console.log(`✓ ${actRes.rows.length} activity log(s) recorded`);
  actRes.rows.forEach(a => console.log(`  - ${a.kind}: ${a.message}`));
}

console.log('\n✅ Automation flow test complete!');
process.exit(0);
