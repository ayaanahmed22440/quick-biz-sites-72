create or replace function public.list_published_site_slugs()
returns table (slug text, published_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select b.slug, w.published_at
  from public.businesses b
  join public.websites w on w.business_id = b.id and w.status = 'published'
  left join public.seo_settings s on s.business_id = b.id
  where b.suspended = false
    and coalesce(s.sitemap_enabled, true) = true
    and coalesce(s.indexing_enabled, true) = true;
$$;

revoke all on function public.list_published_site_slugs() from public;
grant execute on function public.list_published_site_slugs() to anon, authenticated, service_role;