-- RepairOS brief, phase 1 + deeper CRM: photos, diagnostics, warranty claims,
-- stock movement log. Run in the Supabase SQL editor, or `supabase db push`.

-- ============================================================================
-- REPAIR PHOTOS
-- ============================================================================

create table repair_photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  repair_id uuid not null references repairs(id) on delete cascade,
  storage_path text not null,
  label text, -- 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'damage' | null
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on repair_photos(repair_id);
alter table repair_photos enable row level security;
create policy repair_photos_all on repair_photos for all
  using (business_id = auth_business_id()) with check (business_id = auth_business_id());

-- Private bucket — repair photos can show a customer's device/screen content,
-- unlike the public logos bucket. Access is via short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('repair-photos', 'repair-photos', false)
on conflict (id) do nothing;

create policy "Businesses manage their own repair photos"
  on storage.objects for all
  using (bucket_id = 'repair-photos' and (storage.foldername(name))[1] = auth_business_id()::text)
  with check (bucket_id = 'repair-photos' and (storage.foldername(name))[1] = auth_business_id()::text);

-- ============================================================================
-- DIAGNOSTICS
-- ============================================================================

create table diagnostic_profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  items text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table diagnostic_profiles enable row level security;
create policy diagnostic_profiles_all on diagnostic_profiles for all
  using (business_id = auth_business_id()) with check (business_id = auth_business_id());

create table repair_diagnostics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  repair_id uuid not null references repairs(id) on delete cascade,
  stage text not null, -- 'pre' | 'post'
  item text not null,
  result text not null default 'not_tested', -- 'pass' | 'fail' | 'not_tested' | 'na'
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (repair_id, stage, item)
);
create index on repair_diagnostics(repair_id);
alter table repair_diagnostics enable row level security;
create policy repair_diagnostics_all on repair_diagnostics for all
  using (business_id = auth_business_id()) with check (business_id = auth_business_id());

-- ============================================================================
-- WARRANTY CLAIMS
-- ============================================================================

create table warranty_claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  repair_id uuid not null references repairs(id) on delete cascade,
  claim_number text not null,
  description text not null,
  status text not null default 'new', -- new|investigating|approved|rejected|repairing|resolved
  resolution text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on warranty_claims(repair_id);
alter table warranty_claims enable row level security;
create policy warranty_claims_all on warranty_claims for all
  using (business_id = auth_business_id()) with check (business_id = auth_business_id());

-- ============================================================================
-- STOCK MOVEMENTS
-- ============================================================================

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  change numeric(10,2) not null, -- positive = in, negative = out
  reason text not null, -- 'manual' | 'pos_sale' | 'correction'
  related_pos_sale_id uuid references pos_sales(id) on delete set null,
  related_repair_id uuid references repairs(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on stock_movements(product_id);
alter table stock_movements enable row level security;
create policy stock_movements_all on stock_movements for all
  using (business_id = auth_business_id()) with check (business_id = auth_business_id());

-- ============================================================================
-- SEED: default diagnostic profile for new AND existing businesses
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

  insert into diagnostic_profiles (business_id, name, items) values
    (new.id, 'Telefoon', array[
      'Beeldscherm', 'Touch', 'Face ID / Touch ID', 'Camera voor', 'Camera achter',
      'Flitser', 'Speaker', 'Microfoon', 'Oorspeaker', 'Opladen', 'Wifi',
      'Bluetooth', 'Mobiel netwerk', 'Nabijheidssensor', 'Knoppen', 'Draadloos opladen'
    ]);

  return new;
end $$;

insert into diagnostic_profiles (business_id, name, items)
select id, 'Telefoon', array[
  'Beeldscherm', 'Touch', 'Face ID / Touch ID', 'Camera voor', 'Camera achter',
  'Flitser', 'Speaker', 'Microfoon', 'Oorspeaker', 'Opladen', 'Wifi',
  'Bluetooth', 'Mobiel netwerk', 'Nabijheidssensor', 'Knoppen', 'Draadloos opladen'
]
from businesses
where not exists (select 1 from diagnostic_profiles where diagnostic_profiles.business_id = businesses.id);
