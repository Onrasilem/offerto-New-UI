import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  console.log('Health check requested');
  res.json({ ok: true });
});

const server = app.listen(4002, '127.0.0.1', () => {
  console.log(`Minimal API on 4002`);
  setTimeout(() => {
    console.log('Still alive after 3s');
  }, 3000);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
