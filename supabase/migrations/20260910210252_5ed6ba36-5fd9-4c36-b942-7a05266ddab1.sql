-- 1. Unpublished template configs must not be readable by every signed-in user.
drop policy if exists "tversions_read" on public.template_versions;
create policy "tversions_read_published_or_staff"
on public.template_versions
for select
to authenticated
using (
  is_platform_staff(auth.uid())
  or exists (
    select 1 from public.templates t
    where t.id = template_versions.template_id
      and t.status = 'published'::template_status
  )
);

-- 2. Abuse throttling store. Written only by trusted server code.
create table if not exists public.rate_limit_hits (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  subject text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limit_hits_lookup
  on public.rate_limit_hits (bucket, subject, created_at desc);

grant all on public.rate_limit_hits to service_role;
alter table public.rate_limit_hits enable row level security;
-- No anon/authenticated policies: only service_role may touch it.

-- 3. Public contact form must go through the validated, rate-limited server path.
drop policy if exists "contact_insert_anyone" on public.contact_messages;
revoke insert on public.contact_messages from anon;
revoke insert on public.contact_messages from authenticated;