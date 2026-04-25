import express from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/authRequired.js';

const router = express.Router();

// Create document
router.post('/', authRequired, async (req, res) => {
  const userId = req.user.id;
  const { type, customer_id, status, number, date, due_date, lines, klant, totals } = req.body;

  if (!type) return res.status(400).json({ error: 'type required' });

  try {
    let customerId = customer_id;

    // Auto-create customer when klant data is provided without ID
    if (!customerId && klant?.bedrijfsnaam) {
      await query(
        'insert into customers(name, email, phone, vat, address, owner_id) values($1,$2,$3,$4,$5,$6)',
        [klant.bedrijfsnaam, klant.email || '', klant.telefoon || '', klant.btwNummer || '', klant.adres || '', userId]
      );
      const cRes = await query(
        'select id from customers where owner_id=$1 order by created_at desc limit 1',
        [userId]
      );
      customerId = cRes.rows[0]?.id;
    }

    if (!customerId) return res.status(400).json({ error: 'customer required' });

    const notesJson = totals ? JSON.stringify(totals) : null;
    const docDate = date || new Date().toISOString().slice(0, 10);

    await query(
      'insert into documents(type, user_id, customer_id, status, number, date, due_date, notes) values($1,$2,$3,$4,$5,$6,$7,$8)',
      [type, userId, customerId, status || 'Concept', number || null, docDate, due_date || null, notesJson]
    );

    const docRes = await query(
      'select * from documents where user_id=$1 order by created_at desc limit 1',
      [userId]
    );
    const doc = docRes.rows[0];
    if (!doc) return res.status(500).json({ error: 'document creation failed' });

    if (Array.isArray(lines) && lines.length > 0) {
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        await query(
          'insert into document_lines(document_id, description, quantity, unit_price, vat_rate, sort_order) values($1,$2,$3,$4,$5,$6)',
          [doc.id, l.omschrijving || l.description || '', l.aantal ?? l.quantity ?? 1, l.eenheidsprijs ?? l.unit_price ?? 0, l.btwPerc ?? l.vat_rate ?? 21, i]
        );
      }
    }

    res.json({ document: doc });
  } catch (e) {
    console.error('Create document error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

// Get all documents for current user
router.get('/', authRequired, async (req, res) => {
  const userId = req.user.id;
  try {
    const r = await query(
      `select d.*, c.name as customer_name, c.email as customer_email,
              c.vat as customer_vat, c.phone as customer_phone
       from documents d
       left join customers c on d.customer_id = c.id
       where d.user_id = $1
       order by d.created_at desc`,
      [userId]
    );
    res.json({ documents: r.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// Get single document with lines
router.get('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const docRes = await query(
      `select d.*, c.name as customer_name, c.email as customer_email,
              c.vat as customer_vat, c.phone as customer_phone
       from documents d
       left join customers c on d.customer_id = c.id
       where d.id=$1 and d.user_id=$2`,
      [id, userId]
    );
    if (docRes.rows.length === 0) return res.status(404).json({ error: 'not found' });

    const doc = docRes.rows[0];
    const linesRes = await query(
      'select * from document_lines where document_id=$1 order by sort_order',
      [id]
    );
    doc.lines = linesRes.rows;

    res.json({ document: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// Update document
router.put('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { status, number, date, due_date, notes } = req.body;
  try {
    const docRes = await query('select id from documents where id=$1 and user_id=$2', [id, userId]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: 'not found' });

    const fields = [];
    const values = [];
    let idx = 1;
    if (status !== undefined) { fields.push(`status=$${idx++}`); values.push(status); }
    if (number !== undefined) { fields.push(`number=$${idx++}`); values.push(number); }
    if (date !== undefined) { fields.push(`date=$${idx++}`); values.push(date); }
    if (due_date !== undefined) { fields.push(`due_date=$${idx++}`); values.push(due_date); }
    if (notes !== undefined) { fields.push(`notes=$${idx++}`); values.push(notes); }

    fields.push(`updated_at=$${idx++}`);
    values.push(new Date().toISOString());

    if (fields.length === 1) return res.status(400).json({ error: 'nothing to update' });

    values.push(id);
    await query(`update documents set ${fields.join(', ')} where id=$${idx}`, values);
    const updated = await query('select * from documents where id=$1', [id]);
    res.json({ document: updated.rows[0] });
  } catch (e) {
    console.error('Update document error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

// Mark as sent
router.post('/:id/send', authRequired, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const docRes = await query('select id from documents where id=$1 and user_id=$2', [id, userId]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: 'not found' });

    await query(
      'update documents set status=$1, sent_at=$2, updated_at=$3 where id=$4',
      ['Verzonden', new Date().toISOString(), new Date().toISOString(), id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// Convert quote to invoice
router.post('/:id/convert', authRequired, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const docRes = await query('select * from documents where id=$1 and user_id=$2', [id, userId]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: 'not found' });

    const quote = docRes.rows[0];
    if (quote.type !== 'OFFERTE') return res.status(400).json({ error: 'not a quote' });

    await query(
      'insert into documents(type, user_id, customer_id, status, notes) values($1,$2,$3,$4,$5)',
      ['FACTUUR', userId, quote.customer_id, 'Concept', quote.notes]
    );

    const invRes = await query(
      'select * from documents where user_id=$1 order by created_at desc limit 1',
      [userId]
    );
    const invoice = invRes.rows[0];

    const linesRes = await query('select * from document_lines where document_id=$1', [id]);
    for (const line of linesRes.rows) {
      await query(
        'insert into document_lines(document_id, description, quantity, unit_price, vat_rate, sort_order) values($1,$2,$3,$4,$5,$6)',
        [invoice.id, line.description, line.quantity, line.unit_price, line.vat_rate, line.sort_order]
      );
    }

    await query('update documents set status=$1 where id=$2', ['Geannuleerd', id]);

    res.json({ invoice });
  } catch (e) {
    console.error('Convert error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

export default router;
