-- Offerto Supabase Schema
-- Plak dit in SQL Editor in je Supabase dashboard

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase Auth heeft al auth.users, dit is voor extra user data)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text,
  phone text,
  vat text,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'BE',
  tags text[] DEFAULT '{}',
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents table
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL CHECK (type IN ('offerte', 'factuur')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
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

-- Document lines table
CREATE TABLE public.document_lines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 21,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  provider text,
  provider_ref text,
  status text,
  amount numeric,
  currency text DEFAULT 'EUR',
  paid_at timestamptz,
  raw_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- Payment events table (for Mollie webhooks)
CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Email events table
CREATE TABLE public.email_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  type text CHECK (type IN ('send', 'open', 'click', 'bounce')),
  provider_msg_id text,
  meta_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- Automations table
CREATE TABLE public.automations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  kind text CHECK (kind IN ('followup', 'reminder')),
  next_run_at timestamptz,
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  channel text CHECK (channel IN ('email', 'sms')),
  template_id text,
  meta_json jsonb,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Activity log table
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  kind text NOT NULL,
  message text,
  meta_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- Products table (for product catalog)
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  unit_price numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 21,
  unit text DEFAULT 'stuks',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Settings table (for company settings like BTW, IBAN, etc.)
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name text,
  company_vat text,
  company_kvk text,
  company_address text,
  company_city text,
  company_postal_code text,
  company_country text DEFAULT 'BE',
  company_phone text,
  company_email text,
  company_website text,
  company_iban text,
  company_bic text,
  payment_terms_days integer DEFAULT 14,
  quote_validity_days integer DEFAULT 30,
  mollie_api_key text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Customers policies
CREATE POLICY "Users can view own customers" ON public.customers
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create own customers" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own customers" ON public.customers
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own customers" ON public.customers
  FOR DELETE USING (auth.uid() = owner_id);

-- Documents policies
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Document lines policies (via document ownership)
CREATE POLICY "Users can view own document lines" ON public.document_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_lines.document_id
      AND documents.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can manage own document lines" ON public.document_lines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_lines.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = payments.document_id
      AND documents.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can manage own payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = payments.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Payment events policies
CREATE POLICY "Users can view own payment events" ON public.payment_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.payments p
      JOIN public.documents d ON d.id = p.document_id
      WHERE p.id = payment_events.payment_id
      AND d.user_id = auth.uid()
    )
  );

-- Email events policies
CREATE POLICY "Users can view own email events" ON public.email_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = email_events.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Automations policies
CREATE POLICY "Users can view own automations" ON public.automations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = automations.document_id
      AND documents.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can manage own automations" ON public.automations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = automations.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Activity log policies
CREATE POLICY "Users can view own activity" ON public.activity_log
  FOR SELECT USING (auth.uid() = actor_id);
CREATE POLICY "Users can create activity" ON public.activity_log
  FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- Products policies
CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own products" ON public.products
  FOR ALL USING (auth.uid() = user_id);

-- Settings policies
CREATE POLICY "Users can view own settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own settings" ON public.settings
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_customers_owner_id ON public.customers(owner_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_customer_id ON public.documents(customer_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_document_lines_document_id ON public.document_lines(document_id);
CREATE INDEX idx_payments_document_id ON public.payments(document_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_automations_next_run_at ON public.automations(next_run_at) WHERE enabled = true;
CREATE INDEX idx_activity_log_actor_id ON public.activity_log(actor_id);
CREATE INDEX idx_activity_log_document_id ON public.activity_log(document_id);

-- Done! Your Offerto database is ready 🚀
