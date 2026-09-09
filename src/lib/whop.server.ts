/**
 * Whop billing helpers. Server-only: never import from client code.
 * All calls use WHOP_API_KEY, which must never reach the browser.
 */
import { createHmac, timingSafeEqual } from "crypto";
import type { Database } from "@/integrations/supabase/types";

const WHOP_API = "https://api.whop.com/api/v2";

export type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

function apiKey(): string {
  const key = process.env["WHOP_API_KEY"];
  if (!key) throw new Error("WHOP_API_KEY is not configured");
  return key;
}

async function whopFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${WHOP_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("[whop] request failed", path, res.status, text.slice(0, 500));
    throw new Error(`Whop request failed (${res.status})`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export type WhopCheckoutSession = { id: string; purchase_url?: string; plan_id?: string };

/** Creates a hosted checkout session tied to our own checkout_sessions row via metadata. */
export async function createWhopCheckoutSession(input: {
  whopPlanId: string;
  metadata: Record<string, string>;
  redirectUrl: string;
}): Promise<{ id: string; url: string }> {
  const session = await whopFetch<WhopCheckoutSession>("/checkout_sessions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: input.whopPlanId,
      metadata: input.metadata,
      redirect_url: input.redirectUrl,
    }),
  });

  const url =
    session.purchase_url ??
    `https://whop.com/checkout/${input.whopPlanId}?session=${encodeURIComponent(session.id)}`;
  return { id: session.id, url };
}

export type WhopMembership = {
  id: string;
  status?: string | null;
  valid?: boolean | null;
  plan?: string | null;
  plan_id?: string | null;
  user?: string | null;
  user_id?: string | null;
  renewal_period_start?: number | string | null;
  renewal_period_end?: number | string | null;
  cancel_at_period_end?: boolean | null;
  metadata?: Record<string, unknown> | null;
};

export async function getWhopMembership(id: string): Promise<WhopMembership> {
  return whopFetch<WhopMembership>(`/memberships/${encodeURIComponent(id)}`);
}

/** Maps a Whop membership state onto our subscription status enum. */
export function mapWhopStatus(raw: string | null | undefined, valid?: boolean | null): SubscriptionStatus {
  switch ((raw ?? "").toLowerCase()) {
    case "trialing":
      return "trialing";
    case "active":
    case "completed":
return "active";
    case "past_due":
    case "unresolved":
      return "past_due";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "expired":
    case "drafted":
      return "expired";
    default:
      return valid ? "active" : "incomplete";
  }
}

export function toIso(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return new Date(value * 1000).toISOString();
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && String(asNumber) === value) return new Date(asNumber * 1000).toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Verifies a Standard Webhooks signature over the raw request body. */
export function verifyWhopSignature(args: {
  secret: string;
  id: string;
  timestamp: string;
  signatureHeader: string;
  body: string;
}): boolean {
  // Providers differ in how the secret is encoded; try each plausible key form.
  const keys: Buffer[] = [Buffer.from(args.secret, "utf8")];
  if (args.secret.startsWith("whsec_")) keys.push(Buffer.from(args.secret.slice(6), "base64"));
  if (args.secret.startsWith("ws_") && /^[0-9a-f]+$/i.test(args.secret.slice(3))) {
    keys.push(Buffer.from(args.secret.slice(3), "hex"));
  }

  const signedContent = `${args.id}.${args.timestamp}.${args.body}`;
  const expected = keys.flatMap((key) => [
    createHmac("sha256", key).update(signedContent).digest("base64"),
    createHmac("sha256", key).update(signedContent).digest("hex"),
  ]);

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
