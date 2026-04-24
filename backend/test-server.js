import express from 'express';
const app = express();
app.get('/test', (_req, res) => res.json({ ok: true }));
const server = app.listen(4001, () => {
  console.log('Test server on 4001');
  setTimeout(() => server.close(), 2000);
});
