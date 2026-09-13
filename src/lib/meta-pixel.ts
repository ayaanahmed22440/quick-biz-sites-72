/**
 * Meta (Facebook) Pixel.
 *
 * The pixel base code is inlined in the page head (see src/routes/__root.tsx)
 * so it is present in the HTML source and detectable by Meta's tools. Events
 * are held back with Meta's own consent API until the visitor may be measured.
 *
 * Configure with: VITE_META_PIXEL_ID (e.g. 1634000254846601)
 */
import { adTrackingAllowed } from "./consent";

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

/** Initialises the pixel and sends the page view when measurement is allowed. */
export async function startMetaPixel() {
  if (started || typeof window === "undefined" || !META_PIXEL_ID) return;
  if (!(await adTrackingAllowed())) return;
  started = true;
  window.fbq?.("init", META_PIXEL_ID);
  window.fbq?.("track", "PageView");
}

/** Someone started building their website. */
export function trackLead() {
  window.fbq?.("track", "Lead");
}

/** A plan payment completed. */
export function trackPurchase(opts: { value?: number; currency?: string } = {}) {
  window.fbq?.("track", "Purchase", {
    value: opts.value ?? 0,
    currency: opts.currency ?? "USD",
  });
}
