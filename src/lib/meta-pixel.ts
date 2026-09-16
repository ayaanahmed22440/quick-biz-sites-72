/**
 * Meta (Facebook) Pixel.
 *
 * The pixel base code is inlined in the page head (see src/routes/__root.tsx)
 * so it is present in the HTML source and detectable by Meta's tools. Events
 * are held back until the visitor may be measured (see src/lib/consent.ts).
 *
 * Configure with: VITE_META_PIXEL_ID (e.g. 1634000254846601)
 */
import { adTrackingAllowed, getConsent } from "./consent";

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      callMethod?: (...a: unknown[]) => void;
      push?: unknown;
    };
    _fbq?: unknown;
  }
}

export const META_PIXEL_ID =
  (import.meta.env as Record<string, string | undefined>)["VITE_META_PIXEL_ID"]?.trim() || "";

/**
 * Inline snippet injected into <head>. Loads Meta's library so the pixel is
 * present in the page source; the pixel itself is initialised only once the
 * visitor may be measured (see startMetaPixel).
 */
export function metaPixelSnippet(_pixelId: string) {
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');`;
}

let started = false;

/** Initialises the pixel and sends the first page view when measurement is allowed. */
export async function startMetaPixel() {
  if (started || typeof window === "undefined" || !META_PIXEL_ID) return;
  if (!(await adTrackingAllowed())) return;
  started = true;
  window.fbq?.("init", META_PIXEL_ID);
  trackEvent("PageView");
}

/** Debug payload logging only with ?fbdebug=1 — never in normal production use. */
function metaPixelDebug(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("fbdebug");
}

function newEventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `ww-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

/** Remembers a one-time event so refreshes/back navigation don't double count. */
function onceKey(key: string): boolean {
  try {
    if (window.sessionStorage.getItem(key)) return false;
    window.sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}

/**
 * Sends a Meta standard event. Every event carries an eventID so a later
 * server-side (Conversions API) copy of the same event can be deduplicated.
 */
export function trackEvent(
  name: string,
  params: Record<string, unknown> = {},
  eventId: string = newEventId(),
) {
  if (typeof window === "undefined" || !started || getConsent() === "essential") return;
  if (metaPixelDebug()) console.log("[meta-pixel]", name, params, { eventID: eventId });
  window.fbq?.("track", name, params, { eventID: eventId });
  void sendServerCopy(name, params, eventId);
}

function cookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : undefined;
}

/**
 * Conversions API copy of the same event. Fire-and-forget: a failure here can
 * never affect the page, and the shared eventID lets Meta deduplicate.
 */
async function sendServerCopy(
  name: string,
  params: Record<string, unknown>,
  eventId: string,
): Promise<void> {
  try {
    const { trackServerEvent } = await import("./meta-capi.functions");
    const { value, currency, ...custom } = params as {
      value?: number;
      currency?: string;
    } & Record<string, unknown>;
    const fbp = cookie("_fbp");
    const fbc = cookie("_fbc");
    await trackServerEvent({
      data: {
        eventName: name,
        eventId,
        eventSourceUrl: window.location.href.slice(0, 500),
        ...(typeof value === "number" ? { value } : {}),
        ...(currency ? { currency } : {}),
        ...(fbp ? { fbp } : {}),
        ...(fbc ? { fbc } : {}),
        ...(Object.keys(custom).length ? { customData: custom } : {}),
      },
    });
  } catch (error) {
    if (metaPixelDebug()) console.warn("[meta-capi] failed", error);
  }
}

/** Page view for in-app navigation (the first one comes from startMetaPixel). */
export function trackPageView() {
  trackEvent("PageView");
}

/** A key marketing page was viewed. */
export function trackViewContent(contentName: string) {
  trackEvent("ViewContent", { content_name: contentName });
}

/** Someone started building their website. */
export function trackLead() {
  trackEvent("Lead");
}

/** A new account was created. Fires at most once per account. */
export function trackCompleteRegistration(userId: string, method: string) {
  if (typeof window === "undefined") return;
  if (!onceKey(`ww_registration_${userId}`)) return;
  trackEvent("CompleteRegistration", { content_name: method, status: true });
}

/** A plan was chosen and checkout is about to open. */
export function trackInitiateCheckout(opts: { planId: string; value: number }) {
  trackEvent("InitiateCheckout", {
    content_name: opts.planId,
    content_category: "subscription",
    value: opts.value,
    currency: "USD",
    num_items: 1,
  });
}

/** A contact or support message was sent. */
export function trackContact(source: string) {
  trackEvent("Contact", { content_name: source });
}

/**
 * A plan payment completed. When an eventId (the Polar checkout/order id) is
 * given, the event fires at most once per order per tab session — refreshes of
 * the success page don't double-count — and is sent with Meta's eventID so it
 * can be deduplicated against a server-side event later.
 */
export function trackPurchase(opts: { value?: number; currency?: string; eventId?: string } = {}) {
  if (typeof window === "undefined") return;
  const eventId = opts.eventId?.trim() || undefined;
  if (eventId && !onceKey(`ww_purchase_${eventId}`)) return;
  const params = { value: opts.value ?? 0, currency: opts.currency ?? "USD" };
  if (eventId) {
    trackEvent("Purchase", params, eventId);
  } else {
    trackEvent("Purchase", params);
  }
}
