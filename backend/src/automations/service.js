import { query } from '../db.js';
import { sendEmail } from '../email/sender.js';
import { templates } from '../email/templates.js';

// Schedule follow-ups when document is sent
export async function scheduleFollowUps(documentId) {
  try {
    const docRes = await query('select * from documents where id=$1', [documentId]);
    if (docRes.rows.length === 0) return;
    
    const doc = docRes.rows[0];
    const now = new Date();
    
    // Schedule 3 follow-ups: +5, +10, +15 days
    const intervals = [5, 10, 15];
    
    for (const days of intervals) {
      const runAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      await query(
        'insert into automations(document_id, customer_id, kind, next_run_at, channel, template_id) values($1,$2,$3,$4,$5,$6)',
        [documentId, doc.customer_id, 'followup', runAt.toISOString(), 'email', 'followup']
      );
    }
    
    console.log(`Scheduled ${intervals.length} follow-ups for document ${documentId}`);
  } catch (e) {
    console.error('Schedule follow-ups error:', e);
  }
}

// Process due automations
export async function processDueAutomations() {
  try {
    const now = new Date().toISOString();
    const r = await query(
      'select a.*, d.status, d.number, c.name as customer_name, c.email as customer_email from automations a join documents d on a.document_id = d.id join customers c on a.customer_id = c.id where a.next_run_at <= $1 and a.attempts < a.max_attempts',
      [now]
    );
    
    console.log(`Processing ${r.rows.length} due automations`);
    
    for (const automation of r.rows) {
      // Skip if document is already paid/signed
      if (['Paid', 'Signed', 'Cancelled'].includes(automation.status)) {
        console.log(`Skipping automation ${automation.id} - document ${automation.status}`);
        continue;
      }
      
      // Send follow-up email
      const template = templates[automation.template_id] || templates.followup;
      
      // Calculate days since sent
      const sentDate = new Date(automation.sent_at || automation.created_at);
      const daysOverdue = Math.floor((Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const emailContent = template({
        customerName: automation.customer_name,
        companyName: 'Offerto', // TODO: get from user/company
        documentType: automation.type === 'offerte' ? 'Offerte' : 'Factuur',
        documentNumber: automation.number || 'uw document',
        daysOverdue,
        documentUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/document/${automation.document_id}` : null,
      });
      
      if (automation.customer_email) {
        await sendEmail(automation.customer_email, emailContent.subject, emailContent.text, emailContent.html);
        
        // Log email event
        await query(
          'insert into email_events(document_id, customer_id, type, meta_json) values($1,$2,$3,$4)',
          [automation.document_id, automation.customer_id, 'send', JSON.stringify({ automation_id: automation.id })]
        );
        
        // Log activity
        await query(
          'insert into activity_log(document_id, customer_id, kind, message) values($1,$2,$3,$4)',
          [automation.document_id, automation.customer_id, 'followup_sent', `Follow-up ${automation.attempts + 1} sent`]
        );
      }
      
      // Update automation
      const nextAttempts = automation.attempts + 1;
      if (nextAttempts >= automation.max_attempts) {
        // Stop automation
        await query('delete from automations where id=$1', [automation.id]);
        console.log(`Automation ${automation.id} completed (max attempts reached)`);
      } else {
        // Schedule next attempt (+5 days)
        const nextRun = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
        await query('update automations set attempts=$1, next_run_at=$2 where id=$3', [nextAttempts, nextRun.toISOString(), automation.id]);
        console.log(`Automation ${automation.id} rescheduled to ${nextRun.toISOString()}`);
      }
    }
    
    return r.rows.length;
  } catch (e) {
    console.error('Process automations error:', e);
    return 0;
  }
}
