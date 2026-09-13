/**
 * Visitor consent for advertising measurement.
 *
 * Visitors in regions that require consent (EEA, UK, Switzerland) are only
 * measured after they accept in the cookie notice. Everywhere else ordinary
 * measurement runs unless the visitor chose "essential only".
 */

export const CONSENT_KEY = "ww:cookie-choice";
export type ConsentChoice = "accepted" | "essential";

const CONSENT_REGIONS = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT",
  "NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","GB","CH",
]);

let regionPromise: Promise<boolean> | null = null;

/** True when this visitor's region requires consent before ad measurement. */
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

/** Resolves to true when advertising measurement may run for this visitor. */
export async function adTrackingAllowed(): Promise<boolean> {
  const choice = getConsent();
  if (choice === "accepted") return true;
  if (choice === "essential") return false;
  return !(await requiresConsent());
}

export function setConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* storage blocked */
  }
  if (typeof window !== "undefined") {
    window.fbq?.("consent", choice === "accepted" ? "grant" : "revoke");
    if (choice === "accepted") window.fbq?.("track", "PageView");
  }
}
