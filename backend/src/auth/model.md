# Auth model notes
- users table with email unique
- refresh_tokens table if you want server-side rotation/revocation
- JWT access 15m, refresh 14d (configurable)
- bcrypt for password hashing
