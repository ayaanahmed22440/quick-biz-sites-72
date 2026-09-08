import { useState, type FormEvent } from "react";
import type { SiteContent } from "@/lib/site-content";

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
  price_from: number | null;
};

export type TemplateArea = { id: string; name: string };

export type TemplateHour = {
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  closed: boolean;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const heading = { fontFamily: "'Archivo Black', system-ui, sans-serif" } as const;
const body = { fontFamily: "'Hind', system-ui, sans-serif" } as const;

function formatTime(value: string | null) {
  if (!value) return "";
  return value.slice(0, 5);
}

export type LeadSubmit = (values: {
  name: string;
  email: string;
  phone: string;
  service: string;
  preferred_time: string;
  message: string;
}) => Promise<void>;

export function CleaningTemplate01({
  business,
  content,
  services,
  areas,
  hours,
  onSubmitLead,
  previewOnly = false,
}: {
  business: TemplateBusiness;
  content: SiteContent;
  services: TemplateService[];
  areas: TemplateArea[];
  hours: TemplateHour[];
  onSubmitLead?: LeadSubmit;
  previewOnly?: boolean;
}) {
  const brand = content.brand.primaryColor;
  const logo = content.brand.logoUrl ?? business.logo_url;
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div style={{ ...body, color: "#16181d", background: "#ffffff" }} className="min-h-full">
      {/* Header */}
      <header className="border-b border-black/10">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {logo ? (
              <img src={logo} alt={`${business.name} logo`} className="h-10 w-auto shrink-0 object-contain" />
            ) : null}
            <span style={heading} className="truncate text-lg sm:text-xl">
              {business.name}
            </span>
          </div>
          {business.phone ? (
            <a
              href={`tel:${business.phone}`}
              className="shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-white sm:px-4"
              style={{ background: brand }}
            >
              {business.phone}
            </a>
          ) : null}
        </div>
      </header>

      {/* Split hero + quote form */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-start lg:gap-12 lg:py-16">
        <div>
          <h1 style={heading} className="text-3xl leading-tight sm:text-4xl lg:text-5xl">
            {content.hero.headline}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-black/70 sm:text-lg">
            {content.hero.subheadline}
          </p>
          <ul className="mt-6 space-y-2">
            {content.hero.trustPoints.filter(Boolean).map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm sm:text-base">
                <span
                  aria-hidden
                  className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: brand }}
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          {areas.length > 0 ? (
            <p className="mt-6 text-sm text-black/60">
              Covering {areas.map((a) => a.name).join(", ")}
            </p>
          ) : null}
        </div>

        <div id="quote" className="rounded-xl border border-black/10 bg-[#f7f8fa] p-5 sm:p-6">
          <h2 style={heading} className="text-xl sm:text-2xl">
            {content.quote.heading}
          </h2>
          <p className="mt-2 text-sm text-black/70">{content.quote.intro}</p>
          {sent ? (
            <p className="mt-6 rounded-md bg-white p-4 text-sm">
              Thanks — your request has been sent. {content.quote.responseNote}
            </p>
          ) : (
            <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
              <Field label="Your name" name="name" required />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Email" name="email" type="email" />
                <Field label="Phone" name="phone" type="tel" />
              </div>
              <label className="block text-sm font-medium">
                What do you need cleaned?
                <select
                  name="service"
                  className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Choose a service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                  <option value="Something else">Something else</option>
                </select>
              </label>
              <Field label="When suits you?" name="preferred_time" placeholder="e.g. weekday mornings" />
              <label className="block text-sm font-medium">
                Anything else we should know?
                <textarea
                  name="message"
                  rows={3}
                  className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm"
                />
              </label>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={sending || previewOnly}
                className="w-full rounded-md px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
                style={{ background: brand }}
              >
                {sending ? "Sending…" : content.hero.primaryCta}
              </button>
              <p className="text-xs text-black/55">{content.quote.responseNote}</p>
            </form>
          )}
        </div>
      </section>

      {/* Services */}
      {services.length > 0 ? (
        <section className="border-t border-black/10 bg-[#f7f8fa]">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
            <h2 style={heading} className="text-2xl sm:text-3xl">
              {content.services.heading}
            </h2>
            <p className="mt-2 max-w-2xl text-black/70">{content.services.intro}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div key={service.id} className="rounded-xl border border-black/10 bg-white p-5">
                  <h3 style={heading} className="text-lg">
                    {service.name}
                  </h3>
                  {service.description ? (
                    <p className="mt-2 text-sm text-black/70">{service.description}</p>
                  ) : null}
                  {service.price_from != null ? (
                    <p className="mt-3 text-sm font-semibold" style={{ color: brand }}>
                      From {service.price_from}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* About */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div>
            <h2 style={heading} className="text-2xl sm:text-3xl">
              {content.about.heading}
            </h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-black/75">{content.about.body}</p>
          </div>
          <div className="rounded-xl border border-black/10 p-5">
            <h3 style={heading} className="text-lg">
              {content.areas.heading}
            </h3>
            <p className="mt-2 text-sm text-black/70">{content.areas.intro}</p>
            {areas.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {areas.map((a) => (
                  <li key={a.id} className="rounded-full bg-black/5 px-3 py-1 text-sm">
                    {a.name}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      {/* Contact + hours */}
      <section className="border-t border-black/10" style={{ background: brand }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-white sm:px-6 lg:grid-cols-2 lg:py-16">
          <div>
            <h2 style={heading} className="text-2xl sm:text-3xl">
              {content.contact.heading}
            </h2>
            <p className="mt-2 text-white/85">{content.contact.note}</p>
            <div className="mt-6 space-y-2 text-sm">
              {business.phone ? (
                <p>
                  Phone:{" "}
                  <a className="underline" href={`tel:${business.phone}`}>
                    {business.phone}
                  </a>
                </p>
              ) : null}
              {business.email ? (
                <p>
                  Email:{" "}
                  <a className="underline" href={`mailto:${business.email}`}>
                    {business.email}
                  </a>
                </p>
              ) : null}
              {addressParts ? <p>{addressParts}</p> : null}
            </div>
          </div>
          {hours.length > 0 ? (
            <div>
              <h3 style={heading} className="text-lg">
                Opening hours
              </h3>
              <ul className="mt-3 space-y-1 text-sm">
                {hours.map((h) => (
                  <li key={h.day_of_week} className="flex justify-between gap-4 border-b border-white/20 py-1">
                    <span>{DAYS[h.day_of_week] ?? ""}</span>
                    <span>
                      {h.closed ? "Closed" : `${formatTime(h.opens_at)} – ${formatTime(h.closes_at)}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <footer className="border-t border-black/10 py-6 text-center text-xs text-black/55">
        © {new Date().getFullYear()} {business.name}. Website by WebWarheads.
      </footer>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {required ? " *" : ""}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm"
      />
    </label>
  );
}
