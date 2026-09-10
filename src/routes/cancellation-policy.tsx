import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";

const TITLE = "Cancellation Policy — WebWarheads";
const DESCRIPTION =
  "How to cancel a WebWarheads subscription, what happens to your website afterwards, and how to get your content back.";

export const Route = createFileRoute("/cancellation-policy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CancellationPolicyPage,
});

function CancellationPolicyPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Cancellation Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Draft policy. Needs review by WebWarheads before launch.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">Cancel any time</h2>
            <p className="mt-2">
              There is no contract and no cancellation fee. You can cancel from your billing page or
              by messaging us through the{" "}
              <Link to="/contact" className="text-foreground underline underline-offset-4">
                contact page
              </Link>
              .
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">When it takes effect</h2>
            <p className="mt-2">
              Cancelling stops the next payment. Your website stays online and editable until the
              end of the period you have already paid for.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">After the paid period ends</h2>
            <p className="mt-2">
              Your website is taken offline and visitors no longer see it. Your account and content
              are kept for 30 days so you can restart at any time by paying again.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Getting your content back</h2>
            <p className="mt-2">
              Within those 30 days you can ask us for a copy of your text, images and enquiry list.
              After 30 days the data may be permanently deleted.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Your own domain</h2>
            <p className="mt-2">
              A domain you bought yourself stays yours. Once your site is offline, point that domain
              wherever you like — nothing is locked to us.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Failed payments</h2>
            <p className="mt-2">
              If a payment fails we retry and email you. If it stays unpaid, the site is paused
              rather than deleted, and it comes straight back once payment succeeds.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Refunds</h2>
            <p className="mt-2">
              Cancelling is not the same as a refund. See the{" "}
              <Link to="/refund-policy" className="text-foreground underline underline-offset-4">
                refund policy
              </Link>{" "}
              for when money is returned.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
