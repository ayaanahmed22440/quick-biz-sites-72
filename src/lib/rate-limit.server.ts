import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";

/**
 * Small abuse throttle for public endpoints.
 *
 * Hits are counted per bucket + subject (usually the caller's IP) in a
 * service-role-only table, so a bot cannot flood forms, e-mail sending or
 * expensive queries. Storage problems never block a legitimate request.
 */
export async function enforceRateLimit(options: {
  bucket: string;
  subject: string;
  limit: number;
  windowSeconds: number;
  message?: string;
}): Promise<void> {
  const { bucket, subject, limit, windowSeconds } = options;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

    const { count, error } = await supabaseAdmin
      .from("rate_limit_hits")
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .eq("subject", subject)
      .gte("created_at", since);

    if (error) return; // fail open on storage trouble, never on the limit itself
    if ((count ?? 0) >= limit) {
      throw new RateLimitError(options.message ?? "Too many attempts. Please try again shortly.");
    }

    await supabaseAdmin.from("rate_limit_hits").insert({ bucket, subject });
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
  }
}

export class RateLimitError extends Error {}

/** Best-effort caller identity for throttling. Never used for authorization. */
export function callerKey(): string {
  try {
    const ip = getRequestIP({ xForwardedFor: true });
    if (ip) return ip;
    const forwarded = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-real-ip");
    if (forwarded) return forwarded;
  } catch {
    /* outside a request context */
  }
  return "unknown";
}
