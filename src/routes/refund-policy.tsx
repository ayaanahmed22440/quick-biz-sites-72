import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";

const TITLE = "Refund Policy — WebWarheads";
const DESCRIPTION =
  "When WebWarheads issues refunds on monthly and yearly website subscriptions, how to request one, and how long it takes.";

export const Route = createFileRoute("/refund-policy")({
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
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Draft policy. Needs review by WebWarheads before launch.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">7-day money-back guarantee</h2>
            <p className="mt-2">
              If you are not happy with your website, tell us within 7 days of your first payment
              and we will refund that payment in full. This applies once per customer.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Monthly subscriptions</h2>
            <p className="mt-2">
              After the first 7 days, monthly payments are non-refundable. Cancelling stops future
              charges, and your site stays online until the end of the period you have paid for.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Yearly subscriptions</h2>
            <p className="mt-2">
              Yearly plans can be refunded within 14 days of purchase. After that, we refund the
              unused full months remaining, minus the months already used at the standard monthly
              price.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Duplicate or failed charges</h2>
            <p className="mt-2">
              Accidental duplicate charges and payments taken after a confirmed cancellation are
              always refunded in full, as soon as we are told about them.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">What is not refunded</h2>
            <p className="mt-2">
              Third-party costs paid to other companies — such as a domain name bought from your own
              registrar — are not refundable by us. Accounts closed for breaking our terms are not
              refunded.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">How to request a refund</h2>
            <p className="mt-2">
              Send us a message through the{" "}
              <Link to="/contact" className="text-foreground underline underline-offset-4">
                contact page
              </Link>{" "}
              with the email on your account. We reply within 2 business days, and approved refunds
              return to your original payment method within 5–10 business days, depending on your
              bank or card issuer.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
