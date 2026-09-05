-- Hotfix for "stack depth limit exceeded" during onboarding.
-- Cause: auth_business_id() queried public.users, but that query was itself
-- subject to users' own RLS policy, which called auth_business_id() again —
-- infinite recursion. SECURITY DEFINER makes the function's internal lookup
-- bypass RLS (it runs as the function owner, which Postgres exempts from RLS),
-- breaking the loop.

create or replace function auth_business_id() returns uuid
language sql stable security definer set search_path = public
as $$
  select business_id from public.users where id = auth.uid()
$$;
