import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
import { setResponseHeader, setResponseHeaders } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  if (new URL(request.url).pathname.startsWith("/lovable/")) {
    return next();
  }
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});


/**
 * Baseline browser protections. Applied to page responses only, so API and
 * asset responses keep their own headers. The policy lists exactly the outside
 * services this app uses: Supabase (data, auth, storage), Google Fonts and the
 * Lovable editor/preview host.
 */
const securityHeadersMiddleware = createMiddleware().server(async ({ next, request }) => {
  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith("/lovable/") || pathname.startsWith("/api/")) return next();

  const setHeader = (name: string, value: string) =>
    (setResponseHeader as (n: string, v: string) => void)(name, value);

  setHeader("x-content-type-options", "nosniff");
  setHeader("referrer-policy", "strict-origin-when-cross-origin");
  setHeader("x-frame-options", "SAMEORIGIN");
  setHeader(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  );
  setHeader("cross-origin-opener-policy", "same-origin-allow-popups");
  setHeader("strict-transport-security", "max-age=31536000; includeSubDomains; preload");

  // Inline scripts/styles are required by the framework's hydration payload and
  // by Tailwind's runtime theme variables; everything else is locked to a short
  // allow-list of first-party and known third-party origins.
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'self' https://*.lovable.app https://*.lovable.dev https://lovable.dev",
    "script-src 'self' 'unsafe-inline' https://cdn.gpteng.co https://*.lovable.app https://*.lovable.dev",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.lovable.app https://*.lovable.dev https://api.polar.sh",
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://polar.sh https://*.polar.sh",
    "upgrade-insecure-requests",
  ].join("; ");

  if (import.meta.env.PROD) setResponseHeader("Content-Security-Policy", csp);
  return next();
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, securityHeadersMiddleware, csrfMiddleware],
}));
