/**
 * Single source of truth for plans and entitlements.
 * Every gate in the app (UI and server) reads from here or from the
 * matching `entitlements` column on the `plans` table.
 */

export type PlanId = "basic" | "seo" | "premium";

export type FeatureKey =
  | "website"
  | "editor"
  | "leads"
  | "domains"
  | "seo"
  | "priority_support"
  | "human_edits";

export type Entitlements = Record<FeatureKey, boolean>;

export const NO_ENTITLEMENTS: Entitlements = {
  website: false,
  editor: false,
  leads: false,
  domains: false,
  seo: false,
  priority_support: false,
  human_edits: false,
};

export const PLAN_ENTITLEMENTS: Record<PlanId, Entitlements> = {
  basic: {
    ...NO_ENTITLEMENTS,
    website: true,
    editor: true,
    leads: true,
    domains: true,
  },
  seo: {
    ...NO_ENTITLEMENTS,
    website: true,
    editor: true,
    leads: true,
    domains: true,
    seo: true,
  },
  premium: {
    website: true,
    editor: true,
    leads: true,
    domains: true,
    seo: true,
    priority_support: true,
    human_edits: true,
  },
};

export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"] as const;

/** Yearly plans use the id `<plan>_yearly` and carry identical entitlements. */
export function basePlanId(planId: string | null | undefined): PlanId | undefined {
  if (!planId) return undefined;
  const base = planId.replace(/_yearly$/, "") as PlanId;
  return base in PLAN_ENTITLEMENTS ? base : undefined;
}

/** Yearly price = ten months (two months free). */
export function yearlyPrice(monthly: number): number {
  return monthly * 10;
}

export function entitlementsFor(
  planId: string | null | undefined,
  status: string | null | undefined,
): Entitlements {
  const base = basePlanId(planId);
  if (!base) return NO_ENTITLEMENTS;
  if (!status || !ACTIVE_SUBSCRIPTION_STATUSES.includes(status as never)) return NO_ENTITLEMENTS;
  return PLAN_ENTITLEMENTS[base] ?? NO_ENTITLEMENTS;
}

export function can(entitlements: Entitlements, feature: FeatureKey): boolean {
  return Boolean(entitlements[feature]);
}

export type PlanCopy = {
  id: PlanId;
  name: string;
  price: number;
  headline: string;
  who: string;
  features: string[];
  recommended?: boolean;
};

export const PLAN_COPY: PlanCopy[] = [
  {
    id: "basic",
    name: "Website",
    price: 37,
    headline: "Get your business online, properly.",
    who: "For businesses that just need a real website customers can find and contact.",
    features: [
      "Professional website built from a proven template",
      "Hosting and SSL included",
      "Connect a domain you already own",
      "Mobile-ready on every screen",
      "Simple website editor — no code",
      "Services, hours and business info management",
      "Logo and image management",
      "Contact form with lead capture",
      "Standard email support",
    ],
  },
  {
    id: "seo",
    name: "Website + SEO",
    price: 68,
    headline: "Be the business people find locally.",
    who: "For businesses that want to show up when someone nearby searches for their service.",
    recommended: true,
    features: [
      "Everything in the $37 plan",
      "Local keyword targeting from your real services and cities",
      "Service + location page titles and meta descriptions",
      "Clean heading structure and image alt text",
      "Internal linking and SEO-friendly URLs",
      "XML sitemap and robots.txt",
      "Search engine indexing configuration",
      "LocalBusiness and Service structured data",
      "NAP consistency checks",
      "SEO status dashboard",
    ],
  },
  {
    id: "premium",
    name: "Growth",
    price: 97,
    headline: "We do the work for you.",
    who: "For owners who would rather send a message than log in and edit anything.",
    features: [
      "Everything in the $68 plan",
      "Priority support queue",
      "Human website edits — ask us and we make the change",
      "Priority troubleshooting",
      "Enhanced SEO assistance",
      "Deeper website customization",
      "Early access to new features",
      "Direct support channel",
    ],
  },
];

export function planCopy(id: string | null | undefined): PlanCopy | undefined {
  const base = basePlanId(id);
  return PLAN_COPY.find((p) => p.id === base);
}

export function isYearly(id: string | null | undefined): boolean {
  return Boolean(id?.endsWith("_yearly"));
}
