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

/** Inline snippet injected into <head>. Inits the pixel with consent revoked. */
export function metaPixelSnippet(pixelId: string) {
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('consent','revoke');
fbq('init','${pixelId}');`;
}

let granted = false;

/** Grants consent and sends the page view when the visitor may be measured. */
export async function startMetaPixel() {
  if (granted || typeof window === "undefined" || !META_PIXEL_ID) return;
  if (!(await adTrackingAllowed())) return;
  granted = true;
  window.fbq?.("consent", "grant");
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
