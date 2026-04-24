import express from 'express';
import cors from 'cors';
import { query } from './src/db-sqlite.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/test-insert', async (req, res) => {
  try {
    console.log('Testing insert...');
    await query('insert into users(email, password_hash, name) values($1,$2,$3)', ['test@test.nl', 'hash123', 'Test']);
    const r = await query('select * from users where email=$1', ['test@test.nl']);
    console.log('Result:', r.rows);
    res.json({ user: r.rows[0] });
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(4003, '0.0.0.0', () => {
  console.log('Test server on 4003');
});
