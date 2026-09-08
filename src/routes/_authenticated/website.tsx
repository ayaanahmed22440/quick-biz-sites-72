import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CleaningTemplate01,
  type TemplateArea,
  type TemplateHour,
  type TemplateService,
} from "@/components/templates/CleaningTemplate01";
import {
  defaultSiteContent,
  normaliseContent,
  type SiteContent,
} from "@/lib/site-content";

export const Route = createFileRoute("/_authenticated/website")({
  head: () => ({
    meta: [
      { title: "Your website — WebWarheads" },
      { name: "description", content: "Edit and publish your WebWarheads website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WebsitePage,
});

type Loaded = {
  websiteId: string;
  status: string;
  publishedAt: string | null;
  content: SiteContent;
  hasPublished: boolean;
  services: TemplateService[];
  areas: TemplateArea[];
  hours: TemplateHour[];
  business: {
    name: string;
    tagline: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    address_line1: string | null;
    postal_code: string | null;
    logo_url: string | null;
    primary_color: string;
    primary_service: string | null;
    slug: string;
  };
};

function WebsitePage() {
  const { data: workspace, isLoading } = useWorkspace();
  const businessId = workspace?.business?.id;
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  const site = useQuery({
    queryKey: ["website-editor", businessId],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<Loaded> => {
      const id = businessId!;

      const { data: business, error: bErr } = await supabase
        .from("businesses")
        .select(
          "name, tagline, phone, email, city, state, address_line1, postal_code, logo_url, primary_color, primary_service, slug",
        )
        .eq("id", id)
        .single();
      if (bErr) throw bErr;

      let { data: website, error: wErr } = await supabase
        .from("websites")
        .select("id, status, published_at")
        .eq("business_id", id)
        .maybeSingle();
      if (wErr) throw wErr;

      if (!website) {
        const { data: template } = await supabase
          .from("templates")
          .select("id")
          .eq("slug", "cleaning-01")
          .maybeSingle();
        const { data: created, error: cErr } = await supabase
          .from("websites")
          .insert({ business_id: id, template_id: template?.id ?? null, subdomain: business.slug })
          .select("id, status, published_at")
          .single();
        if (cErr) throw cErr;
        website = created;
      }

      const [{ data: custom }, { data: services }, { data: areas }, { data: hours }] =
        await Promise.all([
          supabase
            .from("website_customizations")
            .select("draft_content, published_content")
            .eq("website_id", website.id)
            .maybeSingle(),
          supabase
            .from("services")
            .select("id, name, description, price_note")
            .eq("business_id", id)
            .order("sort_order"),
          supabase.from("service_areas").select("id, city, state").eq("business_id", id).order("city"),
          supabase
            .from("business_hours")
            .select("day_of_week, opens_at, closes_at, is_closed")
            .eq("business_id", id)
            .order("day_of_week"),
        ]);

      const fallback = defaultSiteContent({
        businessName: business.name,
        city: business.city,
        primaryService: business.primary_service,
        primaryColor: business.primary_color,
        logoUrl: business.logo_url,
      });

      return {
        websiteId: website.id,
        status: website.status,
        publishedAt: website.published_at,
        hasPublished: Boolean(custom?.published_content),
        content: normaliseContent(custom?.draft_content, fallback),
        services: (services ?? []) as unknown as TemplateService[],
        areas: (areas ?? []) as unknown as TemplateArea[],
        hours: (hours ?? []) as unknown as TemplateHour[],
        business,
      };
    },
  });

  useEffect(() => {
    if (site.data && !draft) setDraft(site.data.content);
  }, [site.data, draft]);

  const save = useMutation({
    mutationFn: async ({ publish }: { publish: boolean }) => {
      if (!site.data || !draft || !businessId) return;
      const serialised = JSON.parse(JSON.stringify(draft)) as never;
      const payload = {
        website_id: site.data.websiteId,
        business_id: businessId,
        draft_content: serialised,
        ...(publish ? { published_content: serialised } : {}),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("website_customizations")
        .upsert(payload, { onConflict: "website_id" });
      if (error) throw error;

      if (publish) {
        const { error: wErr } = await supabase
          .from("websites")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", site.data.websiteId);
        if (wErr) throw wErr;
      }

      if (draft.brand.primaryColor !== site.data.business.primary_color ||
        (draft.brand.logoUrl ?? null) !== site.data.business.logo_url) {
        await supabase
          .from("businesses")
          .update({ primary_color: draft.brand.primaryColor, logo_url: draft.brand.logoUrl })
          .eq("id", businessId);
      }
    },
    onSuccess: (_data, variables) => {
      setDirty(false);
      toast.success(variables.publish ? "Your website is live" : "Draft saved");
      void queryClient.invalidateQueries({ queryKey: ["website-editor", businessId] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  if (isLoading || site.isLoading) return <LoadingBlock rows={3} />;

  if (!workspace?.business) {
    return (
      <>
        <PageHeader title="Your website" />
        <EmptyState
          title="Add your business first"
          description="We build your website from your real business details — name, services, phone and areas covered."
          action={
            <Button asChild>
              <Link to="/onboarding">Start onboarding</Link>
            </Button>
          }
        />
      </>
    );
  }

  if (site.isError) return <ErrorBlock />;
  if (!site.data || !draft) return <LoadingBlock rows={3} />;

  // Save the work first, so nothing is lost while the customer is at checkout.
  const openPlans = async () => {
    try {
      if (dirty) await save.mutateAsync({ publish: false });
    } finally {
      setShowPlans(true);
    }
  };

  const update = (patch: (current: SiteContent) => SiteContent) => {
    setDraft((current) => (current ? patch(current) : current));
    setDirty(true);
  };

  const liveUrl = `/${site.data.business.slug}`;
  const canPublish = Boolean(workspace?.entitlements.website);

  return (
    <>
      <PageHeader
        title="Your website"
        description="Cleaning Template 01 — an approved WebWarheads design filled with your own details. Nothing is generated at random."
      />

      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {site.data.status === "published" ? "Published" : "Draft — not live yet"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {site.data.hasPublished ? (
              <a className="underline" href={liveUrl} target="_blank" rel="noreferrer">
                View live site
              </a>
            ) : (
              "Publish to make your site visible to customers."
            )}
          </p>
        </div>
        <Badge variant={site.data.status === "published" ? "default" : "secondary"} className="shrink-0">
          {site.data.status}
        </Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Section title="Your brand">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <input
                type="color"
                aria-label="Main colour"
                value={draft.brand.primaryColor}
                onChange={(e) =>
                  update((c) => ({ ...c, brand: { ...c.brand, primaryColor: e.target.value } }))
                }
                className="h-10 w-14 shrink-0 cursor-pointer rounded border border-input bg-background"
              />
              <Input
                value={draft.brand.primaryColor}
                onChange={(e) =>
                  update((c) => ({ ...c, brand: { ...c.brand, primaryColor: e.target.value } }))
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Pick the main colour from your own logo. Buttons, links and the contact band use it.
            </p>
            <Field
              label="Logo image address"
              value={draft.brand.logoUrl ?? ""}
              placeholder="https://…"
              onChange={(v) => update((c) => ({ ...c, brand: { ...c.brand, logoUrl: v || null } }))}
            />
          </Section>

          <Section title="Top of the page">
            <Field
              label="Headline"
              value={draft.hero.headline}
              onChange={(v) => update((c) => ({ ...c, hero: { ...c.hero, headline: v } }))}
            />
            <AreaField
              label="Short intro"
              value={draft.hero.subheadline}
              onChange={(v) => update((c) => ({ ...c, hero: { ...c.hero, subheadline: v } }))}
            />
            <Field
              label="Button text"
              value={draft.hero.primaryCta}
              onChange={(v) => update((c) => ({ ...c, hero: { ...c.hero, primaryCta: v } }))}
            />
            {draft.hero.trustPoints.map((point, index) => (
              <Field
                key={index}
                label={`Reason to choose you ${index + 1}`}
                value={point}
                onChange={(v) =>
                  update((c) => {
                    const trustPoints = [...c.hero.trustPoints];
                    trustPoints[index] = v;
                    return { ...c, hero: { ...c.hero, trustPoints } };
                  })
                }
              />
            ))}
          </Section>

          <Section title="About you">
            <Field
              label="Heading"
              value={draft.about.heading}
              onChange={(v) => update((c) => ({ ...c, about: { ...c.about, heading: v } }))}
            />
            <AreaField
              label="Your story"
              rows={6}
              value={draft.about.body}
              onChange={(v) => update((c) => ({ ...c, about: { ...c.about, body: v } }))}
            />
          </Section>

          <Section title="Services & areas">
            <Field
              label="Services heading"
              value={draft.services.heading}
              onChange={(v) => update((c) => ({ ...c, services: { ...c.services, heading: v } }))}
            />
            <AreaField
              label="Services intro"
              value={draft.services.intro}
              onChange={(v) => update((c) => ({ ...c, services: { ...c.services, intro: v } }))}
            />
            <Field
              label="Areas heading"
              value={draft.areas.heading}
              onChange={(v) => update((c) => ({ ...c, areas: { ...c.areas, heading: v } }))}
            />
            <AreaField
              label="Areas intro"
              value={draft.areas.intro}
              onChange={(v) => update((c) => ({ ...c, areas: { ...c.areas, intro: v } }))}
            />
            <p className="text-xs text-muted-foreground">
              The service list and area list come from your{" "}
              <Link to="/business" className="underline">
                business details
              </Link>
              .
            </p>
          </Section>

          <Section title="Enquiry form & contact">
            <Field
              label="Form heading"
              value={draft.quote.heading}
              onChange={(v) => update((c) => ({ ...c, quote: { ...c.quote, heading: v } }))}
            />
            <AreaField
              label="Form intro"
              value={draft.quote.intro}
              onChange={(v) => update((c) => ({ ...c, quote: { ...c.quote, intro: v } }))}
            />
            <Field
              label="Reply promise"
              value={draft.quote.responseNote}
              onChange={(v) => update((c) => ({ ...c, quote: { ...c.quote, responseNote: v } }))}
            />
            <Field
              label="Contact heading"
              value={draft.contact.heading}
              onChange={(v) => update((c) => ({ ...c, contact: { ...c.contact, heading: v } }))}
            />
            <AreaField
              label="Contact note"
              value={draft.contact.note}
              onChange={(v) => update((c) => ({ ...c, contact: { ...c.contact, note: v } }))}
            />
          </Section>

          {!canPublish ? (
            <div className="rounded-lg border border-accent/40 bg-accent/10 p-4">
              <p className="text-sm font-semibold">Building is free — you only pay to go live</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep editing and previewing as long as you like. Choose a plan when you're happy
                with how it looks and we'll put it online straight away.
              </p>
              {showPlans ? (
                <div className="mt-4">
                  <PlanChooser currentPlanId={null} returnPath="/website" featureCount={4} />
                </div>
              ) : (
                <Button className="mt-3" onClick={() => void openPlans()}>
                  See plans and publish
                </Button>
              )}
            </div>
          ) : null}

          <div className="sticky bottom-4 flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">
            <Button
              variant="outline"
              disabled={save.isPending}
              onClick={() => save.mutate({ publish: false })}
            >
              Save draft
            </Button>
            {canPublish ? (
              <Button disabled={save.isPending} onClick={() => save.mutate({ publish: true })}>
                Save &amp; publish
              </Button>
            ) : (
              <Button disabled={save.isPending} onClick={() => void openPlans()}>
                Publish my site
              </Button>
            )}
            {dirty ? (
              <span className="self-center text-xs text-muted-foreground">Unsaved changes</span>
            ) : null}
          </div>

        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Preview</p>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="max-h-[70vh] overflow-y-auto bg-white">
              <CleaningTemplate01
                business={site.data.business}
                content={draft}
                services={site.data.services}
                areas={site.data.areas}
                hours={site.data.hours}
                previewOnly
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AreaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
