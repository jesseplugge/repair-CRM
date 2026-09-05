-- Reparatie CRM/POS — increment 2 schema
-- Payments ledger, POS, invoices, receipts, credit notes, cash register, §15A signatures.

-- ============================================================================
-- PAYMENTS & REFUNDS
-- ============================================================================

create table payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  customer_id uuid references customers(id),
  repair_id uuid references repairs(id),
  invoice_id uuid, -- FK added after invoices is created below
  pos_sale_id uuid, -- FK added after pos_sales is created below
  amount numeric(10,2) not null,
  method text not null, -- contant | pin | bankoverschrijving
  paid_at timestamptz not null default now(),
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);
create index on payments(business_id);
create index on payments(repair_id);
create index on payments(invoice_id);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  original_payment_id uuid not null references payments(id),
  amount numeric(10,2) not null,
  reason text,
  method text not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- POS (standalone sales)
-- ============================================================================

create table pos_sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  sale_number text not null,
  customer_id uuid references customers(id),
  status text not null default 'open', -- open | paid | partial | unpaid | cancelled
  subtotal_excl_vat numeric(10,2) not null default 0,
  total_vat numeric(10,2) not null default 0,
  total_incl_vat numeric(10,2) not null default 0,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  unique (business_id, sale_number)
);

create table pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  pos_sale_id uuid not null references pos_sales(id) on delete cascade,
  product_id uuid references products(id),
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price_excl_vat numeric(10,2) not null,
  vat_rate numeric(4,2) not null,
  discount numeric(10,2) default 0,
  total_excl_vat numeric(10,2) not null,
  total_incl_vat numeric(10,2) not null
);

alter table payments add constraint payments_pos_sale_id_fkey foreign key (pos_sale_id) references pos_sales(id);
create index on payments(pos_sale_id);

-- ============================================================================
-- INVOICES & CREDIT NOTES
-- ============================================================================

create table invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  invoice_number text not null,
  customer_id uuid not null references customers(id),
  repair_id uuid references repairs(id),
  pos_sale_id uuid references pos_sales(id),
  status text not null default 'draft', -- draft|sent|paid|partially_paid|overdue|cancelled
  invoice_date date not null default current_date,
  service_date date,
  payment_terms_days int default 14,
  subtotal_excl_vat numeric(10,2) not null,
  total_vat numeric(10,2) not null,
  total_incl_vat numeric(10,2) not null,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  unique (business_id, invoice_number)
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price_excl_vat numeric(10,2) not null,
  vat_rate numeric(4,2) not null,
  vat_amount numeric(10,2) not null,
  total_excl_vat numeric(10,2) not null,
  total_incl_vat numeric(10,2) not null
);

alter table payments add constraint payments_invoice_id_fkey_real foreign key (invoice_id) references invoices(id);

create table credit_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  credit_note_number text not null,
  original_invoice_id uuid not null references invoices(id),
  amount_excl_vat numeric(10,2) not null,
  vat_amount numeric(10,2) not null,
  amount_incl_vat numeric(10,2) not null,
  reason text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  unique (business_id, credit_note_number)
);

-- ============================================================================
-- RECEIPTS & TEMPLATES
-- ============================================================================

create table receipts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  receipt_number text not null,
  type text not null, -- pos_sale | repair_completion | intake
  format text not null default 'a4', -- a4 | a5 | thermal80 | thermal58
  customer_id uuid references customers(id),
  repair_id uuid references repairs(id),
  pos_sale_id uuid references pos_sales(id),
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  unique (business_id, receipt_number)
);

create table document_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  type text not null,   -- receipt | invoice | dropoff | completion | credit_note
  format text not null, -- a4 | a5 | thermal80 | thermal58
  content jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

-- ============================================================================
-- CASH REGISTER
-- ============================================================================

create table cash_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  opened_by uuid references users(id), opened_at timestamptz not null default now(),
  opening_amount numeric(10,2) not null,
  closed_by uuid references users(id), closed_at timestamptz,
  closing_amount_expected numeric(10,2),
  closing_amount_actual numeric(10,2),
  difference numeric(10,2),
  notes text
);

create table cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid not null references cash_sessions(id) on delete cascade,
  type text not null, -- sale | refund | withdrawal | deposit
  amount numeric(10,2) not null,
  related_payment_id uuid references payments(id),
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- §15A — TERMS & SIGNATURES
-- ============================================================================

create table terms_versions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  document_type text not null, -- algemene_voorwaarden | reparatievoorwaarden | privacy
  version_label text not null,
  content text not null,
  effective_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index one_active_terms_per_type on terms_versions(business_id, document_type) where is_active;

create table intake_signatures (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  repair_id uuid not null references repairs(id),
  customer_id uuid not null references customers(id),
  device_id uuid not null references devices(id),
  signed_by_user_id uuid references users(id),
  signature_image text not null,
  signed_at timestamptz not null default now(),
  ip_address inet,
  checkbox_confirmed boolean not null,
  terms_accepted jsonb not null,
  estimated_price_at_signing numeric(10,2),
  device_condition_snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index on intake_signatures(repair_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table payments enable row level security;
alter table refunds enable row level security;
alter table pos_sales enable row level security;
alter table pos_sale_items enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table credit_notes enable row level security;
alter table receipts enable row level security;
alter table document_templates enable row level security;
alter table cash_sessions enable row level security;
alter table cash_movements enable row level security;
alter table terms_versions enable row level security;
alter table intake_signatures enable row level security;

create policy payments_all on payments for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy refunds_all on refunds for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy pos_sales_all on pos_sales for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy invoices_all on invoices for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy credit_notes_all on credit_notes for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy receipts_all on receipts for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy document_templates_all on document_templates for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy cash_sessions_all on cash_sessions for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy terms_versions_all on terms_versions for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy intake_signatures_all on intake_signatures for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());

create policy pos_sale_items_all on pos_sale_items for all
  using (pos_sale_id in (select id from pos_sales where business_id = auth_business_id()))
  with check (pos_sale_id in (select id from pos_sales where business_id = auth_business_id()));

create policy invoice_items_all on invoice_items for all
  using (invoice_id in (select id from invoices where business_id = auth_business_id()))
  with check (invoice_id in (select id from invoices where business_id = auth_business_id()));

create policy cash_movements_all on cash_movements for all
  using (cash_session_id in (select id from cash_sessions where business_id = auth_business_id()))
  with check (cash_session_id in (select id from cash_sessions where business_id = auth_business_id()));

-- ============================================================================
-- SEED: default Algemene Voorwaarden placeholder + payment methods already
-- seeded in 0001. Business owner should replace this via Instellingen.
-- ============================================================================

create or replace function seed_business_defaults_v2() returns trigger
language plpgsql as $$
begin
  insert into terms_versions (business_id, document_type, version_label, content, effective_date, is_active)
  values (
    new.id, 'algemene_voorwaarden', 'v1.0',
    'Vul je eigen Algemene Voorwaarden in via Instellingen → Algemene Voorwaarden. Dit is een placeholdertekst.',
    current_date, true
  );
  return new;
end $$;

create trigger trg_seed_business_defaults_v2
  after insert on businesses
  for each row execute function seed_business_defaults_v2();
