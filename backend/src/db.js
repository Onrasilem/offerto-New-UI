// Use SQLite for local dev (no Postgres installed)
// Switch to pg when DATABASE_URL is postgres://
import { loadConfig } from './config.js';
import { db, query as sqliteQuery } from './db-sqlite.js';

const cfg = loadConfig();
const useSqlite = !cfg.databaseUrl || !cfg.databaseUrl.startsWith('postgres://');

export const pool = useSqlite ? db : null;

export async function query(text, params) {
  if (useSqlite) {
    return sqliteQuery(text, params);
  } else {
    // Lazy load pg only if needed
    const pg = await import('pg');
    const pgPool = new pg.default.Pool({ connectionString: cfg.databaseUrl });
    const res = await pgPool.query(text, params);
    return res;
  }
}
