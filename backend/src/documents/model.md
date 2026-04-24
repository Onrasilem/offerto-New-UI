# Document model notes
- Shared table `documents` for quotes/invoices
- Key fields: type, status, number, date, due_date, totals_json, pipeline_stage, customer_id
- Lines in `lines` table
- Use status machine from status.js
