# Payments model notes
- `payments` table: provider, provider_ref, status, amount, currency, paid_at, raw_json
- Webhook updates document status + pipeline stage
- Map provider statuses to internal {Paid, Sent, Overdue, Cancelled}
