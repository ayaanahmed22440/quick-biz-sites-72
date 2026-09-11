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

/** Counts hits in a bucket without recording a new one. Returns 0 on storage trouble. */
export async function countHits(options: {
  bucket: string;
  subject: string;
  windowSeconds: number;
}): Promise<number> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - options.windowSeconds * 1000).toISOString();
    const { count, error } = await supabaseAdmin
      .from("rate_limit_hits")
      .select("id", { count: "exact", head: true })
      .eq("bucket", options.bucket)
      .eq("subject", options.subject)
      .gte("created_at", since);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Records a hit without enforcing a limit (used to count payment failures). */
export async function recordHit(bucket: string, subject: string): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("rate_limit_hits").insert({ bucket, subject });
  } catch {
    /* never block the caller on throttle bookkeeping */
  }
}

/** Clears a bucket for one subject (admin "release this account" control). */
export async function clearHits(bucket: string, subject: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("rate_limit_hits").delete().eq("bucket", bucket).eq("subject", subject);
}

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
