-- Minimal schema draft (Postgres)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  revoked boolean DEFAULT false
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  vat text,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'BE',
  tags text[] DEFAULT '{}',
  owner_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- offerte | factuur
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Concept',
  number text,
  date date DEFAULT CURRENT_DATE,
  due_date date,
  share_url text,
  sent_at timestamptz,
  signed_at timestamptz,
  signature_data text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE document_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 21,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  provider text,
  provider_ref text,
  status text,
  amount numeric,
  currency text,
  paid_at timestamptz,
  raw_json jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  type text, -- send | open | click | bounce
  provider_msg_id text,
  meta_json jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  kind text, -- followup | reminder
  next_run_at timestamptz,
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  channel text, -- email | sms
  template_id text,
  meta_json jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  customer_id uuid REFERENCES customers(id),
  document_id uuid REFERENCES documents(id),
  kind text,
  message text,
  meta_json jsonb,
  created_at timestamptz DEFAULT now()
);
