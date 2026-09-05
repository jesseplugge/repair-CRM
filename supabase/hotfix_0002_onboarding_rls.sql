-- Hotfix for "new row violates row-level security policy for table businesses"
-- during onboarding.
--
-- Cause: Postgres checks a table's SELECT policy against rows returned by
-- RETURNING (which Supabase's .insert().select() relies on) — not just the
-- INSERT policy. businesses_select requires a matching `users` row to exist
-- (via auth_business_id()), but that row is only created in a *second*
-- insert right after — so the first insert's RETURNING fails.
--
-- Fix: do both inserts atomically inside one SECURITY DEFINER function,
-- which bypasses RLS entirely for this bootstrap operation.

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
