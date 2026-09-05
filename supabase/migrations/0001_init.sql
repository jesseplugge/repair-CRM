-- Reparatie CRM/POS — initial schema
-- Run via `supabase db push`, or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. TENANCY & USERS
-- ============================================================================

create table businesses (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trading_name text,
  address text, postcode text, city text,
  phone text, email text, website text,
  kvk_number text,
  vat_number text,
  iban text,
  logo_url text,
  default_vat_rate numeric(4,2) not null default 21.00,
  default_warranty_months int not null default 3,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references businesses(id),
  full_name text not null,
  email text not null,
  role text not null default 'owner', -- 'owner' | 'employee'
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on users(business_id);

create or replace function auth_business_id() returns uuid
language sql stable security definer set search_path = public
as $$
  select business_id from public.users where id = auth.uid()
$$;

-- Atomic onboarding: creates the business and links the calling user as
-- owner in one privileged operation. Needed because the businesses_select
-- RLS policy depends on a `users` row existing — which doesn't exist yet
-- during onboarding — so two separate client-side inserts fail on the
-- RETURNING clause (Postgres checks RETURNING against the SELECT policy).
create or replace function create_business_and_owner(
  p_legal_name text,
  p_trading_name text,
  p_address text,
  p_postcode text,
  p_city text,
  p_phone text,
  p_email text,
  p_kvk_number text,
  p_vat_number text,
  p_iban text,
  p_full_name text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_business_id uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from public.users where id = auth.uid()) then
    raise exception 'this account is already linked to a business';
  end if;

  select coalesce(p_email, email) into v_email from auth.users where id = auth.uid();

  insert into businesses (legal_name, trading_name, address, postcode, city, phone, email, kvk_number, vat_number, iban)
  values (p_legal_name, p_trading_name, p_address, p_postcode, p_city, p_phone, p_email, p_kvk_number, p_vat_number, p_iban)
  returning id into v_business_id;

  insert into users (id, business_id, full_name, email, role)
  values (auth.uid(), v_business_id, p_full_name, v_email, 'owner');

  return v_business_id;
end;
$$;

grant execute on function create_business_and_owner to authenticated;

-- ============================================================================
-- 2. NUMBERING
-- ============================================================================

create table numbering_sequences (
  business_id uuid not null references businesses(id),
  sequence_type text not null,
  year int not null,
  prefix text not null,
  current_value int not null default 0,
  primary key (business_id, sequence_type, year)
);

create or replace function next_number(p_business_id uuid, p_type text, p_year int, p_prefix text, p_pad int)
returns text language plpgsql as $$
declare v int;
begin
  insert into numbering_sequences (business_id, sequence_type, year, prefix, current_value)
    values (p_business_id, p_type, p_year, p_prefix, 0)
    on conflict (business_id, sequence_type, year) do nothing;

  update numbering_sequences
    set current_value = current_value + 1
    where business_id = p_business_id and sequence_type = p_type and year = p_year
    returning current_value into v;

  return p_prefix || case when p_year > 0 then p_year || '-' else '' end || lpad(v::text, p_pad, '0');
end $$;

-- ============================================================================
-- 3. CRM — CUSTOMERS & DEVICES
-- ============================================================================

create table customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  customer_number text not null,
  first_name text not null, last_name text not null,
  company_name text,
  phone text, email text,
  address text, postcode text, city text,
  notes text,
  customer_since date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, customer_number)
);
create index on customers(business_id);
create index on customers(business_id, phone);
create index on customers(business_id, lower(email));

create table devices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  customer_id uuid not null references customers(id) on delete cascade,
  brand text not null, model text not null,
  imei text,
  serial_number text,
  color text, storage_capacity text,
  passcode text,
  condition_notes text, existing_damage text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on devices(customer_id);
create index on devices(business_id, imei);

-- ============================================================================
-- 4. PRODUCTS & CATALOGUE (created before repairs — repair_items references them)
-- ============================================================================

create table product_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  name text not null, parent_id uuid references product_categories(id)
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  name text not null, contact_name text, phone text, email text, notes text
);

create table products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  name text not null, sku text,
  category_id uuid references product_categories(id),
  supplier_id uuid references suppliers(id),
  purchase_price_excl_vat numeric(10,2) default 0,
  selling_price_excl_vat numeric(10,2) not null,
  vat_rate numeric(4,2) not null default 21.00,
  stock_quantity numeric(10,2) not null default 0,
  minimum_stock numeric(10,2) default 0,
  supplier_sku text, notes text,
  active boolean not null default true
);
create unique index products_sku_uniq on products(business_id, sku) where sku is not null;

create table catalog_repair_types (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  name text not null,
  category text, brand text, model text,
  description text,
  selling_price numeric(10,2) not null,
  vat_rate numeric(4,2) not null default 21.00,
  default_product_id uuid references products(id),
  part_cost numeric(10,2) default 0,
  labour_price numeric(10,2) default 0,
  estimated_duration_minutes int,
  warranty_months int,
  active boolean not null default true
);
create index on catalog_repair_types(business_id, brand, model);

-- ============================================================================
-- 5. REPAIRS
-- ============================================================================

create table repair_statuses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  name text not null,
  sort_order int not null,
  color text,
  is_terminal boolean not null default false,
  active boolean not null default true
);

create table repairs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  repair_number text not null,
  customer_id uuid not null references customers(id),
  device_id uuid not null references devices(id),
  status_id uuid not null references repair_statuses(id),

  repair_type_label text,
  description text, customer_complaint text, technician_notes text,
  device_condition_snapshot jsonb,

  estimated_price numeric(10,2), final_price numeric(10,2),
  parts_cost numeric(10,2) default 0, labour_cost numeric(10,2) default 0,

  date_received timestamptz not null default now(),
  expected_completion_date date,
  date_completed timestamptz,
  date_picked_up timestamptz,

  warranty_months int, warranty_start date, warranty_end date,

  payment_status text not null default 'open',
  payment_method text,

  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, repair_number)
);
create index on repairs(business_id, status_id);
create index on repairs(customer_id);

create table repair_items (
  id uuid primary key default gen_random_uuid(),
  repair_id uuid not null references repairs(id) on delete cascade,
  item_type text not null, -- part | labour | service | product | custom
  product_id uuid references products(id),
  catalog_repair_type_id uuid references catalog_repair_types(id),
  description text not null,
  quantity numeric(10,2) not null default 1,
  cost_price_excl_vat numeric(10,2) default 0,
  selling_price_excl_vat numeric(10,2) not null,
  vat_rate numeric(4,2) not null,
  discount numeric(10,2) default 0,
  total_excl_vat numeric(10,2) not null,
  total_incl_vat numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index on repair_items(repair_id);

-- ============================================================================
-- 6. ACTIVITY LOG (repair timeline + audit trail)
-- ============================================================================

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  description text not null,
  old_value jsonb, new_value jsonb,
  performed_by uuid references users(id),
  created_at timestamptz not null default now()
);
create index on activity_logs(business_id, entity_type, entity_id, created_at);

-- ============================================================================
-- 7. SETTINGS
-- ============================================================================

create table settings (
  business_id uuid not null references businesses(id),
  key text not null,
  value jsonb not null,
  primary key (business_id, key)
);

-- ============================================================================
-- SEED DEFAULTS ON NEW BUSINESS
-- ============================================================================

create or replace function seed_business_defaults() returns trigger
language plpgsql as $$
begin
  insert into repair_statuses (business_id, name, sort_order, color, is_terminal) values
    (new.id, 'Nieuw', 1, '#4C5FD5', false),
    (new.id, 'Wacht op akkoord', 2, '#C97A22', false),
    (new.id, 'In behandeling', 3, '#0C7C82', false),
    (new.id, 'Wacht op onderdeel', 4, '#C97A22', false),
    (new.id, 'Wacht op klant', 5, '#C97A22', false),
    (new.id, 'Gereed', 6, '#2F8F5B', false),
    (new.id, 'Opgehaald', 7, '#495164', true),
    (new.id, 'Geannuleerd', 8, '#C4453A', true);

  insert into settings (business_id, key, value) values
    (new.id, 'vat_rates', '[21, 9, 0]'::jsonb),
    (new.id, 'payment_methods', '["contant", "pin", "bankoverschrijving"]'::jsonb),
    (new.id, 'receipt_format', '"a4"'::jsonb);

  return new;
end $$;

create trigger trg_seed_business_defaults
  after insert on businesses
  for each row execute function seed_business_defaults();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table businesses enable row level security;
alter table users enable row level security;
alter table customers enable row level security;
alter table devices enable row level security;
alter table product_categories enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table catalog_repair_types enable row level security;
alter table repair_statuses enable row level security;
alter table repairs enable row level security;
alter table repair_items enable row level security;
alter table activity_logs enable row level security;
alter table settings enable row level security;
alter table numbering_sequences enable row level security;

-- businesses: readable/updatable once linked; insertable by any authenticated
-- user during onboarding (they immediately link themselves via `users`).
create policy businesses_select on businesses for select using (id = auth_business_id());
create policy businesses_update on businesses for update using (id = auth_business_id());
create policy businesses_insert on businesses for insert with check (auth.uid() is not null);

-- users: can only ever create/see the row that is themself / their business.
create policy users_select on users for select using (business_id = auth_business_id());
create policy users_insert on users for insert with check (id = auth.uid());
create policy users_update on users for update using (business_id = auth_business_id());

-- generic tenant-isolation policy, repeated per table
create policy customers_all on customers for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy devices_all on devices for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy product_categories_all on product_categories for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy suppliers_all on suppliers for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy products_all on products for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy catalog_repair_types_all on catalog_repair_types for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy repair_statuses_all on repair_statuses for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy repairs_all on repairs for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy activity_logs_all on activity_logs for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy settings_all on settings for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());
create policy numbering_sequences_all on numbering_sequences for all using (business_id = auth_business_id()) with check (business_id = auth_business_id());

-- repair_items has no business_id column directly — scope through the parent repair.
create policy repair_items_all on repair_items for all
  using (repair_id in (select id from repairs where business_id = auth_business_id()))
  with check (repair_id in (select id from repairs where business_id = auth_business_id()));

-- ============================================================================
-- NOTE: invoices, payments, receipts, refunds, credit_notes, pos_sales,
-- terms_versions, intake_signatures, cash_sessions, document_templates are
-- specified in full in database-schema.md and will ship in the next
-- migration alongside the POS/invoicing/signature UI.
-- ============================================================================
