# Stack rationale
- Express + Postgres: low cost, simple
- Redis queue for follow-ups/reminders
- SES/Postmark/Mailgun for email (cheap/free tier)
- Mollie pay-per-use
- Peppol via access point pay-per-use later
