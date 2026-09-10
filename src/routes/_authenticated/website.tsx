import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { notifySitePublished } from "@/lib/notify.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useIsMobile } from "@/hooks/use-mobile";

import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlanChooser } from "@/components/billing/PlanChooser";
import {
  LocalBusinessTemplate,
  type TemplateArea,
  type TemplateHour,
  type TemplateService,
} from "@/components/templates/LocalBusinessTemplate";
import {
  defaultSiteContent,
  normaliseContent,
  templateIdForNiche,
  type SiteContent,
} from "@/lib/site-content";
import { presetFor } from "@/lib/template-registry";
import { ImageUpload } from "@/components/app/ImageUpload";
import { PreviewFrame } from "@/components/app/PreviewFrame";
import { ReviewsEditor, useBusinessReviews } from "@/components/website/ReviewsEditor";

const PREVIEW_WIDTHS = { desktop: 1280, tablet: 820, mobile: 390 } as const;
/** Taller simulated screens for the wider devices, so the scaled frame fills the column. */
const PREVIEW_HEIGHTS = { desktop: 2000, tablet: 1500, mobile: 780 } as const;
type DeviceKey = keyof typeof PREVIEW_WIDTHS;


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
    niche: string;
  };
};

function WebsitePage() {
  const { data: workspace, isLoading } = useWorkspace();
  const businessId = workspace?.business?.id;
  const queryClient = useQueryClient();
  const notifyPublished = useServerFn(notifySitePublished);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const isMobile = useIsMobile();

  // On a phone, a scaled-down desktop preview is unreadable — start on phone size.
  useEffect(() => {
    if (isMobile) setDevice("mobile");
  }, [isMobile]);


  const site = useQuery({
    queryKey: ["website-editor", businessId],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<Loaded> => {
      const id = businessId!;

      const { data: business, error: bErr } = await supabase
        .from("businesses")
        .select(
          "name, tagline, phone, email, city, state, address_line1, postal_code, logo_url, primary_color, primary_service, slug, niche",
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
          .eq("slug", templateIdForNiche(business.niche))
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
        niche: business.niche,
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

  const reviews = useBusinessReviews(businessId);

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
        // Congratulations email — never block going live on it.
        try {
          await notifyPublished({ data: { businessId } });
        } catch (mailError) {
          console.error("Publish email failed", mailError);
        }
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
      if (variables.publish) toast.success("Your website is live");
      void queryClient.invalidateQueries({ queryKey: ["website-editor", businessId] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  // Autosave the draft a moment after typing stops, so nothing is ever lost.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      if (!saveRef.current.isPending) saveRef.current.mutate({ publish: false });
    }, 1500);
    return () => clearTimeout(timer);
  }, [draft, dirty]);

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
        description={`${presetFor(draft.templateId).name} — an approved WebWarheads design filled with your own details. Nothing is generated at random.`}
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

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <div className="order-2 min-w-0 space-y-6 lg:order-1">

          <Section title="Your brand">
            <ImageUpload
              businessId={businessId!}
              label="Your logo"
              hint="A PNG with a see-through background looks best. It shows at the top of every page."
              aspect="square"
              kind="logo"
              value={draft.brand.logoUrl}
              onChange={(url) => update((c) => ({ ...c, brand: { ...c.brand, logoUrl: url } }))}
            />
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
          </Section>

          <Section title="Photos">
            <p className="text-xs text-muted-foreground">
              Your design already comes with professional photos for your trade. Upload your own
              whenever you like — your work always sells better than a stock photo.
            </p>
            <ImageUpload
              businessId={businessId!}
              label="Main photo"
              hint="The big picture at the top of your website."
              value={draft.images.hero}
              kind="hero"
              onChange={(url) =>
                update((c) => ({
                  ...c,
                  images: { ...c.images, hero: url ?? presetFor(c.templateId).images.hero },
                }))
              }
            />
            <ImageUpload
              businessId={businessId!}
              label="About photo"
              hint="Shown beside your story. A photo of you or the team works well."
              value={draft.images.about}
              kind="about"
              onChange={(url) =>
                update((c) => ({
                  ...c,
                  images: { ...c.images, about: url ?? presetFor(c.templateId).images.about },
                }))
              }
            />
            {draft.images.gallery.map((src, index) => (
              <ImageUpload
                key={index}
                businessId={businessId!}
                label={`Gallery photo ${index + 1}`}
                value={src}
                kind={`gallery-${index + 1}`}
                onChange={(url) =>
                  update((c) => {
                    const gallery = [...c.images.gallery];
                    gallery[index] =
                      url ?? presetFor(c.templateId).images.gallery[index] ?? gallery[index]!;
                    return { ...c, images: { ...c.images, gallery } };
                  })
                }
              />
            ))}
            <Field
              label="Gallery heading"
              value={draft.gallery.heading}
              onChange={(v) => update((c) => ({ ...c, gallery: { ...c.gallery, heading: v } }))}
            />
            <AreaField
              label="Gallery intro"
              value={draft.gallery.intro}
              onChange={(v) => update((c) => ({ ...c, gallery: { ...c.gallery, intro: v } }))}
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

          <Section title="Reviews">
            <Field
              label="Reviews heading"
              value={draft.reviews.heading}
              onChange={(v) => update((c) => ({ ...c, reviews: { ...c.reviews, heading: v } }))}
            />
            <AreaField
              label="Reviews intro"
              value={draft.reviews.intro}
              onChange={(v) => update((c) => ({ ...c, reviews: { ...c.reviews, intro: v } }))}
            />
            <ReviewsEditor
              businessId={businessId!}
              googleUrl={draft.reviews.googleUrl}
              onGoogleUrlChange={(v) =>
                update((c) => ({ ...c, reviews: { ...c.reviews, googleUrl: v } }))
              }
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

          <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/95 p-3 backdrop-blur">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              disabled={save.isPending}
              onClick={() => save.mutate({ publish: false })}
            >
              Save draft
            </Button>
            {canPublish ? (
              <Button
                className="flex-1 sm:flex-none"
                disabled={save.isPending}
                onClick={() => save.mutate({ publish: true })}
              >
                Save &amp; publish
              </Button>
            ) : (
              <Button
                className="flex-1 sm:flex-none"
                disabled={save.isPending}
                onClick={() => void openPlans()}
              >
                Publish my site
              </Button>
            )}
            {dirty ? (
              <span className="w-full text-xs text-muted-foreground sm:w-auto sm:self-center">
                Unsaved changes
              </span>
            ) : null}
          </div>

        </div>

        <div className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-6">
          <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <p className="truncate text-sm font-medium">Preview</p>
            <div className="flex shrink-0 gap-1.5">
              {(Object.keys(PREVIEW_WIDTHS) as DeviceKey[]).map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={device === key ? "default" : "outline"}
                  onClick={() => setDevice(key)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-muted/40 p-2 sm:p-3">
            <PreviewFrame
              width={PREVIEW_WIDTHS[device]}
              height={PREVIEW_HEIGHTS[device]}
              className="min-w-0"
            >

              <LocalBusinessTemplate
                business={site.data.business}
                content={draft}
                services={site.data.services}
                areas={site.data.areas}
                hours={site.data.hours}
                reviews={reviews.data ?? []}
                previewOnly
              />
            </PreviewFrame>
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
