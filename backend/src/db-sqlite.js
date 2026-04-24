import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'offerto.db');
export const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    revoked INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    vat TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'BE',
    tags TEXT,
    owner_id TEXT REFERENCES users(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    type TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Concept',
    number TEXT,
    date TEXT DEFAULT (date('now')),
    due_date TEXT,
    share_url TEXT,
    sent_at TEXT,
    signed_at TEXT,
    signature_data TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS document_lines (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    vat_rate REAL NOT NULL DEFAULT 21,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    provider TEXT,
    provider_ref TEXT,
    status TEXT,
    amount REAL,
    currency TEXT,
    paid_at TEXT,
    raw_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS email_events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
    type TEXT,
    provider_msg_id TEXT,
    meta_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS automations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
    kind TEXT,
    next_run_at TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    channel TEXT,
    template_id TEXT,
    meta_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    actor_id TEXT REFERENCES users(id),
    customer_id TEXT REFERENCES customers(id),
    document_id TEXT REFERENCES documents(id),
    kind TEXT,
    message TEXT,
    meta_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('SQLite database initialized at', dbPath);

export function query(text, params = []) {
  // Map pg-style queries to SQLite
  const normalized = text.replace(/\$(\d+)/g, '?');
  const lower = text.trim().toLowerCase();
  
  if (lower.startsWith('select')) {
    const stmt = db.prepare(normalized);
    return { rows: stmt.all(...params) };
  }
  
  if (lower.startsWith('insert') && text.includes('returning')) {
    const [insertPart, returningPart] = text.split(/returning/i);
    const insertStmt = db.prepare(insertPart.trim().replace(/\$(\d+)/g, '?'));
    const info = insertStmt.run(...params);
    
    // Extract table name from INSERT INTO table_name
    const tableMatch = insertPart.match(/insert\s+into\s+(\w+)/i);
    const tableName = tableMatch ? tableMatch[1] : 'users';
    
    // Build SELECT with RETURNING columns
    const columns = returningPart.trim() || '*';
    const selectStmt = db.prepare(`SELECT ${columns} FROM ${tableName} WHERE rowid = ?`);
    return { rows: [selectStmt.get(info.lastInsertRowid)] };
  }
  
  if (lower.startsWith('insert') || lower.startsWith('update') || lower.startsWith('delete')) {
    const stmt = db.prepare(normalized);
    const info = stmt.run(...params);
    return { rows: [], rowCount: info.changes };
  }
  
  const stmt = db.prepare(normalized);
  return { rows: stmt.all(...params) };
}

export default db;
