/**
 * Ad conversion tracking for Meta and Google Ads.
 *
 * Nothing loads until (a) the real IDs are present in the environment and
 * (b) the visitor is allowed to be tracked. Visitors in regions that require
 * consent are only tracked after they accept in the cookie notice; everywhere
 * else ordinary tracking runs.
 *
 * Add the real IDs later as environment variables — no code change needed:
 *   VITE_META_PIXEL_ID            e.g. 123456789012345
 *   VITE_GOOGLE_ADS_ID            e.g. AW-123456789
 *   VITE_GOOGLE_ADS_PURCHASE_LABEL   conversion label for a paid signup
 *   VITE_GOOGLE_ADS_SIGNUP_LABEL     conversion label for onboarding started
 */

export const CONSENT_KEY = "ww:cookie-choice";
export type ConsentChoice = "accepted" | "essential";

const env = import.meta.env as Record<string, string | undefined>;

const config = {
  metaPixelId: env["VITE_META_PIXEL_ID"]?.trim() || "",
  googleAdsId: env["VITE_GOOGLE_ADS_ID"]?.trim() || "",
  purchaseLabel: env["VITE_GOOGLE_ADS_PURCHASE_LABEL"]?.trim() || "",
  signupLabel: env["VITE_GOOGLE_ADS_SIGNUP_LABEL"]?.trim() || "",
};

export const hasTrackingIds = () => Boolean(config.metaPixelId || config.googleAdsId);

/** Countries where advertising cookies need explicit consent (EEA + UK + CH). */
const CONSENT_REGIONS = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT",
  "NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","GB","CH",
]);

let regionPromise: Promise<boolean> | null = null;

/** True when this visitor's region requires consent before ad tracking. */
export function requiresConsent(): Promise<boolean> {
  if (regionPromise) return regionPromise;
  regionPromise = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const response = await fetch("/cdn-cgi/trace", { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) return true;
      const match = /(?:^|\n)loc=([A-Z0-9]+)/.exec(await response.text());
      const loc = match?.[1];
      if (!loc || loc === "XX" || loc === "T1") return true;
      return CONSENT_REGIONS.has(loc);
    } catch {
      return true;
    }
  })();
  return regionPromise;
}

export function getConsent(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "essential" ? value : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* storage blocked */
  }
  if (choice === "accepted") void initTracking();
}

async function allowed() {
  if (!hasTrackingIds()) return false;
  const consent = getConsent();
  if (consent === "accepted") return true;
  // No explicit acceptance: only track outside the regions that require it.
  return !(await requiresConsent());
}

/* ------------------------------------------------------------------ loaders */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void; push?: unknown };
    _fbq?: unknown;
  }
}

let loaded = false;
let pending: Array<() => void> = [];

function script(src: string) {
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = src;
  document.head.appendChild(tag);
}

function loadGoogle() {
  if (!config.googleAdsId || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  const gtag: (...args: unknown[]) => void = (...args) => {
    window.dataLayer!.push(args);
  };
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", config.googleAdsId);
  script(`https://www.googletagmanager.com/gtag/js?id=${config.googleAdsId}`);
}

function loadMeta() {
  if (!config.metaPixelId || window.fbq) return;
  const queue: unknown[] = [];
  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else queue.push(args);
  }) as NonNullable<Window["fbq"]>;
  fbq.queue = queue;
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;
  script("https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", config.metaPixelId);
  fbq("track", "PageView");
}

/** Loads the tags if this visitor may be tracked. Safe to call repeatedly. */
export async function initTracking() {
  if (loaded || typeof window === "undefined") return;
  if (!(await allowed())) return;
  loaded = true;
  loadGoogle();
  loadMeta();
  const queued = pending;
  pending = [];
  queued.forEach((run) => run());
}

/* ------------------------------------------------------------------- events */

function fire(run: () => void) {
  if (typeof window === "undefined") return;
  if (loaded) {
    run();
    return;
  }
  // Consent may still be resolving on first paint — hold briefly, then drop
  // the event if tracking turns out not to be allowed.
  pending.push(run);
  void initTracking().then(() => {
    setTimeout(() => {
      pending = [];
    }, 5000);
  });
}

/** Secondary conversion: someone started building their website. */
export function trackOnboardingStarted() {
  fire(() => {
    window.fbq?.("track", "Lead");
    if (config.googleAdsId && config.signupLabel) {
      window.gtag?.("event", "conversion", {
        send_to: `${config.googleAdsId}/${config.signupLabel}`,
      });
    }
  });
}

/** Primary conversion: a plan payment completed. */
export function trackPaidSignup(opts: { value?: number; currency?: string; id?: string } = {}) {
  const value = opts.value ?? 0;
  const currency = opts.currency ?? "USD";
  fire(() => {
    window.fbq?.("track", "Purchase", { value, currency });
    if (config.googleAdsId && config.purchaseLabel) {
      window.gtag?.("event", "conversion", {
        send_to: `${config.googleAdsId}/${config.purchaseLabel}`,
        value,
        currency,
        ...(opts.id ? { transaction_id: opts.id } : {}),
      });
    }
  });
}
