/** Visitor preference for advertising measurement on this device. */

export const CONSENT_KEY = "ww:cookie-choice";
export type ConsentChoice = "accepted" | "essential";

export function getConsent(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "essential" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Advertising measurement is enabled by default. A signed-in customer may
 * opt out from Account settings; that preference is stored on this device.
 */
export async function adTrackingAllowed(): Promise<boolean> {
  const choice = getConsent();
  return choice !== "essential";
}

export function setConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* storage blocked */
  }
}
