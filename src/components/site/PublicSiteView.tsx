import { useServerFn } from "@tanstack/react-start";
import { submitWebsiteLead, type PublishedSite } from "@/lib/public-site.functions";
import { LocalBusinessTemplate } from "@/components/templates/LocalBusinessTemplate";
import { defaultSiteContent, normaliseContent } from "@/lib/site-content";

export function publicSiteMeta(site: PublishedSite | null | undefined) {
  if (!site) return {};
  const b = site.business;
  const place = b.city ?? site.seo?.primary_city ?? "";
  const title =
    site.seo?.meta_title ??
    `${b.name} — ${b.primary_service ?? "Cleaning services"}${place ? ` in ${place}` : ""}`;
  const description =
    site.seo?.meta_description ??
    b.tagline ??
    `${b.name} provides ${b.primary_service ?? "cleaning"} services${place ? ` in ${place}` : ""}. Get a free quote today.`;
  return {
    meta: [
      { title: title.slice(0, 60) },
      { name: "description", content: description.slice(0, 158) },
      { property: "og:title", content: title.slice(0, 60) },
      { property: "og:description", content: description.slice(0, 158) },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(site.seo?.indexing_enabled === false
        ? [{ name: "robots", content: "noindex" }]
        : []),
    ],
  };
}

export function PublicSiteView({ site, slug }: { site: PublishedSite; slug: string }) {
  const send = useServerFn(submitWebsiteLead);
  const b = site.business;

  const content = normaliseContent(
    site.content,
    defaultSiteContent({
      businessName: b.name,
      city: b.city,
      primaryService: b.primary_service,
      primaryColor: b.primary_color,
      logoUrl: b.logo_url,
    }),
  );

  const schema = site.seo?.localbusiness_schema
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: b.name,
        description: b.description ?? b.tagline ?? undefined,
        telephone: b.phone ?? undefined,
        email: b.email ?? undefined,
        address: {
          "@type": "PostalAddress",
          streetAddress: b.address_line1 ?? undefined,
          addressLocality: b.city ?? undefined,
          addressRegion: b.state ?? undefined,
          postalCode: b.postal_code ?? undefined,
          addressCountry: b.country ?? undefined,
        },
        areaServed: site.service_areas.map((a) => a.city),
      }
    : null;

  return (
    <>
      {schema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ) : null}
      <LocalBusinessTemplate
        business={b}
        content={content}
        services={site.services}
        areas={site.service_areas}
        hours={site.hours}
        onSubmitLead={async (values) => {
          await send({ data: { slug, ...values } });
        }}
      />
    </>
  );
}
