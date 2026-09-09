CREATE OR REPLACE FUNCTION public.get_published_site(p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'description', s.description, 'price_note', s.price_note) order by s.sort_order, s.name)
      from public.services s where s.business_id = b.id
    ), '[]'::jsonb),
    'reviews', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'author_name', r.author_name, 'location', r.location, 'rating', r.rating, 'quote', r.quote, 'source', r.source) order by r.sort_order, r.created_at)
      from public.business_reviews r where r.business_id = b.id
    ), '[]'::jsonb),
    'service_areas', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'city', a.city, 'state', a.state) order by a.is_primary desc, a.city)
      from public.service_areas a where a.business_id = b.id
    ), '[]'::jsonb),
    'hours', coalesce((
      select jsonb_agg(jsonb_build_object('day_of_week', h.day_of_week, 'opens_at', h.opens_at, 'closes_at', h.closes_at, 'is_closed', h.is_closed) order by h.day_of_week)
      from public.business_hours h where h.business_id = b.id
    ), '[]'::jsonb),
    'seo', (
      select jsonb_build_object('meta_title', se.meta_title, 'meta_description', se.meta_description, 'indexing_enabled', se.indexing_enabled, 'localbusiness_schema', se.localbusiness_schema, 'service_schema', se.service_schema, 'primary_city', se.primary_city, 'primary_keyword', se.primary_keyword)
      from public.seo_settings se where se.business_id = b.id limit 1
    )
  ) into result;

  return result;
end;
$function$;