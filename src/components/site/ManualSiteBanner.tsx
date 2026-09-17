import { useEffect, useState } from "react";

/**
 * Pending-payment bar shown on a team-built demo site.
 * Purely presentational: the countdown mirrors the expiry the server enforces.
 */
export function ManualSiteBanner({
  manualId,
  expiresAt,
  paidJustNow,
}: {
  manualId: string;
  expiresAt: string;
  paidJustNow?: boolean;
}) {
  const target = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const timer = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (paidJustNow) {
    return (
      <div className="sticky top-0 z-50 bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white">
        Payment received — activating your website now. This page will update in a moment.
      </div>
    );
  }

  const total = Math.max(0, Math.floor(remaining / 1000));
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");

  return (
    <div className="sticky top-0 z-50 bg-slate-900 px-4 py-2.5 text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
        <p className="text-sm font-medium">
          Payment pending — this preview expires in{" "}
          <span className="font-mono font-bold tabular-nums">
            {hh}:{mm}:{ss}
          </span>
        </p>
        <a
          href={`/api/public/manual-checkout/${manualId}`}
          className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-slate-900 transition-opacity hover:opacity-90"
        >
          Pay now &amp; keep this website
        </a>
      </div>
    </div>
  );
}
