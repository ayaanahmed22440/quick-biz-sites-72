import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";

const TITLE = "How it works — WebWarheads";
const DESCRIPTION =
  "Sign up, answer a few questions about your business, pick a template, publish. WebWarheads handles hosting, SSL, domains and SEO fundamentals for you.";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  {
    title: "Create your account",
    body: "Email and password, or continue with Google. No card required to look around.",
  },
  {
    title: "Answer a few questions",
    body: "Business name, what you do, your phone number, the cities you serve, your opening hours. Plain questions in plain English — nothing technical.",
  },
  {
    title: "Choose your plan",
    body: "$37 for the website, $68 to add local SEO, $97 if you would rather we made the changes for you. Checkout is handled securely by our payment provider.",
  },
  {
    title: "Pick a template",
    body: "Professionally designed layouts built for your trade. Your logo, your colours and your photos go in — the structure stays solid so the site stays fast and search-friendly.",
  },
  {
    title: "Customise and publish",
    body: "Edit text, photos, services and contact details in a simple editor. Save a draft as often as you like, then Save & Publish when you are happy.",
  },
  {
    title: "Connect your domain",
    body: "Already own a domain? Point it at your site and we set up SSL. Don't have one? Buying through WebWarheads is on the way.",
  },
  {
    title: "Collect leads",
    body: "Every site has a contact form. Enquiries land in your dashboard so nothing gets lost in a personal inbox.",
  },
];

function HowItWorksPage() {
  return (
    <PublicLayout>
      <section className="border-b border-border bg-navy text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            You give us your business details. We handle the complicated part.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-navy-foreground/75">
            No hosting to buy, no DNS to configure, no developer to chase. Here is exactly what
            happens.
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <ol className="space-y-10">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-navy-foreground">
                  {i + 1}
                </span>
                <div>
                  <h2 className="text-lg font-semibold">{step.title}</h2>
                  <p className="mt-1.5 text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight">What we do not do</h2>
          <ul className="mt-6 space-y-3 text-muted-foreground">
            <li>
              We do not let a machine invent your website. Your site is built from a template our
              team designed and approved, filled with your real business information.
            </li>
            <li>
              We do not promise Google rankings. We build the SEO fundamentals correctly and tell
              you exactly what is in place.
            </li>
            <li>
              We do not charge you every time you want a photo changed on the $37 and $68 plans —
              you change it yourself in seconds.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Start with your business details.</h2>
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/auth" search={{ mode: "signup" }}>
              Get your website live <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
