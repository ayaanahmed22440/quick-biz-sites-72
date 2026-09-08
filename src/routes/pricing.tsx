import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { PricingCards } from "@/components/site/PricingCards";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TITLE = "Pricing — WebWarheads websites from $37/month";
const DESCRIPTION =
  "Three plans: $37 website, $68 website + local SEO, $97 growth with human edits and priority support. No setup fees, cancel anytime.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: PricingPage,
});

const MATRIX: { label: string; basic: boolean; seo: boolean; premium: boolean }[] = [
  { label: "Professional website", basic: true, seo: true, premium: true },
  { label: "Hosting and SSL", basic: true, seo: true, premium: true },
  { label: "Connect your own domain", basic: true, seo: true, premium: true },
  { label: "Mobile responsive design", basic: true, seo: true, premium: true },
  { label: "Website editor", basic: true, seo: true, premium: true },
  { label: "Services, hours and business info", basic: true, seo: true, premium: true },
  { label: "Logo and image management", basic: true, seo: true, premium: true },
  { label: "Lead capture form", basic: true, seo: true, premium: true },
  { label: "Standard support", basic: true, seo: true, premium: true },
  { label: "Local keyword targeting", basic: false, seo: true, premium: true },
  { label: "Page titles and meta descriptions", basic: false, seo: true, premium: true },
  { label: "Heading structure and image alt text", basic: false, seo: true, premium: true },
  { label: "Sitemap, robots.txt and indexing setup", basic: false, seo: true, premium: true },
  { label: "LocalBusiness and Service schema", basic: false, seo: true, premium: true },
  { label: "SEO status dashboard", basic: false, seo: true, premium: true },
  { label: "Priority support queue", basic: false, seo: false, premium: true },
  { label: "Human website edits", basic: false, seo: false, premium: true },
  { label: "Enhanced SEO assistance", basic: false, seo: false, premium: true },
  { label: "Early access to new features", basic: false, seo: false, premium: true },
];

const FAQS = [
  {
    q: "Which plan should I start on?",
    a: "If you only need a professional site people can find when you send them the link, start at $37. If you want to be found by people searching your service in your area, $68 is the one that matters.",
  },
  {
    q: "What does 'human website edits' mean on the $97 plan?",
    a: "You message us what you want changed — a new photo, a new service, updated hours — and our team makes the change for you instead of you doing it in the editor.",
  },
  {
    q: "Can I change plan later?",
    a: "Yes. Upgrades apply immediately and the extra features unlock automatically. Downgrades apply at your next billing date.",
  },
  {
    q: "Is there a setup fee or contract?",
    a: "No setup fee and no contract. Monthly billing, cancel whenever you want.",
  },
  {
    q: "What about my domain?",
    a: "You can connect a domain you already own on every plan. Buying a domain through WebWarheads is coming soon; until then you can register one anywhere and point it at your site.",
  },
];

function Cell({ ok }: { ok: boolean }) {
  return ok ? (
    <Check className="mx-auto h-4 w-4 text-accent" aria-label="Included" />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Not included" />
  );
}

function PricingPage() {
  return (
    <PublicLayout>
      <section className="border-b border-border bg-navy text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            One monthly price. Website, hosting and support included.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-navy-foreground/75">
            No build fee, no hourly charges for small changes, no surprise renewal invoices.
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <PricingCards />
        </div>
      </section>

      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight">Compare every feature</h2>
          <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-4 font-semibold">Feature</th>
                  <th className="px-5 py-4 text-center font-semibold">$37</th>
                  <th className="px-5 py-4 text-center font-semibold text-accent">$68</th>
                  <th className="px-5 py-4 text-center font-semibold">$97</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-muted-foreground">{row.label}</td>
                    <td className="px-5 py-3">
                      <Cell ok={row.basic} />
                    </td>
                    <td className="px-5 py-3">
                      <Cell ok={row.seo} />
                    </td>
                    <td className="px-5 py-3">
                      <Cell ok={row.premium} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            SEO plans build the technical and local fundamentals. No provider can guarantee search
            rankings and we do not claim to.
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight">Pricing questions</h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQS.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-10 rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold">Still not sure?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us about your business and we will tell you honestly which plan fits.
            </p>
            <Button asChild className="mt-4">
              <Link to="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
