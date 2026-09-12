import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getConsent, setConsent, type ConsentChoice } from "@/lib/tracking";

/**
 * Cookie notice. The app only sets cookies/storage that are needed to sign in
 * and remember a draft; the choice recorded here also controls whether
 * advertising measurement (Meta and Google Ads) may run. No advertising
 * scripts load before a visitor in a consent region accepts.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
  }, []);

  function choose(value: ConsentChoice) {
    setConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use essential cookies to keep you signed in. Optional ones help us understand how the
          site is used. See our{" "}
          <Link to="/privacy" className="underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => choose("essential")}>
            Essential only
          </Button>
          <Button size="sm" onClick={() => choose("accepted")}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
