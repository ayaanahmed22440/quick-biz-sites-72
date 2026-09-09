import { useState, type CSSProperties, type FormEvent } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  Menu,
  Phone,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SiteContent } from "@/lib/site-content";
import { presetFor } from "@/lib/template-registry";
import { TEMPLATE_TYPOGRAPHY } from "@/lib/template-design-system";

export type TemplateBusiness = {
  name: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  address_line1: string | null;
  postal_code: string | null;
  logo_url: string | null;
};

export type TemplateService = {
  id: string;
  name: string;
  description: string | null;
  price_note: string | null;
};

export type TemplateArea = { id: string; city: string; state: string | null };

export type TemplateReview = {
  id: string;
  author_name: string;
  location: string | null;
  rating: number | null;
  quote: string;
  source: string | null;
};

export type TemplateHour = {
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};

export type LeadSubmit = (values: {
  name: string;
  email: string;
  phone: string;
  service: string;
  preferred_time: string;
  message: string;
}) => Promise<void>;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const display = { fontFamily: TEMPLATE_TYPOGRAPHY.displayFamily } as const;

function formatTime(value: string | null) {
  if (!value) return "";
  const [hourValue, minute = "00"] = value.slice(0, 5).split(":");
  const hour = Number(hourValue);
  if (!Number.isFinite(hour)) return value.slice(0, 5);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function BrandMark({ business, logo }: { business: TemplateBusiness; logo: string | null }) {
  return (
    <a href="#top" className="flex min-w-0 items-center gap-3" aria-label={`${business.name} home`}>
      {logo ? (
        <img src={logo} alt={`${business.name} logo`} className="h-11 w-auto max-w-40 object-contain" />
      ) : (
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: "var(--site-accent)" }}
        >
          {initials(business.name)}
        </span>
      )}
      <span className="truncate text-base font-bold text-slate-950 sm:text-lg">{business.name}</span>
    </a>
  );
}

function SectionTitle({
  eyebrow,
  title,
  intro,
  inverse = false,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  inverse?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="h-px w-10" style={{ backgroundColor: "var(--site-accent)" }} />
        <p
          className={`text-xs font-bold uppercase tracking-[0.16em] ${inverse ? "text-white/70" : "text-slate-500"}`}
        >
          {eyebrow}
        </p>
      </div>
      <h2
        style={display}
        className={`mt-5 text-4xl font-bold leading-tight sm:text-5xl ${inverse ? "text-white" : "text-slate-950"}`}
      >
        {title}
      </h2>
      {intro ? (
        <p className={`mt-5 max-w-2xl text-lg leading-8 ${inverse ? "text-white/70" : "text-slate-600"}`}>
          {intro}
        </p>
      ) : null}
    </div>
  );
}

export function LocalBusinessTemplate({
  business,
  content,
  services,
  areas,
  hours,
  reviews = [],
  onSubmitLead,
  previewOnly = false,
}: {
  business: TemplateBusiness;
  content: SiteContent;
  services: TemplateService[];
  areas: TemplateArea[];
  hours: TemplateHour[];
  reviews?: TemplateReview[];
  onSubmitLead?: LeadSubmit;
  previewOnly?: boolean;
}) {
  const preset = presetFor(content.templateId);
  const layout = preset.layout;
  const logo = content.brand.logoUrl ?? business.logo_url;
  const heroImage = content.images.hero || preset.images.hero;
  const aboutImage = content.images.about || preset.images.about;
  const gallery = content.images.gallery.filter(Boolean).slice(0, 4);
  const projectImages = gallery.length ? gallery : preset.images.gallery;
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const siteStyle = {
    "--site-accent": content.brand.primaryColor || preset.accent,
  } as CSSProperties;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (previewOnly || !onSubmitLead) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    setError(null);
    setSending(true);
    try {
      await onSubmitLead({
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        service: String(fd.get("service") ?? ""),
        preferred_time: String(fd.get("preferred_time") ?? ""),
        message: String(fd.get("message") ?? ""),
      });
      setSent(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please call us instead.");
    } finally {
      setSending(false);
    }
  }

  const addressParts = [business.address_line1, business.city, business.state, business.postal_code]
    .filter(Boolean)
    .join(", ");
  const place = business.city || areas[0]?.city || "the local area";
  const featuredReview = reviews[0];

  const heroCopy = (
    <div className="relative z-10 max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="h-px w-12" style={{ backgroundColor: "var(--site-accent)" }} />
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-current opacity-70">
          Trusted local professionals
        </span>
      </div>
       <h1 style={display} className="mt-6 text-5xl font-extrabold leading-[1.08] sm:text-6xl lg:text-7xl">
        {content.hero.headline}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 opacity-75 sm:text-xl">{content.hero.subheadline}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href="#quote"
          className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: "var(--site-accent)" }}
        >
          {content.hero.primaryCta}
          <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href="#services"
          className="inline-flex min-h-13 items-center justify-center rounded-xl border border-current/20 px-7 py-3.5 text-sm font-bold transition-colors hover:bg-current/5"
        >
          Explore our services
        </a>
      </div>
    </div>
  );

  return (
    <div
      id="top"
      style={{ ...siteStyle, fontFamily: TEMPLATE_TYPOGRAPHY.bodyFamily }}
      className="min-h-full bg-slate-50 text-slate-950"
    >
      <div className="bg-slate-950 px-4 py-2.5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-xs font-medium sm:px-2">
          <p className="truncate">Proudly serving {place} and surrounding communities</p>
          {business.phone ? (
            <a href={`tel:${business.phone}`} className="shrink-0 font-bold">
              Call {business.phone}
            </a>
          ) : null}
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark business={business} logo={logo} />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex" aria-label="Main navigation">
            <a href="#services" className="transition-colors hover:text-slate-950">Services</a>
            <a href="#about" className="transition-colors hover:text-slate-950">About</a>
            <a href="#projects" className="transition-colors hover:text-slate-950">Our work</a>
            <a href="#reviews" className="transition-colors hover:text-slate-950">Reviews</a>
            <a href="#contact" className="transition-colors hover:text-slate-950">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            {business.phone ? (
              <a href={`tel:${business.phone}`} className="hidden items-center gap-2 text-sm font-bold text-slate-950 sm:flex">
                <Phone className="h-4 w-4" />
                {business.phone}
              </a>
            ) : null}
            <a
              href="#quote"
              className="hidden rounded-lg px-5 py-3 text-sm font-bold text-white shadow-sm sm:inline-flex"
              style={{ backgroundColor: "var(--site-accent)" }}
            >
              Get a quote
            </a>
            <Menu className="h-6 w-6 lg:hidden" aria-hidden />
          </div>
        </div>
      </header>

      {layout === "overlay" ? (
        <section className="relative isolate min-h-[680px] overflow-hidden bg-slate-950 text-white">
          <img src={heroImage} alt={`${preset.industryLabel} by ${business.name}`} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/10" />
          <div className="mx-auto flex min-h-[680px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">{heroCopy}</div>
        </section>
      ) : layout === "banner" ? (
        <section className="overflow-hidden bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl lg:grid-cols-[1.05fr_.95fr]">
            <div className="flex items-center px-4 py-20 sm:px-6 lg:px-8 lg:py-28">{heroCopy}</div>
            <div className="relative min-h-[440px] lg:min-h-[680px]">
              <img src={heroImage} alt={`${preset.industryLabel} by ${business.name}`} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-y-0 left-0 hidden w-32 bg-gradient-to-r from-slate-950 to-transparent lg:block" />
            </div>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden bg-white">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-24">
            <div className="lg:col-span-7">{heroCopy}</div>
            <div className="relative lg:col-span-5">
              <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-slate-200 shadow-2xl shadow-slate-300/60">
                <img src={heroImage} alt={`${preset.industryLabel} by ${business.name}`} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
              <div className="absolute -bottom-6 -left-6 max-w-52 rounded-2xl bg-white p-5 shadow-xl sm:-left-10">
                <div className="flex items-center gap-2" style={{ color: "var(--site-accent)" }}>
                  <ShieldCheck className="h-6 w-6" />
                  <span className="font-bold">Local & trusted</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">Quality work, clear communication, no surprise charges.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-slate-200 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          {content.hero.trustPoints.filter(Boolean).slice(0, 3).map((point, index) => (
            <div key={point} className="flex items-center gap-4 py-6 sm:px-7 first:sm:pl-0 last:sm:pr-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100" style={{ color: "var(--site-accent)" }}>
                {index === 0 ? <BadgeCheck className="h-5 w-5" /> : index === 1 ? <ShieldCheck className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </span>
              <span className="text-sm font-bold text-slate-800">{point}</span>
            </div>
          ))}
        </div>
      </section>

      {services.length > 0 ? (
        <section id="services" className="scroll-mt-24 bg-slate-50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <SectionTitle eyebrow="What we do" title={content.services.heading} intro={content.services.intro} />
              <a href="#quote" className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: "var(--site-accent)" }}>
                Discuss your project <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {services.map((service, index) => (
                <article key={service.id} className="group flex min-h-72 flex-col rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Service {String(index + 1).padStart(2, "0")}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:text-white" style={{ color: "var(--site-accent)" }}>
                      <Check className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-9 text-xl font-bold text-slate-950">{service.name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{service.description || `Professional ${service.name.toLowerCase()} completed with care, precision and a tidy finish.`}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                    <span className="text-sm font-bold" style={{ color: "var(--site-accent)" }}>{service.price_note || "Free estimate"}</span>
                    <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="about" className="scroll-mt-24 overflow-hidden bg-white py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="relative order-2 lg:order-1">
            <img src={aboutImage} alt={`${business.name} at work`} loading="lazy" className="aspect-[5/4] w-full rounded-3xl object-cover" />
            <div className="absolute -bottom-8 right-4 rounded-2xl bg-slate-950 p-6 text-white shadow-xl sm:right-10">
              <p style={display} className="text-3xl font-bold">Built on trust.</p>
              <p className="mt-1 text-sm text-white/60">Recommended across {place}</p>
            </div>
          </div>
          <div className="order-1 lg:order-2 lg:pl-10">
            <SectionTitle eyebrow="Our story" title={content.about.heading} />
            <p className="mt-7 whitespace-pre-line text-lg leading-8 text-slate-600">{content.about.body}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="border-l-2 pl-4" style={{ borderColor: "var(--site-accent)" }}>
                <p className="font-bold text-slate-950">Straight answers</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Clear scopes, practical advice and honest pricing from the start.</p>
              </div>
              <div className="border-l-2 pl-4" style={{ borderColor: "var(--site-accent)" }}>
                <p className="font-bold text-slate-950">Respectful service</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Reliable arrival times and care for your property on every visit.</p>
              </div>
            </div>
            <a href="#quote" className="mt-9 inline-flex items-center gap-2 font-bold" style={{ color: "var(--site-accent)" }}>
              Work with our team <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle eyebrow="How it works" title="A simpler way to get the job done right." intro="From the first conversation to the final walk-through, we keep the process clear and straightforward." inverse />
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
            {[
              ["01", "Tell us what you need", "Share a few details about your property, priorities and preferred timing."],
              ["02", "Get a clear plan", "We'll confirm the scope, answer your questions and provide straightforward pricing."],
              ["03", "Enjoy the result", "Our team arrives prepared, completes the work carefully and leaves everything tidy."],
            ].map(([number, title, copy]) => (
              <article key={number} className="bg-slate-950 p-8 sm:p-10">
                <span style={display} className="text-5xl font-bold text-white/15">{number}</span>
                <h3 className="mt-10 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {projectImages.length > 0 ? (
        <section id="projects" className="scroll-mt-24 bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="Selected work" title={content.gallery.heading} intro={content.gallery.intro} />
            <div className="mt-12 grid auto-rows-[230px] gap-4 md:grid-cols-12 md:auto-rows-[270px]">
              {projectImages.map((src, index) => (
                <figure key={`${src}-${index}`} className={`group relative overflow-hidden rounded-2xl ${index === 0 ? "md:col-span-7 md:row-span-2" : index === 1 ? "md:col-span-5" : "md:col-span-5"}`}>
                  <img src={src} alt={`${business.name} completed project ${index + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-6 pt-16 text-sm font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Project by {business.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="reviews" className="scroll-mt-24 bg-slate-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <SectionTitle eyebrow="Customer stories" title={content.reviews.heading} intro={content.reviews.intro} />
              <div className="mt-8 flex items-center gap-3">
                <div className="flex" style={{ color: "var(--site-accent)" }}>
                  {[0, 1, 2, 3, 4].map((star) => <Star key={star} className="h-5 w-5 fill-current" />)}
                </div>
                <span className="text-sm font-bold text-slate-700">Trusted by local customers</span>
              </div>
              {content.reviews.googleUrl ? (
                <a href={content.reviews.googleUrl} target="_blank" rel="noreferrer noopener" className="mt-7 inline-flex items-center gap-2 text-sm font-bold" style={{ color: "var(--site-accent)" }}>
                  View all Google reviews <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}
            </div>
            {featuredReview ? (
              <figure className="rounded-3xl bg-white p-8 shadow-sm sm:p-12">
                <Quote className="h-10 w-10" style={{ color: "var(--site-accent)" }} />
                <blockquote style={display} className="mt-7 text-2xl font-bold leading-relaxed text-slate-950 sm:text-3xl">“{featuredReview.quote}”</blockquote>
                <figcaption className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{initials(featuredReview.author_name)}</span>
                  <div>
                    <p className="font-bold text-slate-950">{featuredReview.author_name}</p>
                    <p className="text-sm text-slate-500">{featuredReview.location || "Verified customer"}</p>
                  </div>
                </figcaption>
              </figure>
            ) : (
              <div className="rounded-3xl bg-white p-8 shadow-sm sm:p-12">
                <Quote className="h-10 w-10" style={{ color: "var(--site-accent)" }} />
                <p style={display} className="mt-7 text-2xl font-bold leading-relaxed text-slate-950 sm:text-3xl">Proud work. Clear communication. A result you'll be happy to recommend.</p>
                <p className="mt-7 text-sm leading-6 text-slate-500">Customer reviews can be added here from the WebWarheads editor or linked from Google.</p>
              </div>
            )}
          </div>
          {reviews.length > 1 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {reviews.slice(1, 3).map((review) => (
                <figure key={review.id} className="rounded-2xl border border-slate-200 bg-white p-7">
                  <div className="flex" style={{ color: "var(--site-accent)" }}>{Array.from({ length: Math.max(1, Math.min(5, review.rating || 5)) }).map((_, star) => <Star key={star} className="h-4 w-4 fill-current" />)}</div>
                  <blockquote className="mt-4 leading-7 text-slate-700">“{review.quote}”</blockquote>
                  <figcaption className="mt-5 text-sm font-bold text-slate-950">{review.author_name}{review.location ? <span className="font-normal text-slate-500"> · {review.location}</span> : null}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <SectionTitle eyebrow="Where we work" title={content.areas.heading} intro={content.areas.intro} />
          <div className="rounded-3xl bg-slate-50 p-7 sm:p-10">
            <div className="flex items-center gap-3 text-slate-950">
              <MapPin className="h-6 w-6" style={{ color: "var(--site-accent)" }} />
              <p className="font-bold">Local service, close to home</p>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {(areas.length ? areas : [{ id: "local", city: place, state: business.state }]).map((area) => (
                <div key={area.id} className="flex items-center gap-3 border-b border-slate-200 py-3 text-sm font-semibold text-slate-700">
                  <Check className="h-4 w-4" style={{ color: "var(--site-accent)" }} />
                  {area.city}{area.state ? `, ${area.state}` : ""}
                </div>
              ))}
            </div>
            <p className="mt-7 text-sm leading-6 text-slate-500">Not sure whether we cover your address? Get in touch—if you're nearby, we'll do our best to help.</p>
          </div>
        </div>
      </section>

      <section id="quote" className="scroll-mt-24 bg-slate-950 py-20 text-white sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:px-8">
          <div>
            <SectionTitle eyebrow="Start a conversation" title={content.quote.heading} intro={content.quote.intro} inverse />
            <div className="mt-10 space-y-5">
              {business.phone ? <a href={`tel:${business.phone}`} className="flex items-center gap-4 text-sm font-semibold"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><Phone className="h-5 w-5" /></span>{business.phone}</a> : null}
              {business.email ? <a href={`mailto:${business.email}`} className="flex items-center gap-4 text-sm font-semibold"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><Mail className="h-5 w-5" /></span>{business.email}</a> : null}
              <div className="flex items-center gap-4 text-sm font-semibold"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><Clock3 className="h-5 w-5" /></span>{content.quote.responseNote}</div>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl sm:p-9">
            {sent ? (
              <div className="flex min-h-80 flex-col items-center justify-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100" style={{ color: "var(--site-accent)" }}><Check className="h-8 w-8" /></span>
                <h3 style={display} className="mt-6 text-3xl font-bold">Request received.</h3>
                <p className="mt-3 max-w-sm text-slate-600">Thanks for getting in touch. {content.quote.responseNote}</p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name" name="name" required />
                  <Field label="Phone number" name="phone" type="tel" required />
                </div>
                <Field label="Email address" name="email" type="email" />
                <label className="block text-sm font-semibold text-slate-700">
                  {content.quote.serviceQuestion}
                  <select name="service" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition-shadow focus:ring-2" style={{ "--tw-ring-color": "var(--site-accent)" } as CSSProperties}>
                    <option value="">Choose a service</option>
                    {services.map((service) => <option key={service.id} value={service.name}>{service.name}</option>)}
                    <option value="Something else">Something else</option>
                  </select>
                </label>
                <Field label="When suits you?" name="preferred_time" placeholder="e.g. weekday mornings" />
                <label className="block text-sm font-semibold text-slate-700">
                  Tell us a little more
                  <textarea name="message" rows={4} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-shadow focus:ring-2" style={{ "--tw-ring-color": "var(--site-accent)" } as CSSProperties} />
                </label>
                {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
                <Button type="submit" disabled={sending || previewOnly} className="min-h-13 w-full rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "var(--site-accent)" }}>
                  {sending ? "Sending…" : content.hero.primaryCta}
                  {!sending ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
                {previewOnly ? <p className="text-center text-xs text-slate-400">Form disabled in preview</p> : null}
              </form>
            )}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 border-b border-slate-200 bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          <div>
            <h2 style={display} className="text-3xl font-bold text-slate-950">{content.contact.heading}</h2>
            <p className="mt-3 text-slate-600">{content.contact.note}</p>
            <div className="mt-7 space-y-3 text-sm text-slate-700">
              {business.phone ? <p className="flex items-center gap-3"><Phone className="h-4 w-4" style={{ color: "var(--site-accent)" }} /><a href={`tel:${business.phone}`}>{business.phone}</a></p> : null}
              {business.email ? <p className="flex items-center gap-3"><Mail className="h-4 w-4" style={{ color: "var(--site-accent)" }} /><a href={`mailto:${business.email}`}>{business.email}</a></p> : null}
              {addressParts ? <p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4" style={{ color: "var(--site-accent)" }} /><span>{addressParts}</span></p> : null}
            </div>
          </div>
          {hours.length > 0 ? (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Opening hours</h3>
              <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
                {hours.map((hour) => (
                  <li key={hour.day_of_week} className="flex justify-between gap-3 border-b border-slate-100 py-2.5 text-sm">
                    <span className="font-semibold text-slate-700">{DAYS[hour.day_of_week] ?? ""}</span>
                    <span className="text-slate-500">{hour.is_closed ? "Closed" : `${formatTime(hour.opens_at)} – ${formatTime(hour.closes_at)}`}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <footer className="bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <BrandMark business={business} logo={logo} />
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-slate-500">
              <a href="#services">Services</a><a href="#about">About</a><a href="#projects">Our work</a><a href="#quote">Free quote</a>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} {business.name}. All rights reserved.</p>
            <p>Website by WebWarheads</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}{required ? " *" : ""}
      <input name={name} type={type} required={required} placeholder={placeholder} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition-shadow focus:ring-2" style={{ "--tw-ring-color": "var(--site-accent)" } as CSSProperties} />
    </label>
  );
}