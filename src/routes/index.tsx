import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Image,
  LayoutTemplate,
  Monitor,
  Search,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { PricingCards } from "@/components/site/PricingCards";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import previewImage from "@/assets/templates/cleaning-gallery-1.jpg";
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
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

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
  return (
    <div className="animate-product-rise relative mx-auto mt-16 max-w-6xl px-3 sm:px-6">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_28px_80px_-36px_color-mix(in_oklab,var(--color-navy)_42%,transparent)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background px-3 py-3 sm:flex sm:px-4">
          <div className="flex shrink-0 gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
          </div>
          <div className="hidden min-w-0 flex-1 justify-center sm:flex">
            <div className="w-full max-w-md truncate rounded-md border border-border bg-muted px-4 py-1.5 text-center text-xs text-muted-foreground">
              webwarheads.com/your-business
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted p-1">
            <span className="rounded-sm bg-background p-1.5 text-foreground shadow-xs"><Monitor className="h-3.5 w-3.5" /></span>
            <span className="p-1.5 text-muted-foreground"><Smartphone className="h-3.5 w-3.5" /></span>
          </div>
        </div>

        <div className="grid min-h-[430px] bg-muted/50 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="hidden border-r border-border bg-card p-5 lg:block">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Website editor</p>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>
            </div>
            <div className="mt-6 space-y-2">
              {["Business details", "Services", "Photos", "Reviews", "Contact & hours"].map((item, index) => (
                <div key={item} className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm ${index === 1 ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground"}`}>
                  <span>{item}</span><ChevronRight className="h-4 w-4" />
                </div>
              ))}
            </div>
            <div className="mt-7 border-t border-border pt-5">
              <p className="text-xs font-bold uppercase text-muted-foreground">Brand color</p>
              <div className="mt-3 flex gap-2">
                {["bg-accent", "bg-navy", "bg-success", "bg-warning"].map((color) => <span key={color} className={`h-7 w-7 rounded-full border-2 border-card shadow-sm ${color}`} />)}
              </div>
            </div>
          </aside>

          <div className="p-3 sm:p-6 lg:p-8">
            <div className="mx-auto h-full max-w-4xl overflow-hidden rounded-lg border border-border bg-background shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="font-bold text-foreground">Greenline<span className="text-success">.</span></div>
                <div className="hidden gap-5 text-xs font-medium text-muted-foreground sm:flex"><span>Services</span><span>Our work</span><span>Contact</span></div>
                <span className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground">Free estimate</span>
              </div>
              <div className="grid min-h-[330px] content-center gap-8 p-6 sm:p-10 md:grid-cols-[1.08fr_.92fr] md:items-center">
                <div>
                  <span className="text-xs font-bold uppercase text-success">Austin's local landscape team</span>
                  <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground sm:text-4xl">Outdoor spaces made for living.</h2>
                  <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Thoughtful landscape design, dependable care and a team that keeps every project clear from day one.</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <span className="rounded-md bg-success px-4 py-2 text-xs font-bold text-success-foreground">Request a quote</span>
                    <span className="rounded-md border border-border px-4 py-2 text-xs font-bold text-foreground">See our work</span>
                  </div>
                </div>
                <div className="hidden aspect-[4/3] overflow-hidden rounded-lg bg-success/10 p-3 md:block">
                  <img src={previewImage} alt="Landscaped outdoor area shown in a customer website preview" className="h-full w-full rounded-md object-cover" />
                </div>
              </div>
              <div className="grid grid-cols-3 border-t border-border bg-muted/50 px-4 py-4 text-center">
                {["Fast quotes", "Local team", "Quality work"].map((item) => <span key={item} className="text-[10px] font-bold uppercase text-muted-foreground sm:text-xs">{item}</span>)}
              </div>
            </div>
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
            Your business deserves a website that <span className="text-accent">wins the local search.</span>
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