# Backend Architecture (Phase 1)

## Stack
- Runtime: Node.js (API + workers)
- Auth & DB: Supabase (Postgres + Auth + Storage)
- Jobs/Queues: Supabase Edge Functions or BullMQ/Cloud Tasks (for follow-ups, reminders, retries)
- Email: SendGrid/Postmark (prod), fallback to Expo Mail Composer (dev)
- Payments: Mollie (webhooks), Stripe optional
- E-invoicing: Peppol via access point (e.g., Storecove/Unifiedpost) + UBL 2.1 export

## Core Services
1) Auth Service
- JWT/refresh, role-based (admin/sales/accountant)
- Rate limiting per IP/user

2) Customer/CRM Service
- CRUD customers, tags, owner
- Interactions log (calls, emails, notes)
- Preferences (language, reminder cadence)

3) Document Service
- Quotes & invoices (shared schema)
- Lines, totals, status machine
- PDF & UBL generation (for Peppol)
- Attachments (logo/branding)

4) Automation Service
- Scheduled follow-ups (5/10/15 days)
- Stop rules: if Paid or Signed
- Templates + variables
- Activity log entries per send

5) Email Service
- Templates library (transactional + follow-up + reminder)
- Tracking: open/click/webview events → email_events table
- DMARC/SPF/DKIM to be configured

6) Payment Service
- Webhooks: /webhooks/mollie (and /stripe)
- Status mapping → document status + pipeline stage
- Thank-you mail on paid; reminders on overdue

7) Peppol Service
- UBL 2.1 generation (Invoice, optionally Order/Despatch)
- Submit via access point API; store delivery status and errors
- Validation before send (required fields)

8) Activity & Audit
- activity_log for all significant events (send, open, pay, sign)
- audit trail (who/when) + IP/device metadata

## Status Machines
- Quote: Draft → Sent → Signed → Converted → Archived
- Invoice: Draft → Sent → Paid → Overdue → Cancelled → Archived
- Transitions triggered by: send, sign event, payment webhook, reminder job

## Data Model (minimal)
- customers(id, name, email, phone, vat, kvk, address_json, tags[], owner_id, prefs_json)
- documents(id, type{quote,invoice}, customer_id, status, number, date, due_date, totals_json, peppol_status, pipeline_stage, sign_requested, signature_data, meta_json)
- lines(id, document_id, description, qty, unit, unit_price, vat_perc, ex, vat, inc)
- payments(id, document_id, provider, provider_ref, status, amount, currency, paid_at, raw_json)
- email_events(id, document_id, customer_id, type{send,open,click,bounce}, provider_msg_id, meta_json)
- automations(id, document_id, customer_id, kind{followup,reminder}, next_run_at, attempts, max_attempts, channel, template_id, meta_json)
- interactions(id, customer_id, document_id?, type{call,note,email,meeting}, summary, created_by)
- activity_log(id, actor_id?, customer_id?, document_id?, kind, message, meta_json, created_at)

## API Endpoints (draft)
- POST /auth/login, /auth/refresh
- GET/POST/PUT /customers
- GET/POST/PUT /documents (query by status, stage, customer)
- POST /documents/:id/send (email)
- POST /documents/:id/convert (quote→invoice)
- POST /documents/:id/sign-request (trigger signing flow)
- GET /pipeline (kanban data)
- POST /webhooks/mollie, /webhooks/stripe, /webhooks/email-provider
- POST /automations/run-due (cron/edge function)
- POST /peppol/send/:id (submit UBL)

## Follow-up Logic (MVP)
- Schedule at creation: +5d, +10d, +15d if status ∉ {Paid, Signed}
- Each run: check status; if still open → send template; log email_events + activity_log
- Stop conditions: Paid, Signed, Cancelled
- Escalation: after max attempts, mark for collections

## Payment Webhook (Mollie)
- Validate signature
- Fetch payment details
- Map status: paid→Paid, open→Sent, expired/canceled→Overdue/Cancelled
- Update document.status and pipeline_stage
- Trigger thank-you or reminder scheduling

## Peppol / UBL Checklist
Required fields before send:
- Seller: name, VAT, company reg, address, IBAN/BIC
- Buyer: name, VAT (if B2B), address
- Invoice: number, issue date, due date, currency
- Lines: description, qty, unit, price, VAT%
- Totals: ex, VAT, inc; payment terms
Steps:
1) Generate UBL 2.1 XML
2) Validate schema
3) Submit to access point API
4) Store peppol_status + response

## Security & Compliance
- JWT with rotation, short access tokens
- Rate limiting on public endpoints
- Input validation (zod/yup) server-side
- Encrypt sensitive data at rest (keys, tokens)
- GDPR: export/delete per customer; retention policy
- Audit trail for all state transitions

## Ops & Monitoring
- Sentry for errors; uptime checks
- Structured logs (document_id, customer_id, request_id)
- Backups of Postgres

## Next Steps
1) Finalize schema & generate migrations
2) Define OpenAPI spec for listed endpoints
3) Stub Peppol UBL generator function signature
4) Implement Mollie webhook handler skeleton
5) Implement follow-up job runner skeleton
