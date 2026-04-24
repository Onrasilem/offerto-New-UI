import express from 'express';
import { hashPassword, verifyPassword } from './password.js';
import { signAccess, signRefresh, verifyToken } from './jwt.js';
import { query } from '../db.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const password_hash = await hashPassword(password);
  try {
    // Check if exists first
    const check = await query('select id from users where email=$1', [email]);
    if (check.rows.length > 0) {
      return res.status(409).json({ error: 'email exists' });
    }
    
    // Insert
    await query('insert into users(email, password_hash, name) values($1,$2,$3)', [email, password_hash, name || null]);
    
    // Fetch user
    const r = await query('select id,email,name,role,created_at from users where email=$1', [email]);
    const user = r.rows[0];
    const accessToken = signAccess({ sub: user.id, role: user.role });
    const refreshToken = signRefresh({ sub: user.id });
    
    // Send welcome email
    try {
      const { sendEmail } = await import('../email/sender.js');
      const { templates } = await import('../email/templates.js');
      
      const emailContent = templates.welcome({
        userName: user.name || user.email,
        companyName: null,
      });
      
      await sendEmail(user.email, emailContent.subject, emailContent.text, emailContent.html);
    } catch (emailError) {
      console.error('Welcome email failed:', emailError.message);
      // Don't fail registration if email fails
    }
    
    res.json({ user, accessToken, refreshToken });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const r = await query('select id,email,password_hash,role,name from users where email=$1', [email]);
    const user = r.rows[0];
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const accessToken = signAccess({ sub: user.id, role: user.role });
    const refreshToken = signRefresh({ sub: user.id });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken, refreshToken });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
  try {
    const payload = verifyToken(refreshToken);
    const accessToken = signAccess({ sub: payload.sub, role: payload.role });
    const newRefreshToken = signRefresh({ sub: payload.sub });
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (e) {
    return res.status(401).json({ error: 'invalid refresh' });
  }
});

router.post('/logout', (_req, res) => {
  // For stateless JWT we just let tokens expire; add DB revocation if needed
  res.json({ ok: true });
});

export default router;
