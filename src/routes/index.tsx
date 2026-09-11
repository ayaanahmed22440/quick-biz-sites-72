import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Image,
  LayoutTemplate,
  Monitor,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { PreviewFrame } from "@/components/app/PreviewFrame";
import { PublicLayout } from "@/components/site/PublicLayout";
import { PublicSiteView, publicSiteMeta } from "@/components/site/PublicSiteView";
import { getSiteForHost, type HostedSite } from "@/lib/public-site.functions";
import { LocalBusinessTemplate } from "@/components/templates/LocalBusinessTemplate";
import { PricingCards } from "@/components/site/PricingCards";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { defaultSiteContent } from "@/lib/site-content";
import { previewDataFor } from "@/lib/template-preview-data";
import { TEMPLATE_PRESETS } from "@/lib/template-registry";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TITLE = "WebWarheads — Local Business Websites from $37";
const DESCRIPTION =
  "Build, edit and publish a professional local-business website with hosting, leads and support included from $37/month.";

export const Route = createFileRoute("/")({
  loader: async () =>
    (await getSiteForHost({
      data: { host: typeof document === "undefined" ? null : window.location.hostname },
    })) as HostedSite | null,
  head: ({ loaderData }) =>
    loaderData
      ? publicSiteMeta(loaderData.site)
      : {
          meta: [
            { title: TITLE },
            { name: "description", content: DESCRIPTION },
            { property: "og:title", content: TITLE },
            { property: "og:description", content: DESCRIPTION },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary_large_image" },
          ],
        },
  component: RootIndex,
});

/** A customer's own domain serves their website here; everything else sees the marketing page. */
function RootIndex() {
  const hosted = Route.useLoaderData();
  if (hosted) return <PublicSiteView site={hosted.site} slug={hosted.slug} />;
  return <HomePage />;
}

const FEATURES = [
  { icon: LayoutTemplate, title: "Start with a proven design", body: "Choose a polished layout built for service businesses, then make it yours." },
  { icon: Image, title: "Edit without breaking anything", body: "Change services, photos, reviews and hours in one straightforward workspace." },
  { icon: Send, title: "Turn visits into enquiries", body: "Built-in contact forms send every new lead to your dashboard and inbox." },
  { icon: Search, title: "Get the local basics right", body: "Clean structure, metadata and service-area information are handled from the start." },
];

const FAQS: ReadonlyArray<readonly [string, string]> = [
  ["Can I see my website before paying?", "Yes. Build the site, add your real details and preview the result first. Payment is only required when you publish."],
  ["Do I need to know how to code?", "No. The editor only asks for the information your customers need, and the design stays protected."],
  ["Can I use my own domain?", "Yes. Publish first, then follow the guided steps to connect a domain you already own."],
  ["Can I cancel?", "Yes. Plans are monthly and you can cancel at any time. Your site remains available through the paid period."],
];

function ProductPreview() {
  const [activeNiche, setActiveNiche] = useState("cleaning");
  const activePreset =
    TEMPLATE_PRESETS.find((preset) => preset.niche === activeNiche) ?? TEMPLATE_PRESETS[0];
  const previewData = previewDataFor(activePreset?.niche ?? "cleaning");
  const content = useMemo(
    () =>
      defaultSiteContent({
        businessName: previewData.business.name,
        city: previewData.business.city,
        primaryService: activePreset?.copy.service ?? null,
        primaryColor: activePreset?.accent ?? null,
        templateId: activePreset?.templateId ?? null,
      }),
    [activePreset, previewData.business.city, previewData.business.name],
  );
  const address = `webwarheads.com/${previewData.business.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

  return (
    <div className="animate-product-rise relative mx-auto mt-14 max-w-7xl px-3 sm:mt-16 sm:px-6 lg:px-8">
      <div className="mb-5 text-center">
        <p className="text-xs font-bold uppercase text-accent">Pick your industry</p>
        <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">See a site built for your business</h2>
      </div>

      <div
        className="flex snap-x gap-2 overflow-x-auto pb-3 sm:flex-wrap sm:justify-center"
        role="tablist"
        aria-label="Business template industries"
      >
        {TEMPLATE_PRESETS.map((preset) => {
          const selected = preset.niche === activeNiche;
          return (
            <Button
              key={preset.niche}
              type="button"
              role="tab"
              aria-selected={selected}
              variant={selected ? "default" : "outline"}
              className={selected ? "snap-start bg-navy text-navy-foreground hover:bg-navy/90" : "snap-start bg-card"}
              onClick={() => setActiveNiche(preset.niche)}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: preset.accent }}
                aria-hidden="true"
              />
              {preset.industryLabel}
            </Button>
          );
        })}
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-[0_28px_80px_-36px_color-mix(in_oklab,var(--color-navy)_42%,transparent)]">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-muted/70 px-3 py-3 sm:gap-4 sm:px-4">
          <div className="flex shrink-0 gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
          </div>
          <div className="min-w-0 truncate rounded-md border border-border bg-background px-3 py-1.5 text-center text-[10px] text-muted-foreground sm:text-xs">
            {address}
          </div>
          <div className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-muted-foreground sm:text-xs">
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desktop preview</span>
          </div>
        </div>

        <div className="bg-muted/50 p-2 sm:p-5 lg:p-7">
          <div key={activeNiche} className="animate-template-swap mx-auto overflow-hidden rounded-lg border border-border bg-background shadow-xl">
            <PreviewFrame width={1280} height={720}>
              <LocalBusinessTemplate
                business={previewData.business}
                content={content}
                services={previewData.services}
                areas={previewData.areas}
                hours={previewData.hours}
                reviews={previewData.reviews}
                previewOnly
              />
            </PreviewFrame>
          </div>
        </div>
      </div>
      <div className="mx-auto h-8 w-[82%] rounded-b-full bg-navy/10 blur-xl" aria-hidden="true" />
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  useEffect(() => {
    const target = sessionStorage.getItem("ww:after-login");
    if (target !== "/admin" && target !== "/dashboard") return;
    const forward = (hasSession: boolean) => {
      if (!hasSession) return;
      sessionStorage.removeItem("ww:after-login");
      void navigate({ to: target, replace: true });
    };
    void supabase.auth.getSession().then(({ data }) => forward(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => forward(Boolean(session)));
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  return (
    <PublicLayout>
      <section className="overflow-hidden bg-background">
        <div className="mx-auto max-w-5xl px-4 pb-4 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-[11px] font-bold uppercase text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Built for local business owners
          </div>
          <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-bold leading-[1.04] text-foreground sm:text-6xl lg:text-7xl">
            Stop paying $1,500 for a website. <span className="text-accent">Start with $37.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-xl sm:leading-8">
            Build, preview and publish a professional website without hiring a developer. Everything you need, from <strong className="font-semibold text-foreground">$37 a month.</strong>
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-accent px-7 text-accent-foreground hover:bg-accent/90">
              <Link to="/auth" search={{ mode: "signup" }}>Build my website free <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7">
              <Link to="/how-it-works">See how it works</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No setup fee · Preview before you pay · Cancel anytime</p>
        </div>
        <ProductPreview />
      </section>

      <section className="border-y border-border bg-navy text-navy-foreground">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 text-center sm:grid-cols-3 sm:px-6 lg:px-8">
          {["Website, hosting and SSL included", "Built to turn visitors into leads", "Your content and domain stay yours"].map((item) => (
            <div key={item} className="flex items-center justify-center gap-2 text-sm font-semibold"><Check className="h-4 w-4 text-accent" />{item}</div>
          ))}
        </div>
      </section>

      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-accent">ONE PLACE TO RUN YOUR SITE</p>
            <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-5xl">The website work, without the website headache.</h2>
            <p className="mt-5 text-lg text-muted-foreground">Everything is designed around what a busy local owner actually needs to change and track.</p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="bg-card p-7 sm:p-9">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-accent"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-6 text-xl font-bold text-foreground">{title}</h3>
                <p className="mt-2 max-w-md leading-7 text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold text-accent">FROM IDEA TO LIVE</p>
            <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-5xl">Three steps. No technical detour.</h2>
          </div>
          <ol className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              ["01", "Tell us about the business", "Answer focused questions about your services, location and brand."],
              ["02", "See the real website", "Choose a design and watch your details appear in a working preview."],
              ["03", "Publish when you are ready", "Pick a plan only after you have seen the result, then go live."],
            ].map(([number, title, body]) => (
              <li key={number} className="border-t border-border pt-6">
                <span className="font-mono text-sm font-bold text-accent">{number}</span>
                <h3 className="mt-6 text-xl font-bold text-foreground">{title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold text-accent">SIMPLE PRICING</p>
            <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-5xl">Start at $37. Grow when it makes sense.</h2>
            <p className="mt-5 text-lg text-muted-foreground">Every plan includes the website, editor, hosting and support. No setup fee.</p>
          </div>
          <div className="mt-14"><PricingCards compact /></div>
          <div className="mt-8 text-center"><Button asChild variant="link" className="text-accent"><Link to="/pricing">Compare every feature <ArrowRight /></Link></Button></div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/50 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-bold text-accent">STRAIGHT ANSWERS</p>
            <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">Know what you are getting.</h2>
            <p className="mt-4 text-muted-foreground">No ranking promises, hidden build fees or technical runaround.</p>
          </div>
          <Accordion type="single" collapsible>
            {FAQS.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger className="text-left text-base font-bold">{q}</AccordionTrigger><AccordionContent className="leading-6 text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
          </Accordion>
        </div>
      </section>

      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-7 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">See your business online today.</h2>
            <p className="mt-3 text-navy-foreground/70">Build the preview free. Pay only when it is ready to publish.</p>
          </div>
          <Button asChild size="lg" className="h-12 shrink-0 bg-accent px-7 text-accent-foreground hover:bg-accent/90"><Link to="/auth" search={{ mode: "signup" }}>Start building <ArrowRight /></Link></Button>
        </div>
      </section>
    </PublicLayout>
  );
}