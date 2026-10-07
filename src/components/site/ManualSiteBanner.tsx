import { useEffect, useState } from "react";

/**
 * Pending-payment guidance shown on a team-built demo site.
 * Purely presentational: the countdown mirrors the expiry the server enforces.
 * Top bar + a calm pinned bar at the bottom + an end-of-page "what happens next".
 */
export function ManualSiteBanner({
  manualId,
  expiresAt,
  paidJustNow,
  businessName,
}: {
  manualId: string;
  expiresAt: string;
  paidJustNow?: boolean;
  businessName?: string;
}) {
  const target = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (paidJustNow) {
    return (
      <div className="relative bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white">
        Payment received — activating your website now. This page will update in a moment.
      </div>
    );
  }

  const total = Math.max(0, Math.floor(remaining / 1000));
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  const payHref = `/api/public/manual-checkout/${manualId}`;

  return (
    <>
      <div className="relative bg-slate-900 px-4 py-2.5 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
          <p className="text-sm font-medium">
            This website was made for {businessName ?? "your business"} — reserved for{" "}
            <span className="rounded-md bg-red-600 px-2 py-0.5 font-mono text-base font-bold tabular-nums text-white">
              {hh}:{mm}:{ss}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setShowSteps(true)}
            className="text-sm font-semibold underline underline-offset-4 hover:opacity-80"
          >
            What happens next?
          </button>
        </div>
      </div>

      {/* Calm pinned bar — always one tap away while they scroll. */}
      <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-white/10 bg-slate-900/95 p-3 text-white shadow-2xl backdrop-blur sm:inset-x-6 sm:bottom-5">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Like it? Make it yours.</p>
            <p className="hidden truncate text-xs text-white/70 sm:block">
              Go live today and start getting more jobs from Google.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSteps(true)}
            className="hidden shrink-0 rounded-full px-3 py-2 text-sm font-medium text-white/80 hover:text-white sm:block"
          >
            How it works
          </button>
          <a
            href={payHref}
            className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900 transition-opacity hover:opacity-90"
          >
            Keep my website
          </a>
        </div>
      </div>

      {showSteps ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center"
          onClick={() => setShowSteps(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="What happens next"
            className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">What happens when you keep it</h2>
            <ol className="mt-4 space-y-4 text-sm">
              {[
                ["Your website goes live", "Right after payment — no waiting, nothing to set up."],
                ["You get your own login", "We email you a sign-in link so you can change text, photos, services and prices any time."],
                ["Customers start reaching you", "Quote requests from your website go straight to your inbox, so you get more jobs."],
                ["Use your own domain", "Keep this address or connect your own .com in a few clicks."],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="text-slate-600">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-slate-500">Monthly plan. Cancel any time.</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowSteps(false)}
                className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-medium"
              >
                Keep looking
              </button>
              <a
                href={payHref}
                className="flex-1 rounded-full bg-slate-900 px-4 py-2.5 text-center text-sm font-bold text-white"
              >
                Keep my website
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** End-of-page nudge, placed after the website content. */
export function ManualSiteEndCta({ manualId, businessName }: { manualId: string; businessName: string }) {
  return (
    <section className="bg-slate-900 px-4 pb-28 pt-14 text-center text-white">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold sm:text-3xl">This website was built for {businessName}</h2>
        <p className="mt-3 text-white/75">
          Put it live today, edit it yourself whenever you like, and start getting more jobs from people searching for you.
        </p>
        <a
          href={`/api/public/manual-checkout/${manualId}`}
          className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 hover:opacity-90"
        >
          Keep my website
        </a>
      </div>
    </section>
  );
}
