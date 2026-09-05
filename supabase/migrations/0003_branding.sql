-- Branding: accent color + logo upload storage.

alter table businesses add column if not exists accent_color text not null default '#0C7C82';

-- Public-read storage bucket for business logos. Public read is required so
-- logos load in <img> tags and in generated PDFs without a signed URL; write
-- access is still scoped per business below.
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Files are stored at "<business_id>/logo.<ext>" — policies check that the
-- first path segment matches the caller's own business.
create policy "Logos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "Businesses upload their own logo"
  on storage.objects for insert
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth_business_id()::text);

create policy "Businesses update their own logo"
  on storage.objects for update
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth_business_id()::text);

create policy "Businesses delete their own logo"
  on storage.objects for delete
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth_business_id()::text);
