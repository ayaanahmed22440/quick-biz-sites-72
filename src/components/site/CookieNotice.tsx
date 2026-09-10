import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ww:cookie-choice";

/**
 * Cookie notice. The app only sets cookies/storage that are needed to sign in
 * and remember a draft, so the choice recorded here controls optional
 * analytics-style storage only. No tracking scripts load before a choice.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* storage blocked — stay quiet */
    }
  }, []);

  function choose(value: "accepted" | "essential") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
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
