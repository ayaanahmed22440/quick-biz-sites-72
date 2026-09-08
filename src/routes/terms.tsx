import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";

const TITLE = "Terms of Service — WebWarheads";
const DESCRIPTION =
  "The terms that apply to WebWarheads website subscriptions, billing, content ownership and cancellation.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Draft terms. These need review by WebWarheads before launch.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. The service</h2>
            <p className="mt-2">
              WebWarheads provides website creation, hosting and related services to businesses on a
              monthly subscription. The features available depend on the plan purchased.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">2. Billing</h2>
            <p className="mt-2">
              Subscriptions are billed monthly in advance through our payment provider. Access to
              plan features begins when payment is confirmed and continues while the subscription
              remains active.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">3. Cancellation</h2>
            <p className="mt-2">
              You may cancel at any time. Your website remains available until the end of the paid
              billing period, after which it is taken offline.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">4. Your content</h2>
            <p className="mt-2">
              You own the business information, text, images and logos you upload. You confirm you
              have the right to use them. Templates and platform software remain the property of
              WebWarheads.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">5. Search engine results</h2>
            <p className="mt-2">
              SEO plans provide technical and local search fundamentals. WebWarheads does not
              guarantee any particular search engine ranking, traffic level or number of enquiries.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">6. Acceptable use</h2>
            <p className="mt-2">
              Websites may not be used for unlawful activity, misleading claims, or content that
              infringes the rights of others. We may suspend accounts that breach this.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">7. Contact</h2>
            <p className="mt-2">
              Questions about these terms can be sent through the contact page.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
