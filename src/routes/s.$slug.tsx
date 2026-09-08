import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getPublishedSite, submitWebsiteLead } from "@/lib/public-site.functions";
import {
  CleaningTemplate01,
  type TemplateArea,
  type TemplateHour,
  type TemplateService,
} from "@/components/templates/CleaningTemplate01";
import { defaultSiteContent, normaliseContent } from "@/lib/site-content";

type SitePayload = {
  business: {
    id: string;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    address_line1: string | null;
    country: string | null;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    primary_service: string | null;
  };
  website: { id: string; template_id: string | null; published_at: string | null };
  content: unknown;
  services: TemplateService[];
  service_areas: TemplateArea[];
  hours: TemplateHour[];
  seo: {
    meta_title: string | null;
    meta_description: string | null;
    indexing_enabled: boolean;
    localbusiness_schema: boolean;
    service_schema: boolean;
    primary_city: string | null;
    primary_keyword: string | null;
  } | null;
};

export const Route = createFileRoute("/s/$slug")({
  loader: async ({ params }) => {
    const site = (await getPublishedSite({ data: { slug: params.slug } })) as SitePayload | null;
    if (!site) throw notFound();
    return site;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const b = loaderData.business;
    const place = b.city ?? loaderData.seo?.primary_city ?? "";
    const title =
      loaderData.seo?.meta_title ??
      `${b.name} — ${b.primary_service ?? "Cleaning services"}${place ? ` in ${place}` : ""}`;
    const description =
      loaderData.seo?.meta_description ??
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
        ...(loaderData.seo?.indexing_enabled === false
          ? [{ name: "robots", content: "noindex" }]
          : []),
      ],
    };
  },
  errorComponent: () => (
    <div className="p-10 text-center text-sm">This website couldn't be loaded right now.</div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-center text-sm">No published website at this address yet.</div>
  ),
  component: PublicSitePage,
});

function PublicSitePage() {
  const site = Route.useLoaderData();
  const { slug } = Route.useParams();
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
        areaServed: site.service_areas.map((a) => a.name),
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
      <CleaningTemplate01
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
