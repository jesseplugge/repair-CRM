-- Multi-employee invites: secure invite tokens + acceptance flow.
-- Run in the Supabase SQL editor, or `supabase db push`.

create table invites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  email text not null,
  role text not null default 'employee', -- 'owner' | 'employee'
  token uuid not null default gen_random_uuid(),
  invited_by uuid references users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  unique (token)
);
create index on invites(business_id);

alter table invites enable row level security;

create policy invites_select on invites for select using (business_id = auth_business_id());
create policy invites_insert on invites for insert with check (business_id = auth_business_id());
create policy invites_delete on invites for delete using (business_id = auth_business_id() and accepted_at is null);

-- Public lookup for the invite-acceptance page: a visitor following the link
-- isn't a member of the business yet (or isn't authenticated at all), so the
-- normal auth_business_id()-scoped policy above can't apply. Only exposes
-- what the acceptance screen needs to render, never the token or invite id.
create or replace function get_invite_info(p_token uuid)
returns table (business_name text, email text, role text, valid boolean)
language sql stable security definer set search_path = public
as $$
  select
    coalesce(b.trading_name, b.legal_name),
    i.email,
    i.role,
    (i.accepted_at is null and i.expires_at > now())
  from invites i
  join businesses b on b.id = i.business_id
  where i.token = p_token;
$$;
grant execute on function get_invite_info(uuid) to anon, authenticated;

-- Joins the currently-authenticated user (must already exist in auth.users,
-- e.g. via supabase.auth.signUp with the invited email) to the inviting
-- business, using the role from the invite. Re-validates everything
-- server-side rather than trusting the client: token must be unexpired and
-- unaccepted, the authenticated account's email must match the invite, and
-- that account must not already belong to a business.
create or replace function accept_invite(p_token uuid, p_full_name text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_invite invites%rowtype;
  v_uid uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    raise exception 'Niet ingelogd.';
  end if;

  select * into v_invite from invites where token = p_token for update;
  if not found then
    raise exception 'Uitnodiging niet gevonden.';
  end if;
  if v_invite.accepted_at is not null then
    raise exception 'Deze uitnodiging is al gebruikt.';
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'Deze uitnodiging is verlopen.';
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null or lower(v_email) <> lower(v_invite.email) then
    raise exception 'Dit account hoort niet bij deze uitnodiging.';
  end if;

  if exists (select 1 from users where id = v_uid) then
    raise exception 'Dit account is al aan een bedrijf gekoppeld.';
  end if;

  insert into users (id, business_id, full_name, email, role, active)
  values (v_uid, v_invite.business_id, p_full_name, v_email, v_invite.role, true);

  update invites set accepted_at = now() where id = v_invite.id;
end;
$$;
grant execute on function accept_invite(uuid, text) to authenticated;

-- Previously any authenticated user could INSERT a `users` row for
-- themselves with ANY business_id and role (the old policy only checked
-- `id = auth.uid()`), which would grant them owner-level access to an
-- arbitrary business. The only legitimate ways to create a users row now
-- go through create_business_and_owner or accept_invite above, both
-- `security definer` and so unaffected by RLS — direct client inserts are
-- no longer needed and are now blocked entirely.
drop policy if exists users_insert on users;
