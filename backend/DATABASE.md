# Database Setup

## Option 1: Local PostgreSQL
1. Install PostgreSQL from https://www.postgresql.org/download/windows/
2. Create database: `createdb offerto`
3. Apply schema: `psql -d offerto -f schema.sql`
4. Update `.env` with your DATABASE_URL

## Option 2: Docker PostgreSQL
```powershell
docker run --name offerto-pg -e POSTGRES_PASSWORD=pass -e POSTGRES_USER=user -e POSTGRES_DB=offerto -p 5432:5432 -d postgres:15
docker exec -i offerto-pg psql -U user -d offerto < schema.sql
```

## Option 3: Cloud (free tier)
- Neon.tech, Supabase, or Railway free PostgreSQL
- Copy connection string to `.env` DATABASE_URL
- Apply schema via web console or psql
