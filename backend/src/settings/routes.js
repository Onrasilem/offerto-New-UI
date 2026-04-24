/**
 * Settings Routes
 * Company settings and automation preferences
 */

import express from 'express';
import { authRequired } from '../middleware/authRequired.js';
import { query } from '../db.js';

const router = express.Router();

// Get user settings
router.get('/', authRequired, async (req, res) => {
  try {
    const userRes = await query(
      'select id, email, name, role, created_at from users where id=$1',
      [req.user.sub]
    );
    
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'user not found' });
    }

    const user = userRes.rows[0];
    
    // TODO: Add company settings table
    const settings = {
      user,
      company: {
        name: null,
        email: null,
        phone: null,
        vat: null,
        iban: null,
        address: null,
      },
      automations: {
        enabled: true,
        followUpDays: [5, 10, 15], // Days after sending
        maxAttempts: 3,
      },
      email: {
        provider: process.env.EMAIL_PROVIDER || 'console',
        from: process.env.EMAIL_FROM || 'noreply@offerto.app',
      },
    };

    res.json(settings);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// Update automation settings
router.put('/automations', authRequired, async (req, res) => {
  const { enabled, followUpDays, maxAttempts } = req.body;
  
  try {
    // TODO: Store in database when company settings table exists
    res.json({ 
      ok: true, 
      settings: { enabled, followUpDays, maxAttempts } 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

export default router;
