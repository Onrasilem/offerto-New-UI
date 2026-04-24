import express from 'express';
import cors from 'cors';
import { loadConfig } from './config.js';
import { pool } from './db.js';
import authRoutes from './auth/routes.js';
import documentRoutes from './documents/routes.js';
import customerRoutes from './customers/routes.js';
import paymentRoutes from './payments/routes.js';
import productRoutes from './products/routes.js';
import automationRoutes from './automations/api.js';
import settingsRoutes from './settings/routes.js';
import peppolRoutes from './peppol/routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { startScheduler, stopScheduler } from './automations/scheduler.js';

const app = express();
const cfg = loadConfig();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Serve test HTML
app.get('/test', (_req, res) => {
  res.sendFile('test-api.html', { root: '..' });
});

app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);
app.use('/documents', documentRoutes);
app.use('/payments', paymentRoutes);
app.use('/products', productRoutes);
app.use('/automations', automationRoutes);
app.use('/settings', settingsRoutes);
app.use('/peppol', peppolRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(cfg.port, '0.0.0.0', () => {
  console.log(`API listening on http://0.0.0.0:${cfg.port}`);
  
  // Start automation scheduler
  if (process.env.ENABLE_SCHEDULER !== 'false') {
    startScheduler();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  stopScheduler();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  stopScheduler();
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  stopScheduler();
  process.exit(1);
});
