import express from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/authRequired.js';

const router = express.Router();

// Create customer
router.post('/', authRequired, async (req, res) => {
  const { name, email, phone, vat, address_json, tags } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  
  try {
    await query(
      'insert into customers(name, email, phone, vat, address_json, tags, owner_id) values($1,$2,$3,$4,$5,$6,$7)',
      [name, email, phone, vat, JSON.stringify(address_json || {}), JSON.stringify(tags || []), req.user.sub]
    );
    const r = await query('select * from customers where email=$1 order by created_at desc limit 1', [email || name]);
    res.json({ customer: r.rows[0] });
  } catch (e) {
    console.error('Create customer error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

// List customers
router.get('/', authRequired, async (req, res) => {
  try {
    const r = await query('select * from customers order by created_at desc');
    res.json({ customers: r.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// Get customer with documents
router.get('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  try {
    const custRes = await query('select * from customers where id=$1', [id]);
    if (custRes.rows.length === 0) return res.status(404).json({ error: 'not found' });
    
    const customer = custRes.rows[0];
    const docsRes = await query('select * from documents where customer_id=$1 order by created_at desc', [id]);
    customer.documents = docsRes.rows;
    
    res.json({ customer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// Update customer
router.put('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, vat, address_json, tags } = req.body;
  
  try {
    await query(
      'update customers set name=$1, email=$2, phone=$3, vat=$4, address_json=$5, tags=$6 where id=$7',
      [name, email, phone, vat, JSON.stringify(address_json || {}), JSON.stringify(tags || []), id]
    );
    const r = await query('select * from customers where id=$1', [id]);
    res.json({ customer: r.rows[0] });
  } catch (e) {
    console.error('Update customer error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

export default router;
