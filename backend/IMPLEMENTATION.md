# Offerto Backend - Implementation Complete ✅

## Status: Fully Functional

Backend API volledig geïmplementeerd en getest met SQLite database.

## ✅ Geïmplementeerde Features

### Authentication
- ✅ User registration (bcrypt hashing)
- ✅ Login with JWT tokens
- ✅ Token refresh mechanism
- ✅ Protected routes middleware
- ✅ Tested: node test-auth-flow.js

### Database
- ✅ SQLite auto-initialized
- ✅ Postgres-compatible queries
- ✅ 8 tables: users, customers, documents, lines, payments, automations, email_events, activity_log

### Customer Management
- ✅ CRUD endpoints (create, list, get, update)
- ✅ Address/tags/VAT support
- ✅ Owner tracking

### Document Management  
- ✅ Create quote/invoice with lines
- ✅ List & get with details
- ✅ Send (triggers follow-ups)
- ✅ Convert quote → invoice
- ✅ Status machine with guards

### Payment Processing
- ✅ Mollie webhook handler
- ✅ Payment status mapping
- ✅ Auto-update document status
- ✅ Activity logging

### Automation & Email
- ✅ Auto-schedule 3 follow-ups on send
- ✅ Process due automations
- ✅ Email templates
- ✅ Smart stop on Paid/Signed
- ✅ Tested: node test-automation-flow.js

## 🚀 Quick Start

```powershell
cd backend
npm install
npm start
```

API runs on **http://localhost:4000**

## 📡 API Endpoints

### Auth (Public)
- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Customers (Protected)
- `POST /customers` - Create
- `GET /customers` - List all
- `GET /customers/:id` - Get one  
- `PUT /customers/:id` - Update

### Documents (Protected)
- `POST /documents` - Create quote/invoice
- `GET /documents` - List all
- `GET /documents/:id` - Get with lines
- `POST /documents/:id/send` - Send + schedule follow-ups
- `POST /documents/:id/convert` - Convert quote → invoice

### Webhooks (Public)
- `POST /webhooks/mollie` - Payment webhook

### Automations (Internal)
- `POST /automations/run-due` - Process follow-ups

### Health
- `GET /health` - API status

## 🧪 Testing

```powershell
# Test complete auth flow
node test-auth-flow.js

# Test automation workflow
node test-automation-flow.js
```

Both tests pass ✅

## 📁 Files

- `src/index.js` - Express app
- `src/config.js` - Environment config
- `src/db.js` - Database wrapper
- `src/db-sqlite.js` - SQLite implementation
- `src/auth/routes.js` - Auth endpoints
- `src/customers/routes.js` - Customer CRUD
- `src/documents/routes.js` - Document management
- `src/payments/routes.js` - Mollie webhook
- `src/automations/service.js` - Follow-up automation
- `src/email/sender.js` - Email sender (console logger)
- `schema.sql` - Database schema
- `.env` - Configuration

## 🔧 Configuration (.env)

```
PORT=4000
DATABASE_URL=sqlite://offerto.db
JWT_SECRET=dev-secret-change-in-production
ACCESS_TTL=15m
REFRESH_TTL_DAYS=14
```

## 📦 Next Steps for Production

1. **Database**: Switch to Postgres (update DATABASE_URL)
2. **Email**: Integrate SES/Postmark/Mailgun
3. **Queue**: Add Redis + BullMQ for jobs
4. **Cron**: Schedule /automations/run-due hourly
5. **Mollie**: Add signature validation
6. **UBL/Peppol**: Implement generator + access point
7. **Rate Limiting**: Enable on auth routes
8. **Deploy**: Docker + VPS/cloud

## 🔗 Frontend Integration

```javascript
const API = 'http://localhost:4000';

// Register
const res = await fetch(`${API}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, name })
});
const { user, access, refresh } = await res.json();

// Use access token
const docs = await fetch(`${API}/documents`, {
  headers: { 'Authorization': `Bearer ${access}` }
});
```

## 📊 Database Schema

- **users**: id, email, password_hash, name, role
- **customers**: id, name, email, phone, vat, address_json, tags
- **documents**: id, type, customer_id, status, number, totals_json, pipeline_stage
- **lines**: id, document_id, description, qty, unit_price, vat_perc, totals
- **payments**: id, document_id, provider, status, amount
- **automations**: id, document_id, kind, next_run_at, attempts
- **email_events**: id, document_id, type, provider_msg_id
- **activity_log**: id, document_id, customer_id, kind, message

## ✅ Verified Functionality

- User registration with password hashing ✅
- JWT token generation ✅  
- Document creation with lines ✅
- Follow-up scheduling on send ✅
- Automation processing ✅
- Email event logging ✅
- Payment webhook handling ✅
- Quote to invoice conversion ✅

**Backend is production-ready for development/testing. Ready to connect frontend!**
