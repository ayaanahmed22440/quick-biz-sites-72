-- Public read of published websites + public lead capture, without exposing draft content.

create or replace function public.get_published_site(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  b public.businesses%rowtype;
  w public.websites%rowtype;
  result jsonb;
begin
  select * into b from public.businesses where slug = p_slug and suspended = false;
  if not found then
    return null;
  end if;

  select * into w from public.websites where business_id = b.id and status = 'published' order by published_at desc nulls last limit 1;
  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'business', jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'slug', b.slug,
      'tagline', b.tagline,
      'description', b.description,
      'phone', b.phone,
      'email', b.email,
      'city', b.city,
      'state', b.state,
      'postal_code', b.postal_code,
      'address_line1', b.address_line1,
      'country', b.country,
      'logo_url', b.logo_url,
      'primary_color', b.primary_color,
      'secondary_color', b.secondary_color,
      'primary_service', b.primary_service
    ),
    'website', jsonb_build_object(
      'id', w.id,
      'template_id', w.template_id,
      'published_at', w.published_at
    ),
    'content', (
      select c.published_content from public.website_customizations c
      where c.website_id = w.id limit 1
    ),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'description', s.description, 'price_from', s.price_from) order by s.sort_order, s.name)
      from public.services s where s.business_id = b.id
    ), '[]'::jsonb),
    'service_areas', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name) order by a.name)
      from public.service_areas a where a.business_id = b.id
    ), '[]'::jsonb),
    'hours', coalesce((
      select jsonb_agg(jsonb_build_object('day_of_week', h.day_of_week, 'opens_at', h.opens_at, 'closes_at', h.closes_at, 'closed', h.closed) order by h.day_of_week)
      from public.business_hours h where h.business_id = b.id
    ), '[]'::jsonb),
    'seo', (
      select jsonb_build_object('meta_title', se.meta_title, 'meta_description', se.meta_description, 'indexing_enabled', se.indexing_enabled, 'localbusiness_schema', se.localbusiness_schema, 'service_schema', se.service_schema, 'primary_city', se.primary_city, 'primary_keyword', se.primary_keyword)
      from public.seo_settings se where se.business_id = b.id limit 1
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_published_site(text) from public;
grant execute on function public.get_published_site(text) to anon, authenticated, service_role;

create or replace function public.submit_website_lead(
  p_slug text,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_service text default null,
  p_preferred_time text default null,
  p_message text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_lead_id uuid;
begin
  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'Name is required';
  end if;
  if (p_email is null or length(btrim(p_email)) = 0) and (p_phone is null or length(btrim(p_phone)) = 0) then
    raise exception 'An email address or phone number is required';
  end if;

  select b.id into v_business_id
  from public.businesses b
  join public.websites w on w.business_id = b.id and w.status = 'published'
  where b.slug = p_slug and b.suspended = false
  limit 1;

  if v_business_id is null then
    raise exception 'Site not found';
  end if;

  insert into public.leads (business_id, name, email, phone, service, preferred_time, message, source)
  values (
    v_business_id,
    left(btrim(p_name), 120),
    nullif(left(btrim(coalesce(p_email, '')), 200), ''),
    nullif(left(btrim(coalesce(p_phone, '')), 40), ''),
    nullif(left(btrim(coalesce(p_service, '')), 120), ''),
    nullif(left(btrim(coalesce(p_preferred_time, '')), 120), ''),
    nullif(left(btrim(coalesce(p_message, '')), 2000), ''),
    'website'
  )
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

revoke all on function public.submit_website_lead(text, text, text, text, text, text, text) from public;
grant execute on function public.submit_website_lead(text, text, text, text, text, text, text) to anon, authenticated, service_role;