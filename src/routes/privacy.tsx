import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";

const TITLE = "Privacy Policy — WebWarheads";
const DESCRIPTION =
  "What data WebWarheads collects from business owners and website visitors, how it is used, and how it is protected.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Draft policy. These need review by WebWarheads before launch.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">What we collect</h2>
            <p className="mt-2">
              Account details (name, email), business information you enter (business name,
              services, addresses, opening hours, images), billing status from our payment provider,
              and enquiries submitted through your website's contact form.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">How we use it</h2>
            <p className="mt-2">
              To create and run your website, to show you your leads, to provide support, and to
              manage your subscription. We do not sell personal data.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Payment data</h2>
            <p className="mt-2">
              Card details are handled entirely by our payment provider. WebWarheads never sees or
              stores card numbers.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Data separation</h2>
            <p className="mt-2">
              Each business's data is isolated at the database level. Other customers cannot access
              your business information or your leads.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Your rights</h2>
            <p className="mt-2">
              You can request a copy of your data or ask us to delete your account through the
              contact page.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
