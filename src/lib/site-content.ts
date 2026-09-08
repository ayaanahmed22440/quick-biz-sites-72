/**
 * Content model for WebWarheads templates.
 *
 * Templates are approved, human-reviewed designs. The customer never generates
 * a website; they fill in this content and pick their brand colour, and the
 * template renders it. Draft and published copies are stored separately.
 */

export type SiteContent = {
  templateId: "cleaning-01";
  brand: {
    /** Hex colour, taken from the customer's own logo. */
    primaryColor: string;
    logoUrl: string | null;
  };
  hero: {
    headline: string;
    subheadline: string;
    primaryCta: string;
    trustPoints: string[];
  };
  about: {
    heading: string;
    body: string;
  };
  services: {
    heading: string;
    intro: string;
  };
  areas: {
    heading: string;
    intro: string;
  };
  quote: {
    heading: string;
    intro: string;
    responseNote: string;
  };
  contact: {
    heading: string;
    note: string;
  };
};

export const DEFAULT_PRIMARY_COLOR = "#1f6feb";

export function defaultSiteContent(input: {
  businessName: string;
  city?: string | null;
  primaryService?: string | null;
  primaryColor?: string | null;
  logoUrl?: string | null;
}): SiteContent {
  const place = input.city?.trim() ? input.city.trim() : "your area";
  const service = input.primaryService?.trim() ? input.primaryService.trim() : "cleaning";

  return {
    templateId: "cleaning-01",
    brand: {
      primaryColor: input.primaryColor || DEFAULT_PRIMARY_COLOR,
      logoUrl: input.logoUrl ?? null,
    },
    hero: {
      headline: `${service.charAt(0).toUpperCase()}${service.slice(1)} you can rely on in ${place}`,
      subheadline: `${input.businessName} takes care of the cleaning so you don't have to. Tell us what you need and we'll come back with a straight price.`,
      primaryCta: "Get a free quote",
      trustPoints: ["Insured and vetted cleaners", "Clear fixed pricing", "Local, family-run team"],
    },
    about: {
      heading: `About ${input.businessName}`,
      body: `We're a ${place}-based cleaning team. Write a few honest sentences here about who you are, how long you've been cleaning, and what customers can expect when you turn up.`,
    },
    services: {
      heading: "What we clean",
      intro: "Every job is quoted properly. No surprise charges at the end.",
    },
    areas: {
      heading: "Areas we cover",
      intro: `We work across ${place} and the surrounding towns.`,
    },
    quote: {
      heading: "Get your free quote",
      intro: "Tell us what needs cleaning and when suits you. We'll reply with a price.",
      responseNote: "We usually reply the same working day.",
    },
    contact: {
      heading: "Contact us",
      note: "Prefer to talk? Call us and we'll answer any questions.",
    },
  };
}

/** Merge stored JSON over defaults so older drafts never break rendering. */
export function normaliseContent(
  raw: unknown,
  fallback: SiteContent,
): SiteContent {
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, Record<string, unknown>>;
  const pick = <K extends keyof SiteContent>(key: K): SiteContent[K] => ({
    ...(fallback[key] as object),
    ...((r[key as string] ?? {}) as object),
  }) as SiteContent[K];

  return {
    templateId: "cleaning-01",
    brand: pick("brand"),
    hero: pick("hero"),
    about: pick("about"),
    services: pick("services"),
    areas: pick("areas"),
    quote: pick("quote"),
    contact: pick("contact"),
  };
}
