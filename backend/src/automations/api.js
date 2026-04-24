import express from 'express';
import { processDueAutomations } from './service.js';

const router = express.Router();

router.post('/run-due', async (_req, res) => {
  try {
    const count = await processDueAutomations();
    res.json({ ok: true, processed: count });
  } catch (e) {
    console.error('Run automations error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

export default router;
