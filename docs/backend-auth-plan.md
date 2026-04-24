# Backend Auth Plan (kostenarm, self-host)

## Stack
- Node.js + Express (API)
- Postgres (self-host) voor users/refresh tokens
- JWT access tokens (korte duur) + refresh tokens (langer, opgeslagen in DB)
- Password hashing: bcrypt
- Rate limiting: IP-based op login/register

## Tabellen (SQL concept)
```sql
-- users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- refresh_tokens
CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  revoked boolean DEFAULT false
);
```

## Endpoints (MVP)
- `POST /auth/register` → email, password, name → create user
- `POST /auth/login` → email, password → issue access + refresh token
- `POST /auth/refresh` → refresh token → issue new access + refresh
- `POST /auth/logout` → revoke refresh token

## Token policy
- Access token TTL: 15m
- Refresh token TTL: 14d
- Rotate refresh tokens on each refresh; revoke old
- Include `role` in JWT claims for RBAC later

## Middleware
- `authRequired` → verifieer JWT access token
- `roleRequired(role)` → voor admin-only routes
- Rate limit login/register (bijv. 5/min/IP)

## Beveiliging
- Hash met bcrypt (cost 10-12)
- Validate email/password server-side
- Enforce password policy (min 8 chars)
- HTTPS only in productie

## Volgende stap
- Implementatie skeleton in `backend/` (Express + routes + JWT helpers + rate limiter)
- Koppel aan Postgres connectie (env: DATABASE_URL)
- Voeg tests voor login/refresh/logout
