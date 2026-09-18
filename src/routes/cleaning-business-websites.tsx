import { useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Check,
  CircleDollarSign,
  Clock3,
  Image as ImageIcon,
  Laptop,
  MapPin,
  MessageSquareQuote,
  Phone,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import cleaningHero from "@/assets/templates/cleaning-hero.jpg";
import cleaningGalleryOne from "@/assets/templates/cleaning-gallery-1.jpg";
import cleaningGalleryTwo from "@/assets/templates/cleaning-gallery-2.jpg";
import { PreviewFrame } from "@/components/app/PreviewFrame";
import { PublicLayout } from "@/components/site/PublicLayout";
import { LocalBusinessTemplate } from "@/components/templates/LocalBusinessTemplate";
import { defaultSiteContent } from "@/lib/site-content";
import { previewDataFor } from "@/lib/template-preview-data";
import { TEMPLATE_PRESETS } from "@/lib/template-registry";
import { trackViewContent, trackLead } from "@/lib/meta-pixel";
import { BusinessNameStart } from "@/components/site/BusinessNameStart";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PAGE_URL = "https://www.webwarheads.com/cleaning-business-websites";
const TITLE = "Cleaning Business Websites from $37 | WebWarheads";
const DESCRIPTION =
  "Build and preview a professional cleaning business website before paying. No coding or developer required. Plans start at $37/month.";

export const Route = createFileRoute("/cleaning-business-websites")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: CleaningBusinessLandingPage,
});

const painJourney = [
  "Customer searches",
  "Can't find a professional website",
  "Doubts the business",
  "Finds another cleaning company",
  "Books them",
];

const trustJourney = [
  "Professional website",
  "Sees your services",
  "Sees your work",
  "Sees your reviews",
  "Trusts your business",
  "Requests a quote",
];

const steps = [
  ["01", "Choose Your Template", "Start with a professional website designed specifically for cleaning businesses."],
  ["02", "Add Your Business", "Add your company, services, photos, reviews, service areas, contact details and branding."],
  ["03", "Customize It", "Make the website feel like your business without touching a line of code."],
  ["04", "Preview Before You Pay", "See the real website on desktop and mobile before choosing a plan."],
  ["05", "Launch", "Like what you see? Choose your plan and put your website live."],
] as const;

const benefits = [
  [BadgeCheck, "Look Professional", "Give potential customers a polished place to learn about your business."],
  [ShieldCheck, "Build Trust Before The First Call", "Show your services, photos, reviews and company information before customers contact you."],
  [ImageIcon, "Show Off Your Work", "Turn your best cleaning results into a visual portfolio."],
  [MessageSquareQuote, "Make Getting A Quote Easy", "Give customers obvious ways to contact you and request information."],
  [Smartphone, "Look Great On Phones", "Customers can browse your website while searching for a cleaner from their phone."],
  [Wrench, "Update It Yourself", "Stop relying on a developer every time you need to change something."],
  [Laptop, "Preview Before You Pay", "See your website before committing to a plan."],
  [CircleDollarSign, "Start At $37/Month", "Skip the large upfront website project."],
] as const;

const showcaseDetails: ReadonlyArray<readonly [LucideIcon, string, string]> = [
  [Sparkles, "Your Services", "Make it obvious what you clean — from recurring and deep cleaning to move-out and commercial work."],
  [ImageIcon, "Your Work", "Show real photos of your cleaning results."],
  [Star, "Your Reviews", "Let potential customers see what previous customers think."],
  [MapPin, "Your Service Area", "Show the cities and areas you serve."],
  [UserRound, "About Your Company", "Tell customers who they'll be inviting into their home."],
  [Phone, "Contact / Quote", "Make it easy for customers to get in touch."],
];

const trustMarkers: ReadonlyArray<readonly [LucideIcon, string, string]> = [
  [ShieldCheck, "Preview first", "See it before paying"],
  [Smartphone, "Mobile-ready", "Looks sharp on phones"],
  [MapPin, "Your own domain", "Use your business address"],
  [Wrench, "Edit anytime", "Stay in control"],
  [BadgeCheck, "Hosting included", "One less thing to manage"],
];

const faqs = [
  ["Do I need coding experience?", "No. WebWarHeads is designed for business owners who don't know how to code."],
  ["Do I need to hire a developer?", "No. You build and customize the website yourself."],
  ["Can I see my website before paying?", "Yes. Preview your website before choosing a plan."],
  ["How much does it cost?", "Plans start at $37/month."],
  ["Can I use my own domain?", "Yes. You can connect your own domain."],
  ["Can I add my own cleaning photos?", "Yes. Add your own photos, project images, logo and branding."],
  ["Can I update my website later?", "Yes. You can make changes yourself instead of relying on a developer."],
  ["What if I don't like the website?", "Preview it before you pay. You don't have to commit to a plan before seeing your website."],
] as const;

function BuildButton({ className = "" }: { label?: string; className?: string }) {
  return (
    <BusinessNameStart
      className={className}
      onSubmitTrack={() => trackLead()}
      placeholder="Enter your cleaning business name..."
    />
  );
}

function CleaningSiteMockup({ large = false }: { large?: boolean }) {
  const cleaningPreset = TEMPLATE_PRESETS.find((preset) => preset.niche === "cleaning");
  const previewData = previewDataFor("cleaning");
  const content = useMemo(
    () =>
      defaultSiteContent({
        businessName: previewData.business.name,
        city: previewData.business.city,
        primaryService: cleaningPreset?.copy.service ?? "Residential cleaning",
        primaryColor: cleaningPreset?.accent ?? null,
        templateId: cleaningPreset?.templateId ?? "cleaning-01",
      }),
    [cleaningPreset, previewData.business.city, previewData.business.name],
  );

  return (
    <div className={large ? "mx-auto w-full max-w-6xl" : "w-full"}>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-navy/15">
        <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning" />
          <span className="h-2.5 w-2.5 rounded-full bg-success" />
          <div className="mx-auto rounded-md border border-border bg-background px-5 py-1 text-[10px] text-muted-foreground sm:text-xs">sparkleandshinecleaning.com</div>
        </div>
        <div className="bg-muted/40 p-2 sm:p-5">
          <div className="overflow-hidden rounded-lg border border-border bg-background shadow-xl">
            <PreviewFrame width={1280} height={large ? 900 : 760}>
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

function CleaningBusinessLandingPage() {
  useEffect(() => {
    trackViewContent("cleaning_business_websites");
  }, []);

  return (
    <PublicLayout>
      <section className="overflow-hidden bg-background">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-14 text-center sm:px-6 sm:pt-20 lg:px-8 lg:pb-28">
          <div className="mx-auto max-w-5xl">
            <div className="animate-hero-entry inline-flex items-center gap-2 rounded-full border border-accent/25 bg-cleaning-surface px-4 py-2 text-xs font-bold uppercase text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Built for cleaning businesses
            </div>
            <h1 className="animate-hero-entry animate-hero-delay-1 mx-auto mt-7 max-w-5xl text-4xl font-black leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
              A professional cleaning website. <span className="text-accent">Without the $1,500+ agency bill.</span>
            </h1>
            <p className="animate-hero-entry animate-hero-delay-2 mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Build a website made for your cleaning business, add your services and photos, then preview the whole thing before you pay.
            </p>
            <p className="mt-6 font-display text-2xl font-bold text-foreground sm:text-3xl">Starting at <span className="text-accent">$37/month</span></p>
            <div className="animate-hero-entry animate-hero-delay-3 mt-8 flex justify-center">
              <BuildButton />
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-foreground">
              {["No coding", "No developer", "Preview before you pay"].map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" />{item}</span>)}
            </div>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">Build it. Preview it. Launch it.</p>
          </div>

          <div className="animate-product-rise mx-auto mt-14 max-w-5xl pb-8 sm:mt-16"><CleaningSiteMockup large /></div>

          <div className="mx-auto mt-4 grid max-w-5xl overflow-hidden rounded-xl border border-border bg-cleaning-surface sm:grid-cols-5">
            {trustMarkers.map(([Icon, title, body], index) => (
              <div key={String(title)} className={`flex items-center justify-center gap-3 px-4 py-5 text-left ${index > 0 ? "border-t border-border sm:border-l sm:border-t-0" : ""}`}>
                <Icon className="h-5 w-5 shrink-0 text-accent" />
                <div><p className="text-sm font-bold text-foreground">{title}</p><p className="text-xs text-muted-foreground">{body}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/50 py-20 sm:py-28" data-cleaning-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-bold uppercase text-accent">The first impression matters</p>
            <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-5xl">You're great at cleaning. Your website shouldn't make you look like you're not.</h2>
            <p className="mt-5 text-xl font-semibold text-foreground">Your customers aren't just buying a clean house. They're trusting you with their home.</p>
            <p className="mx-auto mt-4 max-w-3xl leading-7 text-muted-foreground">Before booking, homeowners often want to see who you are, what you offer, where you work, what other customers say and how to contact you. If they can't find that quickly, they may move on.</p>
          </div>
          <div className="mt-12 grid overflow-hidden rounded-lg border border-border lg:grid-cols-2">
            <div className="bg-card p-6 sm:p-9">
              <p className="text-sm font-bold uppercase text-destructive">Without a professional website</p>
              <div className="mt-6 space-y-3">{painJourney.map((item, index) => <div key={item}><div className="flex items-center gap-3 font-semibold text-foreground"><X className="h-5 w-5 shrink-0 text-destructive" />{item}</div>{index < painJourney.length - 1 ? <ArrowDown className="ml-1.5 mt-2 h-4 w-4 text-muted-foreground" /> : null}</div>)}</div>
            </div>
            <div className="border-t border-border bg-navy p-6 text-navy-foreground lg:border-l lg:border-t-0 sm:p-9">
              <p className="text-sm font-bold uppercase text-accent">With a professional website</p>
              <div className="mt-6 space-y-3">{trustJourney.map((item, index) => <div key={item}><div className="flex items-center gap-3 font-semibold"><Check className="h-5 w-5 shrink-0 text-success" />{item}</div>{index < trustJourney.length - 1 ? <ArrowDown className="ml-1.5 mt-2 h-4 w-4 text-navy-foreground/50" /> : null}</div>)}</div>
            </div>
          </div>
          <div className="mt-9 text-center"><BuildButton /></div>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-28" data-cleaning-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center"><p className="text-sm font-bold uppercase text-accent">The old way vs. a simpler way</p><h2 className="mx-auto mt-4 max-w-4xl text-3xl font-bold text-foreground sm:text-5xl">Getting a website shouldn't cost you $1,500+.</h2></div>
          <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <div className="rounded-lg border border-border bg-muted/40 p-7 sm:p-9">
              <p className="font-display text-xl font-bold text-muted-foreground">The traditional agency process</p>
              <ol className="mt-7 space-y-4 text-foreground">{["Find a developer", "Explain what you want", "Wait for the design", "Send revisions", "Wait again", "Pay for changes", "Pay monthly maintenance", "Hope you like the final website"].map((item, index) => <li key={item} className="flex gap-3"><span className="text-sm font-bold text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><span>{item}</span></li>)}</ol>
            </div>
            <div className="flex items-center justify-center"><div className="rounded-full border border-border bg-background px-4 py-2 text-sm font-bold text-muted-foreground">OR</div></div>
            <div className="rounded-lg border-2 border-accent bg-card p-7 shadow-xl shadow-accent/10 sm:p-9">
              <p className="text-sm font-bold uppercase text-accent">WebWarheads</p>
              <p className="mt-3 font-display text-5xl font-bold text-foreground">$37<span className="text-base font-medium text-muted-foreground">/month</span></p>
              <p className="mt-2 font-semibold text-foreground">There's a simpler way.</p>
              <ul className="mt-7 space-y-4">{["Choose your cleaning template", "Add your business", "Customize it yourself", "Preview it before you pay", "Like it? Launch."].map((item) => <li key={item} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-success" /><span className="text-foreground">{item}</span></li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-navy py-20 text-navy-foreground sm:py-28" data-cleaning-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase text-accent">Preview before you pay</p><h2 className="mt-4 text-3xl font-bold sm:text-5xl">Don't pay for a website you haven't even seen yet.</h2><p className="mt-5 text-lg leading-8 text-navy-foreground/75">Build your website first. See exactly what it looks like. If you like it, choose your plan and launch.</p></div>
          <div className="mt-12 rounded-xl bg-background p-2 sm:p-5"><CleaningSiteMockup large /></div>
          <div className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-3 text-xs font-bold uppercase sm:gap-5">{["Build", "Customize", "Preview", "Like it?", "Launch"].map((item, index) => <div key={item} className="flex items-center gap-3 sm:gap-5"><span className="rounded-md border border-navy-foreground/20 px-4 py-2">{item}</span>{index < 4 ? <ArrowRight className="h-4 w-4 text-accent" /> : null}</div>)}</div>
          <p className="mx-auto mt-7 max-w-2xl text-center text-navy-foreground/70">No guessing. No paying thousands upfront just to find out you don't like the result.</p>
          <div className="mt-8 text-center"><BuildButton /></div>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-28" data-cleaning-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase text-accent">How it works</p><h2 className="mt-4 text-3xl font-bold text-foreground sm:text-5xl">Your cleaning website in a few simple steps.</h2></div>
          <ol className="mt-14 border-t border-border">{steps.map(([number, title, body]) => <li key={number} className="grid gap-4 border-b border-border py-7 sm:grid-cols-[80px_1fr_1.2fr] sm:items-center"><span className="font-display text-2xl font-bold text-accent">{number}</span><h3 className="text-xl font-bold text-foreground">{title}</h3><p className="leading-7 text-muted-foreground">{body}</p></li>)}</ol>
          <div className="mt-9 text-center"><BuildButton /></div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/50 py-20 sm:py-28" data-cleaning-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center"><p className="text-sm font-bold uppercase text-accent">Your complete cleaning website</p><h2 className="mt-4 text-3xl font-bold text-foreground sm:text-5xl">Everything a cleaning customer wants to see.</h2></div>
          <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1.2fr_.8fr]">
            <div className="grid grid-cols-2 gap-3">
              <img src={cleaningGalleryOne} alt="Bright professionally cleaned bathroom" loading="lazy" className="aspect-[4/5] h-full w-full rounded-lg object-cover" />
              <div className="space-y-3"><img src={cleaningHero} alt="Professional residential cleaner" loading="lazy" className="aspect-square w-full rounded-lg object-cover" /><img src={cleaningGalleryTwo} alt="Professional commercial cleaner at work" loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" /></div>
            </div>
            <div className="space-y-7">{showcaseDetails.map(([Icon, title, body]) => <div key={title} className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-accent"><Icon className="h-5 w-5" /></div><div><h3 className="font-bold text-foreground">{title}</h3><p className="mt-1 leading-6 text-muted-foreground">{body}</p></div></div>)}</div>
          </div>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-28" data-cleaning-reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase text-accent">Made for the way you work</p><h2 className="mt-4 text-3xl font-bold text-foreground sm:text-5xl">Built around what cleaning businesses actually need.</h2></div>
          <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(([Icon, title, body]) => <article key={title} className="border-t-2 border-navy pt-6"><Icon className="h-6 w-6 text-accent" /><h3 className="mt-5 text-lg font-bold text-foreground">{title}</h3><p className="mt-2 leading-6 text-muted-foreground">{body}</p></article>)}</div>
          <div className="mt-12 text-center"><BuildButton /></div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/50 py-20 sm:py-28" data-cleaning-reveal>
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div><p className="text-sm font-bold uppercase text-accent">Your online home</p><h2 className="mt-4 text-3xl font-bold text-foreground sm:text-5xl">Your Facebook page isn't your website.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">Social media is great for marketing your cleaning business. Your website gives customers one professional place to learn about it.</p></div>
          <div className="grid overflow-hidden rounded-lg border border-border sm:grid-cols-2">
            <div className="bg-card p-7"><h3 className="text-lg font-bold text-foreground">Social media</h3><ul className="mt-6 space-y-3">{["Algorithm-controlled", "Customers dig through posts", "Services can be difficult to find", "Important information gets buried", "Less control over the experience"].map((item) => <li key={item} className="flex gap-3 text-muted-foreground"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />{item}</li>)}</ul></div>
            <div className="border-t border-border bg-navy p-7 text-navy-foreground sm:border-l sm:border-t-0"><h3 className="text-lg font-bold">Your website</h3><ul className="mt-6 space-y-3">{["Your own online home", "Services clearly organized", "Reviews easy to find", "Service areas visible", "Contact details always available", "Built to turn visits into inquiries"].map((item) => <li key={item} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{item}</li>)}</ul></div>
          </div>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-28" data-cleaning-reveal>
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <Search className="mx-auto h-10 w-10 text-accent" />
          <h2 className="mx-auto mt-6 max-w-4xl text-3xl font-bold text-foreground sm:text-5xl">Imagine a homeowner searching for a cleaner tonight.</h2>
          <div className="mx-auto mt-10 grid max-w-5xl gap-4 text-left md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6"><span className="text-sm font-bold text-muted-foreground">BUSINESS 1</span><p className="mt-5 text-xl font-bold text-foreground">No website</p></div>
            <div className="rounded-lg border border-border bg-card p-6"><span className="text-sm font-bold text-muted-foreground">BUSINESS 2</span><p className="mt-5 text-xl font-bold text-foreground">An outdated website</p></div>
            <div className="rounded-lg border-2 border-accent bg-card p-6"><span className="text-sm font-bold text-accent">BUSINESS 3</span><p className="mt-5 text-xl font-bold text-foreground">Services, reviews, photos and an easy quote request</p></div>
          </div>
          <p className="mt-9 text-xl font-semibold text-foreground">Which business looks easiest to trust?</p><p className="mt-3 text-muted-foreground">Give your business a professional place to make a first impression.</p>
          <div className="mt-8"><BuildButton /></div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/50 py-20 sm:py-28" data-cleaning-reveal>
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[.75fr_1.25fr] lg:px-8">
          <div><p className="text-sm font-bold uppercase text-accent">Straight answers</p><h2 className="mt-4 text-3xl font-bold text-foreground sm:text-5xl">Think building a website is complicated?</h2><p className="mt-5 leading-7 text-muted-foreground">It doesn't have to be. These are the questions cleaning business owners ask us most.</p></div>
          <Accordion type="single" collapsible>{faqs.map(([question, answer]) => <AccordionItem key={question} value={question}><AccordionTrigger className="text-left text-base font-bold">{question}</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">{answer}</AccordionContent></AccordionItem>)}</Accordion>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-28" data-cleaning-reveal>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center"><p className="text-sm font-bold uppercase text-accent">Simple monthly pricing</p><h2 className="mt-4 text-3xl font-bold text-foreground sm:text-5xl">Professional website. Without the $1,500+ project.</h2></div>
          <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-xl border-2 border-accent bg-card shadow-2xl shadow-accent/10">
            <div className="grid md:grid-cols-[.8fr_1.2fr]">
              <div className="bg-navy p-8 text-navy-foreground sm:p-10"><p className="text-sm font-bold uppercase text-accent">Starts at</p><p className="mt-4 font-display text-6xl font-bold">$37</p><p className="mt-1 text-navy-foreground/70">per month</p><p className="mt-7 text-lg font-semibold">Everything you need to get your cleaning business online.</p></div>
              <div className="p-8 sm:p-10"><ul className="grid gap-3 sm:grid-cols-2">{["Professional cleaning website", "Designed cleaning template", "Your business information", "Your own photos", "Your logo and branding", "Mobile-friendly design", "Domain connection", "Hosting included", "Preview before you pay"].map((item) => <li key={item} className="flex gap-2.5 text-sm text-foreground"><Check className="h-4 w-4 shrink-0 text-success" />{item}</li>)}</ul><div className="mt-8"><BuildButton className="w-full" /></div></div>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">No coding. No developer. No $1,500+ upfront website project.</p>
        </div>
      </section>

      <section className="bg-navy py-20 text-navy-foreground sm:py-28" data-cleaning-reveal>
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <Clock3 className="mx-auto h-9 w-9 text-accent" /><h2 className="mt-6 text-4xl font-bold sm:text-6xl">Your next customer is looking for a cleaner.</h2><p className="mx-auto mt-5 max-w-2xl text-xl text-navy-foreground/75">Give them somewhere professional to find your business.</p>
          <div className="mx-auto mt-8 max-w-xl space-y-2 text-lg font-semibold"><p>Build your cleaning business website.</p><p>Preview it before you pay.</p><p>Launch when you're ready.</p></div>
          <p className="mt-7 font-display text-2xl font-bold text-accent">Starting at $37/month</p>
          <div className="mt-8 flex justify-center"><BuildButton /></div>
        </div>
      </section>

      <section className="bg-background py-16 sm:py-20" data-cleaning-reveal>
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-4 sm:px-6 md:flex-row md:items-center lg:px-8"><div><p className="text-sm font-bold uppercase text-accent">Built for small cleaning businesses</p><h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">You shouldn't need to understand web development to look professional online.</h2><p className="mt-3 max-w-3xl text-muted-foreground">WebWarHeads gives cleaning business owners a simpler way to build, preview and launch their own website.</p></div><BuildButton /></div>
      </section>
    </PublicLayout>
  );
}