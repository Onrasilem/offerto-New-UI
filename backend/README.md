# Backend Skeleton Plan (Node + Express + Postgres)

Kostenefficiënte start zonder extra paid services. Dit is een blueprint; je kunt later uitbreiden.

## Stack
- Node.js + Express (API)
- Postgres (self-host) voor users/refresh tokens/documents
- Redis (kleine instance) voor jobs (follow-ups/reminders)
- JWT access tokens (15m) + refresh tokens (14d) in DB
- Email: SES/Postmark/Mailgun free tier; Payment: Mollie (pay-per-use)
- Peppol: access point (pay-per-use) later koppelen

## Structuur (voorstel)
```
backend/
  src/
    index.js          # start Express
    config.js         # env: DATABASE_URL, REDIS_URL, JWT_SECRET, EMAIL creds
    db.js             # Postgres client (pg)
    auth/
      routes.js       # register/login/refresh/logout
      jwt.js          # sign/verify helpers
      password.js     # bcrypt helpers
      rateLimit.js    # login/register limiter
    documents/
      routes.js       # create/send/convert
      status.js       # status machine helpers
    payments/
      routes.js       # webhook endpoints (Mollie)
    automations/
      queue.js        # BullMQ/bee-queue setup
      workers.js      # follow-up jobs
    peppol/
      ubl.js          # UBL 2.1 generator stub
    email/
      sender.js       # send via provider
      templates.js    # basic templates
  package.json (later)
```

## Kern endpoints (MVP)
- POST `/auth/register` (email, password, name)
- POST `/auth/login`
- POST `/auth/refresh`
- POST `/auth/logout`
- POST `/documents/:id/send` (plan follow-ups)
- POST `/documents/:id/convert` (quote→invoice)
- POST `/webhooks/mollie` (status sync)
- POST `/automations/run-due` (cron trigger)

## Datamodel (beknopt)
- users(id, email, password_hash, role, created_at)
- refresh_tokens(id, user_id, token, expires_at, revoked)
- customers(id, name, email, phone, vat, address_json, tags[], owner_id)
- documents(id, type, customer_id, status, number, date, due_date, totals_json, pipeline_stage)
- lines(id, document_id, description, qty, unit, unit_price, vat_perc, ex, vat, inc)
- payments(id, document_id, provider, provider_ref, status, amount, currency, paid_at, raw_json)
- email_events(id, document_id, customer_id, type{send,open,click}, provider_msg_id, meta_json)
- automations(id, document_id, customer_id, kind{followup,reminder}, next_run_at, attempts, max_attempts)
- activity_log(id, actor_id?, customer_id?, document_id?, kind, message, meta_json, created_at)

## Statusmachine
- Quote: Draft → Sent → Signed → Converted → Archived
- Invoice: Draft → Sent → Paid → Overdue → Cancelled → Archived

## Follow-up logica (MVP)
- Bij send: plan jobs op +5/+10/+15 dagen
- Job checkt status; stop bij Paid/Signed; anders stuur template en log event
- Na max pogingen: markeer voor collections

## Peppol/UBL stub (later)
- Functie signatuur: `buildUblInvoice(document, customer, lines, company)` → XML string
- Validatie: verplichte velden seller/buyer, VAT, IBAN/BIC, totals
- Submit via access point API; sla peppol_status op

## Volgende stap
- Init Node project hier (npm init -y)
- Voeg dependencies: express, pg, bcrypt, jsonwebtoken, cors, dotenv, bullmq (of bee-queue), node-cron
- Schrijf index.js met health route en auth routes stub
- Schrijf auth routes (register/login/refresh/logout) met Postgres queries
- Schrijf webhook stub voor Mollie (status mapping)
- Schrijf queue/worker stub voor follow-ups
