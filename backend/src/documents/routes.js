import express from 'express';
import { query } from '../db.js';
import { canTransition } from './status.js';
import { authRequired } from '../middleware/authRequired.js';
import { generateStructuredReference } from '../payments/structured-reference.js';

const router = express.Router();

// Create document (quote or invoice)
router.post('/', authRequired, async (req, res) => {
  const { type, customer_id, status, number, date, due_date, totals_json, lines } = req.body;
  if (!type || !customer_id) return res.status(400).json({ error: 'type and customer_id required' });
  
  try {
    await query(
      'insert into documents(type, customer_id, status, number, date, due_date, totals_json, pipeline_stage) values($1,$2,$3,$4,$5,$6,$7,$8)',
      [type, customer_id, status || 'Draft', number, date, due_date, JSON.stringify(totals_json || {}), 'Lead']
    );
    const r = await query('select * from documents where customer_id=$1 order by created_at desc limit 1', [customer_id]);
    const doc = r.rows[0];
    
    // Insert lines if provided
    if (lines && lines.length > 0) {
      for (const line of lines) {
        await query(
          'insert into lines(document_id, description, qty, unit, unit_price, vat_perc, ex, vat, inc) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',
          [doc.id, line.description, line.qty, line.unit, line.unit_price, line.vat_perc, line.ex, line.vat, line.inc]
        );
      }
    }
    
    res.json({ document: doc });
  } catch (e) {
    console.error('Create document error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

// Get documents
router.get('/', authRequired, async (req, res) => {
  try {
    const r = await query('select * from documents order by created_at desc');
    res.json({ documents: r.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// Get single document with lines
router.get('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  try {
    const docRes = await query('select * from documents where id=$1', [id]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: 'not found' });
    
    const doc = docRes.rows[0];
    const linesRes = await query('select * from lines where document_id=$1', [id]);
    doc.lines = linesRes.rows;
    
    res.json({ document: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// Send document (mark as Sent and email customer)
router.post('/:id/send', authRequired, async (req, res) => {
  const { id } = req.params;
  const { message, sendEmail: shouldSendEmail = true } = req.body || {};
  
  try {
    // Get document with customer info
    const docRes = await query(
      `select d.*, c.name as customer_name, c.email as customer_email, u.name as company_name
       from documents d
       left join customers c on d.customer_id = c.id
       left join users u on d.user_id = u.id
       where d.id=$1`,
      [id]
    );
    
    if (docRes.rows.length === 0) return res.status(404).json({ error: 'not found' });
    
    const doc = docRes.rows[0];
    
    // Validate status transition
    if (!canTransition(doc.type, doc.status, 'Verzonden')) {
      return res.status(400).json({ error: 'invalid status transition' });
    }
    
    // Update status
    await query(
      'update documents set status=$1, sent_at=$2, updated_at=$3 where id=$4', 
      ['Verzonden', new Date().toISOString(), new Date().toISOString(), id]
    );
    
    // Send email if requested and customer has email
    if (shouldSendEmail && doc.customer_email) {
      const { sendEmail } = await import('../email/sender.js');
      const { templates } = await import('../email/templates.js');
      
      const emailContent = templates.documentSent({
        customerName: doc.customer_name,
        companyName: doc.company_name || 'Offerto',
        documentType: doc.type === 'offerte' ? 'Offerte' : 'Factuur',
        documentNumber: doc.number,
        documentUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/document/${id}` : null,
        message,
      });
      
      try {
        await sendEmail(
          doc.customer_email,
          emailContent.subject,
          emailContent.text,
          emailContent.html
        );
        console.log(`✅ Document ${doc.number} sent to ${doc.customer_email}`);
      } catch (emailError) {
        console.error('Email send failed:', emailError.message);
        // Don't fail the whole request if email fails
      }
    }
    
    // Schedule follow-ups
    const { scheduleFollowUps } = await import('../automations/service.js');
    await scheduleFollowUps(id);
    
    res.json({ ok: true, sent: shouldSendEmail && !!doc.customer_email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// Update document (status, fields)
router.put('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  const { status, number, date, due_date, totals_json } = req.body;
  try {
    const docRes = await query('select * from documents where id=$1', [id]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: 'not found' });

    const fields = [];
    const values = [];
    let idx = 1;
    if (status !== undefined) { fields.push(`status=$${idx++}`); values.push(status); }
    if (number !== undefined) { fields.push(`number=$${idx++}`); values.push(number); }
    if (date !== undefined) { fields.push(`date=$${idx++}`); values.push(date); }
    if (due_date !== undefined) { fields.push(`due_date=$${idx++}`); values.push(due_date); }
    if (totals_json !== undefined) { fields.push(`totals_json=$${idx++}`); values.push(JSON.stringify(totals_json)); }

    if (fields.length === 0) return res.status(400).json({ error: 'nothing to update' });

    values.push(id);
    await query(`update documents set ${fields.join(', ')} where id=$${idx}`, values);
    const updated = await query('select * from documents where id=$1', [id]);
    res.json({ document: updated.rows[0] });
  } catch (e) {
    console.error('Update document error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

// Convert quote to invoice
router.post('/:id/convert', authRequired, async (req, res) => {
  const { id } = req.params;
  try {
    const docRes = await query('select * from documents where id=$1', [id]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: 'not found' });
    
    const quote = docRes.rows[0];
    if (quote.type !== 'Quote') return res.status(400).json({ error: 'not a quote' });
    
    // Create new invoice from quote
    await query(
      'insert into documents(type, customer_id, status, totals_json, pipeline_stage, meta_json) values($1,$2,$3,$4,$5,$6)',
      ['Invoice', quote.customer_id, 'Draft', quote.totals_json, 'Lead', JSON.stringify({ converted_from: id })]
    );
    
    const invRes = await query('select * from documents where customer_id=$1 order by created_at desc limit 1', [quote.customer_id]);
    const invoice = invRes.rows[0];
    
    // Copy lines
    const linesRes = await query('select * from lines where document_id=$1', [id]);
    for (const line of linesRes.rows) {
      await query(
        'insert into lines(document_id, description, qty, unit, unit_price, vat_perc, ex, vat, inc) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [invoice.id, line.description, line.qty, line.unit, line.unit_price, line.vat_perc, line.ex, line.vat, line.inc]
      );
    }
    
    // Update quote status
    await query('update documents set status=$1 where id=$2', ['Converted', id]);
    
    res.json({ invoice });
  } catch (e) {
    console.error('Convert error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

export default router;
