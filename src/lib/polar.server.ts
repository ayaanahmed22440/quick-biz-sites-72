/**
 * Polar billing helpers. Server-only: never import from client code.
 * All calls use POLAR_ACCESS_TOKEN, which must never reach the browser.
 */
import { createHmac, timingSafeEqual } from "crypto";
import type { Database } from "@/integrations/supabase/types";

export type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

/** Sandbox is used when POLAR_SERVER=sandbox, otherwise production. */
function apiBase(): string {
  return (process.env["POLAR_SERVER"] ?? "production").toLowerCase() === "sandbox"
    ? "https://sandbox-api.polar.sh"
    : "https://api.polar.sh";
}

function accessToken(): string {
  const token = process.env["POLAR_ACCESS_TOKEN"];
  if (!token) throw new Error("POLAR_ACCESS_TOKEN is not configured");
  return token;
}

async function polarFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("[polar] request failed", path, res.status, text.slice(0, 500));
    throw new Error(`Polar request failed (${res.status})`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export type PolarCheckout = {
  id: string;
  url: string;
  status?: string;
  customer_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

/** Creates a hosted Polar checkout tied to our own checkout_sessions row via metadata. */
export async function createPolarCheckout(input: {
  productId: string;
  successUrl: string;
  customerEmail?: string | null;
  externalCustomerId: string;
  metadata: Record<string, string>;
}): Promise<{ id: string; url: string }> {
  const checkout = await polarFetch<PolarCheckout>("/v1/checkouts/", {
    method: "POST",
    body: JSON.stringify({
      products: [input.productId],
      success_url: input.successUrl,
      external_customer_id: input.externalCustomerId,
      ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
      metadata: input.metadata,
    }),
  });
  return { id: checkout.id, url: checkout.url };
}

export async function getPolarCheckout(id: string): Promise<PolarCheckout> {
  return polarFetch<PolarCheckout>(`/v1/checkouts/${encodeURIComponent(id)}`);
}

/** Opens the Polar customer portal for one of our businesses. */
export async function createPolarPortalSession(externalCustomerId: string): Promise<string> {
  const session = await polarFetch<{ customer_portal_url: string }>("/v1/customer-sessions/", {
    method: "POST",
    body: JSON.stringify({ external_customer_id: externalCustomerId }),
  });
  return session.customer_portal_url;
}

export type PolarSubscription = {
  id: string;
  status?: string | null;
  product_id?: string | null;
  customer_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  canceled_at?: string | null;
  metadata?: Record<string, unknown> | null;
  customer?: { id?: string; email?: string | null; external_id?: string | null } | null;
  product?: { id?: string } | null;
};

export async function getPolarSubscription(id: string): Promise<PolarSubscription> {
  return polarFetch<PolarSubscription>(`/v1/subscriptions/${encodeURIComponent(id)}`);
}

/** Maps a Polar subscription state onto our subscription status enum. */
export function mapPolarStatus(raw: string | null | undefined): SubscriptionStatus {
  switch ((raw ?? "").toLowerCase()) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "revoked":
    case "expired":
      return "expired";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return "incomplete";
  }
}

export function toIso(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Verifies a Polar (Standard Webhooks) signature over the raw request body.
 * Polar's plain secret is used base64-encoded by the standard library, which is
 * byte-identical to using the raw secret bytes as the HMAC key.
 */
export function verifyPolarSignature(args: {
  secret: string;
  id: string;
  timestamp: string;
  signatureHeader: string;
  body: string;
}): boolean {
  const keys: Buffer[] = [Buffer.from(args.secret, "utf8")];
  if (args.secret.startsWith("whsec_")) {
    keys.push(Buffer.from(args.secret.slice(6), "utf8"));
    keys.push(Buffer.from(args.secret.slice(6), "base64"));
  }

  const signedContent = `${args.id}.${args.timestamp}.${args.body}`;
  const expected = keys.map((key) => createHmac("sha256", key).update(signedContent).digest("base64"));

  const provided = args.signatureHeader
    .split(" ")
    .map((part) => (part.includes(",") ? (part.split(",")[1] ?? "") : part))
    .filter(Boolean);

  return provided.some((candidate) =>
    expected.some((value) => {
      const a = Buffer.from(candidate);
      const b = Buffer.from(value);
      return a.length === b.length && timingSafeEqual(a, b);
    }),
  );
}

/** Standard Webhooks replay window: five minutes. */
export function timestampIsFresh(timestamp: string, toleranceSeconds = 300): boolean {
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds)) return false;
  return Math.abs(Date.now() / 1000 - seconds) <= toleranceSeconds;
}
