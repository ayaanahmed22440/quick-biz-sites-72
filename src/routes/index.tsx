import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Globe, MessageSquare, Search, Wrench } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { PricingCards } from "@/components/site/PricingCards";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TITLE = "WebWarheads — Websites for small & local businesses from $37/month";
const DESCRIPTION =
  "Stop paying $1,500+ upfront for a website. WebWarheads builds, hosts and maintains your business website for $37/month — live in days, no developer needed.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: HomePage,
});

const STEPS = [
  {
    title: "Tell us about your business",
    body: "Name, services, phone, the cities you cover. Five minutes, no technical questions.",
  },
  {
    title: "Pick your template",
    body: "Professionally built layouts for your trade. Your logo, your colours, your photos.",
  },
  {
    title: "Publish and get leads",
    body: "Hit publish, connect your domain, and contact form enquiries land in your dashboard.",
  },
];

const INCLUDED = [
  { icon: Globe, title: "Hosting, SSL and domain setup", body: "Handled for you. Nothing to configure, nothing extra to buy." },
  { icon: Wrench, title: "An editor you'll actually use", body: "Change text, photos, services and hours. No code, nothing to break." },
  { icon: Search, title: "Local SEO fundamentals", body: "Titles, meta, schema, sitemap and local keywords built from your real services and cities." },
  { icon: MessageSquare, title: "Human help", body: "Message us for changes. On Growth, we make the edits for you." },
];

const FAQS = [
  {
    q: "How is this cheaper than a web designer?",
    a: "A designer builds one site and charges for the build, then hosting and maintenance separately. We built the templates once and run every site on the same platform, so you pay a monthly price instead of a large upfront invoice.",
  },
  {
    q: "How fast can I be live?",
    a: "Most businesses finish onboarding in under 30 minutes and publish the same day. Connecting your own domain can take a few extra hours while DNS updates.",
  },
  {
    q: "Do I own my content?",
    a: "Yes. Your business information, copy, photos and domain are yours. If you leave, you keep your domain and your content.",
  },
  {
    q: "Do I need to understand hosting, DNS or SSL?",
    a: "No. That is the whole point. You give us your business information and we handle the technical side.",
  },
  {
    q: "Will you guarantee first place on Google?",
    a: "No, and be careful with anyone who does. We build the SEO fundamentals properly — correct titles, structure, local keywords, schema and indexing — which is what actually gives you a chance to rank.",
  },
  {
    q: "Can I cancel?",
    a: "Yes, monthly. Cancel any time and your site stays online to the end of the billing period.",
  },
];

function HomePage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16 md:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-navy-foreground/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-navy-foreground/80">
              For small &amp; local businesses
            </p>
            <h1 className="mt-5 text-[1.75rem] font-extrabold leading-[1.12] sm:text-4xl md:text-5xl lg:text-6xl">
              Your business website live for{" "}
              <span className="text-accent">$37 a month</span> — not $1,500 upfront.
            </h1>
            <p className="mt-5 max-w-xl text-base text-navy-foreground/75 sm:text-lg">
              We build it, host it, secure it and keep it running. You send us your business
              details; we handle everything technical. No developer, no setup fee, no waiting weeks
              for a quote.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get your website live
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-navy-foreground/25 bg-transparent text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
              >
                <Link to="/how-it-works">See how it works</Link>
              </Button>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-foreground/70">
              {["Live in days", "Cancel anytime", "No setup fee", "Real human support"].map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  {i}
                </li>
              ))}
            </ul>
          </div>

          {/* Cost comparison — plain, factual, no fake screenshots */}
          <div className="rounded-xl border border-navy-foreground/15 bg-navy-muted/40 p-6 sm:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-foreground/70">
              What a website normally costs
            </h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-navy-foreground/10 pb-4">
                <dt className="text-navy-foreground/75">Freelance designer, one-off build</dt>
                <dd className="whitespace-nowrap text-base font-semibold sm:text-lg">$1,500 – $5,000</dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-navy-foreground/10 pb-4">
                <dt className="text-navy-foreground/75">Hosting, SSL and maintenance</dt>
                <dd className="whitespace-nowrap text-base font-semibold sm:text-lg">$20 – $60/mo</dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-navy-foreground/10 pb-4">
                <dt className="text-navy-foreground/75">Every text or photo change</dt>
                <dd className="whitespace-nowrap text-base font-semibold sm:text-lg">$75 – $150/hr</dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 pt-1">
                <dt className="font-semibold text-navy-foreground">WebWarheads, all of it</dt>
                <dd className="whitespace-nowrap text-xl font-extrabold text-accent sm:text-2xl">$37/mo</dd>
              </div>
            </dl>
            <p className="mt-6 text-xs text-navy-foreground/55">
              Comparison figures are typical US market rates for small business websites, shown for
              context.
            </p>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
            Built for service businesses that need customers, not a design award
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            We start with cleaning companies and are adding more trades. If your customers find you
            by searching your service and your city, this is for you.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              "Cleaning",
              "Roofing",
              "Landscaping",
              "Plumbing",
              "Painting",
              "HVAC",
              "Construction",
              "Home services",
            ].map((niche, i) => (
              <span
                key={niche}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground"
              >
                {niche}
                {i === 0 ? (
                  <span className="ml-2 text-xs font-semibold text-accent">Available now</span>
                ) : (
                  <span className="ml-2 text-xs text-muted-foreground">Coming soon</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">What you get</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {INCLUDED.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-navy text-navy-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
            Three steps from nothing to live
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t-2 border-accent pt-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Step {index + 1}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
          <Button asChild variant="link" className="mt-6 px-0 text-accent">
            <Link to="/how-it-works">
              See the full process <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
              Simple monthly pricing
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every plan includes the website, hosting, SSL and support. Move up when you want to be
              found locally or want us doing the work for you.
            </p>
          </div>
          <div className="mt-10">
            <PricingCards compact />
          </div>
          <Button asChild variant="link" className="mt-6 px-0 text-accent">
            <Link to="/pricing">
              Compare plans in detail <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">Straight answers</h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQS.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl md:text-3xl">Ready to stop putting this off?</h2>
            <p className="mt-2 text-navy-foreground/75">
              Create your account, answer a few questions about your business, publish.
            </p>
          </div>
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/auth" search={{ mode: "signup" }}>
              Get your website live
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
