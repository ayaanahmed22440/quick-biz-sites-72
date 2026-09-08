INSERT INTO public.plans (id, name, tagline, price_cents, sort_order, entitlements, is_active)
SELECT p.id || '_yearly',
       p.name || ' (yearly)',
       p.tagline,
       p.price_cents * 10,
       p.sort_order + 10,
       p.entitlements,
       true
FROM public.plans p
WHERE p.id IN ('basic','seo','premium')
ON CONFLICT (id) DO NOTHING;