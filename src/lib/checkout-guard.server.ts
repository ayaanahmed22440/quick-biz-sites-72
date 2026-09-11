import {
  RateLimitError,
  callerKey,
  clearHits,
  countHits,
  enforceRateLimit,
  recordHit,
} from "./rate-limit.server";

/**
 * Anti card-testing guard for checkout.
 *
 * Card data never touches this app (Polar hosts the card form), so the job here
 * is to stop a bot from minting an endless supply of payment links and to shut
 * an account down automatically when declines pile up.
 *
 * All thresholds live here so they are easy to tune.
 */
export const CHECKOUT_LIMITS = {
  /** Checkout starts allowed per signed-in account. */
  perAccount: { limit: 5, windowSeconds: 15 * 60 },
  /** Checkout starts allowed per network address (shared offices included). */
  perIp: { limit: 10, windowSeconds: 60 * 60 },
  /** Declined payments before the account is put in cooldown. */
  failures: { limit: 3, windowSeconds: 60 * 60 },
  /** How long an account stays blocked after tripping the failure threshold. */
  cooldownSeconds: 60 * 60,
  /** Reuse an unused payment link created within this window. */
  reuseWindowSeconds: 15 * 60,
} as const;

export const CHECKOUT_BUCKETS = {
  account: "checkout:account",
  ip: "checkout:ip",
  failures: "checkout:failures",
} as const;

export class CheckoutBlockedError extends Error {}

/** Counts a declined/failed payment against a business. */
export async function recordPaymentFailure(businessId: string): Promise<void> {
  await recordHit(CHECKOUT_BUCKETS.failures, businessId);
}

/** Clears the decline cooldown for a business (successful payment, or admin release). */
export async function clearPaymentFailures(businessId: string): Promise<void> {
  try {
    await clearHits(CHECKOUT_BUCKETS.failures, businessId);
  } catch {
    /* never break the caller on bookkeeping */
  }
}

export async function failureCount(businessId: string): Promise<number> {
  return countHits({
    bucket: CHECKOUT_BUCKETS.failures,
    subject: businessId,
    windowSeconds: CHECKOUT_LIMITS.cooldownSeconds,
  });
}

/**
 * Runs every abuse check before a checkout link is created.
 * Throws a customer-readable error when the attempt should be refused.
 */
export async function guardCheckout(options: {
  userId: string;
  businessId: string;
  businessName: string;
}): Promise<void> {
  const { userId, businessId } = options;

  // 1. Cooldown after repeated declines.
  const failures = await failureCount(businessId);
  if (failures >= CHECKOUT_LIMITS.failures.limit) {
    await notifyAbuse(options, failures);
    throw new CheckoutBlockedError(
      "Too many declined payments on this account. Payments are paused for an hour — contact support if you need help sooner.",
    );
  }

  // 2. Plain throttles per account and per network address.
  try {
    await enforceRateLimit({
      bucket: CHECKOUT_BUCKETS.account,
      subject: userId,
      limit: CHECKOUT_LIMITS.perAccount.limit,
      windowSeconds: CHECKOUT_LIMITS.perAccount.windowSeconds,
      message: "Too many payment attempts. Please wait a few minutes and try again.",
    });
    await enforceRateLimit({
      bucket: CHECKOUT_BUCKETS.ip,
      subject: callerKey(),
      limit: CHECKOUT_LIMITS.perIp.limit,
      windowSeconds: CHECKOUT_LIMITS.perIp.windowSeconds,
      message: "Too many payment attempts from this connection. Please try again later.",
    });
  } catch (error) {
    if (error instanceof RateLimitError) throw new CheckoutBlockedError(error.message);
    throw error;
  }
}

/** Best-effort heads-up to the team; never blocks the request. */
async function notifyAbuse(
  options: { businessId: string; businessName: string },
  failures: number,
): Promise<void> {
  try {
    const { adminCheckoutAbuse } = await import("./emails.server");
    await adminCheckoutAbuse({
      businessId: options.businessId,
      businessName: options.businessName,
      failures,
    });
  } catch {
    /* alerting must never break checkout */
  }
}
