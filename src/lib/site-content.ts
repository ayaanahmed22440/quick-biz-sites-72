/**
 * Content model for WebWarheads templates.
 *
 * Templates are approved, human-reviewed designs. The customer never generates
 * a website; they fill in this content and pick their brand colour, and the
 * template renders it. Draft and published copies are stored separately.
 *
 * Business facts (name, phone, services, areas, hours) live in the database and
 * are passed to the template separately — this file only holds the words and
 * images the customer can edit.
 */

import { presetFor, templateIdForNiche } from "@/lib/template-registry";

export type SiteContent = {
  /** Which approved design renders this content. */
  templateId: string;
  brand: {
    /** Hex colour, taken from the customer's own logo. */
    primaryColor: string;
    logoUrl: string | null;
  };
  images: {
    hero: string;
    about: string;
    gallery: string[];
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
  gallery: {
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
    serviceQuestion: string;
  };
  reviews: {
    heading: string;
    intro: string;
    /** Public Google Business Profile / review link, shown as "See all reviews". */
    googleUrl: string;
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
  /** Business niche, or a template id directly. */
  niche?: string | null;
  templateId?: string | null;
}): SiteContent {
  const preset = presetFor(input.templateId ?? input.niche);
  const place = input.city?.trim() ? input.city.trim() : "your area";
  const service = input.primaryService?.trim() ? input.primaryService.trim() : preset.copy.service;

  return {
    templateId: preset.templateId,
    brand: {
      primaryColor: input.primaryColor || preset.accent || DEFAULT_PRIMARY_COLOR,
      logoUrl: input.logoUrl ?? null,
    },
    images: {
      hero: preset.images.hero,
      about: preset.images.about,
      gallery: [...preset.images.gallery],
    },
    hero: {
      headline: `${service.charAt(0).toUpperCase()}${service.slice(1)} you can rely on in ${place}`,
      subheadline: `${input.businessName} looks after the ${preset.copy.service} so you don't have to. Tell us what you need and we'll come back with a straight price.`,
      primaryCta: preset.copy.cta,
      trustPoints: [...preset.copy.trustPoints],
    },
    about: {
      heading: `About ${input.businessName}`,
      body: `We're a ${place}-based ${preset.copy.service} team. Write a few honest sentences here about who you are, how long you've been doing this, and what customers can expect when you turn up.`,
    },
    services: {
      heading: preset.copy.servicesHeading,
      intro: preset.copy.servicesIntro,
    },
    gallery: {
      heading: preset.copy.galleryHeading,
      intro: preset.copy.galleryIntro,
    },
    areas: {
      heading: "Areas we cover",
      intro: `We work across ${place} and the surrounding towns.`,
    },
    quote: {
      heading: preset.copy.quoteHeading,
      intro: preset.copy.quoteIntro,
      responseNote: "We usually reply the same working day.",
      serviceQuestion: preset.copy.serviceQuestion,
    },
    reviews: {
      heading: "What our customers say",
      intro: "Real words from people we've worked for.",
      googleUrl: "",
    },
    contact: {
      heading: "Contact us",
      note: "Prefer to talk? Call us and we'll answer any questions.",
    },
  };
}

/** Merge stored JSON over defaults so older drafts never break rendering. */
export function normaliseContent(raw: unknown, fallback: SiteContent): SiteContent {
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;

  const merge = <K extends keyof SiteContent>(key: K): SiteContent[K] =>
    ({
      ...(fallback[key] as object),
      ...((r[key as string] && typeof r[key as string] === "object"
        ? (r[key as string] as object)
        : {}) as object),
    }) as SiteContent[K];

  const storedTemplate = typeof r["templateId"] === "string" ? (r["templateId"] as string) : null;
  const images = merge("images");

  return {
    templateId: presetFor(storedTemplate ?? fallback.templateId).templateId,
    brand: merge("brand"),
    images: {
      hero: images.hero || fallback.images.hero,
      about: images.about || fallback.images.about,
      gallery:
        Array.isArray(images.gallery) && images.gallery.length
          ? images.gallery.filter((v) => typeof v === "string")
          : fallback.images.gallery,
    },
    hero: merge("hero"),
    about: merge("about"),
    services: merge("services"),
    gallery: merge("gallery"),
    areas: merge("areas"),
    quote: merge("quote"),
    reviews: merge("reviews"),
    contact: merge("contact"),
  };
}

export { templateIdForNiche };
