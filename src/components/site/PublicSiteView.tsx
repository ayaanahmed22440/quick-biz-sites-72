import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitWebsiteLead, type PublishedSite } from "@/lib/public-site.functions";
import { LocalBusinessTemplate } from "@/components/templates/LocalBusinessTemplate";
import { ManualSiteBanner } from "@/components/site/ManualSiteBanner";
import { defaultSiteContent, normaliseContent } from "@/lib/site-content";

export function publicSiteMeta(
  site: PublishedSite | null | undefined,
  slug?: string,
  canonicalUrl?: string,
) {
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
    links: canonicalUrl || slug
      ? [{ rel: "canonical", href: canonicalUrl ?? `https://www.webwarheads.com/${slug}` }]
      : [],
  };
}

export function PublicSiteView({ site, slug }: { site: PublishedSite; slug: string }) {
  const send = useServerFn(submitWebsiteLead);
  const b = site.business;

  // Set after hydration so the server and client render the same first pass.
  const [justPaid, setJustPaid] = useState(false);
  useEffect(() => {
    setJustPaid(new URLSearchParams(window.location.search).get("paid") === "1");
  }, []);

  // Swap the tab icon to the customer's own logo while their site is shown,
  // so their browser tab never displays the WebWarheads mark.
  useEffect(() => {
    const logo = b.logo_url;
    if (!logo) return;
    const href = logo.startsWith("/") ? `${window.location.origin}${logo}` : logo;
    const removed: HTMLLinkElement[] = [];
    document
      .querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
      .forEach((el) => {
        removed.push(el);
        el.remove();
      });
    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.href = href;
    const apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    apple.href = href;
    document.head.append(icon, apple);
    return () => {
      icon.remove();
      apple.remove();
      removed.forEach((el) => document.head.appendChild(el));
    };
  }, [b.logo_url]);

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
      {site.manual && site.manual.status !== "paid" ? (
        <ManualSiteBanner
          manualId={site.manual.id}
          expiresAt={site.manual.expires_at}
          paidJustNow={justPaid}
        />
      ) : null}
      {schema ? (
        <script
          type="application/ld+json"
          // Customer-entered text goes into this block, so angle brackets are
          // escaped: nobody can close the script tag and inject markup.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema)
              .replace(/</g, "\\u003c")
              .replace(/>/g, "\\u003e")
              .replace(/&/g, "\\u0026"),
          }}
        />
      ) : null}
      <LocalBusinessTemplate
        business={b}
        content={content}
        services={site.services}
        areas={site.service_areas}
        hours={site.hours}
        reviews={site.reviews ?? []}
        onSubmitLead={async (values) => {
          await send({ data: { slug, ...values } });
        }}
      />
    </>
  );
}
